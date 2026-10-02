import { useEffect } from 'react'

const FINE = '(hover: hover) and (pointer: fine)'

// Calls `onPointer(x, y)` with the pointer position over the element, normalised to -1..1 from
// its centre, throttled to animation frames; calls `onPointer(0, 0)` when the pointer leaves.
// Only runs for fine pointers (mouse, trackpad) and when `enabled`; pass `enabled: !reduced`.
// The callback should write to the DOM directly (CSS variables) rather than set React state.
export function usePointer(ref, onPointer, { enabled = true } = {}) {
  useEffect(() => {
    const el = ref.current
    if (!el || !enabled || !window.matchMedia?.(FINE).matches) return
    let frame = 0
    let x = 0
    let y = 0
    const flush = () => {
      frame = 0
      onPointer(x, y)
    }
    const onMove = (e) => {
      const r = el.getBoundingClientRect()
      x = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1))
      y = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1))
      if (!frame) frame = requestAnimationFrame(flush)
    }
    const onLeave = () => {
      x = 0
      y = 0
      if (!frame) frame = requestAnimationFrame(flush)
    }
    el.addEventListener('pointermove', onMove, { passive: true })
    el.addEventListener('pointerleave', onLeave, { passive: true })
    return () => {
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [ref, onPointer, enabled])
}
