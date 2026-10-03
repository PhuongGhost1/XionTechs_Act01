// One rAF controller owns every scroll-linked value. Elements register with `trackProgress`; each
// frame (only while scrolling or resizing) it writes `--p` (0..1) on the element and, optionally,
// calls `onProgress`. Off-screen elements are skipped via IntersectionObserver.
//
//   mode 'sticky'  the element is taller than the viewport and holds a sticky stage: p runs from
//                  the moment its top reaches the viewport top to the moment its bottom reaches
//                  the viewport bottom.
//   mode 'exit'    p is 0 at rest and 1 once 80% of the element has scrolled out of the top.
//   mode 'flow'    ordinary content: p runs from the element's top at 75% of the viewport height
//                  to its bottom at 25%.
import { live, store } from './store.js'

const entries = new Set()
let scheduled = false
let io = null

export const clamp01 = (n) => (n < 0 ? 0 : n > 1 ? 1 : n)

// Pure: progress of a box (top, height) in a viewport of height vh.
export function progressOf(mode, top, height, vh) {
  if (mode === 'exit') return clamp01(-top / Math.max(1, height * 0.8)) // 0 at rest, 1 once 80% has left
  if (mode === 'sticky') {
    const span = Math.max(1, height - vh)
    return clamp01(-top / span)
  }
  return clamp01((vh * 0.75 - top) / (height + vh * 0.5))
}

function schedule() {
  if (scheduled) return
  scheduled = true
  requestAnimationFrame(tick)
}

function tick() {
  scheduled = false
  const vh = window.innerHeight
  const reduced = store.get().reducedMotion
  for (const e of entries) {
    if (!e.visible) continue
    const r = e.el.getBoundingClientRect()
    const p = reduced && !e.keepWhenReduced ? 1 : progressOf(e.mode, r.top, r.height, vh)
    if (e.last !== -1 && Math.abs(p - e.last) < 0.0005) continue
    e.last = p
    e.el.style.setProperty('--p', p.toFixed(4))
    if (e.onProgress) e.onProgress(p)
  }
  const doc = document.documentElement
  const max = Math.max(1, doc.scrollHeight - vh)
  live.page = clamp01(window.scrollY / max)
  doc.style.setProperty('--page-p', live.page.toFixed(4))
}

function ensureObserver() {
  if (io || typeof IntersectionObserver === 'undefined') return
  io = new IntersectionObserver(
    (list) => {
      for (const it of list) {
        for (const e of entries) if (e.el === it.target) e.visible = it.isIntersecting
      }
      schedule()
    },
    { rootMargin: '100% 0px' },
  )
  for (const e of entries) io.observe(e.el)
}

export function startScrollController() {
  ensureObserver()
  window.addEventListener('scroll', schedule, { passive: true })
  window.addEventListener('resize', schedule)
  schedule()
  return () => {
    window.removeEventListener('scroll', schedule)
    window.removeEventListener('resize', schedule)
    io?.disconnect()
    io = null
  }
}

// `keepWhenReduced`: the hero keeps its real progress under reduced motion.
export function trackProgress(el, { mode = 'flow', onProgress, keepWhenReduced = false } = {}) {
  const e = { el, mode, onProgress, keepWhenReduced, visible: true, last: -1 }
  entries.add(e)
  io?.observe(el)
  schedule()
  return () => {
    entries.delete(e)
    io?.unobserve(el)
  }
}

// Reduced motion changed: recompute every tracked element once.
store.subscribe(
  (s) => s.reducedMotion,
  () => {
    for (const e of entries) e.last = -1
    schedule()
  },
)
