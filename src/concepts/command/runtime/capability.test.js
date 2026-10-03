import { describe, expect, it } from 'vitest'
import { SOFTWARE_RENDERER, describeTier, detectTier, offReasons, readEnvironment, tierReasons } from './capability.js'

// A capable desktop: WebGL2, a real GPU, plenty of cores and memory, fine pointer.
const DESKTOP = {
  webgl2: true,
  renderer: 'ANGLE (NVIDIA GeForce RTX 3060)',
  deviceMemory: 8,
  hardwareConcurrency: 12,
  coarsePointer: false,
  width: 1440,
}

describe('detectTier matrix (doc 6.2)', () => {
  it('gives a capable desktop the high tier', () => {
    expect(detectTier(DESKTOP)).toBe('high')
    expect(tierReasons(DESKTOP)).toEqual([])
  })

  it.each([
    ['no WebGL2', { webgl2: false }],
    ['a software rasteriser (SwiftShader)', { renderer: 'ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device))' }],
    ['a software rasteriser (llvmpipe)', { renderer: 'llvmpipe (LLVM 15.0.7, 256 bits)' }],
    ['a lost context', { contextLost: true }],
    ['a failed chunk', { chunkFailed: true }],
    ['motion off (toggle)', { motionOff: true }],
    ['prefers-reduced-motion', { reducedMotion: true }],
    ['save-data', { saveData: true }],
    ['the RAW view', { rawView: true }],
  ])('turns the canvas off for %s', (_why, patch) => {
    expect(detectTier({ ...DESKTOP, ...patch })).toBe('off')
    expect(offReasons({ ...DESKTOP, ...patch }).length).toBeGreaterThan(0)
  })

  it.each([
    ['4 GB of memory', { deviceMemory: 4 }],
    ['2 GB of memory', { deviceMemory: 2 }],
    ['4 cores', { hardwareConcurrency: 4 }],
    ['2 cores', { hardwareConcurrency: 2 }],
    ['a phone: coarse pointer under 768 px', { coarsePointer: true, width: 390 }],
    ['slow measured frames', { medianFrameMs: 26 }],
  ])('holds %s to the low tier', (_why, patch) => {
    expect(detectTier({ ...DESKTOP, ...patch })).toBe('low')
  })

  it('keeps high on the boundaries just above the limits', () => {
    expect(detectTier({ ...DESKTOP, deviceMemory: 8, hardwareConcurrency: 6 })).toBe('high')
    expect(detectTier({ ...DESKTOP, coarsePointer: true, width: 768 })).toBe('high')
    expect(detectTier({ ...DESKTOP, medianFrameMs: 25 })).toBe('high')
  })

  it('treats unknown memory and cores as fine (Safari and Firefox do not report them)', () => {
    expect(detectTier({ webgl2: true, renderer: 'Apple GPU', width: 1440 })).toBe('high')
  })

  it('lets off win over low', () => {
    expect(detectTier({ ...DESKTOP, deviceMemory: 2, reducedMotion: true })).toBe('off')
    expect(tierReasons({ ...DESKTOP, deviceMemory: 2, reducedMotion: true })).toEqual(['reduced motion'])
  })

  it('treats a missing environment as a device without WebGL', () => {
    expect(detectTier()).toBe('off')
    expect(detectTier({})).toBe('off')
  })

  it('the renderer pattern matches software rasterisers and nothing else', () => {
    expect(SOFTWARE_RENDERER.test('Mesa llvmpipe')).toBe(true)
    expect(SOFTWARE_RENDERER.test('ANGLE (Apple, Apple M2, OpenGL 4.1)')).toBe(false)
    expect(SOFTWARE_RENDERER.test('ANGLE (Intel, Intel(R) UHD Graphics 620)')).toBe(false)
  })

  it('describes the tier for the dock readout', () => {
    expect(describeTier(DESKTOP)).toBe('HIGH')
    expect(describeTier({ ...DESKTOP, hardwareConcurrency: 4 })).toBe('LOW ( few cores )')
    expect(describeTier({ webgl2: false })).toBe('OFF ( no WebGL2 )')
  })
})

describe('readEnvironment', () => {
  it('describes a device without WebGL when there is no window', () => {
    expect(readEnvironment()).toEqual({ webgl2: false })
  })
})
