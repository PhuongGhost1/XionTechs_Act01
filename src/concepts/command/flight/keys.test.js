import { describe, expect, it } from 'vitest'
import { contextWord, stepIndex } from './keys'

describe('stepIndex', () => {
  it('moves with the arrows and wraps', () => {
    expect(stepIndex('ArrowRight', 0, 3)).toBe(1)
    expect(stepIndex('ArrowRight', 2, 3)).toBe(0)
    expect(stepIndex('ArrowLeft', 0, 3)).toBe(2)
    expect(stepIndex('ArrowDown', 1, 3)).toBe(2)
    expect(stepIndex('ArrowUp', 1, 3)).toBe(0)
  })
  it('jumps with Home and End, and ignores other keys', () => {
    expect(stepIndex('Home', 2, 3)).toBe(0)
    expect(stepIndex('End', 0, 3)).toBe(2)
    expect(stepIndex('a', 0, 3)).toBeNull()
    expect(stepIndex('ArrowRight', 0, 0)).toBeNull()
  })
})

describe('contextWord', () => {
  it('reads the ring as a word', () => {
    expect(contextWord(0.1, false)).toBe('fresh')
    expect(contextWord(0.5, false)).toBe('filling')
    expect(contextWord(0.85, false)).toBe('full')
    expect(contextWord(0.15, true)).toBe('compacting')
  })
})
