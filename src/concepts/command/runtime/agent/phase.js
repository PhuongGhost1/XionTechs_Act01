// PORTED from the main page: src/workflow/phase.js (read 2026-10-04). Copied and adapted.
// Kept: the tick length and the run phase of each tick (so the printer paces itself exactly like
// the main page's demo, and the failure tick is held longer). Left behind: the depth planes,
// the wire scale and the connector look, which belong to the main page's node graph; the tape has
// its own depth model (tape.js).

export const TICK_MS = 700

// The failure tick is held longer so the error can be read before the retry.
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
