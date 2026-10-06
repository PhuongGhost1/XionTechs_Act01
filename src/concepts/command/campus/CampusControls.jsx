import { useRef } from 'react'
import { Minus, Pause, Play, Plus, RotateCcw } from 'lucide-react'
import { DAY, dayPhases, layers } from '../campusData'
import { campus } from '../content'
import { sceneState, setPaused } from '../scene/store'
import { stepIndex } from './keys'
import { clock, phaseAt } from './simulate'

// The flat HTML controls around the campus model. 44 px targets, real radio semantics with arrow keys.

const chip =
  'cmd-label inline-flex min-h-[44px] items-center gap-2 border border-cmd-line bg-cmd-bg/80 px-3 text-cmd-muted transition-colors duration-micro ease-cmd hover:border-cmd-faint hover:text-cmd-text'

export function LayerBar({ layer, onChange }) {
  const refs = useRef([])
  const current = Math.max(0, layers.findIndex((l) => l.id === layer))
  const onKeyDown = (e) => {
    const next = stepIndex(e.key, current, layers.length)
    if (next == null) return
    e.preventDefault()
    onChange(layers[next].id)
    refs.current[next]?.focus()
  }
  return (
    <div role="radiogroup" aria-label={campus.layerLabel} onKeyDown={onKeyDown} className="cp-scroll -mx-5 flex max-w-[calc(100%+2.5rem)] overflow-x-auto border-y border-cmd-line sm:mx-0 sm:max-w-full sm:flex-wrap sm:border">
      {layers.map((l, i) => (
        <button
          key={l.id}
          ref={(el) => {
            refs.current[i] = el
          }}
          type="button"
          role="radio"
          aria-checked={i === current}
          tabIndex={i === current ? 0 : -1}
          data-on={i === current ? 'true' : 'false'}
          onClick={() => onChange(l.id)}
          className="cmd-label min-h-[44px] shrink-0 px-3 text-cmd-muted transition-colors duration-micro ease-cmd hover:text-cmd-text focus-visible:[outline-offset:-3px] data-[on=true]:bg-cmd-signal data-[on=true]:text-cmd-signal-ink"
        >
          {l.label}
        </button>
      ))}
    </div>
  )
}

export function Breadcrumb({ crumbs, onGo }) {
  return (
    <nav aria-label={campus.stageLabel} className="pointer-events-auto min-w-0">
      <ol className="flex flex-wrap items-center gap-1">
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1
          return (
            <li key={c.label} className="flex items-center gap-1">
              {i > 0 && (
                <span aria-hidden="true" className="cmd-label text-cmd-faint">
                  /
                </span>
              )}
              {last ? (
                <span aria-current="location" className="cmd-label border border-cmd-signal bg-cmd-bg/85 px-2 py-1.5 text-cmd-signal-fg">
                  {c.label}
                </span>
              ) : (
                <button type="button" onClick={() => onGo(c.sel)} className="cmd-label min-h-[32px] border border-cmd-line bg-cmd-bg/85 px-2 text-cmd-muted hover:text-cmd-text">
                  {c.label}
                </button>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export function StageButtons({ three, paused, onZoom, onReset }) {
  return (
    <div className="flex items-center justify-end gap-2">
      {three && (
        <>
          <button type="button" aria-label={campus.zoomIn} onClick={() => onZoom(0.8)} className={`${chip} w-11 justify-center px-0`}>
            <Plus aria-hidden="true" className="h-4 w-4" />
          </button>
          <button type="button" aria-label={campus.zoomOut} onClick={() => onZoom(1.25)} className={`${chip} w-11 justify-center px-0`}>
            <Minus aria-hidden="true" className="h-4 w-4" />
          </button>
          <button type="button" onClick={onReset} aria-label={campus.resetView} className={chip}>
            <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{campus.resetView}</span>
          </button>
        </>
      )}
      <button
        type="button"
        data-paused={paused}
        aria-label={paused ? campus.pauseMotion.play : campus.pauseMotion.pause}
        onClick={() => setPaused(!sceneState.paused)}
        className={`${chip} data-[paused=true]:text-cmd-signal-fg`}
      >
        {paused ? <Play aria-hidden="true" className="h-3.5 w-3.5" /> : <Pause aria-hidden="true" className="h-3.5 w-3.5" />}
        <span className="hidden sm:inline">{paused ? campus.pauseMotion.play : campus.pauseMotion.pause}</span>
      </button>
    </div>
  )
}

// The "4D": the school day as a scrubber, with play/pause and a chip per phase.
export function DayBar({ time, playing, onPlay, onTime }) {
  const phase = phaseAt(time)
  return (
    <div className="flex flex-col gap-3 border-t border-cmd-line px-5 py-4 lg:flex-row lg:items-center lg:gap-6">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => onPlay(!playing)}
          aria-pressed={playing}
          className="cmd-label inline-flex min-h-[44px] items-center gap-2 bg-cmd-signal px-4 text-cmd-signal-ink transition-colors duration-micro ease-cmd hover:bg-white"
        >
          {playing ? <Pause aria-hidden="true" className="h-3.5 w-3.5" /> : <Play aria-hidden="true" className="h-3.5 w-3.5" />}
          {playing ? campus.day.pause : campus.day.play}
        </button>
        <p className="min-w-[7.5rem]">
          <span className="cmd-label block text-cmd-faint">{campus.day.label}</span>
          <span className="font-cmd-mono text-2xl tabular-nums text-cmd-text" aria-live="off">
            {clock(time)}
          </span>
        </p>
      </div>
      <div className="min-w-0 flex-1">
        <input
          type="range"
          min={DAY.start}
          max={DAY.end}
          step={5}
          value={Math.round(time)}
          aria-label={campus.day.scrubber}
          aria-valuetext={clock(time)}
          onChange={(e) => onTime(Number(e.target.value))}
          className="cp-range w-full"
        />
        <div className="mt-2 flex flex-wrap gap-1">
          {dayPhases.map((p) => (
            <button
              key={p.id}
              type="button"
              data-on={phase === p.id ? 'true' : 'false'}
              onClick={() => onTime(p.at)}
              className="cmd-label min-h-[32px] border border-cmd-line px-2 text-cmd-muted transition-colors duration-micro ease-cmd hover:text-cmd-text data-[on=true]:border-cmd-signal data-[on=true]:text-cmd-signal-fg"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
