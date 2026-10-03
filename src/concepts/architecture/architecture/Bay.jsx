import { cellTypes, columnLabel, columnStops } from './levels.js'
import { at, timing } from './timing.js'

// The drawn parts of the section: the structural bay of a level, its slab, and the foundation pads. All of it is
// SVG without a viewBox, so one user unit is one pixel and the lines stay one pixel thick at any width. Positions
// along the bay are percentages, so a bay stretches to the row; heights are percentages of the storey.
// The plotting order is the page signature: slabs first, then columns, braces and connections last.

const pct = (n) => `${n}%`

function Cell({ type, x0, x1, row, i }) {
  const t = timing.brace(row, i)
  switch (type) {
    case 'x':
      // The brand X as a structural member: two braces crossing at a joint. One diagonal turns yellow when the
      // level is chosen, like the yellow stroke of the logo.
      return (
        <g>
          <line className="arch-ln arch-diag bp-draw" pathLength="1" x1={pct(x0)} y1="0" x2={pct(x1)} y2="100%" style={at(t)} />
          <line className="arch-ln bp-draw" pathLength="1" x1={pct(x1)} y1="0" x2={pct(x0)} y2="100%" style={at(t + 120)} />
          <svg x={pct((x0 + x1) / 2)} y="50%" overflow="visible">
            <circle className="arch-joint bp-fade" r="3.5" style={at(t + 700)} />
          </svg>
        </g>
      )
    case 't':
      return <line className="arch-ln arch-sig arch-crisp bp-draw" pathLength="1" x1={pct(x0)} y1="34%" x2={pct(x1)} y2="34%" style={at(t)} />
    case 'j':
      // A beam across the bay with a connector plug on the column: an interface between two parts.
      return (
        <g>
          <line className="arch-ln arch-sig arch-crisp bp-draw" pathLength="1" x1={pct(x0)} y1="50%" x2={pct(x1)} y2="50%" style={at(t)} />
          <svg x={pct(x0)} y="50%" overflow="visible">
            <rect className="arch-plug bp-fade" x="-5" y="-9" width="10" height="18" style={at(t + 500)} />
          </svg>
        </g>
      )
    case 's':
      // Storage tiers: four shelves across the bay.
      return (
        <g>
          {['22%', '41%', '60%', '79%'].map((y, k) => (
            <line key={y} className={`arch-ln arch-crisp bp-draw${k === 2 ? ' arch-sig' : ''}`} pathLength="1" x1={pct(x0)} y1={y} x2={pct(x1)} y2={y} style={at(t + k * 70)} />
          ))}
        </g>
      )
    default:
      return null
  }
}

/** The structural bay of one level: columns, then the cells between them. The right wall belongs to the section. */
export function Bay({ levelId, n, row }) {
  const cells = cellTypes(levelId, n)
  const stops = columnStops(n)
  return (
    <svg className="arch-bay" aria-hidden="true" focusable="false">
      {stops.slice(0, -1).map((x, i) => (
        <line key={x} className="arch-ln arch-crisp bp-draw" pathLength="1" x1={pct(x)} y1="0" x2={pct(x)} y2="100%" style={at(timing.column(row, i))} />
      ))}
      {cells.map((type, i) => (
        <Cell key={i} type={type} x0={stops[i]} x1={stops[i + 1]} row={row} i={i} />
      ))}
    </svg>
  )
}

/** A floor slab drawn as a cut element: two outlines and a hatch between them. `hatchId` names the pattern. */
export function Slab({ hatchId, row, deep = false }) {
  const d = timing.slab(row)
  return (
    <span className={`arch-slab${deep ? ' arch-slab--deep' : ''}`} aria-hidden="true">
      <svg focusable="false">
        <rect className="arch-slab-fill bp-fade" width="100%" height="100%" fill={`url(#${hatchId})`} style={at(d + 500)} />
        <line className="arch-ln arch-crisp bp-draw" pathLength="1" x1="0" y1="0.5" x2="100%" y2="0.5" style={at(d)} />
        <svg y="100%" overflow="visible">
          <line className="arch-ln arch-crisp bp-draw" pathLength="1" x1="0" y1="-0.5" x2="100%" y2="-0.5" style={at(d + 100)} />
        </svg>
      </svg>
    </span>
  )
}

/** Footing pads under the columns of the last level, and the ground they stand on. */
export function Foundation({ n, hatchId, groundId }) {
  const stops = columnStops(n)
  const delay = timing.slab(6)
  const pad = (key, x) => (
    <svg key={key} x={x} y="0" overflow="visible">
      <rect className="arch-ln arch-pad bp-fade" x="-15" y="0" width="30" height="18" fill={`url(#${hatchId})`} style={at(delay + 300)} />
    </svg>
  )
  return (
    <div className="arch-found" aria-hidden="true">
      <span className="arch-found__a">
        <svg focusable="false">{pad('wall', '0')}</svg>
      </span>
      <span className="arch-found__b">
        <svg focusable="false">{stops.map((x, i) => pad(i, pct(x)))}</svg>
      </span>
      <span className="arch-ground">
        <svg focusable="false">
          <line className="arch-ln arch-crisp bp-draw" pathLength="1" x1="0" y1="0.5" x2="100%" y2="0.5" style={at(delay + 200)} />
          <rect className="bp-fade" y="1" width="100%" height="9" fill={`url(#${groundId})`} style={at(delay + 600)} />
        </svg>
      </span>
    </div>
  )
}

/**
 * Grid bubbles over the columns, as on a real section: a lettered circle and a short line down to the roof. They
 * sit in the third grid column so they share the bay's percentages.
 */
export function GridBubbles({ n }) {
  const stops = columnStops(n)
  return (
    <div className="arch-grid" aria-hidden="true">
      <span className="arch-grid__bay">
        <svg focusable="false">
          {stops.map((x, i) => (
            <g key={x}>
              <svg x={pct(x)} y="0" overflow="visible">
                <line className="arch-ln arch-crisp bp-draw" pathLength="1" x1="0.5" y1="22" x2="0.5" y2="36" style={at(40 + i * 50)} />
                <circle className="arch-bubble bp-fade" cx="0" cy="11" r="11" style={at(i * 50)} />
                <text className="arch-bubble-text bp-mono bp-fade" x="0" y="11" textAnchor="middle" dominantBaseline="central" style={at(400 + i * 50)}>
                  {columnLabel(i)}
                </text>
              </svg>
            </g>
          ))}
        </svg>
      </span>
    </div>
  )
}
