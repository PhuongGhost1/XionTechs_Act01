// Pure geometry for the illustrative agent diagram (sheet 06, project 2). Two hand-placed layouts of the
// same six nodes: `wide` reads left to right (md and up), `tall` is a vertical system for phones. Nothing
// here is a measurement of a real system: the whole drawing is illustrative and is drawn dashed.
//
// Coordinates are SVG user units; the SVG scales uniformly to its container, so a unit is about a CSS pixel
// (wide: container >= 700 px, tall: container ~ 320-440 px). All edges are orthogonal polylines.

// The six nodes of content.work.agents.flow, in the same order. Index i of `flow` is node FLOW_IDS[i].
export const FLOW_IDS = ['request', 'agent', 'decision', 'business', 'human', 'done']

// The horizontal drawing needs a container of about 700 px or more to keep its 11 px labels at 11 px. With the
// sheet's own margins that is a viewport of 900 px; below that the vertical system is drawn instead.
export const WIDE_QUERY = '(min-width: 900px)'

const box = (id, x, y, w, h) => ({ id, shape: 'box', x, y, w, h })
const diamond = (id, x, y, w, h) => ({ id, shape: 'diamond', x, y, w, h })
const gate = (id, x, y, w, h) => ({ id, shape: 'gate', x, y, w, h })

export const layouts = {
  wide: {
    key: 'wide',
    w: 700,
    h: 330,
    nodes: [
      box('request', 12, 68, 100, 56),
      box('agent', 144, 68, 100, 56),
      diamond('decision', 276, 50, 124, 92),
      box('business', 472, 68, 116, 56),
      gate('human', 262, 248, 152, 64),
      box('done', 620, 68, 68, 56),
    ],
    edges: [
      { id: 'request-agent', from: 'request', to: 'agent', points: [[112, 96], [144, 96]] },
      { id: 'agent-decision', from: 'agent', to: 'decision', points: [[244, 96], [276, 96]] },
      { id: 'decision-business', from: 'decision', to: 'business', points: [[400, 96], [472, 96]], label: 'routine' },
      { id: 'business-done', from: 'business', to: 'done', points: [[588, 96], [620, 96]] },
      { id: 'decision-human', from: 'decision', to: 'human', points: [[338, 142], [338, 248]], label: 'judgment' },
      { id: 'human-business', from: 'human', to: 'business', points: [[414, 280], [530, 280], [530, 124]], label: 'approved' },
    ],
    // Text next to an edge. `x`, `y` are the anchor; `anchor` is the SVG text-anchor.
    labels: [
      { key: 'routine', x: 436, y: 82, anchor: 'middle' },
      { key: 'judgment', x: 350, y: 198, anchor: 'start' },
      { key: 'approved', x: 472, y: 267, anchor: 'middle' },
    ],
    // The one yellow marker travels this path: through the decision, out to the person, back to the system.
    signal: [[62, 96], [338, 96], [338, 280], [530, 280], [530, 96], [654, 96]],
  },
  tall: {
    key: 'tall',
    w: 312,
    h: 538,
    nodes: [
      box('request', 115, 8, 150, 48),
      box('agent', 115, 92, 150, 48),
      diamond('decision', 125, 176, 130, 86),
      gate('human', 115, 298, 150, 64),
      box('business', 115, 398, 150, 48),
      box('done', 115, 482, 150, 48),
    ],
    edges: [
      { id: 'request-agent', from: 'request', to: 'agent', points: [[190, 56], [190, 92]] },
      { id: 'agent-decision', from: 'agent', to: 'decision', points: [[190, 140], [190, 176]] },
      { id: 'decision-human', from: 'decision', to: 'human', points: [[190, 262], [190, 298]], label: 'judgment' },
      { id: 'human-business', from: 'human', to: 'business', points: [[190, 362], [190, 398]], label: 'approved' },
      { id: 'business-done', from: 'business', to: 'done', points: [[190, 446], [190, 482]] },
      { id: 'decision-business', from: 'decision', to: 'business', points: [[125, 219], [40, 219], [40, 422], [115, 422]], label: 'routine' },
    ],
    labels: [
      { key: 'judgment', x: 202, y: 284, anchor: 'start' },
      { key: 'approved', x: 202, y: 384, anchor: 'start' },
      { key: 'routine', x: 50, y: 322, anchor: 'start' },
    ],
    signal: [[190, 32], [190, 506]],
  },
}

export const nodeOf = (layout, id) => layout.nodes.find((n) => n.id === id)

// The order the drawing plots itself in: along the signal's path, then the bypass last.
export const DRAW_ORDER = {
  nodes: ['request', 'agent', 'decision', 'human', 'business', 'done'],
  edges: ['request-agent', 'agent-decision', 'decision-human', 'human-business', 'business-done', 'decision-business'],
}

// ------------------------------------------------------------------ polylines
export const polyD = (points) => points.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ')

export function polyLength(points) {
  let total = 0
  for (let i = 1; i < points.length; i += 1) {
    total += Math.abs(points[i][0] - points[i - 1][0]) + Math.abs(points[i][1] - points[i - 1][1])
  }
  return total
}

/** The polyline without its last `by` units (orthogonal segments only), so the line stops at the arrowhead's base. */
export function trimEnd(points, by) {
  const out = points.map((p) => [...p])
  let left = by
  for (let i = out.length - 1; i > 0 && left > 0; i -= 1) {
    const [x0, y0] = out[i - 1]
    const [x1, y1] = out[i]
    const len = Math.abs(x1 - x0) + Math.abs(y1 - y0)
    if (len > left) {
      const t = (len - left) / len
      out[i] = [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t]
      return out
    }
    left -= len
    out.pop()
  }
  return out
}

/** Direction of the last segment as a unit vector. */
export function endDirection(points) {
  const [x0, y0] = points[points.length - 2]
  const [x1, y1] = points[points.length - 1]
  return [Math.sign(x1 - x0), Math.sign(y1 - y0)]
}

/** A small triangle whose tip is the last point of the polyline. */
export function arrowHead(points, len = 11, half = 4.5) {
  const [tx, ty] = points[points.length - 1]
  const [dx, dy] = endDirection(points)
  const bx = tx - dx * len
  const by = ty - dy * len
  // perpendicular
  const px = -dy
  const py = dx
  return `M${tx} ${ty} L${bx + px * half} ${by + py * half} L${bx - px * half} ${by - py * half} Z`
}

// ------------------------------------------------------------------ text
const TITLE_CHAR = 7.6 // estimated width of one 13px condensed bold uppercase character
const MONO_CHAR = 7.3 // estimated width of one 11px mono uppercase character with tracking

export const titleWidth = (text) => text.length * TITLE_CHAR
export const monoWidth = (text) => text.length * MONO_CHAR

/** Width available for a title: a diamond is only wide at its middle, where the text sits. */
export const usableWidth = (node) => (node.shape === 'diamond' ? node.w * 0.8 - 14 : node.w - 20)

/** Node title as one line, or one line per word when it would not fit the node. */
export function nodeLines(label, node) {
  return titleWidth(label) <= usableWidth(node) ? [label] : label.split(' ')
}

export const rectOf = (n) => ({ x0: n.x, y0: n.y, x1: n.x + n.w, y1: n.y + n.h })
