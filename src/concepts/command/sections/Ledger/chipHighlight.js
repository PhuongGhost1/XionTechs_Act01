// M18 chip highlight (doc 7.2): selecting a ledger row gives every chip of that kind on the page
// a 2 px yellow outline for 3 s. The outline is CSS (motion.css [data-chip][data-highlight]);
// this module only sets and removes data-highlight, and scrolls when nothing of that kind is in
// view. The DOM is passed in, so the logic runs under test with plain objects.

export const HIGHLIGHT_MS = 3000

/** All chips of a kind under `root`, in document order. */
export const chipsOfKind = (root, kind) => Array.from(root.querySelectorAll(`[data-chip="${kind}"]`))

/**
 * True when any part of the element is inside the visible band of the viewport, the band
 * between the fixed header and the fixed dock.
 */
export function isInView(el, { viewportHeight, top = 0, bottom = 0 }) {
  const r = el.getBoundingClientRect()
  return r.bottom > top && r.top < viewportHeight - bottom && r.height > 0
}

/**
 * The chip to scroll to, or null. Chips inside the selected row's own panel (`skip`) do not
 * count: the visitor just clicked there, so they are always in view and would hide the question
 * "is there one elsewhere I cannot see". The page scrolls only when none of the other chips is
 * visible (a visitor who already sees what was outlined is not moved), and goes to the first.
 */
export function scrollTarget(chips, band, skip = () => false) {
  const others = chips.filter((c) => !skip(c))
  if (others.length === 0 || others.some((c) => isInView(c, band))) return null
  return others[0]
}

let timer = null
let lit = []

/** Removes the outline from whatever is currently lit. */
export function clearHighlight({ clear = clearTimeout } = {}) {
  if (timer !== null) clear(timer)
  timer = null
  for (const el of lit) el.removeAttribute('data-highlight')
  lit = []
}

/**
 * Outlines every chip of `kind` for HIGHLIGHT_MS and scrolls to the first when none is visible.
 * A second call replaces the first. Returns { count, scrolled }.
 *
 * @param {string} kind
 * @param {{
 *   root?: ParentNode, win?: { innerHeight: number },
 *   band?: { top?: number, bottom?: number },
 *   skip?: (el: Element) => boolean,
 *   smooth?: boolean,
 *   schedule?: typeof setTimeout, clear?: typeof clearTimeout,
 * }} [options] `smooth: false` is the reduced-motion case: the outline only, and any scroll is instant.
 */
export function highlightKind(kind, options = {}) {
  const {
    root = document,
    win = window,
    band = {},
    skip,
    smooth = true,
    schedule = setTimeout,
    clear = clearTimeout,
  } = options
  clearHighlight({ clear })

  const chips = chipsOfKind(root, kind)
  for (const chip of chips) chip.setAttribute('data-highlight', '')
  lit = chips
  timer = schedule(() => clearHighlight({ clear }), HIGHLIGHT_MS)

  const target = scrollTarget(chips, { viewportHeight: win.innerHeight, top: band.top ?? 0, bottom: band.bottom ?? 0 }, skip)
  if (target) target.scrollIntoView({ block: 'center', behavior: smooth ? 'smooth' : 'auto' })
  return { count: chips.length, scrolled: Boolean(target) }
}
