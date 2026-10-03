import { clamp01, ease, lerp } from '../contract/anchors.js'

// Where the core is on screen, without allocating (the render loop calls this every frame).
//
// contract/anchors.js getCoreRect() is the reference: the same two anchors, the same easing. It
// builds a few objects per call, which is fine for a handler but not for a 60 fps loop, so this
// file repeats its segment rules over a scratch object. placement.test.js holds the two together:
// for a grid of scroll progress the answers must match coreAnchorSegment exactly.

/**
 * Which two anchors the core sits between, and how far (0..1, not eased), written into `out`
 * as { from, to, t }. Mirrors contract/anchors.js coreAnchorSegment.
 */
export function segmentInto(raw, out) {
  const p = (id) => clamp01(raw[id] ?? 0)
  if (p('done') > 0) {
    out.from = 'done'
    out.to = 'done'
    out.t = 0
  } else if (p('work') > 0 || p('ledger') > 0) {
    out.from = 'line'
    out.to = 'line'
    out.t = 0
  } else if (p('line') > 0) {
    out.from = 'deploy'
    out.to = 'line'
    out.t = clamp01(p('line') / 0.15)
  } else if (p('deploy') > 0) {
    out.from = 'premise'
    out.to = 'deploy'
    out.t = clamp01(p('deploy') / (1 / 3))
  } else {
    out.from = 'hero'
    out.to = 'premise'
    out.t = clamp01(p('premise') / 0.5)
  }
  return out
}

const rectA = { x: 0, y: 0, width: 0, height: 0 }
const rectB = { x: 0, y: 0, width: 0, height: 0 }

/**
 * The core's rect in viewport px: the eased lerp between its two anchors' viewport rects. Writes
 * { x, y, width, height } (and the segment) into `out`; returns false when neither anchor is
 * mounted yet. `rectOf(name, scratch)` fills `scratch` with an anchor's CURRENT viewport rect and
 * returns false when the anchor is not mounted.
 *
 * Why not anchors.js getAnchorRect (cached document rect minus scroll)? A `position: sticky`
 * anchor, like the DEPLOY instrument, moves in the document as it sticks, so a cached document
 * rect goes stale the moment it pins. The caller reads the live rect instead.
 */
export function placeCore(raw, rectOf, out) {
  segmentInto(raw, out)
  const hasA = rectOf(out.from, rectA)
  const hasB = out.to === out.from ? hasA : rectOf(out.to, rectB)
  if (!hasA && !hasB) return false
  const from = hasA ? rectA : rectB
  const to = out.to === out.from ? from : hasB ? rectB : from
  const t = ease(out.t)
  out.x = lerp(from.x, to.x, t)
  out.y = lerp(from.y, to.y, t)
  out.width = lerp(from.width, to.width, t)
  out.height = lerp(from.height, to.height, t)
  return true
}

/** True when a viewport rect is more than `margin` viewports away from the screen. */
export const isFar = (rect, vh, margin = 1) => rect.y > vh * (1 + margin) || rect.y + rect.height < -vh * margin
