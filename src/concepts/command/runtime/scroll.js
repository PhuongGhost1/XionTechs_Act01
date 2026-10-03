import { setActive, setStation } from '../contract/attributes.js'
import { STATIONS, stationById } from '../contract/stations.js'

// The scroll scalar of the page (doc 6.2, 7.3, 10.4). Native scroll, no hijack: one passive
// scroll listener marks the frame dirty, one rAF turns scrollY into progress, and the results go
// out as CSS variables (--p on each track element), data-station / data-active on <html> (through
// contract/attributes.js) and a plain object read by the dock and by the WebGL render loop.
// Nothing here sets React state per frame.
//
// Every value is a PURE FUNCTION of scrollY and the measured track rects, so loading at #line,
// restoring scroll on reload or jumping with the keyboard all land on the correct state. The
// pure functions are exported and unit-tested in scroll.test.js. Layout is measured only on
// resize-like events (ResizeObserver, resize, orientation, fonts.ready); the scroll path reads
// window.scrollY and nothing else.
//
// WP1 hardens this file (hash settle, landscape phones). Keep the exported names.

// ---------------------------------------------------------------------------------------------
// Pure functions
// ---------------------------------------------------------------------------------------------

export const clamp01 = (t) => (Number.isFinite(t) ? (t < 0 ? 0 : t > 1 ? 1 : t) : 0)

/**
 * Progress 0..1 of a track for any scrollY.
 *   'pin'  0 when the track top reaches the viewport top, 1 when its sticky stage is released
 *          (scrollY = top + height - vh). Falls back to 'span' if the track is not taller than
 *          the viewport.
 *   'span' 0 when the track top reaches the viewport top, 1 one track height later.
 */
export function trackProgress(scrollY, trackTop, trackHeight, vh, mode = 'pin') {
  if (![scrollY, trackTop, trackHeight, vh].every(Number.isFinite)) return 0
  const pinSpan = trackHeight - vh
  const denom = mode === 'pin' && pinSpan > 0 ? pinSpan : trackHeight
  if (!(denom > 0)) return scrollY >= trackTop ? 1 : 0
  return clamp01((scrollY - trackTop) / denom)
}

/** Inverse of trackProgress: the scrollY that gives progress `p` (used to scroll to a step). */
export function progressToScrollY(p, trackTop, trackHeight, vh, mode = 'pin') {
  const pinSpan = trackHeight - vh
  const denom = mode === 'pin' && pinSpan > 0 ? pinSpan : trackHeight
  return trackTop + clamp01(p) * Math.max(denom, 0)
}

/**
 * Dwell plateaus. `plateaus` is a list of [from, to] progress intervals (0..1) where the output
 * holds still; the rest of the scroll is stretched so the output still runs 0 to 1, monotonic and
 * continuous. With no plateaus the output equals p. Overlapping intervals are merged.
 */
export function plateau(p, plateaus = []) {
  const x = clamp01(p)
  const spans = plateaus
    .map(([a, b]) => [clamp01(a), clamp01(b)])
    .filter(([a, b]) => b > a)
    .sort((m, n) => m[0] - n[0])
    .reduce((acc, [a, b]) => {
      const last = acc[acc.length - 1]
      if (last && a <= last[1]) last[1] = Math.max(last[1], b)
      else acc.push([a, b])
      return acc
    }, [])
  const total = spans.reduce((sum, [a, b]) => sum + (b - a), 0)
  if (!spans.length || total >= 1) return x
  let held = 0
  for (const [a, b] of spans) {
    if (x <= a) break
    if (x >= b) held += b - a
    else {
      held += x - a
      break
    }
  }
  return clamp01((x - held) / (1 - total))
}

const lerp = (a, b, t) => a + (b - a) * t

/**
 * The scene scalars from the raw progress of every track (doc 6.2):
 *   k      0..4, which layout pair the core shows (L0 X, L1 ARMS, L2 LINE, L3 FIELD, L4 MARK)
 *   alpha  0..1, how visible the whole object is
 * `progress` is { standby, premise, deploy, line, work, ledger, done }, each 0..1. A missing key
 * counts as 0. Tracks are applied in page order and a later track that has started wins.
 *
 *   PREMISE  alpha 1 -> 0.35 over its first half, hold
 *   DEPLOY   k 0 -> 1 over the first third; alpha 0.35 -> 1 over the first 15%
 *   LINE     k 1 -> 2 over the first 15%
 *   WORK     alpha 1 -> 0 over the first 8% (about the first 15% of plate one); k 2 -> 3 across
 *   LEDGER   no 3D: alpha 0, k 3
 *   DONE     alpha 0 -> 1 over 0..0.2, hold to 0.4, k 3 -> 4 over 0.4..0.8, hold to 1
 */
export function kAlphaFor(progress = {}) {
  const p = (id) => clamp01(progress[id] ?? 0)
  let k = 0
  let alpha = 1

  if (p('premise') > 0) alpha = lerp(1, 0.35, clamp01(p('premise') / 0.5))
  if (p('deploy') > 0) {
    k = clamp01(p('deploy') / (1 / 3))
    alpha = lerp(0.35, 1, clamp01(p('deploy') / 0.15))
  }
  if (p('line') > 0) {
    k = 1 + clamp01(p('line') / 0.15)
    alpha = 1
  }
  if (p('work') > 0) {
    k = 2 + p('work')
    alpha = 1 - clamp01(p('work') / 0.08)
  }
  if (p('ledger') > 0) {
    k = 3
    alpha = 0
  }
  if (p('done') > 0) {
    k = 3 + clamp01((p('done') - 0.4) / 0.4)
    alpha = clamp01(p('done') / 0.2)
  }
  return { k, alpha }
}

/**
 * The station index at a scroll position: the last track whose top has passed the viewport
 * midline (scrollY + vh * bias). `tops` is indexed by station; a missing entry is skipped.
 * Falls back to the first station that has a top.
 */
export function stationAt(scrollY, vh, tops, bias = 0.5) {
  const line = scrollY + vh * bias
  let found = -1
  for (let i = 0; i < tops.length; i += 1) {
    if (Number.isFinite(tops[i]) && tops[i] <= line) found = i
  }
  if (found >= 0) return found
  const first = tops.findIndex((t) => Number.isFinite(t))
  return first >= 0 ? first : 0
}

// ---------------------------------------------------------------------------------------------
// Controller
// ---------------------------------------------------------------------------------------------

/** The live state. A plain object mutated in place: read it, never store it in React state. */
const state = {
  station: 0,
  active: STATIONS[0].id,
  progress: {}, // plateau-shaped, 0..1 per track id (what --p carries)
  raw: {}, // unshaped, 0..1 per track id
  k: 0,
  alpha: 1,
  scrollY: 0,
  vw: 0,
  vh: 0,
}

const tracks = new Map() // id -> { el, plateaus, mode, top, height }
const stationListeners = new Set()
let running = false
let frame = 0
let observer = null
let stopListening = null

/** { station, active, progress, raw, k, alpha, scrollY, vw, vh }. See `state` above. */
export const getState = () => state

/** For useSyncExternalStore: re-renders only when the station index changes. */
export const subscribeStation = (fn) => {
  stationListeners.add(fn)
  return () => stationListeners.delete(fn)
}
export const getStation = () => state.station

function measureTrack(t) {
  const r = t.el.getBoundingClientRect()
  t.top = r.top + window.scrollY
  t.height = r.height
}

function measureAll() {
  for (const t of tracks.values()) measureTrack(t)
  schedule()
}

function schedule() {
  if (!running || frame) return
  frame = requestAnimationFrame(() => {
    frame = 0
    update()
  })
}

function setVar(el, name, value) {
  const next = value.toFixed(4)
  if (el.style.getPropertyValue(name) !== next) el.style.setProperty(name, next)
}

function update() {
  const scrollY = window.scrollY
  const vh = window.innerHeight
  state.scrollY = scrollY
  state.vw = window.innerWidth
  state.vh = vh

  const tops = []
  for (const [id, t] of tracks) {
    const raw = trackProgress(scrollY, t.top, t.height, vh, t.mode)
    const shaped = plateau(raw, t.plateaus)
    state.raw[id] = raw
    state.progress[id] = shaped
    setVar(t.el, '--p-raw', raw)
    setVar(t.el, '--p', shaped)
    const index = stationById(id)?.index
    if (index !== undefined) tops[index] = t.top
  }

  const { k, alpha } = kAlphaFor(state.raw)
  state.k = k
  state.alpha = alpha

  const station = tracks.size ? stationAt(scrollY, vh, tops) : 0
  const changed = station !== state.station
  state.station = station
  state.active = STATIONS[station].id
  // The attribute setters skip identical writes, so this is cheap on every frame.
  setStation(state.station)
  setActive(state.active)
  if (changed) stationListeners.forEach((fn) => fn())
}

/**
 * Registers a station's track element. `plateaus` are dwell intervals (see plateau()); `mode`
 * overrides the station's default progress mode. Returns the unsubscribe function.
 */
export function registerTrack(id, element, { plateaus = [], mode } = {}) {
  const t = { el: element, plateaus, mode: mode ?? stationById(id)?.mode ?? 'pin', top: 0, height: 0 }
  tracks.set(id, t)
  if (typeof window !== 'undefined') {
    measureTrack(t)
    observer?.observe(element)
    schedule()
  }
  return () => {
    if (tracks.get(id) === t) tracks.delete(id)
    observer?.unobserve(element)
    delete state.raw[id]
    delete state.progress[id]
    schedule()
  }
}

/** Re-measure now, for content that changed size without a resize (a lazy chunk mounting). */
export const remeasureTracks = () => {
  if (typeof window !== 'undefined') measureAll()
}

/** Scrolls the document to progress `p` of a registered track. Returns false if it is not registered. */
export function scrollToProgress(id, p, behavior = 'auto') {
  const t = tracks.get(id)
  if (!t || typeof window === 'undefined') return false
  window.scrollTo({ top: progressToScrollY(p, t.top, t.height, window.innerHeight, t.mode), behavior })
  return true
}

/**
 * Starts the controller: one passive scroll listener, resize-like re-measuring, one rAF per
 * scroll burst. Idempotent. Returns stop(). Safe under React StrictMode's double mount.
 */
export function startScroll() {
  if (running || typeof window === 'undefined') return stop
  running = true
  const onScroll = () => schedule()
  const onLayout = () => measureAll()
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onLayout)
  window.addEventListener('orientationchange', onLayout)
  window.addEventListener('load', onLayout)
  window.visualViewport?.addEventListener('resize', onLayout)
  document.fonts?.ready.then(onLayout)
  if (typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(onLayout)
    for (const t of tracks.values()) observer.observe(t.el)
  }
  stopListening = () => {
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('resize', onLayout)
    window.removeEventListener('orientationchange', onLayout)
    window.removeEventListener('load', onLayout)
    window.visualViewport?.removeEventListener('resize', onLayout)
    observer?.disconnect()
    observer = null
  }
  measureAll()
  return stop
}

export function stop() {
  if (!running) return
  running = false
  if (frame) cancelAnimationFrame(frame)
  frame = 0
  stopListening?.()
  stopListening = null
}
