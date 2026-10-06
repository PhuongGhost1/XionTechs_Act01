import { useEffect, useRef } from 'react'
import { createCampusScene } from './campusScene'

// The lazy chunk: mounts the campus's own three.js canvas and hands the scene's controls back through
// `apiRef`. React only mounts and unmounts it; the live state is read from `liveRef` inside the frame loop.
// The canvas is created inside the effect: forceContextLoss on cleanup makes a canvas unusable, and React
// StrictMode mounts, unmounts and mounts again.
export default function CampusCanvas({ tier, model, liveRef, getLabels, apiRef, onReady, onLost, onHover, onPick }) {
  const ref = useRef(null)
  const handlers = useRef({ onHover, onPick })
  handlers.current = { onHover, onPick }
  useEffect(() => {
    const container = ref.current
    if (!container) return undefined
    let engine
    try {
      engine = createCampusScene({
        container,
        tier,
        model,
        getLive: () => liveRef.current,
        getLabels,
        onFirstFrame: onReady,
        onContextLost: onLost,
        onHover: (hit) => handlers.current.onHover?.(hit),
        onPick: (hit) => handlers.current.onPick?.(hit),
      })
    } catch {
      onLost() // no WebGL after all: the site plan stays
      return undefined
    }
    apiRef.current = engine
    return () => {
      apiRef.current = null
      engine.dispose()
    }
  }, [tier, model, liveRef, getLabels, apiRef, onReady, onLost])

  return <div ref={ref} className="cp-canvas absolute inset-0" />
}
