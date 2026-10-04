import { describe, expect, it } from 'vitest'
import { HERO_LEG_END } from '../contract/anchors.js'
import { STATIONS } from '../contract/stations.js'
import {
  getTickFractions,
  headerHeightFor,
  kAlphaFor,
  needsRemeasure,
  needsRestore,
  pageProgress,
  plateau,
  progressToScrollY,
  savedScrollY,
  shouldLandOnHash,
  stationAt,
  stationScrollY,
  stepStation,
  tickFractions,
  trackProgress,
} from './scroll.js'

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
    expect(kAlphaFor({ standby: 0 })).toEqual({ k: 0, alpha: 1 })
  })

  it('dims to 35% over the hero -> premise leg (STANDBY) and holds through PREMISE', () => {
    expect(kAlphaFor({ standby: HERO_LEG_END / 2 }).alpha).toBeCloseTo(0.675, 10)
    expect(kAlphaFor({ standby: HERO_LEG_END })).toEqual({ k: 0, alpha: 0.35 })
    expect(kAlphaFor({ standby: 1 })).toEqual({ k: 0, alpha: 0.35 })
    expect(kAlphaFor({ standby: 1, premise: 0.25 })).toEqual({ k: 0, alpha: 0.35 })
    expect(kAlphaFor({ standby: 1, premise: 1 })).toEqual({ k: 0, alpha: 0.35 })
  })

  it('is fully dimmed at the premise stop (standby progress 1 - header / track), as the core is placed', () => {
    for (const [vh, header] of [[900, 64], [844, 48], [600, 64]]) {
      const standby = trackProgress(vh, header, vh, vh, 'span')
      expect(kAlphaFor({ standby }).alpha).toBeCloseTo(0.35, 10)
    }
  })

  it('is continuous (no pop) from the hero through PREMISE into DEPLOY', () => {
    const steps = [
      ...Array.from({ length: 101 }, (_, i) => ({ standby: i / 100 })),
      ...Array.from({ length: 101 }, (_, i) => ({ standby: 1, premise: i / 100 })),
      ...Array.from({ length: 101 }, (_, i) => ({ standby: 1, premise: 1, deploy: (i / 100) * 0.3 })),
    ]
    let last = kAlphaFor({}).alpha
    let max = 0
    for (const raw of steps) {
      const { alpha } = kAlphaFor(raw)
      max = Math.max(max, Math.abs(alpha - last))
      last = alpha
    }
    expect(max).toBeLessThan(0.03)
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

  it('keeps the core out through the AGENT RUN, which has no 3D of the core (it is a CSS tape)', () => {
    const base = done('standby', 'premise', 'deploy', 'line', 'work')
    expect(kAlphaFor({ ...base, agent: 0 })).toEqual({ k: 3, alpha: 0 })
    expect(kAlphaFor({ ...base, agent: 0.5 })).toEqual({ k: 3, alpha: 0 })
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
    expect(stationAt(tops[7] + 5000, VH, tops)).toBe(7)
  })

  it('lands on the right station when a hash puts a track top at the viewport top', () => {
    for (let i = 0; i < tops.length; i += 1) expect(stationAt(tops[i] - 64, VH, tops)).toBe(i)
  })

  it('skips stations that are not registered yet', () => {
    const sparse = [0, undefined, undefined, 3000, undefined, undefined, undefined, 9000]
    expect(stationAt(4000, VH, sparse)).toBe(3)
    expect(stationAt(10000, VH, sparse)).toBe(7)
    expect(stationAt(0, VH, [undefined, undefined, 500])).toBe(2)
    expect(stationAt(0, VH, [])).toBe(0)
  })
})

// ---------------------------------------------------------------------------------------------
// WP1: deep links, the scrubber, the resize policy
// ---------------------------------------------------------------------------------------------

describe('deep links and reloads (doc 10.4)', () => {
  // The same page the stationAt block builds: track tops under a 64 px header, 900 px viewport.
  const tops = []
  let y = 64
  for (const s of STATIONS) {
    tops.push(y)
    y += (s.lvh / 100) * VH
  }
  const header = headerHeightFor(1440)

  it('a #hash landing (track top just under the header) always reads as that station', () => {
    for (const s of STATIONS) {
      const landing = stationScrollY(tops[s.index], header)
      expect(stationAt(landing, VH, tops)).toBe(s.index)
    }
  })

  it('every landing starts a pinned track at progress 0 (no state is skipped)', () => {
    for (const s of STATIONS.filter((x) => x.pinned)) {
      const landing = stationScrollY(tops[s.index], header)
      const height = (s.lvh / 100) * VH
      expect(trackProgress(landing, tops[s.index], height, VH, s.mode)).toBe(0)
    }
  })

  it('the whole state is a function of scrollY alone: a reload mid-track equals scrolling there', () => {
    const state = (scrollY) => {
      const raw = Object.fromEntries(
        STATIONS.map((s) => [s.id, trackProgress(scrollY, tops[s.index], (s.lvh / 100) * VH, VH, s.mode)]),
      )
      return { station: stationAt(scrollY, VH, tops), ...kAlphaFor(raw), raw }
    }
    const mid = tops[3] + 700
    const scrolled = [0, 2000, mid].map(state).at(-1)
    const reloaded = state(mid)
    expect(reloaded).toEqual(scrolled)
    expect(reloaded.station).toBe(3)
  })
})

describe('header height and landing rules', () => {
  it('uses the phone header up to 767 px and the desktop header from 768', () => {
    expect(headerHeightFor(320)).toBe(48)
    expect(headerHeightFor(767)).toBe(48)
    expect(headerHeightFor(768)).toBe(64)
    expect(headerHeightFor(1920)).toBe(64)
  })

  it('does not scroll to a hash on a reload or a history step, which restore scroll themselves', () => {
    expect(shouldLandOnHash('#line', 'navigate')).toBe(true)
    expect(shouldLandOnHash('#line', undefined)).toBe(true)
    expect(shouldLandOnHash('#line', 'reload')).toBe(false)
    expect(shouldLandOnHash('#line', 'back_forward')).toBe(false)
    expect(shouldLandOnHash('', 'navigate')).toBe(false)
    expect(shouldLandOnHash('#', 'navigate')).toBe(false)
  })

  it('re-measures layout only when the width changes (a phone toolbar changes height alone)', () => {
    expect(needsRemeasure(390, 390)).toBe(false)
    expect(needsRemeasure(390, 844)).toBe(true)
    expect(needsRemeasure(-1, 1440)).toBe(true)
  })
})

describe('scrubber maths', () => {
  it('pageProgress is scrollY over the scrollable range, clamped, and 0 for a short page', () => {
    expect(pageProgress(0, 10000, 900)).toBe(0)
    expect(pageProgress(4550, 10000, 900)).toBeCloseTo(0.5, 10)
    expect(pageProgress(9100, 10000, 900)).toBe(1)
    expect(pageProgress(99999, 10000, 900)).toBe(1)
    expect(pageProgress(-40, 10000, 900)).toBe(0)
    expect(pageProgress(10, 800, 900)).toBe(0)
  })

  it('stationScrollY never goes negative', () => {
    expect(stationScrollY(64, 64)).toBe(0)
    expect(stationScrollY(30, 64)).toBe(0)
    expect(stationScrollY(1000, 64)).toBe(936)
  })

  it('tickFractions puts station 0 at 0, ends inside 0..1, and rises with the station', () => {
    const tops = [64, 964, 1953, 3304, 5284, 7264, 10144, 10954]
    const ticks = tickFractions(tops, 14000, 900, 64)
    expect(ticks).toHaveLength(8)
    expect(ticks[0]).toBe(0)
    for (let i = 1; i < ticks.length; i += 1) expect(ticks[i]).toBeGreaterThan(ticks[i - 1])
    expect(ticks.at(-1)).toBeLessThanOrEqual(1)
  })

  it('tickFractions leaves unmeasured stations null and survives a page that cannot scroll', () => {
    expect(tickFractions([64, undefined], 11000, 900, 64)[1]).toBeNull()
    expect(tickFractions([64, 500], 800, 900, 64).every((t) => t === null)).toBe(true)
  })

  it('stepStation moves one station and stops at both ends', () => {
    expect(stepStation(3, 1)).toBe(4)
    expect(stepStation(3, -1)).toBe(2)
    expect(stepStation(0, -1)).toBe(0)
    expect(stepStation(7, 1)).toBe(7)
  })

  it('getTickFractions is safe before anything is measured', () => {
    expect(getTickFractions()).toHaveLength(8)
  })
})

describe('restoring the position after a reload (doc 10.4)', () => {
  const stored = (y, w) => JSON.stringify({ y, w })

  it('reads the remembered position at the same viewport width only', () => {
    expect(savedScrollY(stored(6091, 1440), 1440)).toBe(6091)
    expect(savedScrollY(stored(6091, 1440), 390)).toBeNull()
    expect(savedScrollY(stored(0, 1440), 1440)).toBe(0)
  })

  it('ignores anything that is not a saved position', () => {
    for (const raw of [null, undefined, '', 'not json', '{}', '[]', stored(-5, 1440), stored('x', 1440), stored(NaN, 1440)]) {
      expect(savedScrollY(raw, 1440)).toBeNull()
    }
  })

  it('restores unless the browser already did, the visitor moved, or nothing was saved', () => {
    expect(needsRestore(6091, 0, false)).toBe(true)
    expect(needsRestore(6091, 6090, false)).toBe(false)
    expect(needsRestore(6091, 6094, false)).toBe(true)
    expect(needsRestore(6091, 0, true)).toBe(false)
    expect(needsRestore(null, 0, false)).toBe(false)
    expect(needsRestore(0, 500, false)).toBe(true)
  })
})
