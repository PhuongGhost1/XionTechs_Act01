import { process as line } from '../../content/index.js'
import { CoreAnchor } from '../../contract/anchors.js'
import { STATIONS } from '../../contract/stations.js'
import { CoreFigure } from '../../core/CoreFigure.jsx'
import { useTrack } from '../../runtime/hooks.js'
import { Label } from '../../ui/Label.jsx'

// STUB (WP4 replaces this file). Station 03 THE LINE, id "line": a pinned track (class
// track--pin) with one sticky .stage. WP4 builds doc 4.5: six steps driven by --p, the linear
// packet, step buttons that call scrollToProgress, the failure beat, PAUSE | REPLAY, and the
// ordered-list fallback for reduced motion and RAW.
export default function Line() {
  const ref = useTrack('line')
  return (
    <section id="line" ref={ref} data-track="line" aria-labelledby="line-title" className="track track--pin">
      <div className="stage">
        <div className="column flex h-full flex-col justify-center gap-6">
          <Label>{STATIONS[3].label}</Label>
          <h2 id="line-title" className="font-display text-h2 font-medium text-ink">
            {line.heading.text}
          </h2>
          <ol className="flex flex-wrap gap-x-6 gap-y-2 font-mono text-label uppercase text-ink2">
            {line.steps.map((s) => (
              <li key={s.id}>{s.label}</li>
            ))}
          </ol>
          <CoreAnchor name="line" className="h-[120px] w-full max-w-[640px]">
            <CoreFigure layout="line" />
          </CoreAnchor>
        </div>
      </div>
    </section>
  )
}
