// 02 / Pipeline. Six stages along a rail, one yellow marker that travels it with the scroll.
//   lg+          a tall section holding a sticky, viewport-high stage; the rail is horizontal.
//   below lg     ordinary flow, vertical rail with fixed-height rows so the marker maths is plain CSS.
//   reduced      no sticky stage, every stage drawn complete.
// Per frame only CSS variables change: `--p` (written by the scroll controller) and `--m` (the eased
// marker position, written here). The active stage is React state that changes a handful of times.
import { useRef, useState } from 'react'
import { pipeline } from '../content.js'
import { useMinWidth, useReducedMotion, useScrollProgress } from '../hooks/index.js'
import { Container, Mono, Section, SectionHead } from '../ui/index.jsx'
import { markerPosition, stageFromProgress } from './progress.js'

const STAGES = pipeline.stages
const COUNT = STAGES.length
const pad = (n) => String(n).padStart(2, '0')

const CSS = `
@keyframes xp-swap { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
.xp-swap { animation: xp-swap 320ms var(--x-ease) both; }
.xp-ticks-h { background: repeating-linear-gradient(90deg, rgb(var(--x-faint)) 0 1px, transparent 1px calc(100% / ${(COUNT - 1) * 4})); }
.xp-ticks-v { background: repeating-linear-gradient(180deg, rgb(var(--x-faint)) 0 1px, transparent 1px calc(100% / ${(COUNT - 1) * 4})); }
@keyframes xp-tip { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
[data-motion='reduced'] .xp-swap { animation: none; }
`

function statusOf(i, active) {
  return i < active ? 'done' : i === active ? 'active' : 'todo'
}

function Dot({ state, className = '' }) {
  const look =
    state === 'done'
      ? 'border-x-signal bg-x-signal'
      : state === 'active'
        ? 'border-x-signal bg-x-bg outline outline-1 outline-offset-4 outline-x-signal'
        : 'border-x-faint bg-x-bg'
  return <span aria-hidden="true" className={`block size-3 border transition-colors duration-300 ease-x ${look} ${className}`} />
}

// The rail: track, fill, tick marks, the single marker. Geometry in the two orientations
//   horizontal: 6 equal columns, dot centre 6px in from the column's left edge, so the travel
//               between the first and the last dot is exactly 5/6 of the list width.
//   vertical:   rows are 9rem high, so the travel is 5 x 9rem.
function Rail({ horizontal, active }) {
  return (
    <div className="relative">
      {horizontal ? (
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0">
          <div className="absolute left-1.5 top-9 h-0 w-[83.3333%]">
            <span className="absolute left-0 top-0 h-px w-full bg-x-line" />
            <span className="xp-ticks-h absolute left-0 top-1 h-1.5 w-full" />
            <span className="absolute -top-px left-0 h-0.5 w-full origin-left scale-x-[var(--m,0)] bg-x-signal" />
            <span className="absolute left-[calc(var(--m,0)*100%)] top-0 block h-6 w-0.5 -translate-x-1/2 -translate-y-1/2 bg-x-signal" />
          </div>
        </div>
      ) : (
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0">
          <div className="absolute left-1.5 top-3.5 h-[45rem] w-0">
            <span className="absolute left-0 top-0 h-full w-px bg-x-line" />
            <span className="xp-ticks-v absolute left-1 top-0 h-full w-1.5" />
            <span className="absolute -left-px top-0 h-full w-0.5 origin-top scale-y-[var(--m,0)] bg-x-signal" />
            <span className="absolute left-0 top-[calc(var(--m,0)*100%)] block h-0.5 w-6 -translate-x-1/2 -translate-y-1/2 bg-x-signal" />
          </div>
        </div>
      )}
      <ol className={horizontal ? 'grid grid-cols-6' : ''}>
        {horizontal ? (
          STAGES.map((s, i) => {
            const st = statusOf(i, active)
            return (
              <li key={s.id} aria-current={st === 'active' ? 'step' : undefined} className="list-none pr-5 xl:pr-8">
                <Mono as="p" className={`h-5 ${st === 'todo' ? 'text-x-faint' : 'text-x-text'}`}>
                  {pad(i + 1)}
                </Mono>
                <div className="flex h-8 items-center">
                  <Dot state={st} />
                </div>
                <h3 className={`mt-2 text-lg font-semibold tracking-tight transition-colors duration-300 ease-x ${st === 'todo' ? 'text-x-faint' : 'text-x-text'}`}>{s.name}</h3>
                <p className={`mt-2 text-[0.8125rem] leading-relaxed transition-colors duration-300 ease-x ${st === 'todo' ? 'text-x-faint' : st === 'active' ? 'text-x-text' : 'text-x-mute'}`}>{s.note}</p>
              </li>
            )
          })
        ) : (
          STAGES.map((s, i) => {
          const st = statusOf(i, active)
          return (
            <li key={s.id} aria-current={st === 'active' ? 'step' : undefined} className={`relative list-none pl-10 ${i < COUNT - 1 ? 'h-36' : ''}`}>
              <Dot state={st} className="absolute left-0 top-2" />
              <p className="flex h-7 items-center gap-3">
                <Mono className={st === 'todo' ? 'text-x-faint' : 'text-x-text'}>{pad(i + 1)}</Mono>
                <span className={`text-lg font-semibold tracking-tight transition-colors duration-300 ease-x ${st === 'todo' ? 'text-x-faint' : 'text-x-text'}`}>{s.name}</span>
              </p>
              <p className={`mt-1.5 max-w-sm text-sm leading-relaxed transition-colors duration-300 ease-x ${st === 'todo' ? 'text-x-faint' : st === 'active' ? 'text-x-text' : 'text-x-mute'}`}>{s.note}</p>
            </li>
          )
          })
        )}
      </ol>
    </div>
  )
}

// The large readout of the active stage. Redundant with the rail's own text, so hidden from assistive tech.
function Readout({ index }) {
  const s = STAGES[Math.min(index, COUNT - 1)]
  return (
    <div aria-hidden="true" className="min-h-[11rem]">
      <div key={s.id} className="xp-swap">
        <Mono as="p" className="text-x-signal">
          {pad(Math.min(index, COUNT - 1) + 1)} / {pad(COUNT)}
        </Mono>
        <p className="x-h2 mt-3 text-5xl">{s.name}</p>
        <p className="mt-4 max-w-2xl text-2xl leading-snug text-x-text">{s.note}</p>
      </div>
    </div>
  )
}

// Remounted (key) whenever the layout changes, because the scroll hook binds to the element once.
function Track({ sticky, horizontal, reduced }) {
  const ref = useRef(null)
  const [active, setActive] = useState(reduced ? COUNT : 0)

  useScrollProgress(ref, {
    mode: sticky ? 'sticky' : 'flow',
    onProgress: (p) => {
      ref.current?.style.setProperty('--m', markerPosition(p, COUNT).toFixed(4))
      setActive(stageFromProgress(p, COUNT))
    },
  })

  const style = reduced ? { '--p': 1, '--m': 1 } : undefined
  const head = (withIntro) => (
    <SectionHead code="02" label="Pipeline" title={pipeline.title} intro={withIntro ? pipeline.intro : undefined} />
  )

  if (sticky) {
    return (
      <div ref={ref} style={style} className="relative h-[320vh]">
        <div className="sticky top-0 flex h-screen flex-col justify-between pb-10 pt-24">
          <Container className="flex items-end justify-between gap-12">
            {head(false)}
            <p className="hidden max-w-[16rem] pb-1 text-sm leading-relaxed text-x-mute xl:block">{pipeline.intro}</p>
          </Container>
          <Container>
            <Readout index={active} />
          </Container>
          <Container>
            <Rail horizontal active={active} />
          </Container>
        </div>
      </div>
    )
  }

  return (
    <Container className="py-24 sm:py-32">
      {head(true)}
      <div ref={ref} style={style} className="mt-14 sm:mt-20">
        <Rail horizontal={horizontal} active={active} />
      </div>
    </Container>
  )
}

// Hand-off to the next section: a hairline with a signal tip that points down at it.
function Connector() {
  return (
    <Container aria-hidden="true">
      <div className="relative ml-1.5 h-24 w-px bg-x-line">
        <span className="x-loop absolute -bottom-px -left-[3px] block size-[7px] bg-x-signal" style={{ animation: 'xp-tip 1.6s ease-in-out infinite' }} />
      </div>
    </Container>
  )
}

export default function Pipeline() {
  const lg = useMinWidth(1024)
  const reduced = useReducedMotion()
  const sticky = lg && !reduced

  return (
    <Section id="pipeline">
      <style>{CSS}</style>
      <Track key={`${lg}-${reduced}`} sticky={sticky} horizontal={lg} reduced={reduced} />
      <Connector />
    </Section>
  )
}
