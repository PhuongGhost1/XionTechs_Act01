import { useLayoutEffect, useRef } from 'react'
import { VIEW, decisionBox, edgePath, nodeBox, pct } from '../workflow/layout'
import { edgeKey, visibleNodeIds } from '../workflow/run'
import { isWorking, nodeClasses, nodeStatus, runTag, typeIcon, typeTag } from './workflowStyles'
import DecisionButtons from './DecisionButtons'

const PACKET_MS = 600

// A packet dot travelling one edge. SMIL animations added after page load would start
// relative to the document timeline (and finish instantly), so begin is "indefinite" and
// the animation is started explicitly on mount.
function Packet({ d }) {
  const animateRef = useRef(null)
  const circleRef = useRef(null)
  useLayoutEffect(() => {
    animateRef.current?.beginElement?.()
    circleRef.current?.setAttribute('opacity', '1')
  }, [])
  return (
    <circle ref={circleRef} r="5" className="fill-accent" opacity="0">
      <animateMotion ref={animateRef} begin="indefinite" dur={`${PACKET_MS}ms`} fill="freeze" path={d} />
    </circle>
  )
}

export default function WorkflowGraph({ workflow, run, state, selectedId, onSelect, reduced, onDecide }) {
  const nodes = Object.fromEntries(workflow.nodes.map((n) => [n.id, n]))
  const runEdgeKeys = new Set(run.edges.map(edgeKey))
  const visible = visibleNodeIds(workflow, run)
  const via = Object.fromEntries(workflow.edges.map(([a, b, o]) => [`${a}>${b}`, o?.via]))

  return (
    <div className="relative w-full" style={{ aspectRatio: `${VIEW.w} / ${VIEW.h}` }}>
      <svg viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} className="absolute inset-0 h-full w-full" aria-hidden="true">
        <defs>
          <pattern id="wf-dots" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" className="fill-line" />
          </pattern>
        </defs>
        <rect width={VIEW.w} height={VIEW.h} fill="url(#wf-dots)" />
        {workflow.edges.filter(([a, b]) => visible.has(a) && visible.has(b)).map(([from, to]) => {
          const key = `${from}>${to}`
          const lit = state.lit.has(key)
          const onPath = runEdgeKeys.has(key)
          return (
            <path
              key={key}
              d={edgePath(nodes[from], nodes[to], via[`${from}>${to}`])}
              fill="none"
              strokeWidth="2"
              strokeDasharray={onPath ? undefined : '4 4'}
              className={`transition-colors duration-300 ${lit ? 'stroke-accent' : 'stroke-muted'}`}
            />
          )
        })}
        {!reduced &&
          run.edges
            .filter((e) => state.travelling.has(edgeKey(e)))
            .map((e) => <Packet key={`${run.branchLabel}-${edgeKey(e)}`} d={edgePath(nodes[e.from], nodes[e.to], via[edgeKey(e)])} />)}
      </svg>

      {workflow.nodes.filter((n) => visible.has(n.id)).map((node) => {
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
            className={`absolute flex items-center gap-2 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent ${isRouter ? 'justify-center rounded-full border-dashed px-2' : 'rounded-xl px-3'} ${node.drillOnly ? 'wf-fade-in' : ''} ${nodeClasses(node, status, selectedId === node.id)}`}
            style={{ left: pct(box.x, VIEW.w), top: pct(box.y, VIEW.h), width: pct(box.w, VIEW.w), height: pct(box.h, VIEW.h) }}
          >
            {isWorking(status) && <span aria-hidden="true" className="pointer-events-none absolute -inset-1 rounded-[inherit] ring-2 ring-accent/50 motion-safe:animate-pulse" />}
            {typeTag[node.type] && (
              <span className="absolute -top-2.5 left-3 rounded-full bg-primarySoft px-2 text-[10px] font-medium uppercase tracking-wide text-primary">
                {typeTag[node.type]}
              </span>
            )}
            {(() => {
              const tag = runTag(node.id, run, state, reduced)
              if (!tag) return null
              const TagIcon = tag.Icon
              return (
                <span className="absolute -top-2.5 right-3 inline-flex items-center gap-1 rounded-full border border-accent bg-paper px-2 text-[10px] font-medium uppercase tracking-wide text-ink">
                  <TagIcon className="h-3 w-3 text-accent" strokeWidth={2} />
                  {tag.word}
                </span>
              )
            })()}
            <Icon className={`h-4 w-4 shrink-0 ${status === 'active' && node.type === 'outcome' ? '' : 'text-accent'}`} strokeWidth={1.75} />
            <span className="min-w-0">
              <span className={`block line-clamp-2 font-medium leading-tight ${isRouter ? 'text-xs' : 'text-sm'}`}>{node.title}</span>
              {node.capability && (
                <span className="mt-0.5 inline-block rounded border border-dashed border-line px-1.5 text-[11px] text-muted" title="Draft label — final Azure service to be confirmed">
                  {node.capability}
                </span>
              )}
            </span>
          </button>
        )
      })}

      {state.waiting && workflow.decision && (() => {
        const d = decisionBox(workflow.decision)
        return (
          <div className="absolute" style={{ left: pct(d.x, VIEW.w), top: pct(d.y, VIEW.h), width: pct(d.w, VIEW.w), height: pct(d.h, VIEW.h) }}>
            <DecisionButtons verb={workflow.decision.verb} onDecide={onDecide} size="sm" />
          </div>
        )
      })()}
    </div>
  )
}
