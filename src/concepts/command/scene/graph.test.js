import { describe, expect, it } from 'vitest'
import { ARM_COUNT, armNodeIds, buildXGraph, projectToBox, seeded } from './graph'

describe('buildXGraph', () => {
  const graph = buildXGraph()

  it('has a hub plus perArm nodes on each of the four arms', () => {
    expect(graph.nodes).toHaveLength(1 + ARM_COUNT * graph.perArm)
    expect(graph.nodes[0].kind).toBe('hub')
    expect(graph.nodes.filter((n) => n.kind === 'tip')).toHaveLength(ARM_COUNT)
  })

  it('has ids that match positions in the node list', () => {
    graph.nodes.forEach((n, i) => expect(n.id).toBe(i))
  })

  it('keeps every node inside the unit square, with a little depth', () => {
    for (const n of graph.nodes) {
      expect(Math.abs(n.x)).toBeLessThanOrEqual(1.0001)
      expect(Math.abs(n.y)).toBeLessThanOrEqual(1.0001)
      expect(Math.abs(n.z)).toBeLessThanOrEqual(0.35)
    }
  })

  it('puts each arm in its own quadrant: NW, NE, SW, SE', () => {
    const quadrant = (arm) => {
      const tip = graph.nodes.find((n) => n.arm === arm && n.kind === 'tip')
      return [Math.sign(tip.x), Math.sign(tip.y)]
    }
    expect([0, 1, 2, 3].map(quadrant)).toEqual([[-1, 1], [1, 1], [-1, -1], [1, -1]])
  })

  it('refers only to nodes that exist, and never joins a node to itself', () => {
    for (const [a, b] of graph.edges) {
      expect(graph.nodes[a]).toBeDefined()
      expect(graph.nodes[b]).toBeDefined()
      expect(a).not.toBe(b)
    }
  })

  it('is one connected network reachable from the hub', () => {
    const seen = new Set([0])
    const queue = [0]
    while (queue.length) {
      const cur = queue.pop()
      for (const [a, b] of graph.edges) {
        const next = a === cur ? b : b === cur ? a : null
        if (next != null && !seen.has(next)) {
          seen.add(next)
          queue.push(next)
        }
      }
    }
    expect(seen.size).toBe(graph.nodes.length)
  })

  it('is identical on every call', () => {
    expect(buildXGraph()).toEqual(buildXGraph())
  })

  it('has both arm and ring edges', () => {
    const kinds = new Set(graph.edges.map((e) => e[2]))
    expect(kinds).toEqual(new Set(['arm', 'ring']))
  })
})

describe('armNodeIds', () => {
  it('lists an arm without the hub', () => {
    const graph = buildXGraph({ perArm: 5 })
    expect(armNodeIds(graph, 2)).toHaveLength(5)
    expect(armNodeIds(graph, 2)).not.toContain(0)
  })
})

describe('projectToBox', () => {
  it('centres the hub and flips y for SVG', () => {
    const graph = buildXGraph()
    const pts = projectToBox(graph, 400, 300)
    expect(pts[0]).toMatchObject({ x: 200, y: 150 })
    const tipNW = graph.nodes.find((n) => n.arm === 0 && n.kind === 'tip')
    const p = pts[tipNW.id]
    expect(p.x).toBeLessThan(200)
    expect(p.y).toBeLessThan(150) // north is up, so a smaller SVG y
  })
  it('fits the smaller side and honours padding', () => {
    const graph = buildXGraph()
    const pts = projectToBox(graph, 400, 300, 20)
    const xs = pts.map((p) => p.x)
    const ys = pts.map((p) => p.y)
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(19)
    expect(Math.max(...ys)).toBeLessThanOrEqual(281)
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(0)
    expect(Math.max(...xs)).toBeLessThanOrEqual(400)
  })
})

describe('seeded', () => {
  it('repeats for the same seed and differs between seeds', () => {
    const a = seeded(1)
    const b = seeded(1)
    const c = seeded(2)
    expect([a(), a()]).toEqual([b(), b()])
    expect(a()).not.toBe(c())
  })
  it('stays inside 0 and 1', () => {
    const r = seeded(99)
    for (let i = 0; i < 200; i++) {
      const v = r()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })
})
