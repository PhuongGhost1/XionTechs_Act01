import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

// Parses the token blocks of edition.css and checks every text pair against WCAG AA.
const css = readFileSync(fileURLToPath(new URL('./edition.css', import.meta.url)), 'utf8')

function block(selector) {
  const start = css.indexOf(`${selector} {`)
  const body = css.slice(start, css.indexOf('}', start))
  const out = {}
  for (const [, name, r, g, b] of body.matchAll(/--pf-([\w-]+):\s*(\d+)\s+(\d+)\s+(\d+)/g)) out[name] = [r, g, b].map(Number)
  return out
}

const root = block(':root')
const bands = {
  paper: root,
  alt: { ...root, ...block("[data-band='alt']") },
  navy: { ...root, ...block("[data-band='navy']") },
}

const lum = (rgb) => {
  const [r, g, b] = rgb.map((v) => v / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

describe.each(Object.entries(bands))('%s band', (name, t) => {
  it.each(['text', 'ink', 'mute'])('%s passes AA on both backgrounds', (fg) => {
    expect(ratio(t[fg], t.bg)).toBeGreaterThanOrEqual(4.5)
    expect(ratio(t[fg], t.bg2)).toBeGreaterThanOrEqual(4.5)
  })
  it('text on the marker passes AA', () => {
    expect(ratio(t['on-mark'], t.mark)).toBeGreaterThanOrEqual(4.5)
  })
  it('the marker is a visible non-text mark only where it is used as one', () => {
    // Yellow text is allowed on navy only.
    if (name === 'navy') expect(ratio(t.mark, t.bg)).toBeGreaterThanOrEqual(4.5)
    else expect(ratio(t.mark, t.bg)).toBeLessThan(3)
  })
})
