// The hero's X data core. Fills its (positioned) parent. Chooses between the WebGL scene (own lazy
// chunk, scene/render.js) and the static SVG, and places the four arm labels on the arm tips.
//
// Level 0 loader: the `[ BOOTING X-CORE SYSTEM... ]` terminal line shows while the chunk loads and
// the first frame draws, then fades out. The canvas and labels are decoration; the wrapper carries
// the text alternative.
import { useCallback, useEffect, useRef, useState } from 'react'
import { hero, modules } from '../content.js'
import { useReducedMotion } from '../hooks/index.js'
import { ARM_LABEL_SIDE, armTipPositions } from '../scene/graph.js'
import { decideQuality, detectEnvironment } from '../scene/quality.js'
import { store } from '../state/store.js'
import XCoreFallback, { ArmLabel } from './XCoreFallback.jsx'

const BOOT_MIN_MS = 700 // keep the boot line readable even when the chunk is already cached

function GlLayer({ quality, onFail }) {
  const rootRef = useRef(null)
  const canvasRef = useRef(null)
  const labelRefs = useRef([])
  const [booted, setBooted] = useState(false)

  useEffect(() => {
    let cancelled = false
    let scene = null
    let bootTimer = 0
    let shown = false
    const tips = armTipPositions(0, 1)
    const started = performance.now()

    // Called once per rendered frame by the scene with the eased split: no React state involved.
    const place = (split, aspect, w, h) => {
      armTipPositions(split, aspect, tips)
      for (let i = 0; i < 4; i++) {
        const el = labelRefs.current[i]
        if (el) el.style.transform = `translate3d(${(tips[i].x * w).toFixed(1)}px, ${(tips[i].y * h).toFixed(1)}px, 0)`
      }
      if (!shown && rootRef.current) {
        shown = true
        rootRef.current.dataset.ready = 'true'
      }
    }

    import('../scene/render.js')
      .then(({ createScene }) => {
        if (cancelled || !canvasRef.current) return
        scene = createScene(canvasRef.current, {
          quality,
          onFail: () => !cancelled && onFail(),
          onFrame: place,
          onQuality: (q) => store.set({ quality: q }),
          onReady: () => {
            bootTimer = setTimeout(() => !cancelled && setBooted(true), Math.max(0, BOOT_MIN_MS - (performance.now() - started)))
          },
        })
      })
      .catch(() => !cancelled && onFail())

    return () => {
      cancelled = true
      clearTimeout(bootTimer)
      scene?.dispose()
    }
  }, [quality, onFail])

  return (
    <div ref={rootRef} className="group absolute inset-0">
      <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 size-full" />
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700 ease-x group-data-[ready=true]:opacity-100">
        {modules.map((m, i) => (
          <ArmLabel
            key={m.id}
            arm={m.arm}
            side={ARM_LABEL_SIDE[i]}
            className="left-0 top-0"
            rootRef={(el) => {
              labelRefs.current[i] = el
            }}
          />
        ))}
      </div>
      <p
        aria-hidden="true"
        className={`x-mono x-cursor pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-x-faint transition-opacity duration-500 ease-x ${booted ? 'opacity-0' : 'opacity-100'}`}
      >
        {hero.boot}
      </p>
    </div>
  )
}

export default function XCore({ className = '' }) {
  const reduced = useReducedMotion()
  const [decision] = useState(() => decideQuality(detectEnvironment()))
  const [failed, setFailed] = useState(false)
  const level = reduced || failed ? 'static' : decision
  const onFail = useCallback(() => setFailed(true), [])

  useEffect(() => {
    store.set({ quality: level })
  }, [level])

  return (
    <div role="img" aria-label={hero.fallbackLabel} className={`absolute inset-0 ${className}`}>
      {level === 'static' ? <XCoreFallback /> : <GlLayer quality={level} onFail={onFail} />}
    </div>
  )
}
