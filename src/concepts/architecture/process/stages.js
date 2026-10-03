// Pure scroll-to-stage logic for sheet 04. The sticky stage is a tall container whose scroll progress p
// (0 at the top of the pin, 1 at its release) is cut into equal bands, one per stage. Only the integer
// stage ever reaches React state, so a scroll re-renders the sheet at most five times.

export const clamp01 = (v) => (Number.isFinite(v) ? (v < 0 ? 0 : v > 1 ? 1 : v) : 0)

/** The stage (0 .. count - 1) shown at scroll progress p. Clamped, monotonic, equal bands. */
export function stageAt(p, count) {
  if (!(count > 0)) return 0
  const i = Math.floor(clamp01(p) * count)
  return i >= count ? count - 1 : i
}

/** 0..1 progress through the current stage's band (1 at the very end of the last band). */
export function stageProgress(p, count) {
  if (!(count > 0)) return 0
  const q = clamp01(p) * count
  const i = stageAt(p, count)
  return clamp01(q - i)
}

/** Scroll progress p at the middle of stage i's band: where a click on the stage index lands. */
export const stageCentre = (i, count) => clamp01((i + 0.5) / count)

/**
 * The window.scrollY that puts the stage container at progress p.
 * top    document offset of the container's top edge
 * height the container's height; the pin travels height - viewport
 */
export function scrollYForProgress(p, { top, height, viewport }) {
  return Math.round(top + clamp01(p) * Math.max(0, height - viewport))
}

/** The 0..1 position of the progress marker when the stage index is i of count (band starts, for the ruler). */
export const stageTick = (i, count) => (count > 1 ? i / count : 0)
