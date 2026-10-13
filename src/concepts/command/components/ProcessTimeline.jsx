import { useCallback, useRef, useState } from 'react'
import { Cable, Compass, Hammer, TrendingUp } from 'lucide-react'
import { useReducedMotion } from '../../../hooks/useReducedMotion'
import { useScrollProgress } from '../../../hooks/useScrollProgress'
import { activeStage, timelineProgress } from './ProcessProgress'
import './ProcessTimeline.css'

// The stage icons named in howWeWork.steps, imported by name (see CLAUDE.md on icon lookups).
const ICONS = { Compass, Hammer, Cable, TrendingUp }

// MOTION §18: one connected timeline, scroll-linked (effects A, B, E). As the page scrolls, --tl
// (0..1) draws the line and carries a signal dot along it; the stage the line has reached
// activates and its card gains emphasis. Every stage's text is always present and nothing moves
// in the layout. The only React state is the active stage index, updated when it changes.
// Reduced motion: no scroll link; the finished line with every stage reached.
export default function ProcessTimeline({ steps }) {
  const ref = useRef(null)
  const activeRef = useRef(0)
  const [active, setActive] = useState(0)
  const reduced = useReducedMotion()
  const count = steps.length

  const onProgress = useCallback(() => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const t = timelineProgress(r.top, r.height, window.innerHeight)
    el.style.setProperty('--tl', t.toFixed(4))
    const next = activeStage(t, count)
    if (next !== activeRef.current) {
      activeRef.current = next
      setActive(next)
    }
  }, [count])

  useScrollProgress(ref, onProgress, { enabled: !reduced })

  return (
    <div ref={ref} className="ptl relative" style={reduced ? { '--n': count, '--tl': 1 } : { '--n': count }}>
      <div aria-hidden="true" className="ptl-track">
        <span className="ptl-fill" />
        {!reduced && (
          <span className="ptl-run">
            <span className="ptl-dot" />
          </span>
        )}
      </div>

      <ol className="ptl-list">
        {steps.map((s, i) => {
          const Icon = ICONS[s.icon]
          const reached = reduced || i <= active
          const current = !reduced && i === active
          return (
            <li key={s.id} className="relative pl-16 lg:pl-0 lg:pt-16">
              {/* Node: neutral, then gold outline once reached, then filled while current. */}
              <span
                aria-hidden="true"
                className="absolute left-0 top-0 z-10 flex h-11 w-11 items-center justify-center rounded-full border-2 border-line bg-paper text-muted"
              >
                {Icon && <Icon className="h-5 w-5" strokeWidth={1.75} />}
                <span
                  className={`absolute -inset-0.5 flex items-center justify-center rounded-full border-2 border-accent bg-paper text-accent transition-opacity duration-base ease-brand ${
                    reached ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  {Icon && <Icon className="h-5 w-5" strokeWidth={1.75} />}
                </span>
                <span
                  className={`absolute -inset-0.5 flex items-center justify-center rounded-full bg-accent text-primaryInk shadow-depth-2 transition-[opacity,transform] duration-base ease-spring ${
                    current ? 'scale-110 opacity-100' : 'scale-75 opacity-0'
                  }`}
                >
                  {Icon && <Icon className="h-5 w-5" strokeWidth={1.75} />}
                </span>
              </span>

              <div className="relative">
                <span
                  aria-hidden="true"
                  className={`absolute -inset-x-4 -inset-y-3 rounded-xl border border-line bg-surface shadow-depth-2 transition-[opacity,transform] duration-base ease-brand ${
                    current ? 'scale-100 opacity-100' : 'scale-[0.97] opacity-0'
                  }`}
                />
                <div className="relative">
                  <span className="text-sm tabular-nums text-muted">{String(i + 1).padStart(2, '0')}</span>
                  <h3 className="mt-2 font-display text-2xl">{s.title}</h3>
                  <span
                    aria-hidden="true"
                    className={`mt-3 block h-0.5 w-10 origin-left bg-accent transition-transform duration-base ease-brand ${
                      current ? 'scale-x-100' : 'scale-x-0'
                    }`}
                  />
                  <p className="mt-3 max-w-xs text-pretty text-muted">{s.desc}</p>
                </div>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
