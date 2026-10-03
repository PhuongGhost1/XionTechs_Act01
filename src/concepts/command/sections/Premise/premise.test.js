import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { premise } from '../../content/index.js'
import Premise from './index.jsx'

const out = renderToStaticMarkup(createElement(Premise))
const unescape = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;/g, "'")

describe('PREMISE markup', () => {
  it('has the statement as an h2 whose words are each a lit-by-scroll span, plus a drawn full stop', () => {
    expect(out).toContain('<h2 id="premise-title"')
    for (const word of ['We', 'turn', 'requirements', 'into', 'production', 'systems']) {
      expect(out).toContain(`>${word}</span>`)
    }
    expect((out.match(/data-word=""/g) ?? []).length).toBe(7)
    expect(out).toContain('data-fullstop')
  })

  it('carries the plain paragraph and the sourced claim with its leadership-team wording', () => {
    expect(unescape(out)).toContain(premise.paragraph.text)
    expect(unescape(out)).toContain(premise.claim.text)
    expect(premise.claim.text).toContain('leadership team')
    expect(premise.claim.chip.text).toContain('xiontechs.com')
  })

  it('wraps each part of the LIVE chip in an inline-block: the date never breaks at its hyphens unless it is wider than the screen', () => {
    expect(out).toContain('data-chip="live"')
    expect(out).toContain('inline-block max-w-full break-all">captured 2026-09-22<')
  })

  it('parks the core at the premise anchor, dimmed on the figure and not on the anchor', () => {
    expect(out).toContain('data-core-anchor="premise"')
    expect(out).toContain('opacity-[0.35]')
  })

  it('makes the anchor sticky from 1024 px, so the dimmed core stays on screen at the premise stop', () => {
    const css = readFileSync(new URL('./premise.css', import.meta.url), 'utf8')
    const wide = css.slice(css.indexOf('@media (min-width: 1024px)'))
    expect(wide).toMatch(/.premise__anchor {[^}]*position: sticky/)
    // The section stretches its content so the core cell is as tall as the track (room to stick in).
    expect(out).toContain('lg:items-stretch')
  })
})
