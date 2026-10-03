import { describe, expect, it } from 'vitest'
import { work } from '../content.js'
import { copy } from './copy.js'
import {
  DRAW_ORDER,
  FLOW_IDS,
  arrowHead,
  layouts,
  monoWidth,
  nodeLines,
  nodeOf,
  polyD,
  polyLength,
  rectOf,
  titleWidth,
  trimEnd,
  usableWidth,
} from './agentGraph.js'

const both = Object.values(layouts)

const onBoundary = (n, [x, y]) => {
  const { x0, y0, x1, y1 } = rectOf(n)
  if (n.shape === 'diamond') {
    const cx = (x0 + x1) / 2
    const cy = (y0 + y1) / 2
    return (x === cx && (y === y0 || y === y1)) || (y === cy && (x === x0 || x === x1))
  }
  const inside = x >= x0 && x <= x1 && y >= y0 && y <= y1
  return inside && (x === x0 || x === x1 || y === y0 || y === y1)
}

// Is the axis-aligned segment a-b clear of the rectangle?
const segmentMissesRect = ([ax, ay], [bx, by], r) => {
  const minX = Math.min(ax, bx)
  const maxX = Math.max(ax, bx)
  const minY = Math.min(ay, by)
  const maxY = Math.max(ay, by)
  return maxX <= r.x0 || minX >= r.x1 || maxY <= r.y0 || minY >= r.y1
}

describe('agent flow content', () => {
  it('has the six nodes of the verified flow, in order', () => {
    expect(work.agents.flow).toHaveLength(FLOW_IDS.length)
    for (const layout of both) expect(layout.nodes.map((n) => n.id).sort()).toEqual([...FLOW_IDS].sort())
  })

  it('writes no digits and no em dashes in the illustrative copy', () => {
    const { fig: _fig, ...words } = copy.agents // "Fig. 2" is a figure number, not a claim
    const strings = [...Object.values(words), work.agents.problem, work.agents.architectureNote, work.agents.outcome, work.agents.note]
    for (const s of strings) {
      expect(s).not.toMatch(/\d/)
      expect(s).not.toMatch(/—/)
    }
  })
})

describe.each(both.map((l) => [l.key, l]))('%s layout', (_key, layout) => {
  it('keeps every node inside the canvas and clear of the others', () => {
    for (const n of layout.nodes) {
      const r = rectOf(n)
      expect(r.x0).toBeGreaterThanOrEqual(2)
      expect(r.y0).toBeGreaterThanOrEqual(2)
      expect(r.x1).toBeLessThanOrEqual(layout.w - 2)
      expect(r.y1).toBeLessThanOrEqual(layout.h - 2)
    }
    for (let i = 0; i < layout.nodes.length; i += 1) {
      for (let j = i + 1; j < layout.nodes.length; j += 1) {
        const a = rectOf(layout.nodes[i])
        const b = rectOf(layout.nodes[j])
        const apart = a.x1 + 4 <= b.x0 || b.x1 + 4 <= a.x0 || a.y1 + 4 <= b.y0 || b.y1 + 4 <= a.y0
        expect(apart, `${layout.nodes[i].id} / ${layout.nodes[j].id}`).toBe(true)
      }
    }
  })

  it('draws orthogonal edges that start and end on their nodes', () => {
    expect(layout.edges).toHaveLength(6)
    for (const e of layout.edges) {
      for (let i = 1; i < e.points.length; i += 1) {
        const [ax, ay] = e.points[i - 1]
        const [bx, by] = e.points[i]
        expect(ax === bx || ay === by, `${e.id} segment ${i}`).toBe(true)
      }
      expect(onBoundary(nodeOf(layout, e.from), e.points[0]), `${e.id} start`).toBe(true)
      expect(onBoundary(nodeOf(layout, e.to), e.points[e.points.length - 1]), `${e.id} end`).toBe(true)
    }
  })

  it('routes no edge through a node it does not connect', () => {
    for (const e of layout.edges) {
      for (const n of layout.nodes) {
        if (n.id === e.from || n.id === e.to) continue
        for (let i = 1; i < e.points.length; i += 1) {
          expect(segmentMissesRect(e.points[i - 1], e.points[i], rectOf(n)), `${e.id} crosses ${n.id}`).toBe(true)
        }
      }
    }
  })

  it('fits every node title inside its node', () => {
    work.agents.flow.forEach((label, i) => {
      const node = nodeOf(layout, FLOW_IDS[i])
      const lines = nodeLines(label, node)
      const sub = node.shape === 'gate' ? 1 : 0
      expect(lines.length * 16 + sub * 16, label).toBeLessThanOrEqual(node.h - 12)
      for (const line of lines) expect(titleWidth(line), `${label} / ${line}`).toBeLessThanOrEqual(usableWidth(node))
    })
    const gateNode = layout.nodes.find((n) => n.shape === 'gate')
    expect(monoWidth(copy.agents.gate)).toBeLessThanOrEqual(gateNode.w - 20)
  })

  it('places each edge label on the canvas, clear of every node', () => {
    expect(layout.labels.map((l) => l.key).sort()).toEqual(['approved', 'judgment', 'routine'])
    for (const l of layout.labels) {
      const text = copy.agents[l.key]
      const wd = monoWidth(text)
      const x0 = l.anchor === 'middle' ? l.x - wd / 2 : l.x
      const r = { x0, x1: x0 + wd, y0: l.y - 7, y1: l.y + 7 }
      expect(r.x0).toBeGreaterThanOrEqual(0)
      expect(r.x1).toBeLessThanOrEqual(layout.w)
      for (const n of layout.nodes) {
        const nr = rectOf(n)
        const apart = r.x1 <= nr.x0 || r.x0 >= nr.x1 || r.y1 <= nr.y0 || r.y0 >= nr.y1
        expect(apart, `${l.key} overlaps ${n.id}`).toBe(true)
      }
      // and clear of every edge line
      for (const e of layout.edges) {
        for (let i = 1; i < e.points.length; i += 1) {
          expect(segmentMissesRect(e.points[i - 1], e.points[i], r), `${l.key} touches ${e.id}`).toBe(true)
        }
      }
    }
  })

  it('sends the signal through every node, on the canvas', () => {
    for (const [x, y] of layout.signal) {
      expect(x).toBeGreaterThan(0)
      expect(x).toBeLessThan(layout.w)
      expect(y).toBeGreaterThan(0)
      expect(y).toBeLessThan(layout.h)
    }
    // Every node is touched by some segment of the signal path.
    for (const n of layout.nodes) {
      const r = rectOf(n)
      const hit = layout.signal.slice(1).some((p, i) => !segmentMissesRect(layout.signal[i], p, r))
      expect(hit, `${n.id} is on the signal path`).toBe(true)
    }
    expect(polyLength(layout.signal)).toBeGreaterThan(0)
  })
})

describe('draw order', () => {
  it('covers every node and every edge exactly once, in both layouts', () => {
    for (const layout of both) {
      expect([...DRAW_ORDER.nodes].sort()).toEqual(layout.nodes.map((n) => n.id).sort())
      expect([...DRAW_ORDER.edges].sort()).toEqual(layout.edges.map((e) => e.id).sort())
    }
  })
})

describe('polylines', () => {
  it('measures and writes a path', () => {
    const pts = [[0, 0], [10, 0], [10, 5]]
    expect(polyLength(pts)).toBe(15)
    expect(polyD(pts)).toBe('M0 0 L10 0 L10 5')
  })

  it('trims across a corner without changing the start', () => {
    const pts = [[0, 0], [10, 0], [10, 5]]
    expect(trimEnd(pts, 3)).toEqual([[0, 0], [10, 0], [10, 2]])
    expect(trimEnd(pts, 7)).toEqual([[0, 0], [8, 0]])
    expect(trimEnd(pts, 0)).toEqual(pts)
  })

  it('points the arrowhead along the last segment', () => {
    // tip at (10, 5), heading down: base 9 above, 3.5 either side
    expect(arrowHead([[10, 0], [10, 5]], 9, 3.5)).toBe('M10 5 L6.5 -4 L13.5 -4 Z')
  })
})
