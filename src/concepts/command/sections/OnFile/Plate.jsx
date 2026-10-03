import { useId, useState } from 'react'
import { NAME_PRODUCTS, displayName, hotspotEvidence, onFile, content, specRows } from '../../content/index.js'
import { useBrief } from '../../runtime/hooks.js'
import { Chip } from '../../ui/Chip.jsx'
import { Label } from '../../ui/Label.jsx'
import { Reveal } from '../../ui/Reveal.jsx'
import { SpecRow } from '../../ui/SpecRow.jsx'
import Viewer from './Viewer.jsx'
import { ZOOM_QUERY, isFocusVisible, readDebugHotspots, useMedia } from './useViewer.js'
import { activeRegion, nameSize } from './viewerMath.js'

// One plate of ON FILE (doc 8.2): the giant name, the descriptor, the real screenshot at full
// content width, a caption, and a dot-leader spec list in two columns: the facts of the record
// (from select.js specRows, so NAME_PRODUCTS is honoured) and the region index, whose buttons are
// the accessible twin of the boxes over the capture. Hover, focus or tap a row and its region is
// outlined in yellow while the others dim; hover a region and its row lights up.
//
// `mirrored` is plate 04.2: the name flush right, the descriptor on the left, columns swapped.

// Rows whose value is long or a chip sit under their label instead of on one line.
const STACKED = new Set(['CAPTURE SHOWS', 'DETAILS'])

const hotspotsOf = (record) => content.hotspots[record.hotspots]

function RegionRow({ box, active, pinned, descId, onHover, onFocus, onBlur, onTap }) {
  return (
    <li>
      <button
        type="button"
        className="of-row"
        data-active={active ? '' : undefined}
        aria-pressed={pinned}
        aria-describedby={descId}
        onPointerEnter={(e) => e.pointerType !== 'touch' && onHover(box.id)}
        onPointerLeave={() => onHover(null)}
        onFocus={(e) => isFocusVisible(e.currentTarget) && onFocus(box.id)}
        onBlur={() => onBlur(box.id)}
        onClick={() => onTap(box.id)}
      >
        <span className="of-row__code">{box.code}</span>
        <span className="of-row__leader" data-leader="" aria-hidden="true" />
        <span className="of-row__label">{box.label}</span>
      </button>
    </li>
  )
}

function AddToBrief({ record, name }) {
  const brief = useBrief()
  const checked = brief.has(record.id)
  return (
    <label className="of-check">
      <input type="checkbox" className="of-check__box" checked={checked} onChange={() => brief.toggleRecord(record.id)} />
      <span className="of-check__ring" aria-hidden="true" />
      <span className="of-check__text">
        {onFile.add.text}
        <span className="sr-only"> : {name}</span>
      </span>
    </label>
  )
}

export default function Plate({ record, index, mirrored = false, nameProducts = NAME_PRODUCTS, debug }) {
  const spots = hotspotsOf(record)
  const boxes = spots.boxes
  const name = displayName(record, nameProducts)
  const rows = specRows(record, nameProducts)
  const baseVw = mirrored ? 22 : 16

  const [hover, setHover] = useState(null)
  const [focus, setFocus] = useState(null)
  const [pinned, setPinned] = useState(null)
  const zoomEnabled = useMedia(ZOOM_QUERY)
  const debugOn = debug ?? readDebugHotspots()
  const titleId = useId()
  const descId = useId()

  // A tap pins a region (and zooms to it) only where the viewer zooms: fingers or a narrow window.
  // With a mouse and room, hover and keyboard focus already highlight, and a pinned region would
  // leave the capture dimmed with no visible way to undo it.
  const pinnedId = zoomEnabled ? pinned : null
  const activeId = activeRegion({ hover, focus, pinned: pinnedId })
  const handlers = {
    onHover: setHover,
    onFocus: setFocus,
    onBlur: (id) => setFocus((f) => (f === id ? null : f)),
    onTap: (id) => zoomEnabled && setPinned((p) => (p === id ? null : id)),
  }

  return (
    <article className="of-plate" data-mirrored={mirrored ? '' : undefined} aria-labelledby={titleId}>
      <Reveal className="of-head">
        <div className="of-head__id">
          <Label>
            04.{index + 1} / {record.code.text}
          </Label>
        </div>
        <h3
          id={titleId}
          className="of-name font-display font-medium uppercase text-ink"
          style={{ '--name-vw': nameSize(name, baseVw) }}
        >
          {name}
        </h3>
        <p className="of-head__descriptor font-mono text-data text-ink2">{record.descriptor.text}</p>
      </Reveal>

      <Viewer
        record={record}
        boxes={boxes}
        imageSize={spots.image}
        activeId={activeId}
        pinnedId={pinnedId}
        zoomEnabled={zoomEnabled}
        debug={debugOn}
        onHover={setHover}
        onTap={handlers.onTap}
        onReset={() => setPinned(null)}
      />

      <p className="of-caption">
        <Chip kind="real" />
        <Chip kind="sample" />
        <span className="font-mono text-label uppercase text-ink3">{record.image.caption.text}</span>
      </p>

      <div className="of-spec">
        <dl className="of-facts">
          {rows.map((row) => (
            <SpecRow key={row.id} label={row.label} value={row.value} stack={STACKED.has(row.label)} />
          ))}
        </dl>

        <div className="of-regions" role="group" aria-labelledby={`${descId}-regions`}>
          <Label as="p" id={`${descId}-regions`}>
            {onFile.regionsLabel.text}
          </Label>
          <p className="sr-only">{onFile.regionsHint.text}</p>
          <span id={descId} className="sr-only">
            {hotspotEvidence.text}
          </span>
          <ul className="of-regions__list">
            {boxes.map((box) => (
              <RegionRow
                key={box.id}
                box={box}
                active={box.id === activeId}
                pinned={zoomEnabled ? box.id === pinnedId : undefined}
                descId={descId}
                {...handlers}
              />
            ))}
          </ul>
        </div>

        <div className="of-add">
          <AddToBrief record={record} name={name} />
        </div>
      </div>
    </article>
  )
}
