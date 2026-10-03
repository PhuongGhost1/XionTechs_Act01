// State on <html> is the single source of truth for the page (doc 11.3 item 3). This file is the
// ONLY writer of these attributes: components, the scroll controller and the stores call the
// setters below and never touch documentElement themselves. CSS reads them
// (html[data-motion='off'] ...), and so does the pre-paint script in concepts/command/index.html
// for data-view and data-motion, which is why the storage keys live here too.
//
//   data-tier     off | low | high      capability + governor
//   data-motion   on | off              MotionToggle, media query
//   data-view     read | raw            ViewToggle, pre-paint script
//   data-station  0..6                  scroll controller
//   data-active   section id            scroll controller
//   data-webgl    drawn (else absent)   CoreCanvas
//   data-brief    count                 brief store
//
// Every setter is a no-op without a document (tests, SSR).

export const ATTR = Object.freeze({
  tier: 'data-tier',
  motion: 'data-motion',
  view: 'data-view',
  station: 'data-station',
  active: 'data-active',
  webgl: 'data-webgl',
  brief: 'data-brief',
})

export const TIERS = Object.freeze(['off', 'low', 'high'])
export const MOTIONS = Object.freeze(['on', 'off'])
export const VIEWS = Object.freeze(['read', 'raw'])

/** localStorage keys, shared with the pre-paint script in index.html. */
export const STORAGE_KEYS = Object.freeze({ view: 'xt-view', motion: 'xt-motion' })

const root = () => (typeof document !== 'undefined' ? document.documentElement : null)

/**
 * Pure: the string to write for an attribute, or null when the value is invalid.
 * `null` as input means "remove the attribute" for data-webgl only.
 */
export function normalise(name, value) {
  switch (name) {
    case ATTR.tier:
      return TIERS.includes(value) ? value : null
    case ATTR.motion:
      return MOTIONS.includes(value) ? value : null
    case ATTR.view:
      return VIEWS.includes(value) ? value : null
    case ATTR.station: {
      const n = Number(value)
      return Number.isInteger(n) && n >= 0 && n <= 6 ? String(n) : null
    }
    case ATTR.active:
      return typeof value === 'string' && /^[a-z][a-z0-9-]*$/.test(value) ? value : null
    case ATTR.webgl:
      return value === 'drawn' ? 'drawn' : null
    case ATTR.brief: {
      const n = Number(value)
      return Number.isInteger(n) && n >= 0 ? String(n) : null
    }
    default:
      return null
  }
}

function write(name, value) {
  const el = root()
  if (!el) return false
  const next = normalise(name, value)
  if (next === null) {
    // Only data-webgl may be cleared; an invalid value for any other attribute is ignored.
    if (name === ATTR.webgl) el.removeAttribute(name)
    return false
  }
  if (el.getAttribute(name) !== next) el.setAttribute(name, next)
  return true
}

export const setTier = (tier) => write(ATTR.tier, tier)
export const setStation = (index) => write(ATTR.station, index)
export const setActive = (id) => write(ATTR.active, id)
export const setBrief = (count) => write(ATTR.brief, count)
/** `true` writes data-webgl="drawn"; `false` removes it (context lost, canvas torn down). */
export const setWebgl = (drawn) => write(ATTR.webgl, drawn ? 'drawn' : null)

/**
 * Sets data-motion. With `persist`, also remembers the choice (try/catch: storage can be
 * blocked, and the page must work without it).
 */
export function setMotion(value, { persist = false } = {}) {
  const ok = write(ATTR.motion, value)
  if (ok && persist) storeWrite(STORAGE_KEYS.motion, value)
  return ok
}

/** Sets data-view. With `persist`, remembers the choice. */
export function setView(value, { persist = false } = {}) {
  const ok = write(ATTR.view, value)
  if (ok && persist) storeWrite(STORAGE_KEYS.view, value)
  return ok
}

/** Reads one attribute from <html>, or null. */
export const readAttr = (name) => root()?.getAttribute(name) ?? null

function storeWrite(key, value) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Private window, blocked site data: the preference simply does not persist.
  }
}

export function storeRead(key) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}
