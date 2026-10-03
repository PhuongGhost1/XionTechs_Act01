import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { records } from '../../content/index.js'
import Ledger from '../Ledger/index.jsx'
import DemoRow from './DemoRow.jsx'
import OnFile from './index.jsx'
import Plate from './Plate.jsx'

// Markup of the ON FILE and LEDGER stations, rendered on the server (no DOM in this environment).
// It checks what must hold whatever the browser does: real text for every fact, dashed chips for
// pending values, the image attributes that avoid the lazy-loading trap, NAME_PRODUCTS.

const html = (el) => renderToStaticMarkup(el)
const staffxp = records.find((r) => r.id === 'dep-001')
const ess = records.find((r) => r.id === 'dep-002')
const demo = records.find((r) => r.id === 'dep-003')

describe('a plate', () => {
  const markup = html(createElement(Plate, { record: staffxp, index: 0 }))

  it('prints the product name, the descriptor and the real spec rows as text', () => {
    expect(markup).toContain('>StaffXP<')
    expect(markup).toContain('a staff experience platform for schools')
    for (const label of ['PRODUCT', 'IS', 'CAPTURE SHOWS', 'SIGN-IN', 'DETAILS', 'RESULTS']) {
      expect(markup, label).toContain(`>${label}<`)
    }
    expect(markup).toContain('Sign in with Microsoft')
  })

  it('draws the pending details row as a dashed chip and the results line as muted dashed text', () => {
    expect(markup).toMatch(/data-chip="pending"[^>]*>\[ STACK · STATUS · CLIENT \] \( PENDING TEAM CONFIRMATION \)</)
    expect(markup).toMatch(/border-dashed[^>]*>NOT PUBLISHED</)
    // exactly one pending chip: one row, not four
    expect(markup.match(/data-chip="pending"/g)).toHaveLength(1)
  })

  it('shows the screenshot unaltered, with explicit size and low fetch priority', () => {
    const img = markup.match(/<img[^>]*>/)[0]
    expect(img).toContain('src="/work/staffxp-dashboard.webp"')
    expect(img).toContain('width="1869"')
    expect(img).toContain('height="958"')
    expect(img).toContain('fetchpriority="low"')
    expect(img).toContain('alt="Sanitized capture')
    // The image sits in a visible, unclipped box at rest (so loading=lazy is safe); it is never in a
    // display:none box. The scan state only dims it, it never hides it.
    expect(markup).not.toMatch(/display:\s*none[^>]*>\s*<img/)
  })

  it('labels the capture as sanitized with sample values, with the REAL and SAMPLE chips', () => {
    expect(markup).toContain('SANITIZED CAPTURE ( SAMPLE VALUES )')
    expect(markup).toContain('data-chip="real"')
    expect(markup).toContain('data-chip="sample"')
  })

  it('has one aria-hidden decorative layer set and one real button per region', () => {
    const buttons = markup.match(/class="of-row"/g) ?? []
    expect(buttons).toHaveLength(9)
    expect(markup).toContain('class="of-boxes" data-decor="" aria-hidden="true"')
    expect(markup).toContain('class="of-grid" data-decor="" aria-hidden="true"')
    // every region button names its code and label as text
    expect(markup).toContain('UI-03')
    expect(markup).toContain('Academic calendar')
  })

  it('offers ADD TO BRIEF as a real checkbox with the product named for assistive tech', () => {
    expect(markup).toMatch(/<input type="checkbox"[^>]*class="of-check__box"/)
    expect(markup).toContain('ADD TO BRIEF')
    expect(markup).toContain('sr-only')
  })

  it('mirrors plate 2 and sizes the name at 15 vw against 11 vw', () => {
    const a = html(createElement(Plate, { record: staffxp, index: 0 }))
    const b = html(createElement(Plate, { record: ess, index: 1, mirrored: true }))
    expect(a).toContain('--name-vw:11')
    expect(b).toContain('--name-vw:15')
    expect(b).toContain('data-mirrored=""')
    expect(a).not.toContain('data-mirrored')
    expect(b).toContain('04.2 / DEP-002')
  })
})

describe('NAME_PRODUCTS', () => {
  it('false swaps the product names for the generic labels everywhere in a plate', () => {
    const markup = html(createElement(Plate, { record: staffxp, index: 0, nameProducts: false }))
    expect(markup).toContain('School staff platform')
    expect(markup).not.toContain('>StaffXP<')
    const essMarkup = html(createElement(Plate, { record: ess, index: 1, mirrored: true, nameProducts: false }))
    expect(essMarkup).toContain('Employee self-service portal')
    expect(essMarkup).not.toContain('>ESS<')
  })

  it('shrinks the long generic name so it can fit', () => {
    const markup = html(createElement(Plate, { record: staffxp, index: 0, nameProducts: false }))
    const size = Number(markup.match(/--name-vw:([\d.]+)/)[1])
    expect(size).toBeLessThan(16)
  })
})

describe('DEP-003', () => {
  const markup = html(createElement(DemoRow, { record: demo, index: 2 }))

  it('is an illustrative dashed row, never presented as delivered work', () => {
    expect(markup).toContain('data-chip="illustrative"')
    expect(markup).toContain('Illustrative demo. Not a client project.')
    expect(markup).toContain('data-evidence="illustrative"')
    expect(markup).toContain('04.3 / DEP-003')
  })

  it('links to the demo on the main page', () => {
    expect(markup).toMatch(/<a class="of-link group" href="\/#ai-agents">/)
    expect(markup).toContain('OPEN DEMO')
  })

  it('has no screenshot', () => {
    expect(markup).not.toContain('<img')
  })
})

describe('the ON FILE station', () => {
  const markup = html(createElement(OnFile))

  it('opens with the two-line statement and ends with one inline start-a-project line', () => {
    expect(markup).toContain('Two products on file.')
    expect(markup).toContain('Anything not confirmed is marked pending.')
    expect(markup).toContain('Have a system to build?')
    expect(markup).toMatch(/href="#contact"/)
    expect(markup).toContain('START A PROJECT')
  })

  it('has the id the nav links to and two images only (the sign-in capture is not used)', () => {
    expect(markup).toContain('id="work"')
    expect(markup.match(/<img/g)).toHaveLength(2)
    expect(markup).not.toContain('sign-in.webp')
  })

  it('contains none of the strings that must not appear', () => {
    for (const bad of ['ONLINE', 'AVAILABLE', 'UPTIME', 'Lorem', '.NET', 'React', 'enterprise']) {
      expect(markup, bad).not.toContain(bad)
    }
  })
})

describe('the LEDGER station', () => {
  const markup = html(createElement(Ledger))

  it('lists the five rows REAL first with a legend chip each (the draft row only in review)', () => {
    const kinds = [...markup.matchAll(/class="ld-row__chip"><span data-chip="(\w+)"/g)].map((m) => m[1])
    expect(kinds.slice(0, 4)).toEqual(['live', 'real', 'sample', 'illustrative'])
    expect(kinds[kinds.length - 1]).toBe('pending')
    expect(kinds.length === 5 || kinds.length === 6).toBe(true)
  })

  it('has the heading, the panel anatomy and a build stamp that is real or N/A', () => {
    expect(markup).toContain('What on this page is real.')
    expect(markup).toContain('PROVENANCE')
    expect(markup).toContain('THIS PAGE')
    expect(markup).toMatch(/data-chip="build"[^>]*>(N\/A|[0-9a-f]{4,}[^<]*)</)
    expect(markup).toContain('BUILD 00n is which section you are in. It is a UI state, not a claim.')
  })

  it('makes every row a button and carries no call to action', () => {
    expect(markup.match(/<button type="button" class="ld-row"/g).length).toBeGreaterThanOrEqual(5)
    expect(markup).not.toContain('START A PROJECT')
    expect(markup).not.toContain('href="#contact"')
  })

  it('shows no numeral above body size', () => {
    // The only large type is the h2, which has no digits.
    const h2 = markup.match(/<h2[^>]*>([^<]*)</)[1]
    expect(h2).not.toMatch(/\d/)
  })
})
