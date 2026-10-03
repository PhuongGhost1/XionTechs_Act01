import { describe, expect, it } from 'vitest'
import { STATIONS } from '../contract/stations.js'
import { kAlphaFor, plateau, progressToScrollY, stationAt, trackProgress } from './scroll.js'

const VH = 900

describe('trackProgress', () => {
  // A pinned track: top 3000, height 2000 (220 lvh at 900), so it is pinned for 1100 px.
  const top = 3000
  const height = 2000

  it('is 0 before the track and 1 after it, for any scrollY', () => {
    expect(trackProgress(0, top, height, VH)).toBe(0)
    expect(trackProgress(2999, top, height, VH)).toBe(0)
    expect(trackProgress(top, top, height, VH)).toBe(0)
    expect(trackProgress(top + height - VH, top, height, VH)).toBe(1)
    expect(trackProgress(99999, top, height, VH)).toBe(1)
  })

  it('is linear while pinned: 0..1 over height minus the viewport', () => {
    expect(trackProgress(top + 550, top, height, VH)).toBeCloseTo(0.5, 10)
    expect(trackProgress(top + 275, top, height, VH)).toBeCloseTo(0.25, 10)
  })

  it('in span mode runs over the whole track height', () => {
    expect(trackProgress(top + height / 2, top, height, VH, 'span')).toBeCloseTo(0.5, 10)
    expect(trackProgress(top + height, top, height, VH, 'span')).toBe(1)
  })

  it('falls back to span for a track no taller than the viewport', () => {
    expect(trackProgress(top + 450, top, 900, VH)).toBeCloseTo(0.5, 10)
  })

  it('is a pure function of scrollY: any order of calls gives the same answers (load at any hash)', () => {
    const ys = [0, 5000, 3300, 12, 3000, 4100, 3300]
    const first = ys.map((y) => trackProgress(y, top, height, VH))
    const again = [...ys].reverse().map((y) => trackProgress(y, top, height, VH)).reverse()
    expect(again).toEqual(first)
  })

  it('never returns NaN or leaves 0..1, whatever it is given', () => {
    for (const args of [[NaN, 0, 100, 50], [10, undefined, 100, 50], [10, 0, 0, 0], [-500, 0, 100, 50], [1e9, 0, 100, 50]]) {
      const p = trackProgress(...args)
      expect(Number.isNaN(p)).toBe(false)
      expect(p).toBeGreaterThanOrEqual(0)
      expect(p).toBeLessThanOrEqual(1)
    }
  })

  it('has an exact inverse', () => {
    for (const mode of ['pin', 'span']) {
      for (const p of [0, 0.2, 0.5, 1]) {
        const y = progressToScrollY(p, top, height, VH, mode)
        expect(trackProgress(y, top, height, VH, mode)).toBeCloseTo(p, 10)
      }
    }
  })
})

describe('plateau', () => {
  it('is the identity without plateaus', () => {
    for (const p of [0, 0.3, 1]) expect(plateau(p)).toBe(p)
    expect(plateau(0.4, [])).toBe(0.4)
  })

  it('holds still inside a plateau and still runs from 0 to 1', () => {
    const plateaus = [[0.4, 0.6]]
    expect(plateau(0, plateaus)).toBe(0)
    expect(plateau(1, plateaus)).toBe(1)
    expect(plateau(0.4, plateaus)).toBeCloseTo(0.5, 10)
    expect(plateau(0.5, plateaus)).toBeCloseTo(0.5, 10)
    expect(plateau(0.6, plateaus)).toBeCloseTo(0.5, 10)
  })

  it('is monotonic and continuous across several plateaus', () => {
    const plateaus = [[0.2, 0.4], [0.8, 1]]
    let last = -1
    for (let p = 0; p <= 1.0001; p += 0.01) {
      const v = plateau(p, plateaus)
      expect(v).toBeGreaterThanOrEqual(last - 1e-12)
      expect(v - Math.max(last, 0)).toBeLessThan(0.05)
      last = v
    }
    expect(plateau(1, plateaus)).toBe(1)
  })

  it('merges overlaps and ignores empty or out of range intervals', () => {
    expect(plateau(0.5, [[0.3, 0.5], [0.4, 0.7]])).toBeCloseTo(plateau(0.5, [[0.3, 0.7]]), 10)
    expect(plateau(0.5, [[0.5, 0.5], [2, 3]])).toBeCloseTo(0.5, 10)
    expect(plateau(0.5, [[0, 1]])).toBe(0.5)
  })
})

describe('kAlphaFor', () => {
  const done = (...ids) => Object.fromEntries(ids.map((id) => [id, 1]))

  it('shows the X at full strength at the top', () => {
    expect(kAlphaFor({})).toEqual({ k: 0, alpha: 1 })
    expect(kAlphaFor({ standby: 0.5 })).toEqual({ k: 0, alpha: 1 })
  })

  it('dims to 35% over the first half of PREMISE and holds', () => {
    expect(kAlphaFor({ standby: 1, premise: 0.25 }).alpha).toBeCloseTo(0.675, 10)
    expect(kAlphaFor({ standby: 1, premise: 0.5 }).alpha).toBeCloseTo(0.35, 10)
    expect(kAlphaFor({ standby: 1, premise: 1 })).toEqual({ k: 0, alpha: 0.35 })
  })

  it('morphs L0 to L1 over the first third of DEPLOY and plateaus', () => {
    const base = done('standby', 'premise')
    expect(kAlphaFor({ ...base, deploy: 1 / 6 }).k).toBeCloseTo(0.5, 10)
    expect(kAlphaFor({ ...base, deploy: 1 / 3 }).k).toBeCloseTo(1, 10)
    expect(kAlphaFor({ ...base, deploy: 0.9 }).k).toBe(1)
    expect(kAlphaFor({ ...base, deploy: 0.15 }).alpha).toBe(1)
    expect(kAlphaFor({ ...base, deploy: 0.075 }).alpha).toBeCloseTo(0.675, 10)
  })

  it('collapses to the line over the first 15% of THE LINE', () => {
    const base = done('standby', 'premise', 'deploy')
    expect(kAlphaFor({ ...base, line: 0.075 }).k).toBeCloseTo(1.5, 10)
    expect(kAlphaFor({ ...base, line: 0.15 }).k).toBe(2)
    expect(kAlphaFor({ ...base, line: 1 })).toEqual({ k: 2, alpha: 1 })
  })

  it('fades out in ON FILE while k advances invisibly 2 to 3', () => {
    const base = done('standby', 'premise', 'deploy', 'line')
    expect(kAlphaFor({ ...base, work: 0.04 }).alpha).toBeCloseTo(0.5, 10)
    expect(kAlphaFor({ ...base, work: 0.08 }).alpha).toBe(0)
    expect(kAlphaFor({ ...base, work: 0.5 })).toEqual({ k: 2.5, alpha: 0 })
    expect(kAlphaFor({ ...base, work: 1 })).toEqual({ k: 3, alpha: 0 })
  })

  it('has no 3D in the LEDGER', () => {
    expect(kAlphaFor({ ...done('standby', 'premise', 'deploy', 'line', 'work'), ledger: 0.5 })).toEqual({ k: 3, alpha: 0 })
  })

  it('runs the finale: alpha 0 to 1, hold, converge 3 to 4, hold', () => {
    const base = done('standby', 'premise', 'deploy', 'line', 'work', 'ledger')
    expect(kAlphaFor({ ...base, done: 0.1 })).toEqual({ k: 3, alpha: 0.5 })
    expect(kAlphaFor({ ...base, done: 0.2 })).toEqual({ k: 3, alpha: 1 })
    expect(kAlphaFor({ ...base, done: 0.4 })).toEqual({ k: 3, alpha: 1 })
    expect(kAlphaFor({ ...base, done: 0.6 }).k).toBeCloseTo(3.5, 10)
    expect(kAlphaFor({ ...base, done: 0.8 }).k).toBeCloseTo(4, 10)
    expect(kAlphaFor({ ...base, done: 1 })).toEqual({ k: 4, alpha: 1 })
  })

  it('is reversible: the same progress gives the same answer in either direction', () => {
    const up = [0.1, 0.5, 0.9].map((p) => kAlphaFor({ ...done('standby', 'premise', 'deploy', 'line'), work: p }))
    const down = [0.9, 0.5, 0.1].map((p) => kAlphaFor({ ...done('standby', 'premise', 'deploy', 'line'), work: p })).reverse()
    expect(up).toEqual(down)
  })

  it('stays within k 0..4 and alpha 0..1 for any progress, including nonsense', () => {
    for (const v of [-1, 0, 0.3, 1, 2, NaN]) {
      const { k, alpha } = kAlphaFor(Object.fromEntries(['standby', 'premise', 'deploy', 'line', 'work', 'ledger', 'done'].map((id) => [id, v])))
      expect(k).toBeGreaterThanOrEqual(0)
      expect(k).toBeLessThanOrEqual(4)
      expect(alpha).toBeGreaterThanOrEqual(0)
      expect(alpha).toBeLessThanOrEqual(1)
    }
  })
})

describe('stationAt', () => {
  // Tops of a 900 px viewport page: station i starts at the sum of the track heights before it.
  const tops = []
  let y = 64
  for (const s of STATIONS) {
    tops.push(y)
    y += (s.lvh / 100) * VH
  }

  it('finds the station for any scrollY', () => {
    expect(stationAt(0, VH, tops)).toBe(0)
    expect(stationAt(tops[3], VH, tops)).toBe(3)
    expect(stationAt(tops[3] - VH / 2 - 1, VH, tops)).toBe(2)
    expect(stationAt(tops[6] + 5000, VH, tops)).toBe(6)
  })

  it('lands on the right station when a hash puts a track top at the viewport top', () => {
    for (let i = 0; i < tops.length; i += 1) expect(stationAt(tops[i] - 64, VH, tops)).toBe(i)
  })

  it('skips stations that are not registered yet', () => {
    const sparse = [0, undefined, undefined, 3000, undefined, undefined, 9000]
    expect(stationAt(4000, VH, sparse)).toBe(3)
    expect(stationAt(10000, VH, sparse)).toBe(6)
    expect(stationAt(0, VH, [undefined, undefined, 500])).toBe(2)
    expect(stationAt(0, VH, [])).toBe(0)
  })
})
