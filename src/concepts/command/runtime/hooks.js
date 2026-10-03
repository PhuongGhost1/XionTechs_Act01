import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { ATTR, readAttr } from '../contract/attributes.js'
import {
  buildMailto,
  buildText,
  clear,
  getSnapshot,
  has,
  items,
  subscribe,
  toggleRecord,
  toggleService,
} from '../contract/brief.js'
import { STATIONS } from '../contract/stations.js'
import { getStation, registerTrack, subscribeStation } from './scroll.js'

// React hooks over the stores and observers of the page. None of them re-render per frame:
// scroll progress goes out as CSS variables, and these hooks only change when a station,
// the brief, the motion setting or a one-shot "in view" flag changes.

/**
 * Observes an element and reports whether it is in view. Returns [ref, inView]. Without
 * IntersectionObserver (old browsers, tests) it reports true so nothing stays hidden.
 * @param {{ once?: boolean, rootMargin?: string, threshold?: number }} [options]
 *   once: stop observing after the first time it is in view (the default for reveals)
 */
export function useInView({ once = false, rootMargin = '0px', threshold = 0 } = {}) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return undefined
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
  }, [once, rootMargin, threshold])

  return [ref, inView]
}

// -- reduced motion ---------------------------------------------------------------------------

const motionQuery = () => (typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null)

/** data-motion wins (a visitor who turned motion on deliberately beats the OS setting); else the OS. */
function motionIsOff() {
  const attr = readAttr(ATTR.motion)
  if (attr === 'off') return true
  if (attr === 'on') return false
  return Boolean(motionQuery()?.matches)
}

function subscribeMotion(callback) {
  if (typeof document === 'undefined') return () => {}
  const observer = new MutationObserver(callback)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: [ATTR.motion] })
  const mq = motionQuery()
  mq?.addEventListener('change', callback)
  return () => {
    observer.disconnect()
    mq?.removeEventListener('change', callback)
  }
}

/** True when motion should be off: the MOTION toggle is off, or the OS asks for reduced motion. */
export const useReducedMotion = () => useSyncExternalStore(subscribeMotion, motionIsOff, () => false)

/**
 * The live value of an attribute on <html> (data-view, data-tier, ...), as a string or null.
 * Changes only when the attribute does, so a toggle can render its pressed state from it.
 */
export function useHtmlAttribute(name) {
  const subscribeAttr = useMemo(
    () => (callback) => {
      if (typeof document === 'undefined') return () => {}
      const observer = new MutationObserver(callback)
      observer.observe(document.documentElement, { attributes: true, attributeFilter: [name] })
      return () => observer.disconnect()
    },
    [name],
  )
  return useSyncExternalStore(subscribeAttr, () => readAttr(name), () => null)
}

// -- stations ---------------------------------------------------------------------------------

/** The station the reader is in: { index, id, label }. Changes only when the station changes. */
export function useActiveStation() {
  const index = useSyncExternalStore(subscribeStation, getStation, () => 0)
  return STATIONS[index]
}

/**
 * Registers a section's track wrapper with the scroll controller and returns the ref to put on
 * it: `const ref = useTrack('line', { plateaus: [[0.3, 0.4]] }); <section id="line" ref={ref}>`.
 */
export function useTrack(id, { plateaus, mode } = {}) {
  const ref = useRef(null)
  const key = JSON.stringify(plateaus ?? [])
  useEffect(() => {
    if (!ref.current) return undefined
    return registerTrack(id, ref.current, { plateaus: JSON.parse(key), mode })
  }, [id, key, mode])
  return ref
}

// -- brief ------------------------------------------------------------------------------------

/**
 * The visitor's brief. Re-renders when the selection changes.
 * { count, items, has(id), toggleService(id), toggleRecord(id), clear(), mailto(note), text(note) }
 */
export function useBrief() {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  return useMemo(() => {
    const selected = items()
    return {
      count: snap.services.length + snap.records.length,
      items: selected,
      has,
      toggleService,
      toggleRecord,
      clear,
      mailto: (note) => buildMailto({ note, items: selected }),
      text: (note) => buildText({ note, items: selected }),
    }
  }, [snap])
}
