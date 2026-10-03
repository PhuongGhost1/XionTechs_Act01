import { clamp01 } from '../state/scroll.js'

// The hero's scroll timeline as pure functions of p (0 -> 1 over the sticky stage), shared by the WebGL
// scene and the SVG fallback. BRIEF 02 §14, "Blueprint-to-3D Transition": the blueprint draws itself
// (time based, on load), lines gain depth, layers lift, the drawing becomes a 3D architecture, the camera
// moves through the system.

export const GAP_MIN = 0.05
export const GAP_MAX = 2.2

export const range = (p, a, b) => clamp01((p - a) / (b - a))
export const smooth = (t) => t * t * (3 - 2 * t)
export const lerp = (a, b, t) => a + (b - a) * t

export function heroParams(p) {
  const q = clamp01(p)
  return {
    connect: smooth(range(q, 0.03, 0.28)), // vertical connectors draw between the layers
    lift: smooth(range(q, 0.08, 0.5)), // layers rise apart
    depth: smooth(range(q, 0.26, 0.6)), // extrusions grow from flat linework to relief
    tilt: smooth(range(q, 0.04, 0.58)), // camera goes from plan to axonometric
    labels: smooth(range(q, 0.46, 0.62)), // data labels and leader lines appear
    dolly: smooth(range(q, 0.8, 1)), // camera moves in through the layers
  }
}

export const heroGap = (lift) => lerp(GAP_MIN, GAP_MAX, lift)

// True isometric elevation is 35.264 degrees; a plan view looks straight down (90).
export const ISO_ELEVATION = 35.264
export const ISO_AZIMUTH = 45

export function cameraAngles(tilt) {
  return { elevation: lerp(90, ISO_ELEVATION, tilt), azimuth: lerp(0, ISO_AZIMUTH, tilt) }
}

/** Words for the live VIEW readout. The angle itself is the real camera elevation, not a made-up figure. */
export function viewLabel(tilt) {
  if (tilt < 0.04) return 'Plan'
  if (tilt > 0.96) return 'Axonometric'
  return 'Transition'
}
