import { useRef, useState } from 'react'
import { SECTIONS, story } from '../content.js'
import { useMedia, useMotionOff, useScrollProgress } from '../hooks/index.js'
import { Chip, CropMarks, DraftMark, Edited, Folio, PassHeading, Reveal } from '../ui/primitives.jsx'

const meta = SECTIONS[3]
const HEADER = 57 // --pf-header

function Screen({ active, className = '' }) {
  const { figure } = story
  return (
    <div className={`relative ${className}`}>
      <img src={figure.src} alt={figure.alt} width={figure.width} height={figure.height} loading="lazy" decoding="async" className="block h-full w-auto max-w-none" />
      {story.areas.map((a) =>
        a.regions.map((b, i) => (
          <span
            key={`${a.id}-${i}`}
            aria-hidden="true"
            data-on={active === a.id}
            className="pf-region"
            style={{ left: `${b.x}%`, top: `${b.y}%`, width: `${b.w}%`, height: `${b.h}%` }}
          />
        )),
      )}
    </div>
  )
}

function Areas({ active, setActive }) {
  return (
    <div>
      <p className="pf-mono text-pf-mute">{story.areasTitle}</p>
      <ol className="mt-3 border-t border-pf-rule/60">
        {story.areas.map((a, i) => (
          <li key={a.id} className="border-b border-pf-rule/60">
            <button
              type="button"
              aria-pressed={active === a.id}
              onClick={() => setActive(active === a.id ? null : a.id)}
              onMouseEnter={() => setActive(a.id)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(a.id)}
              onBlur={() => setActive(null)}
              className="flex min-h-[44px] w-full items-start gap-3 py-2.5 text-left"
            >
              <span className={`pf-mono mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center ${active === a.id ? 'bg-pf-mark text-pf-onmark' : 'border border-pf-rule text-pf-text'}`}>
                {i + 1}
              </span>
              <span>
                <span className="block font-semibold text-pf-text">{a.label}</span>
                <span className="block text-[15px] text-pf-mute">{a.modules.join(' · ')}</span>
              </span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  )
}

const Caption = () => (
  <p className="pf-mono mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-pf-mute">
    <span>{story.figure.caption}</span>
    {story.pending.map((p) => (
      <Chip key={p} dashed>
        {p}
      </Chip>
    ))}
  </p>
)

// ESS as a shorter second story. On wide screens the real, wide screen pans sideways while the run is
// pinned; elsewhere it sits in a frame the reader scrolls by hand.
export default function Story() {
  const off = useMotionOff()
  const wide = useMedia('(min-width: 1024px) and (min-height: 640px)')
  const live = wide && !off
  const run = useRef(null)
  const [active, setActive] = useState(null)
  useScrollProgress(run, { mode: 'through', offset: HEADER, enabled: live })

  return (
    <section id={meta.id} data-band={meta.band} aria-labelledby="story-title">
      <div className="pf-wrap pt-20 lg:pt-32">
        <Folio no={meta.no} head={meta.head} />
        <div className="mt-12 grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <p className="pf-mono text-pf-mute">
              {story.name} · {story.kicker}
            </p>
            <PassHeading id="story-title" className="mt-4 !text-[clamp(2.25rem,5.4vw,5rem)]">
              <Edited text={story.title} edit={story.edit} />
            </PassHeading>
          </div>
          <Reveal className="lg:col-span-4 lg:pt-10">
            <p className="pf-body">{story.body}</p>
          </Reveal>
        </div>
      </div>

      {live ? (
        <div ref={run} className="relative h-[230vh]">
          <div className="sticky top-[var(--pf-header)] flex h-[calc(100vh-var(--pf-header))] items-center">
            <div className="pf-wrap grid w-full grid-cols-12 items-center gap-10">
              <div className="col-span-4">
                <Areas active={active} setActive={setActive} />
              </div>
              <div className="col-span-8">
                <div className="relative">
                  <CropMarks />
                  <div className="overflow-x-clip border border-pf-rule/60 bg-pf-bg2 [container-type:inline-size]">
                    <div className="h-[min(62vh,640px)] w-max will-change-transform" style={{ transform: 'translateX(calc(var(--p, 0) * min(0px, 100cqw - 100%)))' }}>
                      <Screen active={active} className="h-full" />
                    </div>
                  </div>
                </div>
                <Caption />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div ref={run} className="pf-wrap mt-12 grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-8 lg:col-start-5 lg:row-start-1">
            <div role="region" aria-label={story.figure.caption} tabIndex={0} className="overflow-x-auto border border-pf-rule/60 bg-pf-bg2">
              <Screen active={active} className="h-[min(70vw,420px)] w-max lg:h-[440px]" />
            </div>
            <p className="mt-3 text-[15px] text-pf-mute">{story.scrollHint}</p>
            <Caption />
          </div>
          <div className="lg:col-span-4 lg:row-start-1">
            <Areas active={active} setActive={setActive} />
          </div>
        </div>
      )}

      <div className="pf-wrap pb-20 pt-16 lg:pb-32">
        <Reveal>
          <aside aria-labelledby="story-agent" className="pf-dashed p-6 lg:p-8">
            <div className="flex flex-wrap items-center gap-4">
              <h3 id="story-agent" className="font-display text-[1.75rem] italic leading-none text-pf-text">
                {story.sidebar.title}
                <DraftMark />
              </h3>
              <Chip dashed>{story.sidebar.label}</Chip>
            </div>
            <ol className="mt-6 grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-6">
              {story.sidebar.steps.map((s, i) => (
                <li key={s.id} className="border-t border-pf-rule/60 pt-3">
                  <span className="pf-mono text-pf-mute">0{i + 1}</span>
                  <span className="mt-1 block font-semibold text-pf-text">{s.label}</span>
                  <span className="block text-[15px] text-pf-mute">{s.hint}</span>
                </li>
              ))}
            </ol>
            <p className="mt-6 text-[15px] text-pf-mute first-letter:uppercase">{story.sidebar.note}</p>
          </aside>
        </Reveal>
      </div>
    </section>
  )
}
