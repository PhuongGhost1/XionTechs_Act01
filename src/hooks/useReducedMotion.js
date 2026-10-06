import { useEffect, useState } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

// Tracks the OS reduced-motion setting, including changes while the page is open.
export function useReducedMotion() {
  const [reduced, setReduced] = useState(() => typeof window !== 'undefined' && (window.matchMedia?.(QUERY).matches ?? false))
  useEffect(() => {
    const mq = window.matchMedia?.(QUERY)
    if (!mq) return
    const onChange = (e) => setReduced(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return reduced
}
