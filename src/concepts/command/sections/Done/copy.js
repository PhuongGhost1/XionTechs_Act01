// COPY TEXT (M17). The async Clipboard API needs a secure context and a user gesture; a mail
// client link may also fail to open. So the copy has a selection fallback (a hidden textarea and
// execCommand('copy')), and when even that is blocked the caller shows the text selected so the
// visitor can copy it by hand. Every dependency is injectable, so the logic is tested in Node.

/** The duration the label stays COPIED (doc 7.2 M17). */
export const COPIED_MS = 1600

/**
 * Copies `text` through a hidden, selected textarea. Returns true if the browser said it copied.
 * Focus goes back to whatever had it, so a keyboard visitor keeps their place.
 */
export function selectionCopy(text, doc = typeof document === 'undefined' ? null : document) {
  if (!doc?.body || typeof doc.execCommand !== 'function') return false
  const previous = doc.activeElement
  const area = doc.createElement('textarea')
  area.value = text
  area.setAttribute('readonly', '')
  area.setAttribute('aria-hidden', 'true')
  area.tabIndex = -1
  // Off screen but real (display: none cannot be selected). 16 px keeps iOS from zooming.
  Object.assign(area.style, { position: 'fixed', top: '0', left: '0', opacity: '0', fontSize: '16px', pointerEvents: 'none' })
  doc.body.appendChild(area)
  let ok = false
  try {
    area.focus({ preventScroll: true })
    area.select()
    area.setSelectionRange(0, text.length)
    ok = Boolean(doc.execCommand('copy'))
  } catch {
    ok = false
  }
  doc.body.removeChild(area)
  previous?.focus?.({ preventScroll: true })
  return ok
}

/**
 * Tries the Clipboard API, then the selection fallback. Resolves to true or false, never throws.
 * @param {string} text
 * @param {{ clipboard?: { writeText?: (t: string) => Promise<void> } | null, fallback?: (t: string) => boolean }} [deps]
 */
export async function copyText(text, deps = {}) {
  const clipboard = 'clipboard' in deps ? deps.clipboard : typeof navigator === 'undefined' ? null : navigator.clipboard
  const fallback = deps.fallback ?? selectionCopy
  if (typeof clipboard?.writeText === 'function') {
    try {
      await clipboard.writeText(text)
      return true
    } catch {
      // Permission denied or not a secure context: fall through to the selection copy.
    }
  }
  try {
    return Boolean(fallback(text))
  } catch {
    return false
  }
}
