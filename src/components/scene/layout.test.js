import { describe, expect, it } from 'vitest'
import { buildXGraph } from './graph'
import {
  blendLayout,
  computeLayout,
  createBlend,
  domToWorld,
  fallbackAnchor,
  LOGO_NATURAL_WIDTH,
  ORBIT_SLOTS,
  PHASES,
  resolveAnchor,
  SCALAR_KEYS,
  STEP_COUNT,
  updateLayout,
  createLayout,
} from './layout'

const graph = buildXGraph()
const viewport = { width: 1280, height: 800 }

// A plausible desktop page, in DOM px (y down).
function sampleAnchors() {
  const anchors = {
    hero: { cx: 900, cy: 400, w: 480, h: 480 },
    deploy: { cx: 1000, cy: 380, w: 300, h: 120 },
    final: { cx: 640, cy: 600, w: 320, h: 80 },
  }
  for (let k = 0; k < 4; k++) anchors[`module-${k + 1}`] = { cx: 1000, cy: 150 + 160 * k, w: 220, h: 150 }
  for (let k = 0; k < STEP_COUNT; k++) anchors[`process-${k + 1}`] = { cx: 160 + 190 * k, cy: 420, w: 56, h: 56 }
  return anchors
}

// World position of an anchor's centre.
const world = (a) => domToWorld(a.cx, a.cy, viewport)

// Position of node i in phase p, read straight from the layout.
const nodeAt = (L, p, i) => {
  const o = (p * L.N + i) * 3
  return { x: L.pos[o], y: L.pos[o + 1], z: L.pos[o + 2] }
}

// A fake logo: three points across the middle, one of them yellow.
const logo = {
  aspect: 250 / 46,
  points: [
    { x: -0.4, y: 0.02, yellow: true },
    { x: 0, y: 0, yellow: false },
    { x: 0.4, y: -0.02, yellow: false },
  ],
}

describe('domToWorld', () => {
  it('puts the viewport centre at the origin and flips y', () => {
    expect(domToWorld(640, 400, viewport)).toEqual({ x: 0, y: 0 })
    expect(domToWorld(0, 0, viewport)).toEqual({ x: -640, y: 400 })
    expect(domToWorld(1280, 800, viewport)).toEqual({ x: 640, y: -400 })
  })

  it('writes into the object it is given', () => {
    const out = { x: 1, y: 1 }
    expect(domToWorld(740, 300, viewport, out)).toBe(out)
    expect(out).toEqual({ x: 100, y: 100 })
  })
})

describe('resolveAnchor and fallbackAnchor', () => {
  const box = { x: 0, y: 0, w: 0, h: 0, fallback: false }

  it('converts a measured anchor to world units', () => {
    resolveAnchor({ hero: { cx: 900, cy: 400, w: 480, h: 360 } }, 'hero', viewport, box)
    expect(box).toEqual({ x: 260, y: 0, w: 480, h: 360, fallback: false })
  })

  it('accepts a Map', () => {
    resolveAnchor(new Map([['final', { cx: 640, cy: 700, w: 250, h: 46 }]]), 'final', viewport, box)
    expect(box.y).toBe(-300)
    expect(box.fallback).toBe(false)
  })

  it('falls back for a missing, empty or broken anchor, for every known id', () => {
    const ids = ['hero', 'deploy', 'final', 'unknown', ...[1, 2, 3, 4].map((n) => `module-${n}`), ...[1, 2, 3, 4, 5, 6].map((n) => `process-${n}`)]
    for (const size of [{ width: 1280, height: 800 }, { width: 375, height: 700 }]) {
      for (const id of ids) {
        for (const anchors of [undefined, {}, { [id]: { cx: NaN, cy: 0, w: 10, h: 10 } }, { [id]: { cx: 5, cy: 5, w: 0, h: 10 } }]) {
          resolveAnchor(anchors, id, size, box)
          expect(box.fallback).toBe(true)
          for (const v of [box.x, box.y, box.w, box.h]) expect(Number.isFinite(v)).toBe(true)
          expect(box.w).toBeGreaterThan(0)
          expect(box.h).toBeGreaterThan(0)
        }
      }
    }
  })

  it('places fallback boxes inside the viewport and process steps in order', () => {
    const steps = [1, 2, 3, 4, 5, 6].map((n) => fallbackAnchor(`process-${n}`, viewport))
    for (let i = 1; i < steps.length; i++) expect(steps[i].cx).toBeGreaterThan(steps[i - 1].cx)
    for (const s of steps) {
      expect(s.cx).toBeGreaterThan(0)
      expect(s.cx).toBeLessThan(viewport.width)
    }
    const narrow = [1, 2, 3, 4, 5, 6].map((n) => fallbackAnchor(`process-${n}`, { width: 375, height: 700 }))
    for (let i = 1; i < narrow.length; i++) expect(narrow[i].cy).toBeGreaterThan(narrow[i - 1].cy)
  })
})

describe('computeLayout', () => {
  const anchors = sampleAnchors()
  const L = computeLayout(graph, anchors, viewport, { orbitCount: 360, logo })

  it('phase 0: the X sits inside the hero box, hub at its centre', () => {
    const hero = world(anchors.hero)
    for (let i = 0; i < L.N; i++) {
      const p = nodeAt(L, 0, i)
      expect(Math.abs(p.x - hero.x)).toBeLessThanOrEqual(anchors.hero.w / 2)
      expect(Math.abs(p.y - hero.y)).toBeLessThanOrEqual(anchors.hero.h / 2)
    }
    expect(nodeAt(L, 0, 0)).toEqual({ x: hero.x, y: hero.y, z: 0 })
    expect(L.scalars[0].core).toBe(1)
    expect(L.vis[0]).toBe(1)
  })

  it('phase 0 keeps the X orientation: arm 0 north-west, arm 3 south-east (y up in world)', () => {
    const hero = world(anchors.hero)
    const tip = (arm) => nodeAt(L, 0, 1 + arm * graph.perArm + graph.perArm - 1)
    expect(tip(0).x).toBeLessThan(hero.x)
    expect(tip(0).y).toBeGreaterThan(hero.y)
    expect(tip(3).x).toBeGreaterThan(hero.x)
    expect(tip(3).y).toBeLessThan(hero.y)
  })

  it('phase 1: every arm travels to its own module box and the hub fades', () => {
    for (let arm = 0; arm < 4; arm++) {
      const target = world(anchors[`module-${arm + 1}`])
      for (const n of graph.nodes.filter((nd) => nd.arm === arm)) {
        const p = nodeAt(L, 1, n.id)
        // Within the box, and nearer to its own module than to any other.
        expect(Math.abs(p.x - target.x)).toBeLessThanOrEqual(anchors[`module-${arm + 1}`].w / 2)
        expect(Math.abs(p.y - target.y)).toBeLessThanOrEqual(anchors[`module-${arm + 1}`].h / 2)
        for (let other = 0; other < 4; other++) {
          if (other === arm) continue
          const o = world(anchors[`module-${other + 1}`])
          expect(Math.hypot(p.x - target.x, p.y - target.y)).toBeLessThan(Math.hypot(p.x - o.x, p.y - o.y))
        }
      }
    }
    expect(L.vis[L.N]).toBe(0) // phase 1, node 0: the hub
    expect(L.scalars[1].core).toBe(0)
  })

  it('phase 1: ring edges are hidden so nothing is drawn between the module boxes', () => {
    for (let e = 0; e < L.E; e++) if (L.isRing[e]) expect(L.edgeVis[L.E + e]).toBe(0)
  })

  it('phase 2: six clusters of six arm nodes at the process anchors, in order', () => {
    const counts = new Array(STEP_COUNT).fill(0)
    for (const n of graph.nodes) {
      if (n.arm < 0) continue
      const j = L.stepOf[n.id]
      counts[j]++
      const c = world(anchors[`process-${j + 1}`])
      const p = nodeAt(L, 2, n.id)
      expect(Math.hypot(p.x - c.x, p.y - c.y)).toBeLessThanOrEqual(26)
    }
    expect(counts).toEqual([6, 6, 6, 6, 6, 6])
    // Inner levels land in the early steps, the tips in the last one.
    expect(L.stepOf[1]).toBe(0)
    expect(L.stepOf[graph.perArm]).toBe(STEP_COUNT - 1)
  })

  it('phase 3: a dim chain inside the deploy box', () => {
    const box = anchors.deploy
    const c = world(box)
    for (let i = 1; i < L.N; i++) {
      const p = nodeAt(L, 3, i)
      expect(Math.abs(p.x - c.x)).toBeLessThanOrEqual(box.w / 2)
      expect(Math.abs(p.y - c.y)).toBeLessThanOrEqual(box.h / 2)
      expect(L.vis[3 * L.N + i]).toBeLessThan(1)
    }
  })

  it('phase 4: parked on screen, finite', () => {
    for (let i = 0; i < L.N; i++) {
      const p = nodeAt(L, 4, i)
      expect(Math.abs(p.x)).toBeLessThan(viewport.width / 2)
      expect(Math.abs(p.y)).toBeLessThan(viewport.height / 2)
    }
  })

  it('phase 5 with a logo: nodes and orbit targets sit on the logo at its natural width', () => {
    const c = world(anchors.final)
    expect(L.hasLogo).toBe(true)
    expect(L.scalars[5].logoMix).toBe(1)
    const width = Math.min(anchors.final.w, anchors.final.h * logo.aspect, LOGO_NATURAL_WIDTH)
    for (let i = 0; i < L.N; i++) {
      const p = nodeAt(L, 5, i)
      expect(Math.abs(p.x - c.x)).toBeLessThanOrEqual(width * 0.4 + 1e-3)
      expect(Math.abs(p.y - c.y)).toBeLessThanOrEqual(width * 0.02 + 1e-3)
    }
    for (let j = 0; j < 360; j++) expect(Math.abs(L.logoTarget[j * 3] - c.x)).toBeLessThanOrEqual(width * 0.4 + 1e-3)
    // Node 0 takes points[0], which is yellow, and the flag follows the point.
    expect(L.tint[5 * L.N + 0]).toBe(1)
    expect(L.tint[5 * L.N + 1]).toBe(0)
  })

  it('never makes the logo larger than its natural width', () => {
    const big = { ...anchors, final: { cx: 640, cy: 600, w: 900, h: 400 } }
    const wide = computeLayout(graph, big, viewport, { orbitCount: 360, logo })
    const xs = Array.from({ length: wide.N }, (_, i) => nodeAt(wide, 5, i).x)
    expect(Math.max(...xs) - Math.min(...xs)).toBeLessThanOrEqual(LOGO_NATURAL_WIDTH)
  })

  it('phase 5 without a logo converges into the generic X', () => {
    const plain = computeLayout(graph, anchors, viewport, { orbitCount: 360 })
    expect(plain.hasLogo).toBe(false)
    expect(plain.scalars[5].logoMix).toBe(0)
    const c = world(anchors.final)
    const p0 = nodeAt(plain, 5, 0)
    expect(p0.x).toBeCloseTo(c.x, 3)
    expect(p0.y).toBeCloseTo(c.y, 3)
    const tip = nodeAt(plain, 5, graph.perArm)
    expect(tip.x).not.toBeCloseTo(c.x, 0)
  })

  it('treats an empty points list as no logo', () => {
    expect(computeLayout(graph, anchors, viewport, { logo: { points: [], aspect: 5 } }).hasLogo).toBe(false)
  })

  it('does not throw and stays finite when there are no anchors at all', () => {
    for (const a of [undefined, {}, new Map()]) {
      const bare = computeLayout(graph, a, { width: 375, height: 700 }, { orbitCount: 140 })
      for (const arr of [bare.pos, bare.piv, bare.vis, bare.tint, bare.edgeVis, bare.orbitCx, bare.orbitCy, bare.orbitRx, bare.orbitRy]) {
        expect(Array.from(arr).every(Number.isFinite)).toBe(true)
      }
      for (const s of bare.scalars) expect(Object.values(s).every(Number.isFinite)).toBe(true)
    }
  })

  it('updates in place: same buffers, same result for the same anchors', () => {
    const buf = createLayout(graph, { orbitCount: 360 })
    const pos = buf.pos
    updateLayout(buf, anchors, viewport, logo)
    const first = Array.from(buf.pos)
    updateLayout(buf, anchors, viewport, logo)
    expect(buf.pos).toBe(pos)
    expect(Array.from(buf.pos)).toEqual(first)
    updateLayout(buf, { ...anchors, hero: { cx: 100, cy: 100, w: 300, h: 300 } }, viewport, logo)
    expect(Array.from(buf.pos)).not.toEqual(first)
  })

  it('spreads the orbit slots evenly over the clusters of each phase', () => {
    const slots = (p) => Array.from({ length: ORBIT_SLOTS }, (_, s) => `${L.orbitCx[p * ORBIT_SLOTS + s]}|${L.orbitCy[p * ORBIT_SLOTS + s]}`)
    const tally = (p) => Object.values(slots(p).reduce((m, k) => ({ ...m, [k]: (m[k] || 0) + 1 }), {}))
    expect(tally(0)).toEqual([12])
    expect(tally(1)).toEqual([3, 3, 3, 3])
    expect(tally(2)).toEqual([2, 2, 2, 2, 2, 2])
    expect(tally(5)).toEqual([12])
  })
})

describe('blendLayout', () => {
  const anchors = sampleAnchors()
  const L = computeLayout(graph, anchors, viewport, { orbitCount: 360, logo })
  const out = createBlend(L)
  const slice = (arr, p, size) => Array.from(arr.slice(p * size, (p + 1) * size))

  it('returns exactly phase k at every integer phase', () => {
    for (let k = 0; k < PHASES; k++) {
      blendLayout(L, k, out)
      expect(Array.from(out.pos)).toEqual(slice(L.pos, k, L.N * 3))
      expect(Array.from(out.vis)).toEqual(slice(L.vis, k, L.N))
      expect(Array.from(out.edgeVis)).toEqual(slice(L.edgeVis, k, L.E))
      expect(Array.from(out.orbitCx)).toEqual(slice(L.orbitCx, k, ORBIT_SLOTS))
      for (const key of SCALAR_KEYS) expect(out.scalars[key]).toBe(L.scalars[k][key])
    }
  })

  it('blends scalars linearly and keeps every node between its two phases', () => {
    blendLayout(L, 2.5, out)
    expect(out.scalars.orbitAlpha).toBeCloseTo((L.scalars[2].orbitAlpha + L.scalars[3].orbitAlpha) / 2, 6)
    for (let i = 0; i < L.N * 3; i++) {
      const a = L.pos[2 * L.N * 3 + i]
      const b = L.pos[3 * L.N * 3 + i]
      expect(out.pos[i]).toBeGreaterThanOrEqual(Math.min(a, b) - 1e-3)
      expect(out.pos[i]).toBeLessThanOrEqual(Math.max(a, b) + 1e-3)
    }
  })

  it('fades the core out between the hero and the modules', () => {
    blendLayout(L, 0.5, out)
    expect(out.scalars.core).toBeCloseTo(0.5, 6)
    blendLayout(L, 1, out)
    expect(out.scalars.core).toBe(0)
  })

  it('moves inner nodes before outer ones', () => {
    blendLayout(L, 0.2, out)
    const progress = (i) => {
      const a = nodeAt(L, 0, i)
      const b = nodeAt(L, 1, i)
      const o = { x: out.pos[i * 3], y: out.pos[i * 3 + 1] }
      return Math.hypot(o.x - a.x, o.y - a.y) / Math.hypot(b.x - a.x, b.y - a.y)
    }
    const inner = 1 // arm 0, level 1
    const tip = graph.perArm // arm 0, tip
    expect(progress(inner)).toBeGreaterThan(progress(tip))
  })

  it('clamps out-of-range and non-numeric phases', () => {
    blendLayout(L, -3, out)
    expect(Array.from(out.pos)).toEqual(slice(L.pos, 0, L.N * 3))
    blendLayout(L, 99, out)
    expect(Array.from(out.pos)).toEqual(slice(L.pos, PHASES - 1, L.N * 3))
    blendLayout(L, NaN, out)
    expect(Array.from(out.pos)).toEqual(slice(L.pos, 0, L.N * 3))
    expect(out.phase).toBe(0)
  })

  it('writes into the buffers it is given', () => {
    const pos = out.pos
    expect(blendLayout(L, 1.3, out)).toBe(out)
    expect(out.pos).toBe(pos)
  })
})
