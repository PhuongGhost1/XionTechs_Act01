// Focus trap arithmetic for the full-screen menu (doc 4.9, 10.2). Pure: given where focus is in
// the list of focusable controls, say where Tab or Shift+Tab must go. null means "let the
// browser do its normal thing".
//
//   index    position of the focused control in the list, -1 when focus is outside the list
//   length   how many focusable controls the trap holds
//   shift    true for Shift+Tab

export function trapTarget(index, length, shift) {
  if (!(length > 0)) return null
  if (index < 0) return shift ? length - 1 : 0
  if (shift && index === 0) return length - 1
  if (!shift && index === length - 1) return 0
  return null
}

/** The selector of everything the keyboard can reach. */
export const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** The visible focusable controls inside `root`, in DOM order (a hidden control is never a stop). */
export function focusablesIn(root) {
  if (!root) return []
  return [...root.querySelectorAll(FOCUSABLE)].filter((el) => el.getClientRects().length > 0)
}

/** Handles a Tab keydown for a trap around `root`. Returns true if it moved focus itself. */
export function handleTrapTab(event, root) {
  const nodes = focusablesIn(root)
  const target = trapTarget(nodes.indexOf(document.activeElement), nodes.length, event.shiftKey)
  if (target === null) return false
  event.preventDefault()
  nodes[target].focus()
  return true
}

/**
 * Makes the page behind a modal layer unreachable (the inert attribute, which also hides it from
 * assistive tech). `selectors` are the page regions; returns a function that undoes it.
 */
export function inertBehind(selectors) {
  if (typeof document === 'undefined') return () => {}
  const els = [...document.querySelectorAll(selectors.join(','))]
  const before = els.map((el) => el.hasAttribute('inert'))
  els.forEach((el) => el.setAttribute('inert', ''))
  return () => els.forEach((el, i) => !before[i] && el.removeAttribute('inert'))
}
