import { HERO_LEG_END } from '../contract/anchors.js'
import { setActive, setStation } from '../contract/attributes.js'
import { FRAME, PHONE_MAX_WIDTH, STATIONS, stationById } from '../contract/stations.js'

// The scroll scalar of the page (doc 6.2, 7.3, 10.4). Native scroll, no hijack: one passive
// scroll listener marks the frame dirty, one rAF turns scrollY into progress, and the results go
// out as a CSS variable (--p, only on the tracks whose CSS reads it: CSS_VAR_TRACKS), data-station / data-active on <html> (through
// contract/attributes.js) and a plain object read by the dock and by the WebGL render loop.
// Nothing here sets React state per frame.
//
// Every value is a PURE FUNCTION of scrollY and the measured track rects, so loading at #line,
// restoring scroll on reload or jumping with the keyboard all land on the correct state. The
// pure functions are exported and unit-tested in scroll.test.js. Layout is measured only on
// resize-like events (ResizeObserver, resize, orientation, fonts.ready); the scroll path reads
// window.scrollY and nothing else.
//
// Hardening (WP1): the scroll path reads window.scrollY and nothing else (viewport size, track
// rects and document height are cached by the measure pass); a hash in the URL waits for
// document.fonts.ready and one layout settle, then scrolls once, and never fights a reload or a
// visitor who already moved; a height-only resize (a phone toolbar) does not re-measure.

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
 *   STANDBY  alpha 1 -> 0.35 over the first HERO_LEG_END of the track (the same leg that carries
 *            the core from the hero anchor to the premise anchor, see contract/anchors.js), so the
 *            dimmed core is on the premise anchor, at 0.35, by the premise stop
 *   PREMISE  alpha holds at 0.35
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

  alpha = lerp(1, 0.35, clamp01(p('standby') / HERO_LEG_END))
  if (p('premise') > 0) alpha = 0.35
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
// More pure helpers (the dock scrubber, the hash landing, the resize policy)
// ---------------------------------------------------------------------------------------------

/** Header height in px for a viewport width (the --header-h token: 48 on phones, 64 from 768). */
export const headerHeightFor = (vw) => (vw <= PHONE_MAX_WIDTH ? FRAME.headerPhone : FRAME.headerDesktop)

/** 0..1 position of the page: scrollY over the largest scrollY the document allows. */
export function pageProgress(scrollY, docHeight, vh) {
  const max = docHeight - vh
  return max > 0 ? clamp01(scrollY / max) : 0
}

/**
 * The scrollY that puts a station at the top of the reading area, exactly where a #hash link
 * lands (the track top just under the fixed header).
 */
export const stationScrollY = (top, header) => Math.max(0, top - header)

/** Station ticks of the scrubber: where each station starts, as a 0..1 fraction of the page. */
export function tickFractions(tops, docHeight, vh, header) {
  const max = docHeight - vh
  return STATIONS.map((s) => {
    const top = tops[s.index]
    if (!Number.isFinite(top) || !(max > 0)) return null
    return clamp01(stationScrollY(top, header) / max)
  })
}

/** The station reached by stepping `dir` (1 or -1) from `index`, clamped to 0..last. */
export const stepStation = (index, dir, last = STATIONS.length - 1) => Math.min(last, Math.max(0, index + dir))

/**
 * Resize policy: only a change of width needs the (layout reading) re-measure. A change of
 * height alone is a phone toolbar sliding in or out: tracks are lvh based, so only the cached
 * viewport height changes.
 */
export const needsRemeasure = (prevWidth, nextWidth) => prevWidth !== nextWidth

/**
 * Whether the page should land on the URL hash after load. A reload or a back/forward step
 * restores the scroll position itself and must not be overridden (doc 10.4: a reload mid-track
 * gives the state it had).
 */
export const shouldLandOnHash = (hash, navigationType) =>
  typeof hash === 'string' && hash.length > 1 && navigationType !== 'reload' && navigationType !== 'back_forward'

/**
 * The scroll position to put back after a reload or a history step, or null. `raw` is what
 * sessionStorage held when the page was left ({ y, w } as JSON); it only applies at the same
 * viewport width, because track heights (and so every y) change with the width.
 */
export function savedScrollY(raw, vw) {
  try {
    const saved = JSON.parse(raw)
    if (!saved || !Number.isFinite(saved.y) || saved.y < 0 || saved.w !== vw) return null
    return saved.y
  } catch {
    return null
  }
}

/**
 * Should the page scroll to `saved`? Not when there is nothing saved, when the browser already
 * restored the position (within 2 px), or when the visitor has already scrolled or typed.
 */
export const needsRestore = (saved, current, moved) =>
  saved !== null && !moved && Math.abs(saved - current) > 2

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
  page: 0, // 0..1 position in the whole document (dock scrubber)
  docHeight: 0,
  tops: [], // document top of each station's track, indexed by station
}

const INDEX_OF = new Map(STATIONS.map((s) => [s.id, s.index]))

/**
 * Tracks whose CSS reads --p (the plateau-shaped progress). A custom property is inherited, so
 * every write restyles the whole subtree below the element: it is written ONLY where a rule
 * needs it. Today that is The Line (line.css: the progress fill and the packet). Any other track
 * opts in with registerTrack(id, el, { cssVar: true }). --p-raw is not written at all: nothing
 * reads it, and state.raw carries the same number for JS.
 */
export const CSS_VAR_TRACKS = Object.freeze(['line'])

const tracks = new Map() // id -> { el, plateaus, mode, cssVar, top, height }
const stationListeners = new Set()
const frameListeners = new Set()
const layoutListeners = new Set()
let running = false
let frame = 0
let observer = null
let stopListening = null
let lastWidth = -1
let writtenStation = -1

/** { station, active, progress, raw, k, alpha, scrollY, vw, vh, page, docHeight, tops }. */
export const getState = () => state

/** For useSyncExternalStore: re-renders only when the station index changes. */
export const subscribeStation = (fn) => {
  stationListeners.add(fn)
  return () => stationListeners.delete(fn)
}
export const getStation = () => state.station

/**
 * Called on every scroll frame with the live state, for things that must follow the scroll
 * without React (the dock scrubber thumb). Keep the callback to a few style writes.
 */
export const subscribeFrame = (fn) => {
  frameListeners.add(fn)
  return () => frameListeners.delete(fn)
}

/** Called after every layout measurement (resize, fonts, a track changing size). */
export const subscribeLayout = (fn) => {
  layoutListeners.add(fn)
  return () => layoutListeners.delete(fn)
}

/** Scrubber ticks for the current layout: one 0..1 fraction (or null) per station. */
export const getTickFractions = () => tickFractions(state.tops, state.docHeight, state.vh, headerHeightFor(state.vw))

function measureTrack(t) {
  const r = t.el.getBoundingClientRect()
  t.top = r.top + window.scrollY
  t.height = r.height
}

// The only function that reads layout. Runs on resize-like events, never on scroll.
function measureAll() {
  for (const t of tracks.values()) measureTrack(t)
  state.vw = window.innerWidth
  state.vh = window.innerHeight
  state.docHeight = document.documentElement.scrollHeight
  lastWidth = state.vw
  state.tops = []
  for (const [id, t] of tracks) {
    const index = INDEX_OF.get(id)
    if (index !== undefined && t.height > 0) state.tops[index] = t.top
  }
  layoutListeners.forEach((fn) => fn())
  invalidate()
}

// Something other than the scroll position changed (layout, a track came or went): the next
// update() must recompute even if scrollY is the same.
let dirty = true

function invalidate() {
  dirty = true
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

// Runs once per scroll burst frame. The ONLY browser read is window.scrollY; everything else
// (tops, heights, viewport, document height) was cached by measureAll.
function update() {
  const scrollY = window.scrollY
  // Already computed for this scroll position (syncScroll ran earlier in this frame): nothing to do.
  if (!dirty && scrollY === state.scrollY) return
  dirty = false
  const { vh } = state
  state.scrollY = scrollY

  for (const [id, t] of tracks) {
    // An unmeasured or collapsed track (display: none) has no progress to report.
    const raw = t.height > 0 ? trackProgress(scrollY, t.top, t.height, vh, t.mode) : 0
    const shaped = plateau(raw, t.plateaus)
    state.raw[id] = raw
    state.progress[id] = shaped
    if (t.cssVar) setVar(t.el, '--p', shaped)
  }

  const { k, alpha } = kAlphaFor(state.raw)
  state.k = k
  state.alpha = alpha
  state.page = pageProgress(scrollY, state.docHeight, vh)

  const station = state.tops.some(Number.isFinite) ? stationAt(scrollY, vh, state.tops) : 0
  const changed = station !== state.station
  state.station = station
  state.active = STATIONS[station].id
  // The attribute setters validate with a regex: only call them when the value moved.
  if (changed || writtenStation !== station) {
    writtenStation = station
    setStation(state.station)
    setActive(state.active)
  }
  frameListeners.forEach((fn) => fn(state))
  if (changed) stationListeners.forEach((fn) => fn())
}

/**
 * Brings the state up to date with the scroll position as of right now, and returns it. For a
 * caller that runs in the same rAF phase as the controller but BEFORE it (the WebGL render loop
 * was queued in the previous frame, the controller's rAF is queued by this frame's scroll event,
 * so it runs after): without this the loop would draw the previous frame's progress during a
 * sustained scroll. The controller's own rAF then finds nothing left to do. One scrollY read; no
 * layout read.
 */
export function syncScroll() {
  if (running && typeof window !== 'undefined' && (dirty || window.scrollY !== state.scrollY)) update()
  return state
}

/**
 * Registers a station's track element. `plateaus` are dwell intervals (see plateau()); `mode`
 * overrides the station's default progress mode; `cssVar` writes --p on the element each frame
 * (default: only for CSS_VAR_TRACKS). Returns the unsubscribe function.
 */
export function registerTrack(id, element, { plateaus = [], mode, cssVar } = {}) {
  const t = {
    el: element,
    plateaus,
    mode: mode ?? stationById(id)?.mode ?? 'pin',
    cssVar: cssVar ?? CSS_VAR_TRACKS.includes(id),
    top: 0,
    height: 0,
  }
  tracks.set(id, t)
  if (typeof window !== 'undefined') {
    // Mount time, not scroll time: a layout read here is fine.
    measureTrack(t)
    const index = INDEX_OF.get(id)
    if (index !== undefined && t.height > 0) state.tops[index] = t.top
    observer?.observe(element)
    invalidate()
  }
  return () => {
    if (tracks.get(id) === t) tracks.delete(id)
    observer?.unobserve(element)
    delete state.raw[id]
    delete state.progress[id]
    const index = INDEX_OF.get(id)
    if (index !== undefined && !tracks.has(id)) delete state.tops[index]
    invalidate()
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
  window.scrollTo({ top: progressToScrollY(p, t.top, t.height, state.vh || window.innerHeight, t.mode), behavior })
  return true
}

/**
 * Scrolls to the start of a station, where a #hash link would land it. Used by the dock
 * scrubber. Returns false when the station has no measured track yet.
 */
export function scrollToStation(index, behavior = 'auto') {
  const top = state.tops[index]
  if (typeof window === 'undefined' || !Number.isFinite(top)) return false
  window.scrollTo({ top: stationScrollY(top, headerHeightFor(state.vw || window.innerWidth)), behavior })
  return true
}

/** Scrolls to a 0..1 position of the whole page (dragging the scrubber). */
export function scrollToPage(p, behavior = 'auto') {
  if (typeof window === 'undefined') return
  const max = Math.max(0, state.docHeight - state.vh)
  window.scrollTo({ top: clamp01(p) * max, behavior })
}

// ---------------------------------------------------------------------------------------------
// Where the page lands (doc 10.4)
// ---------------------------------------------------------------------------------------------

// A single page app renders after the browser has already tried to restore the scroll position,
// at which point the document is still short: on a reload the browser's restoration usually fails
// and the page opens at the top. So the position is remembered (sessionStorage, written when the
// page is hidden or left) and put back once fonts and layout have settled.
//
//   fresh load with #hash   scroll to the hash target once
//   reload, back, forward   scroll to the remembered position, unless the browser already did
//   nothing of the above    leave the page alone
//
// Either way the visitor wins: a wheel, touch, key or pointer event before the settle cancels it.

const SCROLL_KEY = 'xt-scroll'

function rememberScroll() {
  try {
    sessionStorage.setItem(SCROLL_KEY, JSON.stringify({ y: Math.round(window.scrollY), w: window.innerWidth }))
  } catch {
    // Private window: no restore on reload, the browser's own attempt is all there is.
  }
}

function recallScroll() {
  try {
    return savedScrollY(sessionStorage.getItem(SCROLL_KEY), window.innerWidth)
  } catch {
    return null
  }
}

// Module level on purpose: React StrictMode mounts the controller twice in dev, and the page
// must land exactly once.
let landed = false

function land() {
  if (landed || typeof window === 'undefined') return
  landed = true
  const navType = performance.getEntriesByType?.('navigation')?.[0]?.type
  const restoring = navType === 'reload' || navType === 'back_forward'
  const saved = restoring ? recallScroll() : null
  let id = null
  if (shouldLandOnHash(window.location.hash, navType)) {
    try {
      id = decodeURIComponent(window.location.hash.slice(1))
    } catch {
      id = null
    }
  }
  if (saved === null && id === null) return

  // A visitor who already scrolled, typed or tapped has moved on: do not pull them back.
  let moved = false
  const events = ['wheel', 'touchstart', 'keydown', 'pointerdown']
  const note = () => {
    moved = true
  }
  for (const e of events) window.addEventListener(e, note, { passive: true, once: true })

  const settle = () => {
    for (const e of events) window.removeEventListener(e, note)
    if (moved) return
    measureAll()
    if (saved !== null) {
      if (needsRestore(saved, window.scrollY, moved)) window.scrollTo({ top: saved, behavior: 'instant' })
    } else {
      // scroll-margin-top (the header) makes the target land just under the fixed header.
      document.getElementById(id)?.scrollIntoView({ block: 'start', behavior: 'instant' })
    }
    invalidate()
  }
  // Fonts change line breaks and so heights: wait for them, then for one painted layout.
  const fonts = document.fonts?.ready ?? Promise.resolve()
  fonts.then(() => requestAnimationFrame(() => requestAnimationFrame(settle)))
}

/**
 * Starts the controller: one passive scroll listener, resize-like re-measuring, one rAF per
 * scroll burst. Idempotent. Returns stop(). Safe under React StrictMode's double mount.
 */
export function startScroll() {
  if (running || typeof window === 'undefined') return stop
  running = true
  dirty = true
  const onScroll = () => schedule()
  const onLayout = () => measureAll()
  const onResize = () => {
    if (needsRemeasure(lastWidth, window.innerWidth)) measureAll()
    else {
      state.vh = window.innerHeight
      state.docHeight = document.documentElement.scrollHeight
      invalidate()
    }
  }
  const onShow = (e) => e.persisted && measureAll()
  const onHide = () => {
    if (document.visibilityState === 'hidden') rememberScroll()
  }
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('pagehide', rememberScroll)
  document.addEventListener('visibilitychange', onHide)
  window.addEventListener('resize', onResize)
  window.addEventListener('orientationchange', onLayout)
  window.addEventListener('load', onLayout)
  window.addEventListener('pageshow', onShow)
  window.visualViewport?.addEventListener('resize', onResize)
  document.fonts?.ready.then(onLayout)
  if (typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(onLayout)
    for (const t of tracks.values()) observer.observe(t.el)
    // The whole document: a track growing moves every track after it.
    observer.observe(document.body)
  }
  stopListening = () => {
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('resize', onResize)
    window.removeEventListener('orientationchange', onLayout)
    window.removeEventListener('load', onLayout)
    window.removeEventListener('pageshow', onShow)
    window.removeEventListener('pagehide', rememberScroll)
    document.removeEventListener('visibilitychange', onHide)
    window.visualViewport?.removeEventListener('resize', onResize)
    observer?.disconnect()
    observer = null
  }
  measureAll()
  land()
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
