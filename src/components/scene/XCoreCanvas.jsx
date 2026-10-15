import { useEffect, useRef } from 'react'
import { brand } from '../content'
import { sampleLogoPoints } from './logoPoints'
import { createXCore } from './render'
import { setPointer } from './store'

// The WebGL X data core (docs/concepts/01-command-implementation.md §5): one fixed, full-viewport,
// click-through canvas behind the page. React only mounts and unmounts it; everything per frame
// lives in render.js and reads the scene store, never React state.
//
// The canvas element is created inside the effect, not in JSX: forceContextLoss on cleanup makes a
// canvas unusable, and React StrictMode mounts, unmounts and mounts again.
export default function XCoreCanvas({ quality }) {
  const containerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container || (quality !== 'high' && quality !== 'low')) return undefined
    const root = document.documentElement
    let cancelled = false

    let core
    try {
      core = createXCore({
        container,
        quality,
        // The static fallbacks fade out only once the first WebGL frame is on screen.
        onFirstFrame: () => {
          if (cancelled) return
          root.dataset.xcore = 'on'
          container.style.opacity = '1'
        },
        // A lost context freezes the last frame: bring the static fallbacks back instead.
        onContextLost: () => {
          delete root.dataset.xcore
          delete root.dataset.xcoreLogo
          container.style.opacity = '0'
        },
      })
    } catch {
      return undefined // no WebGL after all: the page keeps its static visuals
    }

    // Converge into the real logo at the end. An empty result (image or canvas failure) makes the
    // scene use the generic X instead; <html data-xcore-logo="on"> says which of the two it is, so
    // the static logo can stay visible when the scene can not draw it.
    sampleLogoPoints(brand.logo.src, { maxPoints: core.logoBudget }).then((points) => {
      if (cancelled) return
      core.setLogo(points, brand.logo.width / brand.logo.height)
      // On low quality the dots are too sparse to read as a logo, so the real logo stays visible beneath them.
      if (points.length > 0 && quality === 'high') root.dataset.xcoreLogo = 'on'
    })

    // Pointer lean: mouse and pen only, high quality only.
    const finePointer = window.matchMedia?.('(pointer: fine)')
    const onPointerMove = (event) => {
      if (event.pointerType === 'touch' || !finePointer?.matches) return
      setPointer((event.clientX / window.innerWidth) * 2 - 1, (event.clientY / window.innerHeight) * 2 - 1)
      core.wake()
    }
    if (quality === 'high') window.addEventListener('pointermove', onPointerMove, { passive: true })

    return () => {
      cancelled = true
      window.removeEventListener('pointermove', onPointerMove)
      setPointer(0, 0)
      core.dispose()
      delete root.dataset.xcore
      delete root.dataset.xcoreLogo
      container.style.opacity = '0'
    }
  }, [quality])

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 opacity-0 transition-opacity duration-section ease-cmd"
    />
  )
}
