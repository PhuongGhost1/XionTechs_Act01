import { useEffect, useRef, useState } from 'react'
import { useInView } from '../hooks/useInView'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { hero } from './content'
import { anchorProps } from './scene/store'
import { Reveal, SignalButton } from './ui'
import XCoreFallback from './XCoreFallback'
import './Hero.css'

// The hero's background: the telemetry grid and one slow pulse on a grid line. Purely decorative,
// and it never takes pointer events.
// 2026-10-15 (team review): dropped the tiny SYS/LAT coordinate labels that used to sit in the top
// corners here (hero.telemetry, content.js) — the last visible use of that data on the page.
function HeroBackdrop({ live }) {
  return (
    <div aria-hidden="true" data-live={live ? 'true' : 'false'} className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="hero-bg absolute inset-0">
        <div className="cmd-grid absolute inset-0" />
        <svg className="hero-pulse" width="1" height="100%" focusable="false">
          <line x1="0.5" y1="0" x2="0.5" y2="100%" pathLength="100" />
        </svg>
      </div>
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

          </div>

          <div className="relative z-10 lg:col-span-5">
            <div {...anchorProps('hero')} aria-hidden="true" className="hero-core cmd-ticks">
              <XCoreFallback />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
