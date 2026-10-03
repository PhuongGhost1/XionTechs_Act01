import { useRef, useState } from 'react'
import { work } from '../content.js'
import { useInView } from '../hooks/index.js'
import { Chip, Mono } from '../ui/index.jsx'
import Assembly from './Assembly.jsx'
import { boxStyle, nextTabIndex } from './logic.js'


const toneOf = (item) => item.tone ?? 'neutral'

function SummaryPanel({ record }) {
  return (
    <div className="max-w-2xl">
      <Mono as="p" className="text-x-faint">
        {record.kind}
      </Mono>
      <p className="mt-3 text-lg leading-relaxed text-x-text">{record.summary}</p>
      {record.tags.length > 0 && (
        <ul className="mt-6 flex flex-wrap gap-2">
          {record.tags.map((t) => (
            <li key={t}>
              <Chip>{t}</Chip>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function SpecPanel({ record }) {
  return (
    <dl className="grid gap-x-12 md:grid-cols-2">
      {record.spec.map((row) => {
        const tone = toneOf(row)
        const flagged = tone === 'pending' || tone === 'illustrative'
        return (
          <div key={row.k} className="flex items-baseline justify-between gap-6 border-t border-x-line py-3">
            <dt>
              <Mono className="text-x-faint">{row.k}</Mono>
            </dt>
            <dd className="text-right text-sm text-x-text">{flagged ? <Chip tone={tone}>{row.v}</Chip> : row.v}</dd>
          </div>
        )
      })}
    </dl>
  )
}

// Lines appear one by one the first time the log is shown. Reduced motion: all at once (useInView
// reports true and .x-reveal is forced visible).
function LogPanel({ record }) {
  const ref = useRef(null)
  const seen = useInView(ref, { amount: 0.2 })
  return (
    <div ref={ref}>
      <h5 className="x-mono text-x-text">{record.logTitle}</h5>
      <ul className="mt-4 max-w-2xl border-l border-x-line">
        {record.log.map((line, i) => (
          <li
            key={`${line.t}-${i}`}
            className="x-reveal flex gap-4 py-1.5 pl-4 text-sm text-x-mute"
            data-in={seen}
            style={{ '--d': `${i * 90}ms` }}
          >
            <Mono className="w-8 shrink-0 text-x-faint">{line.t}</Mono>
            <span>{line.m}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// Bordered telemetry frame around a real screenshot. Hotspots are percent boxes; a region is
// highlighted on hover, focus or tap, and its name is also written in the legend, so nothing depends on hover.
function Frame({ screen }) {
  const [active, setActive] = useState(null)
  const spots = screen.hotspots
  const current = spots.find((h) => h.id === active)
  return (
    <figure className="x-ticks relative m-0 p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 pb-3">
        <Mono className="text-x-faint">
          Screen / <span className="text-x-text">{screen.label}</span>
        </Mono>
        <Mono className="text-x-faint">{work.sampleNote}</Mono>
      </div>
      {screen.src ? (
        <div className="relative overflow-hidden border border-x-line">
          <img
            src={screen.src}
            alt={screen.alt}
            width={screen.width}
            height={screen.height}
            loading="lazy"
            decoding="async"
            className="block h-auto w-full"
          />
          {spots.map((h) => {
            const on = h.id === active
            return (
              <button
                key={h.id}
                type="button"
                aria-label={h.label}
                aria-pressed={on}
                onPointerEnter={() => setActive(h.id)}
                onPointerLeave={() => setActive((a) => (a === h.id ? null : a))}
                onFocus={() => setActive(h.id)}
                onBlur={() => setActive((a) => (a === h.id ? null : a))}
                onClick={() => setActive(h.id)}
                style={boxStyle(h.box)}
                className={`absolute block outline outline-2 -outline-offset-2 transition-[background-color,outline-color] duration-200 ease-x ${
                  on ? 'bg-x-signal/10 outline-x-signal' : 'bg-transparent outline-transparent'
                }`}
              >
                {on && (
                  <span aria-hidden="true" className="x-mono absolute left-0 top-0 max-w-full truncate bg-x-signal px-1.5 py-0.5 text-x-ink">
                    {h.label}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      ) : (
        <div className="grid min-h-48 place-items-center border border-dashed border-x-faint p-6 text-center">
          <Mono className="text-x-mute">{work.pendingScreen}</Mono>
        </div>
      )}
      {spots.length > 0 && (
        <div className="mt-4">
          <Mono as="p" className="text-x-faint">
            Regions{current ? <> / <span className="text-x-text">{current.label}</span></> : null}
          </Mono>
          <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
            {spots.map((h) => (
              <li key={h.id} className="flex items-center gap-2 text-sm">
                <span aria-hidden="true" className={`block size-1.5 ${h.id === active ? 'bg-x-signal' : 'border border-x-faint'}`} />
                <span className={h.id === active ? 'text-x-text' : 'text-x-mute'}>{h.label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </figure>
  )
}

function ScreenPanel({ record }) {
  const [idx, setIdx] = useState(0)
  if (record.screens.length === 0) {
    return (
      <div className="max-w-xl border border-dashed border-x-faint p-5">
        <Chip tone="illustrative">{record.status.label}</Chip>
        <p className="mt-3 text-sm leading-relaxed text-x-mute">{work.noScreen}</p>
      </div>
    )
  }
  const screen = record.screens[idx]
  return (
    <div>
      {record.screens.length > 1 && (
        <div role="group" aria-label="Screens" className="mb-4 flex flex-wrap gap-2">
          {record.screens.map((s, i) => (
            <button
              key={s.label}
              type="button"
              aria-pressed={i === idx}
              onClick={() => setIdx(i)}
              className={`x-mono min-h-11 border px-4 transition-colors duration-200 ease-x ${
                i === idx ? 'border-x-signal text-x-text' : 'border-x-line text-x-mute hover:border-x-text hover:text-x-text'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
      <Frame key={screen.src} screen={screen} />
    </div>
  )
}

const PANELS = { summary: SummaryPanel, spec: SpecPanel, log: LogPanel, screen: ScreenPanel }

// An open ledger record: tabs SUMMARY | SPEC | LOG | SCREEN. Every panel stays mounted (inactive ones are
// hidden) so the log reveal and the assembly sequence run once, not on every visit to the tab.
export default function Record({ record, open }) {
  const [tab, setTab] = useState(work.tabs[0].id)
  const refs = useRef([])
  const onKeyDown = (e) => {
    const i = work.tabs.findIndex((t) => t.id === tab)
    const next = nextTabIndex(e.key, i, work.tabs.length)
    if (next === null) return
    e.preventDefault()
    setTab(work.tabs[next].id)
    refs.current[next]?.focus()
  }
  const tabId = (id) => `${record.id}-tab-${id}`
  const panelId = (id) => `${record.id}-panel-${id}`

  return (
    <div id={`${record.id}-record`} role="region" aria-labelledby={`${record.id}-head`} hidden={!open} className="px-3 pb-10 pt-2 sm:px-6">
      <div role="tablist" aria-label={`${record.system} record`} onKeyDown={onKeyDown} className="flex border-b border-x-line">
        {work.tabs.map((t, i) => {
          const on = t.id === tab
          return (
            <button
              key={t.id}
              ref={(el) => {
                refs.current[i] = el
              }}
              id={tabId(t.id)}
              role="tab"
              type="button"
              aria-selected={on}
              aria-controls={panelId(t.id)}
              tabIndex={on ? 0 : -1}
              onClick={() => setTab(t.id)}
              className={`x-mono relative min-h-11 flex-1 px-2 transition-colors duration-200 ease-x sm:flex-none sm:px-5 ${
                on ? 'text-x-text' : 'text-x-faint hover:text-x-text'
              }`}
            >
              {t.label}
              <span aria-hidden="true" className={`absolute inset-x-0 -bottom-px h-0.5 origin-left transition-transform duration-200 ease-x ${on ? 'scale-x-100 bg-x-signal' : 'scale-x-0 bg-x-signal'}`} />
            </button>
          )
        })}
      </div>
      {work.tabs.map((t) => {
        const Panel = PANELS[t.id]
        return (
          <div key={t.id} id={panelId(t.id)} role="tabpanel" aria-labelledby={tabId(t.id)} hidden={t.id !== tab} tabIndex={0} className="pt-6">
            <Panel record={record} />
          </div>
        )
      })}
      {record.assembly && record.screens[0]?.src && <Assembly screen={record.screens[0]} />}
    </div>
  )
}
