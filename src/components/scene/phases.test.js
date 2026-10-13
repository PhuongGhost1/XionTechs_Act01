import { describe, expect, it } from 'vitest'
import { BLEND_ZONE, computePhase, coversViewport, smoothstep } from './phases'

const VH = 800

// Six touching sections of the given heights, the first one starting at `top`.
function stack(top, heights) {
  let y = top
  return heights.map((h) => {
    const rect = { top: y, bottom: y + h }
    y += h
    return rect
  })
}

describe('smoothstep', () => {
  it('is 0 before, 1 after and 0.5 halfway', () => {
    expect(smoothstep(0, 10, -5)).toBe(0)
    expect(smoothstep(0, 10, 15)).toBe(1)
    expect(smoothstep(0, 10, 5)).toBe(0.5)
  })

  it('does not divide by zero on an empty range', () => {
    expect(smoothstep(3, 3, 2)).toBe(0)
    expect(smoothstep(3, 3, 4)).toBe(1)
  })
})

describe('computePhase', () => {
  const heights = [900, 1400, 1000, 900, 1000, 800]

  it('is exactly k while section k holds the centre line', () => {
    heights.forEach((_, k) => {
      const rects = stack(0, heights)
      // Slide the page so the middle of section k sits on the centre line.
      const shift = VH / 2 - (rects[k].top + rects[k].bottom) / 2
      expect(computePhase(rects.map((r) => ({ top: r.top + shift, bottom: r.bottom + shift })), VH)).toBe(k)
    })
  })

  it('is 0 above the first section and while the first holds the line', () => {
    expect(computePhase(stack(VH, heights), VH)).toBe(0)
    expect(computePhase(stack(0, heights), VH)).toBe(0)
  })

  it('is the last section index past the end', () => {
    expect(computePhase(stack(-9000, heights), VH)).toBe(5)
  })

  it('blends continuously across a boundary between touching sections', () => {
    const rects = stack(0, [VH, VH, VH, VH, VH, VH])
    // Boundary between sections 0 and 1 at y = VH. Slide the page so it sits on the centre line.
    const at = (boundaryY) => computePhase(rects.map((r) => ({ top: r.top - VH + boundaryY, bottom: r.bottom - VH + boundaryY })), VH)
    expect(at(VH / 2)).toBeCloseTo(0.5, 5)
    expect(at(VH / 2 + BLEND_ZONE * VH)).toBeCloseTo(0, 5)
    expect(at(VH / 2 - BLEND_ZONE * VH)).toBeCloseTo(1, 5)
    // Monotonic as the boundary rises through the centre line.
    let last = -1
    for (let y = VH / 2 + BLEND_ZONE * VH; y >= VH / 2 - BLEND_ZONE * VH; y -= 10) {
      const p = at(y)
      expect(p).toBeGreaterThanOrEqual(last)
      last = p
    }
  })

  it('blends across the whole gap when sections do not touch', () => {
    const rects = [
      { top: -1000, bottom: 100 },
      { top: 700, bottom: 1500 },
    ]
    // Gap 100..700, centre line at 400: right in the middle of it.
    expect(computePhase(rects, VH)).toBeCloseTo(0.5, 5)
    expect(computePhase([{ top: -1000, bottom: 380 }, { top: 700, bottom: 1500 }], VH)).toBeLessThan(0.5)
  })

  it('never lets two blend zones overlap on a short section', () => {
    const rects = stack(-100, [60, 60, 3000])
    for (let shift = -500; shift <= 500; shift += 7) {
      const p = computePhase(rects.map((r) => ({ top: r.top + shift, bottom: r.bottom + shift })), VH)
      expect(p).toBeGreaterThanOrEqual(0)
      expect(p).toBeLessThanOrEqual(2)
    }
  })

  it('skips sections that are missing and keeps the indices of the rest', () => {
    // Section 1 is not in the DOM: the blend runs from index 0 straight to index 2.
    const rects = [{ top: -VH / 2, bottom: VH / 2 }, null, { top: VH / 2, bottom: VH * 1.5 }]
    expect(computePhase(rects, VH)).toBeCloseTo(1, 5)
    expect(computePhase([null, { top: 0, bottom: VH }], VH)).toBe(1)
  })

  it('is 0 for empty or unusable input', () => {
    expect(computePhase([], VH)).toBe(0)
    expect(computePhase(null, VH)).toBe(0)
    expect(computePhase([null, null], VH)).toBe(0)
    expect(computePhase(stack(0, heights), 0)).toBe(0)
    expect(computePhase([{ top: NaN, bottom: 10 }], VH)).toBe(0)
  })
})

describe('coversViewport', () => {
  it('is true only when the rect spans the whole viewport', () => {
    expect(coversViewport({ top: 0, bottom: VH }, VH)).toBe(true)
    expect(coversViewport({ top: -300, bottom: VH + 300 }, VH)).toBe(true)
    expect(coversViewport({ top: 1, bottom: VH + 300 }, VH)).toBe(false)
    expect(coversViewport({ top: -300, bottom: VH - 1 }, VH)).toBe(false)
  })

  it('is false for a missing rect', () => {
    expect(coversViewport(null, VH)).toBe(false)
    expect(coversViewport(undefined, VH)).toBe(false)
    expect(coversViewport({ top: NaN, bottom: NaN }, VH)).toBe(false)
  })
})
