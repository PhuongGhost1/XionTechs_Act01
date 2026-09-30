import { useState } from 'react'
import { CheckCircle2, Plus } from 'lucide-react'
import { stats, whoWeAre, whyChooseUs, values } from '../content/site'
import IconBadge from './IconBadge'
import { iconMap } from './icons'

export default function WhyUs() {
  const [openIndex, setOpenIndex] = useState(0)

  return (
    <section id="why-us" className="theme-fade border-t border-line bg-navy text-navyInk">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <p className="text-xs font-medium uppercase tracking-wide text-navyInk/50">{whyChooseUs.eyebrow}</p>
        <h2 className="mt-3 max-w-xl text-3xl md:text-4xl">{whyChooseUs.title}</h2>
        <p className="mt-4 max-w-xl text-navyInk/60">{whyChooseUs.body}</p>

        <dl className="mt-12 grid grid-cols-1 gap-8 border-t border-navyInk/10 pt-10 sm:grid-cols-3">
          {stats.map((s) => {
            const Icon = iconMap[s.icon]
            return (
              <div key={s.label} className="group">
                <IconBadge icon={Icon} size="sm" />
                <dt className="mt-4 font-display text-3xl">{s.value}</dt>
                <dd className="mt-1 text-sm font-medium text-navyInk/70">{s.label}</dd>
                <dd className="mt-2 text-sm text-navyInk/50">{s.desc}</dd>
              </div>
            )
          })}
        </dl>

        <div className="mt-16 grid grid-cols-1 gap-12 lg:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-navyInk/50">{whoWeAre.eyebrow}</p>
            <h3 className="mt-3 text-2xl">{whoWeAre.title}</h3>
            <p className="mt-4 text-navyInk/60">{whoWeAre.body}</p>
            <ul className="mt-6 space-y-3">
              {whoWeAre.bullets.map((b) => (
                <li key={b} className="flex items-start gap-3 text-sm text-navyInk/70">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-navyAccent" />
                  {b}
                </li>
              ))}
            </ul>
          </div>

          <div className="divide-y divide-navyInk/10 border-y border-navyInk/10">
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
                      className={`ml-4 h-4 w-4 shrink-0 text-navyInk/70 transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`}
                    />
                  </button>
                  {isOpen && <p className="pb-5 text-sm text-navyInk/60">{v.desc}</p>}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
