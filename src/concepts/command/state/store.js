// Two pieces of shared state, on purpose:
//   store  discrete values (section, paused, quality...). Subscribers are notified only when the
//          selected value changes, so React state is touched a few times per visit, never per frame.
//   live   a plain mutable object the animation loops read every frame (pointer, scroll progress).
//          Writing to it notifies nobody; there is no re-render and no coupling between the DOM
//          sections and the canvas beyond these field names.

export function createStore(initial) {
  let state = initial
  const listeners = new Set()
  return {
    get: () => state,
    set(patch) {
      const next = typeof patch === 'function' ? patch(state) : patch
      const prev = state
      state = { ...state, ...next }
      for (const l of listeners) l(state, prev)
    },
    // Calls `fn(value, prevValue)` when `selector(state)` changes. Returns an unsubscribe function.
    subscribe(selector, fn) {
      const l = (s, p) => {
        const v = selector(s)
        const pv = selector(p)
        if (!Object.is(v, pv)) fn(v, pv)
      }
      listeners.add(l)
      return () => listeners.delete(l)
    },
  }
}

export const store = createStore({
  section: 'boot', // id of the section being read
  reducedMotion: false,
  paused: false, // visitor pressed Pause Motion
  quality: 'pending', // 'pending' | 'high' | 'low' | 'static'; the hero scene decides
  activeModule: 'software',
  sectionsSeen: ['boot'], // the build counter counts these
})

export const live = {
  pointerX: 0, // -1..1 across the viewport
  pointerY: 0,
  hero: 0, // 0..1 progress through the hero's sticky stage
  split: 0, // hero progress that drives the X's arms apart
  page: 0, // 0..1 progress through the whole page
  flowBoost: 0, // 0 idle .. 1 CTA hovered; the scene eases toward it
  pulseModule: null, // module id whose arm should pulse (set while a bay is hovered)
}

export function motionMode(s) {
  return s.reducedMotion ? 'reduced' : s.paused ? 'paused' : 'full'
}
