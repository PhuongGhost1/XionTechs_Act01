import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { content, displayName, records, services, specRows, visibleLedgerRows } from './index.js'
import {
  ESS_HOTSPOTS,
  ESS_IMAGE,
  HOTSPOT_CONTAINMENT,
  STAFFXP_HOTSPOTS,
  STAFFXP_IMAGE,
} from './hotspots.js'
import { CONFIRMED_SERVICES, STATUS_WORDS, validateContent, walk } from './validate.js'
import { SOURCES } from './wrap.js'

// Doc 12.4. The rules live in validate.js; this file runs them on the real content, proves that
// each rule actually catches a violation (a validator that never fails is worthless), and checks
// the facts the other rules cannot see (geometry, the noscript block).

const clone = () => structuredClone(content)

describe('the shipped content', () => {
  it('passes every honesty rule', () => {
    expect(validateContent(content)).toEqual([])
  })

  it('names a source on every string group and node', () => {
    let carriers = 0
    walk(content, (v) => {
      if (v && typeof v === 'object' && (typeof v.text === 'string' || typeof v.label === 'string')) {
        carriers += 1
        expect(SOURCES, JSON.stringify(v)).toContain(v.src)
      }
    })
    expect(carriers).toBeGreaterThan(100)
  })

  it('lists each of the eight confirmed services exactly once', () => {
    const labels = services().map((s) => s.label)
    expect(labels).toHaveLength(8)
    expect([...labels].sort()).toEqual([...CONFIRMED_SERVICES].sort())
    expect(new Set(labels).size).toBe(8)
  })

  it('groups services as the design document does (section 4.4)', () => {
    const byModule = Object.fromEntries(content.modules.map((m) => [m.short, m.services.map((s) => s.label)]))
    expect(byModule).toEqual({
      CODE: ['Custom App Development', 'Low-code Solutions'],
      AI: ['AI-Powered Solutions', 'AI-Driven Analytics'],
      CLOUD: ['Cloud Computing'],
      PRODUCT: ['Product Engineering', 'Product Co-Creation', 'Staffing Services'],
    })
  })

  it('has 15 leaves with the live-site platform and capability names', () => {
    const leaves = services().flatMap((s) => s.leaves)
    expect(leaves).toHaveLength(15)
    expect(leaves.filter((l) => l.group === 'platform').map((l) => l.label)).toEqual([
      'Power Platform', 'Make', 'n8n', 'Retool', 'Bubble', 'Azure', 'AWS', 'GCP',
    ])
  })

  it('uses only OFFERED, ACTIVE or PENDING as status words', () => {
    for (const m of content.modules) expect(STATUS_WORDS).toContain(m.state.text)
    expect(content.modules.every((m) => m.state.text === 'OFFERED')).toBe(true)
  })

  it('gives every record exactly one structured PENDING details row, never a string', () => {
    for (const r of records.filter((x) => x.id !== 'dep-003')) {
      const rows = r.rows.filter((row) => row.label === 'DETAILS')
      expect(rows, r.id).toHaveLength(1)
      expect(rows[0].value).toMatchObject({ pending: true, src: 'PLACEHOLDER' })
      expect(typeof rows[0].value.label).toBe('string')
    }
  })

  it('never states an unconfirmed stack, status or scale for the two products', () => {
    const text = JSON.stringify(records)
    expect(text).not.toMatch(/\.NET|React|enterprise|production/i)
  })

  it('keeps the process free of digits and the beat illustrative', () => {
    const visible = []
    walk(content.process, (v) => {
      if (v && typeof v === 'object') {
        if (typeof v.text === 'string') visible.push(v.text)
        if (typeof v.label === 'string') visible.push(v.label)
      }
    })
    expect(visible.length).toBeGreaterThan(15)
    for (const s of visible) expect(s, s).not.toMatch(/\d/)
    expect(content.process.beat.src).toBe('ILLUSTRATIVE')
    expect(content.process.steps.every((s) => s.src === 'DRAFT' && s.draft === true)).toBe(true)
  })

  it('marks the DRAFT ledger row dev-only and orders REAL first', () => {
    expect(content.ledger.rows.map((r) => r.kind)).toEqual(['live', 'real', 'sample', 'illustrative', 'draft', 'pending'])
    expect(visibleLedgerRows(false).map((r) => r.kind)).not.toContain('draft')
    expect(visibleLedgerRows(true).map((r) => r.kind)).toContain('draft')
  })

  it('holds the contact facts from the live site', () => {
    const byId = Object.fromEntries(content.contact.endpoints.map((e) => [e.id, e]))
    expect(byId['contact.email'].text).toBe('contact@xiontechs.com')
    expect(byId['contact.phone.us'].text).toBe('+1 469 322 9899')
    expect(byId['contact.phone.vn'].text).toBe('+84 908 107 552')
    expect(byId['contact.linkedin'].href).toBe('https://www.linkedin.com/company/xiontechs/about/')
    expect(byId['contact.facebook'].href).toBe('https://www.facebook.com/xiontechs/')
    expect(content.contact.endpoints.every((e) => e.src === 'FACT')).toBe(true)
  })

  it('keeps offices and the legal name as review-only placeholders', () => {
    const items = [...content.contact.review.offices, content.contact.review.legalName]
    expect(items.every((i) => i.src === 'PLACEHOLDER' && i.reviewOnly === true)).toBe(true)
  })

  it('honours NAME_PRODUCTS', () => {
    const staffxp = records[0]
    expect(displayName(staffxp, true)).toBe('StaffXP')
    expect(displayName(staffxp, false)).toBe('School staff platform')
    expect(specRows(staffxp, false)[0].value.text).toBe('School staff platform')
    expect(specRows(staffxp, true).map((r) => r.label)).toEqual(['PRODUCT', 'IS', 'CAPTURE SHOWS', 'SIGN-IN', 'DETAILS', 'RESULTS'])
    expect(specRows(records[1], true).map((r) => r.label)).toEqual(['PRODUCT', 'IS', 'CAPTURE SHOWS', 'DETAILS', 'RESULTS'])
  })

  it('describes the products with the team facts', () => {
    expect(records[0].descriptor.text).toBe('a staff experience platform for schools')
    expect(records[1].descriptor.text).toBe('an employee self-service portal')
  })

  it('mirrors services and contact details in the noscript block of index.html', () => {
    const html = readFileSync(new URL('../../../../concepts/command/index.html', import.meta.url), 'utf8')
    const noscript = html.slice(html.indexOf('<noscript>'), html.indexOf('</noscript>'))
    for (const name of CONFIRMED_SERVICES) expect(noscript, name).toContain(name)
    for (const e of content.contact.endpoints.filter((x) => x.kind !== 'social')) expect(noscript, e.text).toContain(e.text)
  })
})

describe('the validator catches violations (seeded)', () => {
  it('a text without a source', () => {
    const c = clone()
    delete c.hero.sub.src
    expect(validateContent(c).join('\n')).toMatch(/hero\.sub.*src/)
  })

  it('a naked string outside a wrapper', () => {
    const c = clone()
    c.hero.cta.stray = 'Free quote'
    expect(validateContent(c).join('\n')).toMatch(/no source/)
  })

  it('evidence fact carried by a DRAFT', () => {
    const c = clone()
    Object.assign(c.modules[0].services[0], { src: 'DRAFT', draft: true })
    expect(validateContent(c).join('\n')).toMatch(/can never come from DRAFT/)
  })

  it('a DRAFT that forgot draft: true', () => {
    const c = clone()
    c.premise.paragraph = { ...c.premise.paragraph, draft: undefined }
    expect(validateContent(c).join('\n')).toMatch(/draft: true/)
  })

  it('digits in the process', () => {
    const c = clone()
    c.process.steps[3].sentence = { ...c.process.steps[3].sentence, text: 'Shipped in 2 weeks.' }
    expect(validateContent(c).join('\n')).toMatch(/digits in process/)
  })

  it('digits in illustrative text, but not a DEP id', () => {
    const c = clone()
    expect(validateContent(c)).toEqual([])
    c.records[2].sentence = { ...c.records[2].sentence, text: 'Used by 40 teams.' }
    expect(validateContent(c).join('\n')).toMatch(/digits in illustrative/)
  })

  it.each([
    ['ONLINE'],
    ['AVAILABLE'],
    ['SUCCESS'],
    ['UPTIME'],
    ['99.8%'],
    ['98%'],
    ['BUILD #4821'],
    ['projects delivered'],
    ['Lorem ipsum'],
    ['built with React'],
    ['an enterprise platform'],
  ])('the forbidden string "%s"', (bad) => {
    const c = clone()
    c.premise.paragraph = { ...c.premise.paragraph, text: `We are ${bad}.` }
    expect(validateContent(c).join('\n')).toMatch(/forbidden string/)
  })

  it('an em dash in new copy, but not in the brief quote', () => {
    const c = clone()
    expect(validateContent(c)).toEqual([])
    c.premise.paragraph = { ...c.premise.paragraph, text: 'We build — and run.' }
    expect(validateContent(c).join('\n')).toMatch(/em dash/)
  })

  it('a service listed twice, or an unconfirmed one', () => {
    const c = clone()
    c.modules[3].services.push({ ...c.modules[0].services[0], id: 'svc.custom-app-2', parent: 'mod.product' })
    expect(validateContent(c).join('\n')).toMatch(/appears 2 times/)
    const d = clone()
    d.modules[1].services[0].label = 'Blockchain Consulting'
    const msg = validateContent(d).join('\n')
    expect(msg).toMatch(/unconfirmed service/)
    expect(msg).toMatch(/AI-Powered Solutions" appears 0 times/)
  })

  it('a status word outside OFFERED, ACTIVE, PENDING', () => {
    const c = clone()
    c.modules[0].state = { ...c.modules[0].state, text: 'ONLINE' }
    expect(validateContent(c).join('\n')).toMatch(/is not OFFERED, ACTIVE or PENDING/)
  })

  it('a pending value that is a plain string', () => {
    const c = clone()
    c.records[0].rows.find((r) => r.label === 'DETAILS').value = { id: 'x', text: '.NET / React', src: 'DRAFT', draft: true }
    expect(validateContent(c).join('\n')).toMatch(/DETAILS row must hold/)
  })
})

describe('hotspot geometry (doc 8.5)', () => {
  const sets = [
    ['staffxp', STAFFXP_HOTSPOTS, 'staffxp'],
    ['ess', ESS_HOTSPOTS, 'ess'],
  ]

  it('uses the natural image sizes of the committed files', () => {
    expect(STAFFXP_IMAGE).toEqual({ width: 1869, height: 958 })
    expect(ESS_IMAGE).toEqual({ width: 1867, height: 956 })
    expect(records[0].image).toMatchObject(STAFFXP_IMAGE)
    expect(records[1].image).toMatchObject(ESS_IMAGE)
  })

  it('has the boxes of the design document', () => {
    expect(STAFFXP_HOTSPOTS).toHaveLength(9)
    expect(ESS_HOTSPOTS).toHaveLength(10)
  })

  it.each(sets)('%s: boxes lie inside 0..100 with positive sizes', (_name, boxes) => {
    for (const b of boxes) {
      expect(b.w, b.id).toBeGreaterThan(0)
      expect(b.h, b.id).toBeGreaterThan(0)
      expect(b.x, b.id).toBeGreaterThanOrEqual(0)
      expect(b.y, b.id).toBeGreaterThanOrEqual(0)
      expect(b.x + b.w, b.id).toBeLessThanOrEqual(100.0001)
      expect(b.y + b.h, b.id).toBeLessThanOrEqual(100.0001)
    }
  })

  it.each(sets)('%s: ids and UI codes are unique', (_name, boxes) => {
    expect(new Set(boxes.map((b) => b.id)).size).toBe(boxes.length)
    expect(new Set(boxes.map((b) => b.code)).size).toBe(boxes.length)
  })

  it.each(sets)('%s: no two boxes overlap by more than 5% of the smaller, except containment', (_name, boxes, key) => {
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

  it('the documented containment really is containment', () => {
    const [outer, inner] = HOTSPOT_CONTAINMENT.staffxp[0].map((id) => STAFFXP_HOTSPOTS.find((b) => b.id === id))
    expect(inner.x).toBeGreaterThanOrEqual(outer.x)
    expect(inner.y).toBeGreaterThanOrEqual(outer.y)
    expect(inner.x + inner.w).toBeLessThanOrEqual(outer.x + outer.w)
    expect(inner.y + inner.h).toBeLessThanOrEqual(outer.y + outer.h)
  })
})
