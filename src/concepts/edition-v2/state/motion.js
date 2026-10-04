// Pause Motion store. `paused` is mirrored to `data-motion` on <html> so CSS can end transitions.
let paused = false
const listeners = new Set()

export const isPaused = () => paused

export function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function togglePaused() {
  paused = !paused
  document.documentElement.dataset.motion = paused ? 'paused' : 'running'
  listeners.forEach((fn) => fn())
}
