// Fired once the lazily loaded lower half of the page has mounted, so code that looks sections
// up by id (the nav's active-section indicator) can find them.
export const SECTIONS_READY = 'xt:sections-ready'

// The URL fragment's target is handled once, after the first screen renders and before the lower
// half has loaded: a target that exists is scrolled to now; one that does not exist yet is noted,
// and the lower half scrolls there once it mounts. Neither happens when the browser restores the
// scroll position (reload, back/forward) or after the visitor starts scrolling or typing.
function readFragment() {
  const raw = window.location.hash.slice(1)
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw // a malformed escape such as "#100%": use it as written
  }
}

let pendingId = null
let noted = false

export function notePendingHashTarget() {
  if (noted || typeof window === 'undefined') return
  noted = true
  const id = readFragment()
  const nav = performance.getEntriesByType?.('navigation')[0]?.type
  if (!id || nav === 'reload' || nav === 'back_forward') return
  // The page renders after the browser's own fragment scroll, so a target in the first screen's
  // sections is reached here, and one in the lower half once it mounts.
  const now = document.getElementById(id)
  if (now) {
    now.scrollIntoView({ block: 'start', behavior: 'instant' })
    return
  }
  pendingId = id
  const cancel = () => {
    pendingId = null
    for (const type of ['wheel', 'touchstart', 'keydown', 'pointerdown']) window.removeEventListener(type, cancel)
  }
  for (const type of ['wheel', 'touchstart', 'keydown', 'pointerdown']) window.addEventListener(type, cancel, { passive: true })
}

export function takePendingHashTarget() {
  const id = pendingId
  pendingId = null
  return id ? document.getElementById(id) : null
}
