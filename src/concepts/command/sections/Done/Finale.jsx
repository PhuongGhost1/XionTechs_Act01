import { useEffect, useState } from 'react'
import { brand, contact } from '../../content/index.js'
import { CoreAnchor } from '../../contract/anchors.js'
import { STATIONS } from '../../contract/stations.js'
import { CoreFigure } from '../../core/CoreFigure.jsx'
import { watchPinFit } from '../../runtime/fit.js'
import { useInView, useTrack } from '../../runtime/hooks.js'
import { getState } from '../../runtime/scroll.js'
import { cx } from '../../ui/cx.js'
import { FullStop } from '../../ui/FullStop.jsx'
import { Label } from '../../ui/Label.jsx'
import { logoVisible, sweepReached } from './finale.js'
import './done.css'

// Station 06, the pinned finale (doc 4.8, 6.6, M13, M14). A track of 160 svh holding a sticky
// stage. WP2 draws the X mark (SVG here, WebGL convergence over it) inside <CoreAnchor name="done">;
// this file owns everything around it: the three stair-stepped lines, the lockup with the real
// logo, the sweep under DONE.
//
// Final state first: every element's own style is its finished look (the logo is visible, the
// underline is drawn, the lines are set). Motion only describes the way in, so reduced motion,
// RAW, no pin and a failed script all show the finished frame with nothing lost.

const logo = brand.logo.reversed

/**
 * Two thresholds hang off the scroll progress of #done: the logo fades in at 70 percent of the
 * convergence and the underline sweeps once past 0.9. State changes only when a threshold is
 * crossed (a handful of times per visit), never per frame.
 */
function useFinaleThresholds() {
  const [logoOn, setLogoOn] = useState(false)
  const [swept, setSwept] = useState(false)

  useEffect(() => {
    let frame = 0
    let settle = 0
    const apply = () => {
      frame = 0
      const p = getState().progress.done ?? 0
      setLogoOn(logoVisible(p))
      // Latched: the sweep is "once", it does not run backwards when the reader scrolls up.
      if (sweepReached(p)) setSwept(true)
    }
    // The controller turns scrollY into progress in its own frame; read one frame later, and once
    // more when scrolling stops, so a stop right on a threshold cannot leave a stale value.
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(apply)
      window.clearTimeout(settle)
      settle = window.setTimeout(apply, 140)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    window.addEventListener('load', onScroll)
    onScroll()
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      window.removeEventListener('load', onScroll)
      if (frame) cancelAnimationFrame(frame)
      window.clearTimeout(settle)
    }
  }, [])

  return { logoOn, swept }
}

export function Finale() {
  const trackRef = useTrack('done')
  const [stageRef, entered] = useInView({ once: true, threshold: 0.3 })
  const { logoOn, swept } = useFinaleThresholds()
  const { finale } = contact

  // Enlarged text (or a very small window) can make the lockup taller than the pinned stage, which
  // would clip it: then the pin is released and the finale is laid out in normal flow.
  useEffect(() => {
    const stage = stageRef.current
    const track = trackRef.current
    return stage && track ? watchPinFit(track, stage, 'h2, p, img, .finale-anchor') : undefined
  }, [trackRef, stageRef])

  return (
    <section
      id="done"
      ref={trackRef}
      data-track="done"
      aria-labelledby="done-title"
      data-lockup={logoOn ? 'on' : 'off'}
      data-sweep={swept ? 'on' : 'off'}
      className="track track--pin done-finale"
    >
      <div ref={stageRef} className="stage">
        <div className="column relative z-10 flex h-full flex-col justify-center gap-5 lg:grid lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-12">
          <div className="min-w-0">
            <Label>{STATIONS[6].label}</Label>
            <p className="mt-1 font-mono text-label uppercase text-ink2">{finale.kicker.text}</p>
            <h2
              id="done-title"
              className="finale-type mt-3 font-display text-finale font-medium uppercase text-ink lg:mt-5"
            >
              {finale.lines.map((line, i) => (
                <span
                  key={line.id}
                  data-rise={entered ? 'in' : 'out'}
                  className={cx('finale-line', entered && 'anim-clip-rise')}
                  style={{ '--i': i }}
                >
                  {i === finale.lines.length - 1 ? (
                    <span className="finale-done">
                      {line.text}
                      <span aria-hidden="true" data-decor="" className="finale-sweep" />
                    </span>
                  ) : (
                    line.text
                  )}
                  {i === finale.lines.length - 1 && <FullStop />}{' '}
                </span>
              ))}
            </h2>
          </div>

          <div className="finale-lockup flex w-fit max-w-full flex-col items-center gap-3 self-start text-center lg:gap-4 lg:self-auto">
            {/* The mark alone is the convergence target; the wordmark is the real PNG at its
                native size, never upscaled (doc 6.6). */}
            <CoreAnchor name="done" className="finale-anchor">
              <CoreFigure layout="mark" />
            </CoreAnchor>
            <img
              data-logo=""
              src={logo.url}
              width={logo.width}
              height={logo.height}
              alt={logo.alt.text}
              decoding="async"
              className="finale-logo native-logo"
            />
            <p className="finale-tagline font-display font-medium uppercase text-ink">
              {finale.line.text}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
