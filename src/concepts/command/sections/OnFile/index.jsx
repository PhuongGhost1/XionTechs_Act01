import { onFile, records } from '../../content/index.js'
import { STATIONS } from '../../contract/stations.js'
import { useTrack } from '../../runtime/hooks.js'
import { Label } from '../../ui/Label.jsx'
import { Reveal } from '../../ui/Reveal.jsx'
import Arrow from './Arrow.jsx'
import DemoRow from './DemoRow.jsx'
import Plate from './Plate.jsx'
import './onfile.css'

// Station 04 ON FILE, id "work" (the nav word is WORK). Doc 4.6 and 8: two real products shown
// by their real, sanitized screens, plus one clearly labelled illustrative record. No grid, no
// carousel, no logos. The core is absent here (no anchor): the silence is the point.
export default function OnFile() {
  const ref = useTrack('work')
  const real = records.filter((r) => r.image)
  const demo = records.find((r) => !r.image)

  return (
    <section id="work" ref={ref} data-track="work" aria-labelledby="work-title" className="track of-section">
      <div className="column of-column">
        <header className="of-intro">
          <Label>{STATIONS[4].label}</Label>
          <Reveal as="h2" id="work-title" className="font-display text-h2 font-medium text-ink">
            {onFile.heading.text} <span className="text-ink2">{onFile.headingMuted.text}</span>
          </Reveal>
        </header>

        {real.map((record, i) => (
          <Plate key={record.id} record={record} index={i} mirrored={i % 2 === 1} />
        ))}

        {demo && <DemoRow record={demo} index={real.length} />}

        <p className="of-end">
          <span className="text-ink2">{onFile.endLine.text}</span>
          <a className="of-link group" href={onFile.endCta.href}>
            <span>{onFile.endCta.text}</span>
            <Arrow />
          </a>
        </p>
      </div>
    </section>
  )
}
