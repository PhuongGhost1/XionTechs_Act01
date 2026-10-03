import { displayName, onFile, records } from '../../content/index.js'
import { STATIONS } from '../../contract/stations.js'
import { useTrack } from '../../runtime/hooks.js'
import { Label } from '../../ui/Label.jsx'

// STUB (WP5 replaces this file). Station 04 ON FILE, id "work" (the nav word is WORK). WP5 builds
// doc 4.6 and 8: one plate per record with the real screenshot, dot-leader spec rows from
// specRows(), two-way hotspots, the scan (M10), DEP-003 as a dashed row. The core is absent here.
export default function OnFile() {
  const ref = useTrack('work')
  return (
    <section id="work" ref={ref} data-track="work" aria-labelledby="work-title" className="track">
      <div className="column flex flex-col gap-6 py-[var(--station-gap)]">
        <Label>{STATIONS[4].label}</Label>
        <h2 id="work-title" className="font-display text-h2 font-medium text-ink">
          {onFile.heading.text} <span className="text-ink2">{onFile.headingMuted.text}</span>
        </h2>
        <ul className="flex flex-col gap-3 font-mono text-label uppercase text-ink2">
          {records.map((r) => (
            <li key={r.id}>
              {r.code.text} / {displayName(r)}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
