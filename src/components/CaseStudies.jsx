import { FolderOpen } from 'lucide-react'
import { caseStudies } from '../content/site'
import IconBadge from './IconBadge'

export default function CaseStudies() {
  return (
    <section id="work" className="mx-auto max-w-6xl px-6 py-20">
      <h2 className="text-3xl md:text-4xl">Selected work</h2>
      <p className="mt-3 max-w-xl text-ink/60">
        Case study details below are placeholders — swap in real scope, stack, and outcomes.
      </p>

      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
        {caseStudies.map((c) => (
          <div key={c.title} className="group rounded-2xl border border-dashed border-line p-6">
            <div className="flex items-start justify-between">
              <IconBadge icon={FolderOpen} size="sm" />
              <span className="rounded-full bg-accentSoft px-3 py-1 text-xs font-medium text-accent">
                {c.tag}
              </span>
            </div>
            <h3 className="mt-4 text-lg font-semibold">{c.title}</h3>
            <p className="mt-2 text-sm text-ink/50">{c.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
