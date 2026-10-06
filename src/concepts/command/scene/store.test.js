import { describe, expect, it } from 'vitest'
import { ANCHOR_ATTR, SECTION_IDS, anchorProps, detectQuality, sceneState, setActiveSection, stepFlow, subscribe } from './store'

const desktop = { reducedMotion: false, webgl: true, saveData: false, deviceMemory: 8, cores: 8, coarsePointer: false, width: 1440 }

describe('detectQuality', () => {
  it('gives a capable desktop the full scene', () => {
    expect(detectQuality(desktop)).toBe('high')
  })
  it('turns the canvas off for reduced motion, no WebGL, or data saver', () => {
    expect(detectQuality({ ...desktop, reducedMotion: true })).toBe('off')
    expect(detectQuality({ ...desktop, webgl: false })).toBe('off')
    expect(detectQuality({ ...desktop, saveData: true })).toBe('off')
  })
  it('lowers quality on phones, touch pointers and weak devices', () => {
    expect(detectQuality({ ...desktop, width: 390 })).toBe('low')
    expect(detectQuality({ ...desktop, coarsePointer: true })).toBe('low')
    expect(detectQuality({ ...desktop, deviceMemory: 2 })).toBe('low')
    expect(detectQuality({ ...desktop, cores: 4 })).toBe('low')
  })
  it('does not penalise a device that does not report memory or cores', () => {
    expect(detectQuality({ ...desktop, deviceMemory: undefined, cores: undefined })).toBe('high')
  })
})

describe('stepFlow', () => {
  it('moves toward the target without overshooting', () => {
    const next = stepFlow(1, 2.6, 1 / 60)
    expect(next).toBeGreaterThan(1)
    expect(next).toBeLessThan(2.6)
  })
  it('settles at the target given enough time', () => {
    expect(stepFlow(1, 2.6, 5)).toBeCloseTo(2.6, 3)
  })
  it('does not move when no time has passed', () => {
    expect(stepFlow(1, 2.6, 0)).toBe(1)
  })
})

describe('active section', () => {
  it('lists the six sections in page order', () => {
    expect(SECTION_IDS).toEqual(['top', 'modules', 'process', 'deployments', 'signals', 'contact'])
  })
  it('notifies subscribers only when the section changes', () => {
    const seen = []
    const off = subscribe((id) => seen.push(id))
    setActiveSection('process')
    setActiveSection('process')
    setActiveSection('modules')
    off()
    setActiveSection('top')
    expect(seen).toEqual(['process', 'modules'])
    expect(sceneState.section).toBe('top')
  })
})

describe('anchorProps', () => {
  it('produces the attribute the scene measures', () => {
    expect(anchorProps('hero')).toEqual({ [ANCHOR_ATTR]: 'hero' })
  })
})
