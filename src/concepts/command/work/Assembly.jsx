import { useEffect, useRef, useState } from 'react'
import { work } from '../content.js'
import { useInView, useMinWidth, useReducedMotion } from '../hooks/index.js'
import { Button, Chip, Mono } from '../ui/index.jsx'
import { assemblyLayout } from './assemblyLayout.js'
import { REPLAY_DELAY, START_DELAY, STEP_DURATIONS, stepStatus } from './logic.js'

// The StaffXP assembly sequence (BRIEF §14): a request packet comes in, generic architecture layers
// appear, connect and light up as services, the real dashboard screenshot assembles and the final state
// reads "Pending confirmation". The layers are illustrative (chip), the screenshot is the team's real one.
// Plays once when first visible; under reduced motion the finished state is shown and nothing replays.

const { assembly } = work
const TOTAL = assembly.steps.length // 5: packet, architecture, services, interface, state

// Transform/opacity/stroke-dashoffset only.
const draw = (on, delay = 0) => ({
  strokeDasharray: 1,
  strokeDashoffset: on ? 0 : 1,
  transition: `stroke-dashoffset 600ms var(--x-ease) ${delay}ms`,
})
const fade = (on, delay = 0, from = 'translateX(-12px)') => ({
  opacity: on ? 1 : 0,
  transform: on ? 'none' : from,
  transition: `opacity 420ms var(--x-ease) ${delay}ms, transform 420ms var(--x-ease) ${delay}ms`,
})

export default function Assembly({ screen }) {
  const rootRef = useRef(null)
  const reduced = useReducedMotion()
  const inView = useInView(rootRef, { amount: 0.3 })
  const wide = useMinWidth(768)
  const [step, setStep] = useState(0)
  const [run, setRun] = useState(0)

  useEffect(() => {
    if (!inView || reduced) return undefined
    let timer
    const advance = (s) => {
      setStep(s)
      if (s < TOTAL) timer = setTimeout(() => advance(s + 1), STEP_DURATIONS[s - 1])
    }
    timer = setTimeout(() => advance(1), run === 0 ? START_DELAY : REPLAY_DELAY)
    return () => clearTimeout(timer)
  }, [inView, reduced, run])

  const shown = reduced ? TOTAL : step
  const playing = !reduced && inView && step > 0 && step < TOTAL
  const L = assemblyLayout(wide ? 'wide' : 'tall', assembly.layers.length, screen)
  const replay = () => {
    setStep(0)
    setRun((r) => r + 1)
  }

  const s2 = shown >= 2
  const s3 = shown >= 3
  const s4 = shown >= 4
  const s5 = shown >= 5
  const packetOn = shown >= 1
  const packetGone = shown >= 2

  return (
    <div ref={rootRef} className="mt-12 border-t border-x-line pt-8" data-assembly>
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <h4 className="x-mono text-x-text">{assembly.title}</h4>
          <Chip tone="illustrative">{assembly.illustrativeChip}</Chip>
        </div>
        {!reduced && (
          <Button variant="secondary" type="button" onClick={replay} disabled={playing} className="disabled:cursor-not-allowed disabled:opacity-50">
            {assembly.play}
          </Button>
        )}
      </div>

      <div className="mt-6 bg-x-bg2 p-3 sm:p-5">
        <svg
          viewBox={`0 0 ${L.W} ${L.H}`}
          width={L.W}
          height={L.H}
          role="img"
          aria-label={`Illustrative architecture. A request enters, ${assembly.layers.join(', ')} layers connect, and the ${screen.label.toLowerCase()} screenshot assembles. Final state: ${assembly.finalState}.`}
          className={`block h-auto w-full ${wide ? '' : 'max-w-md'}`}
        >
          {/* request entry */}
          <rect x={L.req.x - 4} y={L.req.y - 4} width="8" height="8" className="fill-x-text" />
          <text x={L.reqLabel.x} y={L.reqLabel.y} className="x-mono fill-x-faint">
            Request
          </text>
          <path d={L.entry} className="fill-none stroke-x-line" strokeWidth="1" />

          {/* left connectors: draw while the architecture nodes appear */}
          <g className="fill-none stroke-x-faint" strokeWidth="1">
            <path d={L.spineL} pathLength="1" style={draw(s2, 200)} />
            {L.nodes.map((n, i) => (
              <path key={i} d={n.stubL} pathLength="1" style={draw(s2, 100 + i * 220)} />
            ))}
          </g>

          {/* right connectors: draw while the services light up */}
          <g className="fill-none stroke-x-signal" strokeWidth="1">
            <path d={L.spineR} pathLength="1" style={draw(s3, 300)} />
            {L.nodes.map((n, i) => (
              <path key={i} d={n.stubR} pathLength="1" style={draw(s3, i * 220)} />
            ))}
            <path d={L.out} pathLength="1" style={draw(s3, 700)} />
          </g>

          {/* request packet */}
          <circle
            cx={L.req.x}
            cy={L.req.y}
            r="5"
            className="fill-x-signal"
            style={{
              opacity: packetOn && !packetGone ? 1 : 0,
              transform: packetOn ? `translate(${L.packet.dx}px, ${L.packet.dy}px)` : 'none',
              transition: packetOn
                ? 'transform 1100ms var(--x-ease), opacity 200ms linear 1100ms'
                : 'opacity 200ms linear',
            }}
          />

          {/* architecture nodes (generic layers) */}
          {L.nodes.map((n, i) => {
            const lit = s3
            const lag = i * 220
            return (
              <g key={assembly.layers[i]} style={fade(s2, i * 220)}>
                <rect
                  x={n.x}
                  y={n.y}
                  width={n.w}
                  height={n.h}
                  className={`fill-x-bg ${lit ? 'stroke-x-signal' : 'stroke-x-faint'}`}
                  strokeWidth="1"
                  style={{ transition: `stroke 300ms linear ${lag}ms` }}
                />
                <text x={n.x + 14} y={n.cy + 4} className="x-mono fill-x-text">
                  {assembly.layers[i]}
                </text>
                <circle
                  cx={n.x + n.w - 16}
                  cy={n.cy}
                  r="4"
                  className={lit ? 'fill-x-signal stroke-x-signal' : 'fill-none stroke-x-faint'}
                  strokeWidth="1"
                  style={{ transition: `fill 300ms linear ${lag}ms, stroke 300ms linear ${lag}ms` }}
                />
              </g>
            )
          })}

          {/* the real screenshot, revealed by a curtain that slides away (transform only) */}
          <image
            href={screen.src}
            x={L.image.x}
            y={L.image.y}
            width={L.image.w}
            height={L.image.h}
            preserveAspectRatio="xMidYMid slice"
            style={{ opacity: s4 ? 1 : 0, transition: 'opacity 200ms linear' }}
          />
          <rect
            x={L.image.x}
            y={L.image.y}
            width={L.image.w}
            height={L.image.h}
            className="fill-x-bg2"
            style={{
              transformBox: 'fill-box',
              transformOrigin: 'right center',
              transform: s4 ? 'scaleX(0)' : 'scaleX(1)',
              transition: 'transform 1100ms var(--x-ease)',
            }}
          />
          <rect
            x={L.image.x}
            y={L.image.y}
            width="2"
            height={L.image.h}
            className="fill-x-signal"
            style={{
              opacity: shown === 4 ? 1 : 0,
              transform: s4 ? `translateX(${L.image.w - 2}px)` : 'none',
              transition: 'transform 1100ms var(--x-ease), opacity 200ms linear',
            }}
          />
          <rect
            x={L.image.x}
            y={L.image.y}
            width={L.image.w}
            height={L.image.h}
            className="fill-none stroke-x-line"
            strokeWidth="1"
          />

          {/* final state: dashed marker because the status is not confirmed */}
          <g style={fade(s5, 0, 'translateY(6px)')}>
            <circle cx={L.state.x + 5} cy={L.state.y - 4} r="4.5" className="fill-none stroke-x-faint" strokeWidth="1" strokeDasharray="2 2" />
            <text x={L.state.x + 18} y={L.state.y} className="x-mono fill-x-text">
              State / {assembly.finalState}
            </text>
          </g>
        </svg>
      </div>

      <ol className="mt-6 grid gap-2 sm:grid-cols-5 sm:gap-4">
        {assembly.steps.map((label, i) => {
          const status = stepStatus(i, shown, TOTAL)
          return (
            <li
              key={label}
              aria-current={status === 'current' ? 'step' : undefined}
              data-status={status}
              className={`flex items-baseline gap-3 border-t pt-3 sm:block ${
                status === 'current' ? 'border-x-signal text-x-text' : status === 'done' ? 'border-x-mute text-x-text' : 'border-x-line text-x-faint'
              }`}
              style={{ transition: 'border-color 300ms linear' }}
            >
              <Mono className="block">{String(i + 1).padStart(2, '0')}</Mono>
              <span className="text-sm sm:mt-1 sm:block">{label}</span>
            </li>
          )
        })}
      </ol>
      <p role="status" className="sr-only">
        {s5 ? `Assembly complete. State: ${assembly.finalState}.` : ''}
      </p>
    </div>
  )
}
