import { contact, displayName, recordById, records, serviceById, services } from '../content/index.js'
import { setBrief } from './attributes.js'

// The brief: what the visitor selects while reading becomes the email they send (doc 4.9).
// A tiny external store (useSyncExternalStore friendly, see hooks.js useBrief). Nothing is
// persisted and nothing leaves the page: the only output is a mailto: URL or text to copy.
//
// Selection API: toggleService(id), toggleRecord(id), has(id), count(), items(), clear().
// Output API (pure): buildMailto({ note }), buildText({ note }), buildBody({ note }).
// Each builder accepts an optional `items` (the shape items() returns) so tests need no store.

/** The mailto: URL and the copied text are capped near this many characters. */
export const MAX_LENGTH = 1800

const mail = contact.mail
const EMAIL = contact.endpoints.find((e) => e.kind === 'email').text

// ---------------------------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------------------------

let snapshot = Object.freeze({ services: Object.freeze([]), records: Object.freeze([]) })
const listeners = new Set()

function commit(next) {
  snapshot = Object.freeze({ services: Object.freeze(next.services), records: Object.freeze(next.records) })
  setBrief(snapshot.services.length + snapshot.records.length)
  listeners.forEach((fn) => fn())
}

function toggle(list, id) {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id]
}

/** For useSyncExternalStore. */
export const subscribe = (fn) => {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
export const getSnapshot = () => snapshot

/** Adds or removes a service from the brief. Unknown ids are ignored. Returns whether it is now in. */
export function toggleService(id) {
  if (!serviceById(id)) return false
  commit({ ...snapshot, services: toggle(snapshot.services, id) })
  return snapshot.services.includes(id)
}

/** Adds or removes a record ("I looked at: StaffXP"). Unknown ids are ignored. */
export function toggleRecord(id) {
  if (!recordById(id)) return false
  commit({ ...snapshot, records: toggle(snapshot.records, id) })
  return snapshot.records.includes(id)
}

export const has = (id) => snapshot.services.includes(id) || snapshot.records.includes(id)
export const count = () => snapshot.services.length + snapshot.records.length
export const clear = () => commit({ services: [], records: [] })

/**
 * The selection, in content order (stable, whatever order the visitor clicked in):
 * [{ kind: 'service' | 'record', id, label }]
 */
export function items() {
  const picked = new Set([...snapshot.services, ...snapshot.records])
  return [
    ...services().filter((s) => picked.has(s.id)).map((s) => ({ kind: 'service', id: s.id, label: s.label })),
    ...records.filter((r) => picked.has(r.id)).map((r) => ({ kind: 'record', id: r.id, label: displayName(r) })),
  ]
}

// ---------------------------------------------------------------------------------------------
// Pure builders
// ---------------------------------------------------------------------------------------------

const wellFormed = (s) => (typeof s.toWellFormed === 'function' ? s.toWellFormed() : s)
const encode = (s) => encodeURIComponent(wellFormed(s))
const crlf = (s) => s.replace(/\r?\n/g, '\r\n')

/**
 * Cuts `text` (by code points, never inside a surrogate pair) so that `measure(result)` is at
 * most `max`, appending the truncation marker. Returns `text` untouched when it already fits.
 */
export function fitText(text, max, marker, measure = (s) => s.length) {
  if (measure(text) <= max) return text
  const chars = Array.from(text)
  const build = (n) => `${chars.slice(0, n).join('').trimEnd()} ${marker}`
  let lo = 0
  let hi = chars.length
  // Largest n whose cut still fits. Length grows with n, so a binary search is exact.
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2)
    if (measure(build(mid)) <= max) lo = mid
    else hi = mid - 1
  }
  return build(lo)
}

/** The body of the email: greeting, intro, the selection, then the visitor's own words. */
export function buildBody({ note = '', items: selected = items() } = {}) {
  const services = selected.filter((i) => i.kind === 'service')
  const looked = selected.filter((i) => i.kind === 'record')
  const parts = [mail.greeting.text, '', mail.intro.text]
  if (services.length) parts.push('', mail.servicesHeading.text, ...services.map((i) => `- ${i.label}`))
  if (looked.length) parts.push('', mail.recordsHeading.text, ...looked.map((i) => `- ${i.label}`))
  const trimmed = note.trim()
  // The note goes last, so that when the cap bites it is the visitor's own words that are cut,
  // never the selection.
  if (trimmed) parts.push('', mail.noteHeading.text, trimmed)
  return parts.join('\n')
}

/**
 * A mailto: URL for the current brief (or for `items`), subject "Project enquiry", the body
 * encoded with CRLF line breaks, at most MAX_LENGTH characters in total.
 */
export function buildMailto({ note = '', items: selected } = {}) {
  const head = `mailto:${EMAIL}?subject=${encode(mail.subject.text)}&body=`
  const body = fitText(crlf(buildBody({ note, items: selected })), MAX_LENGTH - head.length, mail.truncated.text, (s) =>
    encode(s).length,
  )
  return head + encode(body)
}

/** Plain text for COPY TEXT: To, Subject, a blank line, the body. At most MAX_LENGTH characters. */
export function buildText({ note = '', items: selected } = {}) {
  const head = `To: ${EMAIL}\nSubject: ${mail.subject.text}\n\n`
  return head + fitText(buildBody({ note, items: selected }), MAX_LENGTH - head.length, mail.truncated.text)
}

// Reflect the empty brief on <html> from the start (no-op without a document).
setBrief(0)
