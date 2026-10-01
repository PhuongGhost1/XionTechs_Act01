// Geometry for the workflow canvas. Node x/y are centre points in a fixed 760 × 520 viewBox;
// the canvas scales to its container, and node buttons are positioned in percentages of it.

export const VIEW = { w: 760, h: 520 }

// [width, height] in viewBox units, per node type.
export const NODE_SIZE = {
  trigger: [190, 44],
  agent: [190, 54],
  router: [120, 32],
  human: [190, 54],
  outcome: [190, 50],
}

export function nodeBox(node) {
  const [w, h] = NODE_SIZE[node.type]
  return { x: node.x - w / 2, y: node.y - h / 2, w, h }
}

export function edgePath(from, to) {
  const y1 = from.y + NODE_SIZE[from.type][1] / 2
  const y2 = to.y - NODE_SIZE[to.type][1] / 2
  const mid = (y1 + y2) / 2
  return `M ${from.x} ${y1} V ${mid} H ${to.x} V ${y2}`
}

export const pct = (value, total) => `${(value / total) * 100}%`
