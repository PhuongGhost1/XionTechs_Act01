import { process } from '../content/site'
import IconBadge from './IconBadge'
import { iconMap } from './icons'

export default function Process() {
  return (
    <section id="process" className="mx-auto max-w-6xl px-6 py-20">
      <h2 className="text-3xl md:text-4xl">How we work</h2>
      <p className="mt-3 max-w-xl text-ink/60">Our 4-D model keeps every engagement accountable.</p>

      <ol className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {process.map((p) => {
          const Icon = iconMap[p.icon]
          return (
            <li key={p.step} className="group relative border-l-2 border-accent pl-6">
              <IconBadge icon={Icon} size="sm" />
              <span className="mt-4 block font-display text-sm text-accent">{p.step}</span>
              <h3 className="mt-2 text-lg font-semibold">{p.title}</h3>
              <p className="mt-2 text-sm text-ink/60">{p.desc}</p>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
