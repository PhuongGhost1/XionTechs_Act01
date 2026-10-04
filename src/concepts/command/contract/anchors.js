import { createElement } from 'react'

// Single-sourced core placement (doc 6.4). The X core never has a position of its own: it is
// drawn at a DOM anchor, <CoreAnchor name="hero|premise|deploy|line|done" />, and travels between
// anchors with the reader. The static SVG (CoreFigure) lives INSIDE the anchor, so the SVG and
// the WebGL version can never disagree about where the core is.
//
// An anchor is only a marked box: it registers nothing and measures nothing. The one reader of
// anchor rects is the WebGL render loop (core/CoreCanvas.jsx through core/placement.js), which
// reads each anchor's LIVE viewport rect once per rendered frame. It has to be live: the premise
// core, the DEPLOY instrument and the pinned LINE and DONE stages are position: sticky, so a
// document rect cached at measure time drifts by up to a whole track as the box sticks. (An
// earlier version of this file kept a registry with cached document rects, resize observers and a
// sticky-ancestor walk; nothing read it, so it was removed rather than left running.)
//
// This file has no JSX on purpose (.js), so its pure helpers stay testable in Node.

export const ANCHOR_NAMES = Object.freeze(['hero', 'premise', 'deploy', 'line', 'done'])

/**
 * The hero -> premise leg is driven by the STANDBY track (span mode, 0..1 over one track height
 * after its top reaches the viewport top), NOT by the PREMISE track: the premise stop (the
 * #premise landing, scrollY = premise top - header) is reached at standby progress
 * 1 - header / track, about 0.93 on a desktop and 0.89 on a short landscape window, while the
 * PREMISE track itself has not started yet. The leg finishes at this fraction of STANDBY, so the
 * dimmed core is exactly on the premise anchor by the time the premise stop is reached, with a
 * margin for tall headers and short windows. runtime/scroll.js (alpha) and core/placement.js
 * (position) read the same constant.
 */
export const HERO_LEG_END = 0.85

/** @typedef {{ x: number, y: number, width: number, height: number }} Rect */

// ---------------------------------------------------------------------------------------------
// Pure helpers (tested in anchors.test.js)
// ---------------------------------------------------------------------------------------------

export const lerp = (a, b, t) => a + (b - a) * t
export const clamp01 = (t) => (t < 0 ? 0 : t > 1 ? 1 : t)
/** Smoothstep. A plain stand-in for the brand easing, which is a CSS cubic-bezier. */
export const ease = (t) => {
  const c = clamp01(t)
  return c * c * (3 - 2 * c)
}

/**
 * Which two anchors the core sits between, and how far along (0..1, not eased), given the raw
 * progress of every track ({ standby, premise, deploy, line, work, ledger, done }, each 0..1;
 * a missing key counts as 0). It mirrors the k/alpha maps of runtime/scroll.js kAlphaFor.
 *
 *   standby            hero -> premise, over the first HERO_LEG_END of STANDBY; PREMISE (progress
 *                      above 0) holds the core on the premise anchor
 *   deploy             premise -> deploy, over the first third of DEPLOY
 *   line               deploy -> line, over the first 15% of THE LINE
 *   work, agent, ledger  line (the core is invisible here; WORK stays above 0 through AGENT)
 *   done               done (the core reappears at the finale)
 */
export function coreAnchorSegment(progress = {}) {
  const p = (id) => (Number.isFinite(progress[id]) ? clamp01(progress[id]) : 0)
  if (p('done') > 0) return { from: 'done', to: 'done', t: 0 }
  if (p('work') > 0 || p('ledger') > 0) return { from: 'line', to: 'line', t: 0 }
  if (p('line') > 0) return { from: 'deploy', to: 'line', t: clamp01(p('line') / 0.15) }
  if (p('deploy') > 0) return { from: 'premise', to: 'deploy', t: clamp01(p('deploy') / (1 / 3)) }
  return { from: 'hero', to: 'premise', t: p('premise') > 0 ? 1 : clamp01(p('standby') / HERO_LEG_END) }
}

// ---------------------------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------------------------

/**
 * <CoreAnchor name="hero" className="..."> renders div[data-core-anchor="hero"]. Give it a size
 * with className (the core is drawn to fill it); put the static CoreFigure inside as children.
 * aria-hidden: the core is decoration, every meaningful fact is real DOM text elsewhere.
 */
export function CoreAnchor({ name, className, children }) {
  return createElement(
    'div',
    { className, 'data-core-anchor': name, 'data-decor': '', 'aria-hidden': 'true' },
    children,
  )
}
