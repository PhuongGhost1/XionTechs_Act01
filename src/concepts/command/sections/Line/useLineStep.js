import { useEffect, useState } from 'react'
import { getState } from '../../runtime/scroll.js'
import { stepAtPacket } from './lineModel.js'

// The current step of THE LINE, as React state that changes only when the step does (six values),
// never per frame. The packet and the fill do not use it: they read --p in CSS.
//
// Where the number comes from: runtime/scroll.js writes the plateau-shaped progress of the 'line'
// track into its plain state object once per frame. Reading it from a scroll listener would race
// that controller (listeners of child components are registered before the app's), so while the
// track is within one viewport of the screen a small rAF loop reads the number, and the loop is
// stopped when the track is further away or the tab is hidden (the browser pauses rAF itself).

const readStep = () => stepAtPacket(getState().progress.line ?? 0)

/** @param {{ current: Element | null }} ref the track element, @param {boolean} enabled */
export function useLineStep(ref, enabled = true) {
  const [step, setStep] = useState(readStep)

  useEffect(() => {
    const el = ref.current
    if (!enabled || !el) return undefined

    let frame = 0
    let last = -1
    const loop = () => {
      const next = readStep()
      if (next !== last) {
        last = next
        setStep(next)
      }
      frame = requestAnimationFrame(loop)
    }
    const start = () => {
      if (!frame) frame = requestAnimationFrame(loop)
    }
    const stop = () => {
      if (frame) cancelAnimationFrame(frame)
      frame = 0
    }

    if (typeof IntersectionObserver === 'undefined') {
      start()
      return stop
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) start()
        else {
          // One last read, so the step is right for the position the track was left at.
          const next = readStep()
          if (next !== last) {
            last = next
            setStep(next)
          }
          stop()
        }
      },
      { rootMargin: '100% 0px 100% 0px' },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      stop()
    }
  }, [ref, enabled])

  return step
}
