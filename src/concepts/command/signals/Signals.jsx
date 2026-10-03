import { useLayoutEffect, useRef } from 'react'
import { signals, work } from '../content.js'
import { useInView, useReducedMotion } from '../hooks/index.js'
import { Chip, Container, Mono, Reveal, Section, SectionHead } from '../ui/index.jsx'
import { countUpValue, documentedCounts, formatBuild } from './logic.js'

// 04 / Engineering signals: the page's one light band, a spec sheet. Every readout shows its source.
// Nothing here is a made-up statistic: values come from content.js, from the records on this page, or
// from the build (git commit count injected by Vite).

const BUILD = typeof __BUILD_NUMBER__ !== 'undefined' ? __BUILD_NUMBER__ : 0
const COUNT_MS = 1100
const plain = (n) => String(n)

// Counts from 0 to `value` once the readout is in view. The text node is written directly, so React
// does not re-render per frame. Reduced motion: the final value, immediately.
function CountUp({ value, suffix = '', format = plain }) {
  const ref = useRef(null)
  const reduced = useReducedMotion()
  const inView = useInView(ref, { amount: 0.6 })
  const final = `${format(value)}${suffix}`
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return undefined
    if (!inView || reduced) {
      el.textContent = reduced || inView ? final : `${format(0)}${suffix}`
      return undefined
    }
    let raf
    const t0 = performance.now()
    const tick = (now) => {
      const t = Math.min(1, (now - t0) / COUNT_MS)
      el.textContent = `${format(countUpValue(value, t))}${suffix}`
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, reduced, value, suffix, final, format])
  return (
    <>
      <span ref={ref} aria-hidden="true">
        {final}
      </span>
      <span className="sr-only">{final}</span>
    </>
  )
}

const Source = ({ children }) => (
  <Mono as="p" className="mt-3 text-x-faint">
    {signals.sourceLabel}: <span className="text-x-text">{children}</span>
  </Mono>
)

// One ruled line of the sheet: label and detail left, the figure right.
function Readout({ label, detail, source, figure, extra }) {
  return (
    <li className="grid gap-x-8 gap-y-3 border-t border-x-line py-7 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
      <div className="min-w-0">
        <h3 className="text-lg font-semibold tracking-tight text-x-text">{label}</h3>
        <p className="mt-1 max-w-md text-sm leading-relaxed text-x-mute">{detail}</p>
        {extra && <div className="mt-3">{extra}</div>}
        <Source>{source}</Source>
      </div>
      <p className="text-6xl font-semibold leading-none tracking-tighter text-x-text tabular-nums sm:text-right lg:text-7xl">{figure}</p>
    </li>
  )
}

function StackMatrix() {
  const { stack } = signals
  return (
    <table className="w-full border-collapse text-left">
      <caption className="pb-4 text-left">
        <Mono className="text-x-text">{stack.title}</Mono>
      </caption>
      <thead>
        <tr className="border-t border-x-ink">
          {Object.entries(stack.columns).map(([k, label]) => (
            <th key={k} scope="col" className="py-3 pr-4 align-bottom font-normal last:pr-0">
              <Mono className="text-x-faint">{label}</Mono>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {stack.rows.map((r) => (
          <tr key={r.item} className="border-t border-x-line">
            <th scope="row" className="py-3 pr-4 text-left font-normal">
              <Mono className="text-[0.8125rem] normal-case tracking-normal text-x-text">{r.item}</Mono>
            </th>
            <td className="py-3 pr-4 align-middle">
              {r.state === 'confirmed' ? <Chip tone="ok">{stack.confirmed}</Chip> : <Chip tone="pending">{stack.pending}</Chip>}
            </td>
            <td className="py-3 text-sm text-x-mute">{r.source}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr className="border-t border-x-ink">
          <td colSpan={3} />
        </tr>
      </tfoot>
    </table>
  )
}

function EmptyGauge() {
  const { empty } = signals
  return (
    <li className="grid gap-x-8 gap-y-3 border-y border-x-line py-7 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
      <div className="min-w-0">
        <h3 className="text-lg font-semibold tracking-tight text-x-text">{empty.label}</h3>
        <p className="mt-1 text-sm leading-relaxed text-x-mute">{empty.detail}</p>
        <Source>{empty.source}</Source>
      </div>
      <div className="sm:w-56">
        <div role="img" aria-label={`${empty.state}. ${empty.detail}.`} className="h-3 w-full border border-dashed border-x-ink" />
        <Mono as="p" className="mt-2 flex justify-between gap-4 text-x-text">
          <span>{empty.state}</span>
          <span className="text-x-faint">{empty.detail}</span>
        </Mono>
      </div>
    </li>
  )
}

export default function Signals() {
  const { documented, illustrative } = documentedCounts(work.records)
  return (
    <Section id="signals" band="paper" className="py-24 lg:py-32">
      <Container>
        <SectionHead code="04" label="Signals" title={signals.title} intro={signals.intro} />
        <div className="mt-14 grid gap-14 lg:grid-cols-12 lg:gap-16">
          <Reveal className="lg:col-span-5">
            <StackMatrix />
          </Reveal>
          <Reveal className="lg:col-span-7" delay={120}>
            <ul className="m-0 list-none p-0">
              {signals.facts.map((f) => (
                <Readout
                  key={f.id}
                  label={f.label}
                  detail={f.detail}
                  source={f.source}
                  figure={<CountUp value={f.value} suffix={f.suffix} />}
                />
              ))}
              <Readout
                label={signals.documented.label}
                detail={signals.documented.detail}
                source={signals.documented.source}
                figure={<CountUp value={documented} />}
                extra={illustrative > 0 ? <Chip tone="illustrative">{`${illustrative} ${signals.illustrativeLabel}`}</Chip> : null}
              />
              <Readout
                label={signals.build.label}
                detail={signals.build.detail}
                source={signals.build.source}
                figure={<CountUp value={BUILD} format={formatBuild} />}
              />
              <EmptyGauge />
            </ul>
          </Reveal>
        </div>
      </Container>
    </Section>
  )
}
