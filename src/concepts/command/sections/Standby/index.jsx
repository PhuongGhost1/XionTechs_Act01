import { hero } from '../../content/index.js'
import { CoreAnchor } from '../../contract/anchors.js'
import { STATIONS } from '../../contract/stations.js'
import { CoreFigure } from '../../core/CoreFigure.jsx'
import { useTrack } from '../../runtime/hooks.js'
import { Button } from '../../ui/Button.jsx'
import { FullStop } from '../../ui/FullStop.jsx'
import { Label } from '../../ui/Label.jsx'

// STUB (WP3 replaces this file). Station 00 STANDBY, id "standby", track height from
// --track-standby. WP3 builds the hero of doc 4.2 and 6.1: the headline cut by two +/-32 degree
// hairlines at P, four tags, the legend, boot (M01). The h1 lives here and only here.
export default function Standby() {
  const ref = useTrack('standby')
  const station = STATIONS[0]
  return (
    <section id="standby" ref={ref} data-track="standby" aria-labelledby="standby-title" className="track">
      <div className="column relative flex min-h-[inherit] flex-col justify-end gap-6 pb-24">
        <Label>{station.label}</Label>
        <h1 id="standby-title" className="max-w-[12ch] font-display text-display-xl font-medium uppercase text-ink">
          {hero.h1.lines.join(' ')}
          <FullStop caret />
        </h1>
        <p className="max-w-measure text-body text-ink2">{hero.sub.text}</p>
        <div className="flex flex-wrap gap-4">
          <Button href={hero.cta.primary.href} arrow="right" flow>
            {hero.cta.primary.text}
          </Button>
          <Button variant="ghost" href={hero.cta.secondary.href} arrow="down">
            {hero.cta.secondary.text}
          </Button>
        </div>
        <CoreAnchor name="hero" className="absolute right-[var(--margin-x)] top-8 h-[160px] w-[160px] md:h-[280px] md:w-[280px]">
          <CoreFigure layout="x" />
        </CoreAnchor>
      </div>
    </section>
  )
}
