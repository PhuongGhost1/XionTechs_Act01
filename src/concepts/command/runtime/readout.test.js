import { describe, expect, it } from 'vitest'
import { readoutValues } from './readout.js'

describe('readoutValues: the dock readout only reports what is true (doc 4.9, 9)', () => {
  it('is N/A (null) for render and quality before the tier is known, but motion is always known', () => {
    expect(readoutValues({})).toEqual({ render: null, quality: null, motion: 'on' })
    expect(readoutValues({ tier: null, motionOff: true })).toEqual({ render: null, quality: null, motion: 'off' })
  })

  it('says SVG for every tier until the canvas has painted a frame', () => {
    expect(readoutValues({ tier: 'off' }).render).toBe('svg')
    expect(readoutValues({ tier: 'high', webgl: null }).render).toBe('svg')
    expect(readoutValues({ tier: 'low', webgl: null }).render).toBe('svg')
  })

  it('says WEBGL only when data-webgl is drawn and the tier is not off', () => {
    expect(readoutValues({ tier: 'high', webgl: 'drawn' }).render).toBe('webgl')
    expect(readoutValues({ tier: 'low', webgl: 'drawn' }).render).toBe('webgl')
    // A stale flag after the tier dropped to off (context lost) must not claim WebGL.
    expect(readoutValues({ tier: 'off', webgl: 'drawn' }).render).toBe('svg')
  })

  it('reports the tier as quality', () => {
    for (const tier of ['off', 'low', 'high']) expect(readoutValues({ tier }).quality).toBe(tier)
  })

  it('ignores a value that is not a tier', () => {
    expect(readoutValues({ tier: 'ultra' })).toEqual({ render: null, quality: null, motion: 'on' })
  })
})
