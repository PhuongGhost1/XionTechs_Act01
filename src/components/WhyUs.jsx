import { useState } from 'react'
import { CheckCircle2, Plus } from 'lucide-react'
import { stats, whoWeAre, whyChooseUs, values } from '../content/site'
import IconBadge from './IconBadge'
import { iconMap } from './icons'

export default function WhyUs() {
  const [openIndex, setOpenIndex] = useState(0)

  return (
    <section id="why-us" data-tone="dark" className="border-t border-line bg-paper text-ink">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <p className="text-xs font-medium uppercase tracking-wide text-ink/60">{whyChooseUs.eyebrow}</p>
        <h2 className="mt-3 max-w-xl text-3xl md:text-4xl">{whyChooseUs.title}</h2>
        <p className="mt-4 max-w-xl text-ink/60">{whyChooseUs.body}</p>

        <dl className="mt-12 grid grid-cols-1 gap-8 border-t border-ink/10 pt-10 sm:grid-cols-3">
          {stats.map((s) => {
            const Icon = iconMap[s.icon]
            return (
              <div key={s.label} className="group">
                <IconBadge icon={Icon} size="sm" />
                <dt className="mt-4 font-display text-3xl">{s.value}</dt>
                <dd className="mt-1 text-sm font-medium text-ink/70">{s.label}</dd>
                <dd className="mt-2 text-sm text-ink/60">{s.desc}</dd>
              </div>
            )
          })}
        </dl>

        <div className="mt-16 grid grid-cols-1 gap-12 lg:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-ink/60">{whoWeAre.eyebrow}</p>
            <h3 className="mt-3 text-2xl">{whoWeAre.title}</h3>
            <p className="mt-4 text-ink/60">{whoWeAre.body}</p>
            <ul className="mt-6 space-y-3">
              {whoWeAre.bullets.map((b) => (
                <li key={b} className="flex items-start gap-3 text-sm text-ink/70">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  {b}
                </li>
              ))}
            </ul>
          </div>

          <div className="divide-y divide-ink/10 border-y border-ink/10">
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
                      className={`ml-4 h-4 w-4 shrink-0 text-ink/70 transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`}
                    />
                  </button>
                  {isOpen && <p className="pb-5 text-sm text-ink/60">{v.desc}</p>}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
