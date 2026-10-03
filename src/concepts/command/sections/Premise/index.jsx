import { premise } from '../../content/index.js'
import { CoreAnchor } from '../../contract/anchors.js'
import { STATIONS } from '../../contract/stations.js'
import { CoreFigure } from '../../core/CoreFigure.jsx'
import { useTrack } from '../../runtime/hooks.js'
import { Chip } from '../../ui/Chip.jsx'
import { Label } from '../../ui/Label.jsx'

// STUB (WP3 replaces this file). Station 01 PREMISE, id "premise". WP3 builds doc 4.3: the
// statement with word lighting (M06), the plain paragraph, the sourced claim with its chip.
export default function Premise() {
  const ref = useTrack('premise')
  return (
    <section id="premise" ref={ref} data-track="premise" aria-labelledby="premise-title" className="track">
      <div className="column relative flex flex-col gap-6 py-[var(--station-gap)]">
        <Label>{STATIONS[1].label}</Label>
        <h2 id="premise-title" className="max-w-[18ch] font-display text-statement font-medium text-ink">
          {premise.statement.text}
        </h2>
        <p className="max-w-measure text-body text-ink2">{premise.paragraph.text}</p>
        <p className="max-w-measure text-body text-ink">{premise.claim.text}</p>
        <Chip kind="live">{premise.claim.chip.text}</Chip>
        <CoreAnchor name="premise" className="absolute right-[var(--margin-x)] top-1/2 h-[160px] w-[160px] opacity-[0.35] md:h-[240px] md:w-[240px]">
          <CoreFigure layout="x" />
        </CoreAnchor>
      </div>
    </section>
  )
}
