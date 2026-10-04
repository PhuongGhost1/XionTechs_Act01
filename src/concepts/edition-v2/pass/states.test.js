import { describe, expect, it } from 'vitest'
import { CLEAN, DRAFT, PASS_THRESHOLD, editParts, nextPass, progress } from './states.js'

describe('nextPass', () => {
  it('stays a draft below the threshold', () => {
    expect(nextPass(DRAFT, { ratio: PASS_THRESHOLD - 0.01 })).toBe(DRAFT)
  })
  it('passes at the threshold', () => {
    expect(nextPass(DRAFT, { ratio: PASS_THRESHOLD })).toBe(CLEAN)
  })
  it('never reverts', () => {
    expect(nextPass(CLEAN, { ratio: 0 })).toBe(CLEAN)
  })
  it('is clean at once when motion is off', () => {
    expect(nextPass(DRAFT, { ratio: 0, off: true })).toBe(CLEAN)
  })
})

describe('editParts', () => {
  it('splits around the word', () => {
    expect(editParts('Let’s build it.', 'build')).toEqual({ before: 'Let’s ', match: 'build', after: ' it.' })
  })
  it('returns null for a missing word', () => {
    expect(editParts('abc', 'x')).toBeNull()
    expect(editParts('abc', undefined)).toBeNull()
  })
})

describe('progress', () => {
  it('exit mode runs from top-at-offset to fully past', () => {
    expect(progress({ top: 100, height: 800 }, 900)).toBe(0)
    expect(progress({ top: -400, height: 800 }, 900)).toBe(0.5)
    expect(progress({ top: -900, height: 800 }, 900)).toBe(1)
  })
  it('through mode runs while a sticky child is pinned', () => {
    expect(progress({ top: 60, height: 2000 }, 1000, 'through', 60)).toBe(0)
    expect(progress({ top: -470, height: 2000 }, 1000, 'through', 60)).toBe(0.5)
    expect(progress({ top: -5000, height: 2000 }, 1000, 'through', 60)).toBe(1)
  })
  it('is 0 when there is nothing to scroll', () => {
    expect(progress({ top: 0, height: 500 }, 1000, 'through')).toBe(0)
  })
})
