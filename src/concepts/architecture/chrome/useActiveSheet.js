import { useEffect, useState } from 'react'
import { sheets } from '../content.js'

export const SECTIONS_READY = 'bp:sections-ready'

/**
 * The id of the sheet that crosses the middle of the viewport. The lower sheets load as one lazy chunk,
 * so the observer is rebuilt when that chunk announces itself (`bp:sections-ready`).
 */
export function useActiveSheet() {
  const [active, setActive] = useState(sheets[0].id)
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return undefined
    let io
    const observe = () => {
      if (io) io.disconnect()
      io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) if (e.isIntersecting) setActive(e.target.id)
        },
        { rootMargin: '-45% 0px -50% 0px' },
      )
      for (const s of sheets) {
        const el = document.getElementById(s.id)
        if (el) io.observe(el)
      }
    }
    observe()
    window.addEventListener(SECTIONS_READY, observe)
    return () => {
      window.removeEventListener(SECTIONS_READY, observe)
      if (io) io.disconnect()
    }
  }, [])
  return active
}
