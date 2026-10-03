import { clamp01 } from '../../runtime/scroll.js'

// Pure thresholds of the finale (doc 4.8, 6.6, 6.2 S6, M13, M14). The progress p is the track
// progress of #done (runtime/scroll.js getState().progress.done, 0..1). The scene scalars of
// kAlphaFor() converge the points over p 0.4..0.8; the logo and the underline hang off that.

/** Convergence runs over these two track progress values (the same ones kAlphaFor uses). */
export const CONVERGE_FROM = 0.4
export const CONVERGE_TO = 0.8

/** The real logo fades in when the convergence is this far along (doc 6.6 item 2). */
export const LOGO_AT = 0.7

/** The yellow underline sweeps under DONE once the track passes this progress (M14). */
export const SWEEP_AT = 0.9

/** Convergence progress 0..1 for a track progress p. */
export function convergence(p) {
  return clamp01((p - CONVERGE_FROM) / (CONVERGE_TO - CONVERGE_FROM))
}

/** True when the logo should be shown: reversible, a pure function of scroll. */
export const logoVisible = (p) => convergence(p) >= LOGO_AT

/** True once the track has passed SWEEP_AT. The caller latches it so the sweep runs once. */
export const sweepReached = (p) => clamp01(p) > SWEEP_AT

/** The track progress at which the logo appears (for tests and docs): 0.4 + 0.7 * 0.4. */
export const LOGO_AT_TRACK = CONVERGE_FROM + LOGO_AT * (CONVERGE_TO - CONVERGE_FROM)
