import { team, whyUs } from '../content/site'
import { DraftMark, SectionHeader } from './ui'

// Plan v3 §12–13: four evidence-oriented reasons, then a compact human section.
export default function WhyUs() {
  return (
    <section id="why-us" data-tone="dark" aria-labelledby="why-title" className="bg-paper text-ink">
      <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
        <SectionHeader eyebrow={whyUs.eyebrow} title={whyUs.title} titleId="why-title" />

        <ol className="mt-16 grid grid-cols-1 gap-x-16 border-t border-line md:grid-cols-2">
          {whyUs.pillars.map((p, i) => (
            <li key={p.title} className="border-b border-line py-10">
              <span className="text-sm tabular-nums text-accent">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="mt-3 font-display text-2xl leading-snug">{p.title}</h3>
              <p className="mt-3 max-w-md text-pretty text-muted">{p.desc}</p>
            </li>
          ))}
        </ol>

        <div className="mt-20 grid grid-cols-1 gap-12 lg:grid-cols-[1.3fr_1fr] lg:items-end lg:gap-20">
          <div>
            <h3 className="font-display text-3xl leading-tight md:text-4xl">{team.title}</h3>
            <p className="mt-5 max-w-xl text-pretty text-lg text-muted">
              {team.body}
              <DraftMark draft={team.draft} />
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-8 border-t border-line pt-8 lg:border-l lg:border-t-0 lg:pl-12 lg:pt-0">
            {team.facts.map((f) => (
              <div key={f.label} className="flex flex-col-reverse justify-end">
                <dt className="mt-3 text-sm text-muted">{f.label}</dt>
                <dd className="font-display text-5xl text-accent">{f.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}
