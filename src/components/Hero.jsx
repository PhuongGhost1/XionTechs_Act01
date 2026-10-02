import { hero } from '../content/site'
import HeroSystem from './HeroSystem'
import { Eyebrow, PrimaryLink, SecondaryLink } from './ui'

function Headline() {
  const { headline, headlineAccent } = hero
  const i = headline.indexOf(headlineAccent)
  if (i === -1) return headline
  return (
    <>
      {headline.slice(0, i)}
      <span className="underline decoration-accent/40 decoration-[0.08em] underline-offset-[0.14em]">{headlineAccent}</span>
      {headline.slice(i + headlineAccent.length)}
    </>
  )
}

export default function Hero() {
  return (
    <section id="top" aria-labelledby="hero-title" className="overflow-hidden">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-14 px-6 pb-24 pt-16 md:pt-24 lg:grid-cols-[1.15fr_1fr] lg:gap-8 lg:pb-32">
        <div>
          <Eyebrow>{hero.eyebrow}</Eyebrow>
          <h1 id="hero-title" className="mt-5 text-[2.75rem] leading-[1.05] tracking-tight md:text-6xl lg:text-[4.25rem]">
            <Headline />
          </h1>
          <p className="mt-7 max-w-xl text-pretty text-lg text-muted md:text-xl">{hero.intro}</p>
          <div className="mt-10 flex flex-wrap gap-3">
            <PrimaryLink href={hero.primary.href}>{hero.primary.label}</PrimaryLink>
            <SecondaryLink href={hero.secondary.href}>{hero.secondary.label}</SecondaryLink>
          </div>
        </div>
        <HeroSystem />
      </div>
    </section>
  )
}
