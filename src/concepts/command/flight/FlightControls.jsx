import { useRef } from 'react'
import { Pause, Play } from 'lucide-react'
import { flightPlan } from '../content'
import { PANEL_ID, buttonGhost, buttonPrimary, tabId } from './controlStyles'
import { stepIndex } from './keys'
import { sceneState, setPaused } from '../scene/store'

// The controls that sit around the plot: mission tabs, the two-view switch, the go / no-go bar and
// Pause Motion. All are flat HTML outside the canvas, so the camera never moves them. 44 px targets,
// real tab and radio semantics with arrow keys.

export function MissionTabs({ demo }) {
  const refs = useRef([])
  const { workflows, active } = demo
  const onKeyDown = (e) => {
    const next = stepIndex(e.key, active, workflows.length)
    if (next == null) return
    e.preventDefault()
    demo.selectScenario(next)
    refs.current[next]?.focus()
  }
  return (
    <div role="tablist" aria-label={flightPlan.missionLabel} onKeyDown={onKeyDown} className="flex flex-wrap">
      {workflows.map((w, i) => (
        <button
          key={w.id}
          ref={(el) => {
            refs.current[i] = el
          }}
          type="button"
          role="tab"
          id={tabId(w.id)}
          aria-selected={i === active}
          aria-controls={PANEL_ID}
          tabIndex={i === active ? 0 : -1}
          data-on={i === active ? 'true' : 'false'}
          onClick={() => demo.selectScenario(i)}
          className="cmd-label min-h-[44px] border-b-2 border-transparent px-4 text-cmd-muted transition-colors duration-micro ease-cmd hover:text-cmd-text focus-visible:[outline-offset:-3px] data-[on=true]:border-cmd-signal data-[on=true]:text-cmd-signal-fg"
        >
          {w.label}
        </button>
      ))}
    </div>
  )
}

// "Mission plan / Agent at work": a two-option radio group.
export function ViewToggle({ demo }) {
  const refs = useRef([])
  const { views } = flightPlan
  const current = Math.max(0, views.findIndex((v) => v.id === demo.view))
  const onKeyDown = (e) => {
    const next = stepIndex(e.key, current, views.length)
    if (next == null) return
    e.preventDefault()
    demo.selectView(views[next].id)
    refs.current[next]?.focus()
  }
  return (
    <div role="radiogroup" aria-label={flightPlan.viewLabel} onKeyDown={onKeyDown} className="inline-flex border border-cmd-line">
      {views.map((v, i) => (
        <button
          key={v.id}
          ref={(el) => {
            refs.current[i] = el
          }}
          type="button"
          role="radio"
          aria-checked={i === current}
          tabIndex={i === current ? 0 : -1}
          data-on={i === current ? 'true' : 'false'}
          onClick={() => demo.selectView(v.id)}
          className="cmd-label min-h-[44px] px-4 text-cmd-muted transition-colors duration-micro ease-cmd hover:text-cmd-text focus-visible:[outline-offset:-3px] data-[on=true]:bg-cmd-signal data-[on=true]:text-cmd-signal-ink"
        >
          {v.label}
        </button>
      ))}
    </div>
  )
}

// The go / no-go bar under the plot. The buttons are enabled only while the craft holds at the gate.
export function DecisionBar({ demo, onDecided }) {
  const { gate } = flightPlan
  const plan = demo.view === 'workflow'
  const waiting = plan && demo.waiting
  const decide = (choice) => {
    demo.decide(choice)
    onDecided?.()
  }
  return (
    <div data-waiting={waiting ? 'true' : 'false'} className="flex min-h-[5.25rem] flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-cmd-line px-5 py-4">
      <div className="min-w-0 max-w-xl">
        <p className="cmd-label text-cmd-faint">{gate.title}</p>
        <p className="mt-1 text-sm text-cmd-muted">
          {!plan ? gate.journey : waiting ? (
            <>
              {gate.waiting} <span className="text-cmd-text">{demo.workflow.decision.verb}</span>
            </>
          ) : demo.decision ? (
            demo.copy.log[demo.decision === 'approve' ? 'approved' : 'rejected']
          ) : (
            gate.idle
          )}
        </p>
      </div>
      {plan && (
        <div className="flex gap-3">
          <button type="button" disabled={!waiting} onClick={() => decide('approve')} className={buttonPrimary}>
            {gate.approve}
          </button>
          <button type="button" disabled={!waiting} onClick={() => decide('reject')} className={buttonGhost}>
            {gate.reject}
          </button>
        </div>
      )}
    </div>
  )
}

// Pause Motion (WCAG 2.2.2): the page-wide switch, repeated here beside the long-running plot. It uses
// the same store as the header control, so both always agree.
export function PauseMotionInline({ paused }) {
  const { pauseMotion } = flightPlan
  return (
    <button
      type="button"
      data-paused={paused}
      onClick={() => setPaused(!sceneState.paused)}
      className="cmd-label inline-flex min-h-[44px] items-center gap-2 border border-cmd-line bg-cmd-bg/80 px-3 text-cmd-muted transition-colors duration-micro ease-cmd hover:border-cmd-faint hover:text-cmd-text data-[paused=true]:text-cmd-signal-fg"
    >
      {paused ? <Play aria-hidden="true" className="h-3.5 w-3.5" /> : <Pause aria-hidden="true" className="h-3.5 w-3.5" />}
      {paused ? pauseMotion.play : pauseMotion.pause}
    </button>
  )
}
