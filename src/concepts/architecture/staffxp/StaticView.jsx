import { useId, useState } from 'react'
import { staffxp } from '../content.js'
import Chip from '../ui/Chip.jsx'
import Dimension from '../ui/Dimension.jsx'
import Plot from '../ui/Plot.jsx'
import { Cross } from '../ui/Marks.jsx'
import SectionHead from '../ui/SectionHead.jsx'
import { SheetHeader } from '../ui/Sheet.jsx'
import { copy } from './copy.js'
import { DataFace, HiddenFace, HotspotList, Pins, ScreenFace } from './Faces.jsx'
import { StackDiagram } from './Model.jsx'
import { DetailFields, ModelNote } from './Panel.jsx'
import { LAYERS, faceKind, isDashed, layerCode, statusLabel } from './faces.js'

// Narrow, short and reduced-motion screens: no sticky stage and no scroll-linked 3D. The model is shown
// assembled, as the real dashboard with its numbered regions and their list, then the five layers as an
// accordion carrying everything the desktop model shows (role, what is seen, technology, the identity screen,
// the data bays, the dashed placeholders). Nothing is lost, nothing moves on its own.

const kicker = `${staffxp.kicker} · ${staffxp.name}`

function Figure() {
  const [hot, setHot] = useState(null)
  const experience = LAYERS[0]
  return (
    <figure className="sx-fig">
      <p className="sx-fig__title">
        <span className="bp-h3">{staffxp.name}</span>
        <span className="bp-mono text-bp-mute">{staffxp.eyebrow}</span>
      </p>
      <Plot className="sx-fig__dim" aria-hidden="true">
        <Dimension axis="x" measure delay={200} />
        <span className="bp-mono sx-dim__cap text-bp-mute">{copy.dimension}</span>
      </Plot>
      <div className="sx-fig__frame">
        <Cross className="sx-reg sx-reg--tl text-bp-line" />
        <Cross className="sx-reg sx-reg--tr text-bp-line" />
        <Cross className="sx-reg sx-reg--bl text-bp-line" />
        <Cross className="sx-reg sx-reg--br text-bp-line" />
        <ScreenFace layer={experience} />
        <Pins hot={hot} onHot={setHot} />
      </div>
      <figcaption className="sx-fig__cap">
        <span className="bp-mono text-bp-mute">{layerCode(0)}</span>
        <span className="font-semibold">{experience.label}</span>
        <Chip kind="confirmed">{statusLabel(experience)}</Chip>
      </figcaption>
      <HotspotList hot={hot} onHot={setHot} className="mt-6" />
    </figure>
  )
}

/** What a panel shows besides the text: the screen, the bays or the dashed placeholder. */
function Visual({ layer, index }) {
  const kind = faceKind(layer)
  if (layer.id === LAYERS[0].id) return <p className="sx-card__note">{copy.shownAbove}</p>
  return (
    <div className="sx-acc__visual" data-kind={kind} data-dashed={isDashed(layer) ? 'true' : undefined}>
      {kind === 'screen' ? <ScreenFace layer={layer} /> : null}
      {kind === 'bays' ? <DataFace layer={layer} index={index} /> : null}
      {kind === 'hidden' ? <HiddenFace layer={layer} index={index} /> : null}
    </div>
  )
}

function Accordion() {
  const base = useId()
  const [open, setOpen] = useState({ [LAYERS[0].id]: true })
  const toggle = (id) => setOpen((o) => ({ ...o, [id]: !o[id] }))
  return (
    <ol className="sx-acc" aria-label={copy.indexLabel}>
      {LAYERS.map((layer, i) => {
        const panel = `${base}-${layer.id}`
        const isOpen = Boolean(open[layer.id])
        return (
          <li key={layer.id} className="sx-acc__item" data-dashed={isDashed(layer) ? 'true' : undefined}>
            <h3>
              <button type="button" className="sx-acc__btn" aria-expanded={isOpen} aria-controls={panel} onClick={() => toggle(layer.id)}>
                <span className="sx-row__code bp-mono">{layerCode(i)}</span>
                <span className="sx-row__label">{layer.label}</span>
                <span className="sx-row__mark" aria-hidden="true" />
                <span className="sx-acc__chev bp-mono" aria-hidden="true">
                  {isOpen ? '−' : '+'}
                </span>
                <span className="sr-only">{isOpen ? copy.detailsClose : copy.detailsOpen}</span>
              </button>
            </h3>
            <div id={panel} role="region" aria-label={layer.label} hidden={!isOpen} className="sx-acc__panel">
              <p className="mb-3">
                <Chip kind={layer.confirmed ? 'confirmed' : 'illustrative'}>{statusLabel(layer)}</Chip>
              </p>
              <DetailFields layer={layer} />
              <Visual layer={layer} index={i} />
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export default function StaticView() {
  return (
    <>
      <div className="bp-wrap sx-top">
        <SheetHeader id="staffxp" />
        <SectionHead id="staffxp" kicker={kicker} title={staffxp.title} lede={staffxp.desc} className="sx-sechead" />
      </div>
      <div className="bp-wrap sx-static">
        <div className="sx-static__fig">
          <Figure />
        </div>
        <div className="sx-static__rest">
          <figure className="sx-diagram-fig">
            <StackDiagram />
            <figcaption>
              <span className="bp-mono text-bp-mute">{copy.staticModelTitle}</span>
              <span>{copy.staticModelNote}</span>
            </figcaption>
          </figure>
          <Accordion />
          <ModelNote className="mt-6" />
        </div>
      </div>
    </>
  )
}
