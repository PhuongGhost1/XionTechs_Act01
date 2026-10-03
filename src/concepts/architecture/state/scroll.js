// One rAF-throttled scroll controller. Scroll-linked pieces register an element; the controller writes a
// CSS variable on it (default `--p`) and optionally calls back. Nothing here touches React state, so a
// scroll never re-renders a component. Brief 00: DOM motion for the page, WebGL confined to the hero.
//
//   mode 'stage'  the element is a tall container with a sticky child: p runs 0 -> 1 while it is pinned
//   mode 'pass'   the element scrolls through the viewport: p runs 0 -> 1 from entering to leaving

const tracked = new Set()
let ticking = false
let bound = false

export const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v)

export function progressOf(rect, vh, mode) {
  if (mode === 'pass') return clamp01((vh - rect.top) / (vh + rect.height))
  return clamp01(-rect.top / Math.max(1, rect.height - vh))
}

function run() {
  ticking = false
  const vh = window.innerHeight
  for (const t of tracked) {
    const p = progressOf(t.el.getBoundingClientRect(), vh, t.mode)
    if (Math.abs(p - t.last) < 0.0004 && !t.first) continue
    t.first = false
    t.last = p
    t.el.style.setProperty(t.varName, p.toFixed(4))
    if (t.onProgress) t.onProgress(p, t.el)
  }
  const root = document.documentElement
  const max = Math.max(1, root.scrollHeight - vh)
  root.style.setProperty('--page-p', clamp01(window.scrollY / max).toFixed(4))
}

function schedule() {
  if (!ticking) {
    ticking = true
    requestAnimationFrame(run)
  }
}

function bind() {
  if (bound) return
  bound = true
  window.addEventListener('scroll', schedule, { passive: true })
  window.addEventListener('resize', schedule, { passive: true })
}

export function trackScroll(el, { mode = 'stage', varName = '--p', onProgress } = {}) {
  bind()
  const entry = { el, mode, varName, onProgress, last: -1, first: true }
  tracked.add(entry)
  schedule()
  return () => tracked.delete(entry)
}

/** Ask for a recompute, e.g. after lazy sections changed the page height. */
export function refreshScroll() {
  bind()
  schedule()
}
