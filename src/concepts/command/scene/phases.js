// Scroll position -> scene phase (docs/concepts/01-command-implementation.md §5). Pure: no DOM.
//
// The page has six sections (SECTION_IDS in store.js) and the data core has six phases, one per
// section: 0 hero, 1 modules, 2 process, 3 deployments, 4 signals, 5 contact. The phase is a
// continuous number from 0 to 5. It equals k while section k holds the viewport's centre line, and
// glides to k + 1 with a smoothstep around each boundary.

// Half-width of the blend around a section boundary, as a share of the viewport height. Sections
// touch each other, so without this the phase would snap at the boundary instead of moving.
export const BLEND_ZONE = 0.3

export const smoothstep = (edge0, edge1, x) => {
  if (edge1 === edge0) return x < edge0 ? 0 : 1
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

const isRect = (r) => r != null && Number.isFinite(r.top) && Number.isFinite(r.bottom)

// `rects[k]` is the viewport rect ({ top, bottom }, CSS px, y down) of section k, or null when the
// section is not in the DOM (it is then skipped). Returns the phase.
export function computePhase(rects, viewportHeight) {
  if (!rects || !(viewportHeight > 0)) return 0
  const centre = viewportHeight / 2
  let prev = null
  let prevIndex = -1
  for (let k = 0; k < rects.length; k++) {
    const rect = rects[k]
    if (!isRect(rect)) continue
    if (prev === null) {
      prev = rect
      prevIndex = k
      continue
    }
    // Boundary between two sections: the middle of the gap, if any. The blend covers the whole gap
    // and, when sections touch, a zone on either side, never reaching further than half of either
    // section so two zones can not overlap.
    const mid = (prev.bottom + rect.top) / 2
    const half = Math.max(
      (rect.top - prev.bottom) / 2,
      Math.min(BLEND_ZONE * viewportHeight, (prev.bottom - prev.top) / 2, (rect.bottom - rect.top) / 2),
    )
    if (centre < mid - half) return prevIndex
    if (centre <= mid + half) return prevIndex + (k - prevIndex) * smoothstep(mid - half, mid + half, centre)
    prev = rect
    prevIndex = k
  }
  return Math.max(prevIndex, 0)
}

// True when `rect` fills the whole viewport. The signals band is opaque paper, so while it does the
// canvas has nothing to show and stops drawing.
export function coversViewport(rect, viewportHeight) {
  return isRect(rect) && rect.top <= 0 && rect.bottom >= viewportHeight
}
