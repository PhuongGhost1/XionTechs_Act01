import { solutions } from '../content/site'
import { loadAgentDemo } from './agentDemoLoader'
import { iconMap } from './icons'
import { SectionHeader, TextLink } from './ui'

export default function Solutions() {
  return (
    <section id="solutions" aria-labelledby="solutions-title" className="border-t border-line bg-surface/70">
      <div className="mx-auto max-w-6xl px-6 py-24 md:py-28">
        <SectionHeader eyebrow={solutions.eyebrow} title={solutions.title} titleId="solutions-title" />

        <ol className="mt-16 border-t border-ink/15">
          {solutions.bands.map((b, i) => {
            const Icon = iconMap[b.icon]
            const preload = b.link?.preloadDemo ? loadAgentDemo : undefined
            return (
              <li key={b.id} className="group grid grid-cols-1 gap-6 border-b border-line py-10 md:grid-cols-12 md:gap-8 md:py-12">
                <div className="flex items-start gap-5 md:col-span-4">
                  <span className="pt-1 text-sm font-medium tabular-nums text-muted">{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <span className="flex h-11 w-11 items-center justify-center rounded-full border border-line text-accent transition-colors duration-300 group-hover:border-accent">
                      {Icon && <Icon aria-hidden="true" className="h-5 w-5" strokeWidth={1.75} />}
                    </span>
                    <h3 className="mt-5 font-display text-3xl">{b.title}</h3>
                  </div>
                </div>
                <p className="text-pretty text-lg text-ink/80 md:col-span-4">{b.desc}</p>
                <div className="md:col-span-4">
                  <ul className="space-y-2.5">
                    {b.examples.map((e) => (
                      <li key={e} className="flex items-center gap-3 text-sm text-muted">
                        <span aria-hidden="true" className="h-px w-4 shrink-0 bg-accent" />
                        {e}
                      </li>
                    ))}
                  </ul>
                  {b.link && (
                    <div className="mt-6">
                      <TextLink href={b.link.href} onPointerEnter={preload} onFocus={preload}>
                        {b.link.label}
                      </TextLink>
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
