import { process as line } from '../../content/index.js'
import { STATIONS } from '../../contract/stations.js'
import { Chip } from '../../ui/Chip.jsx'
import { Label } from '../../ui/Label.jsx'
import { BriefLine } from './BriefLine.jsx'
import { BUILD_STEP } from './lineModel.js'

// THE LINE without the pin (doc 4.5 fallback): reduced motion, RAW, landscape phones, and any
// place a pinned stage does not fit. Six rows as a plain ordered list, the same words and
// sentences, the brief on REQUEST, and the failure beat as one sentence on BUILD. Nothing moves.

export function LineList() {
  return (
    <div className="column py-[var(--station-gap)]">
      <Label as="h2" id="line-title">
        {STATIONS[3].label}
      </Label>
      <ol role="list" aria-label={line.a11y.stops.text} className="mt-8 border-b border-hair">
        {line.steps.map((s, i) => (
          <li key={s.id} className="grid gap-3 border-t border-hair py-6 md:grid-cols-2 md:gap-8 md:py-8">
            <p className="font-display text-row font-medium uppercase text-ink">{s.label}</p>
            <div className="flex flex-col gap-4">
              <p className="max-w-measure text-body text-ink2">{s.sentence.text}</p>
              {i === 0 && <BriefLine />}
              {i === BUILD_STEP && (
                <div className="flex flex-col items-start gap-3">
                  <p className="max-w-measure text-body text-ink">{line.beat.reduced.text}</p>
                  <Chip kind="illustrative">{line.beat.chip.text}</Chip>
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-6 font-mono text-label uppercase text-ink3">{line.legendLine.text}</p>
    </div>
  )
}
