// Pure geometry of the X data core. No three.js, no DOM: the renderer, the SVG fallback and the DOM
// labels all derive their positions from here, so the three stay in agreement and the maths is tested.
//
// World space: the X lies in the xy plane (y up), hub at the origin. A fixed camera looks down -z.
// Arm order matches content.js `modules`: 0 software (top left), 1 ai (top right), 2 cloud (bottom
// right), 3 product (bottom left).

export const ARM_IDS = ['software', 'ai', 'cloud', 'product']
const DIRS = [
  [-1, 1],
  [1, 1],
  [1, -1],
  [-1, -1],
]
export const ARM_LABEL_SIDE = ['top', 'top', 'bottom', 'bottom'] // arm labels sit outside their tip
export const LEVELS = [0.27, 0.52, 0.76, 1] // distance of each node along its arm, the last is the tip
export const NODES_PER_ARM = LEVELS.length
export const TIP = { x: 0.82, y: 0.66 } // world position of an arm tip when not split
export const SPLIT_GAIN = 0.22 // at split 1 a tip sits 22% further from the hub
export const DEFAULT_ASPECT = 1.25
export const CAMERA = { distance: 6, halfMin: 1.12 } // world units visible across the smaller canvas side

export const clamp01 = (n) => (n < 0 ? 0 : n > 1 ? 1 : n)

// x and y of a node at arm-fraction `t` (0 hub .. 1 tip) are scaled by this when the X splits.
export const splitFactor = (t, split) => 1 + SPLIT_GAIN * clamp01(split) * t

// Camera that fits `halfMin` world units across the smaller canvas side. The camera never moves, so
// the projection of the z = 0 plane is a closed form.
export function cameraForAspect(aspect) {
  const a = aspect > 0 ? aspect : DEFAULT_ASPECT
  const halfH = a >= 1 ? CAMERA.halfMin : CAMERA.halfMin / a
  return {
    distance: CAMERA.distance,
    fov: (2 * Math.atan(halfH / CAMERA.distance) * 180) / Math.PI,
    halfW: halfH * a,
    halfH,
  }
}

// World (x, y) on the z = 0 plane to normalised canvas coordinates (0..1, y down).
export function projectToNormalised(x, y, aspect = DEFAULT_ASPECT) {
  const { halfW, halfH } = cameraForAspect(aspect)
  return { x: 0.5 + (0.5 * x) / halfW, y: 0.5 - (0.5 * y) / halfH }
}

// The four arm tips in normalised canvas coordinates for the current `split` (0..1). Pass `out`
// (an array of four objects) to avoid allocating when called every frame.
export function armTipPositions(split = 0, aspect = DEFAULT_ASPECT, out) {
  const f = splitFactor(1, split)
  const res = out || ARM_IDS.map((id) => ({ id, x: 0, y: 0 }))
  for (let a = 0; a < 4; a++) {
    const p = projectToNormalised(DIRS[a][0] * TIP.x * f, DIRS[a][1] * TIP.y * f, aspect)
    res[a].id = ARM_IDS[a]
    res[a].x = Math.min(0.96, Math.max(0.04, p.x))
    res[a].y = Math.min(0.96, Math.max(0.04, p.y))
  }
  return res
}

export const nodeIndex = (arm, level) => 1 + arm * NODES_PER_ARM + level

// Small deterministic generator so the layout is identical on every load (and in tests).
function mulberry32(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const EDGE_ARM = 0 // an edge along an arm
export const EDGE_LATERAL = 1 // always-on link between two corner nodes
export const EDGE_CANDIDATE = 2 // cross-link that fades in and out

// Builds typed arrays for nodes and edges. Static edges come first, candidate cross-links last.
export function buildGraph() {
  const rand = mulberry32(0x58494f4e)
  const nodeCount = 1 + 4 * NODES_PER_ARM
  const positions = new Float32Array(nodeCount * 3)
  const nodeT = new Float32Array(nodeCount) // fraction along the arm, 0 at the hub
  const nodeArm = new Int8Array(nodeCount).fill(-1)
  const nodeLevel = new Int8Array(nodeCount).fill(-1)

  for (let a = 0; a < 4; a++) {
    const [sx, sy] = DIRS[a]
    for (let l = 0; l < NODES_PER_ARM; l++) {
      const i = nodeIndex(a, l)
      const t = LEVELS[l]
      const tip = l === NODES_PER_ARM - 1
      positions[i * 3] = sx * TIP.x * t + (tip ? 0 : (rand() - 0.5) * 0.04)
      positions[i * 3 + 1] = sy * TIP.y * t + (tip ? 0 : (rand() - 0.5) * 0.04)
      positions[i * 3 + 2] = tip ? 0 : (rand() - 0.5) * 0.3 * t // depth only shows when the group rotates
      nodeT[i] = t
      nodeArm[i] = a
      nodeLevel[i] = l
    }
  }

  const ea = []
  const eb = []
  const arm = []
  const kind = []
  const add = (a, b, ar, k) => {
    ea.push(a)
    eb.push(b)
    arm.push(ar)
    kind.push(k)
  }
  for (let a = 0; a < 4; a++) {
    add(0, nodeIndex(a, 0), a, EDGE_ARM)
    for (let l = 1; l < NODES_PER_ARM; l++) add(nodeIndex(a, l - 1), nodeIndex(a, l), a, EDGE_ARM)
  }
  const tip = (a) => nodeIndex(a, NODES_PER_ARM - 1)
  add(tip(0), tip(1), -1, EDGE_LATERAL) // top, corner to corner
  add(tip(3), tip(2), -1, EDGE_LATERAL) // bottom
  const staticEdgeCount = ea.length
  const armEdgeCount = 4 * NODES_PER_ARM // arm edges come first

  // Candidate cross-links: neighbouring arms at the same depth, plus the left and right corner pairs.
  for (let l = 0; l < NODES_PER_ARM - 1; l++) {
    for (let a = 0; a < 4; a++) add(nodeIndex(a, l), nodeIndex((a + 1) % 4, l), -1, EDGE_CANDIDATE)
  }
  add(tip(0), tip(3), -1, EDGE_CANDIDATE)
  add(tip(1), tip(2), -1, EDGE_CANDIDATE)

  const edgeCount = ea.length
  const edgeA = Int32Array.from(ea)
  const edgeB = Int32Array.from(eb)
  const edgeArm = Int8Array.from(arm)
  const edgeKind = Uint8Array.from(kind)
  const edgeLen = new Float32Array(edgeCount)
  for (let e = 0; e < edgeCount; e++) {
    const dx = positions[edgeA[e] * 3] - positions[edgeB[e] * 3]
    const dy = positions[edgeA[e] * 3 + 1] - positions[edgeB[e] * 3 + 1]
    const dz = positions[edgeA[e] * 3 + 2] - positions[edgeB[e] * 3 + 2]
    edgeLen[e] = Math.hypot(dx, dy, dz)
  }

  // Adjacency over the arm edges only (packets travel on these), as flat arrays: the neighbours
  // of node n are adjEdge[adjStart[n] .. adjStart[n + 1]).
  const counts = new Int32Array(nodeCount)
  for (let e = 0; e < armEdgeCount; e++) {
    counts[edgeA[e]]++
    counts[edgeB[e]]++
  }
  const adjStart = new Int32Array(nodeCount + 1)
  for (let n = 0; n < nodeCount; n++) adjStart[n + 1] = adjStart[n] + counts[n]
  const adjEdge = new Int32Array(adjStart[nodeCount])
  const fill = new Int32Array(nodeCount)
  for (let e = 0; e < armEdgeCount; e++) {
    for (const n of [edgeA[e], edgeB[e]]) adjEdge[adjStart[n] + fill[n]++] = e
  }

  return {
    nodeCount,
    positions,
    nodeT,
    nodeArm,
    nodeLevel,
    edgeCount,
    staticEdgeCount,
    armEdgeCount,
    candidateCount: edgeCount - staticEdgeCount,
    edgeA,
    edgeB,
    edgeArm,
    edgeKind,
    edgeLen,
    adjStart,
    adjEdge,
  }
}

// Index of an arm for a module id (content.js `modules[i].id`), or -1.
export const armOfModule = (id) => ARM_IDS.indexOf(id)
