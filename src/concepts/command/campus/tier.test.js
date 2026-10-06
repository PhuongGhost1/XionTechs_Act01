import { describe, expect, it } from 'vitest'
import { TIERS, flightTier } from './tier'

const env = (over = {}) => ({ reducedMotion: false, webgl: true, saveData: false, deviceMemory: 8, cores: 8, coarsePointer: false, width: 1440, ...over })

describe('flightTier', () => {
  it('gives a capable desktop the full plot', () => {
    expect(flightTier(env())).toBe('full')
  })
  it('gives phones the lite plot', () => {
    expect(flightTier(env({ width: 390, coarsePointer: true }))).toBe('lite')
  })
  it('gives the SVG drawing to reduced motion, no WebGL and saveData', () => {
    expect(flightTier(env({ reducedMotion: true }))).toBe('svg')
    expect(flightTier(env({ webgl: false }))).toBe('svg')
    expect(flightTier(env({ saveData: true }))).toBe('svg')
  })
  it('gives the SVG drawing to low-power devices', () => {
    expect(flightTier(env({ cores: 2 }))).toBe('svg')
    expect(flightTier(env({ deviceMemory: 2 }))).toBe('svg')
  })
  it('samples phones more coarsely and never gives the drawing a trail', () => {
    expect(TIERS.lite.segments).toBeLessThan(TIERS.full.segments)
    expect(TIERS.lite.trail).toBeLessThan(TIERS.full.trail)
    expect(TIERS.svg.trail).toBe(0)
    expect(TIERS.lite.flat).toBe(true)
  })
})
