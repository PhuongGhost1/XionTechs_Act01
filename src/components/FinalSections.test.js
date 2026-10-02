import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, it, expect } from 'vitest'
import EngineeringStrip from './EngineeringStrip'
import HowWeWork from './HowWeWork'
import WhyUs from './WhyUs'
import Contact from './Contact'
import { contact, engineering, finalCta, howWeWork, team, whyUs } from '../content/site'

// Smoke test for the lower page (engineering, How We Work, Why XionTechs, final CTA): each section
// renders, keeps its anchors, and has all of its text in the markup before any animation runs,
// so nothing depends on motion (MOTION §25–26).
const html = (C) => renderToStaticMarkup(createElement(C))
const text = (s) => s.replace(/&#x27;|&#39;/g, "'").replace(/&amp;/g, '&')

describe('lower-page sections', () => {
  it('engineering: heading id, every layer and tool, the result and the equation', () => {
    const out = text(html(EngineeringStrip))
    expect(out).toContain('id="engineering-title"')
    for (const l of engineering.layers) {
      expect(out).toContain(l.label)
      if (l.items) expect(out).toContain(l.items)
    }
    expect(out).toContain(`<figcaption`)
    expect(out).toContain(engineering.result)
    for (const part of engineering.equation) expect(out).toContain(part)
  })

  it('engineering: layers are listed top to bottom and assemble bottom first', () => {
    const out = html(EngineeringStrip)
    const delays = [...out.matchAll(/--eng-delay:(\d+)ms/g)].map((m) => Number(m[1]))
    expect(delays).toHaveLength(engineering.layers.length)
    expect(delays.at(-1)).toBe(0)
    for (let i = 1; i < delays.length; i++) expect(delays[i]).toBeLessThan(delays[i - 1])
  })

  it('how we work: anchors and every stage, with the first stage active before scrolling', () => {
    const out = text(html(HowWeWork))
    expect(out).toContain('id="how-we-work"')
    expect(out).toContain('id="how-title"')
    for (const s of howWeWork.steps) {
      expect(out).toContain(s.title)
      expect(out).toContain(s.desc)
    }
    expect((out.match(/<svg/g) ?? []).length).toBe(howWeWork.steps.length * 3)
  })

  it('why us: anchors, four pillars with icons, and the team block', () => {
    const out = text(html(WhyUs))
    expect(out).toContain('id="why-us"')
    expect(out).toContain('id="why-title"')
    for (const p of whyUs.pillars) {
      expect(out).toContain(p.title)
      expect(out).toContain(p.desc)
    }
    expect((out.match(/<svg/g) ?? []).length).toBe(whyUs.pillars.length * 2)
    expect(out).toContain(team.title)
    for (const f of team.facts) expect(out).toContain(f.label)
  })

  it('final CTA: anchors, both actions, contact details, the steps and a readable slogan', () => {
    const out = text(html(Contact))
    expect(out).toContain('id="contact"')
    expect(out).toContain('id="contact-title"')
    for (const s of [finalCta.title, finalCta.intro, finalCta.primary.label, finalCta.secondary.label, finalCta.primaryNote, contact.email]) {
      expect(out).toContain(s)
    }
    for (const a of contact.addresses) expect(out).toContain(a)
    for (const s of finalCta.completion) expect(out).toContain(`>${s}</span>`)
    expect(out).toContain(`aria-label="${finalCta.completionLabel}"`)
    const slogan = out.match(/<p class="fc-slogan[^"]*">(.*?)<\/p>/)[1].replace(/<[^>]+>/g, '')
    expect(slogan).toBe(finalCta.slogan.join(' '))
  })
})
