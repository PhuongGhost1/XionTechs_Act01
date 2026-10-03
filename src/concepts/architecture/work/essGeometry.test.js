import { describe, expect, it } from 'vitest'
import { work } from '../content.js'
import { copy } from './copy.js'
import { GUTTER, figureAspect, leaderOf, overlaps, toFigureX, veilPath } from './essGeometry.js'

const { areas, screen } = work.ess

describe('ESS areas (verified, measured on the screenshot)', () => {
  it('names six areas with at least one module and one region each', () => {
    expect(areas).toHaveLength(6)
    for (const a of areas) {
      expect(a.label.length).toBeGreaterThan(0)
      expect(a.modules.length).toBeGreaterThan(0)
      expect(a.regions.length).toBeGreaterThan(0)
    }
  })

  it('keeps every region and marker inside the screenshot', () => {
    for (const a of areas) {
      for (const q of a.regions) {
        expect(q.x).toBeGreaterThanOrEqual(0)
        expect(q.y).toBeGreaterThanOrEqual(0)
        expect(q.x + q.w).toBeLessThanOrEqual(100)
        expect(q.y + q.h).toBeLessThanOrEqual(100)
      }
      expect(a.marker.x).toBeGreaterThanOrEqual(0)
      expect(a.marker.x).toBeLessThanOrEqual(100)
      expect(a.marker.y).toBeGreaterThanOrEqual(0)
      expect(a.marker.y).toBeLessThanOrEqual(100)
    }
  })

  it('never shares a region between two areas', () => {
    const all = areas.flatMap((a) => a.regions.map((q) => ({ id: a.id, ...q })))
    for (let i = 0; i < all.length; i += 1) {
      for (let j = i + 1; j < all.length; j += 1) {
        if (all[i].id === all[j].id) continue
        expect(overlaps(all[i], all[j]), `${all[i].id} / ${all[j].id}`).toBe(false)
      }
    }
  })

  it('has a screenshot with an explicit size and alt text', () => {
    expect(screen.width).toBeGreaterThan(0)
    expect(screen.height).toBeGreaterThan(0)
    expect(screen.alt.length).toBeGreaterThan(20)
    expect(copy.ess.sampleNote).not.toMatch(/\d/)
  })
})

describe.each(Object.entries(GUTTER))('%s gutter', (_name, g) => {
  it('keeps the figure box in proportion to the screenshot', () => {
    // The image fills (100 - 2g)% of the box width and the whole box height, so its own ratio must hold.
    const aspect = figureAspect(screen, g)
    expect(aspect * (1 - (2 * g) / 100)).toBeCloseTo(screen.width / screen.height, 6)
    expect(aspect).toBeGreaterThan(screen.width / screen.height)
  })

  it('maps image % to figure % at both edges', () => {
    expect(toFigureX(0, g)).toBe(g)
    expect(toFigureX(100, g)).toBe(100 - g)
  })

  it('draws leaders from the label to the marker with the label on the marker side', () => {
    for (const a of areas) {
      const l = leaderOf(a, g)
      expect(l.gutter.width).toBeGreaterThan(0)
      expect(l.image.width).toBeGreaterThan(0)
      expect(l.markerX).toBeGreaterThan(g)
      expect(l.markerX).toBeLessThan(100 - g)
      if (a.side === 'right') expect(l.labelX).toBeGreaterThan(100 - g)
      else expect(l.labelX).toBeLessThan(g)
      // the two stretches meet at the screenshot's edge
      const gutterEnd = a.side === 'right' ? l.gutter.left : l.gutter.left + l.gutter.width
      const imageStart = a.side === 'right' ? l.image.left + l.image.width : l.image.left
      expect(gutterEnd).toBeCloseTo(imageStart, 6)
    }
  })

  it('keeps the labels on one side apart so they never touch', () => {
    // 22 px label on a 280 px wide screenshot (phone) is 22 / (280 * 956 / 1867) = 15 % of its height
    for (const side of ['left', 'right']) {
      const ys = areas.filter((a) => a.side === side).map((a) => a.marker.y).sort((p, q) => p - q)
      for (let i = 1; i < ys.length; i += 1) expect(ys[i] - ys[i - 1]).toBeGreaterThanOrEqual(15)
    }
  })
})

describe('veilPath', () => {
  it('cuts one window per region', () => {
    const d = veilPath([{ x: 1, y: 2, w: 3, h: 4 }, { x: 10, y: 20, w: 30, h: 40 }])
    expect(d.match(/M/g)).toHaveLength(3)
    expect(d).toContain('M1 2H4V6H1Z')
    expect(d.startsWith('M0 0H100V100H0Z')).toBe(true)
  })
})
