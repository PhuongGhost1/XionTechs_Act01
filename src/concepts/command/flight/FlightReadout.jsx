import { Pause, Play, RotateCcw } from 'lucide-react'
import { flightPlan } from '../content'
import { buttonGhost } from './controlStyles'
import { contextWord } from './keys'
import { journeyNodeStatus, planNodeStatus } from './model'

// The mission readout under the plot: phase, one status line (the only live region), the controls,
// the problems a visitor can inject, and the execution log. Everything here is words; there are no
// numbers, because the scenarios are invented (the badge above the plot says so).

const PHASE_TONE = {
  approval: 'border-cmd-signal text-cmd-signal-fg',
  error: 'border-cmd-danger text-cmd-danger',
  retrying: 'border-cmd-danger text-cmd-danger',
  recovered: 'border-cmd-ok text-cmd-ok',
  completed: 'border-cmd-ok text-cmd-ok',
}

// Glyph colour for a log row; the words carry the meaning, the colour is a second cue.
const TONE_DOT = {
  error: 'bg-cmd-danger',
  problem: 'bg-cmd-danger',
  retry: 'bg-cmd-danger',
  rejected: 'bg-cmd-danger',
  success: 'bg-cmd-ok',
  done: 'bg-cmd-ok',
  approved: 'bg-cmd-ok',
  approval: 'bg-cmd-signal',
  signal: 'bg-cmd-signal',
  decision: 'bg-cmd-signal',
  working: 'bg-cmd-faint',
}

const STATUS_DOT = { off: 'bg-cmd-line', path: 'bg-cmd-faint', failing: 'bg-cmd-danger', retrying: 'bg-cmd-danger', recovered: 'bg-cmd-ok' }

function phaseWord(demo) {
  const { copy } = demo
  if (demo.view === 'workflow') return { id: demo.phase, text: copy.phase[demo.phase] }
  if (!demo.playing && !demo.done) return { id: 'paused', text: copy.phase.paused }
  if (demo.jState.done) return { id: 'completed', text: copy.phase.completed }
  if (demo.jState.compacting) return { id: 'decision', text: flightPlan.readout.contextWords.compacting }
  return { id: 'running', text: copy.phase.running }
}

function ContextMeter({ jState }) {
  const word = contextWord(jState.ringFill, jState.compacting)
  return (
    <div className="mt-4">
      <p className="cmd-label flex items-center justify-between text-cmd-faint">
        <span>{flightPlan.readout.context}</span>
        <span className="text-cmd-muted">{flightPlan.readout.contextWords[word]}</span>
      </p>
      <div aria-hidden="true" className="mt-2 h-1.5 border border-cmd-line">
        <div className="fp-meter h-full origin-left bg-cmd-signal" style={{ transform: `scaleX(${jState.ringFill.toFixed(2)})` }} />
      </div>
    </div>
  )
}

function ProblemGroup({ demo }) {
  const { problem } = flightPlan
  return (
    <div role="group" aria-labelledby="fp-problem" className="mt-6 border-t border-cmd-line pt-5">
      <p id="fp-problem" className="cmd-label text-cmd-text">
        {problem.title}
      </p>
      <p className="mt-1 text-sm text-cmd-muted">{problem.hint}</p>
      <div className="mt-3 grid gap-2">
        {demo.workflow.drills.map((d) => (
          <button
            key={d.id}
            type="button"
            aria-pressed={demo.drillId === d.id}
            onClick={() => demo.selectDrill(d.id)}
            className="group/drill flex min-h-[44px] flex-col items-start justify-center border border-cmd-line px-4 py-2 text-left transition-colors duration-micro ease-cmd hover:border-cmd-faint aria-pressed:border-cmd-signal"
          >
            <span className="text-sm text-cmd-text group-aria-pressed/drill:text-cmd-signal-fg">{d.label}</span>
            <span className="cmd-label text-cmd-muted">{d.hint}</span>
          </button>
        ))}
        {demo.drillId && (
          <button type="button" onClick={demo.clearDrill} className={`${buttonGhost} justify-start !px-4`}>
            {problem.none}
          </button>
        )}
      </div>
    </div>
  )
}

function LogRows({ demo }) {
  const rows = demo.log.slice(-8).reverse()
  return (
    <ol role="log" aria-live="off" aria-label={flightPlan.readout.log} className="mt-4 divide-y divide-cmd-line/70 border-y border-cmd-line/70">
      {rows.map((row) => (
        <li key={row.key} className="fp-row flex items-baseline gap-3 py-2.5 text-sm">
          <span aria-hidden="true" className={`mt-[7px] h-1.5 w-1.5 shrink-0 self-start ${TONE_DOT[row.tone] ?? 'bg-cmd-faint'}`} />
          <span className="min-w-0 text-cmd-text">
            {row.text}
            {row.detail && <span className="text-cmd-muted"> · {row.detail}</span>}
          </span>
        </li>
      ))}
    </ol>
  )
}

function StopRows({ demo, model }) {
  return (
    <ol aria-label={flightPlan.readout.stops} className="mt-4 divide-y divide-cmd-line/70 border-y border-cmd-line/70">
      {model.nodes.map((n, i) => {
        const status = journeyNodeStatus(i, demo.jState)
        const current = !demo.jState.done && i === demo.jState.stopIndex
        return (
          <li key={n.id} aria-current={current ? 'step' : undefined} className="flex items-baseline gap-3 py-2.5 text-sm">
            <span aria-hidden="true" className={`mt-[7px] h-1.5 w-1.5 shrink-0 self-start ${status === 'path' ? 'bg-cmd-line' : status === 'working' ? 'bg-cmd-signal' : 'bg-cmd-faint'}`} />
            <span className={`min-w-0 ${status === 'path' ? 'text-cmd-faint' : 'text-cmd-text'}`}>
              <span className="cmd-label mr-2 text-cmd-faint">{n.num}</span>
              {n.title ?? flightPlan.kinds.compact}
              <span className="text-cmd-muted"> · {n.status}</span>
            </span>
          </li>
        )
      })}
    </ol>
  )
}

// On a narrow stage the plot's labels are only numbers; this key gives them their names.
function Legend({ model, demo }) {
  const nodes = [...model.nodes].sort((a, b) => a.num.localeCompare(b.num))
  return (
    <ol aria-hidden="true" className="mt-4 grid grid-cols-1 gap-x-4 gap-y-1 border-y border-cmd-line/70 py-3 sm:grid-cols-2">
      {nodes.map((n) => {
        const status = model.view === 'journey' ? journeyNodeStatus(Number(n.id.slice(5)), demo.jState) : planNodeStatus(n.id, demo.run, demo.state)
        return (
          <li key={n.id} className={`flex items-baseline gap-2 text-xs ${status === 'off' ? 'text-cmd-faint' : 'text-cmd-muted'}`}>
            <span className={`mt-1 h-1.5 w-1.5 shrink-0 self-start ${STATUS_DOT[status] ?? 'bg-cmd-signal'}`} />
            <span className="font-cmd-mono text-cmd-signal-fg">{n.num}</span>
            <span className="min-w-0">{n.title ?? flightPlan.kinds.compact}</span>
          </li>
        )
      })}
    </ol>
  )
}

export default function FlightReadout({ demo, model, compact, replayRef }) {
  const { controls, readout } = flightPlan
  const journey = demo.view === 'agent'
  const phase = phaseWord(demo)
  const statusText = journey ? `${demo.journey.task} · ${demo.jState.status}` : demo.status
  const canOtherPath = !journey && !demo.drillId && demo.workflow.branches.length > 1
  return (
    <div className="mt-px grid gap-px bg-cmd-line lg:grid-cols-12">
      <section aria-labelledby="fp-readout" className="bg-cmd-bg p-5 sm:p-6 lg:col-span-5">
        <h3 id="fp-readout" className="cmd-label text-cmd-faint">
          {readout.title}
        </h3>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="cmd-label text-cmd-faint">{readout.phase}</span>
          <span data-phase={phase.id} className={`cmd-label border px-2 py-1 ${PHASE_TONE[phase.id] ?? 'border-cmd-faint text-cmd-text'}`}>
            {phase.text}
          </span>
        </div>
        <p aria-live="polite" aria-atomic="true" className="mt-3 min-h-[3.5rem] text-lg leading-snug text-cmd-text">
          <span className="sr-only">{readout.status}: </span>
          {statusText}
        </p>
        {journey && <ContextMeter jState={demo.jState} />}
        {compact && <Legend model={model} demo={demo} />}
        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" ref={replayRef} onClick={() => demo.replay()} className={buttonGhost}>
            <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
            {controls.replay}
          </button>
          {canOtherPath && (
            <button type="button" onClick={() => demo.replay(true)} className={buttonGhost}>
              {controls.otherPath}
            </button>
          )}
          <button type="button" onClick={demo.toggle} disabled={demo.done || demo.waiting} className={buttonGhost}>
            {demo.playing ? <Pause aria-hidden="true" className="h-3.5 w-3.5" /> : <Play aria-hidden="true" className="h-3.5 w-3.5" />}
            {demo.playing ? controls.pause : controls.play}
          </button>
        </div>
        {!journey && <ProblemGroup demo={demo} />}
      </section>
      <section aria-labelledby="fp-log" className="bg-cmd-bg p-5 sm:p-6 lg:col-span-7">
        <h3 id="fp-log" className="cmd-label text-cmd-faint">
          {journey ? readout.stops : readout.log}
        </h3>
        {journey ? <StopRows demo={demo} model={model} /> : <LogRows demo={demo} />}
        <p className="mt-4 text-xs text-cmd-muted">{flightPlan.capabilityNote}</p>
      </section>
    </div>
  )
}
