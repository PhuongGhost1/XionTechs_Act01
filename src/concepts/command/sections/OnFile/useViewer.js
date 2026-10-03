import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'

// Small browser hooks of the ON FILE viewer. Each one is safe without a window (tests, SSR) and
// changes React state only on a real change (a resize, a media query flip), never per frame.

/** A CSS media query as a boolean. False on the server. */
export function useMedia(query) {
  const subscribe = useCallback(
    (callback) => {
      if (typeof matchMedia !== 'function') return () => {}
      const mq = matchMedia(query)
      mq.addEventListener('change', callback)
      return () => mq.removeEventListener('change', callback)
    },
    [query],
  )
  return useSyncExternalStore(
    subscribe,
    () => typeof matchMedia === 'function' && matchMedia(query).matches,
    () => false,
  )
}

/**
 * The viewer zooms to a tapped region where fingers are the pointer or the window is narrow
 * (the capture is then too small to read), and only highlights where a mouse and room allow it.
 */
export const ZOOM_QUERY = '(max-width: 767px), (hover: none) and (pointer: coarse)'

/** The width in CSS px of the element a ref points at; updates on resize only. */
export function useElementWidth(ref) {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const measure = () => setWidth(Math.round(el.getBoundingClientRect().width))
    measure()
    if (typeof ResizeObserver === 'undefined') return undefined
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return width
}

/** True when the URL has ?debug=hotspots: the overlay that draws every box with its id. */
export function readDebugHotspots() {
  try {
    return typeof location !== 'undefined' && new URLSearchParams(location.search).get('debug') === 'hotspots'
  } catch {
    return false
  }
}

/** `:focus-visible` of an element, without throwing in a browser that lacks the selector. */
export function isFocusVisible(el) {
  try {
    return el.matches(':focus-visible')
  } catch {
    return true
  }
}
