import { motion } from '../state/motion.js'
import { computeFrame } from './frame.js'
import { visibleTime } from './signal.js'

// The hero's imperative core. Scroll progress, box size and the clock go in; once per animation frame it
// computes one frame (frame.js, pure) and hands it to every renderer: the SVG drawing, the DOM overlay and,
// when it is running, the WebGL scene. React never sees a frame: nothing in here calls setState.
//
// The loop runs only while there is something to animate: the figure is on screen, motion is not paused, the
// tab is visible and the mode is not 'final'. Scroll, resize and Pause/Play each ask for a single frame, so a
// paused page still follows the scrollbar (Pause Motion stops decoration, not the visitor's own scrolling).

export function createDriver({ mode = 'stage' } = {}) {
  const s = {
    mode,
    p: mode === 'final' ? 1 : 0,
    W: 720,
    H: 760,
    visible: true,
    gl: false,
    clock: 0,
    last: 0,
    raf: 0,
    dirty: true,
    started: false,
  }
  const renderers = new Set()
  const born = typeof performance === 'undefined' ? 0 : performance.now()

  function live() {
    return s.visible && !motion.paused && s.mode !== 'final' && !(typeof document !== 'undefined' && document.hidden)
  }

  function tick(now) {
    s.raf = 0
    if (!s.started) return
    const running = live()
    const dt = s.last ? Math.min(0.1, (now - s.last) / 1000) : 0
    s.last = running ? now : 0
    if (running) s.clock += dt
    const f = computeFrame({ mode: s.mode, p: s.p, W: s.W, H: s.H, time: s.clock, still: s.mode === 'final' })
    f.dirty = s.dirty
    f.now = now
    f.gl = s.gl
    f.born = born
    s.dirty = false
    for (const r of renderers) r.render(f)
    if (running) schedule()
  }

  function schedule() {
    if (!s.raf && s.started) s.raf = requestAnimationFrame(tick)
  }

  const wake = () => {
    s.last = 0
    if (motion.paused) s.clock = visibleTime(s.clock) // a paused picture should still show its one signal
    schedule()
  }
  let unsub = null

  return {
    /** Starts the loop. Safe to call again after stop(): React StrictMode runs effects twice in development. */
    start() {
      if (s.started) return
      s.started = true
      unsub = motion.subscribe(wake)
      if (typeof document !== 'undefined') document.addEventListener('visibilitychange', wake)
      s.dirty = true
      schedule()
    },
    stop() {
      s.started = false
      if (unsub) unsub()
      unsub = null
      if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', wake)
      if (s.raf) cancelAnimationFrame(s.raf)
      s.raf = 0
    },
    born,
    get mode() {
      return s.mode
    },
    get size() {
      return { W: s.W, H: s.H }
    },
    setProgress(p) {
      if (p === s.p) return
      s.p = p
      s.dirty = true
      schedule()
    },
    setMode(next) {
      if (next === s.mode) return
      s.mode = next
      s.p = next === 'final' ? 1 : 0
      s.dirty = true
      schedule()
    },
    setSize(W, H) {
      if (W === s.W && H === s.H) return
      s.W = W
      s.H = H
      s.dirty = true
      schedule()
    },
    setVisible(v) {
      if (v === s.visible) return
      s.visible = v
      s.last = 0
      if (v) {
        s.dirty = true
        schedule()
      }
    },
    /** True while the WebGL canvas is the visible renderer: the SVG then stops updating. */
    setGl(on) {
      if (on === s.gl) return
      s.gl = on
      s.dirty = true
      schedule()
    },
    add(renderer) {
      renderers.add(renderer)
      s.dirty = true
      schedule()
      return () => renderers.delete(renderer)
    },
    request() {
      s.dirty = true
      schedule()
    },
  }
}
