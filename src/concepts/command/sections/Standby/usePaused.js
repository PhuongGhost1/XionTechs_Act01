import { useEffect, useRef, useState } from 'react'

// Ambient loops must stop off screen and while the tab is hidden (doc 7.1). This returns
// [ref, paused]: put the ref on the element that loops, and spread `data-paused` from `paused`
// onto it (motion.css pauses everything under [data-paused]). It changes state only when the
// element enters or leaves the viewport, or the tab is shown or hidden.
//
// `paused` starts false, so nothing is held back at first paint (the boot must not wait for an
// observer); the first observer report may then pause it.
export function usePaused() {
  const ref = useRef(null)
  const [offscreen, setOffscreen] = useState(false)
  const [hidden, setHidden] = useState(() => typeof document !== 'undefined' && document.hidden)

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return undefined
    const io = new IntersectionObserver(([entry]) => setOffscreen(!entry.isIntersecting))
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    const onChange = () => setHidden(document.hidden)
    document.addEventListener('visibilitychange', onChange)
    return () => document.removeEventListener('visibilitychange', onChange)
  }, [])

  return [ref, offscreen || hidden]
}
