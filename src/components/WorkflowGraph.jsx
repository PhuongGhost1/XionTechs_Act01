import { useEffect, useRef } from 'react'
import { VIEW, edgePath, nodeBox, pct } from '../workflow/layout'
import { edgeKey } from '../workflow/run'
import { nodeClasses, nodeStatus, typeIcon, typeTag } from './workflowStyles'

const PACKET_MS = 600

// A packet dot travelling one edge. SMIL animations added after page load would start
// relative to the document timeline (and finish instantly), so begin is "indefinite" and
// the animation is started explicitly on mount.
function Packet({ d }) {
  const ref = useRef(null)
  useEffect(() => {
    ref.current?.beginElement?.()
  }, [])
  return (
    <circle r="5" className="fill-accent">
      <animateMotion ref={ref} begin="indefinite" dur={`${PACKET_MS}ms`} fill="freeze" path={d} />
    </circle>
  )
}

export default function WorkflowGraph({ workflow, run, state, selectedId, onSelect, reduced }) {
  const nodes = Object.fromEntries(workflow.nodes.map((n) => [n.id, n]))
  const runEdgeKeys = new Set(run.edges.map(edgeKey))

  return (
    <div className="relative w-full" style={{ aspectRatio: `${VIEW.w} / ${VIEW.h}` }}>
      <svg viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} className="absolute inset-0 h-full w-full" aria-hidden="true">
        <defs>
          <pattern id="wf-dots" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" className="fill-line" />
          </pattern>
        </defs>
        <rect width={VIEW.w} height={VIEW.h} fill="url(#wf-dots)" />
        {workflow.edges.map(([from, to]) => {
          const key = `${from}>${to}`
          const lit = state.lit.has(key)
          const onPath = runEdgeKeys.has(key)
          return (
            <path
              key={key}
              d={edgePath(nodes[from], nodes[to])}
              fill="none"
              strokeWidth="2"
              strokeDasharray={onPath ? undefined : '4 4'}
              className={`transition-colors duration-300 ${lit ? 'stroke-accent' : 'stroke-line'}`}
            />
          )
        })}
        {!reduced &&
          run.edges
            .filter((e) => state.travelling.has(edgeKey(e)))
            .map((e) => <Packet key={`${run.branchLabel}-${edgeKey(e)}`} d={edgePath(nodes[e.from], nodes[e.to])} />)}
      </svg>

      {workflow.nodes.map((node) => {
        const box = nodeBox(node)
        const status = nodeStatus(node.id, run, state)
        const Icon = typeIcon[node.type]
        const isRouter = node.type === 'router'
        return (
          <button
            key={node.id}
            type="button"
            onClick={() => onSelect(node.id)}
            aria-pressed={selectedId === node.id}
            className={`absolute flex items-center gap-2 text-left ${isRouter ? 'justify-center rounded-full border-dashed px-2' : 'rounded-xl px-3'} ${nodeClasses(node, status, selectedId === node.id)}`}
            style={{ left: pct(box.x, VIEW.w), top: pct(box.y, VIEW.h), width: pct(box.w, VIEW.w), height: pct(box.h, VIEW.h) }}
          >
            {typeTag[node.type] && (
              <span className="absolute -top-2.5 left-3 rounded-full bg-primarySoft px-2 text-[10px] font-medium uppercase tracking-wide text-primary">
                {typeTag[node.type]}
              </span>
            )}
            <Icon className={`h-4 w-4 shrink-0 ${status === 'active' && node.type === 'outcome' ? '' : 'text-accent'}`} strokeWidth={1.75} />
            <span className="min-w-0">
              <span className={`block truncate font-medium ${isRouter ? 'text-xs' : 'text-sm'}`}>{node.title}</span>
              {node.capability && (
                <span className="mt-0.5 inline-block rounded border border-dashed border-line px-1.5 text-[11px] text-muted" title="Draft label — final Azure service to be confirmed">
                  {node.capability}
                </span>
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}
