import { describe, expect, it } from 'vitest'
import { selectedWork } from '../../content/site.js'
import * as content from './content.js'

// Honesty and structure checks for the copy (CLAUDE.md "Content rules"). The point of each test is a
// rule the page must never break, however the wording changes.

const strings = (value, out = []) => {
  if (typeof value === 'string') out.push(value)
  else if (Array.isArray(value)) value.forEach((v) => strings(v, out))
  else if (value && typeof value === 'object') Object.values(value).forEach((v) => strings(v, out))
  return out
}

describe('structure', () => {
  const { sheets, nav } = content

  it('has seven numbered sheets in order, with unique ids', () => {
    expect(sheets.map((s) => s.no)).toEqual(['01', '02', '03', '04', '05', '06', '07'])
    expect(new Set(sheets.map((s) => s.id)).size).toBe(sheets.length)
    expect(sheets.map((s) => s.code)).toEqual(sheets.map((s) => `A-${s.no.padStart(3, '0')}`))
  })

  it('points every nav link at a sheet or the contact block', () => {
    const targets = new Set([...sheets.map((s) => s.id), 'contact'])
    for (const item of nav) expect(targets.has(item.href.slice(1)), item.href).toBe(true)
    expect(nav.map((n) => n.label)).toEqual(['Capabilities', 'Process', 'Work', 'About', 'Contact'])
  })

  it('keeps the brief 02 structure: six levels, six layers, six stages, five model layers', () => {
    expect(content.architecture.levels.map((l) => l.label)).toEqual(['Business', 'Product', 'Application', 'API', 'Data', 'Infrastructure'])
    expect(content.capabilities.layers.map((l) => l.label)).toEqual(['Discovery', 'Product', 'Application', 'AI', 'Platform', 'Cloud'])
    expect(content.process.stages.map((s) => s.label)).toEqual(['Discover', 'Architect', 'Engineer', 'Integrate', 'Deploy', 'Scale'])
    expect(content.hero.layers.map((l) => l.label)).toEqual(['Experience', 'Services', 'API', 'Data', 'Infrastructure'])
    expect(content.finale.chain).toEqual(['Architect', 'Engineer', 'Deploy', 'XionTechs'])
  })

  it('uses the headline of brief 02', () => {
    expect(content.hero.headline.toLowerCase()).toBe('we architect digital systems.')
    expect(content.finale.slogan).toBe('Get IT Done.')
  })
})

describe('honesty', () => {
  it('imports verified StaffXP and ESS data instead of copying it', () => {
    expect(content.staffxp.hotspots).toBe(selectedWork.staffxp.hotspots)
    expect(content.staffxp.main).toBe(selectedWork.staffxp.main)
    expect(content.work.ess.areas).toBe(selectedWork.ess.areas)
    expect(content.work.ess.screen).toBe(selectedWork.ess.screen)
  })

  it('does not show the brief\'s unconfirmed StaffXP stack or nodes', () => {
    // content/TODO.md: React, .NET, MySQL, MOBILE, ADMIN, CRM and HR are not confirmed for StaffXP.
    const text = strings(content.staffxp).join(' \n ')
    for (const banned of [/\breact\b/i, /\.net\b/i, /mysql/i, /\bcrm\b/i, /\badmin\b/i, /\bmobile\b/i, /\bHR\b/]) {
      expect(text, String(banned)).not.toMatch(banned)
    }
  })

  it('marks layers that nothing in the product shows as unconfirmed', () => {
    const byId = Object.fromEntries(content.staffxp.layers.map((l) => [l.id, l]))
    expect(byId.services.confirmed).toBe(false)
    expect(byId.infrastructure.confirmed).toBe(false)
    expect(byId.experience.confirmed).toBe(true)
    // Only the two layers with a real screenshot carry a face.
    expect(content.staffxp.layers.filter((l) => l.face).map((l) => l.id)).toEqual(['experience', 'identity'])
  })

  it('gives technology and outcome a pending label, never a value', () => {
    expect(content.staffxp.techPending).toMatch(/pending/i)
    expect(content.work.techPending).toMatch(/pending/i)
    expect(content.work.outcomePending).toMatch(/no verified outcome/i)
    expect(content.work.agents.outcome).toMatch(/illustrative/i)
  })

  it('carries no durations, cadences or figures in the process copy', () => {
    for (const s of content.process.stages) expect(`${s.desc} ${s.dim}`).not.toMatch(/\d/)
    expect(strings(content.process.lede).join(' ')).not.toMatch(/\d/)
  })

  it('has no em dashes in any copy', () => {
    const all = strings(content).join('\n')
    expect(all).not.toMatch(/—/)
  })

  it('keeps the real contact data from the live site', () => {
    expect(content.titleBlock.contact.email).toBe('contact@xiontechs.com')
    expect(content.titleBlock.about.facts.length).toBeGreaterThan(0)
    expect(content.titleBlock.about.factNote).toMatch(/verified/i)
    expect(content.cta.href).toMatch(/^mailto:contact@xiontechs\.com/)
  })

  it('flags wording written for this concept as draft', () => {
    expect(content.architecture.draft).toBe(true)
    expect(content.capabilities.draft).toBe(true)
    expect(content.process.draft).toBe(true)
    expect(content.work.draft).toBe(true)
    expect(content.hero.layers.every((l) => l.draft)).toBe(true)
  })
})
