import { describe, expect, it } from 'vitest'
import { FOCUSABLE, focusablesIn, inertBehind, trapTarget } from './focus.js'

describe('trapTarget: Tab stays inside the open menu', () => {
  it('lets the browser move focus inside the list', () => {
    expect(trapTarget(1, 5, false)).toBeNull()
    expect(trapTarget(3, 5, true)).toBeNull()
  })

  it('wraps from the last control to the first on Tab', () => {
    expect(trapTarget(4, 5, false)).toBe(0)
  })

  it('wraps from the first control to the last on Shift+Tab', () => {
    expect(trapTarget(0, 5, true)).toBe(4)
  })

  it('pulls focus in when it is outside the trap', () => {
    expect(trapTarget(-1, 5, false)).toBe(0)
    expect(trapTarget(-1, 5, true)).toBe(4)
  })

  it('does nothing for an empty trap, and a single control keeps focus on itself', () => {
    expect(trapTarget(-1, 0, false)).toBeNull()
    expect(trapTarget(0, 1, false)).toBe(0)
    expect(trapTarget(0, 1, true)).toBe(0)
  })
})

describe('DOM helpers without a document', () => {
  it('are safe no-ops', () => {
    expect(focusablesIn(null)).toEqual([])
    expect(() => inertBehind(['#main'])()).not.toThrow()
    expect(FOCUSABLE).toContain('button')
  })
})
