// The AI-agent demo as one hook: no markup, no styling. Concept pages (src/concepts/*) bring their own
// look and read everything from here, so the run logic stays the main page's (src/workflow/*) and is
// never copied. Data is ILLUSTRATIVE (src/content/site.js: workflows, agentJourneys, aiAgents.run).
//
//   const demo = useAgentDemo({ reduced, running: inView })   // demo.seek(tick) scrubs (and pauses)
//
// Timeline (see run.js): one tick per step; the run waits at the workflow's decision node until the
// visitor calls `demo.decide('approve' | 'reject')`; a drill is a predefined problem (retry or
// escalation); a repeated step in a path is a retry. `running` pauses the clock (off screen, paused).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { agentJourneys, aiAgents, workflows } from '../content/site'
import { buildRun, nextBranchIndex, stateAt, totalTicks } from './run'
import { journeyStateAt, journeyTicks } from './journey'
import { executionLog, statusLine } from './log'
import { runPhase, tickMs } from './phase'

const copy = aiAgents.run

export function useAgentDemo({ reduced = false, running = true } = {}) {
  const [active, setActive] = useState(0)
  const [branch, setBranch] = useState(0)
  const [drillId, setDrillId] = useState(null)
  const [decision, setDecision] = useState(null)
  const [view, setView] = useState('workflow') // 'workflow' | 'agent' (the single-agent journey)
  const [tick, setTick] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [runId, setRunId] = useState(0)
  const [decided, setDecided] = useState(false) // the visitor made a call, or a run finished once
  const [actions, setActions] = useState([]) // newest first: { key, status, text }
  const loggedRun = useRef(-1)

  const workflow = workflows[active]
  const journey = agentJourneys.find((j) => j.id === workflow.id)
  const run = useMemo(() => buildRun(workflow, branch, { drillId, decision }), [workflow, branch, drillId, decision])
  const total = view === 'workflow' ? totalTicks(run) : journeyTicks(journey)
  // Derived every render, so turning reduced motion on mid-run jumps to the finished state.
  const shownTick = reduced ? total : tick
  const state = useMemo(() => stateAt(run, shownTick), [run, shownTick])
  const jState = useMemo(() => journeyStateAt(journey, shownTick), [journey, shownTick])
  const log = useMemo(() => executionLog(workflow, run, shownTick, copy.log), [workflow, run, shownTick])
  const drill = drillId ? workflow.drills.find((d) => d.id === drillId) : null
  const done = view === 'workflow' ? state.done : jState.done
  const waiting = view === 'workflow' && state.waiting
  const phase = runPhase(workflow, state)
  const shownPhase = !playing && !done && !waiting ? 'paused' : phase
  const status = statusLine(workflow, run, state, copy.status)

  const pushAction = useCallback((tone, text) => {
    setActions((list) => [{ key: `${Date.now()}-${list.length}`, status: tone, text }, ...list].slice(0, 6))
  }, [])

  // A drill is logged once per run, when the agent has handled the problem.
  useEffect(() => {
    if (!drill || view !== 'workflow' || loggedRun.current === runId) return
    if (state.done || state.waiting) {
      loggedRun.current = runId
      pushAction(drill.log.status, drill.log.text)
    }
  }, [drill, view, runId, state.done, state.waiting, pushAction])

  useEffect(() => {
    if (done) setDecided(true)
  }, [done])

  // One timeout per tick. The failure tick is held a little longer (phase.js).
  useEffect(() => {
    if (reduced || !playing || !running || tick >= total) return undefined
    const id = setTimeout(() => setTick((t) => t + 1), tickMs(view === 'workflow' ? phase : null))
    return () => clearTimeout(id)
  }, [reduced, playing, running, tick, total, view, phase])

  const restart = useCallback(() => {
    setTick(0)
    setPlaying(true)
    setDecision(null)
    setRunId((r) => r + 1)
  }, [])

  const selectScenario = useCallback(
    (i) => {
      setActive(i)
      setBranch(0)
      setDrillId(null)
      restart()
    },
    [restart],
  )
  const selectView = useCallback(
    (v) => {
      if (v === view) return
      setView(v)
      restart()
    },
    [view, restart],
  )
  const selectDrill = useCallback(
    (id) => {
      setDrillId(id)
      restart()
    },
    [restart],
  )
  const clearDrill = useCallback(() => {
    setDrillId(null)
    setBranch(0)
    restart()
  }, [restart])
  // Replay; with `nextPath` it takes the workflow's other branch (never while a drill is chosen).
  const replay = useCallback(
    (nextPath = false) => {
      if (nextPath && view === 'workflow' && !drillId) setBranch((b) => nextBranchIndex(workflow, b))
      restart()
    },
    [view, drillId, workflow, restart],
  )
  // Continues from the current tick (never restarts), so the run picks up at the decision step.
  const decide = useCallback(
    (choice) => {
      setDecision(choice)
      setDecided(true)
      setTick((t) => Math.min(t, totalTicks(run)))
      setPlaying(true)
      pushAction(choice === 'approve' ? 'approved' : 'rejected', workflow.decision.log[choice])
    },
    [run, workflow, pushAction],
  )

  // Scrub: pause and show the state at `t` (clamped to the run). Time only moves forward by itself.
  const seek = useCallback(
    (t) => {
      setPlaying(false)
      setTick(Math.max(0, Math.min(t, total)))
    },
    [total],
  )

  return {
    // data
    workflows, workflow, journey, run, drill, copy,
    // derived, per tick
    tick: shownTick, total, state, jState, log, status, phase: shownPhase, done, waiting, decision,
    view, active, branch, drillId, playing, decided, actions, runId,
    // actions
    selectScenario, selectView, selectDrill, clearDrill, replay, decide, seek,
    play: () => setPlaying(true),
    pause: () => setPlaying(false),
    toggle: () => setPlaying((p) => !p),
  }
}
