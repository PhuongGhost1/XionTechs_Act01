import { useLayoutEffect } from 'react'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { countValue } from './countUp'

// Counts the text of `ref` from 0 to `target` once `run` turns true (M3). It writes the DOM
// directly, one frame at a time, so a counting tile never re-renders React. Reduced motion shows the
// final value at once; before `run` the element reads 0.
export function useCountUp(ref, target, { run, duration = 1400 }) {
  const reduced = useReducedMotion()
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    if (reduced) {
      el.textContent = String(target)
      return
    }
    if (!run) {
      el.textContent = '0'
      return
    }
    let frame = 0
    const start = performance.now()
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration)
      el.textContent = String(countValue(target, t))
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [ref, target, run, duration, reduced])
}
