// Pure helpers for the Selected Work showcases (tested in StoryMotion.test.js). Components only
// render what these return.

// One small state machine per showcase (MOTION §29). `auto` is the step the section highlights by
// itself (StaffXP's one-time tour, ESS's scroll position), `preview` follows the visitor's pointer
// or keyboard focus, `pinned` is a region the visitor clicked. The visitor always wins.
export const spotlightInit = { auto: -1, preview: null, pinned: null, touched: false }

export function spotlightReducer(state, action) {
  switch (action.type) {
    case 'auto': {
      // A one-time tour stops for good once the visitor has interacted.
      const index = action.yieldToUser && state.touched ? -1 : action.index
      return index === state.auto ? state : { ...state, auto: index }
    }
    case 'preview':
      if (action.id === state.preview) return state
      return { ...state, preview: action.id, touched: state.touched || action.id != null }
    case 'pin':
      return { ...state, pinned: state.pinned === action.id ? null : action.id, touched: true }
    default:
      return state
  }
}

export function activeSpot(state, ids) {
  return state.preview ?? state.pinned ?? ids[state.auto] ?? null
}

// Pointer hover previews (mouse and pen only: a tap fires enter and leave around itself), focus
// previews too, and a click pins or unpins. Spread onto every control that points at a region.
export function spotHandlers(dispatch, id) {
  return {
    onPointerEnter: (e) => e.pointerType !== 'touch' && dispatch({ type: 'preview', id }),
    onPointerLeave: (e) => e.pointerType !== 'touch' && dispatch({ type: 'preview', id: null }),
    onFocus: () => dispatch({ type: 'preview', id }),
    onBlur: () => dispatch({ type: 'preview', id: null }),
    onClick: () => dispatch({ type: 'pin', id }),
  }
}

// ESS: the area the scroll position points at. `p` is useScrollProgress's 0..1 through the
// viewport; the areas share the stretch where the screen is comfortably on screen.
export function areaAtProgress(p, count, from = 0.3, to = 0.7) {
  if (count <= 0) return -1
  const t = (p - from) / (to - from)
  return Math.min(count - 1, Math.max(0, Math.floor(t * count)))
}

// StaffXP hotspot label: it opens toward the centre of the screen so it stays inside the frame,
// and sits above its box unless the box starts at the top of the screen.
export function chipPlacement(box) {
  return { align: box.x + box.w / 2 > 50 ? 'right' : 'left', inside: box.y < 12 }
}

// "15%" for CSS and SVG positions given in % of the screenshot.
export const pct = (v) => `${v}%`
