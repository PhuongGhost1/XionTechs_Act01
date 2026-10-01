import { useEffect, useMemo, useRef, useState } from 'react'
import { Pause, Play, RotateCcw } from 'lucide-react'
import { sections, workflows } from '../content/site'
import { buildRun, nextBranchIndex, stateAt, totalTicks } from '../workflow/run'
import { iconMap } from './icons'
import WorkflowGraph from './WorkflowGraph'
import WorkflowList from './WorkflowList'
import { typeIcon } from './workflowStyles'
import RunMonitor from './RunMonitor'

const TICK_MS = 700

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
  const [branch, setBranch] = useState(0)
  const [tick, setTick] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [inView, setInView] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const sectionRef = useRef(null)
  const tabRefs = useRef([])

  const workflow = workflows[active]
  const run = useMemo(() => buildRun(workflow, branch), [workflow, branch])
  const total = totalTicks(run)
  // Derived every render, so turning reduced motion on mid-run jumps to the finished path.
  const shownTick = reduced ? total : tick
  const state = useMemo(() => stateAt(run, shownTick), [run, shownTick])

  useEffect(() => {
    const el = sectionRef.current
    if (!el || !('IntersectionObserver' in window)) {
      setInView(true)
      return
    }
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0, rootMargin: '-25% 0px -25% 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // One timeout per tick; cleanup clears it whenever the workflow, branch or tick changes.
  useEffect(() => {
    if (reduced || !playing || !inView || tick >= total) return
    const id = setTimeout(() => setTick((t) => t + 1), TICK_MS)
    return () => clearTimeout(id)
  }, [reduced, playing, inView, tick, total])

  function selectTab(i) {
    setActive(i)
    setBranch(0)
    setTick(0)
    setPlaying(true)
    setSelectedId(null)
  }

  function replay() {
    setBranch((b) => nextBranchIndex(workflow, b))
    setTick(0)
    setPlaying(true)
  }

  function onTabKey(e) {
    const n = workflows.length
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

  const selected = workflow.nodes.find((n) => n.id === selectedId) ?? workflow.nodes[0]
  const SelectedIcon = typeIcon[selected.type]
  const btn =
    'flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink/70 transition hover:border-primary hover:text-primary'

  return (
    <section id="demo" ref={sectionRef} className="mx-auto max-w-6xl px-6 py-20">
      <p className="text-xs font-medium uppercase tracking-wide text-accent">{sections.demo.eyebrow}</p>
      <h2 className="mt-3 text-3xl md:text-4xl">{sections.demo.title}</h2>
      <p className="mt-3 max-w-xl text-muted">{sections.demo.intro}</p>

      <div role="tablist" aria-label="Agent workflows" className="mt-10 flex flex-wrap gap-2" onKeyDown={onTabKey}>
        {workflows.map((w, i) => {
          const Icon = iconMap[w.icon]
          const isSel = i === active
          return (
            <button
              key={w.id}
              ref={(el) => {
                tabRefs.current[i] = el
              }}
              role="tab"
              id={`demo-tab-${w.id}`}
              aria-selected={isSel}
              aria-controls="demo-panel"
              tabIndex={isSel ? 0 : -1}
              onClick={() => selectTab(i)}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                isSel ? 'border-primary bg-primary text-primaryInk' : 'border-line text-ink/70 hover:border-primary hover:text-primary'
              }`}
            >
              <Icon className="h-4 w-4" strokeWidth={1.75} />
              {w.label}
            </button>
          )
        })}
      </div>

      <div
        role="tabpanel"
        id="demo-panel"
        aria-labelledby={`demo-tab-${workflow.id}`}
        className="theme-fade mt-6 rounded-2xl border border-line bg-surface p-6 md:p-8"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="rounded-full border border-dashed border-accent px-3 py-1 text-xs font-medium text-accent">
            Illustrative scenario — not a client case study
          </span>
          {(!reduced || workflow.branches.length > 1) && (
            <div className="flex gap-2">
              {!reduced && (
                <button
                  type="button"
                  onClick={() => (state.done ? replay() : setPlaying((p) => !p))}
                  aria-label={playing && !state.done ? 'Pause animation' : 'Play animation'}
                  className={btn}
                >
                  {playing && !state.done ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </button>
              )}
              {workflow.branches.length > 1 && (
                <button type="button" onClick={replay} aria-label="Replay with the next path" className={btn}>
                  <RotateCcw className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>

        <div className="mt-6">
          <div>
            <div className="hidden lg:block">
              <WorkflowGraph
                workflow={workflow}
                run={run}
                state={state}
                selectedId={selectedId}
                onSelect={setSelectedId}
                reduced={reduced}
              />
            </div>
            <WorkflowList workflow={workflow} run={run} state={state} className="lg:sr-only" />
            <p className="mt-4 text-sm text-muted" aria-live="polite">
              {state.done ? `Run complete · took the “${run.branchLabel}” path` : `Running · ${run.branchLabel} path`}
            </p>
          </div>

          <aside className="mt-4 hidden rounded-xl border border-line bg-paper p-4 lg:block" aria-live="polite">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Step details</p>
            <div className="mt-3 flex items-center gap-2">
              <SelectedIcon className="h-4 w-4 text-accent" strokeWidth={1.75} />
              <p className="font-medium">{selected.title}</p>
            </div>
            {selected.capability && (
              <p className="mt-2 inline-block rounded border border-dashed border-line px-1.5 text-[11px] text-muted">
                {selected.capability} · draft label
              </p>
            )}
            <p className="mt-3 text-sm text-muted">{selected.desc}</p>
            <p className="mt-4 text-xs text-muted">Click any step in the workflow to see what it does.</p>
          </aside>
        </div>
        <RunMonitor reduced={reduced} inView={inView} playing={playing} />
      </div>
    </section>
  )
}
