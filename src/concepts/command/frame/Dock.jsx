import { frame } from '../content/index.js'
import { buildCounter } from '../contract/stations.js'
import { useActiveStation, useBrief } from '../runtime/hooks.js'

// STUB (WP1 replaces this file). The docked rail at the bottom (48 px, 56 plus safe area on
// phones): the BUILD 00n counter (the section you are in), the brief count, and later the
// scrubber and the honest render readout (tier, quality, motion).
export default function Dock() {
  const station = useActiveStation()
  const { count } = useBrief()
  return (
    <div
      role="presentation"
      className="fixed inset-x-0 bottom-0 z-30 flex h-dock items-center justify-between border-t border-hair bg-void px-[var(--margin-x)] font-mono text-counter uppercase text-ink2"
    >
      <span>
        {frame.build.text} {buildCounter(station.index)}
      </span>
      <span className="hidden text-ink3 md:inline">{station.label}</span>
      <span aria-live="polite">
        {frame.brief.text} ( {count} )
      </span>
    </div>
  )
}
