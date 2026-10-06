import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, Pause, Play, RotateCcw, X } from 'lucide-react'
import { agentJourneys, aiAgents, workflows } from '../content/site'
import { useInView } from '../hooks/useInView'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { buildRun, nextBranchIndex, stateAt, totalTicks } from '../workflow/run'
import { journeyStateAt, journeyTicks } from '../workflow/journey'
import { executionLog, statusLine } from '../workflow/log'
import { runPhase, tickMs } from '../workflow/phase'
import { iconMap } from './icons'
import AgentJourney from './AgentJourney'
import AgentRunLog from './AgentRunLog'
import AgentRunStatus from './AgentRunStatus'
import WorkflowGraph from './WorkflowGraph'
import WorkflowList from './WorkflowList'
import { typeIcon } from './workflowStyles'
import RunMonitor from './RunMonitor'
import DrillMenu from './DrillMenu'
import './AgentDemo.css'

const copy = aiAgents.run

// Progressive disclosure (MOTION §10): by default one scenario, the workflow, play/pause, a simple
// status, the approval moment and a small execution log. "Explore What Happens Next" appears after
// the first meaningful action (an approve/reject, or a finished run) and stays; it reveals
// scenarios, the Agent at work view, drills (retry and escalate), path replay and the run log.
// The run itself is one state machine: the tick, read through src/workflow (run, phase, log).
export default function AgentDemo() {
  const reduced = useReducedMotion()
  const [advanced, setAdvanced] = useState(false)
  const [unlocked, setUnlocked] = useState(false)
  const [active, setActive] = useState(0)
  const [branch, setBranch] = useState(0)
  const [tick, setTick] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [selectedId, setSelectedId] = useState(null)
  const [view, setView] = useState('workflow')
  const [runId, setRunId] = useState(0)
  const [drillId, setDrillId] = useState(null)
  const [decision, setDecision] = useState(null)
  const [actions, setActions] = useState([])
  const loggedRunRef = useRef(-1)
  const viewRefs = useRef([])
  const sectionRef = useRef(null)
  const tabRefs = useRef([])
  const statusRef = useRef(null)
  const inView = useInView(sectionRef, { rootMargin: '-25% 0px -25% 0px' })

  const workflow = workflows[active]
  const run = useMemo(() => buildRun(workflow, branch, { drillId, decision }), [workflow, branch, drillId, decision])
  const journey = agentJourneys.find((j) => j.id === workflow.id)
  const total = view === 'workflow' ? totalTicks(run) : journeyTicks(journey)
  // Derived every render, so turning reduced motion on mid-run jumps to the finished state.
  const shownTick = reduced ? total : tick
  const state = useMemo(() => stateAt(run, shownTick), [run, shownTick])
  const jState = useMemo(() => journeyStateAt(journey, shownTick), [journey, shownTick])
  const log = useMemo(() => executionLog(workflow, run, shownTick, copy.log), [workflow, run, shownTick])
  const done = view === 'workflow' ? state.done : jState.done
  const drill = drillId ? workflow.drills.find((d) => d.id === drillId) : null
  const waiting = view === 'workflow' && state.waiting
  const phase = runPhase(workflow, state)
  const shownPhase = !playing && !done && !waiting ? 'paused' : phase

  const pushAction = useCallback((status, text) => {
    setActions((list) => [{ key: `${Date.now()}-${list.length}`, status, text }, ...list].slice(0, 6))
  }, [])

  // Log a drill once per run, when the agent has handled the problem (run done or waiting).
  useEffect(() => {
    if (!drill || view !== 'workflow' || loggedRunRef.current === runId) return
    if (state.done || state.waiting) {
      loggedRunRef.current = runId
      pushAction(drill.log.status, drill.log.text)
    }
  }, [drill, view, runId, state.done, state.waiting, pushAction])

  // A finished run is a meaningful first action too; once unlocked, the advanced toggle stays.
  useEffect(() => {
    if (done) setUnlocked(true)
  }, [done])

  // One timeout per tick; cleanup clears it whenever the workflow, branch or tick changes.
  // The failure tick is held a little longer (src/workflow/phase.js).
  useEffect(() => {
    if (reduced || !playing || !inView || tick >= total) return
    const id = setTimeout(() => setTick((t) => t + 1), tickMs(view === 'workflow' ? phase : null))
    return () => clearTimeout(id)
  }, [reduced, playing, inView, tick, total, view, phase])

  function restart() {
    setTick(0)
    setPlaying(true)
    setDecision(null)
    setRunId((r) => r + 1)
  }

  function selectTab(i) {
    setActive(i)
    setBranch(0)
    setSelectedId(null)
    setDrillId(null)
    restart()
  }

  function replay() {
    if (advanced && view === 'workflow' && !drillId) setBranch((b) => nextBranchIndex(workflow, b))
    restart()
  }

  // Collapsing returns to the default story: first scenario, workflow view, approval path.
  function toggleAdvanced() {
    if (advanced) {
      setActive(0)
      setBranch(0)
      setView('workflow')
      setDrillId(null)
      setSelectedId(null)
      restart()
    }
    setAdvanced((a) => !a)
  }

  function selectView(v) {
    if (v === view) return
    setView(v)
    restart()
  }

  function selectDrill(id) {
    setDrillId(id)
    restart()
  }

  function clearDrill() {
    setDrillId(null)
    setBranch(0)
    restart()
  }

  // Continue from the current tick — never restart — so the run picks up at the decision step.
  function decide(choice) {
    setDecision(choice)
    setUnlocked(true)
    setTick((t) => Math.min(t, totalTicks(run)))
    setPlaying(true)
    pushAction(choice === 'approve' ? 'approved' : 'rejected', workflow.decision.log[choice])
    requestAnimationFrame(() => statusRef.current?.focus())
  }

  function onViewKey(e) {
    if (!['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(e.key)) return
    e.preventDefault()
    const next = view === 'workflow' ? 'agent' : 'workflow'
    selectView(next)
    viewRefs.current[next === 'workflow' ? 0 : 1]?.focus()
  }

  function onTabKey(e) {
    const n = workflows.length
    let next = null
    if (e.key === 'ArrowRight') next = (active + 1) % n
    if (e.key === 'ArrowLeft') next = (active - 1 + n) % n
    if (e.key === 'Home') next = 0
    if (e.key === 'End') next = n - 1
    if (next === null) return
    e.preventDefault()
    selectTab(next)
    tabRefs.current[next]?.focus()
  }

  const selected = workflow.nodes.find((n) => n.id === selectedId) ?? workflow.nodes[0]
  const SelectedIcon = typeIcon[selected.type]
  const btn =
    'flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink/70 transition-colors duration-micro hover:border-primary hover:text-primary'

  return (
    <div ref={sectionRef}>
      {advanced && (
        <div role="tablist" aria-label="Agent workflows" className="wf-rise mb-6 flex flex-wrap gap-2" onKeyDown={onTabKey}>
          {workflows.map((w, i) => {
            const Icon = iconMap[w.icon]
            const isSel = i === active
            return (
              <button
                key={w.id}
                ref={(el) => {
                  tabRefs.current[i] = el
                }}
                role="tab"
                id={`demo-tab-${w.id}`}
                aria-selected={isSel}
                aria-controls="demo-panel"
                tabIndex={isSel ? 0 : -1}
                onClick={() => selectTab(i)}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-micro ${
                  isSel ? 'border-primary bg-primary text-primaryInk' : 'border-line text-ink/70 hover:border-primary hover:text-primary'
                }`}
              >
                <Icon aria-hidden="true" className="h-4 w-4" strokeWidth={1.75} />
                {w.label}
              </button>
            )
          })}
        </div>
      )}

      <div
        role={advanced ? 'tabpanel' : undefined}
        id="demo-panel"
        aria-labelledby={advanced ? `demo-tab-${workflow.id}` : undefined}
        className="rounded-2xl border border-line bg-surface p-5 shadow-2xl shadow-black/20 md:p-8"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-dashed border-accent px-3 py-1 text-xs font-medium text-accent">
              Illustrative scenario — not a client case study
            </span>
            {!advanced && <span className="text-sm text-muted">Scenario: {workflow.label}</span>}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {advanced && (
              <div role="radiogroup" aria-label="Demo view" className="flex rounded-full border border-line p-1" onKeyDown={onViewKey}>
                {[
                  ['workflow', 'Workflow'],
                  ['agent', 'Agent at Work'],
                ].map(([id, label], i) => {
                  const on = view === id
                  return (
                    <button
                      key={id}
                      ref={(el) => {
                        viewRefs.current[i] = el
                      }}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      tabIndex={on ? 0 : -1}
                      onClick={() => selectView(id)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors duration-micro ${on ? 'bg-primary text-primaryInk' : 'text-ink/70 hover:text-primary'}`}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            )}
            {!reduced && (
              <button
                type="button"
                onClick={() => {
                  if (waiting) return
                  if (done) replay()
                  else setPlaying((p) => !p)
                }}
                aria-label={
                  waiting
                    ? 'Waiting for your decision'
                    : done
                      ? 'Replay animation'
                      : playing
                        ? 'Pause animation'
                        : 'Play animation'
                }
                aria-disabled={waiting}
                className={`${btn} ${waiting ? 'opacity-40' : ''}`}
              >
                {playing && !done ? <Pause aria-hidden="true" className="h-4 w-4" /> : <Play aria-hidden="true" className="h-4 w-4" />}
              </button>
            )}
            {advanced && view === 'workflow' && workflow.branches.length > 1 && (
              <button type="button" onClick={replay} aria-label={drillId ? 'Replay the drill' : 'Replay with the next path'} className={btn}>
                <RotateCcw aria-hidden="true" className="h-4 w-4" />
              </button>
            )}
            {advanced && view === 'workflow' && <DrillMenu key={workflow.id} drills={workflow.drills} onSelect={selectDrill} />}
            {advanced && view === 'agent' && !reduced && (
              <button type="button" onClick={replay} aria-label="Replay the task" className={btn}>
                <RotateCcw aria-hidden="true" className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {view === 'workflow' && drill && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-accent px-3 py-1 text-xs font-medium text-ink">
            Drill: {drill.label}
            <button type="button" onClick={clearDrill} aria-label="Stop drill" className="rounded-full p-0.5 text-ink/70 hover:text-primary">
              <X aria-hidden="true" className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <div className="mt-6">
          {view === 'workflow' ? (
            <>
              {/* On large screens the status and the log float over the canvas's top corners
                  (kept clear of every card); on phones they sit above and below the list. */}
              <div className="relative">
                <AgentRunStatus
                  statusRef={statusRef}
                  phase={shownPhase}
                  word={copy.phase[shownPhase]}
                  text={statusLine(workflow, run, state, copy.status)}
                  message={waiting ? aiAgents.humanMessage : null}
                  className="mb-4 lg:absolute lg:right-[1.5%] lg:top-[2%] lg:z-10 lg:mb-0 lg:w-[33%]"
                />
                <div key={runId} className="hidden lg:block">
                  <WorkflowGraph
                    workflow={workflow}
                    run={run}
                    state={state}
                    phase={phase}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    reduced={reduced}
                    onDecide={decide}
                  />
                </div>
                <WorkflowList workflow={workflow} run={run} state={state} phase={phase} className="lg:sr-only" onDecide={decide} />
                <AgentRunLog
                  title={copy.log.title}
                  entries={log}
                  className="mt-4 lg:absolute lg:left-[1.5%] lg:top-[2%] lg:z-10 lg:mt-0 lg:w-[33%]"
                />
              </div>
              <aside className="mt-4 hidden rounded-xl border border-line bg-paper p-4 lg:block" aria-live="polite">
                <p className="text-xs font-medium uppercase tracking-wide text-muted">Step details</p>
                <div className="mt-3 flex items-center gap-2">
                  <SelectedIcon aria-hidden="true" className="h-4 w-4 text-accent" strokeWidth={1.75} />
                  <p className="font-medium">{selected.title}</p>
                </div>
                {selected.capability && (
                  <p className="mt-2 inline-block rounded border border-dashed border-line px-1.5 text-[11px] text-muted">
                    {selected.capability} · draft label
                  </p>
                )}
                <p className="mt-3 text-sm text-muted">{selected.desc}</p>
                <p className="mt-4 text-xs text-muted">Click any step in the workflow to see what it does.</p>
              </aside>
            </>
          ) : (
            <>
              <p className="mb-3 text-sm font-medium text-ink">Agent at work · {journey.task}</p>
              <AgentJourney key={`${journey.id}-${runId}`} journey={journey} state={jState} reduced={reduced} />
              <p className="mt-4 text-sm text-muted" aria-live="polite">
                {jState.done ? `Task complete · ${journey.task}` : `Running · ${journey.task}`}
              </p>
            </>
          )}
        </div>
        {advanced && <RunMonitor reduced={reduced} inView={inView} playing={playing} actions={actions} />}

        {unlocked && (
          <div className="wf-rise mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
            <p className="text-sm text-muted">{advanced ? aiAgents.advanced.lessHint : aiAgents.advanced.moreHint}</p>
            <button
              type="button"
              onClick={toggleAdvanced}
              aria-expanded={advanced}
              className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-sm font-medium text-ink transition-colors duration-micro hover:border-primary hover:text-primary"
            >
              {advanced ? aiAgents.advanced.less : aiAgents.advanced.more}
              <ChevronDown aria-hidden="true" className={`h-4 w-4 transition-transform duration-micro ${advanced ? 'rotate-180' : ''}`} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
