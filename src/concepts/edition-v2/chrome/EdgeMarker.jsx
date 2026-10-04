import { useEffect, useState } from 'react'
import { SECTIONS, edition } from '../content.js'

// Vertical edition marker on the page edge (very wide screens only). Decorative: the same information
// is in each section's running head. It takes the band of the section under it so its text stays AA.
export default function EdgeMarker() {
  const [current, setCurrent] = useState(SECTIONS[0])

  useEffect(() => {
    let frame = 0
    const read = () => {
      frame = 0
      const mid = window.innerHeight / 2
      let found = SECTIONS[0]
      for (const s of SECTIONS) {
        const el = document.getElementById(s.id)
        if (el && el.getBoundingClientRect().top <= mid) found = s
      }
      setCurrent((c) => (c.id === found.id ? c : found))
    }
    const on = () => {
      if (!frame) frame = requestAnimationFrame(read)
    }
    read()
    window.addEventListener('scroll', on, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', on)
    }
  }, [])

  return (
    <div
      aria-hidden="true"
      data-band={current.band}
      className="pf-mono fixed right-0 top-1/2 z-40 hidden -translate-y-1/2 !bg-transparent px-2 text-pf-mute [writing-mode:vertical-rl] min-[1560px]:block"
    >
      {edition.label} · {edition.year} <span className="mx-2 inline-block h-8 w-px bg-pf-mark align-middle" /> {current.no} {current.head}
    </div>
  )
}
