import { describe, expect, it } from 'vitest'
import { work } from '../content.js'
import { countUpValue, documentedCounts, easeOutCubic, formatBuild } from './logic.js'

describe('documentedCounts', () => {
  it('separates products from illustrative records', () => {
    expect(documentedCounts(work.records)).toEqual({ documented: 2, illustrative: 1 })
    expect(documentedCounts([])).toEqual({ documented: 0, illustrative: 0 })
  })
})

describe('countUpValue', () => {
  it('runs from zero to the exact target', () => {
    expect(countUpValue(25, 0)).toBe(0)
    expect(countUpValue(25, 1)).toBe(25)
    expect(countUpValue(25, 2)).toBe(25)
    expect(countUpValue(3, 0.5)).toBeLessThanOrEqual(3)
    expect(easeOutCubic(-1)).toBe(0)
  })
})

describe('formatBuild', () => {
  it('pads to three digits and never goes negative', () => {
    expect(formatBuild(7)).toBe('007')
    expect(formatBuild(1234)).toBe('1234')
    expect(formatBuild(-4)).toBe('000')
  })
})
