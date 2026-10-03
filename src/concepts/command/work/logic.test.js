import { describe, expect, it } from 'vitest'
import { work } from '../content.js'
import { boxStyle, nextTabIndex, stepStatus } from './logic.js'
import { assemblyLayout } from './assemblyLayout.js'

describe('nextTabIndex', () => {
  it('wraps with arrows and jumps with Home/End', () => {
    expect(nextTabIndex('ArrowRight', 3, 4)).toBe(0)
    expect(nextTabIndex('ArrowLeft', 0, 4)).toBe(3)
    expect(nextTabIndex('Home', 2, 4)).toBe(0)
    expect(nextTabIndex('End', 0, 4)).toBe(3)
    expect(nextTabIndex('a', 0, 4)).toBeNull()
    expect(nextTabIndex('ArrowRight', 0, 0)).toBeNull()
  })
})

describe('boxStyle', () => {
  it('turns a percent box into inline percentages', () => {
    expect(boxStyle({ x: 1, y: 2, w: 3, h: 4 })).toEqual({ left: '1%', top: '2%', width: '3%', height: '4%' })
  })
})

describe('hotspot boxes in content', () => {
  const spots = work.records.flatMap((r) => r.screens.flatMap((s) => s.hotspots))
  it('stay inside the image', () => {
    for (const { box } of spots) {
      expect(box.x).toBeGreaterThanOrEqual(0)
      expect(box.y).toBeGreaterThanOrEqual(0)
      expect(box.x + box.w).toBeLessThanOrEqual(100)
      expect(box.y + box.h).toBeLessThanOrEqual(100)
    }
  })
})

describe('stepStatus', () => {
  it('marks done, current and todo, and completes everything at the end', () => {
    expect([0, 1, 2, 3, 4].map((i) => stepStatus(i, 0, 5))).toEqual(['todo', 'todo', 'todo', 'todo', 'todo'])
    expect([0, 1, 2, 3, 4].map((i) => stepStatus(i, 3, 5))).toEqual(['done', 'done', 'current', 'todo', 'todo'])
    expect([0, 1, 2, 3, 4].map((i) => stepStatus(i, 5, 5))).toEqual(['done', 'done', 'done', 'done', 'done'])
  })
})

describe('assemblyLayout', () => {
  const rec = work.records.find((r) => r.assembly)
  const shot = rec.screens[0]
  const n = work.assembly.layers.length
  for (const mode of ['wide', 'tall']) {
    it(`${mode}: everything fits the viewBox and nodes do not overlap`, () => {
      const L = assemblyLayout(mode, n, shot)
      expect(L.nodes).toHaveLength(n)
      for (const nd of L.nodes) {
        expect(nd.x).toBeGreaterThanOrEqual(0)
        expect(nd.x + nd.w).toBeLessThanOrEqual(L.W)
        expect(nd.y).toBeGreaterThanOrEqual(0)
        expect(nd.y + nd.h).toBeLessThanOrEqual(L.H)
      }
      for (let i = 1; i < n; i++) expect(L.nodes[i].y).toBeGreaterThanOrEqual(L.nodes[i - 1].y + L.nodes[i - 1].h)
      expect(L.image.x + L.image.w).toBeLessThanOrEqual(L.W)
      expect(L.image.y).toBeGreaterThanOrEqual(0)
      expect(L.image.y + L.image.h).toBeLessThanOrEqual(L.H)
      expect(L.state.y).toBeLessThan(L.H)
      // the image never overlaps a node
      for (const nd of L.nodes) {
        const apart = nd.x + nd.w <= L.image.x || nd.y + nd.h <= L.image.y || nd.y >= L.image.y + L.image.h
        expect(apart).toBe(true)
      }
    })
  }
})
