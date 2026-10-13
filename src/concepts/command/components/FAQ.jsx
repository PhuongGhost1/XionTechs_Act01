import { useState } from 'react'
import { Plus } from 'lucide-react'
import { faq } from '../../../content/site'
import { DraftMark, SectionHeader } from './ui'

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(0)

  return (
    <section id="faq" aria-labelledby="faq-title" className="py-24 md:py-32">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-6 lg:grid-cols-[1fr_1.6fr] lg:gap-16">
        <div>
          <SectionHeader eyebrow={faq.eyebrow} title={faq.title} titleId="faq-title" />
          <DraftMark draft={faq.draft} label="Draft answers" />
        </div>

        <div className="divide-y divide-line border-y border-line">
          {faq.items.map((f, i) => {
            const isOpen = openIndex === i
            const id = `faq-${i}`
            return (
              <div key={f.q}>
                <h3>
                  <button
                    type="button"
                    id={`${id}-q`}
                    aria-expanded={isOpen}
                    aria-controls={`${id}-a`}
                    onClick={() => setOpenIndex(isOpen ? -1 : i)}
                    className="group flex w-full items-center justify-between gap-6 py-5 text-left text-lg font-medium text-ink"
                  >
                    {f.q}
                    <Plus
                      aria-hidden="true"
                      className={`h-5 w-5 shrink-0 text-accent transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`}
                    />
                  </button>
                </h3>
                <div id={`${id}-a`} role="region" aria-labelledby={`${id}-q`} hidden={!isOpen}>
                  <p className="max-w-2xl pb-6 text-pretty text-muted">{f.a}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
