import { afterEach, describe, expect, it, vi } from 'vitest'
import { CAP_30HZ_MS, STALL_MS, STRIKES, THRESHOLD_MS, WINDOW, createGovernor, looksCapped, median, startGovernor } from './governor.js'

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

describe('a refresh cap is not the fault of WebGL', () => {
  it('knows a steady 30 Hz when it sees one', () => {
    expect([CAP_30HZ_MS.min, CAP_30HZ_MS.max]).toEqual([32, 35])
    expect(looksCapped(new Array(WINDOW).fill(33.3))).toBe(true)
    // Timer jitter around 33.3 ms is still a cap.
    expect(looksCapped(Array.from({ length: WINDOW }, (_, i) => 32.6 + (i % 4) * 0.6))).toBe(true)
    expect(looksCapped(new Array(WINDOW).fill(16.7))).toBe(false)
    expect(looksCapped(new Array(WINDOW).fill(45))).toBe(false)
    expect(looksCapped([])).toBe(false)
  })

  it('never drops the tier on a 30 Hz window, however many come in a row', () => {
    const gov = createGovernor({ tier: 'high' })
    for (let i = 0; i < 10; i += 1) expect(feed(gov, 33.3)).toBeNull()
    expect(gov.tier()).toBe('high')
    const low = createGovernor({ tier: 'low' })
    for (let i = 0; i < 10; i += 1) expect(feed(low, 33.3)).toBeNull()
    expect(low.tier()).toBe('low')
  })

  it('a capped window neither counts as a strike nor resets one', () => {
    const gov = createGovernor({ tier: 'high' })
    feed(gov, 40) // strike one
    expect(feed(gov, 33.3)).toBeNull() // ignored
    expect(feed(gov, 40)).toMatchObject({ from: 'high', to: 'low' }) // strike two, still counted
  })

  it('still drops on real load: slower than the cap, or irregular', () => {
    const slow = createGovernor({ tier: 'high' })
    feed(slow, 50)
    expect(feed(slow, 50)).toMatchObject({ to: 'low' })
    const ragged = createGovernor({ tier: 'high' })
    const window = () => {
      let out = null
      for (let i = 0; i < WINDOW; i += 1) out = ragged.push(i % 2 ? 22 : 38) ?? out // median 30, not clustered
      return out
    }
    window()
    expect(window()).toMatchObject({ to: 'low' })
  })
})

describe('startGovernor: fed by the frames the core drew', () => {
  const setup = () => {
    const attrs = {}
    const doc = {
      hidden: false,
      documentElement: {
        getAttribute: (k) => attrs[k] ?? null,
        setAttribute: (k, v) => {
          attrs[k] = v
        },
        removeAttribute: (k) => delete attrs[k],
      },
    }
    vi.stubGlobal('document', doc)
    return { attrs, doc }
  }

  afterEach(() => vi.unstubAllGlobals())

  it('has no timer of its own: no requestAnimationFrame is needed or used', () => {
    const raf = vi.fn()
    vi.stubGlobal('requestAnimationFrame', raf)
    const g = startGovernor({ tier: 'high' })
    expect(() => {
      g.frame(16)
      g.stop()
      g.lost()
    }).not.toThrow()
    expect(raf).not.toHaveBeenCalled()
  })

  it('writes data-tier and calls onDrop after two bad windows, then goes quiet', () => {
    const { attrs } = setup()
    const onDrop = vi.fn()
    const g = startGovernor({ tier: 'high', onDrop })
    for (let i = 0; i < WINDOW * 2; i += 1) g.frame(40)
    expect(onDrop).toHaveBeenCalledTimes(1)
    expect(onDrop.mock.calls[0][0]).toMatchObject({ from: 'high', to: 'low' })
    expect(attrs['data-tier']).toBe('low')
  })

  it('does not count a hidden tab, a long stall, a missing interval or a 30 Hz cap', () => {
    const { attrs, doc } = setup()
    const onDrop = vi.fn()
    const g = startGovernor({ tier: 'high', onDrop })
    for (let i = 0; i < WINDOW * 3; i += 1) g.frame(STALL_MS + 150) // stalls are skipped
    for (let i = 0; i < WINDOW * 3; i += 1) g.frame(0) // the first frame after a stop has no interval
    for (let i = 0; i < WINDOW * 3; i += 1) g.frame(undefined)
    doc.hidden = true
    for (let i = 0; i < WINDOW * 3; i += 1) g.frame(40) // hidden frames are skipped
    doc.hidden = false
    for (let i = 0; i < WINDOW * 3; i += 1) g.frame(33.3) // a capped display
    expect(onDrop).not.toHaveBeenCalled()
    expect(attrs['data-tier']).toBeUndefined()
  })

  it('ignores frames after stop()', () => {
    const { attrs } = setup()
    const g = startGovernor({ tier: 'high' })
    g.stop()
    for (let i = 0; i < WINDOW * 3; i += 1) g.frame(40)
    expect(attrs['data-tier']).toBeUndefined()
  })

  it('lost() drops straight to off and writes it', () => {
    const { attrs } = setup()
    const onDrop = vi.fn()
    const g = startGovernor({ tier: 'high', onDrop })
    g.lost()
    expect(attrs['data-tier']).toBe('off')
    expect(onDrop).toHaveBeenCalledWith(expect.objectContaining({ from: 'high', to: 'off' }))
    g.lost()
    expect(onDrop).toHaveBeenCalledTimes(1)
  })
})
