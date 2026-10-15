// Geometry and state for the What We Build band visuals (MOTION §7, §22, §29). Pure, so it is
// tested in SolutionsMotion.test.js; the components only render what these return. Timing lives
// in SolutionsVisual.css; the components pass it indices only.

// Every visual is drawn in the same 8:5 canvas (SVG user units, or % of it for the HTML layers).
export const VIEW = { w: 240, h: 150 }

export const KINDS = ['flow', 'layers', 'stack']

// AI agents: one signal travels Request → Agent → Decision → Action along a straight line.
// The step before the last is the decision; a faint branch from it is the route not taken.
const FLOW = { x0: 32, x1: 208, y: 76, labelY: 50 }
const round = (v) => Math.round(v * 10) / 10

export function flowLayout(steps) {
  const last = steps.length - 1
  const nodes = steps.map((label, i) => ({
    label,
    i,
    x: round(FLOW.x0 + ((FLOW.x1 - FLOW.x0) * i) / last),
    y: FLOW.y,
    shape: i === 0 ? 'dot' : i === 1 ? 'core' : i === last ? 'square' : 'diamond',
  }))
  const decision = nodes[last - 1]
  return {
    nodes,
    last,
    y: FLOW.y,
    labelY: FLOW.labelY,
    x0: FLOW.x0,
    x1: FLOW.x1,
    inlet: { x1: 8, x2: FLOW.x0 - 8 },
    branch: { x1: decision.x, y1: FLOW.y + 10, x2: decision.x + 22, y2: FLOW.y + 36 },
  }
}

// Business software: three abstract product frames (no text, no data) that slide from loose
// offsets into an even cascade. Positions are % of the canvas; `z` is depth in px; `from` is
// the offset they enter from; `spread` is how far they part on a replay.
export const LAYERS = {
  w: 56,
  h: 58,
  frames: [
    { content: 'grid', left: 8, top: 9, z: 0, from: [-18, 6], spread: [-5, -4] },
    { content: 'rows', left: 20, top: 21, z: 16, from: [16, -8], spread: [0, 0] },
    { content: 'app', left: 32, top: 33, z: 32, from: [-12, 14], spread: [5, 4] },
  ],
}

// Engineering teams: architecture blocks stack top-down in the order given (Frontend → API →
// Cloud → Integration), each one a little wider, joined by a spine on the left.
const STACK = { spineX: 20, x: 42, h: 22, gap: 8, depth: 4, w0: 124, dw: 20 }

export function stackLayout(steps) {
  const n = steps.length
  const total = n * STACK.h + (n - 1) * STACK.gap + STACK.depth
  const top = (VIEW.h - total) / 2
  const slabs = steps.map((label, i) => {
    const y = top + i * (STACK.h + STACK.gap)
    return { label, i, x: STACK.x, y, w: STACK.w0 + i * STACK.dw, h: STACK.h, cy: y + STACK.h / 2 }
  })
  return {
    slabs,
    last: n - 1,
    depth: STACK.depth,
    spine: { x: STACK.spineX, y1: slabs[0].cy, y2: slabs[n - 1].cy },
  }
}

// One state machine for the section: which band is "hot" (hovered or holding focus) and how
// many times each band's visual has replayed (the replay count keys a remount, which restarts
// its CSS animations).
export function initialBands(ids) {
  return { hot: null, runs: Object.fromEntries(ids.map((id) => [id, 0])) }
}

export function bandsReducer(state, action) {
  switch (action.type) {
    case 'enter': {
      if (state.hot === action.id) return state
      const runs = action.replay ? { ...state.runs, [action.id]: (state.runs[action.id] ?? 0) + 1 } : state.runs
      return { hot: action.id, runs }
    }
    case 'leave':
      return state.hot === action.id ? { ...state, hot: null } : state
    default:
      return state
  }
}

// What a band's visual shows. `pre` holds the first frame until the band is in view, `enter`
// plays once, `replay` is the subtle hover/focus version, `rest` is the final state with no
// motion (reduced motion).
export function visualMode({ reduced, seen, run }) {
  if (reduced) return 'rest'
  if (run > 0) return 'replay'
  return seen ? 'enter' : 'pre'
}
