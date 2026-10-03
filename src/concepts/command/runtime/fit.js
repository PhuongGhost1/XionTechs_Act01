// "Does it fit?" helpers for pinned stages (doc 5.3, 10.4). A pin is a fixed-height stage: with
// enlarged text (the reader's own setting, 200 percent) or on a very small window its content can
// be taller or wider than the stage and would be clipped. These pure functions decide that from
// rectangles, and watchLayout() tells a caller when to ask again. The sections decide what to do
// (the finale releases its pin, THE LINE becomes its list).
//
// Rects are anything with { left, right, top, bottom } (DOMRect, or plain objects in the tests).

/**
 * True when any of `rects` sticks out of `box` by more than `tol` px on any side. Empty rects
 * (hidden or detached elements, 0 x 0) are ignored.
 */
export function overflowsBox(box, rects, tol = 1) {
  for (const r of rects) {
    if (!(r.right - r.left > 0) || !(r.bottom - r.top > 0)) continue
    if (r.top < box.top - tol || r.bottom > box.bottom + tol) return true
    if (r.left < box.left - tol || r.right > box.right + tol) return true
  }
  return false
}

/** True when any two of `rects` overlap, leaving less than `gap` px between them. */
export function anyOverlap(rects, gap = 0) {
  const live = rects.filter((r) => r.right - r.left > 0 && r.bottom - r.top > 0)
  for (let i = 0; i < live.length; i += 1) {
    for (let j = i + 1; j < live.length; j += 1) {
      const a = live[i]
      const b = live[j]
      if (a.left < b.right + gap && b.left < a.right + gap && a.top < b.bottom + gap && b.top < a.bottom + gap) return true
    }
  }
  return false
}

/** The root font size in px: 16 by default, larger when the reader enlarged text. */
export function rootFontPx() {
  if (typeof document === 'undefined') return 16
  return parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
}

/** A key that changes when the answer to "does it fit?" can change (window size, text size). */
export const fitKey = () =>
  typeof window === 'undefined' ? '' : `${window.innerWidth}x${window.innerHeight}@${rootFontPx()}`

/**
 * Releases the pin of a track whose stage does not hold its content. `stage` is the sticky box,
 * `contentSelector` picks the elements (inside it) that must stay inside it. When one sticks out,
 * the track gets data-unpinned and base.css lays the stage out in normal flow, at its natural
 * height, so nothing is clipped. Re-asked on every layout change by first pinning again: the
 * attribute is removed, the rects are read (one forced layout), and it is set again if still needed.
 * Returns the stop function.
 */
export function watchPinFit(track, stage, contentSelector) {
  return watchLayout(() => {
    track.removeAttribute('data-unpinned')
    const rects = [...stage.querySelectorAll(contentSelector)].map((el) => el.getBoundingClientRect())
    if (overflowsBox(stage.getBoundingClientRect(), rects)) track.setAttribute('data-unpinned', '')
  })
}

/**
 * Calls `check` now and whenever the layout can change under it: resize, orientation, the web
 * fonts arriving, load. Returns the stop function. `check` must be cheap and idempotent.
 */
export function watchLayout(check) {
  if (typeof window === 'undefined') return () => {}
  let dead = false
  const run = () => {
    if (!dead) check()
  }
  window.addEventListener('resize', run)
  window.addEventListener('orientationchange', run)
  window.addEventListener('load', run)
  document.fonts?.ready.then(run)
  run()
  return () => {
    dead = true
    window.removeEventListener('resize', run)
    window.removeEventListener('orientationchange', run)
    window.removeEventListener('load', run)
  }
}
