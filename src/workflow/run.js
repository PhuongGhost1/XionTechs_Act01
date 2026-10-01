// Pure run logic for the agent workflow graph. Components only render what these return.
//
// Timeline, one tick at a time: tick 0 pulses the trigger (step 0). For every later step i,
// tick 2i-1 sends packets along the edges into it, tick 2i shows its nodes working, and the
// nodes are active from tick 2i+1. The run is done at totalTicks(run), or waits there when it has a pending decision.

const asStep = (s) => (Array.isArray(s) ? s : [s])

export const edgeKey = (edge) => `${edge.from}>${edge.to}`

// opts.drillId plays that drill's path instead of a branch. A path that ends at the workflow's
// decision node waits there (waitStep) until opts.decision appends the approve/reject
// continuation. A step identical to the previous one is a retry: no edge, the node works again.
export function buildRun(workflow, branchIndex, opts = {}) {
  const drill = opts.drillId ? workflow.drills?.find((d) => d.id === opts.drillId) ?? null : null
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
  // A node working again on a retry step is not also "active".
  for (const id of working) active.delete(id)
  for (const edge of run.edges) {
    if (tick === 2 * edge.step - 1) travelling.add(edgeKey(edge))
    if (tick >= 2 * edge.step) lit.add(edgeKey(edge))
  }

  let problemSeen = false
  if (run.problemNodeId) {
    const first = run.steps.findIndex((s) => s.includes(run.problemNodeId))
    problemSeen = first >= 0 && tick >= (first === 0 ? 0 : 2 * first)
  }

  const waiting = waitingRun && tick >= totalTicks(run)
  return { active, working, travelling, lit, retrying, problemSeen, waiting, done: !waitingRun && tick >= totalTicks(run) }
}

// Drill-only nodes are drawn only when the current run passes through them.
export function visibleNodeIds(workflow, run) {
  const onRun = new Set(run.steps.flat())
  return new Set(workflow.nodes.filter((n) => !n.drillOnly || onRun.has(n.id)).map((n) => n.id))
}

// Splits a workflow's branches into the steps all branches share at the start, the steps
// that differ, and the steps all branches share at the end — the phone layout renders the
// middle part as side-by-side alternatives.
export function splitBranches(workflow) {
  const paths = workflow.branches.map((b) => b.path.map(asStep))
  if (paths.length === 1) return { prefix: paths[0], branches: [], suffix: [] }

  const same = (a, b) => a.join('|') === b.join('|')
  const first = paths[0]
  let p = 0
  while (paths.every((path) => path[p] && same(path[p], first[p]))) p++
  let s = 0
  while (
    paths.every(
      (path) => path.length - 1 - s >= p && same(path[path.length - 1 - s], first[first.length - 1 - s]),
    )
  ) {
    s++
  }
  return {
    prefix: first.slice(0, p),
    branches: workflow.branches.map((b, i) => ({ label: b.label, steps: paths[i].slice(p, paths[i].length - s) })),
    suffix: first.slice(first.length - s),
  }
}

// Newest-first window of `count` rows from a cycling log; `offset` is the newest row index.
export function visibleRows(log, offset, count) {
  const n = log.length
  return Array.from({ length: count }, (_, k) => log[(((offset - k) % n) + n) % n])
}
