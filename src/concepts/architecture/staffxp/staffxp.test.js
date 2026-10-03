import { describe, expect, it } from 'vitest'
import { chips, staffxp } from '../content.js'
import { copy } from './copy.js'
import { COUNT, LAYERS, faceKind, indexOfLayer, isDashed, layerCode, shotOf, statusLabel } from './faces.js'

const strings = (value, out = []) => {
  if (typeof value === 'string') out.push(value)
  else if (Array.isArray(value)) value.forEach((v) => strings(v, out))
  else if (value && typeof value === 'object') Object.values(value).forEach((v) => strings(v, out))
  return out
}

describe('the five planes', () => {
  it('are the layers of content.js, top to bottom', () => {
    expect(LAYERS.map((l) => l.id)).toEqual(['experience', 'identity', 'services', 'data', 'infrastructure'])
    expect(COUNT).toBe(5)
    expect(indexOfLayer('data')).toBe(3)
    expect(indexOfLayer('nope')).toBe(-1)
  })

  it('use the real screenshots only where the product shows something', () => {
    expect(LAYERS.map(faceKind)).toEqual(['screen', 'screen', 'hidden', 'bays', 'hidden'])
    expect(shotOf(LAYERS[0])).toBe(staffxp.main)
    expect(shotOf(LAYERS[1])).toBe(staffxp.secondary)
    expect(LAYERS.filter((l) => !l.face).map(shotOf)).toEqual([null, null, null])
  })

  it('give every screenshot explicit dimensions and alt text', () => {
    for (const shot of [staffxp.main, staffxp.secondary]) {
      expect(shot.width).toBeGreaterThan(0)
      expect(shot.height).toBeGreaterThan(0)
      expect(shot.alt.length).toBeGreaterThan(20)
    }
  })

  it('draw unconfirmed layers dashed and confirmed layers solid', () => {
    expect(LAYERS.map(isDashed)).toEqual([false, false, true, false, true])
    expect(statusLabel(LAYERS[0])).toBe(chips.confirmed)
    expect(statusLabel(LAYERS[2])).toBe(chips.reference)
  })

  it('draw the data plane from the modules the navigation names, and nothing else', () => {
    const data = LAYERS[3]
    expect(data.modules).toEqual(['Attendance', 'Notices', 'Activities', 'Wellbeing', 'Extra-curricular', 'T&L'])
    expect(faceKind({ ...data, modules: [] })).toBe('hidden')
  })

  it('number the layers bottom-up like the levels on sheet 02', () => {
    expect(LAYERS.map((_, i) => layerCode(i))).toEqual(['L05', 'L04', 'L03', 'L02', 'L01'])
  })

  it('keep every hotspot box inside the dashboard image', () => {
    for (const h of staffxp.hotspots) {
      expect(h.box.x).toBeGreaterThanOrEqual(0)
      expect(h.box.y).toBeGreaterThanOrEqual(0)
      expect(h.box.x + h.box.w).toBeLessThanOrEqual(100)
      expect(h.box.y + h.box.h).toBeLessThanOrEqual(100)
    }
  })
})

describe('sheet 05 copy', () => {
  const text = strings(copy).join(' \n ')

  it('does not show the brief\'s unconfirmed StaffXP stack or nodes', () => {
    for (const banned of [/\breact\b/i, /\.net\b/i, /mysql/i, /\bcrm\b/i, /\badmin\b/i, /\bmobile\b/i, /\bHR\b/, /\bAPI gateway\b/i]) {
      expect(text, String(banned)).not.toMatch(banned)
    }
  })

  it('has no em dashes and no figures', () => {
    expect(text).not.toMatch(/—/)
    expect(text).not.toMatch(/\d/)
  })

  it('has three view letters for the three captions', () => {
    expect(copy.views).toHaveLength(Object.keys(staffxp.phases).length)
  })
})
