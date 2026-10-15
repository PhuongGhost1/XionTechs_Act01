import { describe, expect, it } from 'vitest'
import { TIERS, campusTier } from './tier'

const env = (over = {}) => ({ reducedMotion: false, webgl: true, saveData: false, deviceMemory: 8, cores: 8, coarsePointer: false, width: 1440, ...over })

describe('campusTier', () => {
  it('gives a capable desktop the full campus', () => {
    expect(campusTier(env())).toBe('full')
  })
  it('gives phones the lite campus', () => {
    expect(campusTier(env({ width: 390, coarsePointer: true }))).toBe('lite')
  })
  it('gives the SVG drawing to reduced motion, no WebGL and saveData', () => {
    expect(campusTier(env({ reducedMotion: true }))).toBe('svg')
    expect(campusTier(env({ webgl: false }))).toBe('svg')
    expect(campusTier(env({ saveData: true }))).toBe('svg')
  })
  it('gives the SVG drawing to low-power devices', () => {
    expect(campusTier(env({ cores: 2 }))).toBe('svg')
    expect(campusTier(env({ deviceMemory: 2 }))).toBe('svg')
  })
  it('draws less on phones: a lower pixel ratio, no antialiasing, no desks, a flatter camera', () => {
    expect(TIERS.lite.dpr).toBeLessThan(TIERS.full.dpr)
    expect(TIERS.lite.antialias).toBe(false)
    expect(TIERS.lite.seats).toBe(false)
    expect(TIERS.lite.flat).toBe(true)
  })
})
