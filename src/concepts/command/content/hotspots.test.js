import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  ESS_HOTSPOTS,
  ESS_IMAGE,
  HOTSPOT_CONTAINMENT,
  STAFFXP_HOTSPOTS,
  STAFFXP_IMAGE,
  hotspotEvidence,
} from './hotspots.js'
import { records } from './records.js'

// Doc 8.5 geometry test, WP5. The same assertions are also in content.test.js (WP0 put them there
// as a floor); this file adds what only the committed image files can prove: the natural size is
// read from the webp itself, so the constants cannot drift from the pictures, and the hotspot
// percentages are only meaningful for those pixel sizes.

const file = (name) => readFileSync(new URL(`../../../../public/work/${name}`, import.meta.url))

/** Natural size of a webp (lossy VP8, lossless VP8L or extended VP8X), read from its header. */
function webpSize(buf) {
  expect(buf.toString('ascii', 0, 4)).toBe('RIFF')
  expect(buf.toString('ascii', 8, 12)).toBe('WEBP')
  const kind = buf.toString('ascii', 12, 16)
  if (kind === 'VP8 ') return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff }
  if (kind === 'VP8L') {
    const bits = buf.readUInt32LE(21)
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 }
  }
  if (kind === 'VP8X') {
    return { width: buf.readUIntLE(24, 3) + 1, height: buf.readUIntLE(27, 3) + 1 }
  }
  throw new Error(`unknown webp chunk ${kind}`)
}

const sets = [
  ['staffxp', 'staffxp-dashboard.webp', STAFFXP_IMAGE, STAFFXP_HOTSPOTS],
  ['ess', 'ess-portal.webp', ESS_IMAGE, ESS_HOTSPOTS],
]

describe('the committed screenshots', () => {
  it.each(sets)('%s: the file on disk has the natural size of the constant', (_key, name, size) => {
    expect(webpSize(file(name))).toEqual({ width: size.width, height: size.height })
  })

  it('the constants are the sizes the design document names', () => {
    expect(STAFFXP_IMAGE).toEqual({ width: 1869, height: 958 })
    expect(ESS_IMAGE).toEqual({ width: 1867, height: 956 })
  })

  it.each(sets)('%s: the record points at that file with that size', (key, name, size) => {
    const record = records.find((r) => r.hotspots === key)
    expect(record.image.url).toBe(`/work/${name}`)
    expect(record.image.width).toBe(size.width)
    expect(record.image.height).toBe(size.height)
  })
})

describe.each(sets)('%s hotspot boxes', (key, _name, _size, boxes) => {
  it('lie inside 0 to 100 percent with a positive size', () => {
    for (const b of boxes) {
      expect(b.w, b.id).toBeGreaterThan(0)
      expect(b.h, b.id).toBeGreaterThan(0)
      expect(b.x, b.id).toBeGreaterThanOrEqual(0)
      expect(b.y, b.id).toBeGreaterThanOrEqual(0)
      expect(b.x + b.w, b.id).toBeLessThanOrEqual(100.0001)
      expect(b.y + b.h, b.id).toBeLessThanOrEqual(100.0001)
    }
  })

  it('have unique ids, unique UI codes in order, and a limited-tag word', () => {
    expect(new Set(boxes.map((b) => b.id)).size).toBe(boxes.length)
    expect(boxes.map((b) => b.code)).toEqual(boxes.map((_b, i) => `UI-${String(i + 1).padStart(2, '0')}`))
    for (const b of boxes) {
      expect(b.short, b.id).toMatch(/^[A-Z0-9 ]{2,12}$/)
      expect(b.label.length, b.id).toBeGreaterThan(0)
      expect(b.src, b.id).toBe('FACT')
    }
  })

  it('overlap by at most 5% of the smaller box, except the documented containment', () => {
    const contained = HOTSPOT_CONTAINMENT[key].map(([a, b]) => `${a}|${b}`)
    for (let i = 0; i < boxes.length; i += 1) {
      for (let j = i + 1; j < boxes.length; j += 1) {
        const a = boxes[i]
        const b = boxes[j]
        if (contained.includes(`${a.id}|${b.id}`) || contained.includes(`${b.id}|${a.id}`)) continue
        const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)
        const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y)
        const overlap = w > 0 && h > 0 ? w * h : 0
        const smaller = Math.min(a.w * a.h, b.w * b.h)
        expect(overlap / smaller, `${a.id} vs ${b.id}`).toBeLessThanOrEqual(0.05)
      }
    }
  })

  it('every documented containment is a real containment', () => {
    for (const [outerId, innerId] of HOTSPOT_CONTAINMENT[key]) {
      const outer = boxes.find((b) => b.id === outerId)
      const inner = boxes.find((b) => b.id === innerId)
      expect(outer, outerId).toBeTruthy()
      expect(inner, innerId).toBeTruthy()
      expect(inner.x).toBeGreaterThanOrEqual(outer.x)
      expect(inner.y).toBeGreaterThanOrEqual(outer.y)
      expect(inner.x + inner.w).toBeLessThanOrEqual(outer.x + outer.w)
      expect(inner.y + inner.h).toBeLessThanOrEqual(outer.y + outer.h)
    }
  })
})

describe('the evidence line of the full tag', () => {
  it('is a sourced FACT that says the region is visible in the capture', () => {
    expect(hotspotEvidence.src).toBe('FACT')
    expect(hotspotEvidence.text).toBe('VISIBLE IN CAPTURE')
  })
})
