import { ledger, visibleLedgerRows } from '../../content/index.js'
import { STATIONS } from '../../contract/stations.js'
import { useTrack } from '../../runtime/hooks.js'
import { Chip } from '../../ui/Chip.jsx'
import { Label } from '../../ui/Label.jsx'

// STUB (WP5 replaces this file). Station 05 LEDGER, id "ledger". WP5 builds doc 4.7: the table
// of what is real, chip highlight on row click (M18), the BUILD stamp from runtime/build.js.
// No CTA here: proof is not interrupted by a sell.
export default function Ledger() {
  const ref = useTrack('ledger')
  return (
    <section id="ledger" ref={ref} data-track="ledger" aria-labelledby="ledger-title" className="track">
      <div className="column flex flex-col gap-6 py-[var(--station-gap)]">
        <Label>{STATIONS[5].label}</Label>
        <h2 id="ledger-title" className="font-display text-h2 font-medium text-ink">
          {ledger.heading.text}
        </h2>
        <ul className="flex flex-col gap-3 text-ink2">
          {visibleLedgerRows().map((row) => (
            <li key={row.id} className="flex flex-wrap items-baseline gap-3">
              <Chip kind={row.kind} />
              <span className="max-w-measure">{row.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
