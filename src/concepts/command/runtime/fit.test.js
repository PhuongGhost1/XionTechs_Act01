import { describe, expect, it } from 'vitest'
import { anyOverlap, overflowsBox } from './fit.js'

const r = (left, top, right, bottom) => ({ left, top, right, bottom })

describe('overflowsBox', () => {
  const box = r(0, 100, 320, 580)

  it('is false while every rect is inside the box (within the tolerance)', () => {
    expect(overflowsBox(box, [r(16, 120, 300, 560), r(0, 100, 320, 580)])).toBe(false)
    expect(overflowsBox(box, [r(-1, 99, 321, 581)])).toBe(false)
  })

  it('is true when content sticks out on any side', () => {
    expect(overflowsBox(box, [r(16, 60, 300, 200)])).toBe(true) // above
    expect(overflowsBox(box, [r(16, 500, 300, 640)])).toBe(true) // below
    expect(overflowsBox(box, [r(16, 120, 329, 200)])).toBe(true) // right
    expect(overflowsBox(box, [r(-20, 120, 100, 200)])).toBe(true) // left
  })

  it('ignores empty rects (hidden elements)', () => {
    expect(overflowsBox(box, [r(0, 0, 0, 0), r(900, 900, 900, 900)])).toBe(false)
  })
})

describe('anyOverlap', () => {
  it('finds touching or overlapping rects, with a gap', () => {
    expect(anyOverlap([r(0, 0, 50, 20), r(40, 0, 90, 20)])).toBe(true)
    expect(anyOverlap([r(0, 0, 50, 20), r(52, 0, 90, 20)])).toBe(false)
    expect(anyOverlap([r(0, 0, 50, 20), r(52, 0, 90, 20)], 4)).toBe(true)
  })

  it('does not count rects in different rows', () => {
    expect(anyOverlap([r(0, 0, 50, 20), r(10, 30, 60, 50)])).toBe(false)
  })

  it('ignores empty rects', () => {
    expect(anyOverlap([r(0, 0, 0, 0), r(0, 0, 0, 0)])).toBe(false)
  })
})
