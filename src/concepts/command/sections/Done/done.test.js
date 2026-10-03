import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it } from 'vitest'
import { clear, toggleRecord, toggleService } from '../../contract/brief.js'
import { COPIED_MS, copyText, selectionCopy } from './copy.js'
import { Composer } from './Composer.jsx'
import { Endpoints } from './Endpoints.jsx'
import { Finale } from './Finale.jsx'
import { Footer } from './Footer.jsx'
import {
  CONVERGE_FROM,
  CONVERGE_TO,
  LOGO_AT,
  LOGO_AT_TRACK,
  SWEEP_AT,
  convergence,
  logoVisible,
  sweepReached,
} from './finale.js'

afterEach(() => clear())

const html = (element) => renderToStaticMarkup(element)
// Static markup escapes & as &amp; and quotes; undo that to read the href back.
const unescape = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;/g, "'")
const mailtoOf = (markup) => unescape(/href="(mailto:[^"]*\?subject=[^"]*)"/.exec(markup)[1])
const bodyOf = (url) => decodeURIComponent(url.split('&body=')[1]).replace(/\r\n/g, '\n')

describe('finale thresholds', () => {
  it('converges over the same 0.4 to 0.8 the scene uses', () => {
    expect(CONVERGE_FROM).toBe(0.4)
    expect(CONVERGE_TO).toBe(0.8)
    expect(convergence(0)).toBe(0)
    expect(convergence(0.4)).toBe(0)
    expect(convergence(0.6)).toBeCloseTo(0.5)
    expect(convergence(0.8)).toBe(1)
    expect(convergence(1)).toBe(1)
  })

  it('shows the logo from 70 percent of the convergence, and hides it again on the way back', () => {
    expect(LOGO_AT).toBe(0.7)
    expect(LOGO_AT_TRACK).toBeCloseTo(0.68)
    expect(logoVisible(0)).toBe(false)
    expect(logoVisible(0.67)).toBe(false)
    expect(logoVisible(0.69)).toBe(true)
    expect(logoVisible(1)).toBe(true)
    expect(logoVisible(0.5)).toBe(false)
  })

  it('sweeps the underline only once the track passes 0.9', () => {
    expect(SWEEP_AT).toBe(0.9)
    expect(sweepReached(0.9)).toBe(false)
    expect(sweepReached(0.91)).toBe(true)
    expect(sweepReached(1)).toBe(true)
    expect(sweepReached(Number.NaN)).toBe(false)
  })
})

describe('copyText', () => {
  it('uses the clipboard API when it works', async () => {
    const written = []
    const ok = await copyText('hello', {
      clipboard: { writeText: async (t) => written.push(t) },
      fallback: () => {
        throw new Error('the fallback must not run')
      },
    })
    expect(ok).toBe(true)
    expect(written).toEqual(['hello'])
  })

  it('falls back to the selection copy when the clipboard API rejects', async () => {
    const seen = []
    const ok = await copyText('hello', {
      clipboard: { writeText: async () => Promise.reject(new Error('denied')) },
      fallback: (t) => {
        seen.push(t)
        return true
      },
    })
    expect(ok).toBe(true)
    expect(seen).toEqual(['hello'])
  })

  it('falls back when there is no clipboard API at all (insecure context)', async () => {
    expect(await copyText('x', { clipboard: null, fallback: () => true })).toBe(true)
  })

  it('reports false, never throws, when both routes fail', async () => {
    expect(await copyText('x', { clipboard: null, fallback: () => false })).toBe(false)
    expect(
      await copyText('x', {
        clipboard: { writeText: async () => Promise.reject(new Error('denied')) },
        fallback: () => {
          throw new Error('blocked')
        },
      }),
    ).toBe(false)
  })

  it('selectionCopy is false without a document, and the label stays COPIED for 1.6 s', () => {
    expect(selectionCopy('x', null)).toBe(false)
    expect(COPIED_MS).toBe(1600)
  })
})

describe('SEND EMAIL', () => {
  it('builds a mailto for an empty brief', () => {
    const url = mailtoOf(html(createElement(Composer)))
    expect(url.startsWith('mailto:contact@xiontechs.com?subject=Project%20enquiry&body=')).toBe(true)
    expect(bodyOf(url)).toBe('Hello XionTechs,\n\nI would like to talk about a project.')
  })

  it('shows the empty state when nothing is selected', () => {
    expect(html(createElement(Composer))).toContain('( nothing selected yet )')
  })

  it('builds a mailto for one selection and lists it in the preview', () => {
    toggleService('svc.cloud')
    const markup = html(createElement(Composer))
    expect(bodyOf(mailtoOf(markup))).toContain('Services I am interested in:\n- Cloud Computing')
    expect(markup).toContain('Cloud Computing')
    expect(markup).not.toContain('( nothing selected yet )')
  })

  it('builds a mailto for five selections, services then records', () => {
    for (const id of ['svc.staffing', 'svc.cloud', 'svc.low-code', 'svc.ai-analytics']) toggleService(id)
    toggleRecord('dep-001')
    const body = bodyOf(mailtoOf(html(createElement(Composer))))
    for (const label of ['Low-code Solutions', 'AI-Driven Analytics', 'Cloud Computing', 'Staffing Services']) {
      expect(body).toContain(`- ${label}`)
    }
    expect(body).toContain('I looked at:\n- StaffXP')
  })

  it('is a plain link, and the form cannot post', () => {
    const markup = html(createElement(Composer))
    expect(markup).toMatch(/<a [^>]*href="mailto:/)
    expect(markup).toContain('<form')
    expect(markup).not.toContain('type="submit"')
    expect(markup).not.toContain('action=')
    expect(markup).toContain('Opens your mail app. Nothing is stored.')
    expect(markup).toContain('Mail app did not open? Copy the text instead.')
  })

  it('both CTAs raise the core flow', () => {
    const markup = html(createElement(Composer))
    expect((markup.match(/data-flow/g) ?? []).length).toBe(2)
  })
})

describe('finale and footer markup', () => {
  it('uses the logo at its native size, flagged data-logo', () => {
    for (const markup of [html(createElement(Finale)), html(createElement(Footer))]) {
      expect(markup).toMatch(/<img[^>]*data-logo=""/)
      expect(markup).toContain('width="250"')
      expect(markup).toContain('height="46"')
      expect(markup).toContain('/concepts/command/logo-reversed.png')
    }
  })

  it('sets GET / IT / DONE in three lines inside one h2, and anchors the mark', () => {
    const markup = html(createElement(Finale))
    expect((markup.match(/class="finale-line/g) ?? []).length).toBe(3)
    expect(markup).toContain('id="done-title"')
    expect(markup).toContain('data-core-anchor="done"')
    expect(markup).toContain('HAVE A SYSTEM TO BUILD?')
  })

  it('draws no offices, addresses or legal name in production markup', () => {
    const markup = html(createElement(Footer))
    for (const word of ['Dallas', 'Ho Chi Minh City', 'Da Nang', 'Joint Stock']) expect(markup).not.toContain(word)
  })

  it('lists all five endpoints as links, the email first', () => {
    const markup = html(createElement(Endpoints))
    const hrefs = [...markup.matchAll(/href="([^"]+)"/g)].map((m) => m[1])
    expect(hrefs[0]).toBe('mailto:contact@xiontechs.com')
    expect(hrefs).toEqual([
      'mailto:contact@xiontechs.com',
      'tel:+14693229899',
      'tel:+84908107552',
      'https://www.linkedin.com/company/xiontechs/about/',
      'https://www.facebook.com/xiontechs/',
    ])
  })
})
