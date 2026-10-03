import { describe, expect, it } from 'vitest'
import { clamp01, scrollYForProgress, stageAt, stageCentre, stageProgress, stageTick } from './stages.js'

describe('stageAt', () => {
  it('starts at the first stage and ends at the last, whatever p does outside 0..1', () => {
    expect(stageAt(0, 6)).toBe(0)
    expect(stageAt(1, 6)).toBe(5)
    expect(stageAt(-4, 6)).toBe(0)
    expect(stageAt(7, 6)).toBe(5)
    expect(stageAt(Number.NaN, 6)).toBe(0)
  })

  it('cuts 0..1 into equal bands', () => {
    expect(stageAt(0.16, 6)).toBe(0)
    expect(stageAt(0.17, 6)).toBe(1)
    expect(stageAt(0.5, 6)).toBe(3)
    expect(stageAt(0.99, 6)).toBe(5)
    const counts = Array(6).fill(0)
    for (let i = 0; i < 6000; i++) counts[stageAt((i + 0.5) / 6000, 6)]++
    expect(counts).toEqual(Array(6).fill(1000))
  })

  it('never goes back as the visitor scrolls down', () => {
    let prev = 0
    for (let p = 0; p <= 1.0001; p += 0.001) {
      const s = stageAt(p, 6)
      expect(s).toBeGreaterThanOrEqual(prev)
      expect(s - prev).toBeLessThanOrEqual(1)
      prev = s
    }
  })

  it('is safe for a degenerate count', () => {
    expect(stageAt(0.5, 0)).toBe(0)
    expect(stageAt(0.5, 1)).toBe(0)
  })
})

describe('stageProgress', () => {
  it('runs 0..1 inside each band and saturates at the end', () => {
    expect(stageProgress(0, 6)).toBe(0)
    expect(stageProgress(1, 6)).toBe(1)
    expect(stageProgress(0.25, 4)).toBe(0)
    expect(stageProgress(0.125, 4)).toBeCloseTo(0.5)
    expect(stageProgress(0.5 / 6, 6)).toBeCloseTo(0.5)
  })
})

describe('click targets', () => {
  it('lands in the middle of the band it names', () => {
    for (let i = 0; i < 6; i++) expect(stageAt(stageCentre(i, 6), 6)).toBe(i)
  })

  it('maps progress to a scroll position inside the pin', () => {
    const geo = { top: 1000, height: 5000, viewport: 1000 }
    expect(scrollYForProgress(0, geo)).toBe(1000)
    expect(scrollYForProgress(1, geo)).toBe(5000)
    expect(scrollYForProgress(0.5, geo)).toBe(3000)
    expect(scrollYForProgress(2, geo)).toBe(5000)
    for (let i = 0; i < 6; i++) {
      const y = scrollYForProgress(stageCentre(i, 6), geo)
      const p = (y - geo.top) / (geo.height - geo.viewport)
      expect(stageAt(p, 6)).toBe(i)
    }
  })

  it('places ruler ticks at the band starts', () => {
    expect(stageTick(0, 6)).toBe(0)
    expect(stageTick(3, 6)).toBe(0.5)
    expect(clamp01(0.4)).toBe(0.4)
  })
})
