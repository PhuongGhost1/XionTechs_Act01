import { describe, expect, it } from 'vitest'
import { getTierReport, lowerFloor, markChunkFailed, minTier, reasonsFor, resolveTier, startTier } from './tier.js'

// A capable desktop: WebGL2 on a real GPU, plenty of cores and memory, fine pointer.
const DESKTOP = {
  webgl2: true,
  renderer: 'ANGLE (NVIDIA GeForce RTX 3060)',
  deviceMemory: 8,
  hardwareConcurrency: 12,
  coarsePointer: false,
  width: 1440,
}

describe('minTier', () => {
  it('picks the cheaper tier', () => {
    expect(minTier('high', 'low')).toBe('low')
    expect(minTier('low', 'high')).toBe('low')
    expect(minTier('off', 'high')).toBe('off')
    expect(minTier('high', 'high')).toBe('high')
  })
})

describe('resolveTier: capability held at or under the session floor (doc 6.2, never upgrade)', () => {
  it('is the device tier while nothing was dropped', () => {
    expect(resolveTier(DESKTOP)).toBe('high')
    expect(resolveTier({ ...DESKTOP, hardwareConcurrency: 4 })).toBe('low')
  })

  it('never goes above the floor, however capable the device', () => {
    expect(resolveTier(DESKTOP, 'low')).toBe('low')
    expect(resolveTier(DESKTOP, 'off')).toBe('off')
  })

  it('MOTION off and RAW force the canvas off, and turning them back restores the tier', () => {
    expect(resolveTier({ ...DESKTOP, motionOff: true })).toBe('off')
    expect(resolveTier({ ...DESKTOP, rawView: true })).toBe('off')
    expect(resolveTier({ ...DESKTOP, motionOff: false, rawView: false })).toBe('high')
  })

  it('a dropped tier is not given back when motion is toggled off and on again', () => {
    let floor = 'high'
    floor = lowerFloor(floor, 'low') // the governor took high away
    expect(resolveTier({ ...DESKTOP, motionOff: true }, floor)).toBe('off')
    expect(resolveTier({ ...DESKTOP, motionOff: false }, floor)).toBe('low')
  })

  it('a failed WebGL chunk keeps the page on the SVG tier', () => {
    expect(resolveTier({ ...DESKTOP, chunkFailed: true })).toBe('off')
  })
})

describe('lowerFloor', () => {
  it('only ever lowers, and ignores anything that is not a tier', () => {
    expect(lowerFloor('high', 'low')).toBe('low')
    expect(lowerFloor('low', 'high')).toBe('low')
    expect(lowerFloor('low', 'off')).toBe('off')
    expect(lowerFloor('off', 'low')).toBe('off')
    expect(lowerFloor('high', 'medium')).toBe('high')
    expect(lowerFloor('high', null)).toBe('high')
  })
})

describe('reasonsFor', () => {
  it('lists the device reasons', () => {
    expect(reasonsFor({ ...DESKTOP, hardwareConcurrency: 4 })).toEqual(['few cores'])
    expect(reasonsFor({ webgl2: false })).toEqual(['no WebGL2'])
    expect(reasonsFor(DESKTOP)).toEqual([])
  })

  it('adds a reason when the floor holds the tier under what the device would get', () => {
    expect(reasonsFor(DESKTOP, 'low')).toEqual(['dropped while running'])
    expect(reasonsFor(DESKTOP, 'high')).toEqual([])
  })

  it('does not blame the runtime when the device was already off for another reason', () => {
    expect(reasonsFor({ ...DESKTOP, motionOff: true }, 'off')).toEqual(['motion off'])
  })
})

describe('without a document (tests, SSR)', () => {
  it('starts as a no-op and reports an unknown tier, which the dock prints as N/A', () => {
    expect(() => startTier()()).not.toThrow()
    expect(getTierReport().tier).toBeNull()
    expect(() => markChunkFailed()).not.toThrow()
  })
})
