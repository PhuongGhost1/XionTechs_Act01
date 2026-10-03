import { useEffect, useState } from 'react'

// The viewport size the hero is drawn for: the width without the scrollbar, and the inner height.
// It changes React state only on a real resize (never per frame). Mobile browsers fire resize
// every time the toolbar slides in or out; those height changes are ignored (under 120 px) so the
// hairlines do not creep while the visitor scrolls. A width change always counts.

const read = () =>
  typeof window === 'undefined'
    ? { w: 1280, h: 800 }
    : { w: document.documentElement.clientWidth || window.innerWidth, h: window.innerHeight }

export function useViewport() {
  const [vp, setVp] = useState(read)

  useEffect(() => {
    let raf = 0
    const sync = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const next = read()
        setVp((prev) => (next.w !== prev.w || Math.abs(next.h - prev.h) > 120 ? next : prev))
      })
    }
    window.addEventListener('resize', sync)
    window.addEventListener('orientationchange', sync)
    sync()
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', sync)
      window.removeEventListener('orientationchange', sync)
    }
  }, [])

  return vp
}
