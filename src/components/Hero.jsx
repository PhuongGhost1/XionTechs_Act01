import { Fragment } from 'react'
import { Check } from 'lucide-react'
import { hero } from '../content/site'
import HeroSystem from './HeroSystem'
import { PrimaryLink, SecondaryLink } from './ui'
import './Hero.css'

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

// The eyebrow slogan plays GET → IT → DONE once as a small completion sequence (MOTION §6):
// each word steps in, a short connector draws to the next, and DONE gets a check. Static under
// reduced motion (Hero.css). Screen readers get the plain slogan.
function Slogan() {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
      <span className="sr-only">{hero.eyebrow}</span>
      <span aria-hidden="true" className="inline-flex items-center gap-2">
        {hero.slogan.map((word, i) => (
          <Fragment key={word}>
            {i > 0 && <span className="hero-slogan-link h-px w-5 bg-accent/50" style={{ '--i': i }} />}
            <span className="hero-slogan-word" style={{ '--i': i }}>
              {word}
            </span>
          </Fragment>
        ))}
        <Check strokeWidth={3} className="hero-slogan-check h-3.5 w-3.5" style={{ '--i': hero.slogan.length }} />
      </span>
    </p>
  )
}

export default function Hero() {
  return (
    <section id="top" aria-labelledby="hero-title" className="overflow-hidden">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-6 pb-20 pt-16 md:pt-24 lg:grid-cols-[1.12fr_1fr] lg:gap-10 lg:pb-28">
        <div>
          <Slogan />
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
