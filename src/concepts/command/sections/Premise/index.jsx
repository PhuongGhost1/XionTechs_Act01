import { Fragment, useEffect, useLayoutEffect, useRef } from 'react'
import { premise } from '../../content/index.js'
import { CoreAnchor } from '../../contract/anchors.js'
import { STATIONS } from '../../contract/stations.js'
import { CoreFigure } from '../../core/CoreFigure.jsx'
import { useReducedMotion, useTrack } from '../../runtime/hooks.js'
import { Chip } from '../../ui/Chip.jsx'
import { FullStop } from '../../ui/FullStop.jsx'
import { Label } from '../../ui/Label.jsx'
import { Reveal } from '../../ui/Reveal.jsx'
import { litAmounts, statementProgress, statementWords } from './lighting.js'
import './premise.css'

// Station 01 PREMISE (doc 4.3, M06). The claim, a plain paragraph, and the one sourced company
// fact. Not pinned: the statement's words light from --ink-dim to white as it is scrolled through.
//
// How the lighting runs: every word carries a CSS variable --lit (0..1). One rAF handler, started
// by a passive scroll listener, turns window.scrollY into progress with the pure functions of
// lighting.js and writes the variables. React state is never touched per frame. The element's
// position is measured only on resize, fonts.ready and size changes, never while scrolling.
// Without JS, under reduced motion, with MOTION off and in RAW every word is lit (premise.css).
//
// The window is measured from the statement itself, not from the PREMISE track: the track's own
// progress only starts once its top reaches the viewport top, which is too late for a statement
// that sits in the middle of the screen.

const WORDS = statementWords(premise.statement.text)

// The source chip may break between its parts but never inside one (a date must not split at its
// hyphens). One wrapper span, because the chip is a flex box and would not wrap several items.
const CHIP_PARTS = premise.claim.chip.text.split(' · ')

// Layout effect in the browser, so the first dim state is painted with the first frame and a page
// opened at #premise never shows the lit words for a frame. (Plain effect in Node, for the tests.)
const useBeforePaint = typeof window === 'undefined' ? useEffect : useLayoutEffect

function useWordLighting(ref, disabled) {
  useBeforePaint(() => {
    const root = ref.current
    if (!root || disabled) return undefined
    const nodes = [...root.querySelectorAll('[data-word]')]
    let top = 0
    let height = 0
    let frame = 0
    let last = -1

    const paint = () => {
      frame = 0
      const p = statementProgress(window.scrollY, top, height, window.innerHeight)
      // Settled far above or below the window: nothing to write.
      if (p === last) return
      last = p
      const lit = litAmounts(p, WORDS.length)
      nodes.forEach((n, i) => n.style.setProperty('--lit', lit[i].toFixed(3)))
    }

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(paint)
    }

    const measure = () => {
      const r = root.getBoundingClientRect()
      top = r.top + window.scrollY
      height = r.height
      last = -1
      schedule()
    }

    measure()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', measure)
    window.addEventListener('orientationchange', measure)
    document.fonts?.ready.then(measure)
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null
    ro?.observe(root)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', measure)
      window.removeEventListener('orientationchange', measure)
      ro?.disconnect()
      // Leave every word lit: the final state.
      nodes.forEach((n) => n.style.removeProperty('--lit'))
    }
  }, [ref, disabled])
}

export default function Premise() {
  const ref = useTrack('premise')
  const statementRef = useRef(null)
  const motionOff = useReducedMotion()
  useWordLighting(statementRef, motionOff)

  return (
    <section
      id="premise"
      ref={ref}
      data-track="premise"
      aria-labelledby="premise-title"
      className="track premise flex items-center"
    >
      <div className="column w-full py-24">
        <div className="premise__grid">
          <div className="premise__text">
            <Label>{STATIONS[1].label}</Label>
            <h2
              id="premise-title"
              ref={statementRef}
              className="mt-6 max-w-[17ch] font-display text-statement font-[450] text-ink"
            >
              {WORDS.map((word, i) => (
                <span key={`${word}-${i}`}>
                  <span data-word="" className="premise-word">
                    {word}
                  </span>
                  {i < WORDS.length - 1 ? ' ' : null}
                </span>
              ))}
              {/* Drawn, so the sentence keeps its period for assistive tech. It lights last. */}
              <span data-word="" className="premise-stop">
                <FullStop />
              </span>
              <span className="sr-only">.</span>
            </h2>

            <Reveal className="mt-12 grid max-w-[60rem] gap-8 md:grid-cols-2 md:gap-12">
              <p className="max-w-measure text-body text-ink2">{premise.paragraph.text}</p>
              <div className="flex flex-col items-start gap-3">
                <p className="max-w-measure text-[1.375rem] leading-snug text-ink">{premise.claim.text}</p>
                <Chip kind="live">
                  <span>
                    {CHIP_PARTS.map((part, i) => (
                      <Fragment key={part}>
                        {i > 0 ? ' · ' : null}
                        <span className="whitespace-nowrap">{part}</span>
                      </Fragment>
                    ))}
                  </span>
                </Chip>
              </div>
            </Reveal>
          </div>

          {/* The core parked at the right third, dimmed to 35% (the dimming is on the figure, not
              on the anchor, so the box the scene measures stays untouched). */}
          <div className="premise__core">
            <CoreAnchor name="premise" className="premise__anchor">
              <div className="h-full w-full opacity-[0.35]">
                <CoreFigure layout="x" />
              </div>
            </CoreAnchor>
          </div>
        </div>
      </div>
    </section>
  )
}
