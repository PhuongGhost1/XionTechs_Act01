// The arm of the X that is "selected" (0 CODE NW, 1 AI NE, 2 CLOUD SE, 3 PRODUCT SW), shared by
// the hero tags and the DEPLOY instrument. A plain module store, no React and no DOM, so the
// hero can ask for an arm before DEPLOY has scrolled into view, and the core scene (core/three)
// can read the live arm without importing a component.
//
//   requestArm(i)      the hero asked: "show me this arm in DEPLOY" (a tag was clicked)
//   getRequest()       { arm, seq } of the last request, or null. `seq` changes on every call, so
//                      asking twice for the same arm still counts.
//   publishArm(i)      DEPLOY reports the arm that is lit now (row in view, focus, click, request)
//   getArm()           the lit arm, or -1 before DEPLOY has reported one
//   subscribe*(fn)     listener sets, each returns its unsubscribe

export const ARM_COUNT = 4

let request = null
let lit = -1
const requestListeners = new Set()
const armListeners = new Set()

export const clampArm = (i) => (Number.isInteger(i) && i >= 0 && i < ARM_COUNT ? i : -1)

export function requestArm(arm) {
  const next = clampArm(arm)
  if (next < 0) return
  request = { arm: next, seq: (request?.seq ?? 0) + 1 }
  requestListeners.forEach((fn) => fn(request))
}

export const getRequest = () => request

export function subscribeRequest(fn) {
  requestListeners.add(fn)
  return () => requestListeners.delete(fn)
}

export function publishArm(arm) {
  const next = clampArm(arm)
  if (next === lit) return
  lit = next
  armListeners.forEach((fn) => fn(lit))
}

export const getArm = () => lit

export function subscribeArm(fn) {
  armListeners.add(fn)
  return () => armListeners.delete(fn)
}
