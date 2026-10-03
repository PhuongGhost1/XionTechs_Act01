import { describe, expect, it } from 'vitest'
import { LOGO } from './logoPoints.js'
import { convergeProgress, hash, logoBox, pointAt, startPoint } from './converge.js'

describe('logo points', () => {
  it('is a consistent, bounded point cloud with a yellow mark', () => {
    expect(LOGO.x.length).toBe(LOGO.y.length)
    expect(LOGO.yellow.length).toBe(LOGO.x.length)
    expect(LOGO.x.length).toBeGreaterThan(300)
    expect(LOGO.x.length).toBeLessThanOrEqual(700)
    for (let i = 0; i < LOGO.x.length; i++) {
      expect(LOGO.x[i]).toBeGreaterThanOrEqual(0)
      expect(LOGO.x[i]).toBeLessThan(LOGO.width)
      expect(LOGO.y[i]).toBeGreaterThanOrEqual(0)
      expect(LOGO.y[i]).toBeLessThan(LOGO.height)
    }
    expect(LOGO.yellow).toContain('1')
  })
})

describe('converge', () => {
  const w = 1000
  const h = 500
  const box = logoBox(w, h, LOGO.width, LOGO.height)

  it('hash is deterministic and in 0..1', () => {
    expect(hash(7, 2)).toBe(hash(7, 2))
    for (let i = 0; i < 50; i++) {
      const v = hash(i, 1)
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

  it('starts on the X and ends on the logo pixel', () => {
    for (const i of [0, 1, 50, 300]) {
      const s = startPoint(i)
      const a = pointAt(i, 0, w, h, box, LOGO.x[i], LOGO.y[i])
      expect(a.x).toBeCloseTo(s.x * w, 5)
      expect(a.y).toBeCloseTo(s.y * h, 5)
      const b = pointAt(i, 1, w, h, box, LOGO.x[i], LOGO.y[i])
      expect(b.x).toBeCloseTo(box.left + (LOGO.x[i] + 0.5) * box.scale, 5)
      expect(b.y).toBeCloseTo(box.top + (LOGO.y[i] + 0.5) * box.scale, 5)
    }
  })

  it('moves monotonically toward the target', () => {
    const i = 12
    const tx = LOGO.x[i]
    const ty = LOGO.y[i]
    const ex = box.left + (tx + 0.5) * box.scale
    let prev = Infinity
    for (let k = 0; k <= 10; k++) {
      const d = Math.abs(pointAt(i, k / 10, w, h, box, tx, ty).x - ex)
      expect(d).toBeLessThanOrEqual(prev + 1e-9)
      prev = d
    }
  })

  it('maps flow progress to convergence', () => {
    expect(convergeProgress(0)).toBe(0)
    expect(convergeProgress(0.5)).toBe(1)
    expect(convergeProgress(0.3)).toBeGreaterThan(0)
    expect(convergeProgress(0.3)).toBeLessThan(1)
  })
})
