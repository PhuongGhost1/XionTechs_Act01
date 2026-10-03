import { useEffect, useId, useRef, useState } from 'react'
import { architecture, sheetOf } from '../content.js'
import { useInView, useReducedMotion } from '../hooks/hooks.js'
import Dimension from '../ui/Dimension.jsx'
import SectionHead from '../ui/SectionHead.jsx'
import { Sheet, SheetHeader } from '../ui/Sheet.jsx'
import { Foundation, GridBubbles, Slab } from './Bay.jsx'
import LevelRow from './LevelRow.jsx'
import { copy } from './copy.js'
import { pathSummary, tracePlan } from './levels.js'
import { at } from './timing.js'
import useCellCount from './useCellCount.js'
import './section.css'

// Sheet 02, "The architecture": a building cut through, one storey per level. Everything plots itself when the
// drawing (not the sheet, which is taller than the screen) enters the viewport. Choosing a level, by hover, by
// keyboard focus or by pressing it, traces the yellow load path from Business down to that level along the
// left rail: a decision at the top loads every layer beneath it.

const PREVIEW_AT = 3900 // ms after the drawing starts plotting: one pass of the load path, then it lets go
const PREVIEW_FOR = 2900

function Key() {
  return (
    <figure aria-label={copy.keyTitle} className="m-0">
      <figcaption className="bp-mono mb-3 text-bp-mute">{copy.keyTitle}</figcaption>
      <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
        {copy.key.map((item) => (
          <li key={item.kind} className="bp-mono flex items-center gap-3 text-bp-text">
            <span aria-hidden="true" className="grid w-8 place-items-center">
              {item.kind === 'datum' && <span className="arch-key-tri" />}
              {item.kind === 'slab' && (
                <svg width="30" height="11" viewBox="0 0 30 11" focusable="false">
                  <rect x="0.5" y="0.5" width="29" height="10" className="fill-none stroke-bp-line" />
                  <path d="M3 10.5 12 0.5M9 10.5 18 0.5M15 10.5 24 0.5M21 10.5 30 0.5" className="fill-none stroke-bp-line" opacity="0.55" />
                </svg>
              )}
              {item.kind === 'load' && <span className="arch-key-load" />}
            </span>
            <span>{item.label}</span>
          </li>
        ))}
      </ul>
    </figure>
  )
}

export default function ArchitectureSection() {
  const { levels } = architecture
  const sheet = sheetOf('architecture')
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const hatchId = `${uid}h`
  const groundId = `${uid}g`
  const ref = useRef(null)
  const inView = useInView(ref, { rootMargin: '0px 0px -22% 0px' })
  const reduced = useReducedMotion()
  const n = useCellCount()
  const last = levels.length - 1

  const [hover, setHover] = useState(null)
  const [focus, setFocus] = useState(null)
  const [pinned, setPinned] = useState(null)
  const [preview, setPreview] = useState(null)

  // One unattended pass of the load path once the drawing is finished, so the interaction advertises itself.
  // Nothing is announced for it, and it never runs under reduced motion.
  useEffect(() => {
    if (!inView || reduced) return undefined
    const on = window.setTimeout(() => setPreview(last), PREVIEW_AT)
    const off = window.setTimeout(() => setPreview(null), PREVIEW_AT + PREVIEW_FOR)
    return () => {
      window.clearTimeout(on)
      window.clearTimeout(off)
    }
  }, [inView, reduced, last])

  const chosen = hover ?? focus ?? pinned
  const active = chosen ?? preview
  const plan = tracePlan(active, levels.length)
  const summary = pathSummary(levels, chosen, copy.joiner)

  const handlersFor = (i) => ({
    onEnter: (e) => {
      if (e.pointerType === 'mouse' || e.pointerType === 'pen') setHover(i)
    },
    onLeave: () => setHover(null),
    onFocus: (e) => {
      if (e.currentTarget.matches(':focus-visible')) setFocus(i)
    },
    onBlur: () => setFocus(null),
    onToggle: () => setPinned((p) => (p === i ? null : i)),
  })

  return (
    // data-in="false" keeps the sheet's own flag from starting the drawing early: `.arch-drawing` has its own.
    <Sheet id="architecture" data-in="false" labelledBy="architecture-title" className="arch py-20 md:py-28">
      <div className="bp-wrap">
        <SheetHeader id="architecture" />
        <div className="mt-10 grid grid-cols-12 items-end gap-x-6 gap-y-10">
          <SectionHead
            id="architecture"
            kicker={architecture.kicker}
            title={architecture.title}
            lede={architecture.lede}
            draft={architecture.draft}
            className="col-span-12 lg:col-span-9"
          />
          <div className="col-span-12 sm:col-span-6 lg:col-span-3 lg:col-start-10">
            <Key />
          </div>
        </div>

        <div ref={ref} data-in={inView ? 'true' : 'false'} data-lit={active != null ? 'true' : 'false'} className="arch-drawing mt-16 lg:mt-24">
          <svg className="arch-defs" aria-hidden="true" focusable="false">
            <defs>
              <pattern id={hatchId} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="6" className="arch-hatch-line" />
              </pattern>
              <pattern id={groundId} width="7" height="9" patternUnits="userSpaceOnUse" patternTransform="skewX(-35)">
                <line x1="0" y1="0" x2="0" y2="9" className="arch-hatch-line" />
              </pattern>
            </defs>
          </svg>

          <span aria-hidden="true" className="arch-rail" />
          <span aria-hidden="true" className="arch-wall arch-wall--l" style={at(0)} />
          <span aria-hidden="true" className="arch-wall arch-wall--r" style={at(160)} />
          <span aria-hidden="true" className="arch-origin" />
          <span aria-hidden="true" className="arch-pathchip bp-mono">
            {architecture.loadPath}
          </span>

          <GridBubbles n={n} />
          <Slab hatchId={hatchId} row={-1} />
          <ol className="arch-levels" aria-labelledby="architecture-title">
            {levels.map((level, row) => (
              <LevelRow
                key={level.id}
                level={level}
                row={row}
                last={row === last}
                n={n}
                hatchId={hatchId}
                trace={plan[row]}
                active={active === row}
                pinned={pinned === row}
                handlers={handlersFor(row)}
              />
            ))}
          </ol>
          <Foundation n={n} hatchId={hatchId} groundId={groundId} />

          <div className="arch-dimcol" aria-hidden="true">
            <span className="arch-ext arch-ext--t" style={at(1700)} />
            <span className="arch-ext arch-ext--b" style={at(1700)} />
            <div className="arch-dimcol__line">
              <Dimension axis="y" label={architecture.total} delay={1900} />
            </div>
          </div>

          <div className="arch-measure" aria-hidden="true">
            <span className="arch-mext arch-mext--l" style={at(2100)} />
            <span className="arch-mext arch-mext--r" style={at(2100)} />
            <Dimension axis="x" measure delay={2300} />
          </div>
        </div>

        <div className="mt-28 grid grid-cols-12 gap-x-6 gap-y-10 md:pl-[var(--datum)]">
          <div className="col-span-12 md:col-span-5">
            <div className="flex items-end gap-3 border-b-2 border-bp-line pb-2">
              <span aria-hidden="true" className="bp-mono grid h-8 w-8 shrink-0 place-items-center rounded-full border border-bp-line text-bp-text">
                {copy.drawingMark}
              </span>
              <p className="bp-h3 m-0 text-[1.375rem] text-bp-text">{copy.drawingTitle}</p>
            </div>
            <p className="bp-mono mt-2 text-bp-mute">
              {sheet.title} · {copy.drawingScale}
            </p>
          </div>
          <div className="col-span-12 md:col-span-5 md:col-start-8">
            <p className="m-0 max-w-[34ch] text-[0.9375rem] leading-relaxed text-bp-text">{architecture.hint} {copy.pressHint}</p>
            <p aria-live="polite" className="bp-mono mt-3 min-h-[2.7em] text-bp-mute">
              {summary ? (
                <>
                  <span className="text-bp-text">
                    {architecture.loadPath}: {summary.names}
                  </span>{' '}
                  <br />
                  {summary.codes}
                </>
              ) : null}
            </p>
          </div>
        </div>
      </div>
    </Sheet>
  )
}
