import { useEffect, useState } from 'react'

// True while (or, with `once`, after) the element is in the viewport. Without
// IntersectionObserver it reports true so content is never left hidden.
export function useInView(ref, { once = false, rootMargin = '0px', threshold = 0 } = {}) {
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!('IntersectionObserver' in window)) {
      setInView(true)
      return
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting)
        if (entry.isIntersecting && once) io.disconnect()
      },
      { rootMargin, threshold },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [ref, once, rootMargin, threshold])
  return inView
}
