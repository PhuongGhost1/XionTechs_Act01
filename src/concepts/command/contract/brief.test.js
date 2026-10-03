import { afterEach, describe, expect, it } from 'vitest'
import {
  MAX_LENGTH,
  buildBody,
  buildMailto,
  buildText,
  clear,
  count,
  fitText,
  getSnapshot,
  has,
  isNoteCut,
  items,
  subscribe,
  toggleRecord,
  toggleService,
} from './brief.js'

afterEach(() => clear())

const decode = (url) => {
  const [, query] = url.split('?')
  const params = Object.fromEntries(query.split('&').map((p) => p.split('=')))
  return {
    subject: decodeURIComponent(params.subject),
    body: decodeURIComponent(params.body).replace(/\r\n/g, '\n'),
  }
}

describe('the selection store', () => {
  it('toggles services and records, in content order', () => {
    expect(count()).toBe(0)
    toggleService('svc.cloud')
    toggleService('svc.custom-app')
    toggleRecord('dep-002')
    expect(count()).toBe(3)
    expect(has('svc.cloud')).toBe(true)
    expect(items().map((i) => i.label)).toEqual(['Custom App Development', 'Cloud Computing', 'ESS'])
    expect(toggleService('svc.cloud')).toBe(false)
    expect(has('svc.cloud')).toBe(false)
  })

  it('ignores ids it does not know', () => {
    expect(toggleService('svc.blockchain')).toBe(false)
    expect(toggleRecord('dep-999')).toBe(false)
    expect(count()).toBe(0)
  })

  it('notifies subscribers with a new frozen snapshot', () => {
    let calls = 0
    const off = subscribe(() => {
      calls += 1
    })
    const before = getSnapshot()
    toggleService('svc.staffing')
    expect(calls).toBe(1)
    expect(getSnapshot()).not.toBe(before)
    expect(Object.isFrozen(getSnapshot())).toBe(true)
    off()
    clear()
    expect(calls).toBe(1)
  })
})

describe('buildMailto', () => {
  it('with nothing selected: subject, greeting, no brief section', () => {
    const url = buildMailto({ note: '' })
    expect(url.startsWith('mailto:contact@xiontechs.com?subject=Project%20enquiry&body=')).toBe(true)
    const { subject, body } = decode(url)
    expect(subject).toBe('Project enquiry')
    expect(body).toBe('Hello XionTechs,\n\nI would like to talk about a project.')
  })

  it('with one service', () => {
    toggleService('svc.cloud')
    const { body } = decode(buildMailto({ note: 'Move our app to Azure.' }))
    expect(body).toBe(
      [
        'Hello XionTechs,',
        '',
        'I would like to talk about a project.',
        '',
        'Services I am interested in:',
        '- Cloud Computing',
        '',
        'About the system:',
        'Move our app to Azure.',
      ].join('\n'),
    )
  })

  it('with five selections: services first, then what was looked at', () => {
    for (const id of ['svc.staffing', 'svc.cloud', 'svc.low-code', 'svc.ai-analytics']) toggleService(id)
    toggleRecord('dep-001')
    expect(count()).toBe(5)
    const { body } = decode(buildMailto({ note: '' }))
    expect(body).toContain(
      ['Services I am interested in:', '- Low-code Solutions', '- AI-Driven Analytics', '- Cloud Computing', '- Staffing Services'].join('\n'),
    )
    expect(body).toContain('I looked at:\n- StaffXP')
    expect(body.indexOf('Services I am')).toBeLessThan(body.indexOf('I looked at'))
  })

  it('encodes every character that would break a URL', () => {
    const url = buildMailto({ note: 'Fish & chips? 100% #1, "quoted" é\nsecond line' })
    const body = url.split('&body=')[1]
    expect(body).not.toMatch(/[ "&#]/)
    expect(body).toContain('%26')
    expect(body).toContain('%0D%0A')
    expect(decode(url).body).toContain('Fish & chips? 100% #1, "quoted" é\nsecond line')
  })

  it('caps the whole URL and ends the cut text with the marker', () => {
    toggleService('svc.cloud')
    const url = buildMailto({ note: 'x'.repeat(5000) })
    expect(url.length).toBeLessThanOrEqual(MAX_LENGTH)
    expect(url.length).toBeGreaterThan(MAX_LENGTH - 30)
    const { body } = decode(url)
    expect(body.endsWith('[ shortened ]')).toBe(true)
    // The selection survives; the visitor's own words are what gets cut.
    expect(body).toContain('- Cloud Computing')
  })

  it('does not cut text that fits', () => {
    expect(decode(buildMailto({ note: 'Short.' })).body.endsWith('Short.')).toBe(true)
  })

  it('does not split a surrogate pair when it cuts', () => {
    // A character outside the BMP, written as an escape so no emoji sits in the source.
    const url = buildMailto({ note: '\u{1F600}'.repeat(2000) })
    expect(() => decodeURIComponent(url.split('&body=')[1])).not.toThrow()
    expect(url.length).toBeLessThanOrEqual(MAX_LENGTH)
  })
})

describe('isNoteCut (the "note too long" warning)', () => {
  const sel = [{ kind: 'service', id: 'x', label: 'Cloud Computing' }]

  it('is false for an empty note and for a short one', () => {
    expect(isNoteCut({ items: sel })).toBe(false)
    expect(isNoteCut({ note: 'Short.', items: sel })).toBe(false)
    expect(isNoteCut()).toBe(false)
  })

  it('agrees with buildMailto at every length, plain English', () => {
    for (const n of [200, 800, 1000, 1200, 1250, 1300, 1500, 2500]) {
      const note = 'word '.repeat(Math.ceil(n / 5)).slice(0, n)
      const url = buildMailto({ note, items: sel })
      const marked = decode(url).body.endsWith('[ shortened ]')
      expect(isNoteCut({ note, items: sel }), `n=${n}`).toBe(marked)
    }
  })

  it('catches the case the plain-text copy misses: about 1250 English characters', () => {
    // 1250 characters with spaces: the copy text (cap 1800 plain) is whole, the URL (cap 1800
    // percent-encoded: a space is 3, a line break 6) is not.
    const note = 'ab cd '.repeat(209).slice(0, 1250)
    expect(buildText({ note, items: sel }).endsWith('[ shortened ]')).toBe(false)
    expect(decode(buildMailto({ note, items: sel })).body.endsWith('[ shortened ]')).toBe(true)
    expect(isNoteCut({ note, items: sel })).toBe(true)
  })

  it('catches a Vietnamese note of about 770 characters (every accented letter is 6 to 9 encoded)', () => {
    const note = 'Chúng tôi cần một hệ thống quản lý nhân sự và chấm công. '.repeat(14).slice(0, 790)
    expect(note.length).toBeLessThan(800)
    expect(buildText({ note, items: sel }).endsWith('[ shortened ]')).toBe(false)
    expect(isNoteCut({ note, items: sel })).toBe(true)
    const body = decode(buildMailto({ note, items: sel })).body
    expect(body.endsWith('[ shortened ]')).toBe(true)
    // the cut never lands inside an accented letter
    expect(() => decodeURIComponent(buildMailto({ note, items: sel }).split('&body=')[1])).not.toThrow()
  })

  it('is false for a short Vietnamese note that fits', () => {
    expect(isNoteCut({ note: 'Cần một ứng dụng di động.', items: sel })).toBe(false)
  })

  it('is not fooled by a note that contains the marker itself', () => {
    expect(isNoteCut({ note: 'Please keep the text [ shortened ] as it is.', items: sel })).toBe(false)
    // and it does not hide a real cut: a long note that also contains the marker is still cut
    expect(isNoteCut({ note: `[ shortened ] ${'z'.repeat(2500)}`, items: sel })).toBe(true)
  })

  it('counts the selection too: more selected services leave less room for the note', () => {
    const many = Array.from({ length: 8 }, (_, i) => ({ kind: 'service', id: `s${i}`, label: 'A fairly long service name here' }))
    const note = 'n'.repeat(1300)
    expect(isNoteCut({ note, items: [] })).toBe(false)
    expect(isNoteCut({ note, items: many })).toBe(true)
  })
})

describe('buildText', () => {
  it('is plain text with To, Subject and the body', () => {
    toggleRecord('dep-001')
    const text = buildText({ note: 'Hello' })
    expect(text.startsWith('To: contact@xiontechs.com\nSubject: Project enquiry\n\nHello XionTechs,')).toBe(true)
    expect(text).toContain('I looked at:\n- StaffXP')
    expect(text.endsWith('About the system:\nHello')).toBe(true)
  })

  it('is capped near 1800 characters', () => {
    const text = buildText({ note: 'y'.repeat(4000) })
    expect(text.length).toBeLessThanOrEqual(MAX_LENGTH)
    expect(text.endsWith('[ shortened ]')).toBe(true)
  })

  it('takes explicit items, so it needs no store', () => {
    const body = buildBody({ note: '', items: [{ kind: 'service', id: 'x', label: 'Anything' }] })
    expect(body).toContain('- Anything')
  })
})

describe('fitText', () => {
  it('returns the text untouched when it fits and trims to the budget when it does not', () => {
    expect(fitText('abc', 10, '[…]')).toBe('abc')
    const cut = fitText('abcdefghij', 8, '[…]')
    expect(cut.length).toBeLessThanOrEqual(8)
    expect(cut.endsWith('[…]')).toBe(true)
  })
})
