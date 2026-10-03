import { describe, expect, it } from 'vitest'
import { iso } from '../model/project.js'
import { SLAB } from '../model/layers.js'
import { COMPACT_BELOW, FOV, LABEL_ROOM, basisFor, cameraPose, marginsFor, stackCorners } from './camera.js'

const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]

describe('hero camera basis', () => {
  it('is orthonormal and right-handed at every elevation and azimuth', () => {
    for (const [e, a] of [[90, 0], [71.6, 15], [35.264, 45], [60, 30]]) {
      const { right, up, toCam } = basisFor(e, a)
      expect(dot(right, right)).toBeCloseTo(1)
      expect(dot(up, up)).toBeCloseTo(1)
      expect(dot(toCam, toCam)).toBeCloseTo(1)
      expect(dot(right, up)).toBeCloseTo(0)
      expect(dot(right, toCam)).toBeCloseTo(0)
      expect(dot(up, toCam)).toBeCloseTo(0)
      // right x up = toCam
      const cross = [
        right[1] * up[2] - right[2] * up[1],
        right[2] * up[0] - right[0] * up[2],
        right[0] * up[1] - right[1] * up[0],
      ]
      cross.forEach((v, i) => expect(v).toBeCloseTo(toCam[i]))
    }
  })

  it('has no singularity in the straight-down plan view: x is right, -z is up', () => {
    const { right, up } = basisFor(90, 0)
    expect(right[0]).toBeCloseTo(1)
    expect(right[2]).toBeCloseTo(0)
    expect(up[0]).toBeCloseTo(0)
    expect(up[1]).toBeCloseTo(0)
    expect(up[2]).toBeCloseTo(-1)
  })

  it('reproduces model/project.js iso() at the isometric angle, up to one uniform scale', () => {
    const { right, up } = basisFor(35.264, 45)
    const scale = Math.cos((35.264 * Math.PI) / 180) // iso() is a 30 degree dimetric drawing, 1 / 0.8165 larger
    for (const [x, y, z] of [[1, 0, 2], [-3, 1.5, 2], [4, 3, -1]]) {
      const [sx, sy] = iso(x, y, z)
      expect(dot([x, y, z], right)).toBeCloseTo(sx * scale, 3)
      expect(-dot([x, y, z], up)).toBeCloseTo(sy * scale, 3)
    }
  })
})

describe('hero camera pose', () => {
  const box = { W: 700, H: 760 }

  it('puts the target at the centre of the usable region', () => {
    const pose = cameraPose({ elevation: 60, azimuth: 20, gap: 1.5, ...box })
    const [x, y] = pose.project(...pose.target)
    expect(x).toBeCloseTo(box.W / 2 + pose.ox)
    expect(y).toBeCloseTo(box.H / 2 + pose.oy)
  })

  it('keeps the whole stack inside the box for every stage of the timeline and several box sizes', () => {
    for (const size of [{ W: 700, H: 760 }, { W: 524, H: 600 }, { W: 820, H: 820 }]) {
      for (const [e, a, gap] of [[90, 0, 0.05], [71.6, 15, 0.9], [35.264, 45, 2.2]]) {
        const pose = cameraPose({ elevation: e, azimuth: a, gap, ...size })
        for (const c of stackCorners(gap)) {
          const [x, y] = pose.project(...c)
          expect(x).toBeGreaterThanOrEqual(-1)
          expect(x).toBeLessThanOrEqual(size.W + 1)
          expect(y).toBeGreaterThanOrEqual(-1)
          expect(y).toBeLessThanOrEqual(size.H + 1)
        }
      }
    }
  })

  it('respects the margins when the stack is fitted (within a small perspective tolerance)', () => {
    const pose = cameraPose({ elevation: 35.264, azimuth: 45, gap: 2.2, room: 1, ...box })
    const m = pose.margins
    for (const c of stackCorners(2.2)) {
      const [x, y] = pose.project(...c)
      expect(x).toBeGreaterThanOrEqual(m.l - 6)
      expect(x).toBeLessThanOrEqual(box.W - m.r + 6)
      expect(y).toBeGreaterThanOrEqual(m.t - 6)
      expect(y).toBeLessThanOrEqual(box.H - m.b + 6)
    }
  })

  it('looks straight down in plan view, so a slab projects to an axis-aligned rectangle', () => {
    const pose = cameraPose({ elevation: 90, azimuth: 0, gap: 0.05, ...box })
    const hw = SLAB.w / 2
    const hd = SLAB.d / 2
    const [a, ay] = pose.project(-hw, 0, -hd)
    const [b, by] = pose.project(hw, 0, -hd)
    expect(by).toBeCloseTo(ay, 3)
    expect(b).toBeGreaterThan(a)
  })

  it('comes closer on the dolly and looks lower into the stack', () => {
    const far = cameraPose({ elevation: 35.264, azimuth: 45, gap: 2.2, dolly: 0, ...box })
    const near = cameraPose({ elevation: 35.264, azimuth: 45, gap: 2.2, dolly: 1, ...box })
    expect(near.dist).toBeLessThan(far.dist)
    expect(near.target[1]).toBeLessThan(far.target[1])
  })

  it('has a low field of view so the drawing reads as axonometric', () => {
    expect(FOV).toBeGreaterThanOrEqual(20)
    expect(FOV).toBeLessThanOrEqual(26)
  })

  it('reserves a label column only on boxes wide enough for labels', () => {
    expect(marginsFor(COMPACT_BELOW - 1, 600).r).toBeLessThan(40)
    expect(marginsFor(COMPACT_BELOW + 100, 600, 1).r).toBe(LABEL_ROOM)
    expect(marginsFor(700, 700, 0).r).toBeLessThan(marginsFor(700, 700, 1).r)
  })
})
