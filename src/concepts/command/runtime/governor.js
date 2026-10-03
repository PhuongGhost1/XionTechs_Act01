import { setTier } from '../contract/attributes.js'

// FPS governor (doc 6.2): a session can only get cheaper, never richer, and it needs sustained
// evidence to do so. The core is pure hysteresis, driven by frame times; the glue around it is fed
// by the WebGL render loop.
//
//   high -> low   median frame time over 90 frames above 25 ms, twice in a row
//   low  -> off   median frame time over 90 frames above 30 ms, twice in a row
//   a window at or under the threshold resets the count; the tier never goes back up
//   a lost context goes straight to off and is not re-enabled when it is restored
//
// What counts as a frame: ONLY an interval between two consecutive frames the core itself drew
// (createCore's 'frame' event). Frames of the page that WebGL did not draw (DOM jank, an idle
// loop, a hidden tab) say nothing about WebGL, and a display that is capped at 30 Hz (power saver,
// a throttled background window, a 30 Hz panel) would otherwise be blamed on it for good:
//   - a window whose frames sit tightly around 33.3 ms is a refresh cap, not load: it is ignored
//     (no strike, and no reset either, since it says nothing about the real cost);
//   - gaps over 250 ms (stalls, a tab that was hidden) are not frames.

export const WINDOW = 90
export const THRESHOLD_MS = Object.freeze({ high: 25, low: 30 })
export const STRIKES = 2
/** Frame intervals of a 30 Hz cap: 33.3 ms, with room for timer rounding. */
export const CAP_30HZ_MS = Object.freeze({ min: 32, max: 35 })
/** Share of a window that must sit in the 30 Hz band for the window to count as a cap. */
export const CAP_SHARE = 0.8
/** A gap this long is a stall or a hidden tab, not a frame. */
export const STALL_MS = 250

const NEXT = Object.freeze({ high: 'low', low: 'off' })

export const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = sorted.length >> 1
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

/** True when most of a window is a steady 30 Hz (a refresh cap, which is not WebGL's doing). */
export function looksCapped(values) {
  if (!values.length) return false
  const inBand = values.filter((v) => v >= CAP_30HZ_MS.min && v <= CAP_30HZ_MS.max).length
  return inBand / values.length >= CAP_SHARE
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
      const window = frames
      frames = []
      if (looksCapped(window)) return null
      const med = median(window)
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
 * Glue between the core and the pure governor. The render loop calls frame(intervalMs) once per
 * frame it drew, with the time since the previous frame it drew (and nothing for the first frame
 * after a stop). On a drop it writes data-tier and calls onDrop({ from, to, median }).
 * Returns { frame, lost, stop, governor }. No timer of its own: it cannot see frames it did not draw.
 */
export function startGovernor({ tier = 'high', onDrop } = {}) {
  const gov = createGovernor({ tier })
  let stopped = false
  const apply = (change) => {
    if (!change) return
    setTier(change.to)
    onDrop?.(change)
  }
  return {
    governor: gov,
    frame(intervalMs) {
      if (stopped || !(intervalMs > 0) || intervalMs >= STALL_MS) return
      if (typeof document !== 'undefined' && document.hidden) return
      apply(gov.push(intervalMs))
    },
    stop() {
      stopped = true
    },
    lost: () => apply(gov.lost()),
  }
}
