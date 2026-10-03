import { createElement, useEffect, useRef } from 'react'

// Single-sourced core placement (doc 6.4). The X core never has a position of its own: it is
// drawn at a DOM anchor, <CoreAnchor name="hero|premise|deploy|line|done" />, and travels between
// anchors with the reader. The static SVG (CoreFigure) lives INSIDE the anchor, so the SVG and
// the WebGL version can never disagree about where the core is.
//
// How it stays cheap: each anchor's rect is measured on resize, orientation, visualViewport,
// ResizeObserver and document.fonts.ready, and cached DOCUMENT-relative. getAnchorRect() then
// subtracts scrollY, so the scroll handler and the render loop never read layout.
//
// The exception is an anchor that is, or sits inside, a position: sticky box (the premise
// core, the DEPLOY instrument, the pinned LINE and DONE stages). Its document position is not
// fixed: it moves as the box sticks, so a cached document rect drifts by up to a whole track.
// measure() detects that case (hasStickyAncestor) and marks the entry live: getAnchorRect() then
// reads its viewport rect from the DOM on each call. That is one layout read per sticky anchor
// per call, so callers on a hot path (the canvas loop) keep their own rect reader, as
// core/placement.js does; every other caller can use getAnchorRect() for any anchor.
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

/**
 * True when `el` or one of its ancestors is position: sticky. `getPosition(node)` returns the
 * computed position of a node (the DOM passes getComputedStyle; the tests pass a stub). Nodes
 * need a `parentElement`.
 */
export function hasStickyAncestor(el, getPosition) {
  for (let node = el; node; node = node.parentElement) {
    if (getPosition(node) === 'sticky') return true
  }
  return false
}

/** Document-relative rect to viewport rect. */
export const toViewportRect = (docRect, scrollX, scrollY) => ({
  x: docRect.x - scrollX,
  y: docRect.y - scrollY,
  width: docRect.width,
  height: docRect.height,
})

export const lerp = (a, b, t) => a + (b - a) * t
export const clamp01 = (t) => (t < 0 ? 0 : t > 1 ? 1 : t)
/** Smoothstep. A plain stand-in for the brand easing, which is a CSS cubic-bezier. */
export const ease = (t) => {
  const c = clamp01(t)
  return c * c * (3 - 2 * c)
}

export const lerpRect = (a, b, t) => ({
  x: lerp(a.x, b.x, t),
  y: lerp(a.y, b.y, t),
  width: lerp(a.width, b.width, t),
  height: lerp(a.height, b.height, t),
})

export const rectCenter = (r) => ({ x: r.x + r.width / 2, y: r.y + r.height / 2 })

/**
 * Which two anchors the core sits between, and how far along (0..1, not eased), given the raw
 * progress of every track ({ standby, premise, deploy, line, work, ledger, done }, each 0..1;
 * a missing key counts as 0). It mirrors the k/alpha maps of runtime/scroll.js kAlphaFor.
 *
 *   standby            hero -> premise, over the first HERO_LEG_END of STANDBY; PREMISE (progress
 *                      above 0) holds the core on the premise anchor
 *   deploy             premise -> deploy, over the first third of DEPLOY
 *   line               deploy -> line, over the first 15% of THE LINE
 *   work, ledger       line (the core is invisible here)
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
// Registry
// ---------------------------------------------------------------------------------------------

const anchors = new Map() // name -> { el, rect: Rect | null (document relative), live: boolean }
const subscribers = new Set()
let observer = null
let teardown = null

function measure(name) {
  const entry = anchors.get(name)
  if (!entry || typeof window === 'undefined') return
  const r = entry.el.getBoundingClientRect()
  entry.rect = { x: r.left + window.scrollX, y: r.top + window.scrollY, width: r.width, height: r.height }
  // Re-decided on every measure: a breakpoint can turn a sticky box static and back.
  entry.live = hasStickyAncestor(entry.el, (node) => getComputedStyle(node).position)
}

/** Re-measure every anchor. Called on resize-like events, never from a scroll handler. */
export function measureAnchors() {
  for (const name of anchors.keys()) measure(name)
  subscribers.forEach((fn) => fn())
}

function startObserving() {
  if (teardown || typeof window === 'undefined') return
  const onChange = () => measureAnchors()
  window.addEventListener('resize', onChange)
  window.addEventListener('orientationchange', onChange)
  window.addEventListener('load', onChange)
  window.visualViewport?.addEventListener('resize', onChange)
  document.fonts?.ready.then(onChange)
  if (typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(onChange)
    for (const { el } of anchors.values()) observer.observe(el)
  }
  teardown = () => {
    window.removeEventListener('resize', onChange)
    window.removeEventListener('orientationchange', onChange)
    window.removeEventListener('load', onChange)
    window.visualViewport?.removeEventListener('resize', onChange)
    observer?.disconnect()
    observer = null
    teardown = null
  }
}

/** Registers an element as the anchor `name`. Returns the unregister function. */
export function registerAnchor(name, el) {
  anchors.set(name, { el, rect: null, live: false })
  observer?.observe(el)
  startObserving()
  measure(name)
  subscribers.forEach((fn) => fn())
  return () => {
    if (anchors.get(name)?.el === el) anchors.delete(name)
    observer?.unobserve(el)
    if (anchors.size === 0) teardown?.()
  }
}

/** Called after any anchor is measured. Returns the unsubscribe function. */
export function subscribeAnchors(fn) {
  subscribers.add(fn)
  return () => subscribers.delete(fn)
}

/** The cached document-relative rect of an anchor, or null if it is not mounted. */
export const getDocRect = (name) => anchors.get(name)?.rect ?? null

/** True when the anchor is measured live because it is, or sits in, a sticky box. */
export const isLiveAnchor = (name) => anchors.get(name)?.live === true

/**
 * The anchor's rect in viewport coordinates right now. A static anchor costs no layout read
 * (cached rect minus scroll); a sticky one (see the header) is read from the DOM, so it is right
 * while the box sticks. Null if the anchor is not mounted.
 */
export function getAnchorRect(name) {
  const entry = anchors.get(name)
  if (!entry?.rect || typeof window === 'undefined') return null
  if (entry.live) {
    const r = entry.el.getBoundingClientRect()
    return { x: r.left, y: r.top, width: r.width, height: r.height }
  }
  return toViewportRect(entry.rect, window.scrollX, window.scrollY)
}

/**
 * Where the core is right now, in viewport pixels: lerp between the two anchors of
 * coreAnchorSegment, eased. Null until the anchors it needs are mounted.
 * @param {Record<string, number>} progress the `raw` map of scroll.js getState()
 */
export function getCoreRect(progress) {
  const { from, to, t } = coreAnchorSegment(progress)
  const a = getAnchorRect(from)
  const b = getAnchorRect(to)
  if (!a && !b) return null
  return lerpRect(a ?? b, b ?? a, ease(t))
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
  const ref = useRef(null)
  useEffect(() => (ref.current ? registerAnchor(name, ref.current) : undefined), [name])
  return createElement(
    'div',
    { ref, className, 'data-core-anchor': name, 'data-decor': '', 'aria-hidden': 'true' },
    children,
  )
}
