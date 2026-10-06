import { useEffect } from 'react'

// Calls `onProgress(p)` with how far the element has travelled through the viewport:
// 0 when its top reaches the bottom of the screen, 1 when its bottom leaves the top.
// One passive scroll/resize listener, throttled to animation frames. The callback should
// write to the DOM directly (a CSS variable, a class) rather than set React state each frame.
export function useScrollProgress(ref, onProgress, { enabled = true } = {}) {
  useEffect(() => {
    const el = ref.current
    if (!el || !enabled) return
    let frame = 0
    let last = -1
    const measure = () => {
      frame = 0
      const r = el.getBoundingClientRect()
      const vh = window.innerHeight || 1
      const p = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)))
      if (Math.abs(p - last) > 0.002) {
        last = p
        onProgress(p)
      }
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure)
    }
    measure()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule, { passive: true })
    return () => {
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [ref, onProgress, enabled])
}
