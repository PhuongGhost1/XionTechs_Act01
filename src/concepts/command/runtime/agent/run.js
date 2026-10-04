// PORTED from the main page: src/workflow/run.js (D:\XionTechs\XionTechs_Act01, read 2026-10-04).
// Zero-state rule: copied and adapted, not imported. The tick semantics are IDENTICAL to the main
// page's agent demo (the behaviour must match); only the graph-only helpers (splitBranches,
// visibleRows, visibleNodeIds) were left behind, because the tape has no phone graph, no cycling log
// and no drawn-on-demand cards. Pure: components only render what these return.
//
// Timeline, one tick at a time: tick 0 pulses the trigger (step 0). For every later step i,
// tick 2i-1 sends packets along the edges into it, tick 2i shows its nodes working, and the
// nodes are active from tick 2i+1. The run is done at totalTicks(run), or waits there when it has
// a pending decision.
//
// A retry step r (the same node again) uses the otherwise empty tick before it: tick 2r-1 the node
// fails (`failing`, and the connector into it is in `errorEdges`), tick 2r the signal travels that
// connector again while the node retries, tick 2r+1 it has `recovered` (while the next signal
// leaves), and from then on it counts as `retried`.

const asStep = (s) => (Array.isArray(s) ? s : [s])

export const edgeKey = (edge) => `${edge.from}>${edge.to}`

// opts.drillId plays that drill's path instead of a branch. A path that ends at the workflow's
// decision node waits there (waitStep) until opts.decision appends the approve/reject
// continuation. A step identical to the previous one is a retry: no edge, the node works again.
export function buildRun(workflow, branchIndex, opts = {}) {
  const drill = opts.drillId ? (workflow.drills?.find((d) => d.id === opts.drillId) ?? null) : null
  const source = drill ?? workflow.branches[branchIndex]
  let steps = source.path.map(asStep)
  const dec = workflow.decision
  let waitStep = null
  const last = steps[steps.length - 1]
  if (dec && last.length === 1 && last[0] === dec.nodeId) {
    if (opts.decision) steps = [...steps, ...dec[opts.decision].map(asStep)]
    else waitStep = steps.length - 1
  }
  const retries = new Set()
  const edges = []
  for (let i = 1; i < steps.length; i++) {
    const prev = steps[i - 1]
    const cur = steps[i]
    if (prev.length === 1 && cur.length === 1 && prev[0] === cur[0]) {
      retries.add(i)
      continue
    }
    for (const from of prev) {
      for (const to of cur) edges.push({ from, to, step: i })
    }
  }
  return {
    steps,
    edges,
    retries,
    waitStep,
    branchLabel: source.label,
    drillId: drill?.id ?? null,
    problemNodeId: drill?.problemNodeId ?? null,
    fault: drill?.fault ?? null,
    decision: waitStep === null && opts.decision ? opts.decision : null,
  }
}

export function nextBranchIndex(workflow, current) {
  return (current + 1) % workflow.branches.length
}

export function totalTicks(run) {
  if (run.waitStep !== null && run.waitStep !== undefined) return 2 * run.waitStep
  return 2 * (run.steps.length - 1) + 1
}

export function stateAt(run, rawTick) {
  const waitingRun = run.waitStep !== null && run.waitStep !== undefined
  const tick = waitingRun ? Math.min(rawTick, totalTicks(run)) : rawTick
  const active = new Set()
  const working = new Set()
  const travelling = new Set()
  const lit = new Set()
  const retrying = new Set()

  run.steps.forEach((step, i) => {
    const workTick = i === 0 ? 0 : 2 * i
    for (const id of step) {
      if (tick === workTick) {
        working.add(id)
        if (run.retries?.has(i)) retrying.add(id)
      }
      if (tick > workTick) active.add(id)
    }
  })
  for (const edge of run.edges) {
    if (tick === 2 * edge.step - 1) travelling.add(edgeKey(edge))
    if (tick >= 2 * edge.step) lit.add(edgeKey(edge))
  }

  const failing = new Set()
  const recovered = new Set()
  const retried = new Set()
  const errorEdges = new Set()
  for (const r of run.retries ?? []) {
    // The connector into the failing node is the one that first reached it.
    let entry = r - 1
    while (entry > 0 && run.retries.has(entry)) entry--
    const into = run.edges.filter((e) => e.step === entry).map(edgeKey)
    const ids = run.steps[r]
    if (tick === 2 * r - 1) {
      ids.forEach((id) => failing.add(id))
      into.forEach((k) => errorEdges.add(k))
    }
    if (tick === 2 * r) into.forEach((k) => travelling.add(k))
    if (tick === 2 * r + 1) ids.forEach((id) => recovered.add(id))
    if (tick > 2 * r) ids.forEach((id) => retried.add(id))
  }
  // A node working again on a retry step, or failing before it, is not also "active".
  for (const id of working) active.delete(id)
  for (const id of failing) active.delete(id)

  let problemSeen = false
  if (run.problemNodeId) {
    const first = run.steps.findIndex((s) => s.includes(run.problemNodeId))
    problemSeen = first >= 0 && tick >= (first === 0 ? 0 : 2 * first)
  }

  const waiting = waitingRun && tick >= totalTicks(run)
  return {
    active, working, travelling, lit, retrying, failing, recovered, retried, errorEdges, problemSeen, waiting,
    done: !waitingRun && tick >= totalTicks(run),
  }
}
