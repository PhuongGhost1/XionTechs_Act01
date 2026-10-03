import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { trackScroll } from '../state/scroll.js'

/** True when the visitor asked the OS for less motion. Every effect must then show its final state. */
export function useMedia(query, serverValue = false) {
  const subscribe = (cb) => {
    if (typeof window === 'undefined' || !window.matchMedia) return () => {}
    const mq = window.matchMedia(query)
    mq.addEventListener('change', cb)
    return () => mq.removeEventListener('change', cb)
  }
  const get = () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : serverValue)
  return useSyncExternalStore(subscribe, get, () => serverValue)
}

export const useReducedMotion = () => useMedia('(prefers-reduced-motion: reduce)')

/** Becomes true when the element enters the viewport; stays true when `once` (the default). */
export function useInView(ref, { once = true, rootMargin = '0px 0px -10% 0px', threshold = 0 } = {}) {
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return undefined
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          if (once) io.disconnect()
        } else if (!once) {
          setInView(false)
        }
      },
      { rootMargin, threshold },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [ref, once, rootMargin, threshold])
  return inView
}

/**
 * Registers `ref` with the shared scroll controller. It writes the CSS variable (default `--p`) on the
 * element and calls `onProgress(p)` outside React. Keep the callback cheap: it runs once per frame.
 */
export function useScrollProgress(ref, { mode = 'stage', varName = '--p', onProgress, enabled = true } = {}) {
  const cb = useRef(onProgress)
  useEffect(() => {
    cb.current = onProgress
  })
  useEffect(() => {
    const el = ref.current
    if (!el || !enabled) return undefined
    return trackScroll(el, { mode, varName, onProgress: (p, node) => cb.current && cb.current(p, node) })
  }, [ref, mode, varName, enabled])
}
