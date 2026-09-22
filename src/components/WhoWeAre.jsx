import { CheckCircle2 } from 'lucide-react'
import { whoWeAre } from '../content/site'

export default function WhoWeAre() {
  return (
    <section id="about" className="border-t border-line bg-white/60">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-6 py-20 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-accent">
            {whoWeAre.eyebrow}
          </p>
          <h2 className="mt-3 text-3xl md:text-4xl">{whoWeAre.title}</h2>
          <p className="mt-4 text-ink/60">{whoWeAre.body}</p>

          <ul className="mt-6 space-y-3">
            {whoWeAre.bullets.map((b) => (
              <li key={b} className="group flex items-start gap-3 text-sm text-ink/70">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent transition-transform duration-300 group-hover:scale-125" />
                {b}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl bg-accent p-8 text-paper">
          <p className="font-display text-5xl">{whoWeAre.badge.value}</p>
          <p className="mt-2 max-w-xs text-sm text-paper/70">{whoWeAre.badge.label}</p>
        </div>
      </div>
    </section>
  )
}
