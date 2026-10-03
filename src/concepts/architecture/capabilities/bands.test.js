import { describe, expect, it } from 'vitest'
import { capabilities, sheetOf } from '../content.js'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import Glyph from './Glyph.jsx'
import { GLYPH_NAMES, bandIds, drawingCode, focusTarget, nextOpen } from './bands.js'

describe('accordion', () => {
  it('keeps one band open: opening another replaces it, choosing the open one closes it', () => {
    expect(nextOpen('discovery', 'product')).toBe('product')
    expect(nextOpen('product', 'product')).toBeNull()
    expect(nextOpen(null, 'ai')).toBe('ai')
  })

  it('moves focus with the arrow keys, Home and End, wrapping at the ends', () => {
    expect(focusTarget('ArrowDown', 0, 6)).toBe(1)
    expect(focusTarget('ArrowDown', 5, 6)).toBe(0)
    expect(focusTarget('ArrowUp', 0, 6)).toBe(5)
    expect(focusTarget('Home', 3, 6)).toBe(0)
    expect(focusTarget('End', 3, 6)).toBe(5)
    expect(focusTarget('Enter', 3, 6)).toBeNull()
  })
})

describe('drawings', () => {
  it('draws a glyph for every layer in the content', () => {
    for (const layer of capabilities.layers) expect(GLYPH_NAMES, layer.id).toContain(layer.glyph)
  })

  it('renders every glyph, small and large, and nothing for an unknown name', () => {
    for (const name of GLYPH_NAMES) {
      expect(renderToStaticMarkup(h(Glyph, { name })), name).toContain('<svg')
      expect(renderToStaticMarkup(h(Glyph, { name, large: true })), name).toContain('gl-draw')
    }
    expect(renderToStaticMarkup(h(Glyph, { name: 'nope' }))).toBe('')
  })

  it('codes the six drawings A-003.1 to A-003.6 from the sheet code', () => {
    const code = sheetOf('capabilities').code
    expect(capabilities.layers.map((_, i) => drawingCode(code, i))).toEqual(['A-003.1', 'A-003.2', 'A-003.3', 'A-003.4', 'A-003.5', 'A-003.6'])
  })

  it('gives header and panel distinct ids per layer', () => {
    const ids = capabilities.layers.flatMap((l) => Object.values(bandIds('cap', l.id)))
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('the layers the glyphs depict', () => {
  it('has one keynote per item (three or four), so the numbered bubbles match the list', () => {
    for (const layer of capabilities.layers) {
      expect(layer.items.length, layer.id).toBeGreaterThanOrEqual(3)
      expect(layer.items.length, layer.id).toBeLessThanOrEqual(4)
    }
  })
})
