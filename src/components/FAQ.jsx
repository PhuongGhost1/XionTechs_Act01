import { useState } from 'react'
import { Plus } from 'lucide-react'
import { faqs } from '../content/site'

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(0)

  return (
    <section id="faqs" className="mx-auto max-w-3xl px-6 py-20">
      <h2 className="text-3xl md:text-4xl">Frequently asked questions</h2>

      <div className="mt-10 divide-y divide-line border-y border-line">
        {faqs.map((f, i) => {
          const isOpen = openIndex === i
          return (
            <div key={f.q}>
              <button
                className="group flex w-full items-center justify-between py-5 text-left"
                onClick={() => setOpenIndex(isOpen ? -1 : i)}
                aria-expanded={isOpen}
              >
                <span className="font-medium">{f.q}</span>
                <Plus
                  className={`ml-4 h-4 w-4 shrink-0 text-accent transition-transform duration-300 group-hover:scale-110 ${isOpen ? 'rotate-45' : ''}`}
                />
              </button>
              {isOpen && <p className="pb-5 text-sm text-ink/60">{f.a}</p>}
            </div>
          )
        })}
      </div>
    </section>
  )
}
