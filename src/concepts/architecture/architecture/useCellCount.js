import { useSyncExternalStore } from 'react'
import { cellCount } from './levels.js'

// The number of structural cells a bay draws at the current viewport width. The snapshot is a small integer, so
// the section re-renders only when a breakpoint is crossed, never on every resize event.
const subscribe = (cb) => {
  window.addEventListener('resize', cb)
  return () => window.removeEventListener('resize', cb)
}

export default function useCellCount() {
  return useSyncExternalStore(
    subscribe,
    () => cellCount(window.innerWidth),
    () => 6,
  )
}
