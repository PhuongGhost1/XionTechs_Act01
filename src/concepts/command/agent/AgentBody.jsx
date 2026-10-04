import { useEffect, useMemo, useRef, useState } from 'react'
import { agent } from '../content.js'
import { useInView, useMinWidth, useReducedMotion, useStore } from '../hooks/index.js'
import { Mono, PauseButton } from '../ui/index.jsx'
import { nextTabIndex } from '../work/logic.js'
import { useAgentDemo } from '../../../workflow/useAgentDemo.js'
import Stage from './Stage.jsx'
import { buildJourneyScene, journeyLog } from './journeyPlan.js'
import { cellAt, cellState, currentCell, journeyCells, nextCellIndex, workflowCells } from './timeline.js'

const TONE_CODE = {
  signal: 'IN', working: 'RUN', decision: 'ROUTE', approval: 'HOLD', approved: 'OK', rejected: 'NO',
  error: 'FAULT', retry: 'RETRY', success: 'OK', done: 'DONE', problem: 'FLAG',
}

function useDocumentVisible() {
  const [visible, setVisible] = useState(() => typeof document === 'undefined' || !document.hidden)
  useEffect(() => {
    const on = () => setVisible(!document.hidden)
    document.addEventListener('visibilitychange', on)
    return () => document.removeEventListener('visibilitychange', on)
  }, [])
  return visible
}

const ctl =
  'x-mono inline-flex min-h-11 items-center justify-center border px-4 transition-colors duration-200 ease-x disabled:opacity-40'
const ctlOff = 'border-x-line text-x-mute hover:border-x-text hover:text-x-text'
const ctlOn = 'border-x-text text-x-text'

export default function AgentBody() {
  const reduced = useReducedMotion()
  const paused = useStore((s) => s.paused)
  const visible = useDocumentVisible()
  const root = useRef(null)
  const inView = useInView(root, { amount: 0.15, once: false })
  const wide = useMinWidth(640)
  const roomy = useMinWidth(1024)
  const compact = !wide
  const demo = useAgentDemo({ reduced, running: inView && !paused && visible })
  const { workflow, workflows, view, tick, total, run, jState, log } = demo

  const journeyScene = useMemo(() => buildJourneyScene(demo.journey), [demo.journey])
  const cells = useMemo(
    () => (view === 'workflow' ? workflowCells(workflow, run, total) : journeyCells(demo.journey)),
    [view, workflow, run, total, demo.journey],
  )
  const current = currentCell(view === 'workflow' ? 'workflow' : 'journey', cells, tick)
  const statusText = view === 'workflow' ? demo.status : jState.done ? agent.taskDone : jState.status
  const rows = view === 'workflow' ? log : journeyLog(journeyScene, tick)

  const onTabKey = (e, i) => {
    const next = nextTabIndex(e.key, i, workflows.length)
    if (next === null) return
    e.preventDefault()
    demo.selectScenario(next)
    document.getElementById(`agent-tab-${next}`)?.focus()
  }

  const views = [
    { id: 'workflow', label: agent.views.plan },
    { id: 'agent', label: agent.views.work },
  ]
  const onViewKey = (e, i) => {
    const next = nextTabIndex(e.key, i, views.length)
    if (next === null) return
    e.preventDefault()
    demo.selectView(views[next].id)
    document.getElementById(`agent-view-${views[next].id}`)?.focus()
  }

  const decision = workflow.decision
  const canDecide = demo.waiting && !reduced
  const multiPath = view === 'workflow' && workflow.branches.length > 1 && !demo.drillId

  return (
    <div ref={root} className="mt-10">
      {/* scenario tabs, view switch, motion control */}
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div>
          <Mono as="p" className="text-x-faint" id="agent-scenarios-label">
            {agent.scenarios}
          </Mono>
          <div role="tablist" aria-labelledby="agent-scenarios-label" className="mt-2 flex flex-wrap gap-2">
            {workflows.map((w, i) => (
              <button
                key={w.id}
                id={`agent-tab-${i}`}
                type="button"
                role="tab"
                aria-selected={demo.active === i}
                aria-controls="agent-stage"
                tabIndex={demo.active === i ? 0 : -1}
                onClick={() => demo.selectScenario(i)}
                onKeyDown={(e) => onTabKey(e, i)}
                className={`${ctl} ${demo.active === i ? ctlOn : ctlOff}`}
              >
                {w.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <Mono as="p" className="text-x-faint" id="agent-view-label">
            {agent.views.label}
          </Mono>
          <div role="radiogroup" aria-labelledby="agent-view-label" className="mt-2 flex gap-2">
            {views.map((v, i) => (
              <button
                key={v.id}
                id={`agent-view-${v.id}`}
                type="button"
                role="radio"
                aria-checked={view === v.id}
                tabIndex={view === v.id ? 0 : -1}
                onClick={() => demo.selectView(v.id)}
                onKeyDown={(e) => onViewKey(e, i)}
                className={`${ctl} ${view === v.id ? ctlOn : ctlOff}`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
        <PauseButton labels={{ pause: 'Pause Motion', play: 'Play Motion' }} />
      </div>

      <div id="agent-stage" role="tabpanel" aria-labelledby={`agent-tab-${demo.active}`} className="mt-6">
        <Stage demo={demo} reduced={reduced} running={inView && !paused && visible} compact={compact} lean={!roomy} />
        <ol className="sr-only" aria-label={agent.timeline.label}>
          {cells.map((c, i) => (
            <li key={`${c.name}-${i}`}>
              {c.name}: {agent.states[stateWord(i, current, demo.done, demo.waiting && view === 'workflow')]}
            </li>
          ))}
        </ol>
      </div>

      {view === 'agent' && <p className="mt-3 max-w-3xl text-sm text-x-mute">{agent.legendWork}</p>}

      {/* status and the human moment: flat buttons, outside the 3D stage */}
      <div className="mt-5 grid gap-5 border-t border-x-line pt-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-10">
        <div className="min-w-0">
          <div className="flex min-h-[3.25rem] flex-wrap items-center gap-x-6 gap-y-3">
            <p role="status" aria-live="polite" className="x-mono min-w-0 flex-1 basis-56 text-x-text">
              {statusText}
            </p>
            {canDecide && (
              <div role="group" aria-label={agent.decision.group} className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                <button
                  type="button"
                  onClick={() => demo.decide('approve')}
                  className="x-mono inline-flex min-h-12 items-center justify-center bg-x-signal px-5 text-x-ink transition-colors duration-200 ease-x hover:bg-x-text"
                >
                  {agent.decision.approve(decision.verb)}
                </button>
                <button
                  type="button"
                  onClick={() => demo.decide('reject')}
                  className="x-mono inline-flex min-h-12 items-center justify-center border border-x-text px-5 text-x-text transition-colors duration-200 ease-x hover:bg-x-bg2"
                >
                  {agent.decision.reject}
                </button>
              </div>
            )}
          </div>
          {canDecide && <p className="mt-2 text-sm text-x-mute">{agent.decision.holding(decision.verb)}</p>}
          {reduced && demo.waiting && <p className="mt-2 max-w-2xl text-sm text-x-mute">{agent.decision.reduced(decision.log)}</p>}

          <Timeline
            cells={cells}
            current={current}
            done={demo.done}
            playing={demo.playing && !paused}
            reduced={reduced}
            onSeek={demo.seek}
            onToggle={demo.toggle}
            finished={demo.done || demo.waiting}
            onReplay={() => demo.replay()}
            trailing={
              <>
                <button type="button" onClick={() => demo.replay()} className={`${ctl} ${ctlOff}`}>
                  {agent.transport.replay}
                </button>
                {multiPath && demo.done && (
                  <button type="button" onClick={() => demo.replay(true)} className={`${ctl} ${ctlOff}`}>
                    {agent.transport.otherPath}
                  </button>
                )}
              </>
            }
          />

          {view === 'workflow' && (
            <div className="mt-6">
              <Mono as="p" className="text-x-faint" id="agent-drill-label">
                {agent.drills.label}
              </Mono>
              <div role="group" aria-labelledby="agent-drill-label" className="mt-2 flex flex-wrap gap-2">
                {workflow.drills.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    aria-pressed={demo.drillId === d.id}
                    onClick={() => demo.selectDrill(d.id)}
                    className={`${ctl} text-left normal-case ${demo.drillId === d.id ? ctlOn : ctlOff}`}
                  >
                    {d.label}
                  </button>
                ))}
                {demo.drillId && (
                  <button type="button" onClick={demo.clearDrill} className={`${ctl} ${ctlOff}`}>
                    {agent.drills.clear}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="min-w-0">
          <h3 className="x-mono text-x-text">{agent.log.title}</h3>
          <ul className="mt-3 min-h-[11rem] border-l border-x-line" aria-label={agent.log.title}>
            {rows.length === 0 && <li className="py-1.5 pl-4 text-sm text-x-faint">{agent.log.empty}</li>}
            {rows
              .slice(-7)
              .reverse()
              .map((r) => (
                <li key={r.key} className="x-log-in flex gap-3 py-1.5 pl-4 text-sm text-x-mute">
                  <Mono className="w-12 shrink-0 text-x-faint">{TONE_CODE[r.tone] ?? (r.kind === 'skill' ? 'SKILL' : 'READ')}</Mono>
                  <span className="min-w-0">
                    {r.text}
                    {r.detail ? <span className="text-x-faint"> / {r.detail}</span> : null}
                  </span>
                </li>
              ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

const stateWord = (i, current, done, waiting) => {
  if (waiting && i === current) return 'waiting'
  return cellState(i, current, done)
}

// The scrubber. A slider: arrow keys and a click or drag choose a step, and either pauses the run on it.
function Timeline({ cells, current, done, playing, reduced, onSeek, onToggle, finished, onReplay, trailing }) {
  const strip = useRef(null)
  const [hover, setHover] = useState(null)
  const [down, setDown] = useState(false)
  const pick = (e) => cellAt(e.clientX - strip.current.getBoundingClientRect().left, strip.current.clientWidth, cells.length)
  const seekTo = (i) => onSeek(cells[i].tick)
  const onKeyDown = (e) => {
    const next = nextCellIndex(e.key, current, cells.length)
    if (next === null) return
    e.preventDefault()
    seekTo(next)
  }
  const name = cells[current]?.name ?? ''
  const label = finished && !playing ? agent.transport.play : playing ? agent.transport.pause : agent.transport.play
  return (
    <div className="mt-5">
      <div className="flex items-center gap-3">
        {!reduced && (
          <button
            type="button"
            onClick={finished && !playing && done ? onReplay : onToggle}
            aria-label={`${agent.timeline.transportLabel}: ${label}`}
            className={`${ctl} min-w-24 ${ctlOff}`}
          >
            <span aria-hidden="true" className="mr-2 inline-flex w-3 justify-between">
              {playing ? (
                <>
                  <span className="block h-2.5 w-[3px] bg-current" />
                  <span className="block h-2.5 w-[3px] bg-current" />
                </>
              ) : (
                <span className="block size-0 border-y-[5px] border-l-[8px] border-y-transparent border-l-current" />
              )}
            </span>
            {label}
          </button>
        )}
        <div
          ref={strip}
          role="slider"
          tabIndex={0}
          aria-label={agent.timeline.label}
          aria-orientation="horizontal"
          aria-valuemin={0}
          aria-valuemax={Math.max(0, cells.length - 1)}
          aria-valuenow={current}
          aria-valuetext={name}
          onKeyDown={onKeyDown}
          onPointerDown={(e) => {
            strip.current.setPointerCapture?.(e.pointerId)
            setDown(true)
            seekTo(pick(e))
          }}
          onPointerMove={(e) => {
            const i = pick(e)
            setHover(i)
            if (down) seekTo(i)
          }}
          onPointerUp={() => setDown(false)}
          onPointerCancel={() => setDown(false)}
          onPointerLeave={() => setHover(null)}
          className="relative flex h-11 min-w-0 flex-1 cursor-pointer items-center"
          style={{ touchAction: 'none' }}
        >
          {cells.map((c, i) => {
            const st = stateWord(i, current, done, false)
            return (
              <div key={`${c.name}-${i}`} aria-hidden="true" className="relative h-full flex-1">
                <span className={`absolute left-0 top-1/2 w-px -translate-y-1/2 ${st === 'current' ? 'h-6 bg-x-signal' : 'h-3 bg-x-faint'}`} />
                <span
                  className={`absolute inset-x-0 top-1/2 -translate-y-1/2 ${
                    st === 'done'
                      ? 'h-[2px] bg-x-text'
                      : st === 'current'
                        ? 'h-[3px] bg-x-signal'
                        : 'h-0 border-t border-dashed border-x-faint'
                  }`}
                />
                {hover === i && (
                  <span
                    className="x-mono pointer-events-none absolute bottom-full left-0 z-10 mb-1 whitespace-nowrap border border-x-line bg-x-bg px-2 py-1 text-x-text"
                    style={{ transform: i > cells.length / 2 ? 'translateX(-100%)' : undefined }}
                  >
                    {c.name}
                  </span>
                )}
              </div>
            )
          })}
          <span className="absolute right-0 top-1/2 h-3 w-px -translate-y-1/2 bg-x-faint" aria-hidden="true" />
        </div>
        {trailing}
      </div>
      <Mono as="p" className="mt-2 text-x-faint" aria-hidden="true">
        {agent.timeline.step} / <span className="text-x-text">{name}</span>
      </Mono>
    </div>
  )
}
