import { describe, expect, it } from 'vitest'
import { dayOfYear, padDoy, sysClock } from './clock.js'

// Local dates, built with the (year, monthIndex, day) constructor, so the tests do not depend on
// the time zone of the machine they run on.
const on = (y, m, d, h = 12) => new Date(y, m - 1, d, h)

describe('dayOfYear', () => {
  it('is 1 on 1 January and counts days', () => {
    expect(dayOfYear(on(2026, 1, 1))).toBe(1)
    expect(dayOfYear(on(2026, 1, 31))).toBe(31)
    expect(dayOfYear(on(2026, 2, 1))).toBe(32)
    expect(dayOfYear(on(2026, 3, 1))).toBe(60)
  })

  it('knows leap years', () => {
    expect(dayOfYear(on(2024, 3, 1))).toBe(61)
    expect(dayOfYear(on(2024, 12, 31))).toBe(366)
    expect(dayOfYear(on(2026, 12, 31))).toBe(365)
  })

  it('is the date of this build day: 3 October 2026 is day 276', () => {
    expect(dayOfYear(on(2026, 10, 3))).toBe(276)
  })

  it('does not depend on the time of day', () => {
    expect(dayOfYear(on(2026, 6, 15, 0))).toBe(dayOfYear(on(2026, 6, 15, 23)))
  })
})

describe('padDoy and sysClock', () => {
  it('pads to three digits', () => {
    expect(padDoy(3)).toBe('003')
    expect(padDoy(276)).toBe('276')
  })

  it('returns the year and the padded day for the header', () => {
    expect(sysClock(on(2026, 10, 3))).toEqual({ year: 2026, doy: '276' })
    expect(sysClock(on(2027, 1, 1))).toEqual({ year: 2027, doy: '001' })
  })
})
