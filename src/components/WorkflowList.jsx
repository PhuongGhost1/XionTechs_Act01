import { splitBranches } from '../workflow/run'
import { nodeClasses, nodeStatus, typeIcon } from './workflowStyles'

function Item({ node, run, state }) {
  const status = nodeStatus(node.id, run, state)
  const Icon = typeIcon[node.type]
  const outcomeActive = status === 'active' && node.type === 'outcome'
  return (
    <li className={`rounded-xl p-3 ${nodeClasses(node, status, false)}`}>
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 shrink-0 ${outcomeActive ? '' : 'text-accent'}`} strokeWidth={1.75} />
        <span className="text-sm font-medium">{node.title}</span>
        {node.capability && (
          <span className="rounded border border-dashed border-line px-1.5 text-[11px] text-muted">{node.capability}</span>
        )}
      </div>
      <p className={`mt-1 text-sm ${outcomeActive ? '' : 'text-muted'}`}>{node.desc}</p>
    </li>
  )
}

function Steps({ steps, nodes, run, state }) {
  return steps.flatMap((step) => step.map((id) => <Item key={id} node={nodes[id]} run={run} state={state} />))
}

// Phone layout and, on desktop, the screen-reader text alternative of the graph.
export default function WorkflowList({ workflow, run, state, className = '' }) {
  const nodes = Object.fromEntries(workflow.nodes.map((n) => [n.id, n]))
  const { prefix, branches, suffix } = splitBranches(workflow)

  return (
    <div className={className}>
      <ol className="space-y-3 border-l-2 border-line pl-4">
        <Steps steps={prefix} nodes={nodes} run={run} state={state} />
      </ol>
      {branches.length > 0 && (
        <div className="mt-3 border-l-2 border-line pl-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Routes to one of:</p>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {branches.map((b) => {
              const chosen = b.label === run.branchLabel
              return (
                <div key={b.label} className={`rounded-xl border p-2 ${chosen ? 'border-accent' : 'border-dashed border-line'}`}>
                  <p className="mb-2 text-xs font-medium text-ink">
                    {b.label}
                    {chosen && <span className="ml-2 text-muted">(this run)</span>}
                  </p>
                  <ol className="space-y-2">
                    <Steps steps={b.steps} nodes={nodes} run={run} state={state} />
                  </ol>
                </div>
              )
            })}
          </div>
        </div>
      )}
      {suffix.length > 0 && (
        <ol className="mt-3 space-y-3 border-l-2 border-line pl-4">
          <Steps steps={suffix} nodes={nodes} run={run} state={state} />
        </ol>
      )}
    </div>
  )
}
