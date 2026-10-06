import { useRef } from 'react'
import { useInView } from '../../hooks/useInView'
import { capabilityMap, signals } from './content'
import { pad2 } from './regions'
import { PendingTag, Reveal, SectionHead } from './ui'
import { useCountUp } from './useCountUp'
import './Signals.css'

// A real figure, counted up from 0 once it is on screen (M3). The count is aria-hidden and the
// final value is read out in full, so a screen reader never hears the digits climbing.
function CountedValue({ metric }) {
  const boxRef = useRef(null)
  const numRef = useRef(null)
  const seen = useInView(boxRef, { once: true, rootMargin: '0px 0px -10% 0px' })
  useCountUp(numRef, metric.value, { run: seen })
  return (
    <p ref={boxRef} className="mt-10 font-cmd-display text-6xl font-bold leading-none tabular-nums [font-stretch:108%] lg:text-7xl">
      <span className="sr-only">
        {metric.value}
        {metric.suffix}
      </span>
      <span aria-hidden="true">
        <span ref={numRef} />
        {metric.suffix && <span className="text-cmd-signal-fg">{metric.suffix}</span>}
      </span>
    </p>
  )
}

// A figure that does not exist yet: a dash and a label, never a number that looks real.
function EmptyValue() {
  return (
    <p aria-hidden="true" className="mt-10 font-cmd-display text-6xl font-bold leading-none text-cmd-faint [font-stretch:108%] lg:text-7xl">
      —
    </p>
  )
}

function Tile({ metric, index }) {
  const real = !metric.placeholder
  return (
    <li className="flex flex-col bg-cmd-surface p-6 lg:p-7">
      <span aria-hidden="true" className="cmd-label flex items-center justify-between text-cmd-faint">
        <span className="tabular-nums">{pad2(index + 1)}</span>
        {/* A filled square for a figure the live site states, an empty one for a gap. */}
        <span className={`h-1.5 w-1.5 ${real ? 'bg-cmd-signal' : 'border border-cmd-faint'}`} />
      </span>
      {real ? <CountedValue metric={metric} /> : <EmptyValue />}
      <p className="mt-5 text-base font-semibold text-cmd-text">{metric.label}</p>
      <p className="mt-1.5 text-sm text-cmd-muted">{metric.note}</p>
      <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-2 pt-7">
        {metric.confirm && <PendingTag>{signals.confirmLabel}</PendingTag>}
        {metric.placeholder && <PendingTag>{signals.placeholderLabel}</PendingTag>}
      </div>
    </li>
  )
}

// One engineering layer: a node on the spine, the layer's name, a leader line and its technologies. Only
// technologies the live site names are listed. A layer whose technologies are not signed off (draft) shows a
// visible "To confirm" tag for every visitor instead of a name that might not be true.
function Layer({ layer, index, total }) {
  const pos = total === 1 ? 'only' : index === 0 ? 'first' : index === total - 1 ? 'last' : 'mid'
  const named = layer.chips.length > 0 && !layer.draft
  return (
    <Reveal as="li" delay={index * 70} data-pos={pos} className="sg-row relative border-t border-cmd-line py-5 pl-9 last:border-b">
      <span aria-hidden="true" className="sg-spine" />
      <span
        aria-hidden="true"
        className={`sg-node absolute left-0 top-[30px] h-[9px] w-[9px] border ${
          named ? 'border-cmd-signal bg-cmd-signal' : 'border-cmd-faint bg-cmd-bg'
        }`}
      />
      <div className="grid gap-x-6 gap-y-3 lg:grid-cols-[17rem_minmax(0,1fr)_auto] lg:items-center">
        <p className="flex min-w-0 items-baseline gap-3">
          <span aria-hidden="true" className="cmd-label tabular-nums text-cmd-faint">
            {pad2(index + 1)}
          </span>
          <span className="font-cmd-display text-lg font-semibold uppercase leading-7 tracking-tight text-cmd-text">{layer.label}</span>
        </p>
        <span aria-hidden="true" className="sg-leader hidden lg:block" />
        {named ? (
          <ul className="flex flex-wrap gap-2 lg:max-w-[34rem] lg:justify-end">
            {layer.chips.map((chip) => (
              <li key={chip} className="border border-cmd-faint/60 bg-cmd-surface px-2.5 py-1.5 font-cmd-mono text-[12px] leading-none text-cmd-text">
                {chip}
              </li>
            ))}
          </ul>
        ) : layer.draft ? (
          <PendingTag>{signals.confirmLabel}</PendingTag>
        ) : null}
      </div>
    </Reveal>
  )
}

// Section 05, the one paper band. Opaque, so it covers the fixed WebGL canvas. A data sheet of the
// figures we can stand behind, with gaps shown as gaps, then the stack as a map. No testimonials,
// no invented numbers, and nothing drawn to a length that implies a value.
export default function Signals() {
  return (
    <section
      id="signals"
      data-cmd-section
      data-band="paper"
      aria-labelledby="signals-title"
      className="relative bg-cmd-bg py-24 text-cmd-text lg:py-32"
    >
      <div className="mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-12">
        <Reveal>
          <SectionHead index={signals.index} label={signals.label} title={signals.title} intro={signals.intro} titleId="signals-title" />
        </Reveal>

        <Reveal as="ul" delay={120} className="mt-14 grid gap-px border border-cmd-line bg-cmd-line sm:grid-cols-2 lg:mt-20 lg:grid-cols-4">
          {signals.metrics.map((metric, i) => (
            <Tile key={metric.id} metric={metric} index={i} />
          ))}
        </Reveal>

        <div className="mt-20 grid gap-x-12 gap-y-8 lg:mt-28 lg:grid-cols-12">
          <Reveal className="lg:col-span-3">
            <h3
              id="signals-map"
              className="font-cmd-display text-2xl font-semibold uppercase tracking-tight text-cmd-text lg:sticky lg:top-24"
            >
              {signals.stackTitle}
            </h3>
          </Reveal>
          <div className="min-w-0 lg:col-span-9">
            <ol aria-labelledby="signals-map">
              {capabilityMap.map((layer, i) => (
                <Layer key={layer.id} layer={layer} index={i} total={capabilityMap.length} />
              ))}
            </ol>
            <Reveal as="p" delay={capabilityMap.length * 70} className="mt-6 max-w-2xl text-sm text-cmd-muted">
              {signals.stackNote}
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}
