// Pure maths for the Signals counters (M3). The hook that drives it lives in useCountUp.js.

// A firm ease-out: most of the count happens early, then it settles on the real value.
export const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3)

// The number shown `t` (0 to 1) of the way through the count. Always a whole number, and exactly
// `target` at the end, so the counter can never settle on a different figure.
export function countValue(target, t) {
  const p = Math.min(1, Math.max(0, t))
  return p >= 1 ? target : Math.round(target * easeOutCubic(p))
}
