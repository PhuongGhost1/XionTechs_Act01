import { useEffect, useRef, useState } from 'react'
import { hero } from '../content.js'
import { useMinWidth, useScrollProgress } from '../hooks/index.js'
import { live } from '../state/store.js'
import { Button, Container, Mono, PauseButton, Section } from '../ui/index.jsx'
import StatusPanel from './StatusPanel.jsx'
import XCore from './XCore.jsx'

// Hero. On desktop the section is a 170vh track with a sticky one-screen stage: scrolling the extra
// 70vh drives the data core's `split` (the X separates into its four arms) and dims the headline,
// so the same four names land as the bays of the next section. Below lg there is no sticky stage:
// the stack is headline, core, status modules, and the split follows the section leaving the top.
export default function Hero() {
  const wide = useMinWidth(1024)
  const [fired, setFired] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setFired(true), 350)
    return () => clearTimeout(t)
  }, [])

  return (
    <Section id="boot" className="overflow-clip">
      <Track key={wide ? 'wide' : 'narrow'} wide={wide} fired={fired} />
    </Section>
  )
}

function Track({ wide, fired }) {
  const ref = useRef(null)
  useScrollProgress(ref, {
    mode: wide ? 'sticky' : 'exit',
    keepWhenReduced: true,
    onProgress: (p) => {
      live.hero = p
      live.split = p
    },
  })

  return (
    <div ref={ref} className="relative lg:h-[170vh]">
      <div className="relative flex flex-col lg:sticky lg:top-0 lg:block lg:h-screen lg:min-h-[640px] lg:overflow-hidden">
        <div aria-hidden="true" className="x-grid absolute inset-0" />

        {/* Right column on desktop: the data core above, the status panel it feeds directly below.
            Stacked in the same order on small screens. */}
        <div className="relative order-2 mx-auto mt-8 w-full max-w-[560px] lg:absolute lg:inset-y-0 lg:right-0 lg:mx-0 lg:mt-0 lg:flex lg:w-[60%] lg:max-w-none lg:flex-col">
          <div className="relative aspect-square w-full lg:aspect-auto lg:min-h-0 lg:flex-1">
            <XCore />
          </div>
          <div
            className="mt-6 px-5 pb-16 sm:px-8 lg:mt-0 lg:shrink-0 lg:self-end lg:px-0 lg:pb-10"
            style={wide ? { paddingRight: 'max(3rem, calc((100vw - 1320px) / 2 + 3rem))' } : undefined}
          >
            <StatusPanel className="w-full lg:w-[21rem]" />
          </div>
        </div>

        <Container className="relative z-10 order-1 flex flex-col pt-24 lg:pointer-events-none lg:h-full lg:pb-10 lg:pt-20">
          <Mono className="hidden gap-8 text-x-faint sm:flex" aria-hidden="true">
            {hero.coords.map((c) => (
              <span key={c.k}>
                {c.k} <span className="text-x-mute">{c.v}</span>
              </span>
            ))}
          </Mono>

          <div
            className="mt-8 lg:pointer-events-auto lg:mt-auto"
            style={wide ? { opacity: 'calc(1 - var(--p, 0) * 0.7)', transform: 'translateY(calc(var(--p, 0) * -24px))' } : undefined}
          >
            <h1 className="x-display text-[clamp(2.75rem,12.5vw,4.5rem)] sm:text-[clamp(3.5rem,10vw,6rem)] lg:text-[clamp(3.5rem,6.6vw,7.5rem)]">
              {hero.headline.map((line, i) =>
                i === hero.sweepLine ? (
                  <span key={line} className="relative -mx-[0.1em] block w-fit px-[0.1em]" data-fired={fired}>
                    <span aria-hidden="true" className="x-sweep absolute inset-0 bg-x-signal" />
                    <span className="x-sweep-text relative">{line}</span>
                  </span>
                ) : (
                  <span key={line} className="block">
                    {line}
                  </span>
                ),
              )}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-x-mute">{hero.intro}</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button
                href={hero.primary.href}
                arrow={hero.primary.arrow}
                onHover={(on) => {
                  live.flowBoost = on ? 1 : 0
                }}
              >
                {hero.primary.label}
              </Button>
              <Button href={hero.secondary.href} variant="secondary">
                {hero.secondary.label}
              </Button>
              <PauseButton labels={hero.pause} className="ml-auto sm:ml-2" />
            </div>
          </div>
        </Container>
      </div>
    </div>
  )
}
