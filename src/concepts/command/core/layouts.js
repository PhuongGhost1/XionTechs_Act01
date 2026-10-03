import { ARM_ORDER, X_TIPS } from './geometry.js'
import { MARK_BOX, sampleMark } from './mark.js'
import { bell, rngFor } from './rng.js'

// The five layouts of the X data core (doc 6.2), as PURE functions of the graph and a seeded rng:
//
//   layoutX      L0  the hero X: four braided arms crossing at the yellow core, hubs on the tips
//   layoutArms   L1  the same arms pulled apart into four clusters (WHAT WE CAN DEPLOY)
//   layoutLine   L2  everything collapsed onto one horizontal line with six method stops (THE LINE)
//   layoutField  L3  the points scattered along the two page diagonals (the finale before it converges)
//   layoutMark   L4  every point on the XionTechs X mark (mark.js)
//
// Every layout returns the SAME node ids (all of graph.nodes, the six method steps parked on the
// core where a layout does not show them), in a UNIT BOX: x and y in [0, 1], y down, z a small
// depth of at most 0.05. The SVG figure draws these positions and three/ morphs between them, so
// the two renderers cannot drift. Nothing here reads the DOM or Math.random.
//
// Positions are for the node SHAPES. The 1,200 structural points (the braid that makes the arms
// read as strands) are laid out by poolPositions() from the same node positions and the same edge
// curves, so a point rides its edge from one layout to the next.

/** How a layout is fitted to a non-square anchor: a square box (centred), or stretched to the box. */
export const FIT = Object.freeze({ x: 'square', arms: 'square', line: 'stretch', field: 'stretch', mark: 'square' })

const CORE = [0.5, 0.5]
const MARGIN = 0.02 // nothing is placed closer than this to the edge of the unit box
const Z_ARM = 0.04 // depth of the two crossing diagonals (+-0.08 R, doc 6.3)

// Where the six method stops sit on the line, and the line's height (unit box).
export const LINE_Y = 0.5
export const LINE_X0 = 0.06
export const LINE_X1 = 0.94
export const LINE_STOPS = Object.freeze(Array.from({ length: 6 }, (_, i) => LINE_X0 + (i * (LINE_X1 - LINE_X0)) / 5))

const clampBox = (v) => (v < MARGIN ? MARGIN : v > 1 - MARGIN ? 1 - MARGIN : v)

// ---------------------------------------------------------------------------------------------
// Arm frame: a position along an arm and across it
// ---------------------------------------------------------------------------------------------

// For each arm: v is the vector from the core to the hub (from geometry.js X_TIPS, so the SVG tips
// and the DOM tags agree) and n the same vector turned 90 degrees. A point is C + v * a + n * b.
const ARMS = ARM_ORDER.map((id, i) => {
  const tip = X_TIPS[id]
  const vx = tip.x - 0.5
  const vy = tip.y - 0.5
  return { id, index: i, vx, vy, nx: -vy, ny: vx, z: i % 2 === 0 ? Z_ARM : -Z_ARM }
})

// The two arm layouts differ only in these numbers.
//   a0, a1   where along the arm the strands start and the hub sits (1 = the tip)
//   bow      how far the two braided strands swing out, in arm widths
//   spread   how far services and records stand off the axis
//   leafR    radius of a service's fan of leaves, in box units
const SPEC = {
  x: { a0: 0, a1: 1, bow: 0.06, spread: 1, leafR: 0.1 },
  arms: { a0: 0.3, a1: 0.97, bow: 0.085, spread: 1.15, leafR: 0.115 },
}

/** Position along the arm: conceptual a (0 start, 1 hub) to the arm's own scale. */
const along = (spec, a) => spec.a0 + a * (spec.a1 - spec.a0)

/** The braid: the sideways offset (arm widths) of a strand at conceptual position a. */
export const braid = (spec, a, side) => side * spec.bow * Math.sin(Math.PI * a) * Math.cos(2 * Math.PI * a)

const armPoint = (arm, spec, a, b, out) => {
  const s = along(spec, a)
  out[0] = CORE[0] + arm.vx * s + arm.nx * b
  out[1] = CORE[1] + arm.vy * s + arm.ny * b
  out[2] = arm.z * s
  return out
}

// Services sit ON the braid, alternating sides; one lone service sits between the strands.
const serviceA = (count) => (count === 1 ? [0.5] : count === 2 ? [0.4, 0.72] : [0.28, 0.5, 0.72])
const rot = (x, y, deg) => {
  const r = (deg * Math.PI) / 180
  const c = Math.cos(r)
  const s = Math.sin(r)
  return [x * c - y * s, x * s + y * c]
}

// ---------------------------------------------------------------------------------------------
// Layout: X and ARMS
// ---------------------------------------------------------------------------------------------

function layoutArmsLike(name, graph) {
  const spec = SPEC[name]
  const pos = {}
  const local = {} // arm layouts only: { a, side } of a service, so its hub edge can ride the braid
  const tmp = [0, 0, 0]
  const put = (id, p) => {
    pos[id] = [clampBox(p[0]), clampBox(p[1]), p[2]]
  }

  put('core', [CORE[0], CORE[1], 0])
  const kids = (id) => graph.nodes.filter((n) => n.parent === id)

  for (const arm of ARMS) {
    const hub = graph.nodes.find((n) => n.kind === 'hub' && n.arm === arm.index)
    put(hub.id, armPoint(arm, spec, 1, 0, tmp))

    const services = kids(hub.id).filter((n) => n.kind === 'service')
    const aList = serviceA(services.length)
    services.forEach((svc, j) => {
      const a = aList[j]
      const side = services.length === 1 ? 0 : j % 2 === 0 ? 1 : -1
      const b = braid(spec, a, side) * spec.spread
      put(svc.id, armPoint(arm, spec, a, b, tmp))
      local[svc.id] = { a, side }

      // Leaves fan out on the outer side of the braid (both sides for a lone service).
      const leaves = kids(svc.id)
      const origin = pos[svc.id]
      const ax = arm.vx / Math.hypot(arm.vx, arm.vy)
      const ay = arm.vy / Math.hypot(arm.vx, arm.vy)
      const ox = arm.nx / Math.hypot(arm.nx, arm.ny)
      const oy = arm.ny / Math.hypot(arm.nx, arm.ny)
      leaves.forEach((leaf, l) => {
        const sideOf = side === 0 ? (l % 2 === 0 ? 1 : -1) : side
        const group = side === 0 ? leaves.filter((_, q) => (q % 2 === 0 ? 1 : -1) === sideOf) : leaves
        const rank = side === 0 ? Math.floor(l / 2) : l
        const step = Math.min(30, 100 / Math.max(1, group.length - 1))
        const phi = (rank - (group.length - 1) / 2) * step
        const [fx, fy] = rot(sideOf * ox, sideOf * oy, -sideOf * phi)
        const r = spec.leafR * (1 + 0.14 * (rank % 2))
        // A touch of the arm axis pushes the fan toward the hub, so edges point outward.
        const mx = fx * 0.9 + ax * 0.28
        const my = fy * 0.9 + ay * 0.28
        const ml = Math.hypot(mx, my) || 1
        put(leaf.id, [origin[0] + (mx / ml) * r, origin[1] + (my / ml) * r, origin[2]])
      })
    })

    // Records and their pending satellites stand off the axis near the hub, on whichever side
    // has more room (the tips sit near the box edge).
    const records = kids(hub.id).filter((n) => n.kind === 'record')
    records.forEach((rec, q) => {
      const a = q === 0 ? 0.9 : 0.64
      const bAbs = (q === 0 ? 0.36 : 0.42) * spec.spread
      let best = null
      for (const sign of [1, -1]) {
        armPoint(arm, spec, a, sign * bAbs, tmp)
        const room = Math.min(tmp[0], tmp[1], 1 - tmp[0], 1 - tmp[1])
        if (!best || room > best.room + 1e-9) best = { room, sign, p: [...tmp] }
      }
      put(rec.id, best.p)
      const sat = kids(rec.id)[0]
      if (sat) {
        const dx = best.p[0] - CORE[0]
        const dy = best.p[1] - CORE[1]
        const dl = Math.hypot(dx, dy) || 1
        const gap = 0.075 * (name === 'arms' ? 1.1 : 1)
        put(sat.id, [best.p[0] + (dx / dl) * gap, best.p[1] + (dy / dl) * gap, best.p[2]])
      }
    })
  }

  // The six method steps are not shown here: they wait on the core.
  for (const n of graph.nodes) if (n.kind === 'method') put(n.id, [CORE[0], CORE[1], 0])
  return { name, fit: FIT[name], pos, local, spec, tone: null }
}

// The arm layouts are fully determined by the graph (no random placement): `rng` is accepted so
// all five layouts share one signature.
export const layoutX = (graph, _rng) => layoutArmsLike('x', graph)
export const layoutArms = (graph, _rng) => layoutArmsLike('arms', graph)

// ---------------------------------------------------------------------------------------------
// Layout: LINE
// ---------------------------------------------------------------------------------------------

/**
 * One horizontal line. The core is the REQUEST stop, the six method steps stand on the line at
 * LINE_STOPS, and every other node is trace dust strewn along it, thickest near REQUEST.
 */
export function layoutLine(graph, rng = rngFor('layout.line')) {
  const pos = {}
  const steps = graph.nodes.filter((n) => n.kind === 'method')
  pos.core = [LINE_STOPS[0], LINE_Y, 0]
  steps.forEach((n, i) => {
    pos[n.id] = [LINE_STOPS[i], LINE_Y, 0]
  })
  const reach = { hub: [0.1, 0.22], service: [0.1, 0.5], record: [0.2, 0.62], status: [0.3, 0.7], leaf: [0.1, 0.9] }
  for (const n of graph.nodes) {
    if (n.kind === 'core' || n.kind === 'method') continue
    const [lo, hi] = reach[n.kind]
    // Bias toward REQUEST: the arms collapse into it, the dust trails off to the right.
    const u = rng() ** 1.5
    pos[n.id] = [clampBox(LINE_X0 + (lo + (hi - lo) * u) * (LINE_X1 - LINE_X0) * 0.95), clampBox(LINE_Y + bell(rng) * 0.045), 0]
  }
  return { name: 'line', fit: FIT.line, pos, local: {}, spec: null, tone: null }
}

// ---------------------------------------------------------------------------------------------
// Layout: FIELD
// ---------------------------------------------------------------------------------------------

/** A scatter point along the two diagonals of the box (about +-32 degrees at 16:10), or loose. */
export function fieldPoint(rng, out) {
  const t = 0.04 + 0.92 * rng()
  const diag = rng() < 0.5 ? 1 : -1
  const loose = rng() < 0.3
  const jx = bell(rng) * (loose ? 0.22 : 0.05)
  const jy = bell(rng) * (loose ? 0.22 : 0.05)
  out[0] = clampBox(t + jx)
  out[1] = clampBox(0.5 + diag * (t - 0.5) + jy)
  out[2] = 0
  return out
}

export function layoutField(graph, rng = rngFor('layout.field')) {
  const pos = {}
  for (const n of graph.nodes) pos[n.id] = fieldPoint(rng, [0, 0, 0])
  // The yellow core stays in the middle of the field: it is the one point that never moves far.
  pos.core = [0.5, 0.5, 0]
  return { name: 'field', fit: FIT.field, pos, local: {}, spec: null, tone: null }
}

// ---------------------------------------------------------------------------------------------
// Layout: MARK
// ---------------------------------------------------------------------------------------------

// The mark fills 90% of the unit width and is centred. Its box is 100 x 100 with the mark's own
// aspect inside it, so a unit of y in the box is the same length as a unit of x.
const MARK_FILL = 0.9
export const markToUnit = (x, y) => [0.5 + ((x - MARK_BOX / 2) / MARK_BOX) * MARK_FILL, 0.5 + ((y - MARK_BOX / 2) / MARK_BOX) * MARK_FILL]

export function layoutMark(graph, rng = rngFor('layout.mark')) {
  const pos = {}
  const tone = {}
  const s = sampleMark(graph.nodes.length, rng, 0.35)
  graph.nodes.forEach((n, i) => {
    const [x, y] = markToUnit(s.x[i], s.y[i])
    pos[n.id] = [x, y, 0]
    tone[n.id] = s.tone[i]
  })
  return { name: 'mark', fit: FIT.mark, pos, local: {}, spec: null, tone }
}

export const LAYOUT_FNS = Object.freeze({ x: layoutX, arms: layoutArms, line: layoutLine, field: layoutField, mark: layoutMark })

const memo = new WeakMap()

/** The default (seeded) layout of a graph, built once per graph. */
export function layoutFor(name, graph) {
  let byName = memo.get(graph)
  if (!byName) memo.set(graph, (byName = {}))
  return (byName[name] ??= LAYOUT_FNS[name](graph))
}

// ---------------------------------------------------------------------------------------------
// Edge curves: the same geometry for the SVG strokes and the structural points
// ---------------------------------------------------------------------------------------------

/** The sides of an edge that are drawn: a hub edge is two braided strands, any other is one. */
export const edgeSides = (edge) => (edge.kind === 'hub' ? [-1, 1] : [0])

const lerp3 = (a, b, t, out) => {
  out[0] = a[0] + (b[0] - a[0]) * t
  out[1] = a[1] + (b[1] - a[1]) * t
  out[2] = a[2] + (b[2] - a[2]) * t
  return out
}

/**
 * A point on an edge in a layout. t runs from the edge's `from` node (0) to its `to` node (1).
 * `side` picks a braided strand (-1 or 1) on a hub edge; it is ignored elsewhere.
 * In the two arm layouts a hub edge rides the braid, a member edge from a hub to a service rides
 * the same strand, and a record edge bows a little; everything else is a straight line.
 */
export function edgePoint(layout, graph, edge, t, side = 0, out = [0, 0, 0]) {
  const a = layout.pos[edge.from]
  const b = layout.pos[edge.to]
  const spec = layout.spec
  if (spec && edge.arm >= 0) {
    const arm = ARMS[edge.arm]
    if (edge.kind === 'hub') {
      return armPoint(arm, spec, t, braid(spec, t, side) * spec.spread, out)
    }
    if (edge.kind === 'member' && layout.local[edge.to]) {
      const { a: sa, side: sside } = layout.local[edge.to]
      const at = 1 - t * (1 - sa)
      return armPoint(arm, spec, at, braid(spec, at, sside) * spec.spread, out)
    }
    if (edge.kind === 'record') {
      lerp3(a, b, t, out)
      // Bow perpendicular to the edge, a quarter of its length at most.
      const dx = b[0] - a[0]
      const dy = b[1] - a[1]
      const k = Math.sin(Math.PI * t) * 0.1
      out[0] += -dy * k
      out[1] += dx * k
      return out
    }
  }
  return lerp3(a, b, t, out)
}

/** The polyline of an edge side: `segments` + 1 points as a flat [x, y, z, ...] array. */
export function edgePolyline(layout, graph, edge, side = 0, segments = 24) {
  const out = new Float32Array((segments + 1) * 3)
  const p = [0, 0, 0]
  for (let i = 0; i <= segments; i += 1) {
    edgePoint(layout, graph, edge, i / segments, side, p)
    out.set(p, i * 3)
  }
  return out
}

// ---------------------------------------------------------------------------------------------
// The point pool: the same N points in every layout
// ---------------------------------------------------------------------------------------------

/** Shape codes (aKind in the shader). */
export const KIND = Object.freeze({ structural: 0, core: 1, hub: 2, service: 3, leaf: 4, record: 5, status: 6, method: 7 })
/** Evidence codes (aEvidence). */
export const EVIDENCE = Object.freeze({ fact: 0, pending: 1, illustrative: 2, method: 3 })

// How the structural points are shared out over the edges.
const EDGE_SHARE = { hub: 0.4, member: 0.34, record: 0.075, pending: 0.02, method: 0.1 }

/**
 * Builds the pool. The first graph.nodes.length points ARE the semantic nodes (drawn as shapes);
 * the rest are structural points riding the edges. Everything is seeded.
 * @returns {{ n:number, nodeCount:number, kind:Uint8Array, evidence:Uint8Array, arm:Int8Array,
 *   tone:Uint8Array, delay:Float32Array, seed:Float32Array, edge:Int16Array, t:Float32Array,
 *   side:Int8Array, jitter:Float32Array, edges:object[] }}
 */
export function buildPool(graph, n, seedKey = 'pool') {
  const rng = rngFor(seedKey)
  const nodeCount = graph.nodes.length
  const edges = graph.edges
  const kind = new Uint8Array(n)
  const evidence = new Uint8Array(n)
  const arm = new Int8Array(n)
  const tone = new Uint8Array(n)
  const delay = new Float32Array(n)
  const seed = new Float32Array(n)
  const edge = new Int16Array(n).fill(-1)
  const t = new Float32Array(n)
  const side = new Int8Array(n)
  const jitter = new Float32Array(n * 2)

  // Nodes first.
  graph.nodes.forEach((node, i) => {
    kind[i] = KIND[node.kind]
    evidence[i] = EVIDENCE[node.evidence]
    arm[i] = node.arm
  })

  // Quota per edge, from the share of its kind, by largest remainder so the total is exact.
  const structural = Math.max(0, n - nodeCount)
  const perKind = {}
  for (const e of edges) perKind[e.kind] = (perKind[e.kind] ?? 0) + 1
  const weights = edges.map((e) => EDGE_SHARE[e.kind] / perKind[e.kind])
  const wsum = weights.reduce((a, b) => a + b, 0)
  const raw = weights.map((w) => (w / wsum) * structural)
  const quota = raw.map(Math.floor)
  let rest = structural - quota.reduce((a, b) => a + b, 0)
  raw
    .map((r, i) => [r - Math.floor(r), i])
    .sort((p, q) => q[0] - p[0] || p[1] - q[1])
    .forEach(([, i]) => {
      if (rest > 0) {
        quota[i] += 1
        rest -= 1
      }
    })

  let at = nodeCount
  edges.forEach((e, ei) => {
    const target = graph.byId.get(e.to)
    for (let k = 0; k < quota[ei]; k += 1) {
      kind[at] = KIND.structural
      evidence[at] = EVIDENCE[target.evidence]
      arm[at] = e.arm
      edge[at] = ei
      t[at] = (k + rng()) / quota[ei]
      side[at] = e.kind === 'hub' ? (k % 2 === 0 ? -1 : 1) : 0
      jitter[at * 2] = bell(rng)
      jitter[at * 2 + 1] = bell(rng)
      at += 1
    }
  })

  // Per-point seed, and the mark tones. Structural points take the mark's samples in order.
  for (let i = 0; i < n; i += 1) seed[i] = rng()
  const mark = layoutMark(graph)
  graph.nodes.forEach((node, i) => {
    tone[i] = mark.tone[node.id]
  })
  const ms = sampleMark(Math.max(1, structural), rngFor(`${seedKey}.mark`), 0.45)
  for (let i = 0; i < structural; i += 1) tone[nodeCount + i] = ms.tone[i]

  // Delay: distance from the core in the X layout, 0..1, so a morph ripples outward.
  const lx = layoutX(graph)
  const p = [0, 0, 0]
  for (let i = 0; i < n; i += 1) {
    if (i < nodeCount) {
      const q = lx.pos[graph.nodes[i].id]
      delay[i] = Math.min(1, Math.hypot(q[0] - 0.5, q[1] - 0.5) / 0.55)
    } else {
      edgePoint(lx, graph, edges[edge[i]], t[i], side[i], p)
      delay[i] = Math.min(1, Math.hypot(p[0] - 0.5, p[1] - 0.5) / 0.55)
    }
  }
  return { n, nodeCount, kind, evidence, arm, tone, delay, seed, edge, t, side, jitter, edges, markSamples: ms }
}

// How far a structural point strays from its edge in each layout (unit box).
const JITTER = { x: 0.0045, arms: 0.0055, line: 0.01, field: 0, mark: 0 }

/**
 * Where every pool point sits in a layout, as a flat Float32Array [x, y, z, ...] of length n * 3.
 * Nodes at their node position; structural points on their edge (x, arms, line), scattered along
 * the diagonals (field) or on the mark (mark).
 */
export function poolPositions(layout, graph, pool) {
  const out = new Float32Array(pool.n * 3)
  const p = [0, 0, 0]
  graph.nodes.forEach((node, i) => {
    const q = layout.pos[node.id]
    out[i * 3] = q[0]
    out[i * 3 + 1] = q[1]
    out[i * 3 + 2] = q[2]
  })
  const rng = rngFor(`field.${pool.n}`)
  for (let i = pool.nodeCount; i < pool.n; i += 1) {
    const o = i * 3
    if (layout.name === 'mark') {
      const j = i - pool.nodeCount
      const [x, y] = markToUnit(pool.markSamples.x[j], pool.markSamples.y[j])
      out[o] = x
      out[o + 1] = y
      out[o + 2] = 0
    } else if (layout.name === 'field') {
      fieldPoint(rng, p)
      out[o] = p[0]
      out[o + 1] = p[1]
      out[o + 2] = 0
    } else {
      edgePoint(layout, graph, pool.edges[pool.edge[i]], pool.t[i], pool.side[i], p)
      const j = JITTER[layout.name]
      out[o] = clampBox(p[0] + pool.jitter[i * 2] * j)
      out[o + 1] = clampBox(p[1] + pool.jitter[i * 2 + 1] * j)
      out[o + 2] = p[2]
    }
  }
  return out
}

/**
 * Every edge side that is ever drawn as a line, in a fixed order, so the SVG strokes and the WebGL
 * line buffers agree. A member edge from a hub to a service is not drawn: in the arm layouts it
 * would lie on the braid strand that already carries it. Each entry: { edge, ei, side }.
 */
export function linePlan(graph) {
  const plan = []
  graph.edges.forEach((edge, ei) => {
    if (edge.kind === 'member' && graph.byId.get(edge.from).kind === 'hub') return
    for (const side of edgeSides(edge)) plan.push({ edge, ei, side })
  })
  return plan
}
