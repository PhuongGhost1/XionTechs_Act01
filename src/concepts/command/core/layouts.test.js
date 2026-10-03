import { describe, expect, it } from 'vitest'
import { content } from '../content/index.js'
import { ARM_ORDER, X_TIPS } from './geometry.js'
import { LAYOUTS, buildGraph } from './graph.js'
import { FIT, KIND, LAYOUT_FNS, LINE_STOPS, buildPool, edgePoint, edgePolyline, layoutFor, linePlan, poolPositions } from './layouts.js'
import { rngFor } from './rng.js'

const graph = buildGraph(content)
const ids = graph.nodes.map((n) => n.id).sort()

describe('layouts', () => {
  it.each(LAYOUTS)('%s places every node id, with no NaN, inside the unit box', (name) => {
    const layout = LAYOUT_FNS[name](graph, rngFor(`test.${name}`))
    expect(Object.keys(layout.pos).sort()).toEqual(ids)
    for (const [id, p] of Object.entries(layout.pos)) {
      expect(p, id).toHaveLength(3)
      for (const v of p) expect(Number.isFinite(v), id).toBe(true)
      expect(p[0], id).toBeGreaterThanOrEqual(0)
      expect(p[0], id).toBeLessThanOrEqual(1)
      expect(p[1], id).toBeGreaterThanOrEqual(0)
      expect(p[1], id).toBeLessThanOrEqual(1)
      expect(Math.abs(p[2]), id).toBeLessThanOrEqual(0.05)
    }
    expect(layout.fit).toBe(FIT[name])
  })

  it('is deterministic for a seed and differs between seeds where it is random', () => {
    for (const name of LAYOUTS) {
      const a = LAYOUT_FNS[name](graph, rngFor('same'))
      const b = LAYOUT_FNS[name](graph, rngFor('same'))
      expect(b.pos).toEqual(a.pos)
    }
    const f1 = LAYOUT_FNS.field(graph, rngFor('one'))
    const f2 = LAYOUT_FNS.field(graph, rngFor('two'))
    expect(f1.pos['svc.cloud']).not.toEqual(f2.pos['svc.cloud'])
  })

  it('puts the hubs of the X exactly on the shared arm tips, so SVG and DOM tags agree', () => {
    const x = layoutFor('x', graph)
    graph.nodes
      .filter((n) => n.kind === 'hub')
      .forEach((hub, i) => {
        const tip = X_TIPS[ARM_ORDER[i]]
        expect(x.pos[hub.id][0]).toBeCloseTo(tip.x, 6)
        expect(x.pos[hub.id][1]).toBeCloseTo(tip.y, 6)
      })
    expect(x.pos.core.slice(0, 2)).toEqual([0.5, 0.5])
  })

  it('collapses onto one line with six stops in L2, and parks the method steps on the core before', () => {
    const line = layoutFor('line', graph)
    expect(LINE_STOPS).toHaveLength(6)
    graph.nodes.filter((n) => n.kind === 'method').forEach((n, i) => expect(line.pos[n.id][0]).toBeCloseTo(LINE_STOPS[i], 6))
    expect(line.pos.core[0]).toBeCloseTo(LINE_STOPS[0], 6)
    for (const p of Object.values(line.pos)) expect(Math.abs(p[1] - 0.5)).toBeLessThan(0.2)
    const x = layoutFor('x', graph)
    expect(x.pos['step.scale'].slice(0, 2)).toEqual([0.5, 0.5])
  })

  it('draws the mark in both tones and keeps the core on the field centre', () => {
    const mark = layoutFor('mark', graph)
    expect(new Set(Object.values(mark.tone))).toEqual(new Set([0, 1]))
    expect(layoutFor('field', graph).pos.core.slice(0, 2)).toEqual([0.5, 0.5])
  })
})

describe('edges', () => {
  it('lines up the braid with the node positions: a hub strand runs core to hub', () => {
    const x = layoutFor('x', graph)
    for (const e of graph.edges.filter((q) => q.kind === 'hub')) {
      for (const side of [-1, 1]) {
        const a = edgePoint(x, graph, e, 0, side)
        const b = edgePoint(x, graph, e, 1, side)
        expect(a[0]).toBeCloseTo(0.5, 6)
        expect(b[0]).toBeCloseTo(x.pos[e.to][0], 6)
        expect(b[1]).toBeCloseTo(x.pos[e.to][1], 6)
      }
    }
  })

  it('has no NaN in any polyline of any layout, and a fixed plan without hub-to-service members', () => {
    const plan = linePlan(graph)
    expect(plan.length).toBeGreaterThan(20)
    expect(plan.some((q) => q.edge.kind === 'member' && graph.byId.get(q.edge.from).kind === 'hub')).toBe(false)
    for (const name of LAYOUTS) {
      const layout = layoutFor(name, graph)
      for (const { edge, side } of plan) for (const v of edgePolyline(layout, graph, edge, side, 8)) expect(Number.isFinite(v)).toBe(true)
    }
  })
})

describe('point pool', () => {
  const pool = buildPool(graph, 1200)

  it('has exactly n points: the nodes first, then structural points on edges', () => {
    expect(pool.n).toBe(1200)
    expect(pool.nodeCount).toBe(39)
    expect(pool.kind[0]).toBe(KIND.core)
    for (let i = 39; i < 1200; i += 1) {
      expect(pool.kind[i]).toBe(KIND.structural)
      expect(pool.edge[i]).toBeGreaterThanOrEqual(0)
    }
    expect(buildPool(graph, 500).n).toBe(500)
  })

  it.each(LAYOUTS)('gives finite positions for all points in %s, inside the box', (name) => {
    const pos = poolPositions(layoutFor(name, graph), graph, pool)
    expect(pos).toHaveLength(1200 * 3)
    for (let i = 0; i < 1200; i += 1) {
      expect(Number.isFinite(pos[i * 3] + pos[i * 3 + 1] + pos[i * 3 + 2])).toBe(true)
      expect(pos[i * 3]).toBeGreaterThanOrEqual(0)
      expect(pos[i * 3]).toBeLessThanOrEqual(1)
      expect(pos[i * 3 + 1]).toBeGreaterThanOrEqual(0)
      expect(pos[i * 3 + 1]).toBeLessThanOrEqual(1)
    }
  })

  it('is deterministic and gives delays in 0..1', () => {
    const again = buildPool(graph, 1200)
    expect(Array.from(again.t.slice(0, 80))).toEqual(Array.from(pool.t.slice(0, 80)))
    expect(Math.max(...pool.delay)).toBeLessThanOrEqual(1)
    expect(Math.min(...pool.delay)).toBeGreaterThanOrEqual(0)
  })
})
