// Which module row is active while the page scrolls (doc 4.4): the row nearest the middle of the
// viewport, found with an IntersectionObserver on a thin band across the middle. Pure helpers
// here, so the choice is tested without a browser.

/** The observer band: a strip across the middle of the viewport (doc 4.4). */
export const ROOT_MARGIN = '-45% 0px -45% 0px'

/** Fine steps, so the callback fires as a row slides through the band and the share changes. */
export const THRESHOLDS = Array.from({ length: 21 }, (_, i) => i / 20)

/**
 * The active row from the share of each row inside the band. The row with the largest share
 * wins; on a tie the current row stays, so the instrument never flickers between two rows.
 * Returns `current` when no row touches the band (the reader is between rows or off the list).
 */
export function pickActive(ratios, current = -1) {
  let best = -1
  let bestRatio = 0
  ratios.forEach((r, i) => {
    if (r > bestRatio + 1e-6) {
      best = i
      bestRatio = r
    }
  })
  if (best < 0) return current
  if (current >= 0 && (ratios[current] ?? 0) >= bestRatio - 1e-6) return current
  return best
}
