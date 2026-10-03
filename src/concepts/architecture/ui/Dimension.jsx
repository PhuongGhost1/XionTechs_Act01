import { useEffect, useRef, useState } from 'react'

// The signature effect: a yellow measurement line that extends when its sheet enters the viewport
// (BRIEF §14). It reads `data-in` from an ancestor (`Sheet`, `Plot`). The label is either symbolic or
// `measure`, the pixel length of the line as rendered, so a number on the page is always a real measurement.
// Decorative: hidden from assistive tech, the information it shows is in the text next to it.
export default function Dimension({ axis = 'x', label, measure = false, delay = 0, className = '' }) {
  const ref = useRef(null)
  const [px, setPx] = useState(null)

  useEffect(() => {
    if (!measure || !ref.current) return undefined
    const el = ref.current
    const read = () => setPx(Math.round(axis === 'x' ? el.offsetWidth : el.offsetHeight))
    read()
    if (typeof ResizeObserver === 'undefined') return undefined
    const ro = new ResizeObserver(read)
    ro.observe(el)
    return () => ro.disconnect()
  }, [measure, axis])

  const text = label ?? (px == null ? '' : `${px} px`)
  return (
    <span ref={ref} aria-hidden="true" className={`bp-dim bp-dim--${axis} ${className}`} style={{ '--d': `${delay}ms` }}>
      <span className="bp-dim__line" />
      <span className="bp-dim__tick bp-dim__tick--a" />
      <span className="bp-dim__tick bp-dim__tick--b" />
      {text ? <span className="bp-dim__label bp-mono">{text}</span> : null}
    </span>
  )
}
