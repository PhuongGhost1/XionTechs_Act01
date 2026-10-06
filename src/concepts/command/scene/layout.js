// Where the data core sits in each phase (docs/concepts/01-command-implementation.md §5). Pure: no
// DOM and no three.js, so it runs under vitest in node.
//
// The page measures the elements marked data-xcore-anchor and hands them in as `anchors`
// (id -> { cx, cy, w, h }, CSS px, origin top-left, y down). From those and the graph this module
// fills, in place and without allocating, one target arrangement per phase:
//
//   0 hero        the X fitted to the `hero` box
//   1 modules     each arm travels to its `module-n` box, shrunk into a compact cluster; the hub fades
//   2 process     the 36 arm nodes regroup into six step clusters at `process-1..6`
//   3 deployments the same six clusters as a small, dim chain inside the `deploy` box
//   4 signals     the chain parked mid-screen (the paper band covers the canvas here)
//   5 contact     everything converges into the logo at the `final` box (the generic X if there is
//                 no logo)
//
// `blendLayout` mixes two neighbouring phases for a fractional phase from phases.js.
//
// World space: origin at the viewport centre, y up, 1 unit = 1 CSS px on the z = 0 plane.
// `domToWorld` is the only place DOM pixels become world units.

export const PHASES = 6
export const ORBIT_SLOTS = 12 // 12 divides evenly into the 1, 4 and 6 clusters a phase can have
export const LOGO_NATURAL_WIDTH = 250 // the logo PNG's own width in px: it is shown at that size at most
export const LOGO_ASPECT = 250 / 46
export const STEP_COUNT = 6

// Scalars every phase carries; blended linearly.
//   core          strength of the yellow energy core at the hub, 0..1
//   coreSize      its diameter in px
//   orbitAlpha    opacity of the orbit particles
//   orbitFraction how many of the orbit particles are shown, 0..1
//   packetAlpha   opacity of the travelling packets
//   spin          how much idle rotation, breathing and pointer lean applies, 0..1
//   drift         node drift amplitude in px
//   logoMix       1 when orbit particles sit on the logo's pixels instead of orbiting
export const SCALAR_KEYS = ['core', 'coreSize', 'orbitAlpha', 'orbitFraction', 'packetAlpha', 'spin', 'drift', 'logoMix']

// How much later (0..1 of the blend) the outermost nodes leave than the hub: arms peel away from
// the centre outward instead of sliding as one rigid body.
const STAGGER = 0.35

const HUB = 0 // graph.js: the hub is node 0

// Nodes drawn in the signal colour besides the hub: picked once so the pattern is stable.
const YELLOW_NODES = [
  [1, 3],
  [2, 6],
  [0, 7],
  [3, 4],
]

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v)
const lerp = (a, b, t) => a + (b - a) * t
const finite = (v) => typeof v === 'number' && Number.isFinite(v)

// DOM px (origin top-left, y down) -> world units (origin viewport centre, y up).
export function domToWorld(px, py, viewport, out = { x: 0, y: 0 }) {
  out.x = px - viewport.width / 2
  out.y = viewport.height / 2 - py
  return out
}

// Stand-in boxes (DOM px) for anchors that are not in the page (yet): a sensible place per id, so
// the core never throws and never ends up at 0,0 by accident.
export function fallbackAnchor(id, viewport, out = { cx: 0, cy: 0, w: 0, h: 0 }) {
  const { width: vw, height: vh } = viewport
  const narrow = vw < 768
  const n = parseInt(id.slice(id.lastIndexOf('-') + 1), 10)
  const set = (cx, cy, w, h) => {
    out.cx = cx
    out.cy = cy
    out.w = w
    out.h = h
    return out
  }
  if (id === 'hero') {
    const size = narrow ? Math.min(vw * 0.78, vh * 0.5) : Math.min(vw * 0.4, vh * 0.7)
    return set(narrow ? vw / 2 : vw * 0.73, narrow ? vh * 0.58 : vh * 0.5, size, size)
  }
  if (id.startsWith('module-') && n >= 1 && n <= 4) {
    return narrow
      ? set(vw * 0.5, vh * (0.2 + 0.2 * (n - 1)), vw * 0.5, vh * 0.14)
      : set(vw * 0.78, vh * (0.22 + 0.19 * (n - 1)), vw * 0.2, vh * 0.16)
  }
  if (id.startsWith('process-') && n >= 1 && n <= STEP_COUNT) {
    return narrow
      ? set(vw * 0.12, vh * (0.12 + 0.15 * (n - 1)), 48, 48)
      : set(vw * (0.12 + (0.76 * (n - 1)) / (STEP_COUNT - 1)), vh * 0.5, 48, 48)
  }
  if (id === 'deploy') return narrow ? set(vw / 2, vh * 0.3, vw * 0.8, vh * 0.15) : set(vw * 0.8, vh * 0.3, vw * 0.25, vh * 0.18)
  if (id === 'final') return set(vw / 2, vh * 0.72, LOGO_NATURAL_WIDTH, LOGO_NATURAL_WIDTH / LOGO_ASPECT)
  const size = Math.min(vw, vh) * 0.3
  return set(vw / 2, vh / 2, size, size)
}

const pxScratch = { cx: 0, cy: 0, w: 0, h: 0 }
const worldScratch = { x: 0, y: 0 }

// Resolves one anchor into world space: out = { x, y, w, h, fallback }. `anchors` is a Map or a
// plain object. A box that is missing, not finite or has no area counts as missing.
export function resolveAnchor(anchors, id, viewport, out) {
  const a = anchors instanceof Map ? anchors.get(id) : anchors?.[id]
  const ok = Boolean(a) && finite(a.cx) && finite(a.cy) && finite(a.w) && finite(a.h) && a.w > 0 && a.h > 0
  const box = ok ? a : fallbackAnchor(id, viewport, pxScratch)
  domToWorld(box.cx, box.cy, viewport, worldScratch)
  out.x = worldScratch.x
  out.y = worldScratch.y
  out.w = box.w
  out.h = box.h
  out.fallback = !ok
  return out
}

// Allocates every buffer once. Nothing below allocates again.
export function createLayout(graph, { orbitCount = 360 } = {}) {
  const N = graph.nodes.length
  const E = graph.edges.length
  const stepOf = new Int8Array(N)
  const stagger = new Float32Array(N)
  const unit = new Float32Array(N * 3) // the X's own coordinates
  const armUnit = new Float32Array(N * 3) // arm re-centred on its own midpoint, for the module clusters
  const stepUnit = new Float32Array(N * 3) // offset inside a step cluster
  const yellowNode = new Float32Array(N)
  const isRing = new Uint8Array(E)

  graph.nodes.forEach((n, i) => {
    unit[i * 3] = n.x
    unit[i * 3 + 1] = n.y
    unit[i * 3 + 2] = n.z
    stagger[i] = n.level / graph.perArm
    if (n.arm < 0) {
      // The hub has no arm: it enters the chain at the first step.
      stepOf[i] = 0
      yellowNode[i] = 1
      return
    }
    const dx = n.x >= 0 ? 1 : -1 // the arm's diagonal direction, recovered from the signs
    const dy = n.y >= 0 ? 1 : -1
    // Module cluster: the arm centred on its midpoint, with a small zig-zag like a signal trace.
    const zig = 0.085 * Math.sin(n.level * 1.7 + n.arm * 1.3)
    armUnit[i * 3] = n.x - dx * 0.5 + (-dy * zig) / 1.4142
    armUnit[i * 3 + 1] = n.y - dy * 0.5 + (dx * zig) / 1.4142
    armUnit[i * 3 + 2] = n.z * 0.8
    // Step clusters: the 36 arm nodes are dealt in order of level, then arm, six to a cluster, so
    // inner nodes land in the first step and the tips in the last. Each cluster is a tiny X.
    const idx = (n.level - 1) * 4 + n.arm
    stepOf[i] = Math.min(STEP_COUNT - 1, Math.floor(idx / 6))
    const rho = 0.4 + 0.12 * (idx % 6)
    stepUnit[i * 3] = dx * 0.7071 * rho
    stepUnit[i * 3 + 1] = dy * 0.7071 * rho
    stepUnit[i * 3 + 2] = n.z * 0.9
    if (YELLOW_NODES.some(([arm, level]) => arm === n.arm && level === n.level)) yellowNode[i] = 1
  })
  graph.edges.forEach((e, k) => {
    isRing[k] = e[2] === 'ring' ? 1 : 0
  })

  const scalars = Array.from({ length: PHASES }, () => Object.fromEntries(SCALAR_KEYS.map((k) => [k, 0])))

  return {
    graph,
    N,
    E,
    orbitCount,
    stepOf,
    stagger,
    unit,
    armUnit,
    stepUnit,
    yellowNode,
    isRing,
    pos: new Float32Array(PHASES * N * 3),
    piv: new Float32Array(PHASES * N * 3),
    vis: new Float32Array(PHASES * N),
    tint: new Float32Array(PHASES * N),
    edgeVis: new Float32Array(PHASES * E),
    scalars,
    orbitCx: new Float32Array(PHASES * ORBIT_SLOTS),
    orbitCy: new Float32Array(PHASES * ORBIT_SLOTS),
    orbitRx: new Float32Array(PHASES * ORBIT_SLOTS),
    orbitRy: new Float32Array(PHASES * ORBIT_SLOTS),
    logoTarget: new Float32Array(orbitCount * 3),
    logoYellow: new Float32Array(orbitCount),
    hasLogo: false,
    // Scratch for updateLayout, so it can run on every scroll without allocating: the box being
    // resolved, and the centres and radii of the clusters of the phase being written.
    box: { x: 0, y: 0, w: 0, h: 0, fallback: false },
    cx: new Float32Array(STEP_COUNT),
    cy: new Float32Array(STEP_COUNT),
    cr: new Float32Array(STEP_COUNT),
  }
}

// ---- per-phase writers ----------------------------------------------------------------------

function setScalars(L, phase, core, coreSize, orbitAlpha, orbitFraction, packetAlpha, spin, drift, logoMix) {
  const s = L.scalars[phase]
  s.core = core
  s.coreSize = coreSize
  s.orbitAlpha = orbitAlpha
  s.orbitFraction = orbitFraction
  s.packetAlpha = packetAlpha
  s.spin = spin
  s.drift = drift
  s.logoMix = logoMix
}

function setNode(L, phase, i, x, y, z, px, py, pz) {
  const o = (phase * L.N + i) * 3
  L.pos[o] = x
  L.pos[o + 1] = y
  L.pos[o + 2] = z
  L.piv[o] = px
  L.piv[o + 1] = py
  L.piv[o + 2] = pz
}

function setEdges(L, phase, arm, ring) {
  for (let e = 0; e < L.E; e++) L.edgeVis[phase * L.E + e] = L.isRing[e] ? ring : arm
}

// Spreads the 12 orbit slots evenly over `count` clusters, taken from L.cx / L.cy / L.cr.
function setOrbit(L, phase, count, radiusScale) {
  for (let s = 0; s < ORBIT_SLOTS; s++) {
    const c = Math.floor((s * count) / ORBIT_SLOTS)
    const o = phase * ORBIT_SLOTS + s
    L.orbitCx[o] = L.cx[c]
    L.orbitCy[o] = L.cy[c]
    L.orbitRx[o] = L.orbitRy[o] = L.cr[c] * radiusScale
  }
}

// The X at its own scale: used by the hero (phase 0) and as the fallback finale (phase 5).
// Returns the half-extent in px.
function placeX(L, phase, cx, cy, size, vis) {
  const half = size * 0.45 // leaves room for point halos and the rotation's parallax
  for (let i = 0; i < L.N; i++) {
    setNode(L, phase, i, cx + L.unit[i * 3] * half, cy + L.unit[i * 3 + 1] * half, L.unit[i * 3 + 2] * half, cx, cy, 0)
    L.vis[phase * L.N + i] = vis
    L.tint[phase * L.N + i] = L.yellowNode[i]
  }
  return half
}

// The six step clusters from the centres and radii held in L.cx / L.cy / L.cr.
function placeSteps(L, phase, vis) {
  for (let i = 0; i < L.N; i++) {
    const j = L.stepOf[i]
    const r = L.cr[j]
    setNode(
      L,
      phase,
      i,
      L.cx[j] + L.stepUnit[i * 3] * r,
      L.cy[j] + L.stepUnit[i * 3 + 1] * r,
      L.stepUnit[i * 3 + 2] * r,
      L.cx[j],
      L.cy[j],
      0,
    )
    L.vis[phase * L.N + i] = i === HUB ? 0 : vis // the hub has faded by now
    L.tint[phase * L.N + i] = L.yellowNode[i]
  }
}

// Fills every phase from the current anchors. `viewport` is { width, height } in CSS px.
// `logo` is optional: { points: [{ x, y, yellow }] in unit space (image width = 1, y up), aspect }.
export function updateLayout(L, anchors, viewport, logo) {
  const { N, box } = L

  // Phase 0: the X in the hero box.
  resolveAnchor(anchors, 'hero', viewport, box)
  const heroX = box.x
  const heroY = box.y
  const heroSize = Math.min(box.w, box.h)
  const heroHalf = placeX(L, 0, heroX, heroY, heroSize, 1)
  setEdges(L, 0, 1, 1)
  setScalars(L, 0, 1, heroSize * 0.34, 0.5, 1, 1, 1, heroSize * 0.01, 0)
  L.cx[0] = heroX
  L.cy[0] = heroY
  L.cr[0] = heroHalf
  setOrbit(L, 0, 1, 1.15)

  // Phase 1: each arm to its module box (cluster k = arm k). The hub stays where the X was and fades.
  for (let k = 0; k < 4; k++) {
    resolveAnchor(anchors, `module-${k + 1}`, viewport, box)
    L.cx[k] = box.x
    L.cy[k] = box.y
    L.cr[k] = Math.min(box.w, box.h) * 0.85
  }
  for (let i = 0; i < N; i++) {
    const arm = L.graph.nodes[i].arm
    if (arm < 0) {
      setNode(L, 1, i, heroX, heroY, 0, heroX, heroY, 0)
      L.vis[N + i] = 0
    } else {
      const sc = L.cr[arm]
      setNode(
        L,
        1,
        i,
        L.cx[arm] + L.armUnit[i * 3] * sc,
        L.cy[arm] + L.armUnit[i * 3 + 1] * sc,
        L.armUnit[i * 3 + 2] * sc,
        L.cx[arm],
        L.cy[arm],
        0,
      )
      L.vis[N + i] = 1
    }
    L.tint[N + i] = L.yellowNode[i]
  }
  setEdges(L, 1, 1, 0) // ring edges would stretch across the text between the clusters
  setScalars(L, 1, 0, heroSize * 0.2, 0.5, 0.8, 0.9, 0.6, 2, 0)
  setOrbit(L, 1, 4, 0.62)

  // Phase 2: six step clusters at the process anchors.
  for (let j = 0; j < STEP_COUNT; j++) {
    resolveAnchor(anchors, `process-${j + 1}`, viewport, box)
    L.cx[j] = box.x
    L.cy[j] = box.y
    L.cr[j] = clamp(Math.min(box.w, box.h) * 0.42, 9, 26)
  }
  placeSteps(L, 2, 1)
  setEdges(L, 2, 1, 0.5)
  setScalars(L, 2, 0, 0, 0.42, 0.5, 1, 0.3, 1.2, 0)
  setOrbit(L, 2, STEP_COUNT, 1.9)

  // Phase 3: a small dim chain inside the deploy box.
  resolveAnchor(anchors, 'deploy', viewport, box)
  const spacing = (box.w * 0.84) / (STEP_COUNT - 1)
  const chainR = clamp(Math.min(spacing * 0.26, box.h * 0.3), 3, 12)
  for (let j = 0; j < STEP_COUNT; j++) {
    L.cx[j] = box.x + (j - (STEP_COUNT - 1) / 2) * spacing
    L.cy[j] = box.y
    L.cr[j] = chainR
  }
  placeSteps(L, 3, 0.55)
  setEdges(L, 3, 1, 0.4)
  setScalars(L, 3, 0, 0, 0.22, 0.3, 0.5, 0.2, 1, 0)
  setOrbit(L, 3, STEP_COUNT, 2.2)

  // Phase 4: the chain parked mid-screen, dimmer. The paper band hides it; it is where the core
  // leaves from when the band scrolls away.
  const parkSpacing = Math.min((viewport.width * 0.5) / (STEP_COUNT - 1), 90)
  for (let j = 0; j < STEP_COUNT; j++) {
    L.cx[j] = (j - (STEP_COUNT - 1) / 2) * parkSpacing
    L.cy[j] = -viewport.height * 0.2
    L.cr[j] = 8
  }
  placeSteps(L, 4, 0.4)
  setEdges(L, 4, 1, 0.3)
  setScalars(L, 4, 0, 0, 0.2, 0.3, 0.35, 0.2, 0.8, 0)
  setOrbit(L, 4, STEP_COUNT, 2.25)

  // Phase 5: the logo, or the generic X when there is none.
  resolveAnchor(anchors, 'final', viewport, box)
  const points = logo && logo.points && logo.points.length > 0 ? logo.points : null
  L.hasLogo = points !== null
  L.cx[0] = box.x
  L.cy[0] = box.y
  if (points) {
    const aspect = logo.aspect > 0 ? logo.aspect : LOGO_ASPECT
    // Natural size, never larger: the PNG is only a placeholder for the official SVG.
    const width = Math.min(box.w, box.h * aspect, LOGO_NATURAL_WIDTH)
    const M = points.length
    for (let i = 0; i < N; i++) {
      const p = points[i % M]
      setNode(L, 5, i, box.x + p.x * width, box.y + p.y * width, 0, box.x, box.y, 0)
      L.vis[5 * N + i] = 1
      L.tint[5 * N + i] = p.yellow ? 1 : 0
    }
    for (let j = 0; j < L.orbitCount; j++) {
      const p = points[(j + N) % M]
      L.logoTarget[j * 3] = box.x + p.x * width
      L.logoTarget[j * 3 + 1] = box.y + p.y * width
      L.logoTarget[j * 3 + 2] = 0
      L.logoYellow[j] = p.yellow ? 1 : 0
    }
    setEdges(L, 5, 0, 0)
    setScalars(L, 5, 0, 0, 1, 1, 0, 0, 0, 1)
    L.cr[0] = width * 0.5
    setOrbit(L, 5, 1, 1)
  } else {
    const size = clamp(box.h * 1.6, 64, 120)
    L.cr[0] = placeX(L, 5, box.x, box.y, size, 1)
    setEdges(L, 5, 1, 0.8)
    setScalars(L, 5, 0, 0, 0.6, 1, 0.8, 0.5, size * 0.01, 0)
    setOrbit(L, 5, 1, 1.15)
  }
}

// Convenience for tests and one-off use.
export function computeLayout(graph, anchors, viewport, { orbitCount = 360, logo } = {}) {
  const L = createLayout(graph, { orbitCount })
  updateLayout(L, anchors, viewport, logo)
  return L
}

// ---- blending -------------------------------------------------------------------------------

// Output buffers for blendLayout, sized from a layout.
export function createBlend(L) {
  return {
    phase: 0,
    pos: new Float32Array(L.N * 3),
    piv: new Float32Array(L.N * 3),
    vis: new Float32Array(L.N),
    tint: new Float32Array(L.N),
    edgeVis: new Float32Array(L.E),
    scalars: Object.fromEntries(SCALAR_KEYS.map((k) => [k, 0])),
    orbitCx: new Float32Array(ORBIT_SLOTS),
    orbitCy: new Float32Array(ORBIT_SLOTS),
    orbitRx: new Float32Array(ORBIT_SLOTS),
    orbitRy: new Float32Array(ORBIT_SLOTS),
  }
}

// Mixes phase floor(phase) with the next one by the fractional part. Per node the mix is
// staggered (see STAGGER) but is exactly the lower phase at 0 and exactly the upper at 1.
export function blendLayout(L, phase, out) {
  const p = clamp(finite(phase) ? phase : 0, 0, PHASES - 1)
  const a = Math.min(Math.floor(p), PHASES - 2)
  const f = p - a
  const b = a + 1
  const { N, E } = L
  out.phase = p

  for (let i = 0; i < N; i++) {
    const w = clamp((f - L.stagger[i] * STAGGER) / (1 - STAGGER), 0, 1)
    const ia = (a * N + i) * 3
    const ib = (b * N + i) * 3
    for (let k = 0; k < 3; k++) {
      out.pos[i * 3 + k] = lerp(L.pos[ia + k], L.pos[ib + k], w)
      out.piv[i * 3 + k] = lerp(L.piv[ia + k], L.piv[ib + k], w)
    }
    out.vis[i] = lerp(L.vis[a * N + i], L.vis[b * N + i], w)
    out.tint[i] = lerp(L.tint[a * N + i], L.tint[b * N + i], w)
  }
  for (let e = 0; e < E; e++) out.edgeVis[e] = lerp(L.edgeVis[a * E + e], L.edgeVis[b * E + e], f)
  const sa = L.scalars[a]
  const sb = L.scalars[b]
  for (let k = 0; k < SCALAR_KEYS.length; k++) {
    const key = SCALAR_KEYS[k]
    out.scalars[key] = lerp(sa[key], sb[key], f)
  }
  for (let s = 0; s < ORBIT_SLOTS; s++) {
    const ia = a * ORBIT_SLOTS + s
    const ib = b * ORBIT_SLOTS + s
    out.orbitCx[s] = lerp(L.orbitCx[ia], L.orbitCx[ib], f)
    out.orbitCy[s] = lerp(L.orbitCy[ia], L.orbitCy[ib], f)
    out.orbitRx[s] = lerp(L.orbitRx[ia], L.orbitRx[ib], f)
    out.orbitRy[s] = lerp(L.orbitRy[ia], L.orbitRy[ib], f)
  }
  return out
}
