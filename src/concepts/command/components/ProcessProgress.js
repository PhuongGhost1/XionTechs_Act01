// Pure scroll geometry for the How We Work timeline (MOTION §18), kept out of the component so it
// can be tested without a browser.

// The line starts drawing when the top of the timeline crosses this fraction of the viewport
// height, measured from the top of the screen.
export const START = 0.7
// The shortest scroll distance over which the line draws, as a fraction of the viewport height,
// so a short horizontal timeline is not over in a flick.
export const MIN_SPAN = 0.4

const clamp01 = (v) => Math.min(1, Math.max(0, v))

// How far the line has drawn (0..1) for a timeline whose box starts `top` px below the top of a
// `vh`-tall viewport and is `height` px tall. Drawing finishes after scrolling
// max(height, MIN_SPAN × vh) past the start, so on the tall vertical (mobile) layout the signal
// keeps pace with the reader instead of racing ahead.
export function timelineProgress(top, height, vh) {
  const span = Math.max(height, vh * MIN_SPAN, 1)
  return clamp01((vh * START - top) / span)
}

// The stage the line has reached. Stages sit at even intervals along the line (0, 1/(n-1), … 1),
// and a stage activates as the line arrives at it, so the first stage is active from the start.
export function activeStage(t, count) {
  if (count <= 1) return 0
  return Math.min(count - 1, Math.floor(clamp01(t) * (count - 1) + 1e-6))
}
