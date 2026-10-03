import { describe, expect, it } from 'vitest'
import { LAYER_COUNT, PORT_X } from '../model/layers.js'
import { CYCLE, PORT_ORDER, REST_TIME, signalAt, signalY, visibleTime } from './signal.js'

describe('hero signal', () => {
  it('descends through the layers without ever going back up within a pass', () => {
    let prev = -1
    for (let t = 0; t < CYCLE; t += 0.02) {
      const s = signalAt(t)
      if (s.alpha === 0 && s.L === LAYER_COUNT - 1) break
      expect(s.L).toBeGreaterThanOrEqual(prev - 1e-9)
      prev = s.L
    }
    expect(prev).toBeGreaterThan(LAYER_COUNT - 2)
  })

  it('stays between the top and the bottom layer, on one of the four ports', () => {
    for (let t = 0; t < CYCLE * 6; t += 0.05) {
      const s = signalAt(t)
      expect(s.L).toBeGreaterThanOrEqual(0)
      expect(s.L).toBeLessThanOrEqual(LAYER_COUNT - 1)
      expect(PORT_X).toContain(s.x)
      expect(s.alpha).toBeGreaterThanOrEqual(0)
      expect(s.alpha).toBeLessThanOrEqual(1)
    }
  })

  it('visits every port in turn and is dark between two passes', () => {
    const ports = [0, 1, 2, 3].map((k) => signalAt(k * CYCLE + 0.1).portIndex)
    expect(ports).toEqual(PORT_ORDER)
    expect(signalAt(CYCLE - 0.05).alpha).toBe(0)
    expect(signalAt(0).alpha).toBe(0)
  })

  it('rests on a layer for a moment instead of sliding straight through', () => {
    const a = signalAt(0.5 + 0.02) // just after it reached the second layer
    const b = signalAt(0.5 + 0.1)
    expect(a.L).toBeCloseTo(1, 5)
    expect(b.L).toBeCloseTo(1, 5)
  })

  it('has a frozen state that is visible, for reduced motion', () => {
    const s = signalAt(REST_TIME)
    expect(s.alpha).toBeCloseTo(1)
    expect(s.L).toBeGreaterThan(1)
    expect(s.L).toBeLessThan(2)
  })

  it('moves a clock frozen in the dark gap to a moment where the signal is visible, and leaves other clocks alone', () => {
    for (let t = 0; t < CYCLE * 4; t += 0.07) {
      const v = visibleTime(t)
      expect(signalAt(v).alpha).toBeGreaterThanOrEqual(0.6)
      if (signalAt(t).alpha >= 0.6) expect(v).toBe(t)
    }
  })

  it('maps a layer coordinate to world height', () => {
    expect(signalY(0, 2)).toBe((LAYER_COUNT - 1) * 2)
    expect(signalY(LAYER_COUNT - 1, 2)).toBe(0)
  })

  it('makes every pass in under five seconds, so no loop is longer than the pause-control threshold', () => {
    expect(CYCLE).toBeLessThan(5)
  })
})
