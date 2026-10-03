// 01 / Deploy. The four modules as a master/detail "bay rack": a vertical tab list on the left, the
// active module's detail panel on the right (stacked under the list on narrow screens).
// Hover or focus on a bay publishes `live.pulseModule` (the hero's arm pulses); click, focus or an
// arrow key sets `store.activeModule`. A bus line draws down the left edge as the list scrolls in.
import { useEffect, useRef, useState } from 'react'
import { deploy, modules, statusPanel } from '../content.js'
import { useReducedMotion, useScrollProgress, useStore } from '../hooks/index.js'
import { live, store } from '../state/store.js'
import { Chip, Container, Dot, Mono, Section, SectionHead } from '../ui/index.jsx'
import ModuleVisual from './ModuleVisual.jsx'

const CSS = `
.xd-bus path { stroke-dasharray: 1 1; stroke-dashoffset: calc(1 - clamp(0, (var(--p, 0) - var(--i) * 0.12) / 0.2, 1)); }
@keyframes xd-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
.xd-in { animation: xd-in 260ms var(--x-ease) both; }
@keyframes xd-ping { 0%, 100% { opacity: 0.15; } 50% { opacity: 1; } }
.xd-ping { animation: xd-ping 1.2s ease-in-out infinite; }
[data-motion='reduced'] .xd-in { animation: none; }
`

const ROW_H = 80 // px, matches h-20; the bus segments are drawn in this box

// One row's slice of the bus: a vertical run through the row and a stub into its middle.
function BusSegment({ index, last, active }) {
  const run = last ? 'M4 0V40' : 'M4 0V80'
  return (
    <svg aria-hidden="true" width="24" height={ROW_H} viewBox={`0 0 24 ${ROW_H}`} fill="none" className="xd-bus pointer-events-none absolute left-0 top-0" style={{ '--i': index }}>
      <path d={run} pathLength="1" className="stroke-x-line" style={{ strokeDashoffset: 0 }} />
      <path d="M4 40H24" pathLength="1" className="stroke-x-line" style={{ strokeDashoffset: 0 }} />
      <path d={run} pathLength="1" className="stroke-x-faint" />
      <path d="M4 40H24" pathLength="1" className={active ? 'stroke-x-signal' : 'stroke-x-faint'} />
    </svg>
  )
}

function Bay({ module: m, index, last, active, hot, reduced, tabRef, onSelect, onHot, onKeyDown }) {
  return (
    <button
      ref={tabRef}
      type="button"
      role="tab"
      id={`deploy-tab-${m.id}`}
      aria-selected={active}
      aria-controls="deploy-panel"
      tabIndex={active ? 0 : -1}
      onClick={() => onSelect(m.id)}
      onFocus={() => {
        onSelect(m.id)
        onHot(m.id)
      }}
      onBlur={() => onHot(null, m.id)}
      onPointerEnter={() => onHot(m.id)}
      onPointerLeave={() => onHot(null, m.id)}
      onKeyDown={onKeyDown}
      className={`relative flex h-20 w-full items-center gap-3 border-b border-x-line pl-8 pr-3 text-left transition-colors duration-200 ease-x sm:pr-4 ${active ? 'bg-x-bg2' : 'hover:bg-x-bg2/60'}`}
    >
      <BusSegment index={index} last={last} active={active} />
      {hot && !reduced && (
        <span aria-hidden="true" className="pointer-events-none absolute left-1 top-1/2 -mt-0.5 flex w-6 justify-between">
          {[0, 1, 2].map((d) => (
            <span key={d} className="x-loop xd-ping block size-1 rounded-full bg-x-signal" style={{ animationDelay: `${d * 0.16}s` }} />
          ))}
        </span>
      )}
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <Mono className="flex items-center gap-2 text-x-faint">
          <span className={active ? 'text-x-signal' : ''}>{m.code}</span>
          <span aria-hidden="true">/</span>
          <span>{m.arm}</span>
        </Mono>
        <span className={`text-base font-medium leading-tight tracking-tight ${active ? 'text-x-text' : 'text-x-mute'}`}>{m.name}</span>
      </span>
      <Mono className="flex shrink-0 items-center gap-2 text-x-faint">
        <Dot />
        {statusPanel.state}
      </Mono>
    </button>
  )
}

function Panel({ module: m }) {
  return (
    <div
      role="tabpanel"
      id="deploy-panel"
      aria-labelledby={`deploy-tab-${m.id}`}
      tabIndex={0}
      className="x-ticks relative border border-x-line p-6 sm:p-8 lg:min-h-[30rem] lg:p-10"
    >
      <div key={m.id} className="xd-in">
        <Mono as="p" className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-x-faint">
          <span>
            <span className="text-x-signal">{m.code}</span> / {m.arm}
          </span>
          <span className="flex items-center gap-2">
            <Dot />
            {statusPanel.state}
          </span>
        </Mono>
        <h3 className="mt-5 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{m.name}</h3>
        <p className="mt-4 max-w-prose text-base leading-relaxed text-x-mute">{m.summary}</p>

        <div className="mt-8 grid gap-8 md:grid-cols-2">
          <div className="min-w-0">
            <Mono as="p" className="text-x-faint">
              {deploy.capabilitiesLabel}
            </Mono>
            <ul className="mt-3 border-b border-x-line">
              {m.capabilities.map((c) => (
                <li key={c} className="flex items-baseline gap-3 border-t border-x-line py-3 text-sm text-x-text">
                  <span aria-hidden="true" className="block h-px w-3 shrink-0 translate-y-[-3px] bg-x-faint" />
                  {c}
                </li>
              ))}
            </ul>
            {m.tools.length > 0 && (
              <div className="mt-6">
                <Mono as="p" className="text-x-faint">
                  {deploy.toolsLabel}
                </Mono>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {m.tools.map((t) => (
                    <li key={t.name}>
                      <Chip tone={t.pending ? 'pending' : 'neutral'}>
                        {t.name}
                        {t.pending && (
                          <>
                            <span aria-hidden="true">/</span>
                            <span>{deploy.pendingTool}</span>
                          </>
                        )}
                      </Chip>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div className="min-w-0 self-start border border-x-line p-3">
            <ModuleVisual kind={m.visual} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Deploy() {
  const reduced = useReducedMotion()
  const activeId = useStore((s) => s.activeModule)
  const [hot, setHot] = useState(null)
  const listRef = useRef(null)
  const tabs = useRef([])
  const active = modules.find((m) => m.id === activeId) ?? modules[0]

  useScrollProgress(listRef)

  useEffect(
    () => () => {
      live.pulseModule = null
    },
    [],
  )

  const select = (id) => store.set({ activeModule: id })
  // `onHot(null, id)` clears only if this bay still owns the pulse, so moving between bays never flickers.
  const pulse = (id, from) => {
    if (id) {
      live.pulseModule = id
      setHot(id)
    } else {
      if (from && live.pulseModule !== from) return
      live.pulseModule = null
      setHot(null)
    }
  }

  const onKeyDown = (e) => {
    const i = modules.findIndex((m) => m.id === active.id)
    const n = modules.length
    const next = { ArrowDown: (i + 1) % n, ArrowRight: (i + 1) % n, ArrowUp: (i - 1 + n) % n, ArrowLeft: (i - 1 + n) % n, Home: 0, End: n - 1 }[e.key]
    if (next === undefined) return
    e.preventDefault()
    tabs.current[next]?.focus() // focus handler selects it
  }

  return (
    <Section id="deploy" className="py-24 sm:py-32">
      <style>{CSS}</style>
      <Container>
        <SectionHead code="01" label="Deploy" title={deploy.title} intro={deploy.intro} />
        <div className="mt-14 grid gap-10 sm:mt-20 lg:grid-cols-12 lg:items-start">
          <div className="relative lg:col-span-5">
            <span aria-hidden="true" className="absolute -top-12 left-1 block h-12 w-px bg-x-line" />
            <div ref={listRef} role="tablist" aria-orientation="vertical" aria-label={deploy.title} className="border-t border-x-line">
              {modules.map((m, i) => (
                <Bay
                  key={m.id}
                  module={m}
                  index={i}
                  last={i === modules.length - 1}
                  active={m.id === active.id}
                  hot={hot === m.id}
                  reduced={reduced}
                  tabRef={(el) => {
                    tabs.current[i] = el
                  }}
                  onSelect={select}
                  onHot={pulse}
                  onKeyDown={onKeyDown}
                />
              ))}
            </div>
          </div>
          <div className="lg:col-span-7">
            <Panel module={active} />
          </div>
        </div>
      </Container>
    </Section>
  )
}
