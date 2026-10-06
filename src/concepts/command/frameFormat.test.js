import { describe, expect, it } from 'vitest'
import { formatSysTime, splitStop, telHref } from './frameFormat'

describe('formatSysTime', () => {
  it('formats the local time as SYS HH:MM:SS', () => {
    expect(formatSysTime(new Date(2026, 9, 3, 14, 7, 32))).toBe('SYS 14:07:32')
  })
  it('zero pads and uses 24 hour time', () => {
    expect(formatSysTime(new Date(2026, 0, 1, 0, 5, 9))).toBe('SYS 00:05:09')
    expect(formatSysTime(new Date(2026, 0, 1, 23, 59, 59))).toBe('SYS 23:59:59')
  })
})

describe('telHref', () => {
  it('keeps the plus sign and digits only', () => {
    expect(telHref('+1 469 322 9899')).toBe('tel:+14693229899')
    expect(telHref('+84 908 107 552')).toBe('tel:+84908107552')
  })
})

describe('splitStop', () => {
  it('splits a trailing full stop from the word', () => {
    expect(splitStop('Done.')).toEqual(['Done', '.'])
  })
  it('leaves a word without punctuation whole', () => {
    expect(splitStop('Get')).toEqual(['Get', ''])
    expect(splitStop('IT')).toEqual(['IT', ''])
  })
  it('handles other closing marks', () => {
    expect(splitStop('Done!')).toEqual(['Done', '!'])
    expect(splitStop('Done…')).toEqual(['Done', '…'])
  })
})
