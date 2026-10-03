import { describe, expect, it } from 'vitest'
import { ESS_HOTSPOTS, ESS_IMAGE, STAFFXP_HOTSPOTS, STAFFXP_IMAGE } from '../../content/hotspots.js'
import {
  NO_ZOOM,
  activeRegion,
  boxById,
  formatScanTime,
  limitedTag,
  nameSize,
  regionVisible,
  scanRow,
  sectorAt,
  tagAlign,
  tagEdge,
  tagSide,
  veilClip,
  zoomFor,
} from './viewerMath.js'

describe('sector grid A to H by 1 to 5', () => {
  it('names the corners and the middle', () => {
    expect(sectorAt(0, 0)).toBe('A1')
    expect(sectorAt(99.9, 99.9)).toBe('H5')
    expect(sectorAt(50, 50)).toBe('E3')
    expect(sectorAt(12.4, 19.9)).toBe('A1')
    expect(sectorAt(12.6, 20.1)).toBe('B2')
  })

  it('clamps points outside the picture', () => {
    expect(sectorAt(-5, -5)).toBe('A1')
    expect(sectorAt(120, 140)).toBe('H5')
  })

  it('maps the scan line progress to rows 1 to 5', () => {
    expect([0, 0.19, 0.2, 0.5, 0.99, 1].map(scanRow)).toEqual([1, 1, 2, 3, 5, 5])
  })
})

describe('scan timestamp', () => {
  it('prints the local time as HH:MM:SS', () => {
    expect(formatScanTime(new Date(2026, 9, 3, 7, 4, 9))).toBe('07:04:09')
    expect(formatScanTime(new Date(2026, 9, 3, 23, 59, 59))).toBe('23:59:59')
  })
})

describe('giant name size', () => {
  it('keeps the designed size for the product names', () => {
    expect(nameSize('StaffXP', 16)).toBe(16)
    expect(nameSize('ESS', 22)).toBe(22)
  })

  it('shrinks a long generic name so it can fit a line', () => {
    const generic = nameSize('School staff platform', 16)
    expect(generic).toBeLessThan(16)
    expect(generic).toBeGreaterThan(4)
    expect(nameSize('Employee self-service portal', 22)).toBeLessThan(generic + 1)
  })
})

describe('tags', () => {
  it('prints the limited tag as the code and one or two words', () => {
    const calendar = boxById(STAFFXP_HOTSPOTS, 'calendar')
    expect(limitedTag(calendar)).toBe('UI-03 CALENDAR')
  })

  it('hangs a tag below its box at the top of the picture and for the small link box', () => {
    expect(tagSide(boxById(STAFFXP_HOTSPOTS, 'nav'))).toBe('below')
    expect(tagSide(boxById(ESS_HOTSPOTS, 'nav'))).toBe('below')
    expect(tagSide(boxById(STAFFXP_HOTSPOTS, 'mstodo'))).toBe('below')
    expect(tagSide(boxById(STAFFXP_HOTSPOTS, 'calendar'))).toBe('above')
  })

  it('moves the tag of a full-width bar to the right end, clear of the next box', () => {
    expect(tagEdge(boxById(ESS_HOTSPOTS, 'nav'))).toBe('right')
    expect(tagEdge(boxById(ESS_HOTSPOTS, 'profile'))).toBe('left')
    expect(tagEdge(boxById(STAFFXP_HOTSPOTS, 'nav'))).toBe('left')
  })

  it('opens the full tag toward the inside of the picture', () => {
    expect(tagAlign(boxById(STAFFXP_HOTSPOTS, 'calendar'))).toEqual({ h: 'left', v: 'top' })
    expect(tagAlign(boxById(STAFFXP_HOTSPOTS, 'assistant'))).toEqual({ h: 'right', v: 'top' })
    expect(tagAlign(boxById(ESS_HOTSPOTS, 'payslips'))).toEqual({ h: 'left', v: 'bottom' })
  })
})

describe('active region', () => {
  it('lets the pointer win over focus and focus over a pinned region', () => {
    expect(activeRegion({})).toBeNull()
    expect(activeRegion({ pinned: 'a' })).toBe('a')
    expect(activeRegion({ pinned: 'a', focus: 'b' })).toBe('b')
    expect(activeRegion({ pinned: 'a', focus: 'b', hover: 'c' })).toBe('c')
  })
})

describe('veil', () => {
  it('cuts the active box out of a full-size rectangle with an even-odd polygon', () => {
    const clip = veilClip({ x: 10, y: 20, w: 30, h: 40 })
    expect(clip.startsWith('polygon(evenodd,')).toBe(true)
    expect(clip).toContain('10% 20%')
    expect(clip).toContain('40% 60%')
  })
})

describe('zoom to a region (tap on a phone)', () => {
  const phone = { windowWidth: 358, imageWidth: STAFFXP_IMAGE.width }

  it('has an identity transform string for the unzoomed picture', () => {
    expect(NO_ZOOM).toBe('translate(0%, 0%) scale(1)')
  })

  it('never zooms out, and stays below the cap', () => {
    for (const box of [...STAFFXP_HOTSPOTS, ...ESS_HOTSPOTS]) {
      const z = zoomFor(box, phone)
      expect(z.scale).toBeGreaterThanOrEqual(1)
      expect(z.scale).toBeLessThanOrEqual(6)
    }
  })

  it('zooms until the capture text is about 0.8 of its native size, when the region allows', () => {
    const calendar = zoomFor(boxById(STAFFXP_HOTSPOTS, 'calendar'), phone)
    // 358 / 1869 is the phone scale of the picture; 0.8 / that is the readable zoom.
    expect(calendar.scale).toBeCloseTo(0.8 / (358 / 1869), 1)
  })

  it('stops at the scale where the region still fills the window width', () => {
    const profile = zoomFor(boxById(ESS_HOTSPOTS, 'profile'), { windowWidth: 358, imageWidth: ESS_IMAGE.width })
    expect(profile.scale).toBeLessThanOrEqual(100 / (95.2 + 4) + 0.001)
    expect(profile.scale).toBeGreaterThanOrEqual(1)
  })

  it('keeps the region in view for every box of both captures, at 320, 390 and 768 wide', () => {
    for (const windowWidth of [288, 358, 720]) {
      for (const [boxes, size] of [
        [STAFFXP_HOTSPOTS, STAFFXP_IMAGE],
        [ESS_HOTSPOTS, ESS_IMAGE],
      ]) {
        for (const box of boxes) {
          const z = zoomFor(box, { windowWidth, imageWidth: size.width })
          expect(regionVisible(box, z), `${box.id} at ${windowWidth}`).toBe(true)
        }
      }
    }
  })

  it('never translates the stage so far that empty space shows', () => {
    for (const box of STAFFXP_HOTSPOTS) {
      const z = zoomFor(box, phone)
      const view = 100 / z.scale
      const vx = -z.tx / z.scale
      const vy = -z.ty / z.scale
      expect(vx).toBeGreaterThanOrEqual(-1e-9)
      expect(vy).toBeGreaterThanOrEqual(-1e-9)
      expect(vx + view).toBeLessThanOrEqual(100 + 1e-9)
      expect(vy + view).toBeLessThanOrEqual(100 + 1e-9)
    }
  })

  it('shows a region taller than the view from its top edge', () => {
    const assistant = boxById(STAFFXP_HOTSPOTS, 'assistant')
    const z = zoomFor(assistant, phone)
    const vy = -z.ty / z.scale
    expect(vy).toBeLessThanOrEqual(assistant.y)
    expect(vy).toBeGreaterThanOrEqual(assistant.y - 3)
  })
})
