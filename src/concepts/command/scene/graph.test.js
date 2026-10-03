import { describe, expect, it } from 'vitest'
import {
  ARM_IDS,
  EDGE_CANDIDATE,
  EDGE_LATERAL,
  armTipPositions,
  buildGraph,
  cameraForAspect,
  nodeIndex,
  projectToNormalised,
  splitFactor,
} from './graph.js'

const g = buildGraph()

describe('graph', () => {
  it('has a hub, four arms of four nodes and the expected edges', () => {
    expect(g.nodeCount).toBe(17)
    expect(g.staticEdgeCount).toBe(18) // 16 along the arms + 2 corner links
    expect(g.edgeCount).toBe(32) // + 14 candidate cross-links
    expect(g.candidateCount).toBe(14)
    expect(g.edgeKind.filter((k) => k === EDGE_LATERAL)).toHaveLength(2)
    expect(g.edgeKind.filter((k) => k === EDGE_CANDIDATE)).toHaveLength(14)
  })

  it('keeps the arm order of content.js modules', () => {
    expect(ARM_IDS).toEqual(['software', 'ai', 'cloud', 'product'])
    const tip = (a) => [g.positions[nodeIndex(a, 3) * 3], g.positions[nodeIndex(a, 3) * 3 + 1]]
    expect(tip(0)[0]).toBeLessThan(0)
    expect(tip(0)[1]).toBeGreaterThan(0)
    expect(tip(1)[0]).toBeGreaterThan(0)
    expect(tip(1)[1]).toBeGreaterThan(0)
    expect(tip(2)[0]).toBeGreaterThan(0)
    expect(tip(2)[1]).toBeLessThan(0)
    expect(tip(3)[0]).toBeLessThan(0)
    expect(tip(3)[1]).toBeLessThan(0)
  })

  it('is deterministic and every edge has a positive length', () => {
    expect(Array.from(buildGraph().positions)).toEqual(Array.from(g.positions))
    for (const len of g.edgeLen) expect(len).toBeGreaterThan(0)
  })

  it('builds consistent adjacency over arm edges', () => {
    expect(g.adjStart[g.nodeCount]).toBe(g.armEdgeCount * 2)
    for (let n = 0; n < g.nodeCount; n++) {
      for (let k = g.adjStart[n]; k < g.adjStart[n + 1]; k++) {
        const e = g.adjEdge[k]
        expect(e).toBeLessThan(g.armEdgeCount)
        expect(g.edgeA[e] === n || g.edgeB[e] === n).toBe(true)
      }
    }
    expect(g.adjStart[1] - g.adjStart[0]).toBe(4) // the hub joins the four arms
  })
})

describe('armTipPositions', () => {
  it('puts the tips in their quadrants at rest', () => {
    const [a, b, c, d] = armTipPositions(0)
    expect(a.x).toBeLessThan(0.5)
    expect(a.y).toBeLessThan(0.5)
    expect(b.x).toBeGreaterThan(0.5)
    expect(b.y).toBeLessThan(0.5)
    expect(c.x).toBeGreaterThan(0.5)
    expect(c.y).toBeGreaterThan(0.5)
    expect(d.x).toBeLessThan(0.5)
    expect(d.y).toBeGreaterThan(0.5)
    expect(armTipPositions(0).map((t) => t.id)).toEqual(ARM_IDS)
  })

  it('moves the tips outward when split and keeps them inside the canvas', () => {
    for (const aspect of [0.5, 0.8, 1, 1.25, 1.8, 2.4]) {
      const rest = armTipPositions(0, aspect)
      const split = armTipPositions(1, aspect)
      for (let i = 0; i < 4; i++) {
        const dr = Math.hypot(rest[i].x - 0.5, rest[i].y - 0.5)
        const ds = Math.hypot(split[i].x - 0.5, split[i].y - 0.5)
        expect(ds).toBeGreaterThanOrEqual(dr - 1e-9)
        for (const t of [rest[i], split[i]]) {
          expect(t.x).toBeGreaterThanOrEqual(0)
          expect(t.x).toBeLessThanOrEqual(1)
          expect(t.y).toBeGreaterThanOrEqual(0)
          expect(t.y).toBeLessThanOrEqual(1)
        }
      }
    }
    const rest = armTipPositions(0, 1.25)
    const split = armTipPositions(1, 1.25)
    expect(Math.abs(split[1].x - 0.5)).toBeGreaterThan(Math.abs(rest[1].x - 0.5))
  })

  it('clamps split and reuses an output array', () => {
    const out = armTipPositions(0)
    const same = armTipPositions(5, 1.25, out)
    expect(same).toBe(out)
    expect(out[1].x).toBeCloseTo(armTipPositions(1)[1].x)
  })
})

describe('camera maths', () => {
  it('projects the origin to the canvas centre', () => {
    const p = projectToNormalised(0, 0, 1.6)
    expect(p.x).toBeCloseTo(0.5)
    expect(p.y).toBeCloseTo(0.5)
  })
  it('fits the smaller side', () => {
    expect(cameraForAspect(2).halfH).toBeCloseTo(cameraForAspect(1).halfH)
    expect(cameraForAspect(0.5).halfW).toBeCloseTo(cameraForAspect(1).halfW)
    expect(cameraForAspect(2).halfW).toBeCloseTo(cameraForAspect(2).halfH * 2)
  })
  it('splitFactor is 1 at the hub and grows toward the tip', () => {
    expect(splitFactor(0, 1)).toBe(1)
    expect(splitFactor(1, 0)).toBe(1)
    expect(splitFactor(1, 1)).toBeGreaterThan(splitFactor(0.5, 1))
  })
})
