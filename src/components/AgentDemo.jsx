import { useEffect, useRef, useState } from 'react'
import { Pause, Play, RotateCcw } from 'lucide-react'
import { agentScenarios } from '../content/site'
import { iconMap, stepIcons } from './icons'

const STEP_MS = 1200
const TOTAL = 5

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
  )
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!mq) return
    const onChange = (e) => setReduced(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return reduced
}

export default function AgentDemo() {
  const reduced = usePrefersReducedMotion()
  const [active, setActive] = useState(0)
  const [shown, setShown] = useState(reduced ? TOTAL : 0)
  const [playing, setPlaying] = useState(true)
  const [inView, setInView] = useState(false)
  const sectionRef = useRef(null)
  const tabRefs = useRef([])

  // Play only while on screen.
  useEffect(() => {
    const el = sectionRef.current
    if (!el || !('IntersectionObserver' in window)) {
      setInView(true)
      return
    }
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.3 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // Advance one step per tick. Cleanup clears the timer so switching tabs never interleaves.
  useEffect(() => {
    if (reduced) {
      setShown(TOTAL)
      return
    }
    if (!playing || !inView || shown >= TOTAL) return
    const id = setInterval(() => setShown((n) => Math.min(n + 1, TOTAL)), STEP_MS)
    return () => clearInterval(id)
  }, [playing, inView, shown, reduced, active])

  function selectTab(i) {
    setActive(i)
    setShown(reduced ? TOTAL : 0)
    setPlaying(true)
  }

  function onTabKey(e) {
    const n = agentScenarios.length
    let next = null
    if (e.key === 'ArrowRight') next = (active + 1) % n
    if (e.key === 'ArrowLeft') next = (active - 1 + n) % n
    if (e.key === 'Home') next = 0
    if (e.key === 'End') next = n - 1
    if (next === null) return
    e.preventDefault()
    selectTab(next)
    tabRefs.current[next]?.focus()
  }

  const scenario = agentScenarios[active]
  const done = shown >= TOTAL

  return (
    <section id="demo" ref={sectionRef} className="mx-auto max-w-6xl px-6 py-20">
      <p className="text-xs font-medium uppercase tracking-wide text-accent">Agent demo</p>
      <h2 className="mt-3 text-3xl md:text-4xl">See what an AI agent does for your business</h2>
      <p className="mt-3 max-w-xl text-muted">
        Pick a situation. Watch how an agent takes it from request to result while your team only handles the exceptions.
      </p>

      <div role="tablist" aria-label="Agent scenarios" className="mt-10 flex flex-wrap gap-2" onKeyDown={onTabKey}>
        {agentScenarios.map((s, i) => {
          const Icon = iconMap[s.icon]
          const selected = i === active
          return (
            <button
              key={s.id}
              ref={(el) => (tabRefs.current[i] = el)}
              role="tab"
              id={`demo-tab-${s.id}`}
              aria-selected={selected}
              aria-controls={`demo-panel-${s.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => selectTab(i)}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                selected
                  ? 'border-primary bg-primary text-primaryInk'
                  : 'border-line text-ink/70 hover:border-primary hover:text-primary'
              }`}
            >
              <Icon className="h-4 w-4" strokeWidth={1.75} />
              {s.label}
            </button>
          )
        })}
      </div>

      <div
        role="tabpanel"
        id={`demo-panel-${scenario.id}`}
        aria-labelledby={`demo-tab-${scenario.id}`}
        className="theme-fade mt-6 rounded-2xl border border-line bg-surface p-6 md:p-8"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="rounded-full border border-dashed border-accent px-3 py-1 text-xs font-medium text-accent">
            Illustrative scenario — not a client case study
          </span>
          {!reduced && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPlaying((p) => !p)}
                aria-label={playing ? 'Pause' : 'Play'}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink/70 transition hover:border-primary hover:text-primary"
              >
                {playing && !done ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={() => selectTab(active)}
                aria-label="Replay"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink/70 transition hover:border-primary hover:text-primary"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        <ol className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-5 md:gap-4">
          {scenario.steps.map((step, i) => {
            const Icon = stepIcons[i]
            const visible = i < shown
            const isLast = i === TOTAL - 1
            return (
              <li
                key={step.role}
                className={`demo-step relative ${visible ? 'demo-step-visible' : ''}`}
                aria-hidden={!visible}
              >
                {i < TOTAL - 1 && (
                  <span
                    className="demo-connector absolute left-5 top-10 h-[calc(100%-1rem)] w-px bg-line md:left-10 md:top-5 md:h-px md:w-[calc(100%-2.5rem)]"
                    aria-hidden="true"
                  >
                    <span
                      className={`block h-full w-full origin-top bg-accent transition-transform duration-700 md:origin-left ${
                        i < shown - 1 ? 'scale-y-100 md:scale-x-100' : 'scale-y-0 md:scale-x-0'
                      }`}
                    />
                  </span>
                )}
                <div className="flex gap-4 md:block">
                  <span
                    className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${
                      isLast && visible ? 'border-accent bg-accent text-paper' : 'border-line bg-surface text-accent'
                    }`}
                  >
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <div className="md:mt-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted">{step.role}</p>
                    <p className="mt-1 text-sm text-ink/90">{step.text}</p>
                  </div>
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
