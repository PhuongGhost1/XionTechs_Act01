// Pure run logic for the agent workflow graph. Components only render what these return.
//
// Timeline, one tick at a time: tick 0 pulses the trigger (step 0). For every later step i,
// tick 2i-1 sends packets along the edges into it, tick 2i shows its nodes working, and the
// nodes are active from tick 2i+1. The run is done at totalTicks(run).

const asStep = (s) => (Array.isArray(s) ? s : [s])

export const edgeKey = (edge) => `${edge.from}>${edge.to}`

export function buildRun(workflow, branchIndex) {
  const branch = workflow.branches[branchIndex]
  const steps = branch.path.map(asStep)
  const edges = []
  for (let i = 1; i < steps.length; i++) {
    for (const from of steps[i - 1]) {
      for (const to of steps[i]) edges.push({ from, to, step: i })
    }
  }
  return { steps, edges, branchLabel: branch.label }
}

export function nextBranchIndex(workflow, current) {
  return (current + 1) % workflow.branches.length
}

export function totalTicks(run) {
  return 2 * (run.steps.length - 1) + 1
}

export function stateAt(run, tick) {
  const active = new Set()
  const working = new Set()
  const travelling = new Set()
  const lit = new Set()

  run.steps.forEach((step, i) => {
    const workTick = i === 0 ? 0 : 2 * i
    for (const id of step) {
      if (tick === workTick) working.add(id)
      if (tick > workTick) active.add(id)
    }
  })
  for (const edge of run.edges) {
    if (tick === 2 * edge.step - 1) travelling.add(edgeKey(edge))
    if (tick >= 2 * edge.step) lit.add(edgeKey(edge))
  }
  return { active, working, travelling, lit, done: tick >= totalTicks(run) }
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
