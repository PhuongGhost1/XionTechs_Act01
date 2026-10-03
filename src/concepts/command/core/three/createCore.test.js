import { describe, expect, it } from 'vitest'
import { content } from '../../content/index.js'
import { buildGraph } from '../graph.js'
import { TIER_SPEC, buildSceneData } from './buffers.js'
import { createCore } from './createCore.js'

// Smoke tests against a fake renderer, the way a careful engineer tests code that needs a GPU:
// the scene graph, the uniforms, the buffer swaps, the loop control and the event contract are all
// checked in Node; what the pixels look like is checked in a real browser.

const graph = buildGraph(content)
const tokens = {
  ink: [1, 1, 1],
  ink2: [0.7, 0.8, 0.8],
  ink3: [0.5, 0.6, 0.7],
  signal: [0.96, 0.77, 0],
  ghost: [0.7, 0.8, 0.8, 0.1],
  hair: [0.7, 0.8, 0.8, 0.3],
}

const fakeRenderer = () => ({
  renders: 0,
  dpr: 0,
  size: null,
  disposed: false,
  setClearColor() {},
  setPixelRatio(v) {
    this.dpr = v
  },
  setSize(w, h) {
    this.size = [w, h]
  },
  render() {
    this.renders += 1
  },
  dispose() {
    this.disposed = true
  },
})

// A manual rAF: callbacks run when the test says so.
function manualRaf() {
  let queue = []
  let id = 0
  return {
    raf: (fn) => {
      id += 1
      queue.push([id, fn])
      return id
    },
    caf: (target) => {
      queue = queue.filter(([i]) => i !== target)
    },
    step(ms = 16) {
      const run = queue
      queue = []
      run.forEach(([, fn]) => fn(ms))
    },
    pending: () => queue.length,
  }
}

function make(options = {}) {
  const renderer = fakeRenderer()
  const r = manualRaf()
  const core = createCore({
    canvas: {},
    graph,
    tier: 'high',
    tokens,
    renderer,
    raf: r.raf,
    caf: r.caf,
    now: () => 0,
    viewport: () => ({ width: 1440, height: 900, dpr: 2 }),
    ...options,
  })
  return { core, renderer, r }
}

describe('scene data', () => {
  it('sizes the pool and the line buffers for each tier, and the layouts agree', () => {
    for (const tier of ['high', 'low']) {
      const d = buildSceneData(graph, tier)
      expect(d.n).toBe(TIER_SPEC[tier].points)
      expect(d.points.pos).toHaveLength(5)
      for (const p of d.points.pos) {
        expect(p).toHaveLength(d.n * 3)
        expect(p.some(Number.isNaN)).toBe(false)
      }
      for (const p of d.lines.pos) expect(p).toHaveLength(d.lines.count * 3)
      expect(d.lines.count % 2).toBe(0)
      expect(d.packets.count).toBe(TIER_SPEC[tier].packets)
      expect(d.orbiters.count).toBe(TIER_SPEC[tier].orbiters)
    }
  })
})

describe('createCore', () => {
  it('draws at most five objects: five on high, three on low (no halo, no orbiters)', () => {
    const high = make().core
    expect(high.group.children).toHaveLength(5)
    const low = make({ tier: 'low' }).core
    expect(low.group.children).toHaveLength(3)
    expect(low.group.children.length).toBeLessThanOrEqual(5)
  })

  it('maps z = 0 to CSS pixels: camera distance, aspect, a capped pixel ratio', () => {
    const { core, renderer } = make()
    const d = 900 / 2 / Math.tan((20 * Math.PI) / 360)
    expect(core.camera.fov).toBe(20)
    expect(core.camera.position.z).toBeCloseTo(d, 6)
    expect(core.camera.aspect).toBeCloseTo(1440 / 900, 6)
    expect(renderer.dpr).toBeLessThanOrEqual(1.5)
    core.resize(3840, 2160, 2)
    expect(3840 * 2160 * renderer.dpr * renderer.dpr).toBeLessThanOrEqual(2.4e6 + 1)
    const low = make({ tier: 'low' })
    expect(low.renderer.dpr).toBe(1)
  })

  it('places the group from the anchor rect and the layout fit, and sets the uniforms', () => {
    const { core, renderer } = make()
    core.setAnchorRect({ x: 100, y: 200, width: 300, height: 300 })
    core.setUniforms({ k: 0.4, alpha: 0.35, active: 2 })
    core.frame(16)
    expect(renderer.renders).toBe(1)
    // The rect centre (250, 350) in a 1440 x 900 viewport, y up, centred.
    expect(core.group.position.x).toBeCloseTo(250 - 720, 6)
    expect(core.group.position.y).toBeCloseTo(450 - 350, 6)
    expect(core.group.scale.x).toBeGreaterThan(290)
    const mat = core.group.children[2].material
    expect(mat.uniforms.uK.value).toBeCloseTo(0.4, 6)
    expect(mat.uniforms.uMix.value).toBeCloseTo(0.4, 6)
    expect(mat.uniforms.uAlpha.value).toBeCloseTo(0.35, 6)
    expect(mat.uniforms.uActive.value).toBe(2)
  })

  it('swaps the attribute pair only when floor(k) changes, in place, never per frame', () => {
    const { core } = make()
    core.setAnchorRect({ x: 0, y: 0, width: 300, height: 300 })
    const points = core.group.children.find((o) => o.isPoints && o.geometry.attributes.aKind)
    const from = points.geometry.attributes.aFrom
    const arrayRef = from.array
    core.setUniforms({ k: 0.2 })
    core.frame(16)
    const v0 = from.version
    core.frame(32)
    core.frame(48)
    expect(from.version).toBe(v0) // no upload without a layout change
    core.setUniforms({ k: 1.6 })
    core.frame(64)
    expect(from.version).toBeGreaterThan(v0)
    expect(from.array).toBe(arrayRef) // same typed array, written in place
    expect(Array.from(from.array.slice(0, 30))).toEqual(Array.from(core.data.points.pos[1].slice(0, 30)))
    core.setUniforms({ k: 4 })
    core.frame(80)
    expect(Array.from(from.array.slice(0, 30))).toEqual(Array.from(core.data.points.pos[3].slice(0, 30)))
    expect(core.group.children[2].material.uniforms.uMix.value).toBe(1)
  })

  it('emits painted once, after the first frame has been presented', () => {
    const { core, r } = make()
    let painted = 0
    core.on('painted', () => (painted += 1))
    core.frame(16)
    expect(painted).toBe(0)
    r.step()
    expect(painted).toBe(1)
    core.frame(32)
    r.step()
    expect(painted).toBe(1)
  })

  it('stops its loop when idle says so, and wakes when there is something to draw', () => {
    let hidden = false
    const { core, r, renderer } = make({
      sample: (s) => Object.assign(s, { k: 0, alpha: 1, w: 300, h: 300, hasRect: true }),
      idle: () => hidden,
    })
    core.start()
    r.step()
    r.step()
    expect(core.running).toBe(true)
    expect(renderer.renders).toBe(2)
    hidden = true
    r.step()
    expect(core.running).toBe(false)
    expect(r.pending()).toBe(0)
    const rendered = renderer.renders
    r.step()
    expect(renderer.renders).toBe(rendered)
    core.wake() // still idle: stays stopped
    expect(core.running).toBe(false)
    hidden = false
    core.wake()
    expect(core.running).toBe(true)
  })

  it('animates nothing when still (motion off): clock and idle rotation hold', () => {
    const { core } = make()
    core.setAnchorRect({ x: 0, y: 0, width: 300, height: 300 })
    core.state.still = true
    core.frame(16)
    core.frame(2016)
    expect(core.group.rotation.y).toBe(0)
    expect(core.group.children[2].material.uniforms.uClock.value).toBe(0)
  })

  it('falls back on loss, drops to a cheaper tier on request, and disposes cleanly', () => {
    const { core, renderer } = make()
    let lost = 0
    core.on('lost', () => (lost += 1))
    core.start()
    core.lose()
    expect(lost).toBe(1)
    expect(core.running).toBe(false)

    core.setTier('low')
    expect(core.tier).toBe('low')
    expect(core.group.children).toHaveLength(3)
    core.dispose()
    core.dispose() // idempotent
    expect(renderer.disposed).toBe(true)
    expect(core.group.children).toHaveLength(0)
    core.frame(16) // a frame after dispose is a no-op
    expect(renderer.renders).toBe(0)
  })
})
