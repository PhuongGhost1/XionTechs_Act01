import { ATTR, readAttr, setTier } from '../contract/attributes.js'
import { detectTier, readEnvironment, tierReasons } from './capability.js'

// Tier control (doc 6.2): the one place that decides data-tier and keeps it honest for the whole
// session. capability.js says what the device could do; the governor (governor.js, started by the
// canvas) can only lower the tier at run time; this file joins the two:
//
//   tier = min( detectTier(environment), session floor )
//
// The environment is read again when the MOTION toggle, the READ | RAW view or the OS reduced
// motion setting change, so turning motion off or opening RAW drops the canvas at once, and
// turning motion back on brings it back. The session floor only ever goes DOWN: a tier the
// governor took away (slow frames, a lost context) or a failed WebGL chunk is not given back,
// however many times the visitor toggles things (doc 6.2: never upgrade).

export const TIER_RANK = Object.freeze({ off: 0, low: 1, high: 2 })

/** The cheaper of two tiers. */
export const minTier = (a, b) => (TIER_RANK[a] <= TIER_RANK[b] ? a : b)

/** Pure: the tier of a device, held at or under the session floor. */
export const resolveTier = (env, floor = 'high') => minTier(detectTier(env), floor)

/**
 * Pure: the new floor after someone else (the governor) wrote tier `written` to <html>.
 * A write that is not a known tier, or not lower than the floor, changes nothing.
 */
export const lowerFloor = (floor, written) => (written in TIER_RANK ? minTier(floor, written) : floor)

/**
 * Pure: the reasons shown with the tier. The device reasons from capability.js, plus one for a
 * floor that is lower than the device alone would give.
 */
export function reasonsFor(env, floor = 'high') {
  const reasons = [...tierReasons(env)]
  if (TIER_RANK[floor] < TIER_RANK[detectTier(env)]) reasons.push('dropped while running')
  return reasons
}

// -- session state (module level: survives React StrictMode's second mount) -------------------

let floor = 'high'
let chunkFailed = false
let lastWritten = null
let stopFn = null
let report = Object.freeze({ tier: null, reasons: Object.freeze([]) })
const listeners = new Set()

/** { tier: 'off'|'low'|'high'|null, reasons: string[] }. A new object only when it changes. */
export const getTierReport = () => report

/** For useSyncExternalStore. */
export const subscribeTierReport = (fn) => {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

function publish(tier, reasons) {
  if (report.tier === tier && report.reasons.join('|') === reasons.join('|')) return
  report = Object.freeze({ tier, reasons: Object.freeze(reasons) })
  listeners.forEach((fn) => fn())
}

function evaluate() {
  const env = { ...readEnvironment(), chunkFailed }
  const tier = resolveTier(env, floor)
  lastWritten = tier
  setTier(tier)
  publish(tier, reasonsFor(env, floor))
}

/** The lazy WebGL chunk failed to load: the page stays on its SVG tier for the session. */
export function markChunkFailed() {
  chunkFailed = true
  if (stopFn) evaluate()
}

/**
 * Starts tier control: writes data-tier now and again whenever the view, the motion setting or
 * the OS reduced-motion preference change, and notices a drop written by the governor. Idempotent.
 * Returns stop().
 */
export function startTier() {
  if (stopFn || typeof document === 'undefined') return stopTier
  const observer = new MutationObserver((records) => {
    let again = false
    for (const r of records) {
      if (r.attributeName === ATTR.tier) {
        const written = readAttr(ATTR.tier)
        if (written && written !== lastWritten) {
          // Not ours: the governor lowered it (or the canvas lost its context). Remember it.
          floor = lowerFloor(floor, written)
          lastWritten = written
          again = true
        }
      } else {
        again = true
      }
    }
    if (again) evaluate()
  })
  observer.observe(document.documentElement, { attributes: true, attributeFilter: [ATTR.tier, ATTR.view, ATTR.motion] })
  const mq = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null
  mq?.addEventListener('change', evaluate)
  stopFn = () => {
    observer.disconnect()
    mq?.removeEventListener('change', evaluate)
    stopFn = null
  }
  evaluate()
  return stopTier
}

export function stopTier() {
  stopFn?.()
}
