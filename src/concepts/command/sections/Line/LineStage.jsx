import { useEffect, useState } from 'react'
import { process as line } from '../../content/index.js'
import { CoreAnchor } from '../../contract/anchors.js'
import { STATIONS } from '../../contract/stations.js'
import { CoreFigure } from '../../core/CoreFigure.jsx'
import { LINE_X0, LINE_X1 } from '../../core/layouts.js'
import { Label } from '../../ui/Label.jsx'
import { cx } from '../../ui/cx.js'
import { Beat } from './Beat.jsx'
import { BriefLine } from './BriefLine.jsx'
import { BUILD_STEP, isLowerRow, rollDirection, stopPercent } from './lineModel.js'

// The pinned stage of THE LINE (doc 4.5): section header with PAUSE | REPLAY, ONE giant step word
// and its sentence, the step's own panel (the brief on REQUEST, the failure beat on BUILD), and at
// the bottom the line itself with six stops. The line, the stops and the packet are real DOM and
// SVG (the information); the core anchor drawn over the rail is decoration.
//
// This component is presentational. The step comes in as a prop (sections/Line/index.jsx owns the
// scroll logic), so it renders the same in tests and in the browser.

// The core draws its line layout inside its anchor: the line runs from LINE_X0 to LINE_X1 of the
// anchor's width, at half its height, with the six method stops evenly between. Sizing the anchor
// as below puts those stops on ours and its line on ours, so the arms collapse INTO the rail, and
// the SVG tier and the WebGL tier agree with the DOM stops to the pixel. Percentages are of the
// stop rail (first stop centre to last stop centre).
const ANCHOR_H = 96
const ANCHOR_BOX = {
  left: `${(-LINE_X0 / (LINE_X1 - LINE_X0)) * 100}%`,
  width: `${100 / (LINE_X1 - LINE_X0)}%`,
  top: '50%',
  height: ANCHOR_H,
  marginTop: -ANCHOR_H / 2,
}

const ROLL_MS = 480 // matches --dur-roll; the outgoing word is removed a beat after its roll ends

/** The giant word. Keeps the previous word mounted for one roll so the two cross in a clip. */
function StepWord({ step }) {
  const steps = line.steps
  const [shown, setShown] = useState({ step, prev: null, dir: null })

  // Adjust state while rendering when the step prop changes (React's documented pattern for
  // state derived from props); no effect, no extra paint with the old word.
  if (shown.step !== step) {
    setShown({ step, prev: shown.step, dir: rollDirection(shown.step, step) })
  }

  useEffect(() => {
    if (shown.prev === null) return undefined
    const t = setTimeout(() => setShown((s) => (s.step === step ? { ...s, prev: null } : s)), ROLL_MS + 60)
    return () => clearTimeout(t)
  }, [shown.prev, shown.step, step])

  return (
    <div
      className="line-word font-display text-step font-medium uppercase text-ink"
      data-dir={shown.dir ?? undefined}
    >
      {shown.prev !== null && (
        <span key={`out-${shown.prev}`} aria-hidden="true" className="line-word__out">
          {steps[shown.prev].label}
        </span>
      )}
      <span key={`in-${shown.step}`} data-roll={shown.dir ? '' : undefined} className="line-word__in">
        {steps[shown.step].label}
      </span>
    </div>
  )
}

function Controls({ paused, onPause, onReplay }) {
  const { controls, a11y } = line
  const base = 'inline-flex h-11 min-w-11 items-center justify-center px-3 font-mono text-label uppercase'
  return (
    <div role="group" aria-label={a11y.controls.text} className="-mx-3 flex items-center">
      <button
        type="button"
        aria-pressed={paused}
        title={a11y.pauseHint.text}
        onClick={onPause}
        className={cx(base, 'transition-colors duration-ui', paused ? 'bg-panel text-ink' : 'text-ink3 hover:text-ink')}
      >
        {controls.pause.text}
      </button>
      <span aria-hidden="true" className="h-4 w-px bg-hairStrong" />
      <button
        type="button"
        title={a11y.replayHint.text}
        onClick={onReplay}
        className={cx(base, 'text-ink3 transition-colors duration-ui hover:text-ink')}
      >
        {controls.replay.text}
      </button>
    </div>
  )
}

/** The line: a full-bleed 1 px hairline, a progress fill, the packet, and six stops in an <ol>. */
function Rail({ step, onStop }) {
  const steps = line.steps
  return (
    <div className="relative mb-[48px] h-11 sm:mb-8">
      <div aria-hidden="true" data-decor="" className="absolute inset-x-0 top-1/2 h-px bg-hairStrong" />
      <div className="column relative h-full">
        {/* Inset by half a stop so the 44 px targets of the first and last stop stay on screen. */}
        <div className="relative mx-[22px] h-full">
          {/* The core's line layout, drawn so its six method stops land exactly on ours (see ANCHOR_BOX). */}
          <div aria-hidden="true" className="pointer-events-none absolute" style={ANCHOR_BOX}>
            <CoreAnchor name="line" className="h-full w-full">
              <CoreFigure layout="line" />
            </CoreAnchor>
          </div>
          <div aria-hidden="true" data-decor="" className="pointer-events-none absolute inset-0">
            <div className="line-fill absolute left-0 top-1/2 h-px w-full origin-left bg-ink3" />
            <div className="line-mover absolute left-0 top-1/2 h-0 w-full">
              <span className="line-packet bg-signal" />
            </div>
          </div>
          <ol aria-label={line.a11y.stops.text} role="list" className="absolute inset-0">
            {steps.map((s, i) => {
              const current = i === step
              const passed = i < step
              return (
                <li
                  key={s.id}
                  className="absolute top-0 h-11 w-11"
                  style={{ left: `${stopPercent(i)}%`, transform: 'translateX(-50%)' }}
                >
                  <button
                    type="button"
                    aria-current={current ? 'step' : undefined}
                    aria-describedby={`line-desc-${i}`}
                    onClick={() => onStop(i)}
                    // After the browser has scrolled the focused stop into view (it does that once the
                    // focus event has run), so our scroll to the step has the last word.
                    onFocus={() => requestAnimationFrame(() => onStop(i))}
                    className="group relative flex h-11 w-11 items-center justify-center"
                  >
                    <span
                      aria-hidden="true"
                      className={cx(
                        'block transition-colors duration-ui',
                        current ? 'h-3 w-3 bg-signal' : passed ? 'h-2 w-2 bg-ink2' : 'h-2 w-2 bg-ink3',
                      )}
                    />
                    <span
                      className={cx(
                        'pointer-events-none absolute left-1/2 top-full mt-[6px] -translate-x-1/2 whitespace-nowrap font-mono text-label uppercase transition-colors duration-ui',
                        isLowerRow(i) && 'max-sm:mt-[24px]',
                        current ? 'text-ink' : 'text-ink3 group-hover:text-ink',
                      )}
                    >
                      {s.label}
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>
        </div>
      </div>
    </div>
  )
}

export function LineStage({ step, paused, runId, played, onStop, onPause, onReplay }) {
  const current = line.steps[step]
  return (
    <div className="stage line-stage">
      <div className="flex h-full flex-col">
        <div className="column pt-2 sm:pt-5">
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-0">
            <Label as="h2" id="line-title">
              {STATIONS[3].label}
            </Label>
            <Controls paused={paused} onPause={onPause} onReplay={onReplay} />
          </div>
        </div>

        <div className="column flex min-h-0 flex-1 flex-col justify-end gap-3 pb-1 sm:gap-6 sm:pb-12">
          <div aria-live="polite" aria-atomic="true" className="flex flex-col gap-3 sm:gap-5">
            <StepWord step={step} />
            <p className="max-w-measure text-body text-ink2">{current.sentence.text}</p>
          </div>
          <div className="min-h-[84px] sm:min-h-[100px]">
            {step === 0 && <BriefLine />}
            {step === BUILD_STEP && <Beat key={runId} animate={runId > played} paused={paused} />}
          </div>
        </div>

        <div>
          <Rail step={step} onStop={onStop} />
          <p className="column pb-2 font-mono text-label uppercase text-ink3">{line.legendLine.text}</p>
        </div>
      </div>

      {/* The sentences of the other steps, as descriptions of their stops (hidden, but read by
          assistive tech when a stop is focused). */}
      {line.steps.map((s, i) => (
        <span key={s.id} id={`line-desc-${i}`} hidden>
          {s.sentence.text}
        </span>
      ))}
    </div>
  )
}
