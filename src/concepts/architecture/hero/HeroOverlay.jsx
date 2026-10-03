import { Fragment, useLayoutEffect, useRef } from 'react'
import { hero } from '../content.js'
import { Cross } from '../ui/Marks.jsx'
import Dimension from '../ui/Dimension.jsx'
import { heroCopy } from './copy.js'
import { overlayRenderer } from './overlay.js'

// Everything drawn above the model that must stay crisp text: layer labels with leader lines, the live camera
// readout, the dimension lines, the axis triad and the registration marks. Positions are written by
// overlayRenderer every frame; this component only renders the markup once. Decorative: the figure's alt text
// and the visually hidden list carry the information.

const pad2 = (n) => String(n).padStart(2, '0')

export default function HeroOverlay({ driver }) {
  const ref = useRef(null)
  useLayoutEffect(() => driver.add(overlayRenderer(ref.current)), [driver])

  return (
    <div ref={ref} className="hero-overlay" aria-hidden="true">
      <svg className="hero-guides" focusable="false">
        <g className="hero-ext">
          <line data-ext="xa" />
          <line data-ext="xb" />
          <line data-ext="ya" />
          <line data-ext="yb" />
        </g>
        <g className="hero-leaders">
          {hero.layers.map((l, i) => (
            <Fragment key={l.id}>
              <line data-leader={i} />
              <circle data-dot={i} r="2.5" />
            </Fragment>
          ))}
        </g>
        <g data-triad className="hero-triad">
          <g data-axis-end>
            <circle r="4.5" />
            <circle r="1.2" className="hero-triad__dot" />
          </g>
          {['X', 'Y', 'Z'].map((id) => (
            <g key={id}>
              <line data-axis={id} />
              <text data-axis-label={id} className="font-mono">
                {id}
              </text>
            </g>
          ))}
        </g>
      </svg>

      <ol className="hero-labels bp-mono">
        {hero.layers.map((l, i) => (
          <li key={l.id} data-label={i} className="hero-label">
            <span className="hero-label__idx">{pad2(i + 1)}</span>
            <span>{l.label}</span>
          </li>
        ))}
      </ol>

      <dl className="hero-hud bp-mono">
        <dt>{hero.viewLabel}</dt>
        <dd data-hud="view" />
        <dt>{heroCopy.elevation}</dt>
        <dd data-hud="elev" />
        <dt>{heroCopy.azimuth}</dt>
        <dd data-hud="az" />
      </dl>

      {/* The horizontal dimension is measured: its label is the rendered pixel width of the line. It is written
          per frame (the model's width changes as the camera tilts), so it is not the React Dimension. */}
      <div data-dim="x" className="hero-dim hero-dim--x">
        <span className="bp-dim bp-dim--x" style={{ '--d': '1500ms' }}>
          <span className="bp-dim__line" />
          <span className="bp-dim__tick bp-dim__tick--a" />
          <span className="bp-dim__tick bp-dim__tick--b" />
          <span className="bp-dim__label bp-mono" />
        </span>
      </div>
      <div data-dim="y" className="hero-dim hero-dim--y">
        <Dimension axis="y" label={heroCopy.layerDimension} delay={1900} />
      </div>

      <Cross className="hero-cross hero-cross--tl" />
      <Cross className="hero-cross hero-cross--tr" />
      <Cross className="hero-cross hero-cross--bl" />
      <Cross className="hero-cross hero-cross--br" />
    </div>
  )
}
