import { describe, expect, it } from 'vitest'
import { ANCHOR_NAMES, coreAnchorSegment, ease, lerpRect, rectCenter, toViewportRect } from './anchors.js'

describe('anchor helpers', () => {
  it('know the five anchors', () => {
    expect(ANCHOR_NAMES).toEqual(['hero', 'premise', 'deploy', 'line', 'done'])
  })

  it('turn a document rect into a viewport rect by subtracting scroll', () => {
    expect(toViewportRect({ x: 100, y: 1200, width: 280, height: 280 }, 0, 900)).toEqual({
      x: 100,
      y: 300,
      width: 280,
      height: 280,
    })
    expect(toViewportRect({ x: 100, y: 50, width: 10, height: 10 }, 20, 80).y).toBe(-30)
  })

  it('lerp rects and find centres', () => {
    const a = { x: 0, y: 0, width: 100, height: 100 }
    const b = { x: 200, y: 100, width: 300, height: 200 }
    expect(lerpRect(a, b, 0)).toEqual(a)
    expect(lerpRect(a, b, 1)).toEqual(b)
    expect(lerpRect(a, b, 0.5)).toEqual({ x: 100, y: 50, width: 200, height: 150 })
    expect(rectCenter(b)).toEqual({ x: 350, y: 200 })
  })

  it('ease is monotonic, clamped and fixed at the ends', () => {
    expect(ease(-1)).toBe(0)
    expect(ease(0)).toBe(0)
    expect(ease(1)).toBe(1)
    expect(ease(2)).toBe(1)
    let last = -1
    for (let t = 0; t <= 1; t += 0.05) {
      expect(ease(t)).toBeGreaterThanOrEqual(last)
      last = ease(t)
    }
  })
})

describe('coreAnchorSegment', () => {
  it('parks on the hero at the top and moves to PREMISE over its first half', () => {
    expect(coreAnchorSegment({})).toEqual({ from: 'hero', to: 'premise', t: 0 })
    expect(coreAnchorSegment({ premise: 0.25 })).toEqual({ from: 'hero', to: 'premise', t: 0.5 })
    expect(coreAnchorSegment({ premise: 1 }).t).toBe(1)
  })

  it('travels premise -> deploy -> line and then hides', () => {
    expect(coreAnchorSegment({ premise: 1, deploy: 0.1 }).from).toBe('premise')
    expect(coreAnchorSegment({ premise: 1, deploy: 1 / 6 }).t).toBeCloseTo(0.5, 5)
    expect(coreAnchorSegment({ premise: 1, deploy: 1, line: 0.075 })).toEqual({ from: 'deploy', to: 'line', t: 0.5 })
    expect(coreAnchorSegment({ premise: 1, deploy: 1, line: 1, work: 0.2 })).toEqual({ from: 'line', to: 'line', t: 0 })
    expect(coreAnchorSegment({ line: 1, work: 1, ledger: 0.5 })).toEqual({ from: 'line', to: 'line', t: 0 })
  })

  it('docks on the finale', () => {
    expect(coreAnchorSegment({ done: 0.01 })).toEqual({ from: 'done', to: 'done', t: 0 })
  })
})
