import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// A smoke test of the frame loop with a fake renderer and a fake page: no WebGL and no DOM exist
// under vitest's node environment, so this checks the logic (measuring, phases, buffers, loop
// control, cleanup) and not the pixels.
const renders = []
vi.mock('three', async (importOriginal) => {
  const three = await importOriginal()
  class FakeRenderer {
    constructor() {
      this.disposed = false
      this.lost = false
    }
    setClearColor() {}
    setPixelRatio() {}
    setSize() {}
    render(scene) {
      renders.push(scene)
    }
    dispose() {
      this.disposed = true
    }
    forceContextLoss() {
      this.lost = true
    }
  }
  return { ...three, WebGLRenderer: FakeRenderer }
})

const { createXCore } = await import('./render')
const { sceneState, setPaused } = await import('./store')

const VW = 1280
const VH = 800
const SECTIONS = [
  ['top', 900],
  ['modules', 1400],
  ['process', 1000],
  ['deployments', 900],
  ['signals', 1000],
  ['contact', 800],
]
let scrollY = 0
let frames = []
let anchorEls = []
let sectionEls = {}
let listeners = {}

function rectOf(pageTop, pageLeft, w, h) {
  return () => ({ top: pageTop - scrollY, bottom: pageTop - scrollY + h, left: pageLeft, right: pageLeft + w, width: w, height: h })
}

function buildPage() {
  let y = 0
  sectionEls = {}
  for (const [id, h] of SECTIONS) {
    sectionEls[id] = { isConnected: true, getBoundingClientRect: rectOf(y, 0, VW, h) }
    y += h
  }
  const anchor = (id, pageTop, left, w, h) => ({ isConnected: true, getAttribute: () => id, getBoundingClientRect: rectOf(pageTop, left, w, h) })
  anchorEls = [
    anchor('hero', 160, 740, 480, 480),
    ...[1, 2, 3, 4].map((n) => anchor(`module-${n}`, 900 + 300 * n, 940, 240, 160)),
    ...[1, 2, 3, 4, 5, 6].map((n) => anchor(`process-${n}`, 2400, 100 + 190 * n, 56, 56)),
    anchor('deploy', 3400, 900, 300, 120),
    anchor('final', 5300, 480, 320, 80),
  ]
}

// Every typed array reachable from the scene, by attribute name.
function attributes(scene) {
  const out = []
  scene.traverse((o) => {
    if (o.geometry) for (const [name, a] of Object.entries(o.geometry.attributes)) out.push({ name, array: a.array, object: o })
  })
  return out
}

function runFrames(count, stepMs = 16) {
  let now = runFrames.now || 0
  for (let i = 0; i < count && frames.length; i++) {
    const cb = frames.shift()
    now += stepMs
    cb(now)
  }
  runFrames.now = now
}

beforeEach(() => {
  scrollY = 0
  frames = []
  listeners = {}
  renders.length = 0
  runFrames.now = 0
  buildPage()
  const fakeCanvas = () => ({
    style: {},
    getContext: () => ({ createRadialGradient: () => ({ addColorStop() {} }), fillRect() {} }),
    addEventListener() {},
    removeEventListener() {},
    remove() {},
  })
  vi.stubGlobal('document', {
    hidden: false,
    documentElement: { dataset: {} },
    createElement: () => fakeCanvas(),
    querySelectorAll: () => anchorEls,
    getElementById: (id) => sectionEls[id] ?? null,
    addEventListener: (type, fn) => (listeners[type] = fn),
    removeEventListener: (type) => delete listeners[type],
  })
  vi.stubGlobal('window', {
    devicePixelRatio: 2,
    addEventListener: (type, fn) => (listeners[`window:${type}`] = fn),
    removeEventListener: (type) => delete listeners[`window:${type}`],
  })
  vi.stubGlobal('getComputedStyle', () => ({ getPropertyValue: () => '' }))
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} })
  vi.stubGlobal('requestAnimationFrame', (cb) => frames.push(cb))
  vi.stubGlobal('cancelAnimationFrame', () => {
    frames = []
  })
  sceneState.paused = false
  sceneState.flow = 1
  sceneState.flowTarget = 1
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const container = () => ({ clientWidth: VW, clientHeight: VH, appendChild() {} })

describe('createXCore frame loop', () => {
  it('draws, reports its first frame once and keeps every buffer finite across the whole page', () => {
    const onFirstFrame = vi.fn()
    const core = createXCore({ container: container(), quality: 'high', onFirstFrame })
    runFrames(5)
    expect(renders.length).toBeGreaterThan(0)
    expect(onFirstFrame).toHaveBeenCalledTimes(1)

    // Scroll through the page, skipping the stretch where the paper band covers the viewport.
    for (let y = 0; y <= 5300; y += 250) {
      scrollY = y
      listeners['window:scroll']?.()
      runFrames(12)
      const scene = renders[renders.length - 1]
      for (const { name, array } of attributes(scene)) {
        for (let i = 0; i < array.length; i++) {
          if (!Number.isFinite(array[i])) throw new Error(`non-finite ${name}[${i}] at scroll ${y}`)
        }
      }
    }
    expect(onFirstFrame).toHaveBeenCalledTimes(1)
    core.dispose()
  })

  it('stops drawing while the paper band covers the viewport and wakes on scroll', () => {
    const core = createXCore({ container: container(), quality: 'low' })
    scrollY = 4200 // the signals section (page y 4200 to 5200) fills the viewport
    listeners['window:scroll']?.()
    runFrames(3)
    const before = renders.length
    expect(frames.length).toBe(0) // the loop went to sleep
    scrollY = 4200
    runFrames(10)
    expect(renders.length).toBe(before)
    scrollY = 3000
    listeners['window:scroll']?.()
    runFrames(3)
    expect(renders.length).toBeGreaterThan(before)
    core.dispose()
  })

  it('freezes the clock while paused: orbit particles stop moving', () => {
    const core = createXCore({ container: container(), quality: 'high' })
    runFrames(10)
    const orbit = () => attributes(renders[renders.length - 1]).filter((a) => a.name === 'position').find((a) => a.array.length === 360 * 3)
    const snapshot = Array.from(orbit().array)
    runFrames(10)
    expect(Array.from(orbit().array)).not.toEqual(snapshot) // moving at idle
    setPaused(true)
    runFrames(5)
    const frozen = Array.from(orbit().array)
    runFrames(5)
    expect(Array.from(orbit().array)).toEqual(frozen)
    setPaused(false)
    core.dispose()
  })

  it('uses the lower particle and packet counts on low quality', () => {
    const core = createXCore({ container: container(), quality: 'low' })
    runFrames(3)
    const sizes = attributes(renders[renders.length - 1]).filter((a) => a.name === 'position').map((a) => a.array.length / 3)
    expect(sizes).toContain(140)
    expect(sizes).toContain(12 * 3)
    expect(core.logoBudget).toBe(140 + 37)
    core.dispose()
  })

  it('gathers the orbit particles onto the logo at the end', () => {
    const core = createXCore({ container: container(), quality: 'high' })
    core.setLogo([{ x: -0.2, y: 0, yellow: true }, { x: 0.2, y: 0, yellow: false }], 250 / 46)
    scrollY = 5300 - VH / 2 + 40 // the contact section holds the centre line
    listeners['window:scroll']?.()
    runFrames(200)
    const scene = renders[renders.length - 1]
    const orbit = attributes(scene).find((a) => a.name === 'position' && a.array.length === 360 * 3).array
    // Final box centre: x = 480 + 160 = 640, which is world x 0; logo width = min(320, 80 * 5.43, 250) = 250.
    let near = 0
    for (let j = 0; j < 360; j++) if (Math.abs(Math.abs(orbit[j * 3]) - 50) < 1) near++
    expect(near).toBeGreaterThan(300)
    core.dispose()
  })

  it('reports a lost context and stops', () => {
    const onContextLost = vi.fn()
    const canvasListeners = {}
    vi.stubGlobal('document', {
      hidden: false,
      documentElement: { dataset: {} },
      createElement: () => ({
        style: {},
        getContext: () => ({ createRadialGradient: () => ({ addColorStop() {} }), fillRect() {} }),
        addEventListener: (type, fn) => (canvasListeners[type] = fn),
        removeEventListener() {},
        remove() {},
      }),
      querySelectorAll: () => anchorEls,
      getElementById: (id) => sectionEls[id] ?? null,
      addEventListener() {},
      removeEventListener() {},
    })
    const core = createXCore({ container: container(), quality: 'high', onContextLost })
    runFrames(2)
    canvasListeners.webglcontextlost()
    expect(onContextLost).toHaveBeenCalledTimes(1)
    const drawn = renders.length
    runFrames(5)
    expect(renders.length).toBe(drawn)
    core.dispose()
  })

  it('removes every listener and stops its loop on dispose', () => {
    const core = createXCore({ container: container(), quality: 'high' })
    runFrames(2)
    expect(Object.keys(listeners).length).toBeGreaterThan(0)
    core.dispose()
    expect(Object.keys(listeners)).toEqual([])
    expect(frames.length).toBe(0)
  })

  it('survives a page with no anchors and no sections', () => {
    anchorEls = []
    sectionEls = {}
    const core = createXCore({ container: container(), quality: 'high' })
    expect(() => runFrames(10)).not.toThrow()
    expect(renders.length).toBeGreaterThan(0)
    core.dispose()
  })
})
