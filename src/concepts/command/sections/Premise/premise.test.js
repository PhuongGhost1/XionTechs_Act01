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

  it('wraps the LIVE chip so a date never breaks at its hyphens', () => {
    expect(out).toContain('data-chip="live"')
    expect(out).toContain('whitespace-nowrap">captured 2026-09-22<')
  })

  it('parks the core at the premise anchor, dimmed on the figure and not on the anchor', () => {
    expect(out).toContain('data-core-anchor="premise"')
    expect(out).toContain('opacity-[0.35]')
  })
})
