import { useRef } from 'react'
import { agent } from '../../content/agent.js'
import { Button } from '../../ui/Button.jsx'
import { cx } from '../../ui/cx.js'

// The controls of the AGENT RUN station, as separate grid items of the section (index.jsx places
// them with `style`): the scenario tabs, the tools (view, problems, pause and replay), the live
// status line and the Approve / Reject pair. All of them are plain flat DOM, outside every
// transformed element. Layout is inline style and utilities, not a stylesheet: see agent.css.

const c = agent.controls
const base = 'inline-flex min-h-[44px] items-center justify-center px-3 font-mono text-label uppercase transition-colors duration-ui ease-ui motion-off:transition-none'

/** The three scenarios as an ARIA tablist: arrow keys, Home and End move between them. */
export function Tabs({ active, onSelect, style }) {
  const refs = useRef([])
  const names = agent.workflows
  const onKey = (e) => {
    const last = names.length - 1
    const to = { ArrowRight: active === last ? 0 : active + 1, ArrowLeft: active === 0 ? last : active - 1, Home: 0, End: last }[e.key]
    if (to === undefined) return
    e.preventDefault()
    onSelect(to)
    refs.current[to]?.focus()
  }
  return (
    <div role="tablist" aria-label={agent.a11y.tabs.text} onKeyDown={onKey} style={{ gridTemplateColumns: 'repeat(3, 1fr)', ...style }} className="grid border border-hairStrong">
      {names.map((w, i) => (
        <button
          key={w.id}
          ref={(el) => {
            refs.current[i] = el
          }}
          type="button"
          role="tab"
          id={`ag-tab-${w.id}`}
          aria-selected={i === active}
          aria-controls="ag-tape"
          tabIndex={i === active ? 0 : -1}
          onClick={() => onSelect(i)}
          className={cx(base, 'text-center', i > 0 && 'border-l border-hair', i === active ? 'bg-panel text-ink' : 'text-ink3 hover:bg-panel hover:text-ink')}
        >
          {w.label}
        </button>
      ))}
    </div>
  )
}

/** Agent at work, the two problems to inject, pause and replay. */
export function Tools({ run, staticMode, style }) {
  const { view, drillId, playing, done, workflow, actions } = run
  const journey = view === 'journey'
  return (
    <div style={style} className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          aria-pressed={journey}
          title={c.viewHint.text}
          onClick={actions.toggleView}
          className={cx(base, 'border', journey ? 'border-ink bg-panel text-ink' : 'border-hairStrong text-ink2 hover:bg-panel')}
        >
          {c.view.text}
        </button>
        {!staticMode && (
          <div role="group" aria-label={c.group.text} className="ml-auto flex items-center">
            <button type="button" aria-pressed={!playing} onClick={actions.togglePause} className={cx(base, !playing ? 'bg-panel text-ink' : 'text-ink3 hover:text-ink')}>
              {c.pause.text}
            </button>
            <span aria-hidden="true" className="h-4 w-px bg-hairStrong" />
            <button type="button" onClick={actions.replay} className={cx(base, done ? 'text-ink' : 'text-ink3 hover:text-ink')}>
              {c.replay.text}
            </button>
          </div>
        )}
      </div>
      {!journey && (
        <div role="group" aria-label={c.drills.text} className="flex flex-col gap-2">
          <p className="font-mono text-label uppercase text-ink3">{c.drills.text}</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {workflow.drills.map((d) => (
              <button
                key={d.id}
                type="button"
                aria-pressed={drillId === d.id}
                title={drillId === d.id ? c.clear.text : d.hint}
                onClick={() => actions.selectDrill(d.id)}
                className={cx(base, 'border border-dashed', drillId === d.id ? 'border-ink bg-panel text-ink' : 'border-hairStrong text-ink2 hover:bg-panel')}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/** One polite live region for the whole run: what the printer is doing, in words. */
export function Live({ run, staticMode, style }) {
  const word = agent.run.phase[!run.playing && !run.done && !run.awaiting ? 'paused' : run.phase].text
  return (
    <div style={style} className="min-h-11">
      <p aria-hidden="true" className="font-mono text-label uppercase text-ink3">
        {run.view === 'workflow' ? word : agent.controls.view.text}
      </p>
      <p id="ag-status" role="status" aria-live="polite" aria-atomic="true" tabIndex={-1} className="font-mono text-data text-ink outline-none">
        {run.awaiting && staticMode ? agent.tape.sign.text : run.status}
      </p>
    </div>
  )
}

const OFF = { color: 'rgb(var(--ink-3))', background: 'transparent', cursor: 'default' }

/**
 * Approve / Reject. Flat, 48 px, zero radius, mono caps. They are live only while the printer waits
 * (the yellow button is the one that matters then). From 1024 px they sit at the bottom of the left
 * column; below that the pair is a bottom bar, on the CTA bar's place above the dock, drawn only
 * while an approval is awaited.
 */
export function Decide({ run, wide, onDecided, style }) {
  const awaiting = run.awaiting
  if (!wide && !awaiting) return null
  const decide = (choice) => {
    run.actions.decide(choice)
    onDecided()
  }
  const btn = 'w-full justify-center'
  return (
    <div
      role="group"
      aria-label={c.decide.text}
      inert={awaiting ? undefined : ''}
      style={{ gridTemplateColumns: '1fr 1fr', ...style }}
      className={cx('grid gap-2', !wide && 'fixed inset-x-0 bottom-dock z-40 h-14 items-center border-t border-hair bg-ground px-[var(--margin-x)]')}
    >
      <Button variant={awaiting ? 'primary' : 'ghost'} disabled={!awaiting} style={awaiting ? undefined : OFF} onClick={() => decide('approve')} className={btn}>
        {c.approve.text}
      </Button>
      <Button variant="ghost" disabled={!awaiting} style={awaiting ? undefined : OFF} onClick={() => decide('reject')} className={btn}>
        {c.reject.text}
      </Button>
    </div>
  )
}
