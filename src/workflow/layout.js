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

// `via` routes the edge down a vertical side channel at that x (used by escalation edges that
// skip a card, so the line doesn't run through it).
export function edgePath(from, to, via) {
  const y1 = from.y + NODE_SIZE[from.type][1] / 2
  const y2 = to.y - NODE_SIZE[to.type][1] / 2
  if (via !== undefined) return `M ${from.x} ${y1} V ${y1 + 12} H ${via} V ${y2 - 12} H ${to.x} V ${y2}`
  const mid = (y1 + y2) / 2
  return `M ${from.x} ${y1} V ${mid} H ${to.x} V ${y2}`
}

// Approve / Reject buttons shown on the canvas while a run waits for the visitor.
export const DECISION_SIZE = [160, 30]

export function decisionBox(decision) {
  const [w, h] = DECISION_SIZE
  return { x: decision.buttons.x - w / 2, y: decision.buttons.y - h / 2, w, h }
}

export const pct = (value, total) => `${(value / total) * 100}%`
