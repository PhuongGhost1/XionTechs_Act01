import { describe, expect, it } from 'vitest'
import { ROOT_MARGIN, THRESHOLDS, pickActive } from './active.js'
import { ARM_COUNT, clampArm, getArm, getRequest, publishArm, requestArm, subscribeArm, subscribeRequest } from './arm.js'

describe('pickActive', () => {
  it('takes the row with the largest share of the band', () => {
    expect(pickActive([0, 0.2, 0.05, 0], -1)).toBe(1)
    expect(pickActive([0.1, 0, 0, 0.3], 0)).toBe(3)
  })

  it('keeps the current row on a tie, so it does not flicker', () => {
    expect(pickActive([0.15, 0.15, 0, 0], 1)).toBe(1)
    expect(pickActive([0.15, 0.15, 0, 0], 0)).toBe(0)
  })

  it('keeps the current row when no row touches the band', () => {
    expect(pickActive([0, 0, 0, 0], 2)).toBe(2)
    expect(pickActive([0, 0, 0, 0])).toBe(-1)
  })

  it('observes a thin strip across the middle with fine thresholds', () => {
    expect(ROOT_MARGIN).toBe('-45% 0px -45% 0px')
    expect(THRESHOLDS[0]).toBe(0)
    expect(THRESHOLDS.at(-1)).toBe(1)
    expect(THRESHOLDS.length).toBeGreaterThan(10)
  })
})

describe('arm store', () => {
  it('only accepts the four arms', () => {
    expect(ARM_COUNT).toBe(4)
    expect(clampArm(0)).toBe(0)
    expect(clampArm(3)).toBe(3)
    expect(clampArm(4)).toBe(-1)
    expect(clampArm(-1)).toBe(-1)
    expect(clampArm(1.5)).toBe(-1)
    expect(clampArm('1')).toBe(-1)
  })

  it('counts a repeated request for the same arm as a new request', () => {
    const seen = []
    const off = subscribeRequest((r) => seen.push(r))
    requestArm(2)
    requestArm(2)
    requestArm(9) // ignored
    off()
    expect(seen.map((r) => r.arm)).toEqual([2, 2])
    expect(seen[1].seq).toBe(seen[0].seq + 1)
    expect(getRequest().arm).toBe(2)
  })

  it('tells listeners only when the lit arm changes', () => {
    const seen = []
    const off = subscribeArm((a) => seen.push(a))
    publishArm(1)
    publishArm(1)
    publishArm(3)
    off()
    expect(seen).toEqual([1, 3])
    expect(getArm()).toBe(3)
  })
})
