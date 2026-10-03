import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// Parses the real stylesheet so the tokens cannot drift from what is tested (brief 00: WCAG AA for all
// typography, including muted text on dark). Text pairs need 4.5:1, large-only pairs 3:1.

const css = readFileSync(new URL('../architecture.css', import.meta.url), 'utf8')

function block(selector) {
  const start = css.indexOf(`${selector} {`)
  if (start < 0) throw new Error(`no ${selector} block`)
  return css.slice(start, css.indexOf('}', start))
}

function tokens(selector) {
  const out = {}
  for (const m of block(selector).matchAll(/--bp-([a-z0-9-]+):\s*(\d+)\s+(\d+)\s+(\d+)/g)) {
    out[m[1]] = [Number(m[2]), Number(m[3]), Number(m[4])]
  }
  return out
}

const lum = ([r, g, b]) => {
  const c = [r, g, b].map((v) => v / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
}
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

const base = tokens(':root')
const bands = {
  paper: base,
  alt: { ...base, ...tokens("[data-band='alt']") },
  navy: { ...base, ...tokens("[data-band='navy']") },
}

describe('colour tokens', () => {
  for (const [name, t] of Object.entries(bands)) {
    it(`${name}: body text and secondary text pass AA on both backgrounds`, () => {
      for (const bg of ['bg', 'bg2']) {
        expect(ratio(t.text, t[bg]), `text on ${bg}`).toBeGreaterThanOrEqual(4.5)
        expect(ratio(t.mute, t[bg]), `mute on ${bg}`).toBeGreaterThanOrEqual(4.5)
        expect(ratio(t.line, t[bg]), `line on ${bg}`).toBeGreaterThanOrEqual(4.5)
      }
    })
  }

  it('text on a yellow fill passes AA', () => {
    for (const t of Object.values(bands)) expect(ratio(t['on-signal'], t.signal)).toBeGreaterThanOrEqual(4.5)
  })

  it('yellow is allowed as text only on the navy band', () => {
    expect(ratio(bands.navy.signal, bands.navy.bg)).toBeGreaterThanOrEqual(4.5)
    // On paper it is a fill and a line, never text: the contrast is far below AA.
    expect(ratio(bands.paper.signal, bands.paper.bg)).toBeLessThan(3)
  })

  it('uses the brief 02 palette', () => {
    expect(bands.paper.bg).toEqual([247, 246, 241]) // Paper #F7F6F1
    expect(bands.paper.line).toEqual([8, 35, 74]) // Deep Navy, close to #08234A
    expect(bands.paper.signal).toEqual([244, 196, 0]) // Yellow #F4C400
    expect(bands.paper.rule).toEqual([217, 222, 229]) // Line Gray #D9DEE5
    expect(bands.paper.text).toEqual([16, 24, 32]) // Dark Text #101820
  })
})
