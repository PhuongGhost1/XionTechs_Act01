import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import * as content from './content.js'
import { editParts } from './pass/states.js'

const { STRIKES, SECTIONS, cover, manifesto, feature, story, index, dispatches, contributors, signoff } = content

describe('copy-edit pass', () => {
  const edited = [
    ['cover', cover.lines, cover.edit],
    ['manifesto', manifesto.lines, manifesto.edit],
    ['feature', [feature.title], feature.edit],
    ['story', [story.title], story.edit],
    ['index', [index.title], index.edit],
    ['dispatches', [dispatches.title], dispatches.edit],
    ['signoff', signoff.lines, signoff.edit],
  ]
  it.each(edited)('%s: the inserted word occurs once in the headline', (_name, lines, edit) => {
    expect(lines.filter((l) => editParts(l, edit.insert))).toHaveLength(1)
  })
  it.each(edited)('%s: the struck word is on the approved list', (_name, _lines, edit) => {
    expect(STRIKES).toContain(edit.strike)
  })
  it('the contributors highlight occurs in its headline', () => {
    expect(editParts(contributors.title, contributors.mark)).not.toBeNull()
  })
})

describe('honesty', () => {
  const css = (rel) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8')

  it('names no unconfirmed technology on the StaffXP or ESS stories', () => {
    const text = JSON.stringify([feature, story])
    for (const word of ['React', '.NET', 'MySQL', 'Angular', 'SQL Server']) expect(text).not.toContain(word)
  })
  it('keeps outcome and technology pending on both stories', () => {
    expect(feature.chapters.at(-1).pending.join(' ')).toMatch(/pending confirmation/)
    expect(story.pending.join(' ')).toMatch(/pending confirmation/)
  })
  it('labels the agent sidebar illustrative', () => {
    expect(story.sidebar.label).toBe(content.ILLUSTRATIVE)
  })
  it('dispatches carry no digits (no dates, counts or reading times) and stay draft', () => {
    expect(dispatches.draft).toBe(true)
    expect(JSON.stringify(dispatches.items)).not.toMatch(/\d/)
  })
  it('gives a role a line only when the main page has one', () => {
    for (const r of contributors.roles) expect(r.line === null || r.line.length > 20).toBe(true)
  })
  it('uses only the two verified facts', () => {
    expect(contributors.facts).toHaveLength(2)
  })
  it('every screenshot is one of the sanitized files with explicit dimensions', () => {
    const figures = [cover.plate, ...feature.chapters.map((c) => c.figure), story.figure]
    for (const f of figures) {
      expect(f.src).toMatch(/^\/work\/(staffxp-dashboard|staffxp-sign-in|ess-portal)\.webp$/)
      expect(f.width > 0 && f.height > 0 && f.alt.length > 20).toBe(true)
    }
  })
  it('the stylesheet hardcodes no hex colour outside comments', () => {
    const noComments = css('./edition.css').replace(/\/\*[\s\S]*?\*\//g, '')
    expect(noComments).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
  })
})

describe('sections', () => {
  it('are numbered in order with unique ids', () => {
    expect(SECTIONS.map((s) => s.no)).toEqual(SECTIONS.map((_, i) => String(i + 1).padStart(2, '0')))
    expect(new Set(SECTIONS.map((s) => s.id)).size).toBe(SECTIONS.length)
  })
  it('carry the brief navigation', () => {
    expect(SECTIONS.filter((s) => s.nav).map((s) => s.nav)).toEqual(['Work', 'Services', 'Stories', 'About', 'Contact'])
  })
})
