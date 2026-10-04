import { useEffect, useRef, useState } from 'react'
import { SECTIONS, feature } from '../content.js'
import { Chip, DraftMark, Edited, Figure, Folio, PassHeading } from '../ui/primitives.jsx'

const meta = SECTIONS[2]
const system = feature.chapters.find((c) => c.hotspots)
const REGIONS = system.hotspots.map((h) => ({ id: h.id, boxes: [h.box] }))

// StaffXP as a feature story: the title stays pinned on wide screens while three chapters scroll by.
export default function Feature() {
  const [chapter, setChapter] = useState(feature.chapters[0].id)
  const [spot, setSpot] = useState(null)
  const refs = useRef({})

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.find((e) => e.isIntersecting)
        if (hit) setChapter(hit.target.dataset.chapter)
      },
      { rootMargin: '-45% 0px -45% 0px' },
    )
    Object.values(refs.current).forEach((el) => el && io.observe(el))
    return () => io.disconnect()
  }, [])

  return (
    <section id={meta.id} data-band={meta.band} aria-labelledby="feature-title">
      <div className="pf-wrap py-20 lg:py-32">
        <Folio no={meta.no} head={meta.head} />
        <div className="mt-12 grid gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-[calc(var(--pf-header)+32px)]">
              <p className="flex items-end gap-5">
                <span aria-hidden="true" className="font-display text-[clamp(7.5rem,17vw,17.5rem)] font-light italic leading-[0.8] text-pf-mark">
                  {feature.numeral}
                </span>
                <span className="pf-mono pb-2 text-pf-mute">{feature.kicker}</span>
              </p>
              <p className="pf-display mt-8 text-[clamp(2.5rem,5vw,4.5rem)]">{feature.name}</p>
              <PassHeading id="feature-title" className="mt-4 !text-[clamp(1.75rem,3.1vw,2.75rem)] !leading-[1]">
                <Edited text={feature.title} edit={feature.edit} />
              </PassHeading>
              <nav aria-label="Chapters" className="mt-10 hidden lg:block">
                <ol className="border-t border-pf-rule/60">
                  {feature.chapters.map((c, i) => (
                    <li key={c.id} className="border-b border-pf-rule/60">
                      <a href={`#feature-${c.id}`} aria-current={chapter === c.id} className="pf-mono group flex min-h-[44px] items-center gap-4 text-pf-mute aria-[current=true]:text-pf-text">
                        <span className="inline-block h-2 w-2 bg-pf-mark opacity-0 group-aria-[current=true]:opacity-100" aria-hidden="true" />
                        <span>0{i + 1}</span>
                        <span>{c.label}</span>
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            </div>
          </div>

          <div className="space-y-20 lg:col-span-7 lg:space-y-32">
            {feature.chapters.map((c) => (
              <article
                key={c.id}
                id={`feature-${c.id}`}
                data-chapter={c.id}
                ref={(el) => (refs.current[c.id] = el)}
                aria-labelledby={`feature-${c.id}-title`}
              >
                <h3 id={`feature-${c.id}-title`} className="pf-mono flex items-center gap-4 text-pf-text">
                  {c.label}
                  <span className="h-px flex-1 bg-pf-rule/60" aria-hidden="true" />
                </h3>
                <p className="pf-standfirst mt-6 max-w-[34ch] !text-[clamp(1.5rem,2.4vw,2.125rem)]">
                  {c.body}
                  {c.draft && <DraftMark />}
                </p>
                <Figure
                  figure={c.figure}
                  regions={c.hotspots ? REGIONS : []}
                  active={c.hotspots ? spot : null}
                  className="mt-10"
                  chips={c.pending?.map((p) => (
                    <Chip key={p} dashed>
                      {p}
                    </Chip>
                  ))}
                />
                {c.hotspots && (
                  <div className="mt-8">
                    <p className="pf-mono text-pf-mute">{c.hotspotsTitle}</p>
                    <ul className="mt-3 grid gap-x-8 sm:grid-cols-2">
                      {c.hotspots.map((h, i) => (
                        <li key={h.id} className="border-b border-pf-rule/60">
                          <button
                            type="button"
                            aria-pressed={spot === h.id}
                            onClick={() => setSpot(spot === h.id ? null : h.id)}
                            onMouseEnter={() => setSpot(h.id)}
                            onMouseLeave={() => setSpot(null)}
                            onFocus={() => setSpot(h.id)}
                            onBlur={() => setSpot(null)}
                            className="flex min-h-[44px] w-full items-center gap-3 py-2 text-left"
                          >
                            <span className={`pf-mono inline-flex h-6 w-6 shrink-0 items-center justify-center ${spot === h.id ? 'bg-pf-mark text-pf-onmark' : 'border border-pf-rule text-pf-text'}`}>
                              {i + 1}
                            </span>
                            <span>{h.label}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {c.tags && (
                  <ul className="mt-8 flex flex-wrap gap-2">
                    {c.tags.map((t) => (
                      <li key={t}>
                        <Chip>{t}</Chip>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
