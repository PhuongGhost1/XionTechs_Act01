import { setTier } from '../contract/attributes.js'

// FPS governor (doc 6.2): a session can only get cheaper, never richer, and it needs sustained
// evidence to do so. The core is pure hysteresis, driven by frame times; the timer around it is
// a thin rAF loop.
//
//   high -> low   median frame time over 90 frames above 25 ms, twice in a row
//   low  -> off   median frame time over 90 frames above 30 ms, twice in a row
//   a window at or under the threshold resets the count; the tier never goes back up
//   a lost context goes straight to off and is not re-enabled when it is restored

export const WINDOW = 90
export const THRESHOLD_MS = Object.freeze({ high: 25, low: 30 })
export const STRIKES = 2

const NEXT = Object.freeze({ high: 'low', low: 'off' })

export const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = sorted.length >> 1
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

/**
 * The pure core. push(frameMs) feeds one frame; it returns { from, to, median } when the tier
 * just dropped, else null. lost() drops to 'off' immediately. tier() reads the current tier.
 */
export function createGovernor({ tier = 'high', window: size = WINDOW, strikes = STRIKES } = {}) {
  let current = tier
  let frames = []
  let bad = 0

  const drop = (to, med = null) => {
    const from = current
    current = to
    frames = []
    bad = 0
    return { from, to, median: med }
  }

  return {
    tier: () => current,
    push(frameMs) {
      if (current === 'off' || !Number.isFinite(frameMs)) return null
      frames.push(frameMs)
      if (frames.length < size) return null
      const med = median(frames)
      frames = []
      if (med > THRESHOLD_MS[current]) {
        bad += 1
        return bad >= strikes ? drop(NEXT[current], med) : null
      }
      bad = 0
      return null
    },
    lost: () => (current === 'off' ? null : drop('off')),
  }
}

/**
 * Thin timer: measures rAF deltas while the tab is visible and feeds the core. On a drop it
 * writes data-tier and calls onDrop({ from, to, median }). Returns { stop, lost }.
 * Hidden-tab gaps and long stalls (over 250 ms) are not counted as frames.
 */
export function startGovernor({ tier = 'high', onDrop } = {}) {
  const gov = createGovernor({ tier })
  if (typeof requestAnimationFrame === 'undefined') return { stop: () => {}, lost: () => {}, governor: gov }
  let id = 0
  let last = 0
  const apply = (change) => {
    if (!change) return
    setTier(change.to)
    onDrop?.(change)
  }
  const loop = (now) => {
    if (last && !document.hidden) {
      const dt = now - last
      if (dt < 250) apply(gov.push(dt))
    }
    last = document.hidden ? 0 : now
    id = requestAnimationFrame(loop)
  }
  id = requestAnimationFrame(loop)
  return {
    governor: gov,
    stop: () => cancelAnimationFrame(id),
    lost: () => apply(gov.lost()),
  }
}
