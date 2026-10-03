import { describe, expect, it } from 'vitest'
import { HERO_P, heroHairlines } from '../../core/geometry.js'
import { LEADER_LENGTH, STACK_GAP, TABLET_P, hairlineSegments, heroPlacement, leaderEnd, litArm, tipOf } from './placement.js'

describe('hero placement', () => {
  it('follows the sizes of doc 10.1', () => {
    expect(heroPlacement(320)).toMatchObject({ core: 140, p: HERO_P.phone, tags: 'stack' })
    expect(heroPlacement(390)).toMatchObject({ core: 160, p: HERO_P.phone, tags: 'stack' })
    expect(heroPlacement(768)).toMatchObject({ core: 200, p: TABLET_P, tags: 'stack' })
    expect(heroPlacement(1024)).toMatchObject({ core: 240, p: HERO_P.desktop, tags: 'axis' })
    expect(heroPlacement(1280)).toMatchObject({ core: 280, tags: 'axis' })
    expect(heroPlacement(1440)).toMatchObject({ core: 280, tags: 'axis' })
    expect(heroPlacement(1920)).toMatchObject({ core: 320, tags: 'axis' })
  })

  it('never returns NaN for a bad width', () => {
    expect(heroPlacement(Number.NaN).core).toBeGreaterThan(0)
  })

  it('keeps every arm tip a whole core inside the box', () => {
    for (const short of ['CODE', 'AI', 'CLOUD', 'PRODUCT']) {
      const tip = tipOf(short)
      expect(tip.x).toBeGreaterThan(0)
      expect(tip.x).toBeLessThan(1)
    }
    expect(tipOf('nope')).toBeNull()
  })
})

describe('leader lines', () => {
  it('runs along the page angle in axis mode', () => {
    const { dx, dy } = leaderEnd('ne', 'axis')
    expect(Math.hypot(dx, dy)).toBeCloseTo(LEADER_LENGTH, 6)
    expect(Math.atan(Math.abs(dy / dx)) * (180 / Math.PI)).toBeCloseTo(32, 6)
    expect(dx).toBeGreaterThan(0)
    expect(dy).toBeLessThan(0)
  })

  it('leaves each tip outward: nw up-left, se down-right', () => {
    expect(leaderEnd('nw', 'axis')).toMatchObject({ dx: expect.any(Number) })
    expect(leaderEnd('nw', 'axis').dx).toBeLessThan(0)
    expect(leaderEnd('nw', 'axis').dy).toBeLessThan(0)
    expect(leaderEnd('se', 'axis').dx).toBeGreaterThan(0)
    expect(leaderEnd('se', 'axis').dy).toBeGreaterThan(0)
  })

  it('goes straight up or down in stack mode', () => {
    expect(leaderEnd('nw', 'stack')).toEqual({ dx: 0, dy: -STACK_GAP })
    expect(leaderEnd('sw', 'stack')).toEqual({ dx: 0, dy: STACK_GAP })
  })
})

describe('hairline segments', () => {
  it('gives four segments that all start at P', () => {
    const vw = 1440
    const vh = 900
    const px = vw * 0.72
    const py = vh * 0.3
    const segs = hairlineSegments(heroHairlines(vw, vh), px, py)
    expect(segs).toHaveLength(4)
    for (const s of segs) expect(s.startsWith(`M${px.toFixed(2)} ${py.toFixed(2)}L`)).toBe(true)
  })
})

describe('litArm', () => {
  it('lights nothing when no tag is hovered, focused or opened', () => {
    expect(litArm(-1, -1)).toBeUndefined()
  })

  it('lights the hovered or focused tag, index 0 (CODE) included', () => {
    for (const i of [0, 1, 2, 3]) expect(litArm(i, -1)).toBe(i)
  })

  it('lets hover and focus win over a tag a touch visitor opened', () => {
    expect(litArm(2, 0)).toBe(2)
    expect(litArm(-1, 3)).toBe(3)
  })
})
