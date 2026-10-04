import { useState } from 'react'
import { SECTIONS, index } from '../content.js'
import { DraftMark, Edited, Folio, PassHeading } from '../ui/primitives.jsx'

const meta = SECTIONS[4]

// The five capabilities as a typeset index. Each row opens in place; no cards.
export default function CapabilityIndex() {
  const [open, setOpen] = useState(index.items[0].id)

  return (
    <section id={meta.id} data-band={meta.band} aria-labelledby="index-title">
      <div className="pf-wrap py-20 lg:py-32">
        <Folio no={meta.no} head={meta.head} />
        <div className="mt-12 grid gap-10 lg:grid-cols-12">
          <PassHeading id="index-title" className="lg:col-span-4 !text-[clamp(2.25rem,4.4vw,4rem)]">
            <Edited text={index.title} edit={index.edit} />
            {index.draft && <DraftMark />}
          </PassHeading>
          <ol className="border-t border-pf-text lg:col-span-8">
            {index.items.map((item, i) => {
              const isOpen = open === item.id
              return (
                <li key={item.id} className="border-b border-pf-text">
                  <h3>
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={`index-${item.id}`}
                      onClick={() => setOpen(isOpen ? null : item.id)}
                      className="group flex w-full items-center gap-4 py-5 text-left lg:gap-8 lg:py-6"
                    >
                      <span className={`pf-mono inline-flex h-7 min-w-[2.5rem] items-center justify-center px-1 transition-colors ${isOpen ? 'bg-pf-mark text-pf-onmark' : 'text-pf-mute group-hover:bg-pf-mark group-hover:text-pf-onmark'}`}>
                        0{i + 1}
                      </span>
                      <span className="pf-display flex-1 text-[clamp(1.75rem,4.6vw,4rem)] transition-transform duration-500 ease-pf group-hover:translate-x-2">
                        {item.title}
                      </span>
                      <span aria-hidden="true" className={`font-display text-4xl font-light leading-none text-pf-text transition-transform duration-500 ease-pf ${isOpen ? 'rotate-45' : ''}`}>
                        +
                      </span>
                    </button>
                  </h3>
                  <div id={`index-${item.id}`} data-open={isOpen} className="pf-row__panel" inert={isOpen ? undefined : ''}>
                    <div>
                      <div className="grid gap-6 pb-8 lg:grid-cols-8 lg:pl-[4.5rem]">
                        <p className="pf-standfirst lg:col-span-5">
                          {item.desc}
                          {item.draft && <DraftMark />}
                        </p>
                        <div className="lg:col-span-3">
                          <ul className="pf-mono space-y-1.5 text-pf-text">
                            {item.list.map((l) => (
                              <li key={l} className="flex gap-2">
                                <span aria-hidden="true">→</span>
                                {l}
                              </li>
                            ))}
                          </ul>
                          {item.tools && (
                            <p className="mt-4 text-[15px] text-pf-mute">
                              {index.toolsLabel}: {item.tools}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              )
            })}
          </ol>
        </div>
      </div>
    </section>
  )
}
