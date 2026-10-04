// PORTED from the main page: src/workflow/log.js (read 2026-10-04). Copied and adapted.
// Kept: fill() and statusLine(), the one-line status for the aria-live region, with the same words
// and the same rules. Left behind: executionLog(), the main page's log panel; on the tape the
// printed lines ARE the log (tape.js). Nodes carry their words in `text` here (the content module
// wraps every visible string), where the main page's nodes carry `title`.

export const fill = (template, vars) => template.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '')

const drillOf = (workflow, run) => (run.drillId ? (workflow.drills?.find((d) => d.id === run.drillId) ?? null) : null)

// One-line status for the aria-live region. `copy` is content.agent.run.line, a map of wrappers.
export function statusLine(workflow, run, state, copy) {
  const t = (key) => copy[key].text
  const drill = drillOf(workflow, run)
  const problem = drill?.label ?? ''
  const nodes = Object.fromEntries(workflow.nodes.map((n) => [n.id, n]))
  if (state.waiting) return t('waiting')
  if (state.failing.size) return fill(t('error'), { problem })
  if (state.retrying.size) return t('retrying')
  if (state.recovered.size && !state.done) return fill(t('recovered'), { step: nodes[[...state.recovered][0]].text })
  if (state.done) {
    const last = nodes[run.steps.at(-1)[0]]
    const outcome = last ? ` · ${last.text}` : ''
    if (drill) return `${fill(t('drillDone'), { problem })}${outcome}`
    if (run.decision) return `${t(run.decision === 'approve' ? 'approved' : 'rejected')}${outcome}`
    return fill(t('pathDone'), { path: run.branchLabel })
  }
  if (drill && state.problemSeen && run.retries.size === 0) return fill(t('problem'), { problem })
  if (drill) return fill(t('running'), { what: drill.label })
  return fill(t('runningPath'), { path: run.branchLabel })
}
