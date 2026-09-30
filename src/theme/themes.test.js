import { describe, it, expect } from 'vitest'
import { resolveTheme, THEMES, DEFAULT_THEME } from './themes'

describe('resolveTheme', () => {
  it('uses a valid stored theme over the device preference', () => {
    expect(resolveTheme('aurum', true)).toBe('aurum')
  })
  it('falls back to midnight when the device prefers dark', () => {
    expect(resolveTheme(null, true)).toBe('midnight')
  })
  it('falls back to the default when the device prefers light', () => {
    expect(resolveTheme(null, false)).toBe(DEFAULT_THEME)
  })
  it('ignores an invalid stored value', () => {
    expect(resolveTheme('neon', false)).toBe('navy')
    expect(resolveTheme('neon', true)).toBe('midnight')
  })
  it('exposes exactly three themes', () => {
    expect(THEMES.map((t) => t.id)).toEqual(['navy', 'midnight', 'aurum'])
  })
})
