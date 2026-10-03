import { range, smooth } from '../model/timeline.js'

// Sheet 05's signature (BRIEF 02 §16): over a sticky stage the StaffXP model opens like an exploded technical
// drawing, holds so it can be explored, then reassembles into the real product screenshot. This is the whole
// timeline as one pure function of the stage progress p (0 -> 1). The component writes the numbers to CSS
// variables once per frame and never puts them in React state; only the discrete `phase` name is state.
//
//   0.00 - 0.15  closed       the stack faces the viewer, nothing is annotated
//   0.15 - 0.45  opens        tilts to an axonometric attitude, the planes separate, labels and leaders appear
//   0.45 - 0.65  hold         fully open, for exploring
//   0.65 - 1.00  reassembles  the gap closes, the rotation returns, hotspot callouts appear on the screen

export const STOPS = Object.freeze({
  closedEnd: 0.15,
  openEnd: 0.45,
  holdEnd: 0.65,
  // The caption changes half way through each move, so it never lags behind what is on screen.
  captionOpen: 0.22,
  captionAssembled: 0.78,
})

export const PHASES = Object.freeze(['closed', 'open', 'assembled'])

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v)

export function phaseName(p) {
  const q = clamp01(Number.isFinite(p) ? p : 0)
  if (q < STOPS.captionOpen) return 'closed'
  if (q < STOPS.captionAssembled) return 'open'
  return 'assembled'
}

export function staffPhase(p) {
  const q = clamp01(Number.isFinite(p) ? p : 0)
  const open = smooth(range(q, STOPS.closedEnd, STOPS.openEnd))
  const assemble = smooth(range(q, STOPS.holdEnd, 1))
  return {
    p: q,
    open, // 0 closed -> 1 fully open (stays 1 through the hold and the reassembly)
    assemble, // 0 -> 1 as the model closes up again
    explode: open * (1 - assemble), // how far apart the planes are: drives the tilt, the gap and the shadows
    labels: smooth(range(q, 0.35, STOPS.openEnd)) * (1 - smooth(range(q, STOPS.holdEnd, 0.71))), // tags, leaders, rails: late in the opening, early in the closing
    pins: smooth(range(q, 0.86, 0.98)), // numbered callouts on the assembled screen
    phase: phaseName(q),
  }
}

/** Which of the three captions is current, as an index into `staffxp.phases` order. */
export const phaseIndex = (name) => Math.max(0, PHASES.indexOf(name))

/** The state of a motion-free page: the finished, assembled screen with its callouts. */
export const FINAL = Object.freeze(staffPhase(1))
