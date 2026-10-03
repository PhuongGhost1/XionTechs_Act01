import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { records, specRows } from '../content/index.js'
import { Button } from './Button.jsx'
import { Chip } from './Chip.jsx'
import { EvidenceDot } from './Evidence.jsx'
import { SpecRow } from './SpecRow.jsx'
import { CHIP_KINDS, isPendingValue } from './kinds.js'

// The primitives are plain React, so they render to a string in Node. These tests hold the rules
// that matter: a chip is a word, a pending value is always a chip, draft is review-only.

const html = (el) => renderToStaticMarkup(el)

describe('Chip', () => {
  it.each(CHIP_KINDS.filter((k) => k !== 'draft'))('renders %s as a word with data-chip', (kind) => {
    const out = html(createElement(Chip, { kind }))
    expect(out).toContain(`data-chip="${kind}"`)
    expect(out).toContain(`>${kind.toUpperCase()}<`)
  })

  it('shows DRAFT only in review, and nothing otherwise', () => {
    expect(html(createElement(Chip, { kind: 'draft', review: false }))).toBe('')
    expect(html(createElement(Chip, { kind: 'draft', review: true }))).toContain('>DRAFT<')
  })

  it('renders children over the default word and nothing for an unknown kind', () => {
    expect(html(createElement(Chip, { kind: 'pending' }, 'STACK'))).toContain('>STACK<')
    expect(html(createElement(Chip, { kind: 'rainbow' }))).toBe('')
  })

  it('draws illustrative as hatched and pending as dashed', () => {
    expect(html(createElement(Chip, { kind: 'illustrative' }))).toContain('hatch')
    expect(html(createElement(Chip, { kind: 'pending' }))).toContain('border-dashed')
  })
})

describe('SpecRow', () => {
  it('draws the structured pending value as a dashed chip, never as plain text', () => {
    const out = html(createElement(SpecRow, { label: 'DETAILS', value: { pending: true, label: '[ STACK ]' } }))
    expect(out).toContain('data-chip="pending"')
    expect(out).toContain('[ STACK ]')
  })

  it('draws every pending value in the content as a chip', () => {
    let seen = 0
    for (const r of records) {
      for (const row of specRows(r)) {
        if (!isPendingValue(row.value)) continue
        seen += 1
        expect(html(createElement(SpecRow, { label: row.label, value: row.value })), row.id).toContain('data-chip="pending"')
      }
    }
    expect(seen).toBe(2)
  })

  it('prints no row of the content as a bare PENDING word', () => {
    for (const r of records) {
      for (const row of specRows(r)) {
        if (isPendingValue(row.value)) continue
        expect(JSON.stringify(row.value), row.id).not.toMatch(/PENDING/)
      }
    }
  })

  it('draws a muted value (RESULTS) as a dashed line, not a chip', () => {
    const results = specRows(records[0]).find((r) => r.label === 'RESULTS')
    const out = html(createElement(SpecRow, { label: results.label, value: results.value }))
    expect(out).toContain('NOT PUBLISHED')
    expect(out).toContain('border-dashed')
    expect(out).not.toContain('data-chip')
  })

  it('accepts content wrappers for label and value, and a dot leader', () => {
    const out = html(createElement(SpecRow, { label: { text: 'PRODUCT' }, value: { text: 'StaffXP' } }))
    expect(out).toContain('PRODUCT')
    expect(out).toContain('StaffXP')
    expect(out).toContain('data-leader')
  })
})

describe('Button', () => {
  it('is a link with an href and a button without', () => {
    expect(html(createElement(Button, { href: '#contact' }, 'GO'))).toMatch(/^<a href="#contact"/)
    expect(html(createElement(Button, {}, 'GO'))).toMatch(/^<button type="button"/)
  })

  it('is 48 px high, square, and yellow only when primary', () => {
    const primary = html(createElement(Button, { variant: 'primary' }, 'GO'))
    expect(primary).toContain('h-12')
    expect(primary).toContain('rounded-none')
    expect(primary).toContain('bg-signal')
    expect(primary).toContain('data-fill="signal"')
    expect(html(createElement(Button, { variant: 'ghost' }, 'GO'))).not.toContain('bg-signal')
  })

  it('carries data-flow only when asked', () => {
    expect(html(createElement(Button, { flow: true }, 'GO'))).toContain('data-flow=""')
    expect(html(createElement(Button, {}, 'GO'))).not.toContain('data-flow')
  })
})

describe('EvidenceDot', () => {
  it.each(['confirmed', 'pending', 'illustrative'])('draws %s and hides it from assistive tech', (kind) => {
    const out = html(createElement(EvidenceDot, { kind }))
    expect(out).toContain(`data-evidence="${kind}"`)
    expect(out).toContain('aria-hidden="true"')
  })

  it('uses a dash for pending and hatch lines for illustrative', () => {
    expect(html(createElement(EvidenceDot, { kind: 'pending' }))).toContain('stroke-dasharray')
    expect(html(createElement(EvidenceDot, { kind: 'illustrative' }))).toContain('<path')
  })
})
