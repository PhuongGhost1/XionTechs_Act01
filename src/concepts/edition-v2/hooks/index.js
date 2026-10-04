import { useEffect, useState, useSyncExternalStore } from 'react'
import { isPaused, subscribe } from '../state/motion.js'
import { CLEAN, DRAFT, PASS_THRESHOLD, nextPass, progress } from '../pass/states.js'

export function useMedia(query) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const on = () => setMatches(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [query])
  return matches
}

export const useReducedMotion = () => useMedia('(prefers-reduced-motion: reduce)')

// True under reduced motion or after Pause Motion: show final states, no sticky choreography.
export function useMotionOff() {
  const reduced = useReducedMotion()
  const paused = useSyncExternalStore(subscribe, isPaused)
  return reduced || paused
}

// True once the element has entered the viewport; never goes back.
export function useInView(ref, { threshold = 0.2, rootMargin = '0px' } = {}) {
  const off = useMotionOff()
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    if (seen || off) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setSeen(true)
      },
      { threshold, rootMargin },
    )
    io.observe(ref.current)
    return () => io.disconnect()
  }, [ref, threshold, rootMargin, seen, off])
  return seen || off
}

// The copy-edit pass for one heading: 'draft' until enough of it is in view, then 'clean' for good.
export function usePass(ref) {
  const off = useMotionOff()
  const [state, setState] = useState(off ? CLEAN : DRAFT)
  useEffect(() => {
    if (off) {
      setState(CLEAN)
      return
    }
    const io = new IntersectionObserver(
      ([entry]) => setState((s) => nextPass(s, { ratio: entry.intersectionRatio })),
      { threshold: [0, PASS_THRESHOLD, 1] },
    )
    io.observe(ref.current)
    return () => io.disconnect()
  }, [ref, off])
  return state
}

// Writes scroll progress (0..1) to `--p` on the element, outside React. `mode` as in pass/states.js.
export function useScrollProgress(ref, { mode = 'exit', offset = 0, enabled = true } = {}) {
  useEffect(() => {
    const el = ref.current
    if (!enabled) {
      el.style.setProperty('--p', '1')
      return
    }
    let frame = 0
    const write = () => {
      frame = 0
      el.style.setProperty('--p', progress(el.getBoundingClientRect(), window.innerHeight, mode, offset).toFixed(4))
    }
    const on = () => {
      if (!frame) frame = requestAnimationFrame(write)
    }
    write()
    window.addEventListener('scroll', on, { passive: true })
    window.addEventListener('resize', on)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', on)
      window.removeEventListener('resize', on)
    }
  }, [ref, mode, offset, enabled])
}
