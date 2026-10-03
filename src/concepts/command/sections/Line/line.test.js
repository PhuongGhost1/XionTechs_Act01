import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { process as line } from '../../content/index.js'
import { Beat } from './Beat.jsx'
import { BriefLine } from './BriefLine.jsx'
import { LineList } from './LineList.jsx'
import { LineStage } from './LineStage.jsx'

// Server-render checks (the test environment has no document): the markup a visitor and a
// screen reader get, for the stage and for the list fallback.

const stage = (props) =>
  renderToStaticMarkup(
    createElement(LineStage, {
      step: 0,
      paused: false,
      runId: 1,
      played: 0,
      onStop: () => {},
      onPause: () => {},
      onReplay: () => {},
      ...props,
    }),
  )

const count = (html, re) => (html.match(re) ?? []).length

describe('LineStage', () => {
  it('renders six stops as buttons in an ordered list, with exactly one aria-current="step"', () => {
    const html = stage({ step: 2 })
    expect(html).toContain('<ol')
    expect(count(html, /<li /g)).toBe(6)
    expect(count(html, /<button[^>]*aria-current="step"/g)).toBe(1)
    for (const s of line.steps) expect(html).toContain(s.label)
    // The current one is ARCHITECTURE.
    expect(html).toMatch(/aria-current="step"[^>]*>[\s\S]*?ARCHITECTURE/)
  })

  it('shows one giant word and its one sentence, and describes every stop with its sentence', () => {
    const html = stage({ step: 4 })
    expect(html).toContain('line-word')
    expect(html).toContain(line.steps[4].sentence.text)
    for (let i = 0; i < 6; i += 1) expect(html).toContain(`id="line-desc-${i}"`)
    expect(html).toContain(line.legendLine.text)
  })

  it('has the PAUSE and REPLAY controls with aria-pressed only on PAUSE', () => {
    const html = stage({ paused: true })
    expect(html).toContain(line.controls.pause.text)
    expect(html).toContain(line.controls.replay.text)
    expect(count(html, /aria-pressed/g)).toBe(1)
    expect(html).toContain('aria-pressed="true"')
  })

  it('has the core anchor for the line above the stops', () => {
    const html = stage({})
    expect(html).toContain('data-core-anchor="line"')
    expect(html.indexOf('data-core-anchor="line"')).toBeLessThan(html.indexOf('<ol'))
  })

  it('shows the brief on REQUEST and the failure beat on BUILD, nowhere else', () => {
    expect(stage({ step: 0 })).toContain(line.brief.label.text)
    expect(stage({ step: 0 })).not.toContain('line-beat')
    expect(stage({ step: 3 })).toContain('line-beat')
    expect(stage({ step: 3 })).not.toContain(line.brief.label.text)
    expect(stage({ step: 1 })).not.toContain('line-beat')
  })

  it('plays the beat only for a run that has not been shown yet', () => {
    expect(stage({ step: 3, runId: 1, played: 0 })).toContain('data-animated')
    expect(stage({ step: 3, runId: 1, played: 1 })).not.toContain('data-animated')
    expect(stage({ step: 3, runId: 2, played: 1 })).toContain('data-animated')
  })
})

describe('Beat', () => {
  it('is labelled illustrative and says in words what happened', () => {
    const html = renderToStaticMarkup(createElement(Beat, { animate: true }))
    expect(html).toContain('data-chip="illustrative"')
    expect(html).toContain(line.beat.chip.text)
    expect(html).toContain(line.beat.reduced.text)
  })

  it('carries no digits in its text', () => {
    const html = renderToStaticMarkup(createElement(Beat, { animate: true }))
    const text = html.replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<[^>]+>/g, ' ')
    expect(text).not.toMatch(/\d/)
  })

  it('can be paused', () => {
    const html = renderToStaticMarkup(createElement(Beat, { animate: true, paused: true }))
    expect(html).toContain('data-paused')
  })
})

describe('BriefLine', () => {
  it('shows the empty state with a zero count when nothing is selected', () => {
    const html = renderToStaticMarkup(createElement(BriefLine))
    expect(html).toContain(`${line.brief.label.text} ( 0 )`)
    expect(html).toContain(line.brief.empty.text)
  })
})

describe('LineList (the no-pin fallback)', () => {
  const html = renderToStaticMarkup(createElement(LineList))

  it('is a plain ordered list of six rows with every word and sentence', () => {
    expect(count(html, /<li /g)).toBe(6)
    expect(html).toContain('<ol')
    for (const s of line.steps) {
      expect(html).toContain(s.label)
      expect(html).toContain(s.sentence.text)
    }
    expect(html).not.toContain('<button')
  })

  it('reduces the beat to one illustrative sentence with its chip', () => {
    expect(html).toContain(line.beat.reduced.text)
    expect(html).toContain(line.beat.chip.text)
    expect(html).not.toContain('line-beat')
  })

  it('keeps the legend line', () => {
    expect(html).toContain(line.legendLine.text)
  })
})
