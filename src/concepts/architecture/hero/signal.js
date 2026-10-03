import { LAYER_COUNT, PORT_X } from '../model/layers.js'
import { range, smooth } from '../model/timeline.js'

// The hero's single yellow signal: a request that enters at the Experience layer, passes down through the
// shared ports and leaves at Infrastructure, one port after another. Pure: a function of time, so the SVG
// drawing and the WebGL scene move it identically, and Pause Motion simply stops feeding it time.
//
// `L` is a layer coordinate: 0 is the top layer, LAYER_COUNT - 1 the bottom. World y = (LAYER_COUNT - 1 - L) * gap.

export const TRAVEL = 0.5 // seconds between two layers
export const DWELL = 0.14 // seconds it rests on a layer
export const REST = 0.9 // seconds with no signal between two descents
const SEGMENT = TRAVEL + DWELL
const SPAN = LAYER_COUNT - 1
export const CYCLE = SPAN * SEGMENT + REST
export const PORT_ORDER = [1, 2, 0, 3]

/** A signal frozen mid-descent, for reduced motion and for the first frame. */
export const REST_TIME = SEGMENT + TRAVEL / 2

const easeInOut = (t) => 0.5 - 0.5 * Math.cos(Math.PI * t)

export function signalAt(t) {
  const time = Math.max(0, t)
  const cycle = Math.floor(time / CYCLE)
  const local = time - cycle * CYCLE
  const portIndex = PORT_ORDER[cycle % PORT_ORDER.length]
  const travelling = SPAN * SEGMENT
  if (local >= travelling) return { portIndex, x: PORT_X[portIndex], L: SPAN, alpha: 0 }
  const k = Math.min(SPAN - 1, Math.floor(local / SEGMENT))
  const r = local - k * SEGMENT
  const L = r < TRAVEL ? k + easeInOut(r / TRAVEL) : k + 1
  // Fade in over the first half second, out over the last 0.4 s of the descent.
  const alpha = Math.min(range(local, 0, 0.5), 1 - range(local, travelling - 0.4, travelling))
  return { portIndex, x: PORT_X[portIndex], L, alpha: smooth(alpha) }
}

/**
 * Pause Motion freezes the clock. If that lands in the dark gap between two passes (or in a fade), the frozen
 * picture would have no signal at all, so the clock is moved to a visible moment of the same pass.
 */
export function visibleTime(t) {
  if (signalAt(t).alpha >= 0.6) return t
  return Math.floor(Math.max(0, t) / CYCLE) * CYCLE + REST_TIME
}

/** World y of the signal for a given gap. */
export const signalY = (L, gap) => (SPAN - L) * gap
