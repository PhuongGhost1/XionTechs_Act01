// Pure helpers of the screenshot viewer (doc 8.5, M10, M11). No DOM, no React: tested in
// viewerMath.test.js. All geometry is in percent of the image, because the stage that holds the
// image, the boxes and the grid is exactly as large as the image, so a percent is the same
// fraction of the picture at every width.

/** The sector grid of the viewer: columns A to H across, rows 1 to 5 down (doc 5.4, 8.5). */
export const GRID = Object.freeze({ cols: 8, rows: 5 })
const COLUMN_LETTERS = 'ABCDEFGH'

/** The sector a point (percent of the image) falls in, e.g. "C4". Clamped to the grid. */
export function sectorAt(xPct, yPct) {
  const col = Math.min(GRID.cols - 1, Math.max(0, Math.floor((xPct / 100) * GRID.cols)))
  const row = Math.min(GRID.rows, Math.max(1, Math.floor((yPct / 100) * GRID.rows) + 1))
  return `${COLUMN_LETTERS[col]}${row}`
}

/** The row (1 to 5) a scan line at `progress` (0 to 1 down the frame) is crossing. */
export function scanRow(progress) {
  return Math.min(GRID.rows, Math.max(1, Math.floor(progress * GRID.rows) + 1))
}

/** Local time of the visitor as HH:MM:SS (24 h). The scan prints it; nothing is stored. */
export function formatScanTime(date) {
  const two = (n) => String(n).padStart(2, '0')
  return `${two(date.getHours())}:${two(date.getMinutes())}:${two(date.getSeconds())}`
}

/**
 * The font size (in vw) of a record's giant name. The design asks for 16 vw (StaffXP) and 22 vw
 * (ESS); Plate.jsx passes 11 and 15 to hold the page-length budget. A longer name, such as the
 * generic "School staff platform" used when NAME_PRODUCTS is false, would not fit a line at the
 * base size, so the size shrinks until about 0.72 em per character fits the content width.
 * Short names keep the base size.
 */
export function nameSize(name, baseVw, fitVw = 92) {
  const chars = Math.max(1, name.length)
  return Math.min(baseVw, Math.round((fitVw / (chars * 0.72)) * 100) / 100)
}

/** The limited tag printed over a region: code and one or two words, "UI-03 CALENDAR". */
export const limitedTag = (box) => `${box.code} ${box.short}`

/**
 * Which side of its box the limited tag sits on. Above the top edge by default, where the
 * capture's own cards leave a small gap, so the tag does not cover the card's title. A box at
 * the very top of the picture (the navigation bars) has no room above, and a very low box (the
 * "Open in Microsoft To Do" link, which sits inside a card) would cover the list above it, so
 * those hang below their bottom edge.
 */
export const tagSide = (box) => (box.y < 3 || box.h < 4 ? 'below' : 'above')

/**
 * A box as wide as the picture (the ESS top bar) puts its tag at the right end, so it does not
 * collide with the tag of the box that starts right under it (the profile card, at the left).
 */
export const tagEdge = (box) => (box.w >= 99 ? 'right' : 'left')

/**
 * Where the full tag opens relative to its box so it stays inside the picture: toward the right
 * edge for boxes on the right half, from the bottom edge for boxes low in the picture.
 * @returns {{ h: 'left'|'right', v: 'top'|'bottom' }}
 */
export function tagAlign(box) {
  return {
    h: box.x + box.w / 2 > 55 ? 'right' : 'left',
    v: box.y > 70 ? 'bottom' : 'top',
  }
}

/**
 * The region the viewer shows as active. Hover wins over focus, focus over a pinned (tapped)
 * region, so the pointer always gets an answer under the finger or cursor.
 */
export const activeRegion = ({ hover = null, focus = null, pinned = null }) => hover ?? focus ?? pinned ?? null

/**
 * clip-path that cuts the active box out of a full-size veil, so everything else dims (doc 8.5:
 * "others dim to 35%"). Even-odd polygon: the outer rectangle, then the box.
 */
export function veilClip(box) {
  const x1 = box.x
  const y1 = box.y
  const x2 = box.x + box.w
  const y2 = box.y + box.h
  return `polygon(evenodd, 0 0, 100% 0, 100% 100%, 0 100%, 0 0, ${x1}% ${y1}%, ${x1}% ${y2}%, ${x2}% ${y2}%, ${x2}% ${y1}%, ${x1}% ${y1}%)`
}

/**
 * Zoom of the stage to a region, for the touch tap (M11). The window has the image's aspect
 * ratio, so a percent of the stage is the same percent of the window.
 *
 * The aim is readable text, not just a fitted box: the scale is the one that shows the capture's
 * text at about 0.8 of its native size (`readable`), but never more than the scale at which the
 * region still fills the window width (`fit`), nor more than `max`. A region wider than the window
 * can show at that scale simply fills the width. A region taller than the view shows from its
 * top edge; one that fits is centred.
 *
 * @param {{x:number,y:number,w:number,h:number}} box   percent of the image
 * @param {{ windowWidth: number, imageWidth: number, max?: number, readableRatio?: number, pad?: number }} view
 *   windowWidth in CSS px, imageWidth the natural width of the capture in px
 * @returns {{ scale: number, tx: number, ty: number, transform: string }}
 *   tx and ty are percent of the stage, applied as translate() before scale()
 */
export function zoomFor(box, { windowWidth, imageWidth, max = 6, readableRatio = 0.8, pad = 2 }) {
  const fit = 100 / (box.w + pad * 2)
  const readable = readableRatio / (windowWidth / imageWidth)
  const scale = Math.max(1, Math.min(fit, readable, max))
  const view = 100 / scale // size of the visible part, percent of the image, on both axes
  const clamp = (v) => Math.min(100 - view, Math.max(0, v))
  const vx = clamp(box.x + box.w / 2 - view / 2)
  const vy = box.h >= view - pad * 2 ? clamp(box.y - pad) : clamp(box.y + box.h / 2 - view / 2)
  const tx = -vx * scale
  const ty = -vy * scale
  return { scale, tx, ty, transform: `translate(${round(tx)}%, ${round(ty)}%) scale(${round(scale)})` }
}

const round = (n) => Math.round(n * 1000) / 1000

/** The identity transform: the whole picture. */
export const NO_ZOOM = 'translate(0%, 0%) scale(1)'

/** True when the region box intersects the part of the picture the zoom shows. */
export const regionVisible = (box, zoom) => {
  const view = 100 / zoom.scale
  const vx = -zoom.tx / zoom.scale
  const vy = -zoom.ty / zoom.scale
  return box.x + box.w > vx && box.x < vx + view && box.y + box.h > vy && box.y < vy + view
}

/** Finds a box by id, or null. */
export const boxById = (boxes, id) => boxes.find((b) => b.id === id) ?? null
