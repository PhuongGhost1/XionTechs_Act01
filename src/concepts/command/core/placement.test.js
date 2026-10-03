import { describe, expect, it } from 'vitest'
import { coreAnchorSegment } from '../contract/anchors.js'
import { isFar, placeCore, segmentInto } from './placement.js'

const IDS = ['premise', 'deploy', 'line', 'work', 'ledger', 'done']

describe('segmentInto', () => {
  it('matches contract/anchors.js coreAnchorSegment over a grid of progress', () => {
    const steps = [0, 0.04, 0.1, 0.16, 0.3, 0.5, 0.75, 1]
    const out = {}
    for (const id of IDS) {
      for (const p of steps) {
        const raw = { [id]: p }
        const a = coreAnchorSegment(raw)
        segmentInto(raw, out)
        expect({ from: out.from, to: out.to }).toEqual({ from: a.from, to: a.to })
        expect(out.t).toBeCloseTo(a.t, 12)
      }
    }
    // Later stations win over earlier ones that are still at 1.
    const raw = { premise: 1, deploy: 1, line: 1, work: 0.3 }
    segmentInto(raw, out)
    expect(out.from).toBe('line')
  })

  it('reuses the object it is given', () => {
    const out = { keep: true }
    expect(segmentInto({}, out)).toBe(out)
    expect(out.keep).toBe(true)
  })
})

describe('placeCore', () => {
  const rects = {
    hero: { x: 100, y: 0, width: 100, height: 100 },
    premise: { x: 300, y: 200, width: 200, height: 200 },
  }
  const rectOf = (name, out) => {
    const r = rects[name]
    if (!r) return false
    Object.assign(out, r)
    return true
  }

  it('lerps between the two anchors with the eased progress', () => {
    const out = {}
    expect(placeCore({ premise: 0 }, rectOf, out)).toBe(true)
    expect(out).toMatchObject({ x: 100, y: 0, width: 100 })
    placeCore({ premise: 0.25 }, rectOf, out) // t = 0.5, eased 0.5
    expect(out.x).toBeCloseTo(200, 9)
    expect(out.width).toBeCloseTo(150, 9)
    placeCore({ premise: 0.5 }, rectOf, out)
    expect(out.x).toBeCloseTo(300, 9)
  })

  it('uses the one anchor that is mounted, and reports none', () => {
    const out = {}
    expect(placeCore({ premise: 0.3 }, (n, o) => (n === 'hero' ? (Object.assign(o, rects.hero), true) : false), out)).toBe(true)
    expect(out.x).toBe(100)
    expect(placeCore({}, () => false, out)).toBe(false)
  })
})

describe('isFar', () => {
  it('is true more than a viewport away, either side', () => {
    expect(isFar({ y: 100, height: 300 }, 900)).toBe(false)
    expect(isFar({ y: 2000, height: 300 }, 900)).toBe(true)
    expect(isFar({ y: -1500, height: 300 }, 900)).toBe(true)
    expect(isFar({ y: -400, height: 300 }, 900)).toBe(false)
  })
})
