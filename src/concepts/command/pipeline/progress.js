// Pure helpers for the pipeline rail. `p` is the section's scroll progress, 0..1.

const clamp01 = (n) => (Number.isFinite(n) ? (n < 0 ? 0 : n > 1 ? 1 : n) : 0)
const smooth = (t) => t * t * (3 - 2 * t)

// Fraction of each stage's scroll slice during which the marker rests on the stage centre
// before it starts to move to the next one.
export const HOLD = 0.35

// Index of the active stage. The scroll range is cut into `count` equal slices. Returns `count`
// when p is 1: every stage is complete and none is active.
export function stageFromProgress(p, count) {
  if (count <= 0) return 0
  const q = clamp01(p)
  if (q >= 1) return count
  return Math.min(count - 1, Math.floor(q * count))
}

// Marker position along the rail, 0 (first stage centre) .. 1 (last stage centre). It rests on a
// stage centre for the first HOLD of the stage's slice, then eases to the next centre, so it
// arrives just as the next stage becomes active. Monotonic and continuous.
export function markerPosition(p, count) {
  if (count <= 1) return clamp01(p)
  const q = clamp01(p)
  if (q >= 1) return 1
  const u = q * count
  const k = Math.floor(u)
  if (k >= count - 1) return 1
  const f = u - k
  const t = f <= HOLD ? 0 : (f - HOLD) / (1 - HOLD)
  return (k + smooth(t)) / (count - 1)
}
