import { useEffect, useRef } from 'react'
import { content } from '../content/index.js'
import { ATTR, readAttr, setTier as writeTier, setWebgl } from '../contract/attributes.js'
import { getFlow } from '../runtime/flow.js'
import { startGovernor } from '../runtime/governor.js'
import { syncScroll } from '../runtime/scroll.js'
import { getArm } from './armState.js'
import { buildGraph } from './graph.js'
import { isFar, placeCore } from './placement.js'
import { TIER_SPEC } from './three/buffers.js'
import { createCore } from './three/createCore.js'
import { readTokens } from './three/tokens.js'

// The lazy WebGL mount point (doc 6.3). App.jsx loads this chunk after first paint and idle, and
// only when data-tier is not "off". It owns the whole life of the canvas:
//
//   - ONE fixed, full-viewport <canvas aria-hidden>, pointer-events none, z-index 0. It is added as
//     the FIRST child of <body> so that the page (later in the DOM, and positioned) paints above it
//     without a z-index war; a station that wants the core to show through must not paint a
//     background over its anchor.
//   - createCore() draws the scene; this file feeds it from the scroll controller (k, alpha), the
//     anchor registry (where the core is), the flow watcher (CTA hover), the lit arm and the pointer.
//   - After its first painted frame it writes <html data-webgl="drawn"> (through attributes.js),
//     which fades the SVG figures out (core.css); on teardown it removes it and they fade back.
//   - It starts the FPS governor, feeds it the frame intervals of the frames THIS canvas drew (the
//     core's 'frame' event), hands it webglcontextlost, switches the scene to the cheaper tier IN
//     PLACE on a drop high -> low (same canvas, same renderer, same context: only the buffers are
//     rebuilt), and falls back to the SVG on a drop to "off".
//   - The loop stops while the tab is hidden, while alpha is 0, while the core is more than a
//     viewport off screen and under data-motion=off, and wakes on scroll, resize and visibility.
//
//   tier   'low' | 'high'   (never 'off': App does not mount it then, and unmounting it is the only
//          teardown). A later change between low and high (the governor writes data-tier, which
//          re-renders App) is applied in place by the second effect. In dev, ?tier=low|high wins.

const graph = buildGraph(content)
const MAX_YAW = (4 * Math.PI) / 180 // pointer follow, doc 6.5
const SOFT_TIERS = new Set(['low', 'high'])

function devTier() {
  // Dead code in a production build: Vite replaces import.meta.env.DEV with false.
  if (!import.meta.env.DEV || typeof location === 'undefined') return null
  const t = new URLSearchParams(location.search).get('tier')
  return SOFT_TIERS.has(t) ? t : null
}

export default function CoreCanvas({ tier }) {
  // The tier the page had when the canvas mounted, and the live hook for later changes. The mount
  // effect below does not depend on `tier`: a change of tier must not rebuild the canvas, the
  // WebGL context and the renderer (only the off <-> on transition does, and that unmounts us).
  const initialTier = useRef(tier)
  const live = useRef(null)

  useEffect(() => {
    let mode = devTier() ?? initialTier.current
    if (!TIER_SPEC[mode]) return undefined

    const canvas = document.createElement('canvas')
    canvas.setAttribute('aria-hidden', 'true')
    canvas.setAttribute('data-decor', '')
    canvas.setAttribute('data-core-canvas', '')
    Object.assign(canvas.style, { position: 'fixed', inset: '0', width: '100%', height: '100%', zIndex: '0', pointerEvents: 'none' })
    document.body.insertBefore(canvas, document.body.firstChild)

    let core = null
    let governor = null
    let dead = false
    const cleanups = []

    // Live viewport rect of an anchor (see placement.js for why it is not the cached one). The
    // elements are looked up once; a DOMRect per call is the only allocation, two per frame.
    const els = new Map()
    const rectOf = (name, out) => {
      let el = els.get(name)
      if (!el || !el.isConnected) {
        el = document.querySelector(`[data-core-anchor="${name}"]`)
        if (el) els.set(name, el)
        else els.delete(name)
      }
      if (!el) return false
      const r = el.getBoundingClientRect()
      out.x = r.left
      out.y = r.top
      out.width = r.width
      out.height = r.height
      return true
    }

    const place = { from: 'hero', to: 'premise', t: 0, x: 0, y: 0, width: 0, height: 0 }
    const pointer = { tx: 0, ty: 0, x: 0, y: 0, enabled: false, last: 0 }
    const finePointer = typeof matchMedia === 'function' && matchMedia('(pointer: fine)').matches

    function teardown() {
      if (dead) return
      dead = true
      live.current = null
      cleanups.forEach((fn) => fn())
      governor?.stop()
      core?.dispose()
      canvas.remove()
      // The SVG figures fade back in.
      setWebgl(false)
    }

    try {
      const tokens = readTokens()
      core = createCore({
        canvas,
        graph,
        tier: mode,
        tokens,
        // Filled in place every frame: nothing here allocates.
        sample(state) {
          // Up to date for THIS frame: the loop was queued before the scroll controller's own rAF.
          const s = syncScroll()
          const placed = placeCore(s.raw, rectOf, place)
          state.k = s.k
          state.hasRect = placed
          // No anchor mounted (yet): nothing to draw.
          state.alpha = placed ? s.alpha : 0
          if (placed) {
            state.cx = place.x + place.width / 2
            state.cy = place.y + place.height / 2
            state.w = place.width
            state.h = place.height
          }
          state.active = getArm(place.t < 0.5 ? place.from : place.to)
          state.flow = getFlow()
          state.still = readAttr(ATTR.motion) === 'off'
          if (pointer.enabled && !state.still) {
            const dt = pointer.last ? Math.min(0.1, (performance.now() - pointer.last) / 1000) : 0
            const f = 1 - Math.exp(-dt * 6)
            pointer.x += (pointer.tx - pointer.x) * f
            pointer.y += (pointer.ty - pointer.y) * f
          }
          pointer.last = performance.now()
          state.yaw = pointer.x
          state.pitch = pointer.y
        },
        idle(state) {
          if (document.hidden || readAttr(ATTR.motion) === 'off') return true
          if (state.alpha <= 0.002) return true
          return state.hasRect && isFar(place, window.innerHeight)
        },
      })

      // Dev only: lets the harness read the scene state.
      if (import.meta.env.DEV) window.__core = core

      core.on('painted', () => {
        if (dead) return
        setWebgl(true)
        // A forced dev tier is for looking at the scene on a software rasteriser, whose frame
        // times are meaningless: the governor would drop it straight to "off".
        if (devTier()) return
        governor = startGovernor({
          tier: mode,
          onDrop: ({ to }) => {
            if (to === 'low') applyTier('low')
            else teardown()
          },
        })
      })
      // Only frames this canvas drew are evidence about WebGL (not DOM jank, idle gaps, a hidden tab).
      core.on('frame', (ms) => governor?.frame(ms))

      // A cheaper (or, after a capability re-read, richer) tier: the same renderer and context, new
      // buffers. The pointer follow belongs to the high tier only.
      const applyTier = (next) => {
        if (dead || !core || next === mode || !TIER_SPEC[next]) return
        mode = next
        core.setTier(next)
        pointer.enabled = Boolean(TIER_SPEC[next].pointer) && finePointer
        if (!pointer.enabled) pointer.x = pointer.y = pointer.tx = pointer.ty = 0
        wake()
      }
      live.current = { setTier: (next) => applyTier(devTier() ?? next) }

      // Context loss: stop, tell the governor (it writes data-tier=off), fall back to the SVG.
      const onLost = (e) => {
        e.preventDefault()
        if (governor) governor.lost()
        else writeTier('off')
        teardown()
      }
      canvas.addEventListener('webglcontextlost', onLost)
      cleanups.push(() => canvas.removeEventListener('webglcontextlost', onLost))

      // Wake the loop when something that stops it may have changed. Cheap when it is running.
      // The scroll controller (runtime/scroll.js) turns scrollY into progress in its own rAF, queued
      // by its own scroll listener, which was registered before this one: waking one rAF later
      // reads the NEW progress. A coalescing flag keeps it to one wake per frame.
      let wakePending = false
      const wake = () => {
        // Not skipped while running: a running loop may stop on stale progress in this very frame.
        if (wakePending) return
        wakePending = true
        requestAnimationFrame(() => {
          wakePending = false
          if (!dead) core.wake()
        })
      }
      const onResize = () => {
        core.resize(window.innerWidth, window.innerHeight, window.devicePixelRatio || 1)
        wake()
      }
      const onVisibility = () => {
        if (!document.hidden) wake()
      }
      window.addEventListener('scroll', wake, { passive: true })
      window.addEventListener('resize', onResize)
      document.addEventListener('visibilitychange', onVisibility)
      cleanups.push(() => {
        window.removeEventListener('scroll', wake)
        window.removeEventListener('resize', onResize)
        document.removeEventListener('visibilitychange', onVisibility)
      })

      // Pointer follow: fine pointers on the high tier only (doc 6.2). The listener exists on any fine
      // pointer and is gated by pointer.enabled, which applyTier flips when the tier changes.
      pointer.enabled = Boolean(TIER_SPEC[mode].pointer) && finePointer
      if (finePointer) {
        const onMove = (e) => {
          if (!pointer.enabled) return
          pointer.tx = Math.max(-1, Math.min(1, (e.clientX / window.innerWidth - 0.5) * 2)) * MAX_YAW
          pointer.ty = Math.max(-1, Math.min(1, (e.clientY / window.innerHeight - 0.5) * 2)) * -MAX_YAW
          wake()
        }
        window.addEventListener('pointermove', onMove, { passive: true })
        cleanups.push(() => window.removeEventListener('pointermove', onMove))
      }

      core.start()
    } catch (error) {
      // No WebGL after all (or a shader failed): the SVG figures stay, the tier says off.
      console.warn('X core: WebGL unavailable, keeping the SVG figure.', error)
      writeTier('off')
      teardown()
    }

    return teardown
  }, [])

  // A tier change while mounted (the governor's high -> low writes data-tier, which re-renders
  // App): switch in place, never rebuild the canvas.
  useEffect(() => {
    live.current?.setTier(tier)
  }, [tier])

  return null
}
