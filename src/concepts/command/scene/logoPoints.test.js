import { describe, expect, it } from 'vitest'
import { pickPoints } from './logoPoints'

// A mask from rows of text: '#' opaque, '.' empty.
function mask(rows) {
  const w = rows[0].length
  const m = new Uint8Array(w * rows.length)
  rows.forEach((row, y) => [...row].forEach((c, x) => (m[y * w + x] = c === '#' ? 1 : 0)))
  return { m, w, h: rows.length }
}

describe('pickPoints', () => {
  it('returns nothing for an empty mask or a zero budget', () => {
    const { m, w, h } = mask(['....', '....'])
    expect(pickPoints(m, w, h, 10)).toEqual([])
    const full = mask(['##'])
    expect(pickPoints(full.m, full.w, full.h, 0)).toEqual([])
  })

  it('returns every opaque pixel when they fit the budget', () => {
    const { m, w, h } = mask(['#.#', '...', '.#.'])
    expect(pickPoints(m, w, h, 10).sort()).toEqual([0, 2, 7])
  })

  it('stays within the budget, only on opaque pixels, and without duplicates', () => {
    const rows = Array.from({ length: 40 }, (_, y) => '.'.repeat(5) + (y % 7 === 0 ? '.'.repeat(60) : '#'.repeat(60)) + '.'.repeat(5))
    const { m, w, h } = mask(rows)
    for (const budget of [30, 120, 400]) {
      const picks = pickPoints(m, w, h, budget)
      expect(picks.length).toBeLessThanOrEqual(budget)
      expect(picks.length).toBeGreaterThan(budget * 0.5)
      expect(new Set(picks).size).toBe(picks.length)
      for (const i of picks) expect(m[i]).toBe(1)
    }
  })

  it('spreads points across the whole shape instead of bunching them', () => {
    // Two separate bars: both must receive points.
    const rows = Array.from({ length: 12 }, () => '#'.repeat(10) + '.'.repeat(30) + '#'.repeat(10))
    const { m, w, h } = mask(rows)
    const picks = pickPoints(m, w, h, 40)
    expect(picks.some((i) => i % w < 10)).toBe(true)
    expect(picks.some((i) => i % w >= 40)).toBe(true)
  })

  it('is deterministic', () => {
    const rows = Array.from({ length: 20 }, () => '#'.repeat(30))
    const { m, w, h } = mask(rows)
    expect(pickPoints(m, w, h, 50)).toEqual(pickPoints(m, w, h, 50))
  })
})
