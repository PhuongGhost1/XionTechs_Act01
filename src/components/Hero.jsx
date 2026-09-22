import { company, stats } from '../content/site'
import IconBadge from './IconBadge'
import { iconMap } from './icons'

function Headline() {
  const { heroHeadline, heroHeadlineAccent } = company
  const idx = heroHeadline.indexOf(heroHeadlineAccent)
  if (idx === -1) return heroHeadline

  const before = heroHeadline.slice(0, idx)
  const after = heroHeadline.slice(idx + heroHeadlineAccent.length)

  return (
    <>
      {before}
      <span className="text-accent">{heroHeadlineAccent}</span>
      {after}
    </>
  )
}

export default function Hero() {
  return (
    <section id="top" className="mx-auto max-w-6xl px-6 pb-20 pt-16 md:pt-24">
      <p className="mb-4 inline-block rounded-full bg-accentSoft px-4 py-1 text-xs font-medium uppercase tracking-wide text-accent">
        {company.tagline}
      </p>

      <h1 className="max-w-3xl text-4xl leading-tight md:text-6xl md:leading-[1.05]">
        <Headline />
      </h1>

      <div className="mt-8 flex flex-wrap gap-4">
        <a
          href="#contact"
          className="rounded-full bg-accent px-6 py-3 text-sm font-medium text-paper transition hover:bg-accentHover"
        >
          Get In Touch
        </a>
        <a
          href="#about"
          className="rounded-full border border-line px-6 py-3 text-sm font-medium transition hover:border-accent hover:text-accent"
        >
          Learn More
        </a>
      </div>

      <div className="mt-12 flex flex-col items-start justify-between gap-4 rounded-2xl bg-navy px-6 py-5 text-paper sm:flex-row sm:items-center">
        <p className="text-sm font-medium sm:text-base">{company.promoLine}</p>
        <a
          href="#contact"
          className="shrink-0 rounded-full bg-paper px-5 py-2 text-sm font-medium text-navy transition hover:bg-accentSoft"
        >
          Get started now
        </a>
      </div>

      <dl className="mt-16 grid grid-cols-1 gap-8 border-t border-line pt-10 sm:grid-cols-3">
        {stats.map((s) => {
          const Icon = iconMap[s.icon]
          return (
            <div key={s.label} className="group">
              <IconBadge icon={Icon} size="sm" />
              <dt className="mt-4 font-display text-3xl">{s.value}</dt>
              <dd className="mt-1 text-sm font-medium text-ink/70">{s.label}</dd>
              <dd className="mt-2 text-sm text-ink/50">{s.desc}</dd>
            </div>
          )
        })}
      </dl>
    </section>
  )
}
