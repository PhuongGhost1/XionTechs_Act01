import { useEffect, useRef, useState } from 'react'
import { useInView } from '../../hooks/useInView'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { hero } from './content'
import { anchorProps } from './scene/store'
import { Reveal, SignalButton } from './ui'
import SystemStatusPanel from './SystemStatusPanel'
import XCoreFallback from './XCoreFallback'
import './Hero.css'

// Where each telemetry label sits: the top corners of the hero (the bottom ones are left clear for the
// build counter and the end of the first screen).
const CORNER_POSITIONS = [
  'left-5 top-[4.5rem] sm:left-8 lg:left-12',
  'right-5 top-[4.5rem] text-right sm:right-8 lg:right-12',
]

// The hero's background: the telemetry grid, one slow pulse on a grid line, and tiny coordinate
// labels in the corners. Purely decorative, and it never takes pointer events.
function HeroBackdrop({ live }) {
  return (
    <div aria-hidden="true" data-live={live ? 'true' : 'false'} className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="hero-bg absolute inset-0">
        <div className="cmd-grid absolute inset-0" />
        <svg className="hero-pulse" width="1" height="100%" focusable="false">
          <line x1="0.5" y1="0" x2="0.5" y2="100%" pathLength="100" />
        </svg>
      </div>
      {hero.telemetry.slice(0, CORNER_POSITIONS.length).map(({ k, v }, i) => (
        <p key={k} className={`cmd-label absolute text-[10px] ${CORNER_POSITIONS[i]}`}>
          <span className="text-cmd-faint">{k}</span> <span className="text-cmd-muted/70">{v}</span>
        </p>
      ))}
    </div>
  )
}

export default function Hero() {
  const sectionRef = useRef(null)
  const live = useInView(sectionRef)
  const reduced = useReducedMotion()

  // M2: the yellow highlight sweeps in about half a second after load. Reduced motion shows it at once.
  const [swept, setSwept] = useState(reduced)
  useEffect(() => {
    if (reduced) {
      setSwept(true)
      return
    }
    const id = window.setTimeout(() => setSwept(true), 500)
    return () => window.clearTimeout(id)
  }, [reduced])

  return (
    <section
      ref={sectionRef}
      id="top"
      data-cmd-section
      aria-labelledby="hero-title"
      className="relative isolate flex min-h-[100svh] items-center overflow-x-clip pb-16 pt-[5.5rem] lg:pb-20"
    >
      <HeroBackdrop live={live} />

      <div className="relative mx-auto w-full max-w-[1280px] px-5 sm:px-8 lg:px-12">
        <div className="grid items-center gap-y-14 lg:grid-cols-12 lg:gap-x-8">
          {/* The headline may run a little past its seven columns on wide screens; it stacks above the X core. */}
          <div className="min-w-0 lg:relative lg:z-20 lg:col-span-7">
            <Reveal as="p" className="cmd-label flex items-center gap-3 text-cmd-muted">
              <span aria-hidden="true" className="h-px w-10 bg-cmd-signal" />
              {hero.eyebrow}
            </Reveal>

            <Reveal
              as="h1"
              id="hero-title"
              aria-label={hero.headlineLabel}
              delay={80}
              className="cmd-display mt-6 text-[clamp(1.9rem,10.4vw,6.25rem)] lg:text-[min(8.4vw,6.4rem)]"
            >
              {hero.headline.map((line) => (
                <span key={line} className="block whitespace-nowrap">
                  {line === hero.headlineAccent ? (
                    <span className="cmd-sweep" data-on={swept ? 'true' : 'false'}>
                      {line}
                    </span>
                  ) : (
                    line
                  )}
                </span>
              ))}
            </Reveal>

            <Reveal as="p" delay={200} className="mt-8 max-w-[34rem] text-pretty text-base text-cmd-muted sm:text-lg">
              {hero.intro}
            </Reveal>

            <Reveal delay={280} className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <SignalButton href={hero.primary.href} flow className="w-full sm:w-auto">
                {hero.primary.label}
              </SignalButton>
              <SignalButton href={hero.secondary.href} variant="ghost" className="w-full sm:w-auto">
                {hero.secondary.label}
              </SignalButton>
            </Reveal>

            {/* A ruler of coordinates: decorative, so it is hidden from assistive technology. */}
            <Reveal delay={360} className="relative mt-12 max-w-md">
              <span aria-hidden="true" className="absolute -top-px left-0 h-px w-8 bg-cmd-signal" />
              <dl aria-hidden="true" className="grid grid-cols-4 border-t border-cmd-line">
                {hero.telemetry.map(({ k, v }, i) => (
                  <div key={k} className={`py-3 ${i ? 'border-l border-cmd-line pl-3' : ''}`}>
                    <dt className="cmd-label text-[10px] text-cmd-faint">{k}</dt>
                    <dd className="cmd-label mt-1 tabular-nums text-cmd-text">{v}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>

          {/* Desktop: the status panel overlaps the lower right of the X core. Tablet: side by side,
              below the headline. Phones: stacked, the panel as a 2 x 2 grid of modules. */}
          <div className="relative z-10 grid gap-6 md:grid-cols-2 md:items-center lg:col-span-5 lg:block">
            <div {...anchorProps('hero')} aria-hidden="true" className="hero-core cmd-ticks">
              <XCoreFallback />
            </div>
            <Reveal delay={320} className="relative z-10 mx-auto w-full max-w-[26rem] md:max-w-none lg:-mt-16 lg:ml-auto lg:mr-0 lg:w-80">
              <SystemStatusPanel />
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}
