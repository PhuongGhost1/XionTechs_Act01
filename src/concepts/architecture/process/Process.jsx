import { useRef, useState } from 'react'
import { process as content } from '../content.js'
import { useInView, useMedia, useReducedMotion, useScrollProgress } from '../hooks/hooks.js'
import Dimension from '../ui/Dimension.jsx'
import { Cross } from '../ui/Marks.jsx'
import Plot from '../ui/Plot.jsx'
import SectionHead, { DraftMark } from '../ui/SectionHead.jsx'
import { Sheet, SheetHeader } from '../ui/Sheet.jsx'
import ProcessDrawing from './ProcessDrawing.jsx'
import { getScene } from './scene.js'
import { copy, figureLabel } from './copy.js'
import { scrollYForProgress, stageAt, stageCentre, stageTick } from './stages.js'
import './process.css'

// Sheet 04, "Process". One drawing, built in six stages. Wide screens: a tall container with a sticky stage;
// scroll progress picks the stage (stages.js), and only the integer stage reaches React state. Below 1024 px
// and under reduced motion there is no sticky stage: the six stages are stacked, each with its own drawing
// frozen at that stage, each plotting itself as it enters the viewport.

const stages = content.stages
const COUNT = stages.length
const PIN_VH = 560 // 100vh of pin plus about 77vh of scroll for each stage

/** lg (1280+), md (1024-1279) or sm: the scale at which the drawing's own labels stay 11 px or more. */
function useDrawingSize() {
  const xl = useMedia('(min-width: 1280px)')
  const lg = useMedia('(min-width: 1024px)')
  return xl ? 'lg' : lg ? 'md' : 'sm'
}

function DimGlyph({ className = '' }) {
  return (
    <svg width="34" height="10" viewBox="0 0 34 10" aria-hidden="true" focusable="false" className={className}>
      <path className="sig" d="M2 5H32" fill="none" strokeWidth="2.4" />
      <path d="M1 0.5V9.5M33 0.5V9.5" fill="none" stroke="currentColor" strokeWidth="1" />
    </svg>
  )
}

/** The drawing schedule: the six stages as an index. Each is a button that scrolls the pin to that stage. */
function StageIndex({ stage, onPick }) {
  return (
    <div className="flex min-h-0 flex-col">
      <p className="bp-mono flex items-center gap-3 text-bp-mute">
        <span>{copy.schedule}</span>
        <span aria-hidden="true" className="h-px flex-1 bg-bp-rule" />
        <span>
          {String(stage + 1).padStart(2, '0')} / {String(COUNT).padStart(2, '0')}
        </span>
      </p>
      <ol className="m-0 mt-3 list-none border-t border-bp-line p-0">
        {stages.map((s, i) => (
          <li key={s.id} className="border-b border-bp-rule">
            <button type="button" className="pr-row" aria-current={i === stage ? 'step' : undefined} onClick={() => onPick(i)}>
              <span aria-hidden="true" className="pr-row__mark" />
              <span className="flex items-baseline gap-4">
                <span className="bp-mono">{s.no}</span>
                <span className="bp-h3 flex-1 text-[clamp(1.5rem,2.1vw,2.1rem)]">{s.label}</span>
                <span className="bp-mono pr-row__dimline flex items-center gap-2">
                  <span>{s.dim}</span>
                  <DimGlyph />
                </span>
              </span>
              <span className="pr-row__desc">
                {s.desc} <DraftMark on={s.draft} />
              </span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  )
}

/** The progress rule along the foot of the drawing; --p is written on the stage by the scroll controller. */
function Ruler({ stage }) {
  return (
    <div className="pr-ruler" aria-hidden="true">
      <span className="pr-ruler__track" />
      <span className="pr-ruler__fill" />
      {stages.map((s, i) => (
        <span key={s.id} className="pr-ruler__tick" data-active={i === stage ? 'true' : 'false'} style={{ left: `${stageTick(i, COUNT) * 100}%` }}>
          <span className="bp-mono">{s.no}</span>
        </span>
      ))}
      <span className="pr-ruler__tick pr-ruler__tick--end" />
      <span className="pr-ruler__mark" />
    </div>
  )
}

function PinnedProcess({ size }) {
  const ref = useRef(null)
  const last = useRef(0)
  const [stage, setStage] = useState(0)
  const entered = useInView(ref, { rootMargin: '0px 0px -30% 0px' })

  useScrollProgress(ref, {
    mode: 'stage',
    onProgress: (p) => {
      const s = stageAt(p, COUNT)
      if (s !== last.current) {
        last.current = s
        setStage(s)
      }
    },
  })

  const pick = (i) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    window.scrollTo({ top: scrollYForProgress(stageCentre(i, COUNT), { top: r.top + window.scrollY, height: r.height, viewport: window.innerHeight }) })
  }

  const s = stages[stage]
  const { w, h } = getScene(size).viewBox
  return (
    <div ref={ref} data-process-stage="" className="relative mt-14" style={{ height: `${PIN_VH}vh` }}>
      <div className="sticky top-14 h-[calc(100vh-3.5rem)]">
        <div className="grid h-full grid-cols-12 items-center gap-x-10 py-6">
          <div className="col-span-4">
            <StageIndex stage={stage} onPick={pick} />
            <p className="bp-mono pr-hint mt-4 text-bp-mute">{copy.hint}</p>
          </div>
          <figure className="pr-figure col-span-8 m-0 justify-self-center" style={{ '--ar': (w / h).toFixed(4) }}>
            <div className="pr-frame relative border border-bp-rule bg-bp-bg">
              <Cross className="absolute -left-2 -top-2 bg-bp-bg text-bp-line" />
              <Cross className="absolute -right-2 -top-2 bg-bp-bg text-bp-line" />
              <Cross className="absolute -bottom-2 -left-2 z-10 bg-bp-bg text-bp-line" />
              <Cross className="absolute -bottom-2 -right-2 z-10 bg-bp-bg text-bp-line" />
              <ProcessDrawing stage={entered ? stage : -1} size={size} label={figureLabel(stage)} className="h-full w-full" />
            </div>
            <Ruler stage={stage} />
            <figcaption className="bp-mono pr-caption text-bp-mute">
              <span className="whitespace-nowrap text-bp-text">
                {copy.stage} {s.no} {copy.of} {String(COUNT).padStart(2, '0')} / {s.label}
              </span>
              <span className="whitespace-nowrap text-right">
                {copy.scale}: {copy.scaleValue}
              </span>
              <span className="col-span-2">{copy.shows[stage]}</span>
            </figcaption>
          </figure>
        </div>
      </div>
    </div>
  )
}

/** One stage of the stacked version: heading row, its own drawing frozen at that stage, its dimension caption. */
function StackedStage({ s, i, size }) {
  return (
    <li className="border-t border-bp-rule first:border-t-0">
      <Plot className="grid gap-x-10 gap-y-6 py-12 md:grid-cols-12 md:py-16">
        <header className="md:sticky md:top-24 md:col-span-4 md:self-start">
          <p className="bp-mono flex items-center gap-3 text-bp-mute">
            <span aria-hidden="true" className="inline-block h-2.5 w-2.5 bg-bp-signal outline outline-1 outline-bp-line" />
            <span>
              {copy.stage} {s.no} {copy.of} {String(COUNT).padStart(2, '0')}
            </span>
          </p>
          <h3 className="bp-h3 mt-3 text-[clamp(2.25rem,9vw,3.25rem)] text-bp-text md:text-[clamp(1.75rem,4.2vw,3.25rem)]">{s.label}</h3>
          <p className="mt-3 max-w-[40ch] text-bp-mute">
            {s.desc} <DraftMark on={s.draft} />
          </p>
        </header>
        <figure className="m-0 md:col-span-8">
          <div className="relative border border-bp-rule bg-bp-bg">
            <ProcessDrawing stage={i} size={size} frozen label={figureLabel(i)} className="mx-auto h-auto w-full" />
          </div>
          <figcaption className="mt-4">
            <p className="bp-mono mb-2 text-bp-mute">{copy.shows[i]}</p>
            <Dimension axis="x" label={s.dim} delay={900} />
          </figcaption>
        </figure>
      </Plot>
    </li>
  )
}

function StackedProcess({ size }) {
  return (
    <ol className="m-0 mt-12 list-none border-t border-bp-line p-0 md:mt-16">
      {stages.map((s, i) => (
        <StackedStage key={s.id} s={s} i={i} size={size} />
      ))}
    </ol>
  )
}

export default function Process() {
  const wide = useMedia('(min-width: 1024px)')
  const reduced = useReducedMotion()
  const size = useDrawingSize()
  const pinned = wide && !reduced

  return (
    <Sheet id="process" labelledBy="process-title" className="pb-24 pt-24">
      <div className="bp-wrap">
        <SheetHeader id="process" />
        <SectionHead id="process" kicker={content.kicker} title={content.title} lede={content.lede} draft={content.draft} className="mt-10" />
        {pinned ? <PinnedProcess size={size} /> : <StackedProcess size={size} />}
      </div>
    </Sheet>
  )
}
