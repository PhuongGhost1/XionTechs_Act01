// Which arm is lit, per anchor. The DOM decides (a module row, a hovered or focused hero tag) and
// hands the number to <CoreFigure active={n}>; the figure publishes it here so the WebGL core,
// which knows nothing about React props, lights the same arm. Keyed by anchor name because the
// hero and the deploy instrument can hold different selections at the same moment.
//
// A plain Map and numbers: the render loop reads it every frame without allocating.

const arms = new Map() // anchor name -> 0..3, or -1 for none

/** Publishes the lit arm of an anchor (-1 or undefined clears it). */
export function setArm(anchor, index) {
  const next = Number.isInteger(index) && index >= 0 && index <= 3 ? index : -1
  if (next === -1) arms.delete(anchor)
  else arms.set(anchor, next)
}

/** The lit arm of an anchor, or -1. */
export function getArm(anchor) {
  const v = arms.get(anchor)
  return v === undefined ? -1 : v
}
