// The demo's motion state machine (MOTION §29): one phase per tick, derived from the run state,
// plus the shallow-3D depth of each node (MOTION §9) and each connector's look. Pure; the
// components only map these values to classes and transforms.

export const TICK_MS = 700

// The failure tick is held longer so the error can be read before the retry (MOTION §11).
const HOLD = { error: 2 }

export const tickMs = (phase) => TICK_MS * (HOLD[phase] ?? 1)

// idle is never returned here: before the first tick the demo simply has not started.
export function runPhase(workflow, state) {
  if (state.failing.size) return 'error'
  if (state.retrying.size) return 'retrying'
  if (state.waiting) return 'approval'
  if (state.done) return 'completed'
  if (state.recovered.size) return 'recovered'
  const routers = new Set(workflow.nodes.filter((n) => n.type === 'router').map((n) => n.id))
  if ([...state.working].some((id) => routers.has(id))) return 'decision'
  return 'running'
}

// translateZ in px for each depth plane. Connectors sit on WIRE_Z (behind every node) and are
// scaled by wireScale so their ends still meet the nodes on the z = 0 plane.
export const DEPTH = { focus: 44, front: 26, base: 0, back: -12 }
export const WIRE_Z = -24
export const PERSPECTIVE = 1600
export const wireScale = (perspective = PERSPECTIVE, z = WIRE_Z) => (perspective - z) / perspective

// The node being worked comes toward the viewer; off-run steps recede. While the run waits for the
// visitor, the waiting step comes furthest forward and everything else steps back.
export function nodeDepth(status, phase) {
  if (status === 'waiting') return 'focus'
  if (phase === 'approval') return 'back'
  if (status === 'working' || status === 'failing' || status === 'recovered') return 'front'
  if (status === 'off') return 'back'
  return 'base'
}

// Connector look: error (dashed, danger), on (traced in accent), path (on this run, not reached
// yet) or off (not on this run).
export function edgeStatus(key, state, onPath) {
  if (state.errorEdges.has(key)) return 'error'
  if (state.lit.has(key) || state.travelling.has(key)) return 'on'
  return onPath ? 'path' : 'off'
}
