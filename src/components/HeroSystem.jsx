import { useEffect, useRef, useState } from 'react'
import { BrainCircuit, Database, Inbox, UserCheck, Workflow } from 'lucide-react'
import { hero } from '../content/site'
import { useInView } from '../hooks/useInView'
import { useReducedMotion } from '../hooks/useReducedMotion'

// The hero's "connected system": Request → AI → Business logic → Existing systems → Human.
// A signal steps through the nodes once while the hero is on screen (under five seconds, so no
// pause control is needed), then rests with every node lit. Coordinates are node centres in a
// 400 × 420 canvas.
const W = 400
const H = 420
const LAYOUT = [
  { x: 96, y: 58, Icon: Inbox },
  { x: 282, y: 128, Icon: BrainCircuit, core: true },
  { x: 118, y: 212, Icon: Workflow },
  { x: 278, y: 294, Icon: Database },
  { x: 132, y: 366, Icon: UserCheck },
]
const STEP_MS = 1100
const REST_MS = 2400
const CYCLES = 1
const LAST = LAYOUT.length - 1

const pct = (v, total) => `${(v / total) * 100}%`

export default function HeroSystem() {
  const ref = useRef(null)
  const reduced = useReducedMotion()
  const inView = useInView(ref, { threshold: 0.3 })
  const [step, setStep] = useState(0)
  const [cycle, setCycle] = useState(0)
  const finished = reduced || cycle >= CYCLES
  const shown = finished ? LAST : step

  useEffect(() => {
    if (finished || !inView) return
    const atEnd = step === LAST
    const id = setTimeout(() => {
      if (!atEnd) return setStep((s) => s + 1)
      setCycle((c) => c + 1)
      setStep(0)
    }, atEnd ? REST_MS : STEP_MS)
    return () => clearTimeout(id)
  }, [finished, inView, step])

  const nodes = LAYOUT.map((n, i) => ({ ...n, label: hero.system[i].label }))
  const packet = nodes[shown]

  return (
    <div ref={ref} role="img" aria-label={hero.systemLabel} className="relative mx-auto aspect-[400/420] w-full max-w-[20rem] sm:max-w-sm lg:max-w-md">
      <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full" aria-hidden="true">
        <defs>
          <pattern id="hero-dots" width="16" height="16" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" className="fill-line" />
          </pattern>
          <radialGradient id="hero-fade">
            <stop offset="55%" stopColor="white" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <mask id="hero-mask">
            <rect width={W} height={H} fill="url(#hero-fade)" />
          </mask>
        </defs>
        <rect width={W} height={H} fill="url(#hero-dots)" mask="url(#hero-mask)" />
        <circle cx={nodes[1].x} cy={nodes[1].y} r="74" fill="none" strokeWidth="1" className="stroke-accent/25" />

        {/* AI also reads the existing systems directly. */}
        <line x1={nodes[1].x} y1={nodes[1].y} x2={nodes[3].x} y2={nodes[3].y} strokeWidth="1.5" strokeDasharray="3 5" className="stroke-muted/50" />

        {nodes.slice(1).map((n, i) => {
          const from = nodes[i]
          return (
            <g key={n.label}>
              <line x1={from.x} y1={from.y} x2={n.x} y2={n.y} strokeWidth="1.5" className="stroke-line" />
              <line
                x1={from.x}
                y1={from.y}
                x2={n.x}
                y2={n.y}
                strokeWidth="2"
                className="stroke-accent transition-opacity duration-500"
                style={{ opacity: shown > i ? 1 : 0 }}
              />
            </g>
          )
        })}

        {!reduced && (
          <circle
            r="5"
            className="fill-accent"
            style={{ transform: `translate(${packet.x}px, ${packet.y}px)`, transition: `transform ${STEP_MS - 300}ms ease-in-out` }}
          />
        )}
      </svg>

      {nodes.map((n, i) => {
        const { x, y, label, core } = n
        const Icon = n.Icon
        const current = i === shown && !finished
        const lit = i <= shown
        return (
          <div
            key={label}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: pct(x, W), top: pct(y, H) }}
          >
            <span
              aria-hidden="true"
              className="absolute -inset-1.5 rounded-full ring-4 ring-accent/25 transition-opacity duration-300"
              style={{ opacity: current ? 1 : 0 }}
            />
            <span
              className={`relative flex items-center gap-2 whitespace-nowrap rounded-full border px-3.5 py-2 text-sm font-medium shadow-sm ${
                core ? 'border-primary bg-primary text-primaryInk' : 'border-line bg-surface text-ink'
              }`}
            >
              <Icon
                aria-hidden="true"
                strokeWidth={1.75}
                className={`h-4 w-4 transition-colors duration-300 ${core ? '' : lit ? 'text-accent' : 'text-muted'}`}
              />
              {label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
