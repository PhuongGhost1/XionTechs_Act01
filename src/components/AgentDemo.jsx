import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Pause, Play, RotateCcw, X } from 'lucide-react'
import { agentJourneys, sections, workflows } from '../content/site'
import { buildRun, nextBranchIndex, stateAt, totalTicks } from '../workflow/run'
import { journeyStateAt, journeyTicks } from '../workflow/journey'
import { iconMap } from './icons'
import AgentJourney from './AgentJourney'
import WorkflowGraph from './WorkflowGraph'
import WorkflowList from './WorkflowList'
import { typeIcon } from './workflowStyles'
import RunMonitor from './RunMonitor'
import DrillMenu from './DrillMenu'

const TICK_MS = 700

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
  )
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!mq) return
    const onChange = (e) => setReduced(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return reduced
}

export default function AgentDemo() {
  const reduced = usePrefersReducedMotion()
  const [active, setActive] = useState(0)
  const [branch, setBranch] = useState(0)
  const [tick, setTick] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [inView, setInView] = useState(false)
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

  const workflow = workflows[active]
  const run = useMemo(() => buildRun(workflow, branch, { drillId, decision }), [workflow, branch, drillId, decision])
  const journey = agentJourneys.find((j) => j.id === workflow.id)
  const total = view === 'workflow' ? totalTicks(run) : journeyTicks(journey)
  // Derived every render, so turning reduced motion on mid-run jumps to the finished state.
  const shownTick = reduced ? total : tick
  const state = useMemo(() => stateAt(run, shownTick), [run, shownTick])
  const jState = useMemo(() => journeyStateAt(journey, shownTick), [journey, shownTick])
  const done = view === 'workflow' ? state.done : jState.done
  const drill = drillId ? workflow.drills.find((d) => d.id === drillId) : null
  const waiting = view === 'workflow' && state.waiting
  const retriedAlready = [...run.retries].some((i) => shownTick > 2 * i)
  const lastNode = workflow.nodes.find((n) => n.id === run.steps.at(-1)[0])
  const outcomeTitle = lastNode ? ` · ${lastNode.title}` : ''

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

  useEffect(() => {
    const el = sectionRef.current
    if (!el || !('IntersectionObserver' in window)) {
      setInView(true)
      return
    }
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0, rootMargin: '-25% 0px -25% 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // One timeout per tick; cleanup clears it whenever the workflow, branch or tick changes.
  useEffect(() => {
    if (reduced || !playing || !inView || tick >= total) return
    const id = setTimeout(() => setTick((t) => t + 1), TICK_MS)
    return () => clearTimeout(id)
  }, [reduced, playing, inView, tick, total])

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
    if (view === 'workflow' && !drillId) setBranch((b) => nextBranchIndex(workflow, b))
    restart()
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
    'flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink/70 transition hover:border-primary hover:text-primary'

  return (
    <section id="demo" ref={sectionRef} className="mx-auto max-w-6xl px-6 py-20">
      <p className="text-xs font-medium uppercase tracking-wide text-accent">{sections.demo.eyebrow}</p>
      <h2 className="mt-3 text-3xl md:text-4xl">{sections.demo.title}</h2>
      <p className="mt-3 max-w-xl text-muted">{sections.demo.intro}</p>

      <div role="tablist" aria-label="Agent workflows" className="mt-10 flex flex-wrap gap-2" onKeyDown={onTabKey}>
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
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                isSel ? 'border-primary bg-primary text-primaryInk' : 'border-line text-ink/70 hover:border-primary hover:text-primary'
              }`}
            >
              <Icon className="h-4 w-4" strokeWidth={1.75} />
              {w.label}
            </button>
          )
        })}
      </div>

      <div
        role="tabpanel"
        id="demo-panel"
        aria-labelledby={`demo-tab-${workflow.id}`}
        className="theme-fade mt-6 rounded-2xl border border-line bg-surface p-6 md:p-8"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="rounded-full border border-dashed border-accent px-3 py-1 text-xs font-medium text-accent">
            Illustrative scenario — not a client case study
          </span>
          <div className="flex flex-wrap items-center gap-3">
            <div role="radiogroup" aria-label="Demo view" className="flex rounded-full border border-line p-1" onKeyDown={onViewKey}>
              {[
                ['workflow', 'Workflow'],
                ['agent', 'Agent at work'],
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
                    className={`rounded-full px-3 py-1 text-xs font-medium transition ${on ? 'bg-primary text-primaryInk' : 'text-ink/70 hover:text-primary'}`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
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
                {playing && !done ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>
            )}
            {view === 'workflow' && workflow.branches.length > 1 && (
              <button type="button" onClick={replay} aria-label={drillId ? 'Replay the drill' : 'Replay with the next path'} className={btn}>
                <RotateCcw className="h-4 w-4" />
              </button>
            )}
            {view === 'workflow' && <DrillMenu key={workflow.id} drills={workflow.drills} onSelect={selectDrill} />}
            {view === 'agent' && !reduced && (
              <button type="button" onClick={replay} aria-label="Replay the task" className={btn}>
                <RotateCcw className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {view === 'workflow' && drill && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-accent px-3 py-1 text-xs font-medium text-ink">
            Drill: {drill.label}
            <button type="button" onClick={clearDrill} aria-label="Stop drill" className="rounded-full p-0.5 text-ink/70 hover:text-primary">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <div className="mt-6">
          {view === 'workflow' ? (
            <>
              <div key={runId} className="hidden lg:block">
                <WorkflowGraph
                  workflow={workflow}
                  run={run}
                  state={state}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  reduced={reduced}
                  onDecide={decide}
                />
              </div>
              <WorkflowList workflow={workflow} run={run} state={state} className="lg:sr-only" onDecide={decide} reduced={reduced} />
              <p ref={statusRef} tabIndex={-1} className="mt-4 text-sm text-muted focus:outline-none" aria-live="polite">
                {state.waiting
                  ? 'Waiting for your decision'
                  : state.retrying.size > 0
                    ? 'Retrying…'
                    : drill && state.problemSeen && !state.done && !retriedAlready
                      ? `Problem: ${drill.label}`
                      : state.done
                        ? drill
                          ? `Drill complete · ${drill.label}${outcomeTitle}`
                          : run.decision
                            ? `Run complete · ${run.decision === 'approve' ? 'approved' : 'rejected'} by you${outcomeTitle}`
                            : `Run complete · took the “${run.branchLabel}” path`
                        : drill
                          ? `Running · ${drill.label}`
                          : `Running · ${run.branchLabel} path`}
              </p>
              <aside className="mt-4 hidden rounded-xl border border-line bg-paper p-4 lg:block" aria-live="polite">
                <p className="text-xs font-medium uppercase tracking-wide text-muted">Step details</p>
                <div className="mt-3 flex items-center gap-2">
                  <SelectedIcon className="h-4 w-4 text-accent" strokeWidth={1.75} />
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
        <RunMonitor reduced={reduced} inView={inView} playing={playing} actions={actions} />
      </div>
    </section>
  )
}
