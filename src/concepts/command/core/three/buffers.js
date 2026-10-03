import { edgePoint, buildPool, layoutFor, linePlan, poolPositions } from '../layouts.js'
import { LAYOUTS } from '../graph.js'
import { rngFor } from '../rng.js'

// Everything the WebGL scene needs, as plain typed arrays (doc 6.3). Pure: no three, no DOM, so it
// is unit tested in Node. createCore.js uploads these once and only swaps the two attribute sets
// (aFrom, aTo) when the layout pair changes, never per frame.
//
// Coordinates are LOCAL: the unit box centred on the origin, y UP (x - 0.5, 0.5 - y, z). The core
// group scales them to the anchor's pixel size, so one unit is one anchor width.

/** Per-tier budgets (doc 6.2). `mp` is the render pixel cap, in pixels. */
export const TIER_SPEC = Object.freeze({
  high: Object.freeze({ points: 1200, packets: 24, orbiters: 16, halo: true, pointer: true, dpr: 1.5, mp: 2.4e6, segments: 16 }),
  low: Object.freeze({ points: 500, packets: 8, orbiters: 0, halo: false, pointer: false, dpr: 1, mp: 1.5e6, segments: 10 }),
})

/** Edge kind codes for the line shader (aKindE). */
export const EDGE_CODE = Object.freeze({ hub: 0, member: 1, record: 2, pending: 3, method: 4 })

/**
 * The pixel ratio of the canvas for a viewport. The canvas is one full-viewport buffer, but only
 * the core is ever drawn into it (at most about 320 x 320 CSS px, or the 1700 x 96 line): the
 * budget `spec.mp` limits the buffer (memory, clear, compositing), not shader work, which is
 * bounded by the core's own size. So the cap shrinks the ratio only down to 1 (or to the device's
 * own ratio when that is below 1): a 2560 x 1440 window at DPR 1 renders at 1 and stays sharp
 * instead of being resampled to 0.8 to fit 2.4 MP. Above DPR 1 the budget still applies.
 */
export function pixelRatioFor(width, height, dpr, spec) {
  let ratio = Math.min(dpr, spec.dpr)
  const area = width * height
  if (area * ratio * ratio > spec.mp) ratio = Math.max(Math.sqrt(spec.mp / area), Math.min(ratio, 1))
  return ratio
}

const toLocal = (out, o, p) => {
  out[o] = p[0] - 0.5
  out[o + 1] = 0.5 - p[1]
  out[o + 2] = p[2]
}

/**
 * @param {ReturnType<import('../graph.js').buildGraph>} graph
 * @param {'high'|'low'} tier
 */
export function buildSceneData(graph, tier = 'high') {
  const spec = TIER_SPEC[tier] ?? TIER_SPEC.high
  const layouts = LAYOUTS.map((name) => layoutFor(name, graph))
  const pool = buildPool(graph, spec.points, `scene.${tier}`)
  const n = pool.n

  // -- points ----------------------------------------------------------------------------------
  const pointPos = layouts.map((layout) => {
    const flat = poolPositions(layout, graph, pool)
    const out = new Float32Array(n * 3)
    const p = [0, 0, 0]
    for (let i = 0; i < n; i += 1) {
      p[0] = flat[i * 3]
      p[1] = flat[i * 3 + 1]
      p[2] = flat[i * 3 + 2]
      toLocal(out, i * 3, p)
    }
    return out
  })

  // -- lines: every drawn edge side as `segments` short segments, in every layout ----------------
  const plan = linePlan(graph)
  const seg = spec.segments
  const verts = plan.length * seg * 2
  const linePos = layouts.map(() => new Float32Array(verts * 3))
  const lineDelay = new Float32Array(verts)
  const lineKind = new Float32Array(verts)
  const lineArm = new Float32Array(verts)
  const lineT = new Float32Array(verts)
  const tmp = [0, 0, 0]
  const x = layouts[0]
  plan.forEach(({ edge, side }, pi) => {
    const code = edge.dashed ? EDGE_CODE.pending : EDGE_CODE[edge.kind]
    for (let s = 0; s < seg; s += 1) {
      for (let end = 0; end < 2; end += 1) {
        const v = (pi * seg + s) * 2 + end
        const t = (s + end) / seg
        layouts.forEach((layout, li) => {
          edgePoint(layout, graph, edge, t, side, tmp)
          toLocal(linePos[li], v * 3, tmp)
        })
        edgePoint(x, graph, edge, t, side, tmp)
        lineDelay[v] = Math.min(1, Math.hypot(tmp[0] - 0.5, tmp[1] - 0.5) / 0.55)
        lineKind[v] = code
        lineArm[v] = edge.arm
        lineT[v] = t
      }
    }
  })

  // -- packets: a dash riding an edge; the path is a quadratic through the edge's midpoint -------
  const packetEdges = []
  // One strand per arm first, so a few packets still spread over the whole X; then the second strands.
  for (const side of [-1, 1]) for (const q of plan) if (q.edge.kind === 'hub' && q.side === side) packetEdges.push(q)
  const others = plan.filter((q) => (q.edge.kind === 'member' || q.edge.kind === 'record') && !q.edge.dashed)
  for (let i = 0; packetEdges.length < spec.packets && others.length; i += 1) packetEdges.push(others[i % others.length])
  const packets = packetEdges.slice(0, spec.packets)
  const rngP = rngFor('packets')
  // One set of three arrays (start, control, end) per layout, so createCore can .set() them into
  // the two instanced attribute triples when the layout pair changes.
  const curve = layouts.map((layout) => {
    const out = { p0: new Float32Array(packets.length * 3), c: new Float32Array(packets.length * 3), p1: new Float32Array(packets.length * 3) }
    const a = [0, 0, 0]
    const m = [0, 0, 0]
    const b = [0, 0, 0]
    const c = [0, 0, 0]
    packets.forEach(({ edge, side }, i) => {
      edgePoint(layout, graph, edge, 0, side, a)
      edgePoint(layout, graph, edge, 0.5, side, m)
      edgePoint(layout, graph, edge, 1, side, b)
      for (let q = 0; q < 3; q += 1) c[q] = 2 * m[q] - (a[q] + b[q]) / 2
      toLocal(out.p0, i * 3, a)
      toLocal(out.c, i * 3, c)
      toLocal(out.p1, i * 3, b)
    })
    return out
  })
  const packetPhase = Float32Array.from(packets, (_, i) => (i + rngP()) / Math.max(1, packets.length))
  const packetArm = Float32Array.from(packets, (q) => q.edge.arm)

  // -- orbiters: dots on two implied ellipses around the core, tilted by the page angle ---------
  const rngO = rngFor('orbiters')
  const orb = spec.orbiters
  const orbiters = {
    count: orb,
    phase: Float32Array.from({ length: orb }, (_, i) => ((i % (orb / 2 || 1)) / (orb / 2 || 1)) * Math.PI * 2 + rngO() * 0.3),
    rx: Float32Array.from({ length: orb }, (_, i) => (i < orb / 2 ? 0.11 : 0.15) + rngO() * 0.004),
    ry: Float32Array.from({ length: orb }, (_, i) => (i < orb / 2 ? 0.04 : 0.055) + rngO() * 0.004),
    tilt: Float32Array.from({ length: orb }, (_, i) => (i < orb / 2 ? 1 : -1) * 0.5585), // 32 degrees
    speed: Float32Array.from({ length: orb }, (_, i) => (i < orb / 2 ? 0.28 : -0.2)),
  }

  const corePos = layouts.map((layout) => {
    const o = [0, 0, 0]
    toLocal(o, 0, layout.pos.core)
    return o
  })

  const f = (arr) => Float32Array.from(arr)
  return {
    tier,
    spec,
    n,
    layouts: layouts.map((l) => l.name),
    fit: layouts.map((l) => l.fit),
    points: {
      pos: pointPos,
      kind: f(pool.kind),
      evidence: f(pool.evidence),
      arm: f(pool.arm),
      tone: f(pool.tone),
      delay: pool.delay,
      seed: pool.seed,
    },
    lines: { count: verts, pos: linePos, delay: lineDelay, kind: lineKind, arm: lineArm, t: lineT },
    packets: { count: packets.length, curve, phase: packetPhase, arm: packetArm },
    orbiters,
    corePos,
  }
}

/** Quad corners for one instanced packet (a unit rectangle, centred). */
export const QUAD = Object.freeze({
  position: new Float32Array([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0]),
  index: new Uint16Array([0, 1, 2, 0, 2, 3]),
})
