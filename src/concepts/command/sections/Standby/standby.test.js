import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { hero, legend, modules } from '../../content/index.js'
import Standby from './index.jsx'

// Renders the hero to a string in Node (no window: the first render is the desktop band) and
// holds what the design document fixes: one h1, the brief's sentence, the two CTAs as plain
// anchors, four tags as buttons in module order, the legend glyphs, and the honest caption.

const out = renderToStaticMarkup(createElement(Standby))
const unescape = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;/g, "'")

describe('STANDBY markup', () => {
  it('has exactly one h1 that reads the headline, with the full stop drawn and spoken', () => {
    expect((out.match(/<h1/g) ?? []).length).toBe(1)
    for (const line of hero.h1.lines) expect(out).toContain(line)
    expect(out).toContain('data-fullstop')
    expect(out).toContain('<span class="sr-only">.</span>')
  })

  it("quotes the brief's supporting sentence verbatim", () => {
    expect(unescape(out)).toContain(hero.sub.text)
  })

  it('has the two CTAs as plain anchors, the primary one raising the data flow', () => {
    expect(out).toContain(`href="${hero.cta.primary.href}"`)
    expect(out).toContain(`href="${hero.cta.secondary.href}"`)
    expect(hero.cta.primary.href).toBe('#contact')
    expect(hero.cta.secondary.href).toBe('#work')
    // data-flow only on the primary
    expect((out.match(/data-flow/g) ?? []).length).toBe(1)
  })

  it('has four tags as real buttons in module order, NW NE SE SW', () => {
    const tags = [...out.matchAll(/<li class="hero-tag" data-p="(\w+)"/g)].map((m) => m[1])
    expect(tags).toEqual(['nw', 'ne', 'se', 'sw'])
    for (const m of modules) expect(out).toContain(`${m.index} ${m.short}`)
    expect((out.match(/class="hero-tag__btn"/g) ?? []).length).toBe(4)
  })

  it('gives each tag a full three-line form: MOD n, the module name, OFFERED', () => {
    for (const m of modules) {
      expect(unescape(out)).toContain(`MOD ${m.index} / ${m.label} / ${m.state.text}`)
    }
  })

  it('shows the three evidence glyphs with their words, and the artwork caption', () => {
    for (const g of legend.glyphs) expect(out).toContain(g.text)
    for (const kind of ['confirmed', 'pending', 'illustrative']) expect(out).toContain(`data-evidence="${kind}"`)
    expect(out).toContain('LAYOUT IS ARTWORK')
  })

  it('anchors the core for the scene and draws four hairline segments', () => {
    expect(out).toContain('data-core-anchor="hero"')
    expect((out.match(/class="anim-hairline"/g) ?? []).length).toBe(4)
  })

  it('invents no status, number or client', () => {
    expect(out).not.toMatch(/ONLINE|AVAILABLE|SUCCESS|UPTIME|98%|99%|#4821/)
  })
})
