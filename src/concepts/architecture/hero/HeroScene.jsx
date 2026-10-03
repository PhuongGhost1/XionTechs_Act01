import { useEffect, useRef } from 'react'
import { readEnv } from './quality.js'

// Mounts the canvas and, once the page is idle, loads the three.js scene as its own chunk. The scene reports
// ready when it has finished plotting and passed the FPS probe; only then does the canvas fade in over the SVG
// (data-gl="on" on the figure) and the SVG stop updating. If the scene fails, is too slow or loses its context,
// the SVG simply stays or comes back: nothing is lost.

const idle = (fn) => {
  if ('requestIdleCallback' in window) {
    const id = window.requestIdleCallback(fn, { timeout: 1200 })
    return () => window.cancelIdleCallback(id)
  }
  const id = window.setTimeout(fn, 400)
  return () => window.clearTimeout(id)
}

export default function HeroScene({ driver, figRef }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const fig = figRef.current
    let dead = false
    let scene = null
    const show = (on) => {
      fig.dataset.gl = on ? 'on' : 'off'
      driver.setGl(on)
    }
    const drop = () => {
      // Too slow or no context: release the GL resources and leave the SVG as the permanent renderer.
      show(false)
      if (scene) scene.dispose()
      scene = null
      canvas.style.display = 'none'
    }

    const cancel = idle(() => {
      import('./scene/render.js')
        .then(({ createScene }) => {
          if (dead) return
          scene = createScene({
            canvas,
            driver,
            probe: readEnv().force !== 'webgl',
            onReady: () => show(true),
            onLost: () => show(false),
            onRestored: () => show(true),
            onFail: drop,
          })
        })
        .catch(() => {
          /* the chunk failed to load: the SVG drawing is already on screen */
        })
    })

    return () => {
      dead = true
      cancel()
      if (scene) scene.dispose()
      scene = null
      fig.dataset.gl = 'off'
      driver.setGl(false)
    }
  }, [driver, figRef])

  return <canvas ref={canvasRef} className="hero-canvas" aria-hidden="true" />
}
