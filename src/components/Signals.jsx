import { useRef } from 'react'
import { useInView } from '../hooks/useInView'
import { signals } from './content'
import { pad2 } from './regions'
import { Reveal, SectionHead } from './ui'
import { useCountUp } from './useCountUp'

// A figure, counted up from 0 once it is on screen (M3). The count is aria-hidden and the
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

function Tile({ metric, index }) {
  return (
    <li className="flex flex-col bg-cmd-surface p-6 lg:p-7">
      <span aria-hidden="true" className="cmd-label flex items-center justify-between text-cmd-faint">
        <span className="tabular-nums">{pad2(index + 1)}</span>
        <span className="h-1.5 w-1.5 bg-cmd-signal" />
      </span>
      <CountedValue metric={metric} />
      <p className="mt-5 text-base font-semibold text-cmd-text">{metric.label}</p>
      <p className="mt-1.5 text-sm text-cmd-muted">{metric.note}</p>
    </li>
  )
}

// Section 06. Opaque (bg-cmd-bg, not transparent like most sections), so it covers the fixed
// WebGL canvas — this used to also force the light "paper" band regardless of the active theme
// (back when the page had one dark theme and one light accent band for contrast); now that there
// are four selectable themes, that forced override just meant this section stopped matching
// whichever one the visitor picked, so it's gone — bg-cmd-bg/text-cmd-text already track the
// active theme correctly like every other section. A data sheet of the figures we can stand
// behind. No testimonials, no invented numbers, and nothing drawn to a length that implies a value.
// 2026-10-15 (team review): dropped the "Capability map" layer list that used to follow the
// tiles (CLAUDE.md, signals section). toCapabilityMap/capabilityMap stay in content.js, unused,
// in case the team wants the stack listed again later. Same review: the metric tiles no longer
// show "To confirm"/"Placeholder" tags — every tile now carries a real, team-confirmed figure
// (content.js `signals.metrics`), so the placeholder/confirm machinery was removed along with them.
export default function Signals() {
  return (
    <section
      id="signals"
      data-cmd-section
      aria-labelledby="signals-title"
      className="relative border-t border-cmd-line bg-cmd-bg py-24 text-cmd-text lg:py-32"
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
      </div>
    </section>
  )
}
