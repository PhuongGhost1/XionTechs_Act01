// Ambient loops stop off screen and while the tab is hidden (doc 7.1, 7.2). CSS animations that
// never end (the hero caret, the SVG-tier packets) cost compositor time even when nobody can see
// them, so this watcher marks them:
//
//   [data-offscreen]       on the element itself, while it is outside the viewport (plus a margin)
//   html[data-tab-hidden]  while document.hidden
//
// motion.css pauses everything marked either way. It does not touch data-paused, which belongs to
// whoever owns a PAUSE control (a section may pause its own loop on top of this).
// Mark any other loop with data-ambient. Nothing is removed or restarted: the loop just waits.

const SELECTOR = '.anim-packet, .anim-caret, [data-ambient]'
let stopFn = null

/** Starts watching. Idempotent. Returns stop(). */
export function startAmbient() {
  if (stopFn || typeof document === 'undefined') return stopAmbient
  const html = document.documentElement
  const seen = new WeakSet()

  const io =
    typeof IntersectionObserver === 'undefined'
      ? null
      : new IntersectionObserver(
          (entries) => {
            for (const e of entries) e.target.toggleAttribute('data-offscreen', !e.isIntersecting)
          },
          { rootMargin: '120px 0px' },
        )

  const watch = (el) => {
    if (!io || seen.has(el)) return
    seen.add(el)
    io.observe(el)
  }
  const scan = (root) => {
    if (root.matches?.(SELECTOR)) watch(root)
    root.querySelectorAll?.(SELECTOR).forEach(watch)
  }
  scan(document.body)

  // Sections mount lazily (BelowFold style chunks), so keep looking.
  const mo = new MutationObserver((records) => {
    for (const r of records) r.addedNodes.forEach((n) => n.nodeType === 1 && scan(n))
  })
  mo.observe(document.body, { childList: true, subtree: true })

  const onVisibility = () => html.toggleAttribute('data-tab-hidden', document.hidden)
  document.addEventListener('visibilitychange', onVisibility)
  onVisibility()

  stopFn = () => {
    io?.disconnect()
    mo.disconnect()
    document.removeEventListener('visibilitychange', onVisibility)
    html.removeAttribute('data-tab-hidden')
    stopFn = null
  }
  return stopAmbient
}

export function stopAmbient() {
  stopFn?.()
}
