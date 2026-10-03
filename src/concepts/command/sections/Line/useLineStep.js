import { useEffect, useState } from 'react'
import { getState, subscribeFrame } from '../../runtime/scroll.js'
import { stepAtPacket } from './lineModel.js'

// The current step of THE LINE, as React state that changes only when the step does (six values),
// never per frame. The packet and the fill do not use it: they read --p in CSS.
//
// Where the number comes from: runtime/scroll.js computes the plateau-shaped progress of the
// 'line' track once per frame, and only while something moved (a scroll, a resize, a layout
// change, a track coming or going), then calls its frame listeners. subscribeFrame() is that
// hook: it runs AFTER the progress is written, so there is no race with the controller and no
// polling loop. Nothing runs while the page is still. (An earlier version polled every frame for
// as long as the track was within a screen of the viewport.)

const readStep = (state = getState()) => stepAtPacket(state.progress.line ?? 0)

/** @param {boolean} enabled false while the section shows its list (no stage, nothing to follow) */
export function useLineStep(enabled = true) {
  const [step, setStep] = useState(readStep)

  useEffect(() => {
    if (!enabled) return undefined
    // One read now: the stage may mount while the controller already has a progress for it
    // (back from the list, a landing on #line), and the next frame may be far away.
    setStep(readStep())
    return subscribeFrame((state) => setStep(readStep(state)))
  }, [enabled])

  return step
}
