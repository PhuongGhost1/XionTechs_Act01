import { useEffect, useRef } from 'react'
import { createFlightScene } from './flightScene'

// The lazy chunk: mounts the flight plan's own three.js canvas (never the page's full-screen one) and
// hands the scene's controls back through `apiRef`. React only mounts and unmounts it; the live demo
// snapshot is read from `liveRef` inside the scene's frame loop, never through React state.
//
// The canvas is created inside the effect: forceContextLoss on cleanup makes a canvas unusable, and React
// StrictMode mounts, unmounts and mounts again.
export default function FlightCanvas({ tier, liveRef, getLabels, apiRef, onReady, onLost }) {
  const ref = useRef(null)
  useEffect(() => {
    const container = ref.current
    if (!container) return undefined
    let engine
    try {
      engine = createFlightScene({
        container,
        tier,
        getLive: () => liveRef.current,
        getLabels,
        onFirstFrame: onReady,
        onContextLost: onLost,
      })
    } catch {
      onLost() // no WebGL after all: the drawing stays
      return undefined
    }
    apiRef.current = engine
    return () => {
      apiRef.current = null
      engine.dispose()
    }
  }, [tier, liveRef, getLabels, apiRef, onReady, onLost])

  return <div ref={ref} className="fp-canvas absolute inset-0" />
}
