// Pure geometry for the ESS annotation drawing (sheet 06, project 1). The real, sanitized screenshot sits in
// the middle of a "figure" box with a gutter on each side. Numbered labels live in the gutters; a thin
// horizontal leader runs from each label to the area's `marker`, a point measured on the screenshot
// (content.work.ess.areas). All numbers here are percentages: image coordinates are % of the screenshot,
// figure coordinates are % of the whole figure box (gutters included).

// Gutter on each side as % of the figure width. Phones get a wider one, relative to the box, so the 22 px
// labels still fit beside a 280 px screenshot.
export const GUTTER = { wide: 6.5, narrow: 9 }

/** Aspect ratio (width / height) of the figure box so the screenshot keeps its own proportions. */
export const figureAspect = (screen, g) => screen.width / (screen.height * (1 - (2 * g) / 100))

/** Image % -> figure %, horizontally. */
export const toFigureX = (x, g) => g + (x * (100 - 2 * g)) / 100

/**
 * The leader of one area, in figure %. `gutter` is the stretch on the paper (navy line), from the label's
 * centre to the screenshot's edge; `image` is the stretch over the screenshot (paper-coloured line), from
 * that edge to the marker. Each has `left`, `width`; the line grows from the label outwards (`origin`).
 */
export function leaderOf(area, g) {
  const right = area.side === 'right'
  const labelX = right ? 100 - g / 2 : g / 2
  const edge = right ? 100 - g : g
  const markerX = toFigureX(area.marker.x, g)
  const span = (a, b) => ({ left: Math.min(a, b), width: Math.abs(a - b) })
  return {
    labelX,
    y: area.marker.y,
    markerX,
    origin: right ? 'right' : 'left',
    gutter: span(labelX, edge),
    image: span(edge, markerX),
  }
}

const r = (n) => Math.round(n * 100) / 100

/**
 * An SVG path (viewBox 0 0 100 100) that paints everything except the given regions: the "tracing paper" veil
 * laid over the screenshot with a window cut for each region (fill-rule evenodd).
 */
export function veilPath(regions) {
  const holes = regions.map((q) => `M${r(q.x)} ${r(q.y)}H${r(q.x + q.w)}V${r(q.y + q.h)}H${r(q.x)}Z`)
  return ['M0 0H100V100H0Z', ...holes].join('')
}

/** True when two % boxes overlap. */
export const overlaps = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h
