import { UserCheck } from 'lucide-react'
import { aiAgents } from '../../../content/site'
import { splitBranches } from '../../../workflow/run'
import DecisionButtons from './DecisionButtons'
import { chipTone, glowTone, nodeChip, nodeClasses, nodeStatus, typeIcon } from './workflowStyles'

// Same states as the graph in a static form: border, glow, chip and text; no depth or travel.
function Item({ node, run, state, workflow, onDecide, forceOff, dim }) {
  const status = forceOff ? 'off' : nodeStatus(node.id, run, state)
  const Icon = typeIcon[node.type]
  const outcomeActive = status === 'active' && node.type === 'outcome'
  const chip = forceOff ? null : nodeChip(node, run, state)
  const waitingHere = status === 'waiting'
  return (
    <li className={`relative rounded-xl p-3 ${nodeClasses(node, status, false, dim && !waitingHere)}`}>
      <span aria-hidden="true" className="wf-glow" data-glow={glowTone(status)} />
      <div className="flex flex-wrap items-center gap-2">
        <Icon aria-hidden="true" className={`h-4 w-4 shrink-0 ${outcomeActive ? '' : 'text-accent'}`} strokeWidth={1.75} />
        <span className="text-sm font-medium">{node.title}</span>
        {node.capability && (
          <span className="rounded border border-dashed border-line px-1.5 text-[11px] text-muted">{node.capability}</span>
        )}
        {chip && (
          <span className={`inline-flex items-center gap-1 rounded-full border bg-paper px-2 text-[11px] font-medium text-ink ${chipTone[chip.tone].border}`}>
            <chip.Icon aria-hidden="true" className={`h-3 w-3 ${chipTone[chip.tone].icon}`} strokeWidth={2} />
            {chip.word}
          </span>
        )}
      </div>
      <p className={`mt-1 text-sm ${outcomeActive ? '' : 'text-muted'}`}>{node.desc}</p>
      {waitingHere && workflow.decision?.nodeId === node.id && (
        <div className="mt-3">
          <p className="text-sm font-medium text-ink">{aiAgents.run.status.waiting}</p>
          <p className="mb-3 mt-1 flex items-center gap-1.5 text-sm font-medium text-accent">
            <UserCheck aria-hidden="true" className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            {aiAgents.humanMessage}
          </p>
          <div className="lg:hidden">
            <DecisionButtons verb={workflow.decision.verb} onDecide={onDecide} emphasis />
          </div>
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
export default function WorkflowList({ workflow, run, state, phase, className = '', onDecide }) {
  const nodes = Object.fromEntries(workflow.nodes.map((n) => [n.id, n]))
  const shared = { nodes, run, state, workflow, onDecide, dim: phase === 'approval' }

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
                  <Steps steps={steps} startIndex={chosen ? prefix.length : 0} forceOff={!chosen} {...shared} />
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
