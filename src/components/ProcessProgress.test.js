import { describe, expect, it } from 'vitest'
import { MIN_SPAN, START, activeStep, pipelineProgress, stepReadout, stepState } from './processProgress'
import { process as pipeline } from './content'

describe('pipelineProgress', () => {
  const vh = 900

  it('has not started while the track is below the reading line', () => {
    expect(pipelineProgress(vh, 900, vh)).toBe(0)
    expect(pipelineProgress(vh * START + 1, 900, vh)).toBe(0)
  })

  it('is complete once the track has passed the reading line by its own length, and stays complete', () => {
    expect(pipelineProgress(vh * START - 900, 900, vh)).toBe(1)
    expect(pipelineProgress(-3000, 900, vh)).toBe(1)
  })

  it('keeps the fill front on the reading line for a tall vertical track', () => {
    // 1000 px of track whose top is 200 px above the reading line: the front is 200 px down it.
    expect(pipelineProgress(vh * START - 200, 1000, vh)).toBeCloseTo(0.2)
  })

  it('draws a hairline horizontal track over the minimum span', () => {
    expect(pipelineProgress(vh * START - (vh * MIN_SPAN) / 2, 1, vh)).toBeCloseTo(0.5)
  })

  it('only ever grows as the page scrolls down', () => {
    let last = -1
    for (let top = vh; top > -1500; top -= 41) {
      const t = pipelineProgress(top, 760, vh)
      expect(t).toBeGreaterThanOrEqual(last)
      last = t
    }
  })

  it('never divides by zero', () => {
    expect(Number.isFinite(pipelineProgress(0, 0, 0))).toBe(true)
  })
})

describe('activeStep', () => {
  const n = pipeline.steps.length

  it('starts on the first step and ends on the last', () => {
    expect(activeStep(0, n)).toBe(0)
    expect(activeStep(1, n)).toBe(n - 1)
  })

  it('lights each step exactly when the fill reaches its node', () => {
    for (let i = 0; i < n; i++) {
      expect(activeStep(i / (n - 1), n)).toBe(i)
      if (i > 0) expect(activeStep(i / (n - 1) - 0.01, n)).toBe(i - 1)
    }
  })

  it('stays in range for out-of-range input and a single step', () => {
    expect(activeStep(-1, n)).toBe(0)
    expect(activeStep(2, n)).toBe(n - 1)
    expect(activeStep(0.5, 1)).toBe(0)
  })
})

describe('stepState', () => {
  it('marks the step the fill is on, those behind it, and those ahead', () => {
    expect([0, 1, 2, 3].map((i) => stepState(i, 2))).toEqual(['reached', 'reached', 'current', 'idle'])
  })

  it('reaches every step and singles none out when motion is off', () => {
    expect([0, 1, 2, 3].map((i) => stepState(i, 0, true))).toEqual(['reached', 'reached', 'reached', 'reached'])
  })
})

describe('stepReadout', () => {
  it('counts from one and pads to two digits', () => {
    expect(stepReadout(2, 6)).toBe('Step 03 / 06')
    expect(stepReadout(0, pipeline.steps.length)).toBe('Step 01 / 06')
    expect(stepReadout(11, 12)).toBe('Step 12 / 12')
  })

  it('takes the label from the caller', () => {
    expect(stepReadout(0, 6, 'Phase')).toBe('Phase 01 / 06')
  })
})
