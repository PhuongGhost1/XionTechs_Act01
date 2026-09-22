import { services } from '../content/site'
import IconBadge from './IconBadge'
import { iconMap } from './icons'

export default function Services() {
  return (
    <section id="services" className="border-t border-line bg-white/60">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-3xl md:text-4xl">What we do</h2>
        <p className="mt-3 max-w-xl text-ink/60">
          Eight capabilities, one accountable team from discovery to deployment.
        </p>

        <div className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {services.map((s) => {
            const Icon = iconMap[s.icon]
            return (
              <div key={s.title} className="group bg-paper p-6 transition hover:bg-accentSoft">
                <IconBadge icon={Icon} />
                <h3 className="mt-4 text-base font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-ink/60">{s.desc}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
