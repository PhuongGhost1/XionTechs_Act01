import { describe, it, expect } from 'vitest'
import { MIN_SPAN, START, activeStage, timelineProgress } from './ProcessProgress'
import { howWeWork } from '../content/site'

describe('timelineProgress', () => {
  const vh = 900

  it('has not started while the timeline is below the start line', () => {
    expect(timelineProgress(vh, 300, vh)).toBe(0)
    expect(timelineProgress(vh * START + 1, 300, vh)).toBe(0)
  })

  it('is complete once the timeline has scrolled past and stays complete', () => {
    expect(timelineProgress(-2000, 300, vh)).toBe(1)
    expect(timelineProgress(-200, 300, vh)).toBe(1)
  })

  it('draws a short timeline over at least the minimum span', () => {
    const start = vh * START
    expect(timelineProgress(start - (vh * MIN_SPAN) / 2, 200, vh)).toBeCloseTo(0.5)
  })

  it('draws a tall timeline over its own height', () => {
    const start = vh * START
    expect(timelineProgress(start - 600, 1200, vh)).toBeCloseTo(0.5)
  })

  it('only ever grows as the page scrolls down', () => {
    let last = -1
    for (let top = vh; top > -1500; top -= 37) {
      const t = timelineProgress(top, 760, vh)
      expect(t).toBeGreaterThanOrEqual(last)
      last = t
    }
  })

  it('never divides by zero', () => {
    expect(Number.isFinite(timelineProgress(0, 0, 0))).toBe(true)
  })
})

describe('activeStage', () => {
  const n = howWeWork.steps.length

  it('starts on the first stage and ends on the last', () => {
    expect(activeStage(0, n)).toBe(0)
    expect(activeStage(1, n)).toBe(n - 1)
  })

  it('activates each stage exactly when the line reaches it', () => {
    for (let i = 0; i < n; i++) {
      expect(activeStage(i / (n - 1), n)).toBe(i)
      if (i > 0) expect(activeStage(i / (n - 1) - 0.01, n)).toBe(i - 1)
    }
  })

  it('stays in range for out-of-range input and a single stage', () => {
    expect(activeStage(-1, n)).toBe(0)
    expect(activeStage(2, n)).toBe(n - 1)
    expect(activeStage(0.5, 1)).toBe(0)
  })
})
