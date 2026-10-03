import { HERO_ANGLE_DEG, HERO_P, X_TIPS } from '../../core/geometry.js'

// Where the hero core sits and how its four tags are laid out, as a pure function of the
// viewport width (doc 6.1 and 10.1). The component writes the result into CSS custom properties,
// so JS (the hairlines) and CSS (the core box, the tags) read ONE source and cannot drift.
//
//   band    phone (under 640)  tablet (640 to 1023)  desktop (1024 and up)
//   p       the crossing point P as fractions of the viewport width and height
//   core    the side of the core's square box, in CSS px
//   tags    'axis'   the label sits on the arm's own 32 degree line, past the tip (desktop)
//           'stack'  the label sits straight above or below the tip, kept inside the screen
//                    (phone and tablet, where the right-hand tags would run off the edge)

// Doc 10.1: tablet puts the core at (74vw, 24vh).
export const TABLET_P = Object.freeze({ x: 0.74, y: 0.24 })

/** Length of the leader line from the arm tip to its tag, in px. */
export const LEADER_LENGTH = 44
/** Gap between the tip and the tag in 'stack' mode, in px. */
export const STACK_GAP = 10

export function heroPlacement(vw) {
  const width = Number.isFinite(vw) ? vw : 1280
  if (width < 360) return { band: 'phone', p: HERO_P.phone, core: 140, tags: 'stack' }
  if (width < 640) return { band: 'phone', p: HERO_P.phone, core: 160, tags: 'stack' }
  if (width < 1024) return { band: 'tablet', p: TABLET_P, core: 200, tags: 'stack' }
  if (width < 1280) return { band: 'desktop', p: HERO_P.desktop, core: 240, tags: 'axis' }
  if (width < 1760) return { band: 'desktop', p: HERO_P.desktop, core: 280, tags: 'axis' }
  return { band: 'desktop', p: HERO_P.desktop, core: 320, tags: 'axis' }
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
