import { describe, expect, it } from 'vitest'
import { buildGraph } from './graph.js'
import { createLinkScheduler, createPacketPool, easeToward, flowSpeed, linkAlpha, packetPosition, stepLinks, stepPackets } from './flow.js'

const g = buildGraph()
const seeded = (seed = 7) => () => {
  seed = (seed * 16807) % 2147483647
  return (seed - 1) / 2147483646
}

describe('flow helpers', () => {
  it('scales packet speed with the flow boost', () => {
    expect(flowSpeed(0)).toBe(1)
    expect(flowSpeed(1)).toBe(3.5)
    expect(flowSpeed(7)).toBe(3.5)
    expect(flowSpeed(-1)).toBe(1)
  })
  it('eases toward a target without overshooting', () => {
    let v = 0
    for (let i = 0; i < 60; i++) {
      const next = easeToward(v, 1, 1 / 60, 5)
      expect(next).toBeGreaterThan(v)
      expect(next).toBeLessThanOrEqual(1)
      v = next
    }
    expect(easeToward(0.5, 0.5, 0.1, 5)).toBe(0.5)
  })
})

describe('packets', () => {
  it('starts on arm edges', () => {
    const pool = createPacketPool(g, 36, seeded())
    for (let i = 0; i < pool.count; i++) {
      expect(pool.edge[i]).toBeLessThan(g.armEdgeCount)
      expect(pool.u[i]).toBeGreaterThanOrEqual(0)
      expect(pool.u[i]).toBeLessThan(1)
    }
  })

  it('places a packet along its edge, honouring direction and split', () => {
    const pool = createPacketPool(g, 1, seeded())
    const e = 1 // second edge along arm 0
    pool.edge[0] = e
    const out = new Float32Array(3)
    pool.dir[0] = 0
    pool.u[0] = 0
    packetPosition(out, 0, g, pool, 0, 0)
    expect(out[0]).toBeCloseTo(g.positions[g.edgeA[e] * 3])
    pool.u[0] = 1
    packetPosition(out, 0, g, pool, 0, 0)
    expect(out[0]).toBeCloseTo(g.positions[g.edgeB[e] * 3])
    pool.dir[0] = 1
    pool.u[0] = 0
    packetPosition(out, 0, g, pool, 0, 0)
    expect(out[1]).toBeCloseTo(g.positions[g.edgeB[e] * 3 + 1])
    pool.dir[0] = 0
    pool.u[0] = 1
    const rest = out[0]
    packetPosition(out, 0, g, pool, 0, 1)
    expect(Math.abs(out[0])).toBeGreaterThan(Math.abs(rest))
  })

  it('advances proportionally to the speed multiplier', () => {
    const a = createPacketPool(g, 1, seeded())
    const b = createPacketPool(g, 1, seeded())
    a.edge[0] = b.edge[0] = 1
    a.u[0] = b.u[0] = 0
    a.speed[0] = b.speed[0] = 0.01
    stepPackets(a, g, 0.1, 1, seeded(), 1)
    stepPackets(b, g, 0.1, 3.5, seeded(), 1)
    expect(b.u[0]).toBeCloseTo(a.u[0] * 3.5)
  })

  it('wraps onto a connected edge at a node and never leaves the arms', () => {
    const rand = seeded(3)
    const pool = createPacketPool(g, 24, rand)
    for (let step = 0; step < 500; step++) {
      stepPackets(pool, g, 1 / 60, 3.5, rand)
      for (let i = 0; i < pool.count; i++) {
        expect(pool.edge[i]).toBeLessThan(g.armEdgeCount)
        expect(pool.u[i]).toBeGreaterThanOrEqual(0)
        expect(pool.u[i]).toBeLessThan(1)
      }
    }
  })

  it('continues from the node it arrived at', () => {
    const rand = seeded(11)
    const pool = createPacketPool(g, 1, rand)
    pool.edge[0] = 0 // hub to the first node of arm 0
    pool.dir[0] = 0
    pool.u[0] = 0.999
    pool.speed[0] = 0.5
    stepPackets(pool, g, 0.05, 1, rand)
    const e = pool.edge[0]
    const from = pool.dir[0] === 0 ? g.edgeA[e] : g.edgeB[e]
    expect(from).toBe(g.edgeB[0]) // the packet now leaves the node it just reached
  })
})

describe('cross-links', () => {
  it('has an envelope that fades in and out', () => {
    expect(linkAlpha(0, 5)).toBe(0)
    expect(linkAlpha(5, 5)).toBe(0)
    expect(linkAlpha(2.5, 5)).toBe(1)
    expect(linkAlpha(0.45, 5)).toBeGreaterThan(0)
    expect(linkAlpha(0.45, 5)).toBeLessThan(1)
  })

  it('keeps at most four distinct links active with alphas in range', () => {
    const rand = seeded(5)
    const s = createLinkScheduler(g.candidateCount, 4, rand)
    const alphas = new Float32Array(g.candidateCount)
    const seen = new Set()
    for (let t = 0; t < 120; t += 0.25) {
      stepLinks(s, t, alphas, rand)
      const active = Array.from(s.cand).filter((c) => c >= 0)
      expect(new Set(active).size).toBe(active.length)
      expect(active.length).toBeLessThanOrEqual(4)
      for (const a of alphas) {
        expect(a).toBeGreaterThanOrEqual(0)
        expect(a).toBeLessThanOrEqual(1)
      }
      active.forEach((c) => seen.add(c))
    }
    expect(seen.size).toBeGreaterThan(8) // the network keeps rewiring
  })
})
