import { useCallback, useLayoutEffect, useRef } from 'react'
import { usePointer } from '../../../hooks/usePointer'
import { VIEW, decisionBox, edgePath, nodeBox, pct } from '../../../workflow/layout'
import { DEPTH, WIRE_Z, edgeStatus, nodeDepth, wireScale } from '../../../workflow/phase'
import { edgeKey, visibleNodeIds } from '../../../workflow/run'
import { chipTone, glowTone, nodeChip, nodeClasses, nodeStatus, typeIcon, typeTag } from './workflowStyles'
import DecisionButtons from './DecisionButtons'

const PACKET_MS = 600
const WIRES = { transform: `translateZ(${WIRE_Z}px) scale(${wireScale()})` }
const z = (depth) => ({ transform: `translateZ(${DEPTH[depth]}px)` })

// Faint system nodes on the back plane (MOTION §9 "back: faint system nodes"), in canvas units,
// down the side margins, clear of the cards and of the status and log panels at the top.
const BACK_NODES = [
  [40, 190], [96, 236], [38, 318], [84, 400], [44, 482],
  [720, 196], [664, 232], [722, 318], [676, 410], [718, 486],
]
const BACK_LINKS = [[0, 1], [1, 2], [2, 3], [3, 4], [5, 6], [6, 7], [7, 8], [8, 9]]

// A signal dot travelling one edge. SMIL animations added after page load would start relative
// to the document timeline (and finish instantly), so begin is "indefinite" and the animation is
// started explicitly on mount.
function Packet({ d }) {
  const animateRef = useRef(null)
  const groupRef = useRef(null)
  useLayoutEffect(() => {
    animateRef.current?.beginElement?.()
    groupRef.current?.setAttribute('opacity', '1')
  }, [])
  return (
    <g ref={groupRef} opacity="0">
      <circle r="10" className="fill-accent" opacity="0.18" />
      <circle r="4.5" className="fill-accent" />
      <animateMotion ref={animateRef} begin="indefinite" dur={`${PACKET_MS}ms`} fill="freeze" path={d} />
    </g>
  )
}

// Shallow 3D stage (MOTION §9): perspective on the scene, preserve-3d stage, translateZ per
// layer. The phase ("approval", "error", …) comes from src/workflow/phase.js.
export default function WorkflowGraph({ workflow, run, state, phase, selectedId, onSelect, reduced, onDecide }) {
  const sceneRef = useRef(null)
  const backRef = useRef(null)
  // Pointer parallax moves only the back plane (a few px and degrees), never the cards.
  const onPointer = useCallback((x, y) => {
    const s = backRef.current?.style
    if (!s) return
    s.setProperty('--wf-px', x.toFixed(3))
    s.setProperty('--wf-py', y.toFixed(3))
  }, [])
  usePointer(sceneRef, onPointer, { enabled: !reduced })

  const nodes = Object.fromEntries(workflow.nodes.map((n) => [n.id, n]))
  const runEdgeKeys = new Set(run.edges.map(edgeKey))
  const visible = visibleNodeIds(workflow, run)
  const via = Object.fromEntries(workflow.edges.map(([a, b, o]) => [`${a}>${b}`, o?.via]))
  const approval = phase === 'approval'

  return (
    <div ref={sceneRef} data-phase={phase} className="wf-scene perspective-far relative w-full" style={{ aspectRatio: `${VIEW.w} / ${VIEW.h}` }}>
      <div className="preserve-3d absolute inset-0">
        <div ref={backRef} className="wf-back absolute inset-0" aria-hidden="true">
          <svg viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} className="h-full w-full">
            {BACK_LINKS.map(([a, b]) => (
              <line key={`${a}-${b}`} x1={BACK_NODES[a][0]} y1={BACK_NODES[a][1]} x2={BACK_NODES[b][0]} y2={BACK_NODES[b][1]} strokeWidth="1" className="stroke-line" />
            ))}
            {BACK_NODES.map(([x, y]) => (
              <circle key={`${x}-${y}`} cx={x} cy={y} r="6" strokeWidth="1.5" className="fill-surface stroke-line" />
            ))}
          </svg>
        </div>

        <svg viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} className="wf-wires pointer-events-none absolute inset-0 h-full w-full" style={WIRES} aria-hidden="true">
          {workflow.edges.filter(([a, b]) => visible.has(a) && visible.has(b)).map(([from, to]) => {
            const key = `${from}>${to}`
            const s = edgeStatus(key, state, runEdgeKeys.has(key))
            const d = edgePath(nodes[from], nodes[to], via[key])
            return (
              <g key={key}>
                <path
                  d={d}
                  fill="none"
                  strokeWidth="2"
                  strokeDasharray={s === 'error' ? '6 4' : s === 'off' ? '4 4' : undefined}
                  className={s === 'error' ? 'stroke-danger' : 'stroke-muted'}
                />
                <path d={d} pathLength="1" fill="none" strokeWidth="2" className="wf-trace stroke-accent" data-on={s === 'on'} />
              </g>
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
          const depth = nodeDepth(status, phase)
          const Icon = typeIcon[node.type]
          const isRouter = node.type === 'router'
          const chip = nodeChip(node, run, state)
          const lifted = depth === 'front' || depth === 'focus'
          return (
            <button
              key={node.id}
              type="button"
              onClick={() => onSelect(node.id)}
              aria-pressed={selectedId === node.id}
              className={`absolute flex items-center gap-2 text-left transition-transform duration-base ease-brand motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent ${isRouter ? 'justify-center rounded-full border-dashed px-2' : 'rounded-xl px-3'} ${node.drillOnly ? 'wf-fade-in' : ''} ${lifted ? 'shadow-depth-3' : 'shadow-depth-1'} ${nodeClasses(node, status, selectedId === node.id, approval && status !== 'waiting')}`}
              style={{ left: pct(box.x, VIEW.w), top: pct(box.y, VIEW.h), width: pct(box.w, VIEW.w), height: pct(box.h, VIEW.h), ...z(depth) }}
            >
              <span aria-hidden="true" className="wf-glow" data-glow={glowTone(status)} />
              {typeTag[node.type] && (
                <span className="absolute -top-2.5 left-3 rounded-full bg-primarySoft px-2 text-[10px] font-medium uppercase tracking-wide text-primary">
                  {typeTag[node.type]}
                </span>
              )}
              {chip && (
                <span className={`absolute -top-2.5 right-3 inline-flex items-center gap-1 rounded-full border bg-paper px-2 text-[10px] font-medium uppercase tracking-wide text-ink ${chipTone[chip.tone].border}`}>
                  <chip.Icon aria-hidden="true" className={`h-3 w-3 ${chipTone[chip.tone].icon}`} strokeWidth={2} />
                  {chip.word}
                </span>
              )}
              <Icon aria-hidden="true" className={`h-4 w-4 shrink-0 ${status === 'active' && node.type === 'outcome' ? '' : 'text-accent'}`} strokeWidth={1.75} />
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
            <div className="absolute" style={{ left: pct(d.x, VIEW.w), top: pct(d.y, VIEW.h), width: pct(d.w, VIEW.w), height: pct(d.h, VIEW.h), ...z('focus') }}>
              <div className="wf-rise">
                <DecisionButtons verb={workflow.decision.verb} onDecide={onDecide} size="sm" emphasis />
              </div>
            </div>
          )
        })()}
      </div>
    </div>
  )
}
