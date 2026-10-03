import { describe, expect, it } from 'vitest'
import { plateau, progressToScrollY, trackProgress } from '../../runtime/scroll.js'
import {
  BUILD_STEP,
  DWELLS,
  LAST_STEP,
  PLATEAUS,
  STEP_COUNT,
  isLowerRow,
  packetAt,
  plateauPlan,
  rollDirection,
  stepAtPacket,
  stepAtRaw,
  stepTarget,
  stopPercent,
} from './lineModel.js'

describe('plateau plan', () => {
  it('has one ordered, non-overlapping dwell per step, from 0 to 1', () => {
    expect(PLATEAUS).toHaveLength(STEP_COUNT)
    expect(PLATEAUS[0][0]).toBe(0)
    expect(PLATEAUS[LAST_STEP][1]).toBeCloseTo(1, 12)
    for (let i = 0; i < STEP_COUNT; i += 1) {
      const [from, to] = PLATEAUS[i]
      expect(to - from).toBeCloseTo(DWELLS[i], 12)
      if (i > 0) expect(from).toBeGreaterThan(PLATEAUS[i - 1][1])
    }
  })

  it('puts the packet exactly on stop i for the whole of dwell i', () => {
    PLATEAUS.forEach(([from, to], i) => {
      for (const t of [0, 0.25, 0.5, 0.75, 1]) {
        expect(packetAt(from + (to - from) * t)).toBeCloseTo(i / LAST_STEP, 9)
      }
    })
  })

  it('moves the packet linearly between two dwells, the same distance for every pair', () => {
    for (let i = 0; i < LAST_STEP; i += 1) {
      const a = PLATEAUS[i][1]
      const b = PLATEAUS[i + 1][0]
      const quarter = packetAt(a + (b - a) * 0.25)
      const half = packetAt(a + (b - a) * 0.5)
      const threeQuarters = packetAt(a + (b - a) * 0.75)
      const gap = 1 / LAST_STEP
      expect(quarter - i * gap).toBeCloseTo(gap * 0.25, 9)
      expect(half - i * gap).toBeCloseTo(gap * 0.5, 9)
      expect(threeQuarters - i * gap).toBeCloseTo(gap * 0.75, 9)
    }
    const moves = PLATEAUS.slice(1).map(([from], i) => from - PLATEAUS[i][1])
    for (const m of moves) expect(m).toBeCloseTo(moves[0], 12)
  })

  it('is monotonic and agrees with runtime plateau()', () => {
    let last = -1
    for (let r = 0; r <= 1.0000001; r += 0.001) {
      const x = packetAt(r)
      expect(x).toBeGreaterThanOrEqual(last - 1e-9)
      expect(x).toBeCloseTo(plateau(r, PLATEAUS), 12)
      last = x
    }
  })

  it('plateauPlan of a single dwell set is deterministic', () => {
    expect(plateauPlan([0.1, 0.1])).toEqual([
      [0, 0.1],
      [0.9, 1],
    ])
  })
})

describe('step mapping', () => {
  it('gives REQUEST at the start and SCALE at the end, whatever the input', () => {
    expect(stepAtRaw(0)).toBe(0)
    expect(stepAtRaw(-5)).toBe(0)
    expect(stepAtRaw(1)).toBe(LAST_STEP)
    expect(stepAtRaw(9)).toBe(LAST_STEP)
    expect(stepAtRaw(Number.NaN)).toBe(0)
  })

  it('covers all six steps, in order, once each, for a walk down the whole track', () => {
    const seen = []
    for (let r = 0; r <= 1; r += 0.0005) {
      const s = stepAtRaw(r)
      if (seen[seen.length - 1] !== s) seen.push(s)
    }
    expect(seen).toEqual([0, 1, 2, 3, 4, 5])
  })

  it('is reversible: the same raw progress always gives the same step, up or down', () => {
    const down = []
    const up = []
    for (let i = 0; i <= 200; i += 1) down.push(stepAtRaw(i / 200))
    for (let i = 200; i >= 0; i -= 1) up.push(stepAtRaw(i / 200))
    expect(up.reverse()).toEqual(down)
  })

  it('changes at the midpoint of each move', () => {
    for (let i = 0; i < LAST_STEP; i += 1) {
      const a = PLATEAUS[i][1]
      const b = PLATEAUS[i + 1][0]
      expect(stepAtRaw(a + (b - a) * 0.45)).toBe(i)
      expect(stepAtRaw(a + (b - a) * 0.55)).toBe(i + 1)
    }
    expect(stepAtPacket(0.4)).toBe(2)
  })

  it('maps arbitrary scroll positions of a real track (220 svh at 1440x900 and 200 on a phone)', () => {
    for (const [vh, lvh] of [
      [900, 2.2],
      [844, 2.0],
      [640, 2.0],
    ]) {
      const top = 3000
      const height = vh * lvh
      const span = height - vh
      const seen = new Set()
      for (let y = top - vh; y <= top + height; y += 7) {
        const raw = trackProgress(y, top, height, vh, 'pin')
        const s = stepAtRaw(raw)
        seen.add(s)
        if (y <= top) expect(s).toBe(0)
        if (y >= top + span) expect(s).toBe(LAST_STEP)
      }
      expect([...seen].sort()).toEqual([0, 1, 2, 3, 4, 5])
    }
  })

  it('deep link and reload: the state is a function of scrollY alone', () => {
    const top = 4200
    const height = 1980
    const vh = 900
    const at = (y) => stepAtRaw(trackProgress(y, top, height, vh, 'pin'))
    // Landing at the section's id (scroll-margin-top 64 px) is inside REQUEST.
    expect(at(top - 64)).toBe(0)
    expect(at(top + (height - vh) * 0.5)).toBe(stepAtRaw(0.5))
    // The same scrollY twice gives the same answer.
    expect(at(top + 631)).toBe(at(top + 631))
  })
})

describe('stop targets', () => {
  it('scrolling to a stop lands on that step with the packet on its stop', () => {
    for (let i = 0; i < STEP_COUNT; i += 1) {
      const raw = stepTarget(i)
      expect(stepAtRaw(raw)).toBe(i)
      expect(packetAt(raw)).toBeCloseTo(i / LAST_STEP, 9)
    }
  })

  it('survives the pixel rounding of a real scroll (within a few px of the target)', () => {
    const top = 2000
    const height = 1980
    const vh = 900
    for (let i = 0; i < STEP_COUNT; i += 1) {
      const y = Math.round(progressToScrollY(stepTarget(i), top, height, vh, 'pin'))
      for (const jitter of [-3, -1, 0, 1, 3]) {
        expect(stepAtRaw(trackProgress(y + jitter, top, height, vh, 'pin'))).toBe(i)
      }
    }
  })

  it('clamps and rounds out-of-range requests', () => {
    expect(stepTarget(-3)).toBe(stepTarget(0))
    expect(stepTarget(99)).toBe(stepTarget(LAST_STEP))
  })

  it('REQUEST target is after the core has collapsed (15% of the track) and before the packet moves', () => {
    expect(stepTarget(0)).toBeGreaterThan(0.12)
    expect(stepTarget(0)).toBeLessThanOrEqual(DWELLS[0])
  })
})

describe('small helpers', () => {
  it('rolls forward when the step grows and backward when it shrinks', () => {
    expect(rollDirection(1, 2)).toBe('forward')
    expect(rollDirection(3, 2)).toBe('backward')
  })

  it('places stops evenly from 0 to 100 percent', () => {
    expect([0, 1, 2, 3, 4, 5].map(stopPercent)).toEqual([0, 20, 40, 60, 80, 100])
  })

  it('puts alternate labels on a second row, and BUILD is the failure-beat step', () => {
    expect([0, 1, 2, 3, 4, 5].map(isLowerRow)).toEqual([false, true, false, true, false, true])
    expect(BUILD_STEP).toBe(3)
  })
})
