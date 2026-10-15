import { describe, it, expect } from 'vitest'
import { hero } from '../../../content/site'
import {
  W,
  H,
  NODES,
  EDGES,
  STEPS,
  FINAL_STEP,
  nodeState,
  arrivesBySignal,
  edgeState,
  focusAt,
  flattenAt,
  nodePoint,
  edgePath,
  nearestNode,
} from './HeroSystemLayout'

const ids = hero.system.map((n) => n.id)
const label = Object.fromEntries(hero.system.map((n) => [n.id, n.label]))

// Rough rendered pill size in px (HeroSystem.jsx): text-xs below `sm`, text-sm from `sm`; the
// core agent pill is larger. Generous per-character widths so the check errs on the safe side.
function pill(id, small) {
  const n = label[id].length
  const core = hero.system.find((s) => s.id === id).core
  if (core) return small ? [n * 6.8 + 46, 34] : [n * 7.6 + 58, 42]
  return small ? [n * 6.6 + 42, 30] : [n * 7.4 + 54, 38]
}

describe('hero connected system', () => {
  it('lays out exactly the nodes in site.js', () => {
    expect(Object.keys(NODES).sort()).toEqual([...ids].sort())
  })

  it('connects every node, starting at the request and ending at done', () => {
    for (const e of EDGES) {
      expect(NODES[e.from], e.id).toBeDefined()
      expect(NODES[e.to], e.id).toBeDefined()
    }
    for (const id of ids.filter((i) => i !== 'request')) expect(EDGES.some((e) => e.to === id), id).toBe(true)
    expect(EDGES.some((e) => e.from === 'done')).toBe(false)
    expect(EDGES.filter((e) => e.judgment).every((e) => e.from === 'human' || e.to === 'human')).toBe(true)
  })

  it('runs one cycle in six to ten seconds (MOTION §5)', () => {
    const total = STEPS.reduce((sum, s) => sum + s.ms, 0)
    expect(total).toBeGreaterThanOrEqual(6000)
    expect(total).toBeLessThanOrEqual(10000)
  })

  it('starts idle and focuses each node once, in the order of hero.system', () => {
    for (const id of ids) expect(nodeState(id, 0), id).toBe('idle')
    for (const e of EDGES) expect(edgeState(e, 0), e.id).toBe('idle')
    expect(focusAt(0)).toBeNull()
    const order = STEPS.slice(1).map((_, i) => focusAt(i + 1))
    expect(order).toEqual(ids)
    order.forEach((id, i) => expect(nodeState(id, i + 1)).toBe('active'))
  })

  it('sends a signal along each edge before its target lights', () => {
    for (const e of EDGES) {
      expect(nodeState(e.from, e.step), e.id).not.toBe('idle')
      expect(nodeState(e.to, e.step - 1), e.id).toBe('idle')
      expect(edgeState(e, e.step), e.id).toBe('run')
      expect(edgeState(e, e.step + 1), e.id).toBe('lit')
    }
    expect(arrivesBySignal('agent', 2)).toBe(true)
    expect(arrivesBySignal('request', 1)).toBe(false)
    expect(nodeState('human', 4)).toBe('branch')
  })

  it('ends with every node lit, DONE shown and every edge drawn (the reduced-motion state)', () => {
    for (const id of ids) expect(nodeState(id, FINAL_STEP), id).not.toBe('idle')
    expect(nodeState('done', FINAL_STEP)).toBe('active')
    for (const e of EDGES) expect(edgeState(e, FINAL_STEP), e.id).toBe('lit')
  })

  it('stays put until the visual starts to leave, then settles fully', () => {
    expect(flattenAt(0)).toBe(0)
    expect(flattenAt(0.5)).toBe(0)
    expect(flattenAt(1)).toBe(1)
    let last = 0
    for (let p = 0; p <= 1; p += 0.05) {
      expect(flattenAt(p)).toBeGreaterThanOrEqual(last)
      last = flattenAt(p)
    }
  })

  it('straightens edges into the workflow column', () => {
    expect(edgePath(EDGES[0], 0)).toMatch(/^M[\d.]+ [\d.]+Q[\d.]+ [\d.]+ [\d.]+ [\d.]+$/)
    const straight = edgePath(EDGES.find((e) => e.id === 'decision-system'), 1)
    const xs = straight.match(/[\d.]+/g).filter((_, i) => i % 2 === 0)
    expect(new Set(xs).size).toBe(1)
  })

  it('keeps node pills apart and inside the canvas at every size and scroll position', () => {
    const sizes = [
      [272, true], // 320 px phone
      [336, true], // max-w-[21rem]
      [384, false], // sm: max-w-sm
      [448, false], // lg: max-w-[28rem]
    ]
    for (const [canvas, small] of sizes) {
      const s = canvas / W
      for (const flat of [0, 0.25, 0.5, 0.75, 1]) {
        const boxes = ids.map((id) => {
          const [x, y] = nodePoint(id, flat)
          const [w, h] = pill(id, small)
          return { id, x0: x * s - w / 2, x1: x * s + w / 2, y0: y * s - h / 2, y1: y * s + h / 2 }
        })
        for (const b of boxes) {
          const where = `${b.id} at ${canvas}px, flat ${flat}`
          expect(b.x0, where).toBeGreaterThan(-12) // may reach into the page gutter, not past it
          expect(b.x1, where).toBeLessThan(canvas + 12)
          expect(b.y0, where).toBeGreaterThanOrEqual(0)
          expect(b.y1, where).toBeLessThanOrEqual((H / W) * canvas)
        }
        for (let i = 0; i < boxes.length; i++) {
          for (let j = i + 1; j < boxes.length; j++) {
            const a = boxes[i]
            const b = boxes[j]
            const gap = Math.max(a.x0 - b.x1, b.x0 - a.x1, a.y0 - b.y1, b.y0 - a.y1)
            expect(gap, `${a.id}/${b.id} at ${canvas}px, flat ${flat}`).toBeGreaterThanOrEqual(canvas < 300 ? 2 : 12)
          }
        }
      }
    }
  })

  it('finds the node under the pointer and nothing in empty space', () => {
    for (const id of ids) {
      const [x, y] = nodePoint(id, 0)
      expect(nearestNode((x / W) * 2 - 1, (y / H) * 2 - 1)).toBe(id)
    }
    expect(nearestNode(1, -1)).toBeNull()
  })
})
