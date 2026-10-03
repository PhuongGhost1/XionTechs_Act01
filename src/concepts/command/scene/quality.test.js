import { describe, expect, it } from 'vitest'
import { decideQuality, qualityProfile } from './quality.js'

const desktop = { webgl: true, hardwareConcurrency: 12, deviceMemory: 8, coarsePointer: false, width: 1440 }

describe('decideQuality', () => {
  it('is high on a capable desktop', () => {
    expect(decideQuality(desktop)).toBe('high')
  })
  it('is static without WebGL, with reduced motion or with data saver', () => {
    expect(decideQuality({ ...desktop, webgl: false })).toBe('static')
    expect(decideQuality({ ...desktop, reducedMotion: true })).toBe('static')
    expect(decideQuality({ ...desktop, saveData: true })).toBe('static')
    expect(decideQuality({})).toBe('static')
  })
  it('is static on a weak touch device', () => {
    expect(decideQuality({ ...desktop, coarsePointer: true, hardwareConcurrency: 4, width: 390 })).toBe('static')
    expect(decideQuality({ ...desktop, coarsePointer: true, hardwareConcurrency: 2, width: 390 })).toBe('static')
  })
  it('is low on narrow, touch or low-memory devices', () => {
    expect(decideQuality({ ...desktop, width: 700 })).toBe('low')
    expect(decideQuality({ ...desktop, coarsePointer: true, hardwareConcurrency: 8, width: 1024 })).toBe('low')
    expect(decideQuality({ ...desktop, deviceMemory: 4 })).toBe('low')
    expect(decideQuality({ ...desktop, width: 768 })).toBe('high')
  })
  it('does not downgrade when hardware hints are missing', () => {
    expect(decideQuality({ webgl: true, width: 1440 })).toBe('high')
    expect(decideQuality({ webgl: true, coarsePointer: true, width: 1024 })).toBe('low')
  })
})

describe('qualityProfile', () => {
  it('caps the pixel ratio and shrinks the budget on low', () => {
    const hi = qualityProfile('high', 3)
    const lo = qualityProfile('low', 3)
    expect(hi.pixelRatio).toBe(2)
    expect(lo.pixelRatio).toBe(1.5)
    expect(hi.antialias).toBe(true)
    expect(lo.antialias).toBe(false)
    expect(lo.powerPreference).toBe('low-power')
    expect(lo.orbitParticles).toBe(hi.orbitParticles / 3)
    expect(lo.packets).toBeLessThan(hi.packets)
    expect(qualityProfile('high', 1).pixelRatio).toBe(1)
  })
})
