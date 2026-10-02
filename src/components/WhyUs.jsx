import { Cable, Sparkles, Users, Wrench } from 'lucide-react'
import { team, whyUs } from '../content/site'
import { DraftMark, Reveal, SectionHeader } from './ui'

// The pillar icons named in whyUs.pillars, imported by name (see CLAUDE.md on icon lookups).
const ICONS = { Wrench, Sparkles, Users, Cable }

// Delays inside a pillar once it is revealed: the icon activates, the line draws, the heading
// settles into focus (MOTION §19).
const ICON_MS = 200
const LINE_MS = 350
const HEAD_MS = 450

// MOTION §19–20: four evidence-oriented pillars with a slow vertical reveal, then the team.
// Each pillar is a Reveal (one-time, as it scrolls in); its parts key off the Reveal's
// data-revealed through group-data variants. Their settled look is the default and the "before"
// look is motion-safe only, so reduced motion shows everything finished.
export default function WhyUs() {
  return (
    <section id="why-us" data-tone="dark" aria-labelledby="why-title" className="bg-paper text-ink">
      <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
        <SectionHeader eyebrow={whyUs.eyebrow} title={whyUs.title} titleId="why-title" />

        <ol className="mt-16 grid grid-cols-1 gap-x-16 border-t border-line md:grid-cols-2">
          {whyUs.pillars.map((p, i) => {
            const Icon = ICONS[p.icon]
            // On two columns, the right-hand pillar of a row follows its neighbour.
            const d = (i % 2) * 160
            return (
              <Reveal as="li" key={p.title} delay={d} style={{ '--reveal-y': '28px' }} className="group border-b border-line py-10">
                <div aria-hidden="true" className="flex items-center">
                  <span className="relative flex h-11 w-11 items-center justify-center rounded-full border border-line text-muted">
                    {Icon && <Icon className="h-5 w-5" strokeWidth={1.75} />}
                    <span
                      className="absolute -inset-px flex items-center justify-center rounded-full border border-accent bg-accent/10 text-accent transition-opacity duration-base ease-brand motion-safe:group-data-[revealed=false]:opacity-0"
                      style={{ transitionDelay: `${d + ICON_MS}ms` }}
                    >
                      {Icon && <Icon className="h-5 w-5" strokeWidth={1.75} />}
                    </span>
                  </span>
                  <span
                    className="h-px w-16 origin-left bg-accent/70 transition-transform duration-section ease-brand motion-safe:group-data-[revealed=false]:scale-x-0"
                    style={{ transitionDelay: `${d + LINE_MS}ms` }}
                  />
                </div>
                <h3
                  className="mt-6 font-display text-2xl leading-snug transition-[opacity,transform] duration-section ease-brand motion-safe:group-data-[revealed=false]:translate-y-2 motion-safe:group-data-[revealed=false]:opacity-30"
                  style={{ transitionDelay: `${d + HEAD_MS}ms` }}
                >
                  {p.title}
                </h3>
                <p className="mt-3 max-w-md text-pretty text-muted">{p.desc}</p>
              </Reveal>
            )
          })}
        </ol>

        {/* MOTION §20: a soft reveal, no photo until a real one is approved. */}
        <div className="mt-20 grid grid-cols-1 gap-12 lg:grid-cols-[1.3fr_1fr] lg:items-end lg:gap-20">
          <Reveal style={{ '--reveal-y': '24px' }}>
            <h3 className="font-display text-3xl leading-tight md:text-4xl">{team.title}</h3>
            <p className="mt-5 max-w-xl text-pretty text-lg text-muted">
              {team.body}
              <DraftMark draft={team.draft} />
            </p>
          </Reveal>
          <Reveal as="dl" delay={180} style={{ '--reveal-y': '24px' }} className="grid grid-cols-2 gap-8 border-t border-line pt-8 lg:border-l lg:border-t-0 lg:pl-12 lg:pt-0">
            {team.facts.map((f) => (
              <div key={f.label} className="flex flex-col-reverse justify-end">
                <dt className="mt-3 text-sm text-muted">{f.label}</dt>
                <dd className="font-display text-5xl text-accent">{f.value}</dd>
              </div>
            ))}
          </Reveal>
        </div>
      </div>
    </section>
  )
}
