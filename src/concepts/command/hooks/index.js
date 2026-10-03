import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { store } from '../state/store.js'
import { trackProgress } from '../state/scroll.js'

// Subscribe to one primitive value of the store. `selector` must return a primitive.
export function useStore(selector) {
  return useSyncExternalStore(
    (cb) => store.subscribe(selector, cb),
    () => selector(store.get()),
    () => selector(store.get()),
  )
}

export const useReducedMotion = () => useStore((s) => s.reducedMotion)

// True once the element has been at least `amount` visible. Reduced motion reports true at once.
export function useInView(ref, { amount = 0.25, once = true } = {}) {
  const reduced = useReducedMotion()
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return undefined
    const io = new IntersectionObserver(
      ([it]) => {
        if (it.isIntersecting) {
          setSeen(true)
          if (once) io.disconnect()
        } else if (!once) setSeen(false)
      },
      { threshold: amount },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [ref, amount, once])
  return reduced || seen
}

// Writes --p (0..1) on the element while it scrolls. See state/scroll.js for the modes.
export function useScrollProgress(ref, options) {
  const opts = useRef(options)
  useEffect(() => {
    opts.current = options
  })
  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    return trackProgress(el, {
      mode: opts.current?.mode,
      keepWhenReduced: opts.current?.keepWhenReduced,
      onProgress: (p) => opts.current?.onProgress?.(p),
    })
  }, [ref])
}

// True when the viewport is at least `px` wide.
export function useMinWidth(px) {
  const q = `(min-width: ${px}px)`
  const [match, setMatch] = useState(() => (typeof window === 'undefined' ? false : window.matchMedia(q).matches))
  useEffect(() => {
    const mq = window.matchMedia(q)
    const on = () => setMatch(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [q])
  return match
}
