import { useCallback, useEffect, useRef, useState } from 'react'
import { useReducedMotion, useTrack } from '../../runtime/hooks.js'
import { scrollToProgress } from '../../runtime/scroll.js'
import { LineList } from './LineList.jsx'
import { LineStage } from './LineStage.jsx'
import { BUILD_STEP, PLATEAUS, stepTarget } from './lineModel.js'
import { useLineStep } from './useLineStep.js'
import { useListMode } from './useListMode.js'
import './line.css'

// Station 03 THE LINE, "from request to production" (doc 4.5). A pinned track of 220 svh (200 on
// phones) holding one sticky stage: scroll advances six steps, a yellow packet runs along the
// line linearly, the giant word rolls once per step, stops are buttons that scroll the document
// to their step. Without the pin (reduced motion, RAW, landscape phones) it is a plain list.
//
// Scroll to state: runtime/scroll.js turns scrollY into progress, shaped by PLATEAUS (the dwell
// of each step), and writes it as --p on this section. The packet and the fill are CSS reading
// --p. The step is a number derived from the same shaped value (lineModel.js) and is the only
// thing kept in React state, so React renders six times per pass through the track, not per frame.

export default function Line() {
  const ref = useTrack('line', { plateaus: PLATEAUS })
  const list = useListMode()
  const motionOff = useReducedMotion()
  const step = useLineStep(ref, !list)

  // Failure-beat controls. runId names a run of the beat; the first entry to BUILD plays run 1.
  // `played` is the last run the stage has shown, so re-entering BUILD later shows the final
  // frame instead of replaying; REPLAY bumps runId, which plays again.
  const [runId, setRunId] = useState(1)
  const [played, setPlayed] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (step === BUILD_STEP && played !== runId) setPlayed(runId)
  }, [step, runId, played])

  // Scroll the document to a step's progress, so scroll position, packet, word and focus agree.
  // A mouse press fires focus and click for the same stop: the second request is dropped. The
  // controller's own progress is not consulted here, because it lags the real scroll position by
  // a frame right after the browser has scrolled a focused stop into view.
  const lastGo = useRef({ step: -1, at: 0 })
  const goTo = useCallback(
    (i) => {
      const now = performance.now()
      if (lastGo.current.step === i && now - lastGo.current.at < 350) return
      lastGo.current = { step: i, at: now }
      scrollToProgress('line', stepTarget(i), motionOff ? 'auto' : 'smooth')
    },
    [motionOff],
  )

  const replay = useCallback(() => {
    setPaused(false)
    setRunId((r) => r + 1)
    // The beat lives on BUILD: bring the reader there if they are elsewhere on the line.
    if (step !== BUILD_STEP) goTo(BUILD_STEP)
  }, [goTo, step])

  return (
    <section
      id="line"
      ref={ref}
      data-track={list ? undefined : 'line'}
      aria-labelledby="line-title"
      className={list ? 'line-list relative' : 'track track--pin'}
    >
      {list ? (
        <LineList />
      ) : (
        <LineStage
          step={step}
          paused={paused}
          runId={runId}
          played={played}
          onStop={goTo}
          onPause={() => setPaused((p) => !p)}
          onReplay={replay}
        />
      )}
    </section>
  )
}
