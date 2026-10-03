import { describe, expect, it } from 'vitest'
import { HOLD, markerPosition, stageFromProgress } from './progress.js'

describe('stageFromProgress', () => {
  it('starts on the first stage', () => {
    expect(stageFromProgress(0, 6)).toBe(0)
  })
  it('cuts the range into equal slices', () => {
    expect(stageFromProgress(0.16, 6)).toBe(0)
    expect(stageFromProgress(0.17, 6)).toBe(1)
    expect(stageFromProgress(0.5, 6)).toBe(3)
    expect(stageFromProgress(0.99, 6)).toBe(5)
  })
  it('reports every stage complete at p = 1', () => {
    expect(stageFromProgress(1, 6)).toBe(6)
    expect(stageFromProgress(7, 6)).toBe(6)
  })
  it('clamps bad input', () => {
    expect(stageFromProgress(-3, 6)).toBe(0)
    expect(stageFromProgress(Number.NaN, 6)).toBe(0)
    expect(stageFromProgress(0.5, 0)).toBe(0)
  })
  it('never decreases as p grows', () => {
    let last = 0
    for (let i = 0; i <= 200; i += 1) {
      const s = stageFromProgress(i / 200, 6)
      expect(s).toBeGreaterThanOrEqual(last)
      last = s
    }
  })
})

describe('markerPosition', () => {
  it('runs from 0 to 1', () => {
    expect(markerPosition(0, 6)).toBe(0)
    expect(markerPosition(1, 6)).toBe(1)
    expect(markerPosition(-1, 6)).toBe(0)
    expect(markerPosition(2, 6)).toBe(1)
  })
  it('rests on a stage centre while the stage is held', () => {
    for (let k = 0; k < 5; k += 1) {
      const p = (k + HOLD * 0.5) / 6
      expect(markerPosition(p, 6)).toBeCloseTo(k / 5, 10)
    }
  })
  it('stays on the last centre during the last stage', () => {
    expect(markerPosition(5.2 / 6, 6)).toBe(1)
    expect(markerPosition(0.99, 6)).toBe(1)
  })
  it('eases between centres and arrives as the next stage starts', () => {
    const mid = markerPosition((1 + (1 + HOLD) / 2) / 6, 6)
    expect(mid).toBeGreaterThan(1 / 5)
    expect(mid).toBeLessThan(2 / 5)
    expect(markerPosition(2 / 6 - 1e-9, 6)).toBeCloseTo(2 / 5, 6)
  })
  it('is monotonic', () => {
    let last = 0
    for (let i = 0; i <= 600; i += 1) {
      const m = markerPosition(i / 600, 6)
      expect(m).toBeGreaterThanOrEqual(last - 1e-12)
      last = m
    }
  })
  it('handles one stage and bad input', () => {
    expect(markerPosition(0.5, 1)).toBe(0.5)
    expect(markerPosition(Number.NaN, 6)).toBe(0)
  })
})
