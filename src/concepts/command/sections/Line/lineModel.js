import { clamp01, plateau } from '../../runtime/scroll.js'

// Pure model of THE LINE (doc 4.5, 7.2 M08). No DOM, no React: everything here is a function of
// scroll progress, so a reload or a deep link at #line mid-track shows the right step, and the
// unit tests can walk arbitrary scroll positions.
//
// Two scalars matter:
//   raw     0..1 progress through the pinned track (runtime/scroll.js, mode 'pin')
//   packet  0..1 position of the yellow packet along the line = plateau(raw, PLATEAUS)
//
// The plateau shaping is what gives every step a dwell: the packet holds still on a stop while
// the reader scrolls through that stop's slice of the track, then moves linearly to the next.
// runtime/scroll.js writes the shaped value as --p on the track element, so the packet and the
// progress fill are pure CSS (transform only) and need no React state per frame.

export const STEP_COUNT = 6
export const LAST_STEP = STEP_COUNT - 1
/** The step whose entry plays the illustrative failure beat (content.process.beat.step). */
export const BUILD_STEP = 3

/**
 * Share of the track each step holds still. The first dwell is long on purpose: the core's arms
 * collapse into the line during the first 15% of the track (runtime/scroll.js kAlphaFor), and
 * REQUEST stays on screen for all of it. The last is short so the stage releases soon after SCALE.
 */
export const DWELLS = Object.freeze([0.15, 0.09, 0.09, 0.09, 0.09, 0.07])

/**
 * The [from, to] raw-progress intervals for plateau(), one per step, so that the shaped value
 * equals i / LAST_STEP at the start of dwell i and the movement between two dwells is the same
 * length for every pair. Derivation: plateau(x) = (x - held) / (1 - total), where `held` is the
 * dwell length passed so far; solving for plateau(from_i) = i / LAST_STEP gives
 * from_i = i / LAST_STEP * (1 - total) + sum of earlier dwells.
 */
export function plateauPlan(dwells = DWELLS) {
  const total = dwells.reduce((sum, d) => sum + d, 0)
  let before = 0
  return dwells.map((d, i) => {
    const from = (i / (dwells.length - 1)) * (1 - total) + before
    before += d
    return [from, from + d]
  })
}

export const PLATEAUS = Object.freeze(plateauPlan().map((p) => Object.freeze(p)))

/** Packet position 0..1 along the line for a raw progress. */
export const packetAt = (raw) => plateau(raw, PLATEAUS)

/**
 * The current step for a packet position: the nearest stop. The word therefore changes at the
 * midpoint of each move, which is symmetric, so scrolling back rolls the old word back in.
 */
export const stepAtPacket = (packet) => Math.min(LAST_STEP, Math.max(0, Math.round(clamp01(packet) * LAST_STEP)))

/** The current step for a raw track progress. A pure function: same scroll, same step. */
export const stepAtRaw = (raw) => stepAtPacket(packetAt(raw))

/**
 * The raw progress to scroll to so that step `i` is current and the packet sits on its stop:
 * the middle of its dwell. REQUEST uses 90% of its (long) dwell, which is after the core has
 * finished collapsing but well before the packet starts to move.
 */
export function stepTarget(i) {
  const step = Math.min(LAST_STEP, Math.max(0, Math.round(i)))
  const [from, to] = PLATEAUS[step]
  return step === 0 ? from + (to - from) * 0.9 : (from + to) / 2
}

/** Which way the word rolls: forward steps roll up, going back rolls down. */
export const rollDirection = (from, to) => (to >= from ? 'forward' : 'backward')

/** Horizontal position of stop `i` as a percentage of the rail, 0..100. */
export const stopPercent = (i) => (i / LAST_STEP) * 100

/** True for the stops whose label sits on the second row on narrow screens (labels would collide). */
export const isLowerRow = (i) => i % 2 === 1
