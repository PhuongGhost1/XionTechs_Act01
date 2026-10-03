import { useState } from 'react'
import { process as line } from '../../content/index.js'
import { Chip } from '../../ui/Chip.jsx'

// The illustrative failure beat (M09, doc 7.2), shown on step BUILD: a check outline turns dashed,
// shakes 3 px, a ring expands, the outline goes solid again and a tick draws. About 1.4 s, once.
// It is artwork, never a client run: the chip says so for every visitor, and the same sentence a
// screen reader gets (and everybody gets under reduced motion) says it in words.
//
// Timing lives in line.css as ONE 1400 ms timeline of percentage keyframes with no animation
// delays, so PAUSE freezes a coherent frame and a paused beat shows its first frame, not a
// half-started one. The element's own style is the final state (solid, ticked, PASSED); the
// animation only describes the way in.
//
//   animate   play the timeline on mount. Captured once: a re-render must not stop it midway.
//   paused    freeze the timeline (data-paused; motion.css and line.css both honour it).

export function Beat({ animate = false, paused = false }) {
  const [animated] = useState(animate)
  const { beat } = line
  const [fail, retry, pass] = beat.phases
  return (
    <div
      className="line-beat flex flex-wrap items-center gap-x-4 gap-y-3"
      data-animated={animated ? '' : undefined}
      data-paused={paused ? '' : undefined}
    >
      <svg
        aria-hidden="true"
        focusable="false"
        viewBox="0 0 64 64"
        width="64"
        height="64"
        className="line-beat__svg -ml-1.5 block h-12 w-12 shrink-0 overflow-visible sm:-ml-2 sm:h-16 sm:w-16"
        fill="none"
        strokeWidth="1.5"
      >
        <rect x="8" y="8" width="48" height="48" className="line-beat__ring stroke-signal" />
        <g className="line-beat__shake">
          <rect x="8" y="8" width="48" height="48" className="line-beat__solid stroke-ink2" />
          <rect x="8" y="8" width="48" height="48" strokeDasharray="5 4" className="line-beat__dashed stroke-ink2" />
          <path d="M21 33 L29 41 L44 23" pathLength="1" className="line-beat__tick stroke-ink" />
        </g>
      </svg>
      <div className="font-mono">
        <p className="text-label uppercase text-ink3">{beat.check.text}</p>
        <p className="grid text-counter font-medium uppercase text-ink" aria-hidden="true">
          <span className="line-beat__word line-beat__word--fail">{fail.text}</span>
          <span className="line-beat__word line-beat__word--retry">{retry.text}</span>
          <span className="line-beat__word line-beat__word--pass">{pass.text}</span>
        </p>
      </div>
      <Chip kind="illustrative">{beat.chip.text}</Chip>
      <p className="sr-only">{beat.reduced.text}</p>
    </div>
  )
}
