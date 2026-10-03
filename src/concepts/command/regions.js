// Pure helpers for the Deployments section (docs/concepts/01-command-implementation.md §8). No DOM,
// so the tab keys, region highlighting and box geometry are tested in node (regions.test.js).

export const pad2 = (n) => String(n).padStart(2, '0')

// Region boxes in content.js are { x, y, w, h } in % of the screenshot.
export const boxStyle = ({ x, y, w, h }) => ({ left: `${x}%`, top: `${y}%`, width: `${w}%`, height: `${h}%` })

// A box's label chip opens toward the centre of the screen, so it never runs past the frame edge.
export const chipSide = (box) => (box.x + box.w / 2 > 50 ? 'right' : 'left')

// WAI-ARIA tabs, vertical list: Up/Down wrap around, Home/End jump. Returns the index to select,
// or null when the key is not a tab key (so the caller leaves the event alone).
export function nextTabIndex(key, current, count) {
  if (count <= 0) return null
  switch (key) {
    case 'ArrowDown':
      return (current + 1) % count
    case 'ArrowUp':
      return (current - 1 + count) % count
    case 'Home':
      return 0
    case 'End':
      return count - 1
    default:
      return null
  }
}

// Which region is lit. `preview` follows the pointer or keyboard focus, `pinned` is a region the
// visitor tapped or clicked. The visitor's hover always wins over a pin.
export const focusInit = { preview: null, pinned: null }

export function focusReducer(state, action) {
  switch (action.type) {
    case 'preview':
      return action.id === state.preview ? state : { ...state, preview: action.id }
    case 'pin': {
      // Unpinning also drops a preview of the same region: on touch browsers the tap that focused
      // the button set it, and no blur follows a second tap, so it would keep the region lit.
      const unpin = state.pinned === action.id
      return {
        pinned: unpin ? null : action.id,
        preview: unpin && state.preview === action.id ? null : state.preview,
      }
    }
    default:
      return state
  }
}

export const activeRegion = (state) => state.preview ?? state.pinned

// Spread onto anything that points at a region. Hover previews for mouse and pen only (a tap fires
// enter and leave around itself), focus previews too, and a click pins or unpins. `reveal` scrolls
// the region into view when the screen is wider than its frame (ESS on a phone).
export function regionHandlers(dispatch, id, reveal) {
  return {
    onPointerEnter: (e) => e.pointerType !== 'touch' && dispatch({ type: 'preview', id }),
    onPointerLeave: (e) => e.pointerType !== 'touch' && dispatch({ type: 'preview', id: null }),
    onFocus: () => {
      dispatch({ type: 'preview', id })
      reveal?.(id)
    },
    onBlur: () => dispatch({ type: 'preview', id: null }),
    onClick: () => {
      dispatch({ type: 'pin', id })
      reveal?.(id)
    },
  }
}

// New scrollLeft that brings a box into a horizontally scrolling frame, or null when it is already
// fully visible. A box narrower than the frame is centred; a wider one is aligned to its left edge.
export function scrollTargetLeft({ boxLeft, boxWidth, viewWidth, scrollLeft, contentWidth }) {
  if (boxLeft >= scrollLeft && boxLeft + boxWidth <= scrollLeft + viewWidth) return null
  const wanted = boxWidth > viewWidth ? boxLeft : boxLeft - (viewWidth - boxWidth) / 2
  return Math.min(Math.max(0, wanted), Math.max(0, contentWidth - viewWidth))
}
