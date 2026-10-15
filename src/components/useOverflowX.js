import { useEffect, useState } from 'react'

// True while the element's content is wider than the element, so a scroll box can be given
// keyboard access only when it really scrolls. Re-measured when the box is resized.
export function useOverflowX(ref) {
  const [overflowing, setOverflowing] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => setOverflowing(el.scrollWidth > el.clientWidth + 1)
    measure()
    if (!('ResizeObserver' in window)) return
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return overflowing
}
