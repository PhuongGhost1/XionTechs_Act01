import { cx } from '../ui/cx.js'

// STUB (WP2 replaces the drawing). Keep the props: <CoreFigure layout active className />.
//
// The static SVG of the X core for each layout (doc 6.2): the finished page underneath the WebGL
// canvas, and the whole picture when WebGL is off. It sits INSIDE a <CoreAnchor>, which gives it
// its size; it fills the anchor and scales with it.
//
//   layout  'x' | 'arms' | 'line' | 'field' | 'mark'   (L0 .. L4)
//   active  0..3 lights one arm: 0 CODE (NW), 1 AI (NE), 2 CLOUD (SE), 3 PRODUCT (SW); omit for none
//
// This stub draws a simple X, four hub squares and the yellow core, enough for every station to
// show something. Colours are Tailwind token classes; no hex.

const C = 160 // centre of the 320 x 320 box
const R = 110 // arm length
const UX = 0.8480481 // cos 32 degrees: the page's one angle
const UY = 0.5299193 // sin 32 degrees
// NW, NE, SE, SW (the order of the four modules).
const DIRS = [
  [-UX, -UY],
  [UX, -UY],
  [UX, UY],
  [-UX, UY],
]
const at = (u, d) => [C + u[0] * d, C + u[1] * d]

const stroke = (on) => (on ? 'stroke-signal' : 'stroke-ink2/40')

function Core() {
  // 8 px yellow square turned 45 degrees: the core (doc 5.4).
  return <rect x={C - 4} y={C - 4} width="8" height="8" transform={`rotate(45 ${C} ${C})`} className="fill-signal" />
}

function Hub({ x, y, on }) {
  return <rect x={x - 5} y={y - 5} width="10" height="10" className={cx('fill-ground transition-colors duration-ui', stroke(on))} strokeWidth="1" />
}

function Arms({ spread, active }) {
  return DIRS.map((u, i) => {
    const near = spread ? 0.3 * R : 0
    const [x1, y1] = at(u, near)
    const [x2, y2] = at(u, near + R)
    const on = active === i
    return (
      <g key={i}>
        <line x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth="1" className={cx('transition-colors duration-ui', stroke(on))} />
        {[0.45, 0.75].map((t) => {
          const [x, y] = at(u, near + R * t)
          return <circle key={t} cx={x} cy={y} r="3" className={cx('fill-ground transition-colors duration-ui', stroke(on))} strokeWidth="1" />
        })}
        <Hub x={x2} y={y2} on={on} />
      </g>
    )
  })
}

function Line() {
  const stops = [0, 1, 2, 3, 4, 5].map((i) => 36 + i * 49.6)
  return (
    <g>
      <line x1="24" y1={C} x2="296" y2={C} strokeWidth="1" className="stroke-ink2/40" />
      {stops.map((x, i) => (
        <rect key={x} x={x - 4} y={C - 4} width="8" height="8" strokeWidth="1" className={cx(i === 0 ? 'fill-signal stroke-signal' : 'fill-ground stroke-ink2/60')} />
      ))}
    </g>
  )
}

function Field() {
  // A deterministic scatter: the accumulated points before they converge (doc 6.2, S6).
  const dots = []
  let seed = 7
  for (let i = 0; i < 64; i += 1) {
    seed = (seed * 16807) % 2147483647
    const x = 16 + (seed % 288)
    seed = (seed * 16807) % 2147483647
    const y = 16 + (seed % 288)
    dots.push([x, y])
  }
  return (
    <g>
      {dots.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i % 9 === 0 ? 2.2 : 1.4} className={i % 9 === 0 ? 'fill-signal' : 'fill-ink2/50'} />
      ))}
    </g>
  )
}

function Mark() {
  // Interim X mark: two crossing strokes in the signal colour. WP2 traces the real logo mark.
  return (
    <g strokeLinecap="square" strokeWidth="12" className="stroke-signal">
      <line x1="96" y1="96" x2="224" y2="224" />
      <line x1="224" y1="96" x2="96" y2="224" />
    </g>
  )
}

export function CoreFigure({ layout = 'x', active, className }) {
  return (
    <svg
      viewBox="0 0 320 320"
      aria-hidden="true"
      focusable="false"
      data-layout={layout}
      className={cx('block h-full w-full overflow-visible', className)}
    >
      {layout === 'x' && <Arms spread={false} active={active} />}
      {layout === 'arms' && <Arms spread active={active} />}
      {layout === 'line' && <Line />}
      {layout === 'field' && <Field />}
      {layout === 'mark' && <Mark />}
      {(layout === 'x' || layout === 'arms') && <Core />}
    </svg>
  )
}
