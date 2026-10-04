import { useCallback, useEffect, useMemo, useState } from 'react'
import { agent } from '../../content/agent.js'
import { journeyStateAt, journeyTicks } from '../../runtime/agent/journey.js'
import { fill, statusLine } from '../../runtime/agent/log.js'
import { runPhase, tickMs } from '../../runtime/agent/phase.js'
import { buildRun, nextBranchIndex, stateAt, totalTicks } from '../../runtime/agent/run.js'
import { journeyRows, workflowRows } from '../../runtime/agent/tape.js'

// The state machine of the AGENT RUN station: the one place that owns the tick. It is the main
// page's AgentDemo state machine (src/components/AgentDemo.jsx, read 2026-10-04) without the
// graph: a tick advances on a timeout (so the printer paces itself like the main page's demo), the
// run waits at the decision node until the visitor decides, and a repeated step is a retry. The
// run is time driven, started while the stage is on screen and paused while it is not: scrolling
// does not scrub it.
//
// `staticMode` is reduced motion and RAW: the tick is pinned to the end of the run (the finished
// tape, a run that waits for a person ends at the sign box) and nothing ever advances.
//
// What this returns is everything a component needs to render, derived from (scenario, view, drill,
// decision, tick). Nothing per frame lives in React state: the tick changes once per printed line.

export function useAgentRun({ staticMode, onScreen }) {
  const { workflows, journeys } = agent
  const [scenario, setScenario] = useState(0)
  const [branch, setBranch] = useState(0)
  const [drillId, setDrillId] = useState(null)
  const [view, setView] = useState('workflow') // 'workflow' | 'journey'
  const [decision, setDecision] = useState(null)
  const [tick, setTick] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [runId, setRunId] = useState(0)

  const workflow = workflows[scenario]
  const journey = journeys[scenario]
  const run = useMemo(() => buildRun(workflow, branch, { drillId, decision }), [workflow, branch, drillId, decision])
  const total = view === 'workflow' ? totalTicks(run) : journeyTicks(journey)
  const shown = staticMode ? total : tick
  const state = useMemo(() => stateAt(run, shown), [run, shown])
  const phase = runPhase(workflow, state)
  const awaiting = view === 'workflow' && state.waiting
  const done = view === 'workflow' ? state.done : journeyStateAt(journey, shown).done

  const rows = useMemo(
    () => (view === 'workflow' ? workflowRows(workflow, run, shown, agent) : journeyRows(journey, shown, agent)),
    [view, workflow, run, journey, shown],
  )

  const status = useMemo(() => {
    if (view === 'workflow') return statusLine(workflow, run, state, agent.run.line)
    return fill(agent.run.journey[done ? 'done' : 'running'].text, { task: journey.text })
  }, [view, workflow, run, state, done, journey])

  // One timeout per tick; the cleanup clears it whenever anything it depends on changes. The tick
  // of a failure is held longer (phase.js).
  useEffect(() => {
    if (staticMode || !playing || !onScreen || tick >= total) return undefined
    const id = setTimeout(() => setTick((t) => t + 1), tickMs(view === 'workflow' ? phase : null))
    return () => clearTimeout(id)
  }, [staticMode, playing, onScreen, tick, total, view, phase])

  const restart = useCallback(() => {
    setTick(0)
    setPlaying(true)
    setDecision(null)
    setRunId((r) => r + 1)
  }, [])

  const actions = useMemo(
    () => ({
      selectScenario(i) {
        setScenario(i)
        setBranch(0)
        setDrillId(null)
        restart()
      },
      toggleView() {
        setView((v) => (v === 'workflow' ? 'journey' : 'workflow'))
        restart()
      },
      // Choosing the active drill again clears it.
      selectDrill(id) {
        setDrillId((current) => (current === id ? null : id))
        setBranch(0)
        restart()
      },
      togglePause: () => setPlaying((p) => !p),
      // Like the main page: replaying a finished plain run takes the next path.
      replay() {
        if (view === 'workflow' && !drillId && done && workflow.branches.length > 1) setBranch((b) => nextBranchIndex(workflow, b))
        restart()
      },
      // Continue from the current tick, never restart: the run picks up at the decision step.
      decide(choice) {
        setDecision(choice)
        setPlaying(true)
        setTick((t) => Math.min(t, total))
      },
    }),
    [restart, view, drillId, done, workflow, total],
  )

  return { scenario, view, drillId, decision, playing, runId, tick: shown, workflow, journey, run, rows, awaiting, done, phase, status, actions }
}
