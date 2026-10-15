// Shared scene state for the X data core (docs/concepts/01-command-implementation.md §5).
//
// The DOM sections write to it (a CTA is hovered, the pointer moves, a new section becomes
// active); the WebGL canvas reads it every frame. It is a plain mutable object on purpose:
// per-frame values must never go through React state. Anything that has to re-render React
// (the active section id) is announced through `subscribe`.

// DOM ids of the page's sections, top to bottom. BuildHud and the scene both rely on this order.
export const SECTION_IDS = ['top', 'modules', 'process', 'deployments', 'signals', 'contact']

// Elements the canvas arranges the data core around carry this attribute, e.g.
// <div {...anchorProps('hero')} />. The scene measures them; sections never import the scene.
//   hero                the box the X core occupies in the hero
//   module-1 … module-4 one per capability module, in page order
//   process-1 … process-6 one per process step, in page order
//   deploy              the deployments section's header area (the core becomes a compact chain)
//   final               the box the core converges into (the logo) in the closing section
export const ANCHOR_ATTR = 'data-xcore-anchor'
export const anchorProps = (id) => ({ [ANCHOR_ATTR]: id })

// Idle data flow is 1; a hovered primary CTA asks for FLOW_FAST. The scene eases toward it.
export const FLOW_IDLE = 1
export const FLOW_FAST = 2.6

export const sceneState = {
  flow: FLOW_IDLE, // current multiplier the scene uses (eased by `stepFlow`)
  flowTarget: FLOW_IDLE,
  pointerX: 0, // viewport pointer, -1..1 from the centre
  pointerY: 0,
  section: SECTION_IDS[0], // id of the section that is currently active
  quality: 'pending', // 'pending' | 'high' | 'low' | 'off', set by CommandApp via `detectQuality`
  paused: false, // the visitor paused ambient motion (WCAG 2.2.2); the canvas freezes its clock
}

const listeners = new Set()

export function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function setFlowTarget(value) {
  sceneState.flowTarget = value
}

export function setPointer(x, y) {
  sceneState.pointerX = x
  sceneState.pointerY = y
}

// Pause control for ambient motion. Also marks <html data-motion="paused"> so CSS loops stop.
export function setPaused(value) {
  sceneState.paused = value
  if (typeof document !== 'undefined') {
    if (value) document.documentElement.dataset.motion = 'paused'
    else delete document.documentElement.dataset.motion
  }
  listeners.forEach((fn) => fn(sceneState.section))
}

export function setActiveSection(id) {
  if (id === sceneState.section) return
  sceneState.section = id
  listeners.forEach((fn) => fn(id))
}

// Eases `current` toward `target`; frame-rate independent. `rate` is roughly 1 / seconds-to-settle.
export function stepFlow(current, target, dtSeconds, rate = 6) {
  const k = 1 - Math.exp(-rate * Math.max(0, dtSeconds))
  return current + (target - current) * k
}

// Decides how much of the scene a device gets. `env` is injected so this is testable.
//   off   no WebGL canvas: every section already carries its own static visual
//   low   fewer particles, lower pixel ratio, no pointer follow
//   high  the full scene
export function detectQuality(env) {
  const { reducedMotion, webgl, saveData, deviceMemory, cores, coarsePointer, width } = env
  if (reducedMotion || !webgl || saveData) return 'off'
  if (coarsePointer || width < 768 || (deviceMemory && deviceMemory <= 4) || (cores && cores <= 4)) return 'low'
  return 'high'
}

// Reads the real environment. Browser only.
export function readEnvironment() {
  const nav = typeof navigator === 'undefined' ? {} : navigator
  let webgl = false
  try {
    const probe = document.createElement('canvas')
    webgl = Boolean(probe.getContext('webgl2') || probe.getContext('webgl'))
  } catch {
    webgl = false
  }
  return {
    reducedMotion: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
    webgl,
    saveData: Boolean(nav.connection?.saveData),
    deviceMemory: nav.deviceMemory,
    cores: nav.hardwareConcurrency,
    coarsePointer: window.matchMedia?.('(pointer: coarse)').matches ?? false,
    width: window.innerWidth,
  }
}
