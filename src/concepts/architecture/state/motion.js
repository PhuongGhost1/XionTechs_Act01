import { useSyncExternalStore } from 'react'

// The one global motion switch: the Pause Motion button (WCAG 2.2.2). It mirrors itself to
// `data-motion` on <html> so CSS loops stop, and render loops (the hero scene) subscribe to it.
let paused = false
const listeners = new Set()

function apply() {
  if (typeof document !== 'undefined') document.documentElement.dataset.motion = paused ? 'paused' : 'run'
}

export const motion = {
  get paused() {
    return paused
  },
  setPaused(next) {
    if (next === paused) return
    paused = next
    apply()
    listeners.forEach((fn) => fn(paused))
  },
  toggle() {
    motion.setPaused(!paused)
  },
  subscribe(fn) {
    listeners.add(fn)
    return () => listeners.delete(fn)
  },
}

export function usePaused() {
  return useSyncExternalStore(motion.subscribe, () => paused, () => false)
}

apply()
