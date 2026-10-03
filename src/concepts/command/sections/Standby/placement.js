import { HERO_ANGLE_DEG, HERO_P, X_TIPS } from '../../core/geometry.js'

// Where the hero core sits and how its four tags are laid out, as a pure function of the
// viewport width (doc 6.1 and 10.1). The component writes the result into CSS custom properties,
// so JS (the hairlines) and CSS (the core box, the tags) read ONE source and cannot drift.
//
//   band    phone (under 640)  tablet (640 to 1023)  desktop (1024 and up)
//   p       the crossing point P as fractions of the viewport width and height
//   core    the side of the core's square box, in CSS px, for the width band (standby.css caps it
//           on a short window so the north tags clear the header; see minPy below)
//   tags    'axis'   the label sits on the arm's own 32 degree line, past the tip (desktop)
//           'stack'  the label sits straight above or below the tip, kept inside the screen
//                    (phone and tablet, where the right-hand tags would run off the edge)

// Doc 10.1: tablet puts the core at (74vw, 24vh).
export const TABLET_P = Object.freeze({ x: 0.74, y: 0.24 })

/** Length of the leader line from the arm tip to its tag, in px. */
export const LEADER_LENGTH = 44
/** Gap between the tip and the tag in 'stack' mode, in px. */
export const STACK_GAP = 10

/** The smallest core box standby.css lets a short window shrink to, in CSS px. */
export const MIN_CORE = 112
/** How far a north tag reaches above its arm tip, in px: axis mode (leader plus half the tag), stack mode. */
export const TAG_REACH = Object.freeze({ axis: 45, stack: 54 })
/** The arm tips sit this fraction of the core box above and below P (1 - 2 * 0.236, halved). */
const TIP_OFFSET = 0.264
/** Clear space kept between the fixed header and the north tags, in px. */
const HEADER_GAP = 8

/** The fixed header's height at this width (tokens.css: 48 px under 768, 64 px from 768). */
export const headerHeight = (vw) => (vw < 768 ? 48 : 64)

/**
 * The lowest P may sit, as a fraction of the window height, so that even the smallest core box
 * keeps its north tags below the header. Normal windows are unaffected (the answer is under the
 * design's own fraction); on a very short one (a phone held sideways) P moves down instead of the
 * tags going under the bar.
 */
export function minPy(vw, vh, tags) {
  if (!(vh > 0)) return 0
  const reach = TAG_REACH[tags] ?? TAG_REACH.axis
  return (headerHeight(vw) + HEADER_GAP + reach + TIP_OFFSET * MIN_CORE) / vh
}

function band(vw) {
  if (vw < 360) return { band: 'phone', p: HERO_P.phone, core: 140, tags: 'stack' }
  if (vw < 640) return { band: 'phone', p: HERO_P.phone, core: 160, tags: 'stack' }
  if (vw < 1024) return { band: 'tablet', p: TABLET_P, core: 200, tags: 'stack' }
  if (vw < 1280) return { band: 'desktop', p: HERO_P.desktop, core: 240, tags: 'axis' }
  if (vw < 1760) return { band: 'desktop', p: HERO_P.desktop, core: 280, tags: 'axis' }
  return { band: 'desktop', p: HERO_P.desktop, core: 320, tags: 'axis' }
}

export function heroPlacement(vw, vh) {
  const width = Number.isFinite(vw) ? vw : 1280
  const out = band(width)
  const y = Number.isFinite(vh) ? Math.max(out.p.y, minPy(width, vh, out.tags)) : out.p.y
  return y === out.p.y ? out : { ...out, p: { x: out.p.x, y } }
}

// The way each tag leaves its arm tip: sign of x, sign of y (screen, y down).
const SIGN = Object.freeze({ nw: [-1, -1], ne: [1, -1], se: [1, 1], sw: [-1, 1] })

/**
 * The leader of one tag, relative to its arm tip: where the line ends. In 'axis' mode it carries
 * on along the arm for LEADER_LENGTH px at the page angle; in 'stack' mode it goes straight up
 * or down for STACK_GAP px.
 */
export function leaderEnd(placement, mode) {
  const [sx, sy] = SIGN[placement]
  if (mode === 'stack') return { dx: 0, dy: sy * STACK_GAP }
  const rad = (HERO_ANGLE_DEG * Math.PI) / 180
  return { dx: sx * LEADER_LENGTH * Math.cos(rad), dy: sy * LEADER_LENGTH * Math.sin(rad) }
}

/** The tip of a module's arm as fractions of the core box (from the shared geometry). */
export const tipOf = (short) => X_TIPS[String(short).toLowerCase()] ?? null

/**
 * Hairline paths: four segments that run from P out to the four edges of the viewport, so the
 * boot (M01) can draw them outward from the crossing. Input is a pair of full lines as returned
 * by heroHairlines().
 */
export function hairlineSegments(lines, px, py) {
  return lines.flatMap(([x1, y1, x2, y2]) => [
    `M${px.toFixed(2)} ${py.toFixed(2)}L${x1.toFixed(2)} ${y1.toFixed(2)}`,
    `M${px.toFixed(2)} ${py.toFixed(2)}L${x2.toFixed(2)} ${y2.toFixed(2)}`,
  ])
}

/**
 * The arm to light in the figure and the canvas: a hovered or focused tag wins over a tag a touch
 * visitor opened with a first tap. Indexes are module order (0 CODE, 1 AI, 2 CLOUD, 3 PRODUCT);
 * a negative index means none. Returns undefined when nothing is lit.
 */
export function litArm(hover, opened) {
  if (hover >= 0) return hover
  return opened >= 0 ? opened : undefined
}
