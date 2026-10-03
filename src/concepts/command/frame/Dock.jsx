import { useEffect, useRef } from 'react'
import { frame } from '../content/index.js'
import { buildCounter } from '../contract/stations.js'
import { watchLayout } from '../runtime/fit.js'
import { useActiveStation, useBrief } from '../runtime/hooks.js'
import Readout from './Readout.jsx'
import { splitCounter } from './logic.js'
import Scrubber from './Scrubber.jsx'
import './frame.css'

// The docked rail along the bottom (doc 4.1, 4.9): 48 px, or 56 px plus the safe area on phones.
//
//   BUILD 00n   which section you are in. Only the last digit flips (six hard steps, M12). It is a
//               UI state, not a claim; the ledger says so in words.
//   section     the station's name (from 1280)
//   scrubber    the page as a slider with the station ticks (Scrubber.jsx)
//   readout     RENDER / QUALITY / MOTION, real values or N/A (from 1024; the menu has it below that)
//   BRIEF ( n ) the count of what the visitor selected; a link to the composer
//
// Enlarged text: the dock is a fixed height and cannot wrap. When its row is wider than the window
// (200 percent text on a phone) the word BUILD goes (the counter stays; dock[data-crowded], frame.css).
//
// One pass of the dock fading in is the end of the boot (M01); motion.css removes it under
// reduced motion. The dock sits on --void, the silence colour, with one hairline above it.
export default function Dock() {
  const station = useActiveStation()
  const { count } = useBrief()
  const counter = splitCounter(buildCounter(station.index))
  const rootRef = useRef(null)
  const rowRef = useRef(null)

  // Imperative on purpose (see Header.jsx): no state per resize, no flash.
  useEffect(() => {
    const dock = rootRef.current
    const row = rowRef.current
    if (!dock || !row) return undefined
    return watchLayout(() => {
      dock.removeAttribute('data-crowded')
      if (row.scrollWidth > row.clientWidth + 1) dock.setAttribute('data-crowded', '')
    })
  }, [])

  return (
    <div
      ref={rootRef}
      role="group"
      aria-label={frame.dockLabel.text}
      data-frame="dock"
      className="anim-fade-in fixed inset-x-0 bottom-0 z-30 h-dock border-t border-hair bg-void pb-[env(safe-area-inset-bottom,0px)]"
    >
      <div ref={rowRef} className="mx-auto flex h-full max-w-content items-center gap-3 px-[var(--margin-x)] font-mono text-counter uppercase md:gap-6">
        <p className="m-0 shrink-0 font-medium text-ink">
          <span className="dock-build text-ink3">{frame.build.text} </span>
          {counter.head}
          {/* Keyed on the digit so only it replays the flip. */}
          <span key={station.index} className="anim-step-flip inline-block">
            {counter.tail}
          </span>
        </p>
        <p className="m-0 hidden shrink-0 text-label text-ink3 xl:block">{station.label}</p>
        <Scrubber className="min-w-0 flex-1" />
        <Readout className="hidden shrink-0 lg:flex" />
        <a
          href="#contact"
          className="inline-flex h-[44px] shrink-0 items-center font-medium text-ink hover:underline hover:underline-offset-4 motion-off:transition-none"
        >
          <span aria-live="polite" aria-atomic="true">
            {frame.brief.text} ({' '}
            <span key={count} className="anim-step-flip inline-block">
              {count}
            </span>{' '}
            )
          </span>
        </a>
      </div>
    </div>
  )
}
