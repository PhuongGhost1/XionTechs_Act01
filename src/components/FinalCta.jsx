import { useRef } from 'react'
import { useInView } from '../hooks/useInView'
import { brand, finale } from './content'
import { splitStop } from './frameFormat'
import { anchorProps } from './scene/store'
import { useThemeMode } from './theme'
import { SignalButton } from './ui'
import './FinalCta.css'

// Section 06: the closing statement. The data core's network converges into the logo here
// (docs/concepts/01-command-implementation.md §5, phase 5), so the section stays transparent.
export default function FinalCta() {
  const stairsRef = useRef(null)
  // M11 plays once, when the staircase is a fifth of the way up the viewport.
  const playing = useInView(stairsRef, { once: true, rootMargin: '0px 0px -20% 0px' })
  const last = finale.slogan.length - 1
  const logo = useThemeMode() === 'light' ? brand.logoLight : brand.logo

  return (
    <section
      id="contact"
      data-cmd-section
      aria-labelledby="final-title"
      data-in={playing ? 'true' : 'false'}
      className="cmd-final relative flex min-h-[100svh] items-center py-24 lg:py-28"
    >
      <div className="mx-auto w-full max-w-[1280px] px-5 sm:px-8 lg:px-12">
        <div className="flex items-center gap-4">
          <span aria-hidden="true" className="cmd-label text-cmd-signal-fg">
            {finale.index}
          </span>
          <span aria-hidden="true" className="h-px flex-1 bg-cmd-line" />
        </div>
        <h2 id="final-title" className="cmd-h2 mt-5 text-2xl text-cmd-muted sm:text-3xl">
          {finale.kicker}
        </h2>

        {/* The staircase is decoration for the eye; the statement itself is read from here. */}
        <p className="sr-only">{finale.title}</p>
        <div ref={stairsRef} aria-hidden="true" className="cmd-final__stairs mt-8 lg:mt-10">
          {finale.slogan.map((word, i) => {
            const [text, stop] = splitStop(word)
            return (
              <span key={word} style={{ '--i': i }} className="cmd-display cmd-final__word text-cmd-text">
                {text}
                {stop && <span className="cmd-final__stop">{stop}</span>}
                {i === last && <span className="cmd-final__rule" />}
              </span>
            )
          })}
        </div>

        <div className="mt-14 flex flex-col gap-10 lg:mt-16 lg:flex-row lg:items-end lg:justify-between">
          <div className="cmd-final__cta flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <SignalButton href={finale.primary.href} flow className="w-full sm:w-auto">
                {finale.primary.label}
              </SignalButton>
              <SignalButton href={finale.agentHref} variant="ghost" className="w-full sm:w-auto">
                {finale.secondary.label}
              </SignalButton>
            </div>
            <p className="cmd-label text-cmd-faint">{finale.primaryNote}</p>
          </div>

          {/* The data core converges into this box as dots in the shape of the logo; the real logo then settles over
              them (FinalCta.css), and is the only logo when WebGL is off. */}
          <div {...anchorProps('final')} className="cmd-ticks w-fit p-3 min-[360px]:p-6">
            <span className="cmd-final__logo block">
              <img
                src={logo.src}
                width={logo.width}
                height={logo.height}
                alt={brand.name}
                className="block max-w-none"
              />
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
