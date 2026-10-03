import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// The controller itself (registerTrack, update, syncScroll) against a stand-in window: the pure
// functions are covered in scroll.test.js. The module holds state, so each test gets a fresh copy.

const VH = 900

function stage() {
  const win = { scrollY: 0, innerWidth: 1280, innerHeight: VH, location: { hash: '' }, addEventListener() {}, removeEventListener() {}, scrollTo() {} }
  const queue = []
  vi.stubGlobal('window', win)
  vi.stubGlobal('document', {
    documentElement: { scrollHeight: 12000, setAttribute() {}, getAttribute: () => null },
    body: {},
    addEventListener() {},
    removeEventListener() {},
    getElementById: () => null,
    visibilityState: 'visible',
  })
  vi.stubGlobal('requestAnimationFrame', (fn) => {
    queue.push(fn)
    return queue.length
  })
  vi.stubGlobal('cancelAnimationFrame', () => {})
  const runFrame = () => {
    const run = queue.splice(0)
    run.forEach((fn) => fn(0))
    return run.length
  }
  // A track element: a rect that is a pure function of scroll (static in the document) and a style
  // that records writes.
  const element = (top, height) => {
    const props = new Map()
    const writes = []
    return {
      props,
      writes,
      getBoundingClientRect: () => ({ top: top - win.scrollY, height }),
      style: {
        getPropertyValue: (k) => props.get(k) ?? '',
        setProperty: (k, v) => {
          writes.push([k, v])
          props.set(k, v)
        },
      },
    }
  }
  return { win, runFrame, element }
}

let s
let scroll

beforeEach(async () => {
  vi.resetModules()
  s = stage()
  scroll = await import('./scroll.js')
})

afterEach(() => {
  scroll.stop()
  vi.unstubAllGlobals()
})

describe('--p writes (an inherited custom property restyles the whole subtree)', () => {
  it('writes --p only on the line track, and never --p-raw', () => {
    expect(scroll.CSS_VAR_TRACKS).toEqual(['line'])
    const els = {
      standby: s.element(0, 1000),
      deploy: s.element(3000, 2000),
      line: s.element(5000, 2500),
      work: s.element(7500, 3000),
    }
    for (const [id, el] of Object.entries(els)) scroll.registerTrack(id, el)
    scroll.startScroll()
    s.win.scrollY = 6000
    s.runFrame()
    s.win.scrollY = 6100
    s.runFrame()
    const all = Object.values(els).flatMap((el) => el.writes.map(([k]) => k))
    expect(all).not.toContain('--p-raw')
    expect(els.standby.writes).toEqual([])
    expect(els.deploy.writes).toEqual([])
    expect(els.work.writes).toEqual([])
    expect(els.line.props.has('--p')).toBe(true)
    expect(Number(els.line.props.get('--p'))).toBeGreaterThan(0)
    // The JS state still has every track, written or not.
    expect(scroll.getState().raw.deploy).toBe(1)
    expect(scroll.getState().raw.standby).toBe(1)
  })

  it('lets another track opt in with cssVar: true, and the line opt out with false', () => {
    const premise = s.element(1000, 2000)
    const line = s.element(5000, 2500)
    scroll.registerTrack('premise', premise, { cssVar: true })
    scroll.registerTrack('line', line, { cssVar: false })
    scroll.startScroll()
    s.win.scrollY = 2000
    s.runFrame()
    expect(premise.props.has('--p')).toBe(true)
    expect(line.writes).toEqual([])
  })

  it('does not rewrite --p while the value does not move', () => {
    const line = s.element(5000, 2500)
    scroll.registerTrack('line', line)
    scroll.startScroll()
    s.win.scrollY = 6000
    s.runFrame()
    const n = line.writes.length
    scroll.syncScroll()
    s.win.scrollY = 6000
    s.runFrame()
    expect(line.writes.length).toBe(n)
  })
})

describe('syncScroll (the render loop reads this frame, not the last one)', () => {
  it('computes progress for the current scrollY immediately, and the controller rAF then has nothing left to do', () => {
    const standby = s.element(0, 1000)
    scroll.registerTrack('standby', standby)
    scroll.startScroll()
    s.runFrame() // the first measure-triggered update
    const frames = vi.fn()
    scroll.subscribeFrame(frames)

    s.win.scrollY = 500 // a scroll event queued the controller's rAF...
    const state = scroll.syncScroll() // ...but the render loop runs first
    expect(state.scrollY).toBe(500)
    expect(state.raw.standby).toBeCloseTo(0.5, 6)
    expect(state.alpha).toBeLessThan(1)
    expect(frames).toHaveBeenCalledTimes(1)

    scroll.syncScroll() // same position: no second pass
    expect(frames).toHaveBeenCalledTimes(1)
    // (the controller's own rAF may be queued by an event; with nothing changed it is a no-op)
    s.runFrame()
    expect(frames).toHaveBeenCalledTimes(1)
  })

  it('still recomputes when the layout changed but the scroll position did not', () => {
    const standby = s.element(0, 1000)
    scroll.registerTrack('standby', standby)
    scroll.startScroll()
    s.win.scrollY = 500
    scroll.syncScroll()
    const frames = vi.fn()
    scroll.subscribeFrame(frames)
    scroll.remeasureTracks() // a lazy chunk changed sizes: dirty, same scrollY
    s.runFrame()
    expect(frames).toHaveBeenCalledTimes(1)
  })

  it('does nothing before the controller runs or after it stops', () => {
    s.win.scrollY = 700
    expect(scroll.syncScroll().scrollY).toBe(0) // not started
    scroll.startScroll()
    scroll.stop()
    s.win.scrollY = 900
    expect(scroll.syncScroll().scrollY).not.toBe(900)
  })
})
