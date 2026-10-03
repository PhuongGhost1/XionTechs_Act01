import { describe, expect, it } from 'vitest'
import { litAmounts, statementProgress, statementWords } from './lighting.js'

describe('statement progress', () => {
  it('is 0 before the statement reaches the lower part of the screen and 1 after it passes the middle', () => {
    const vh = 900
    const top = 3000
    const height = 400
    expect(statementProgress(0, top, height, vh)).toBe(0)
    expect(statementProgress(top - vh * 0.82, top, height, vh)).toBe(0)
    expect(statementProgress(top + height - vh * 0.5, top, height, vh)).toBe(1)
    expect(statementProgress(99999, top, height, vh)).toBe(1)
  })

  it('is monotonic in scrollY, so scrolling back dims the words again', () => {
    let last = -1
    for (let y = 2000; y < 4000; y += 50) {
      const p = statementProgress(y, 3000, 400, 900)
      expect(p).toBeGreaterThanOrEqual(last)
      last = p
    }
  })

  it('survives bad input', () => {
    expect(statementProgress(Number.NaN, 1, 1, 1)).toBe(0)
  })
})

describe('lit amounts', () => {
  it('has one entry per word plus the full stop', () => {
    expect(litAmounts(0.5, 6)).toHaveLength(7)
  })

  it('is all dim at 0 and all lit at 1', () => {
    expect(litAmounts(0, 6).every((v) => v === 0)).toBe(true)
    expect(litAmounts(1, 6).every((v) => v === 1)).toBe(true)
  })

  it('lights words in order and the full stop last', () => {
    const v = litAmounts(0.5, 6)
    for (let i = 1; i < v.length; i += 1) expect(v[i]).toBeLessThanOrEqual(v[i - 1])
    expect(litAmounts(0.95, 6)[6]).toBeLessThan(1)
    expect(litAmounts(0.999, 6)[5]).toBe(1)
  })

  it('never goes backwards as progress grows', () => {
    let prev = litAmounts(0, 6)
    for (let p = 0.05; p <= 1.0001; p += 0.05) {
      const next = litAmounts(p, 6)
      next.forEach((v, i) => expect(v).toBeGreaterThanOrEqual(prev[i]))
      prev = next
    }
  })
})

describe('statement words', () => {
  it('splits and drops the period', () => {
    expect(statementWords('We turn requirements into production systems.')).toEqual([
      'We', 'turn', 'requirements', 'into', 'production', 'systems',
    ])
  })
})
