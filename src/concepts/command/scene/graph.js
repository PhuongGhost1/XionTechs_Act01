// The X data core as a graph (docs/concepts/01-command-implementation.md §5). Pure geometry, no
// three.js and no DOM, so the WebGL scene, the hero's static SVG fallback and the tests all use
// the same shape.
//
// Unit space: x and y run from -1 to 1 (the X spans corner to corner), y points UP, z gives a
// little depth (about ±0.3). Four arms leave a central hub, in reading order:
//   arm 0 north-west -> Software engineering (module-1)
//   arm 1 north-east -> AI systems           (module-2)
//   arm 2 south-west -> Cloud & platform     (module-3)
//   arm 3 south-east -> Product development  (module-4)
// "Hero -> Capabilities: the X data core separates into 4 modules" (CONCEPT §14) is each arm
// travelling to its module's anchor.

export const ARM_COUNT = 4
export const ARM_DIRS = [
  { x: -1, y: 1 }, // 0 north-west
  { x: 1, y: 1 }, // 1 north-east
  { x: -1, y: -1 }, // 2 south-west
  { x: 1, y: -1 }, // 3 south-east
]

// Deterministic pseudo-random numbers (mulberry32), so every render of the graph is identical.
export function seeded(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// kind: 'hub' | 'node' | 'tip'. `level` is 0 at the hub and `perArm` at an arm's tip.
// Edge kind: 'arm' (along an arm) | 'ring' (between neighbouring arms at the same level).
export function buildXGraph({ perArm = 9, ringEvery = 3, seed = 7 } = {}) {
  const rand = seeded(seed)
  const nodes = [{ id: 0, arm: -1, level: 0, kind: 'hub', x: 0, y: 0, z: 0 }]
  const armNodeId = (arm, level) => 1 + arm * perArm + (level - 1)

  for (let arm = 0; arm < ARM_COUNT; arm++) {
    const dir = ARM_DIRS[arm]
    for (let level = 1; level <= perArm; level++) {
      const r = level / perArm
      // A small sideways wobble and a gentle depth wave keep it from looking ruled.
      const wobble = level === perArm ? 0 : (rand() - 0.5) * 0.07 * Math.min(1, r * 2)
      nodes.push({
        id: armNodeId(arm, level),
        arm,
        level,
        kind: level === perArm ? 'tip' : 'node',
        x: dir.x * r + -dir.y * wobble,
        y: dir.y * r + dir.x * wobble,
        z: Math.sin(level * 1.3 + arm * 1.7) * 0.18 + (rand() - 0.5) * 0.08,
      })
    }
  }

  const edges = []
  for (let arm = 0; arm < ARM_COUNT; arm++) {
    edges.push([0, armNodeId(arm, 1), 'arm'])
    for (let level = 1; level < perArm; level++) edges.push([armNodeId(arm, level), armNodeId(arm, level + 1), 'arm'])
  }
  // Neighbouring arms (0-1 across the top, 2-3 across the bottom, 0-2 left, 1-3 right) are joined
  // at every `ringEvery` levels, short of the tips: nested diamonds inside the X. Joining the tips too would
  // draw a square frame round it and hide the X.
  const neighbours = [[0, 1], [1, 3], [3, 2], [2, 0]]
  for (let level = ringEvery; level < perArm; level += ringEvery) {
    for (const [a, b] of neighbours) edges.push([armNodeId(a, level), armNodeId(b, level), 'ring'])
  }

  return { nodes, edges, perArm }
}

// Id of the node at a given level (1 to perArm) on a given arm.
export const armNodeIdOf = (graph, arm, level) => 1 + arm * graph.perArm + (level - 1)

// Maps unit coordinates into a pixel box for 2D drawing (the hero's SVG fallback): the unit
// square is fitted inside `width` x `height` and y is flipped, because SVG's y points down.
export function projectToBox(graph, width, height, padding = 0) {
  const size = Math.min(width, height) - padding * 2
  const cx = width / 2
  const cy = height / 2
  return graph.nodes.map((n) => ({ id: n.id, x: cx + (n.x * size) / 2, y: cy - (n.y * size) / 2, z: n.z }))
}

// Node ids belonging to one arm, hub excluded.
export function armNodeIds(graph, arm) {
  return graph.nodes.filter((n) => n.arm === arm).map((n) => n.id)
}
