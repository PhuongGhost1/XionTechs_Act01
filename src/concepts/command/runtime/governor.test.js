import { afterEach, describe, expect, it, vi } from 'vitest'
import { STRIKES, THRESHOLD_MS, WINDOW, createGovernor, median, startGovernor } from './governor.js'

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

describe('startGovernor: the thin rAF timer around the core', () => {
  // A hand driven frame clock and a fake <html>, so the loop runs in Node.
  const setup = () => {
    let callback = null
    const attrs = {}
    vi.stubGlobal('requestAnimationFrame', (fn) => {
      callback = fn
      return 1
    })
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
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
    let now = 1000
    const frame = (dt) => {
      now += dt
      const fn = callback
      callback = null
      fn(now)
    }
    return { attrs, doc, frame }
  }

  afterEach(() => vi.unstubAllGlobals())

  it('is a harmless no-op without requestAnimationFrame', () => {
    const g = startGovernor({ tier: 'high' })
    expect(() => {
      g.stop()
      g.lost()
    }).not.toThrow()
  })

  it('writes data-tier and calls onDrop after two bad windows, then goes quiet', () => {
    const { attrs, frame } = setup()
    const onDrop = vi.fn()
    startGovernor({ tier: 'high', onDrop })
    frame(16) // the first frame only sets the baseline
    for (let i = 0; i < WINDOW * 2; i += 1) frame(40)
    expect(onDrop).toHaveBeenCalledTimes(1)
    expect(onDrop.mock.calls[0][0]).toMatchObject({ from: 'high', to: 'low' })
    expect(attrs['data-tier']).toBe('low')
  })

  it('does not count a hidden tab or a long stall as slow frames', () => {
    const { attrs, doc, frame } = setup()
    const onDrop = vi.fn()
    startGovernor({ tier: 'high', onDrop })
    frame(16)
    for (let i = 0; i < WINDOW * 3; i += 1) frame(400) // stalls over 250 ms are skipped
    doc.hidden = true
    for (let i = 0; i < WINDOW * 3; i += 1) frame(40) // hidden frames are skipped
    expect(onDrop).not.toHaveBeenCalled()
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
