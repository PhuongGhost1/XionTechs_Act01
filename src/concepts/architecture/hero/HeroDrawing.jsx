import { Fragment, useLayoutEffect, useRef } from 'react'
import { LAYER_COUNT } from '../model/layers.js'
import { svgRenderer } from './svgRenderer.js'

// The hero's SVG drawing: five tracing-paper slabs in an exploded axonometric view. It draws itself on load
// (.bp-draw, staggered from the top layer down) and is then redrawn per frame by svgRenderer. Decorative:
// the figure around it carries the text alternative.

const STAGGER = 170 // ms between one layer starting to plot and the next
const at = (ms) => ({ '--d': `${ms}ms` })

export default function HeroDrawing({ driver }) {
  const ref = useRef(null)
  useLayoutEffect(() => driver.add(svgRenderer(ref.current)), [driver])

  // Paint order is bottom layer first, with each gap's connectors drawn between the two layers they join, so
  // the paper of the upper layer sits in front of them.
  const order = Array.from({ length: LAYER_COUNT }, (_, i) => LAYER_COUNT - 1 - i)

  return (
    <svg ref={ref} className="hero-svg" viewBox="0 0 720 760" aria-hidden="true" focusable="false">
      {order.map((i) => {
        const base = i * STAGGER
        return (
          <Fragment key={i}>
            <g data-layer={i}>
              <path data-k="paper" className="hero-paper bp-fade fill-bp-bg" style={at(base)} />
              <path data-k="slab" className="bp-draw hero-line hero-line--slab" pathLength="1" style={at(base)} />
              <path data-k="flat" className="bp-draw hero-line" pathLength="1" style={at(base + 220)} />
              <path data-k="raised" className="bp-draw hero-line" pathLength="1" style={at(base + 220)} />
              <path data-k="marker" className="bp-fade hero-marker" style={at(base + 900)} />
            </g>
            {i > 0 ? (
              <path data-k="conn" data-i={i - 1} className="bp-draw hero-line hero-line--conn" pathLength="1" style={at(900 + base)} />
            ) : null}
          </Fragment>
        )
      })}
      <g data-k="signal" style={{ opacity: 0 }}>
        <path data-k="trail" className="hero-trail" />
        <rect data-k="mark" className="hero-signal" width="8" height="8" />
      </g>
    </svg>
  )
}
