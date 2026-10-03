import { useId, useRef, useState } from 'react'
import { capabilities, sheetOf } from '../content.js'
import Dimension from '../ui/Dimension.jsx'
import Plot from '../ui/Plot.jsx'
import SectionHead from '../ui/SectionHead.jsx'
import { Sheet, SheetHeader } from '../ui/Sheet.jsx'
import Band from './Band.jsx'
import { bandIds, drawingCode, focusTarget, nextOpen } from './bands.js'
import './capabilities.css'

// Sheet 03, "Capability layers": instead of six service cards, six horizontal bands, each a layer of one
// structure. A band is an accordion button; only one is open at a time and the first starts open. The
// vertical yellow dimension on the left margin measures the whole stack as drawn, so its number changes when a
// band opens.

export default function Capabilities() {
  const { layers } = capabilities
  const sheet = sheetOf('capabilities')
  const base = useId().replace(/[^a-zA-Z0-9]/g, '')
  const [open, setOpen] = useState(layers[0].id)
  const listRef = useRef(null)

  // Arrow keys, Home and End move between the band headers; Enter and Space are the button's own.
  const onKeyDown = (e) => {
    if (!e.target.classList?.contains('cap-head')) return
    const heads = Array.from(listRef.current.querySelectorAll('.cap-head'))
    const target = focusTarget(e.key, heads.indexOf(e.target), heads.length)
    if (target == null) return
    e.preventDefault()
    heads[target].focus()
  }

  return (
    // data-in="false" keeps the sheet's own flag from plotting the bands before they are on screen.
    <Sheet id="capabilities" band="alt" data-in="false" labelledBy="capabilities-title" className="cap py-20 md:py-28">
      <div className="bp-wrap">
        <SheetHeader id="capabilities" />
        <div className="mt-10 grid grid-cols-12 items-end gap-x-6 gap-y-8">
          <SectionHead
            id="capabilities"
            kicker={capabilities.kicker}
            title={capabilities.title}
            lede={capabilities.lede}
            draft={capabilities.draft}
            className="col-span-12 lg:col-span-8"
          />
          <p className="bp-mono col-span-12 m-0 flex items-center gap-3 text-bp-text lg:col-span-3 lg:col-start-10">
            <span aria-hidden="true" className="cap-tog cap-tog--hint">
              <i />
              <i />
              <b />
            </span>
            <span>{capabilities.expandHint}</span>
          </p>
        </div>

        <Plot className="cap-stack mt-14 lg:mt-20">
          <div className="cap-dim" aria-hidden="true">
            <Dimension axis="y" measure delay={600} />
          </div>
          <ol ref={listRef} className="cap-list" onKeyDown={onKeyDown} aria-labelledby="capabilities-title">
            {layers.map((layer, i) => (
              <Band
                key={layer.id}
                layer={layer}
                ids={bandIds(base, layer.id)}
                open={open === layer.id}
                onToggle={() => setOpen((o) => nextOpen(o, layer.id))}
                code={drawingCode(sheet.code, i)}
                last={i === layers.length - 1}
              />
            ))}
          </ol>
        </Plot>
      </div>
    </Sheet>
  )
}
