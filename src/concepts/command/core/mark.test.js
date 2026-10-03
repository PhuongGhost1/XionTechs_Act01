import { describe, expect, it } from 'vitest'
import { MARK_BOX, MARK_STROKES, markOutlines, pointInPolygon, polygonPath, sampleMark } from './mark.js'
import { mulberry32 } from './rng.js'

describe('mark strokes', () => {
  it('are a few strokes of both tones, bottom layer first, with finite thickness', () => {
    expect(MARK_STROKES.length).toBeGreaterThanOrEqual(3)
    expect(new Set(MARK_STROKES.map((s) => s.tone))).toEqual(new Set(['ink', 'signal']))
    expect(MARK_STROKES.at(-1).tone).toBe('signal')
    for (const s of MARK_STROKES) for (const p of s.points) expect(p.every(Number.isFinite)).toBe(true)
  })

  it('outlines stay inside the 100 box and span its width', () => {
    let minX = Infinity
    let maxX = -Infinity
    for (const o of markOutlines()) {
      expect(o.area).toBeGreaterThan(1)
      for (const [x, y] of o.polygon) {
        expect(Number.isFinite(x + y)).toBe(true)
        expect(x).toBeGreaterThanOrEqual(-1)
        expect(x).toBeLessThanOrEqual(MARK_BOX + 1)
        expect(y).toBeGreaterThanOrEqual(0)
        expect(y).toBeLessThanOrEqual(MARK_BOX)
        minX = Math.min(minX, x)
        maxX = Math.max(maxX, x)
      }
    }
    expect(maxX - minX).toBeGreaterThan(97)
  })

  it('makes svg paths', () => {
    for (const o of markOutlines()) expect(polygonPath(o.polygon)).toMatch(/^M[\d. -]+L.*Z$/)
  })
})

describe('sampleMark', () => {
  it.each([1, 39, 500, 1200])('returns exactly %i points, in bounds', (n) => {
    const s = sampleMark(n, mulberry32(7))
    expect(s.x).toHaveLength(n)
    expect(s.y).toHaveLength(n)
    expect(s.tone).toHaveLength(n)
    for (let i = 0; i < n; i += 1) {
      expect(Number.isFinite(s.x[i] + s.y[i])).toBe(true)
      expect(s.x[i]).toBeGreaterThanOrEqual(-1)
      expect(s.x[i]).toBeLessThanOrEqual(MARK_BOX + 1)
      expect(s.y[i]).toBeGreaterThanOrEqual(0)
      expect(s.y[i]).toBeLessThanOrEqual(MARK_BOX)
    }
    if (n >= 500) expect(new Set(s.tone)).toEqual(new Set([0, 1]))
  })

  it('is deterministic for a seed', () => {
    const a = sampleMark(300, mulberry32(3))
    const b = sampleMark(300, mulberry32(3))
    expect(Array.from(b.x)).toEqual(Array.from(a.x))
  })

  it('keeps white points out from under the yellow check', () => {
    const yellow = markOutlines().find((o) => o.tone === 'signal').polygon
    const s = sampleMark(1200, mulberry32(11))
    let hidden = 0
    for (let i = 0; i < s.x.length; i += 1) if (s.tone[i] === 0 && pointInPolygon(s.x[i], s.y[i], yellow)) hidden += 1
    expect(hidden).toBeLessThan(6) // a rejected point is retried; a handful may survive the retries
  })
})
