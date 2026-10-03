import { useRef } from 'react'
import { useInView } from '../hooks/hooks.js'
import Dimension from '../ui/Dimension.jsx'
import { Cross } from '../ui/Marks.jsx'
import { staffxp } from '../content.js'
import { copy } from './copy.js'
import { Face, HotspotList, Pins } from './Faces.jsx'
import { LAYERS, isDashed, layerCode, noteFor, statusLabel } from './faces.js'

// The CSS 3D exploded model of StaffXP: five matte slabs with thin navy edges, a soft shadow on the plane below,
// billboard tags with leader lines, dashed construction rails and a ground sheet. No WebGL. The scroll controller
// writes --open, --assemble, --explode, --labels and --pins on `.sx-stage`; everything here only reads them.
// `state` per plane: idle | active (hovered or focused) | dim (another layer is). The selected layer fronts the
// model once it is assembled.

function Tag({ layer, index, selected }) {
  return (
    <div className="sx-tag" aria-hidden="true" data-selected={selected ? 'true' : undefined} data-dashed={isDashed(layer) ? 'true' : undefined}>
      <div className="sx-tag__in">
        <div className="sx-tag__box">
          <span className="sx-tag__dot" />
          <span className="sx-tag__rule" />
          <span className="sx-tag__name">
            <span className="sx-tag__code bp-mono">{layerCode(index)}</span> <span className="sx-tag__label">{layer.label}</span>
          </span>
          <span className="sx-tag__status bp-mono">{statusLabel(layer)}</span>
        </div>
      </div>
    </div>
  )
}

export function Plane({ layer, index, hover, selected, onHover, onSelect, hot, onHot }) {
  const state = hover ? (hover === layer.id ? 'active' : 'dim') : 'idle'
  const isSelected = selected === layer.id
  return (
    <div
      className="sx-plane"
      data-id={layer.id}
      data-state={state}
      data-selected={isSelected ? 'true' : undefined}
      data-front={isSelected ? 'true' : undefined}
      data-dashed={isDashed(layer) ? 'true' : undefined}
      style={{ '--idx': index, '--front': isSelected ? 1 : 0 }}
    >
      <i className="sx-shadow" />
      <i className="sx-edge sx-edge--t" />
      <i className="sx-edge sx-edge--b" />
      <i className="sx-edge sx-edge--l" />
      <i className="sx-edge sx-edge--r" />
      <div className="sx-face" onPointerEnter={() => onHover(layer.id)} onPointerLeave={() => onHover(null)} onClick={() => onSelect(layer.id)}>
        <Face layer={layer} index={index} />
        {layer.id === 'experience' ? <Pins hot={hot} onHot={onHot} /> : null}
        <i className="sx-veil" />
      </div>
      <Tag layer={layer} index={index} selected={isSelected} />
    </div>
  )
}

const noop = () => {}
const OPEN = { '--open': 1, '--assemble': 0, '--explode': 1, '--labels': 1, '--pins': 0 }

/** The same planes, drawn once at the open attitude: for narrow, short and reduced-motion screens. Decorative; the list beside it says it all. */
export function StackDiagram() {
  return (
    <div className="sx-stage sx-diagram" style={OPEN} aria-hidden="true">
      <div className="sx-viewport">
        <div className="sx-model">
          <i className="sx-ground bp-grid" />
          {[0, 1, 2, 3].map((k) => (
            <i key={k} className={`sx-rail sx-rail--${k}`} />
          ))}
          {LAYERS.map((layer, i) => (
            <Plane key={layer.id} layer={layer} index={i} hover={null} selected={null} onHover={noop} onSelect={noop} hot={null} onHot={noop} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Model({ stageRef, style, live, phase, selected, hover, onHover, onSelect, hot, onHot }) {
  const front = LAYERS.find((l) => l.id === selected) || LAYERS[0]
  const listed = front.id === LAYERS[0].id
  const note = noteFor(front)
  const dimRef = useRef(null)
  const dimIn = useInView(dimRef) // the yellow line plots when the stage is on screen, not when the (tall) sheet starts
  return (
    <div ref={stageRef} style={style} className={`sx-stage ${live ? 'sx-live' : ''}`} data-phase={phase} data-front={selected}>
      <div className="sx-backdrop bp-grid" aria-hidden="true" />
      <Cross className="sx-reg sx-reg--tl text-bp-line" />
      <Cross className="sx-reg sx-reg--tr text-bp-line" />
      <Cross className="sx-reg sx-reg--bl text-bp-line" />
      <Cross className="sx-reg sx-reg--br text-bp-line" />

      <p className="sx-titleblock">
        <span className="bp-h3 sx-titleblock__name">{staffxp.name}</span>
        <span className="bp-mono text-bp-mute">{staffxp.eyebrow}</span>
      </p>

      <div className="sx-viewport" role="group" aria-label={copy.stageLabel}>
        <div ref={dimRef} data-in={dimIn ? 'true' : 'false'} className="sx-dim" aria-hidden="true">
          <Dimension axis="x" measure delay={200} />
          <span className="bp-mono sx-dim__cap text-bp-mute">{copy.dimension}</span>
        </div>
        <div className="sx-model">
          <i className="sx-ground bp-grid" aria-hidden="true" />
          {[1, 2, 3, 4].map((k) => (
            <i key={k} className="sx-sheetedge" style={{ '--k': k }} aria-hidden="true" />
          ))}
          {[0, 1, 2, 3].map((k) => (
            <i key={k} className={`sx-rail sx-rail--${k}`} aria-hidden="true" />
          ))}
          {LAYERS.map((layer, i) => (
            <Plane key={layer.id} layer={layer} index={i} hover={hover} selected={selected} onHover={onHover} onSelect={onSelect} hot={hot} onHot={onHot} />
          ))}
        </div>
        <div className="sx-under">
          {listed ? (
            <HotspotList hot={hot} onHot={onHot} />
          ) : (
            <section className="sx-caption" aria-label={front.label}>
              <h3 className="bp-mono text-bp-mute">
                {layerCode(LAYERS.indexOf(front))} {front.label}
              </h3>
              <p>{front.seen}</p>
              {note ? <p className="sx-card__note">{note}</p> : null}
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
