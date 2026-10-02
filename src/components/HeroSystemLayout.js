// Geometry and timeline for the hero's connected system (MOTION §5). Pure, so it is tested
// (HeroSystemLayout.test.js); HeroSystem.jsx only renders it.

// Canvas units. Node centres sit in a W × H box and are placed in %, so the canvas scales.
export const W = 440
export const H = 440

// `pose` is the abstract system; `line` is the straight workflow it settles into as the hero
// scrolls away (request, agent, decision, system and done in one column, the human branch to the
// side). `depth` 0..1 sets how far the node floats toward the viewer. `tip` places the delayed
// hover hint so it stays inside the canvas.
export const NODES = {
  request: { pose: [92, 58], line: [258, 52], depth: 0.35, tip: { side: 'below', align: 'start' } },
  agent: { pose: [232, 138], line: [258, 130], depth: 1, tip: { side: 'above', align: 'center' } },
  decision: { pose: [172, 228], line: [258, 210], depth: 0.7, tip: { side: 'above', align: 'center' } },
  system: { pose: [330, 300], line: [258, 290], depth: 0.6, tip: { side: 'above', align: 'end' } },
  human: { pose: [80, 318], line: [66, 230], depth: 0.4, tip: { side: 'above', align: 'start' } },
  done: { pose: [214, 392], line: [258, 378], depth: 0.85, tip: { side: 'above', align: 'center' } },
}

// `step` is when a signal travels the edge; `judgment` edges are the human branch (dashed);
// `bend` curves the edge in the abstract pose (it straightens as the system settles).
export const EDGES = [
  { id: 'request-agent', from: 'request', to: 'agent', step: 2, bend: 0.2 },
  { id: 'agent-decision', from: 'agent', to: 'decision', step: 3, bend: 0.16 },
  { id: 'decision-system', from: 'decision', to: 'system', step: 4, bend: -0.14 },
  { id: 'decision-human', from: 'decision', to: 'human', step: 4, bend: 0.12, judgment: true },
  { id: 'system-done', from: 'system', to: 'done', step: 5, bend: 0.16 },
  { id: 'human-done', from: 'human', to: 'done', step: 5, bend: -0.16, judgment: true },
]

// One automation cycle (MOTION §5): request active → signal reaches the agent → decision lights
// → signal branches to the business system (and the human judgment branch) → the result returns
// → DONE → back to idle. 8.2 s in all.
export const STEPS = [
  { id: 'idle', ms: 700 },
  { id: 'request', ms: 1000 },
  { id: 'agent', ms: 1000 },
  { id: 'decision', ms: 1000 },
  { id: 'branch', ms: 1200 },
  { id: 'return', ms: 1000 },
  { id: 'done', ms: 2300 },
]
export const FINAL_STEP = STEPS.length - 1

// The step at which each node becomes the focus. The order matches `hero.system`, so the
// caption under the visual walks through the hints in order.
const FOCUS = { request: 1, agent: 2, decision: 3, system: 4, human: 5, done: 6 }

// 'idle' | 'branch' (the human branch is lit while the system acts) | 'active' | 'lit'
export function nodeState(id, step) {
  const on = FOCUS[id]
  if (step === on) return 'active'
  if (step > on) return 'lit'
  return id === 'human' && step === FOCUS.system ? 'branch' : 'idle'
}

// True while the node is waiting for a signal that is still travelling to it this step, so its
// activation is delayed until the signal arrives.
export function arrivesBySignal(id, step) {
  return nodeState(id, step) !== 'idle' && EDGES.some((e) => e.to === id && e.step === step)
}

// 'idle' | 'run' (the signal is travelling it now) | 'lit'
export function edgeState(edge, step) {
  if (step < edge.step) return 'idle'
  return step === edge.step ? 'run' : 'lit'
}

// The node whose hint the caption shows at this step, or null while idle.
export function focusAt(step) {
  return Object.keys(FOCUS).find((id) => FOCUS[id] === step) ?? null
}

// Scroll progress (0 entering, 1 leaving; see useScrollProgress) → how far the system has
// settled into the straight workflow. Nothing moves until the visual starts to leave.
export function flattenAt(p) {
  const t = Math.min(1, Math.max(0, (p - 0.58) / 0.34))
  return t * t * (3 - 2 * t)
}

export function nodePoint(id, flat = 0) {
  const { pose, line } = NODES[id]
  return [pose[0] + (line[0] - pose[0]) * flat, pose[1] + (line[1] - pose[1]) * flat]
}

const r1 = (v) => Math.round(v * 10) / 10

// A gentle quadratic curve between two nodes that straightens as `flat` reaches 1.
export function edgePath(edge, flat = 0) {
  const [x1, y1] = nodePoint(edge.from, flat)
  const [x2, y2] = nodePoint(edge.to, flat)
  const k = (edge.bend ?? 0) * (1 - flat)
  const cx = (x1 + x2) / 2 - (y2 - y1) * k
  const cy = (y1 + y2) / 2 + (x2 - x1) * k
  return `M${r1(x1)} ${r1(y1)}Q${r1(cx)} ${r1(cy)} ${r1(x2)} ${r1(y2)}`
}

// The node nearest a pointer at (x, y), both -1..1 across the canvas (see usePointer), or null
// when none is within `radius`.
export function nearestNode(x, y, flat = 0, radius = 0.3) {
  let best = null
  let bestD = radius
  for (const id of Object.keys(NODES)) {
    const [nx, ny] = nodePoint(id, flat)
    const d = Math.hypot((nx / W) * 2 - 1 - x, (ny / H) * 2 - 1 - y)
    if (d < bestD) {
      bestD = d
      best = id
    }
  }
  return best
}
