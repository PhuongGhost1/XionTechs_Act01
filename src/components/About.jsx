import { useState } from 'react'
import { Plus } from 'lucide-react'
import { whyChooseUs, values } from '../content/site'

export default function About() {
  const [openIndex, setOpenIndex] = useState(0)

  return (
    <section id="why-us" className="border-t border-line bg-navy text-paper">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <p className="text-xs font-medium uppercase tracking-wide text-paper/50">
          {whyChooseUs.eyebrow}
        </p>
        <h2 className="mt-3 max-w-xl text-3xl md:text-4xl">{whyChooseUs.title}</h2>
        <p className="mt-4 max-w-xl text-paper/60">{whyChooseUs.body}</p>

        <div className="mt-12 divide-y divide-paper/10 border-y border-paper/10">
          {values.map((v, i) => {
            const isOpen = openIndex === i
            return (
              <div key={v.title}>
                <button
                  className="group flex w-full items-center justify-between py-5 text-left"
                  onClick={() => setOpenIndex(isOpen ? -1 : i)}
                  aria-expanded={isOpen}
                >
                  <span className="text-sm font-semibold uppercase tracking-wide">{v.title}</span>
                  <Plus
                    className={`ml-4 h-4 w-4 shrink-0 text-paper/70 transition-transform duration-300 group-hover:scale-110 group-hover:text-paper ${isOpen ? 'rotate-45' : ''}`}
                  />
                </button>
                {isOpen && <p className="pb-5 text-sm text-paper/60">{v.desc}</p>}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
