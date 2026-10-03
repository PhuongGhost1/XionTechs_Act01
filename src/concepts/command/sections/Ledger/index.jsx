import { useEffect, useRef, useState } from 'react'
import { ledger, visibleLedgerRows } from '../../content/index.js'
import { FRAME, PHONE_MAX_WIDTH, STATIONS } from '../../contract/stations.js'
import { useReducedMotion, useTrack } from '../../runtime/hooks.js'
import { BUILD_SHA, buildStamp } from '../../runtime/build.js'
import { Chip } from '../../ui/Chip.jsx'
import { Frame } from '../../ui/Frame.jsx'
import { Label } from '../../ui/Label.jsx'
import { Reveal } from '../../ui/Reveal.jsx'
import { HIGHLIGHT_MS, clearHighlight, highlightKind } from './chipHighlight.js'
import './ledger.css'

// Station 05 LEDGER, id "ledger" (doc 4.7): proof without claims. A six-row table of what on
// this page is real, REAL first, in the standard panel anatomy (title, scope, one sentence of
// definition, then the table), and the build stamp. Selecting a row outlines every chip of that
// kind on the page for 3 s (M18). No CTA here: proof is not interrupted by a sell, and there are
// no numerals above body size.

/** The visible band between the fixed header and the fixed dock, for the "is it in view" check. */
function frameBand() {
  const phone = window.innerWidth <= PHONE_MAX_WIDTH
  return { top: phone ? FRAME.headerPhone : FRAME.headerDesktop, bottom: phone ? FRAME.dockPhone : FRAME.dockDesktop }
}

/** The stamp is real or N/A; nothing here is ever invented (doc 9). */
const stampText = () => (BUILD_SHA === 'N/A' ? ledger.unavailable.text : buildStamp())

export default function Ledger() {
  const ref = useTrack('ledger')
  const panelRef = useRef(null)
  const reducedMotion = useReducedMotion()
  const [selected, setSelected] = useState(null) // { kind, count }
  const rows = visibleLedgerRows()

  // The outline and this status line end together; leaving the page also clears the outline.
  useEffect(() => {
    if (!selected) return undefined
    const t = setTimeout(() => setSelected(null), HIGHLIGHT_MS)
    return () => clearTimeout(t)
  }, [selected])
  useEffect(() => clearHighlight, [])

  const select = (kind) => {
    const { count } = highlightKind(kind, {
      band: frameBand(),
      skip: (el) => Boolean(panelRef.current?.contains(el)),
      smooth: !reducedMotion,
    })
    setSelected({ kind, count })
  }

  const kindWord = (kind) => rows.find((r) => r.kind === kind)?.kind.toUpperCase()

  return (
    <section id="ledger" ref={ref} data-track="ledger" aria-labelledby="ledger-title" className="track ld-section">
      <div className="column ld-column">
        <header className="ld-intro">
          <Label>{STATIONS[5].label}</Label>
          <Reveal as="h2" id="ledger-title" className="font-display text-h2 font-medium text-ink">
            {ledger.heading.text}
          </Reveal>
        </header>

        <Reveal>
          <Frame className="ld-panel">
            <div ref={panelRef} className="ld-inner">
              <div className="ld-head">
                <Label as="p" className="text-ink2">
                  05.1 / {ledger.panel.title.text}
                </Label>
                <Label as="p">{ledger.panel.scope.text}</Label>
              </div>
              <p className="ld-definition">{ledger.panel.definition.text}</p>

              <div className="ld-cols" aria-hidden="true">
                <Label as="span">{ledger.columns.kind.text}</Label>
                <Label as="span">{ledger.columns.meaning.text}</Label>
                <Label as="span">{ledger.columns.where.text}</Label>
              </div>

              <ul className="ld-rows">
                {rows.map((row) => (
                  <li key={row.id}>
                    <button
                      type="button"
                      className="ld-row"
                      data-active={selected?.kind === row.kind ? '' : undefined}
                      onClick={() => select(row.kind)}
                    >
                      <span className="ld-row__chip">
                        <Chip kind={row.kind} review />
                      </span>
                      <span className="ld-row__text">{row.text}</span>
                      <span className="ld-row__where">{row.where.text}</span>
                    </button>
                  </li>
                ))}
              </ul>

              <dl className="ld-foot">
                <div className="ld-foot__stamp">
                  <dt className="font-mono text-label uppercase text-ink3">{ledger.buildLabel.text}</dt>
                  <dd className="m-0">
                    <Chip kind="build">{stampText()}</Chip>
                  </dd>
                </div>
              </dl>
              <p className="ld-note">{ledger.counterNote.text}</p>
            </div>
          </Frame>
        </Reveal>

        <p className="ld-status font-mono text-label uppercase text-ink3" role="status" aria-live="polite">
          {selected
            ? selected.count === 0
              ? ledger.none.text
              : `${kindWord(selected.kind)} : ${selected.count} ${(selected.count === 1 ? ledger.outlinedOne : ledger.outlined).text}`
            : ''}
        </p>
      </div>
    </section>
  )
}
