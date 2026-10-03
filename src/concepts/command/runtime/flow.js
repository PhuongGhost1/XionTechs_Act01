// Core flow (doc 4.9, 6.5, M04): hovering or focusing any CTA marked data-flow speeds the data
// packets of the core up by 2.5 times. The Button component adds the attribute (`flow` prop);
// this file watches the document for it, so no CTA needs a handler of its own.
//
// The scene reads getFlow() each frame (uniform uFlow); the SVG tier reads the CSS variable
// --flow on <html>, which anim-packet uses to shorten its duration. The value ramps over 160 ms.

export const FLOW_IDLE = 1
export const FLOW_BOOST = 2.5
const RAMP_MS = 160

let target = FLOW_IDLE
let value = FLOW_IDLE
let from = FLOW_IDLE
let startedAt = 0
let stopWatching = null

/** The current flow multiplier, ramped. Safe to call every frame. */
export function getFlow(now = typeof performance !== 'undefined' ? performance.now() : 0) {
  if (value === target) return value
  const t = Math.min(1, (now - startedAt) / RAMP_MS)
  value = t >= 1 ? target : from + (target - from) * t
  return value
}

function setTarget(next) {
  if (next === target) return
  from = value
  target = next
  startedAt = typeof performance !== 'undefined' ? performance.now() : 0
  if (typeof document !== 'undefined') document.documentElement.style.setProperty('--flow', String(next))
}

const hasFlow = (node) => node instanceof Element && node.closest('[data-flow]') !== null

/** Starts watching pointer and focus events. Idempotent. Returns stop(). */
export function startFlowWatcher() {
  if (stopWatching || typeof document === 'undefined') return stopFlowWatcher
  const on = (e) => hasFlow(e.target) && setTarget(FLOW_BOOST)
  const off = (e) => hasFlow(e.target) && setTarget(FLOW_IDLE)
  document.addEventListener('pointerover', on)
  document.addEventListener('pointerout', off)
  document.addEventListener('focusin', on)
  document.addEventListener('focusout', off)
  stopWatching = () => {
    document.removeEventListener('pointerover', on)
    document.removeEventListener('pointerout', off)
    document.removeEventListener('focusin', on)
    document.removeEventListener('focusout', off)
    stopWatching = null
  }
  return stopFlowWatcher
}

export function stopFlowWatcher() {
  stopWatching?.()
}
