import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { pillars, sections } from '../content/site'
import IconBadge from './IconBadge'
import { iconMap } from './icons'

export default function Pillars() {
  const [openId, setOpenId] = useState(null)

  return (
    <section id="solutions" className="theme-fade border-t border-line bg-surface/60">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <p className="text-xs font-medium uppercase tracking-wide text-accent">{sections.solutions.eyebrow}</p>
        <h2 className="mt-3 text-3xl md:text-4xl">{sections.solutions.title}</h2>
        <p className="mt-3 max-w-xl text-muted">{sections.solutions.intro}</p>

        <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {pillars.map((p) => {
            const Icon = iconMap[p.icon]
            const isOpen = openId === p.id
            return (
              <article
                key={p.id}
                className="group theme-fade flex flex-col rounded-2xl border border-line bg-surface p-6 transition hover:border-primary/40"
              >
                <div className="flex items-start justify-between">
                  <IconBadge icon={Icon} />
                  {p.placeholder && (
                    <span className="rounded-full border border-dashed border-accent px-3 py-1 text-xs font-medium text-accent">
                      Draft copy
                    </span>
                  )}
                </div>
                <h3 className="mt-4 text-xl font-semibold">{p.title}</h3>
                <p className="mt-2 text-sm text-muted">{p.outcome}</p>

                <ul className="mt-5 space-y-2">
                  {p.bullets.map((b) => (
                    <li key={b.title} className="flex gap-2 text-sm text-ink/80">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                      {b.title}
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`pillar-detail-${p.id}`}
                  onClick={() => setOpenId(isOpen ? null : p.id)}
                  className="mt-6 inline-flex items-center gap-1 self-start text-sm font-medium text-primary"
                >
                  {isOpen ? 'Show less' : 'Learn more'}
                  <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && (
                  <div id={`pillar-detail-${p.id}`} className="mt-4 space-y-3 border-t border-line pt-4 text-sm text-muted">
                    {p.bullets.map((b) => (
                      <p key={b.title}>
                        <span className="font-medium text-ink">{b.title}.</span> {b.desc}
                      </p>
                    ))}
                    <p className="italic">{p.detail}</p>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
