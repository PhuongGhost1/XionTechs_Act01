// Pure scroll geometry for the Process pipeline (M9), kept out of the component so it can be
// tested without a browser. Same reading-line model as the main page's ProcessProgress.js, kept
// local so this concept page stays self-contained.

// The fill front sits on this fraction of the viewport height, measured from the top of the screen.
export const START = 0.72
// The shortest scroll distance over which the fill draws, as a fraction of the viewport height, so
// the short horizontal track is not over in a flick.
export const MIN_SPAN = 0.4

const clamp01 = (v) => Math.min(1, Math.max(0, v))

// How far the track has filled (0..1). `top` is the track's distance below the top of a `vh`-tall
// viewport and `length` its extent along the scroll axis: tall in the vertical timeline, a hairline
// in the horizontal one. Vertically the fill front therefore stays on the reading line, node by node;
// horizontally it draws over MIN_SPAN of a screen.
export function pipelineProgress(top, length, vh) {
  const span = Math.max(length, vh * MIN_SPAN, 1)
  return clamp01((vh * START - top) / span)
}

// The step the fill has reached. Nodes sit at even intervals along the track (0, 1/(n-1), … 1) and a
// step lights as the fill arrives at its node, so the first step is lit from the start.
export function activeStep(t, count) {
  if (count <= 1) return 0
  return Math.min(count - 1, Math.floor(clamp01(t) * (count - 1) + 1e-6))
}

// 'current' for the step the fill is on, 'reached' for those behind it, 'idle' for those ahead.
// `settled` is the no-motion state: every step reached, none singled out.
export function stepState(index, active, settled = false) {
  if (settled) return 'reached'
  if (index === active) return 'current'
  return index < active ? 'reached' : 'idle'
}

// The mono readout, e.g. "Step 03 / 06".
export function stepReadout(active, count, label = 'Step') {
  const pad = (n) => String(n).padStart(2, '0')
  return `${label} ${pad(active + 1)} / ${pad(count)}`
}
