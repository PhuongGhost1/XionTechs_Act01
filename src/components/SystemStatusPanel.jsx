import { useEffect, useRef } from 'react'
import { useInView } from '../hooks/useInView'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { systemStatus } from './content'
import { StatusDot } from './ui'
import './SystemStatusPanel.css'

// The hero's status panel (CONCEPT §5). Every value is an interface mock-up (content.js
// systemStatus.illustrative, no longer shown on screen since 2026-10-15 team review). Four rows, a
// deployment bar that fills once (M3) and a build line with the one terminal cursor on the page's
// first screen.

const COUNT_MS = 1500
const START_DELAY_MS = 500 // lets the panel's own reveal land before the bar starts to fill
const easeOut = (t) => 1 - (1 - t) ** 4

// Staggered pulses, so four green dots do not breathe in unison.
const DOT_DELAYS = ['', '[animation-delay:-0.5s]', '[animation-delay:-1s]', '[animation-delay:-1.5s]']

export default function SystemStatusPanel({ className = '' }) {
  const { title, rows, stateLabel, deployment, build } = systemStatus
  const ref = useRef(null)
  const barRef = useRef(null)
  const numRef = useRef(null)
  const reduced = useReducedMotion()
  const seen = useInView(ref, { once: true })
  const { value } = deployment

  // M3: the bar and its number are driven by one clock, so they cannot drift apart. They write
  // straight to the DOM (never React state per frame). Reduced motion shows the final value.
  useEffect(() => {
    if (!seen) return
    const bar = barRef.current
    const num = numRef.current?.firstChild
    if (!bar || !num) return
    const paint = (k) => {
      bar.style.transform = `scaleX(${(value / 100) * k})`
      num.data = String(Math.round(value * k))
    }
    if (reduced) {
      paint(1)
      return
    }
    let raf = 0
    let t0 = 0
    const tick = (now) => {
      if (!t0) t0 = now
      const t = Math.min(1, (now - t0) / COUNT_MS)
      paint(easeOut(t))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    const timer = window.setTimeout(() => {
      raf = requestAnimationFrame(tick)
    }, START_DELAY_MS)
    return () => {
      window.clearTimeout(timer)
      cancelAnimationFrame(raf)
    }
  }, [seen, reduced, value])

  return (
    <div
      ref={ref}
      role="group"
      aria-labelledby="hero-status-title"
      className={`cmd-ticks border border-cmd-line bg-cmd-surface/90 ${className}`}
    >
      <div className="flex items-center gap-2.5 border-b border-cmd-line px-4 py-2">
        <span aria-hidden="true" className="h-1.5 w-1.5 bg-cmd-signal" />
        <p id="hero-status-title" className="cmd-label text-cmd-text">
          {title}
        </p>
      </div>

      {/* Phones: a 2 x 2 grid of modules. Tablet and up: one row each. */}
      <ul role="list" className="grid grid-cols-2 gap-px bg-cmd-line md:block md:bg-transparent">
        {rows.map((row, i) => (
          <li
            key={row.id}
            className="flex flex-col gap-1.5 bg-cmd-surface px-4 py-3 md:flex-row md:items-center md:justify-between md:gap-3 md:border-b md:border-cmd-line md:bg-transparent md:py-1.5"
          >
            <span className="text-sm text-cmd-text">{row.label}</span>
            <span className="cmd-label flex items-center gap-2 text-cmd-ok">
              <StatusDot className={DOT_DELAYS[i % DOT_DELAYS.length]} />
              {stateLabel}
            </span>
          </li>
        ))}
      </ul>

      <div className="border-t border-cmd-line px-4 pb-4 pt-3 md:border-t-0">
        <div className="flex items-end justify-between gap-3">
          <p className="cmd-label text-cmd-muted">{deployment.label}</p>
          <p aria-hidden="true" className="font-cmd-display text-2xl font-bold leading-none tabular-nums text-cmd-text">
            <span ref={numRef}>{reduced ? value : 0}</span>
            <span className="text-cmd-muted">%</span>
          </p>
        </div>
        <p className="sr-only">{`${value} percent`}</p>
        <div aria-hidden="true" className="status-bar mt-3">
          <span ref={barRef} style={{ transform: `scaleX(${reduced ? value / 100 : 0})` }} />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-cmd-line px-4 py-2">
        <p className="cmd-label text-cmd-muted">
          {build.label} <span className="text-cmd-text">{build.id}</span>
        </p>
        <p className="cmd-label flex items-center gap-2 text-cmd-ok">
          {build.result}
          <span aria-hidden="true" className="cmd-cursor" />
        </p>
      </div>
    </div>
  )
}
