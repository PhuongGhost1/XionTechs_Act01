import { useCallback, useSyncExternalStore } from 'react'

// A media query as a live boolean. DEPLOY uses it to render the service checkboxes in ONE place:
// in the sticky column on wide screens, inside each module row on narrow ones. Changing only
// when the query flips, never per frame. False where matchMedia does not exist.
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
