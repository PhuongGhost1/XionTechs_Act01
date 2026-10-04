import { useCallback, useSyncExternalStore } from 'react'

// A media query as a live boolean (the same helper as sections/Deploy/useMediaQuery.js: a section
// owns its own files). The AGENT RUN tape reads it to choose between the stacked, three-dimensional
// strip and the plain flow, so the strip's depth is inline style (no CSS for a mode that only
// exists in one layout). Changes only when the query flips, never per frame.
export function useMediaQuery(query) {
  const subscribe = useCallback(
    (callback) => {
      if (typeof matchMedia !== 'function') return () => {}
      const mq = matchMedia(query)
      mq.addEventListener('change', callback)
      return () => mq.removeEventListener('change', callback)
    },
    [query],
  )
  const snapshot = useCallback(() => (typeof matchMedia === 'function' ? matchMedia(query).matches : false), [query])
  return useSyncExternalStore(subscribe, snapshot, () => false)
}
