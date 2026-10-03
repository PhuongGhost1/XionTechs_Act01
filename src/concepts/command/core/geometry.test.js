import { describe, expect, it } from 'vitest'
import { ARM_ORDER, HERO_ANGLE_DEG, X_TIPS, heroHairlines } from './geometry'

describe('hero geometry', () => {
  it('puts the four arm tips in the four corners, symmetric about the centre', () => {
    expect(ARM_ORDER).toEqual(['code', 'ai', 'cloud', 'product'])
    for (const id of ARM_ORDER) {
      const t = X_TIPS[id]
      expect(Math.abs(t.x - 0.5)).toBeCloseTo(0.425, 3)
      expect(Math.abs(t.y - 0.5)).toBeCloseTo(0.264, 3)
    }
    expect(X_TIPS.code.placement).toBe('nw')
    expect(X_TIPS.cloud.placement).toBe('se')
  })

  it('uses the page angle for the hairlines and crosses them at P', () => {
    expect(HERO_ANGLE_DEG).toBe(32)
    const [a, b] = heroHairlines(1440, 900)
    const px = 1440 * 0.72
    const py = 900 * 0.3
    const y = (line, x) => line[1] + ((line[3] - line[1]) * (x - line[0])) / (line[2] - line[0])
    expect(y(a, px)).toBeCloseTo(py, 5)
    expect(y(b, px)).toBeCloseTo(py, 5)
    // one rises and one falls, at the same angle
    const rise = (line) => (line[3] - line[1]) / (line[2] - line[0])
    expect(rise(a) * rise(b)).toBeLessThan(0)
    expect(Math.atan(Math.abs(rise(a))) * (180 / Math.PI)).toBeCloseTo(32, 5)
  })
})
