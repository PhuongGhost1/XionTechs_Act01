import { describe, expect, it } from 'vitest'
import { STRIKES, THRESHOLD_MS, WINDOW, createGovernor, median } from './governor.js'

// Feed one full window of identical frames; returns the last push result.
const feed = (gov, ms) => {
  let out = null
  for (let i = 0; i < WINDOW; i += 1) out = gov.push(ms) ?? out
  return out
}

describe('median', () => {
  it('handles odd, even and unsorted input', () => {
    expect(median([3, 1, 2])).toBe(2)
    expect(median([4, 1, 3, 2])).toBe(2.5)
  })
})

describe('governor hysteresis (doc 6.2)', () => {
  it('uses 90 frame windows, 25 ms then 30 ms, two strikes', () => {
    expect([WINDOW, THRESHOLD_MS.high, THRESHOLD_MS.low, STRIKES]).toEqual([90, 25, 30, 2])
  })

  it('stays high on healthy frames', () => {
    const gov = createGovernor({ tier: 'high' })
    for (let i = 0; i < 5; i += 1) expect(feed(gov, 16)).toBeNull()
    expect(gov.tier()).toBe('high')
  })

  it('needs two bad windows in a row to drop high to low', () => {
    const gov = createGovernor({ tier: 'high' })
    expect(feed(gov, 30)).toBeNull()
    expect(gov.tier()).toBe('high')
    expect(feed(gov, 30)).toMatchObject({ from: 'high', to: 'low' })
    expect(gov.tier()).toBe('low')
  })

  it('a good window in between resets the count', () => {
    const gov = createGovernor({ tier: 'high' })
    feed(gov, 30)
    feed(gov, 16)
    expect(feed(gov, 30)).toBeNull()
    expect(gov.tier()).toBe('high')
  })

  it('judges by the median, so a few spikes do not count', () => {
    const gov = createGovernor({ tier: 'high' })
    for (let w = 0; w < 3; w += 1) {
      let out = null
      for (let i = 0; i < WINDOW; i += 1) out = gov.push(i % 10 === 0 ? 200 : 16) ?? out
      expect(out).toBeNull()
    }
    expect(gov.tier()).toBe('high')
  })

  it('drops low to off only above 30 ms, twice in a row', () => {
    const gov = createGovernor({ tier: 'low' })
    for (let i = 0; i < 4; i += 1) expect(feed(gov, 28)).toBeNull()
    expect(feed(gov, 31)).toBeNull()
    expect(feed(gov, 31)).toMatchObject({ from: 'low', to: 'off' })
  })

  it('never upgrades, and does nothing once off', () => {
    const gov = createGovernor({ tier: 'high' })
    feed(gov, 40)
    feed(gov, 40)
    expect(gov.tier()).toBe('low')
    for (let i = 0; i < 5; i += 1) feed(gov, 8)
    expect(gov.tier()).toBe('low')
    feed(gov, 40)
    feed(gov, 40)
    expect(gov.tier()).toBe('off')
    expect(feed(gov, 40)).toBeNull()
    expect(gov.tier()).toBe('off')
  })

  it('goes straight to off when the context is lost, and ignores non-finite frames', () => {
    const gov = createGovernor({ tier: 'high' })
    expect(gov.push(NaN)).toBeNull()
    expect(gov.lost()).toMatchObject({ from: 'high', to: 'off' })
    expect(gov.tier()).toBe('off')
    expect(gov.lost()).toBeNull()
  })
})
