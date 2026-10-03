import { readFileSync, readdirSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { finale, hero, titleBlock } from '../content.js'
import { LABEL_ANCHORS, OUTLINES } from './converge.js'
import { copy } from './copy.js'

const dir = new URL('./', import.meta.url)
const sources = readdirSync(dir)
  .filter((f) => /\.(jsx|css|js)$/.test(f) && !/\.test\.js$|^harness\./.test(f))
  .map((f) => ({ f, text: readFileSync(new URL(f, dir), 'utf8') }))

describe('sheet 07 content', () => {
  it('keeps the brief order of the chain and the two statement lines', () => {
    expect(finale.chain.map((w) => w.toUpperCase())).toEqual(['ARCHITECT', 'ENGINEER', 'DEPLOY', 'XIONTECHS'])
    expect(finale.statement).toHaveLength(2)
    expect(finale.slogan.endsWith('Done.')).toBe(true)
  })

  it('labels every slab of the exploded model, in the order the outlines are drawn', () => {
    expect(hero.layers).toHaveLength(OUTLINES.length)
    expect(LABEL_ANCHORS).toHaveLength(OUTLINES.length)
    const ys = LABEL_ANCHORS.map((a) => a.y)
    expect([...ys].sort((a, b) => a - b)).toEqual(ys) // top layer first, each one lower on the page
  })

  it('carries the verified facts with their to-be-verified note, and no invented numbers of its own', () => {
    expect(titleBlock.about.factNote).toMatch(/to be verified/i)
    expect(titleBlock.about.facts.length).toBeGreaterThan(0)
    for (const text of Object.values(copy).flatMap((v) => (typeof v === 'string' ? [v] : Object.values(v)))) {
      expect(text).not.toMatch(/\d/)
    }
  })

  it('has no em dash in its copy', () => {
    const strings = Object.values(copy).flatMap((v) => (typeof v === 'string' ? [v] : Object.values(v)))
    for (const s of strings) expect(s).not.toContain('—')
  })
})

describe('sheet 07 styling', () => {
  it('uses colour tokens only: no hex colour in a component or in the stylesheet', () => {
    for (const { f, text } of sources) {
      expect(text, f).not.toMatch(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b(?![\w-])/)
    }
  })
})
