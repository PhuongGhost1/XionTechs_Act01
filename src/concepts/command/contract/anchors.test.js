import { afterEach, describe, expect, it, vi } from 'vitest'
import { trackProgress } from '../runtime/scroll.js'
import { FRAME, STATIONS } from './stations.js'
import {
  ANCHOR_NAMES,
  HERO_LEG_END,
  coreAnchorSegment,
  ease,
  getAnchorRect,
  hasStickyAncestor,
  isLiveAnchor,
  lerpRect,
  rectCenter,
  registerAnchor,
  toViewportRect,
} from './anchors.js'

describe('anchor helpers', () => {
  it('know the five anchors', () => {
    expect(ANCHOR_NAMES).toEqual(['hero', 'premise', 'deploy', 'line', 'done'])
  })

  it('turn a document rect into a viewport rect by subtracting scroll', () => {
    expect(toViewportRect({ x: 100, y: 1200, width: 280, height: 280 }, 0, 900)).toEqual({
      x: 100,
      y: 300,
      width: 280,
      height: 280,
    })
    expect(toViewportRect({ x: 100, y: 50, width: 10, height: 10 }, 20, 80).y).toBe(-30)
  })

  it('lerp rects and find centres', () => {
    const a = { x: 0, y: 0, width: 100, height: 100 }
    const b = { x: 200, y: 100, width: 300, height: 200 }
    expect(lerpRect(a, b, 0)).toEqual(a)
    expect(lerpRect(a, b, 1)).toEqual(b)
    expect(lerpRect(a, b, 0.5)).toEqual({ x: 100, y: 50, width: 200, height: 150 })
    expect(rectCenter(b)).toEqual({ x: 350, y: 200 })
  })

  it('ease is monotonic, clamped and fixed at the ends', () => {
    expect(ease(-1)).toBe(0)
    expect(ease(0)).toBe(0)
    expect(ease(1)).toBe(1)
    expect(ease(2)).toBe(1)
    let last = -1
    for (let t = 0; t <= 1; t += 0.05) {
      expect(ease(t)).toBeGreaterThanOrEqual(last)
      last = ease(t)
    }
  })
})

describe('coreAnchorSegment', () => {
  it('parks on the hero at the top and runs hero -> premise over STANDBY', () => {
    expect(coreAnchorSegment({})).toEqual({ from: 'hero', to: 'premise', t: 0 })
    expect(coreAnchorSegment({ standby: HERO_LEG_END / 2 })).toEqual({ from: 'hero', to: 'premise', t: 0.5 })
    expect(coreAnchorSegment({ standby: HERO_LEG_END }).t).toBe(1)
    expect(coreAnchorSegment({ standby: 1 })).toEqual({ from: 'hero', to: 'premise', t: 1 })
  })

  it('holds the core on the premise anchor for the whole PREMISE track', () => {
    for (const premise of [0.01, 0.25, 0.5, 1]) {
      expect(coreAnchorSegment({ standby: 1, premise })).toEqual({ from: 'hero', to: 'premise', t: 1 })
    }
    // Even when a progress map arrives without standby (the leg is finished by definition).
    expect(coreAnchorSegment({ premise: 0.1 }).t).toBe(1)
  })

  it('has no nonsense in, no NaN out', () => {
    expect(coreAnchorSegment({ standby: Number.NaN, premise: Number.NaN }).t).toBe(0)
  })

  it('weights the premise anchor 0 -> 1 -> 0 with no jump from the hero through DEPLOY', () => {
    // Walk the real track progress one scroll pixel at a time (desktop, 900 px window) and follow
    // how much of the core sits on the premise anchor: 0 at the hero, 1 on the premise, back to 0
    // as it flies on to deploy. Nothing may jump by more than a pixel's worth of progress.
    const vh = 900
    const top = (id) =>
      STATIONS.slice(0, STATIONS.findIndex((s) => s.id === id)).reduce((y, s) => y + (s.lvh / 100) * vh, FRAME.headerDesktop)
    const raw = (y) =>
      Object.fromEntries(
        ['standby', 'premise', 'deploy'].map((id) => {
          const s = STATIONS.find((x) => x.id === id)
          return [id, trackProgress(y, top(id), (s.lvh / 100) * vh, vh, s.mode)]
        }),
      )
    const weight = (y) => {
      const seg = coreAnchorSegment(raw(y))
      return seg.from === 'hero' ? seg.t : 1 - seg.t
    }
    let last = weight(0)
    let max = 0
    for (let y = 1; y <= top('deploy') + 600; y += 1) {
      const w = weight(y)
      max = Math.max(max, Math.abs(w - last))
      last = w
    }
    expect(max).toBeLessThan(0.02)
    expect(weight(0)).toBe(0)
    expect(weight(top('premise') - FRAME.headerDesktop)).toBe(1)
    expect(weight(top('deploy') - 1)).toBe(1)
  })

  it('is on the premise anchor at the premise stop, on desktop, phones and short windows', () => {
    // The #premise landing: scrollY = premise top - header. STANDBY is 'span' mode, so its progress
    // there is 1 - header / track height; the leg must be finished by then.
    for (const [vh, header] of [
      [900, FRAME.headerDesktop],
      [844, FRAME.headerPhone],
      [600, FRAME.headerDesktop], // short window
      [360, FRAME.headerPhone], // landscape phone
    ]) {
      const standby = trackProgress(vh, header, vh, vh, 'span') // premise top = header + vh
      expect(standby).toBeLessThan(1)
      expect(coreAnchorSegment({ standby }).t).toBe(1)
    }
  })

  it('travels premise -> deploy -> line and then hides', () => {
    expect(coreAnchorSegment({ premise: 1, deploy: 0.1 }).from).toBe('premise')
    expect(coreAnchorSegment({ premise: 1, deploy: 1 / 6 }).t).toBeCloseTo(0.5, 5)
    expect(coreAnchorSegment({ premise: 1, deploy: 1, line: 0.075 })).toEqual({ from: 'deploy', to: 'line', t: 0.5 })
    expect(coreAnchorSegment({ premise: 1, deploy: 1, line: 1, work: 0.2 })).toEqual({ from: 'line', to: 'line', t: 0 })
    expect(coreAnchorSegment({ line: 1, work: 1, ledger: 0.5 })).toEqual({ from: 'line', to: 'line', t: 0 })
  })

  it('docks on the finale', () => {
    expect(coreAnchorSegment({ done: 0.01 })).toEqual({ from: 'done', to: 'done', t: 0 })
  })
})

describe('hasStickyAncestor', () => {
  const chain = (...positions) => {
    // Builds root <- ... <- leaf, each node carrying its computed position.
    let parent = null
    let leaf = null
    for (const position of positions) {
      leaf = { position, parentElement: parent }
      parent = leaf
    }
    return leaf
  }
  const getPosition = (node) => node.position

  it('finds a sticky box anywhere up the chain, the anchor itself included', () => {
    expect(hasStickyAncestor(chain('static', 'sticky', 'static'), getPosition)).toBe(true)
    expect(hasStickyAncestor(chain('static', 'static', 'sticky'), getPosition)).toBe(true)
    expect(hasStickyAncestor(chain('static', 'relative', 'absolute'), getPosition)).toBe(false)
    expect(hasStickyAncestor(null, getPosition)).toBe(false)
  })
})

describe('getAnchorRect with sticky anchors', () => {
  const state = { scrollX: 0, scrollY: 0 }
  const stops = []

  // A DOM stand-in: its on-screen rect is a function of the scroll position, like a real one.
  const fakeEl = (position, rectAt) => {
    const el = { position, parentElement: null, getBoundingClientRect: () => rectAt(state.scrollY) }
    return el
  }

  const mount = (name, el) => {
    vi.stubGlobal('window', {
      get scrollX() { return state.scrollX },
      get scrollY() { return state.scrollY },
      addEventListener() {},
      removeEventListener() {},
    })
    vi.stubGlobal('document', {})
    vi.stubGlobal('getComputedStyle', (node) => ({ position: node.position }))
    stops.push(registerAnchor(name, el))
  }

  afterEach(() => {
    stops.splice(0).forEach((stop) => stop())
    vi.unstubAllGlobals()
    state.scrollY = 0
  })

  const box = (top) => ({ left: 10, top, right: 110, bottom: top + 100, width: 100, height: 100 })

  it('keeps a static anchor on the cached document rect (no layout read while scrolling)', () => {
    // Static: document y = 500 whatever the scroll is.
    mount('premise', fakeEl('static', (sy) => box(500 - sy)))
    expect(isLiveAnchor('premise')).toBe(false)
    state.scrollY = 300
    expect(getAnchorRect('premise')).toEqual({ x: 10, y: 200, width: 100, height: 100 })
  })

  it('reads a sticky anchor live, so it stays where the box sticks', () => {
    // Sticky: sticks at viewport y = 120 once scrolled past 380, as the DEPLOY instrument does.
    mount('deploy', fakeEl('sticky', (sy) => box(Math.max(120, 500 - sy))))
    expect(isLiveAnchor('deploy')).toBe(true)
    expect(getAnchorRect('deploy').y).toBe(500)
    state.scrollY = 1000
    // The cached document rect (y 500) would say 500 - 1000 = -500: that is the drift.
    expect(getAnchorRect('deploy').y).toBe(120)
  })

  it('treats an anchor inside a sticky parent as sticky', () => {
    const parent = fakeEl('sticky', () => box(0))
    const child = fakeEl('static', (sy) => box(Math.max(120, 500 - sy)))
    child.parentElement = parent
    mount('line', child)
    expect(isLiveAnchor('line')).toBe(true)
    state.scrollY = 900
    expect(getAnchorRect('line').y).toBe(120)
  })

  it('is null for an anchor that is not mounted', () => {
    expect(getAnchorRect('hero')).toBe(null)
    expect(isLiveAnchor('hero')).toBe(false)
  })
})
