import { splitBranches } from '../workflow/run'
import DecisionButtons from './DecisionButtons'
import { isWorking, nodeClasses, nodeStatus, runTag, typeIcon } from './workflowStyles'

function Item({ node, run, state, workflow, onDecide }) {
  const status = nodeStatus(node.id, run, state)
  const Icon = typeIcon[node.type]
  const outcomeActive = status === 'active' && node.type === 'outcome'
  const tag = runTag(node.id, run, state)
  const waitingHere = state.waiting && workflow.decision?.nodeId === node.id
  return (
    <li className={`relative rounded-xl p-3 ${nodeClasses(node, status, false)}`}>
      {isWorking(status) && <span aria-hidden="true" className="pointer-events-none absolute -inset-1 rounded-[inherit] ring-2 ring-accent/50 motion-safe:animate-pulse" />}
      <div className="flex flex-wrap items-center gap-2">
        <Icon className={`h-4 w-4 shrink-0 ${outcomeActive ? '' : 'text-accent'}`} strokeWidth={1.75} />
        <span className="text-sm font-medium">{node.title}</span>
        {node.capability && (
          <span className="rounded border border-dashed border-line px-1.5 text-[11px] text-muted">{node.capability}</span>
        )}
        {tag && (
          <span className="inline-flex items-center gap-1 rounded-full border border-accent px-2 text-[11px] font-medium text-ink">
            <tag.Icon className="h-3 w-3 text-accent" strokeWidth={2} />
            {tag.word}
          </span>
        )}
      </div>
      <p className={`mt-1 text-sm ${outcomeActive ? '' : 'text-muted'}`}>{node.desc}</p>
      {waitingHere && (
        <div className="mt-3">
          <p className="mb-2 text-sm font-medium text-ink">Waiting for your decision</p>
          <DecisionButtons verb={workflow.decision.verb} onDecide={onDecide} />
        </div>
      )}
    </li>
  )
}

// Renders steps as list items. Routers are represented by the "routes to one of" label, and a
// retry step repeats the previous node, so both are skipped.
function Steps({ steps, startIndex = 0, nodes, ...rest }) {
  return steps.flatMap((step, i) => {
    if (rest.run.retries?.has(startIndex + i)) return []
    return step.filter((id) => nodes[id].type !== 'router').map((id) => <Item key={id} node={nodes[id]} {...rest} />)
  })
}

// Phone layout and, on desktop, the screen-reader text alternative of the graph.
export default function WorkflowList({ workflow, run, state, className = '', onDecide }) {
  const nodes = Object.fromEntries(workflow.nodes.map((n) => [n.id, n]))
  const shared = { nodes, run, state, workflow, onDecide }

  // Drills and single-branch workflows read top to bottom as the run's own steps.
  if (run.drillId || workflow.branches.length === 1) {
    return (
      <div className={className}>
        <ol className="space-y-3 border-l-2 border-line pl-4">
          <Steps steps={run.steps} {...shared} />
        </ol>
      </div>
    )
  }

  const { prefix, branches, suffix } = splitBranches(workflow)
  return (
    <div className={className}>
      <ol className="space-y-3 border-l-2 border-line pl-4">
        <Steps steps={prefix} {...shared} />
      </ol>
      <div className="mt-3 border-l-2 border-line pl-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">AI routing — routes to one of:</p>
        <div className="mt-2 grid gap-3 min-[480px]:grid-cols-2">
          {branches.map((b) => {
            const chosen = b.label === run.branchLabel
            // The chosen branch shows the run's own steps, including any decision continuation.
            const steps = chosen ? run.steps.slice(prefix.length) : b.steps
            return (
              <div key={b.label} className={`rounded-xl border p-2 ${chosen ? 'border-accent' : 'border-dashed border-line'}`}>
                <p className="mb-2 text-xs font-medium text-ink">
                  {b.label}
                  {chosen && <span className="ml-2 text-muted">(this run)</span>}
                </p>
                <ol className="space-y-2">
                  <Steps steps={steps} startIndex={chosen ? prefix.length : 0} {...shared} />
                </ol>
              </div>
            )
          })}
        </div>
      </div>
      {suffix.length > 0 && (
        <ol className="mt-3 space-y-3 border-l-2 border-line pl-4">
          <Steps steps={suffix} {...shared} />
        </ol>
      )}
    </div>
  )
}
