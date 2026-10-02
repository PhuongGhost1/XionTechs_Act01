// Words for the demo's status line and execution log, derived from the run at a tick (MOTION §8:
// "small execution log"). Pure; `copy` is aiAgents.run.status / aiAgents.run.log from site.js.
import { totalTicks } from './run'

export const fill = (template, vars) => template.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '')

const drillOf = (workflow, run) => (run.drillId ? workflow.drills?.find((d) => d.id === run.drillId) ?? null : null)

// Every log entry up to `rawTick`, oldest first: { key, tone, text, detail? }. Keys are stable
// while the run moves forward, so a list can animate only the newest rows.
export function executionLog(workflow, run, rawTick, copy) {
  const end = Math.min(rawTick, totalTicks(run))
  const nodes = Object.fromEntries(workflow.nodes.map((n) => [n.id, n]))
  const drill = drillOf(workflow, run)
  const flagProblem = drill && run.retries.size === 0
  const decisionId = workflow.decision?.nodeId
  const entries = []
  const push = (t, tone, text, detail) => entries.push({ key: `${t}.${entries.length}`, tone, text, ...(detail ? { detail } : {}) })
  const titleOf = (step) => nodes[run.steps[step][0]].title

  for (let t = 0; t <= end; t++) {
    if (t % 2 === 1) {
      // Odd ticks are travel ticks; around a retry step they carry the failure and the recovery.
      if (run.retries.has((t + 1) / 2)) push(t, 'error', run.fault ?? copy.failed, titleOf((t + 1) / 2))
      if (run.retries.has((t - 1) / 2)) push(t, 'success', copy.recovered, titleOf((t - 1) / 2))
      // An outcome counts as completed on the tick after its work tick, when its card turns
      // active and the run is done, so the log never runs ahead of the graph and status line.
      for (const id of run.steps[(t - 1) / 2] ?? []) {
        if (nodes[id].type === 'outcome') push(t, 'done', copy.completed, nodes[id].title)
      }
      continue
    }
    const i = t / 2
    const step = run.steps[i]
    if (!step) continue
    if (run.retries.has(i)) {
      push(t, 'retry', copy.retrying)
      continue
    }
    for (const id of step) {
      const node = nodes[id]
      if (node.type === 'trigger') push(t, 'signal', copy.received, node.title)
      else if (node.type === 'router') push(t, 'decision', copy.decided, drill ? undefined : run.branchLabel)
      else if (node.type === 'outcome') continue // logged as completed on the next tick
      else if (id === decisionId) {
        push(t, 'approval', copy.waiting)
        if (run.decision) push(t, run.decision === 'approve' ? 'approved' : 'rejected', copy[run.decision === 'approve' ? 'approved' : 'rejected'])
      } else push(t, 'working', fill(copy.working, { step: node.title }))
      if (flagProblem && id === run.problemNodeId && !entries.some((e) => e.tone === 'problem')) push(t, 'problem', drill.label)
    }
  }
  return entries
}

// One-line status for the aria-live region above the workflow.
export function statusLine(workflow, run, state, copy) {
  const drill = drillOf(workflow, run)
  const problem = drill?.label ?? ''
  const nodes = Object.fromEntries(workflow.nodes.map((n) => [n.id, n]))
  if (state.waiting) return copy.waiting
  if (state.failing.size) return fill(copy.error, { problem })
  if (state.retrying.size) return copy.retrying
  if (state.recovered.size && !state.done) return fill(copy.recovered, { step: nodes[[...state.recovered][0]].title })
  if (state.done) {
    const last = nodes[run.steps.at(-1)[0]]
    const outcome = last ? ` · ${last.title}` : ''
    if (drill) return `${fill(copy.drillDone, { problem })}${outcome}`
    if (run.decision) return `${copy[run.decision === 'approve' ? 'approved' : 'rejected']}${outcome}`
    return fill(copy.pathDone, { path: run.branchLabel })
  }
  if (drill && state.problemSeen && run.retries.size === 0) return fill(copy.problem, { problem })
  if (drill) return fill(copy.running, { what: drill.label })
  return fill(copy.runningPath, { path: run.branchLabel })
}
