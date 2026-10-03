import { staffxp } from '../content.js'
import Chip from '../ui/Chip.jsx'
import { STOPS } from './phase.js'
import { copy } from './copy.js'
import { LAYERS, isDashed, layerCode, noteFor, statusLabel } from './faces.js'

// The reading column beside the model: the state readout, the layer index (real buttons), and the detail card.

/** Which view the model is in, with a progress rule that follows the scroll (reads --p, written by the scroll controller). */
export function Readout({ phase, names }) {
  const index = names.indexOf(phase)
  return (
    <div className="sx-readout" role="group" aria-label={copy.readoutLabel}>
      <p className="bp-mono text-bp-mute">
        {copy.viewLabel} {copy.views[index]}
      </p>
      <p key={phase} className="sx-readout__cap">
        {staffxp.phases[phase]}
      </p>
      <span className="sx-readout__rule" aria-hidden="true">
        <i className="sx-readout__tick" style={{ left: `${STOPS.captionOpen * 100}%` }} />
        <i className="sx-readout__tick" style={{ left: `${STOPS.captionAssembled * 100}%` }} />
        <i className="sx-readout__mark" />
      </span>
    </div>
  )
}

/** The five layers as buttons. Hover or focus previews a layer; choosing one selects it. */
export function LayerIndex({ hover, selected, onHover, onSelect }) {
  return (
    <ol className="sx-index" aria-label={copy.indexLabel}>
      {LAYERS.map((layer, i) => {
        const dashed = isDashed(layer)
        return (
          <li key={layer.id}>
            <button
              type="button"
              className="sx-row"
              aria-pressed={selected === layer.id}
              data-dashed={dashed ? 'true' : undefined}
              data-hover={hover === layer.id ? 'true' : undefined}
              title={statusLabel(layer)}
              onClick={() => onSelect(layer.id)}
              onPointerEnter={() => onHover(layer.id)}
              onPointerLeave={() => onHover(null)}
              onFocus={() => onHover(layer.id)}
              onBlur={() => onHover(null)}
            >
              <span className="sx-row__code bp-mono">{layerCode(i)}</span>
              <span className="sx-row__label">{layer.label}</span>
              <span className="sx-row__mark" aria-hidden="true" />
              <span className="sr-only">
                {statusLabel(layer)}. {dashed ? copy.statusSr.reference : copy.statusSr.confirmed}
              </span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}

/** Role, what is seen in the product, and technology (always pending), plus the note for a layer without a screen. */
export function DetailFields({ layer }) {
  const note = noteFor(layer)
  return (
    <>
      <dl className="sx-card__list">
        <div>
          <dt className="bp-mono">{staffxp.fields.role}</dt>
          <dd>{layer.role}</dd>
        </div>
        <div>
          <dt className="bp-mono">{staffxp.fields.seen}</dt>
          <dd>{layer.seen}</dd>
        </div>
        <div>
          <dt className="bp-mono">{staffxp.fields.tech}</dt>
          <dd>
            <Chip kind="illustrative">{staffxp.techPending}</Chip>
          </dd>
        </div>
      </dl>
      {note ? <p className="sx-card__note">{note}</p> : null}
    </>
  )
}

/** The detail card: one layer's name, status and fields. Drawn dashed when the layer is not confirmed. */
export function DetailCard({ layer, index, id = 'sx-detail', className = '' }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={`sx-card ${className}`} data-dashed={isDashed(layer) ? 'true' : undefined}>
      <header className="sx-card__head">
        <p className="bp-mono text-bp-mute">{layerCode(index)}</p>
        <h3 id={`${id}-title`} className="bp-h3 sx-card__title">
          {layer.label}
        </h3>
        <Chip kind={layer.confirmed ? 'confirmed' : 'illustrative'} className="sx-card__chip">
          {statusLabel(layer)}
        </Chip>
      </header>
      <DetailFields layer={layer} />
    </section>
  )
}

/** The reference-model chip and its note, the line that keeps the whole model honest. */
export function ModelNote({ className = '' }) {
  return (
    <div className={`sx-modelnote ${className}`}>
      <Chip kind="illustrative">{staffxp.chips.model}</Chip>
      <p>{staffxp.modelNote}</p>
    </div>
  )
}
