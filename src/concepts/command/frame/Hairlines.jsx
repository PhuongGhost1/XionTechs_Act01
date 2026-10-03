import { useEffect, useState } from 'react'
import { HERO_P, heroHairlines } from '../core/geometry.js'
import './frame.css'

// The page's constant (doc 4.2, 5.4, 6.1): the two +/- 32 degree hairlines of the hero, kept
// fixed behind every later station at 6 percent. The hero draws its own pair (boot, M01) and
// owns station 00; frame.css fades this pair in once the reader is past the hero
// (data-station of 1 or more). The geometry is the hero's: the lines cross at P = (72 vw, 30 vh)
// on desktop and (72 vw, 22 vh) on phones, edge to edge, so the pair is already where the
// reader's eye left the hero. Pure decoration: aria-hidden, data-decor (RAW hides it), no events.
//
// The viewport size is the only input. It is read on mount and on resize (not on scroll), and the
// SVG is drawn in viewport pixels so the angle is exact at every aspect ratio.

const PHONE_MAX = 767.98

function viewportSize() {
  if (typeof window === 'undefined') return { w: 1440, h: 900 }
  return { w: window.innerWidth, h: window.innerHeight }
}

export default function Hairlines() {
  const [size, setSize] = useState(viewportSize)

  useEffect(() => {
    let raf = 0
    const onResize = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const next = viewportSize()
        setSize((prev) => (prev.w === next.w && prev.h === next.h ? prev : next))
      })
    }
    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', onResize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('orientationchange', onResize)
    }
  }, [])

  const p = size.w <= PHONE_MAX ? HERO_P.phone : HERO_P.desktop
  const lines = heroHairlines(size.w, size.h, p)

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      data-decor=""
      data-hairlines=""
      className="hairlines pointer-events-none fixed inset-0 h-full w-full stroke-grid"
      viewBox={`0 0 ${size.w} ${size.h}`}
      preserveAspectRatio="none"
    >
      {lines.map(([x1, y1, x2, y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth="1" vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  )
}
