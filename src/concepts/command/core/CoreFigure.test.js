import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { CoreFigure } from './CoreFigure.jsx'
import { LAYOUTS } from './graph.js'

const html = (props) => renderToStaticMarkup(createElement(CoreFigure, props))

describe('CoreFigure', () => {
  it.each(LAYOUTS)('renders the %s layout as an aria-hidden svg with no NaN and no hex colour', (layout) => {
    const out = html({ layout })
    expect(out).toContain('<svg')
    expect(out).toContain('aria-hidden="true"')
    expect(out).toContain(`data-layout="${layout}"`)
    expect(out).not.toMatch(/NaN|undefined/)
    expect(out).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
    // Pure art: no text for a screen reader or a font size to fall below 12 px.
    expect(out).not.toContain('<text')
  })

  it('draws the arms layout with the lit arm in the signal colour, and only that arm', () => {
    const lit = html({ layout: 'arms', active: 1 })
    const none = html({ layout: 'arms' })
    expect(lit.match(/stroke-signal/g)?.length ?? 0).toBeGreaterThan(none.match(/stroke-signal/g)?.length ?? 0)
    // The hub of the lit arm is filled yellow.
    expect(lit).toContain('fill-signal stroke-signal')
    expect(none).not.toContain('fill-signal stroke-signal')
  })

  it('marks pending as dashed hollow and illustrative as hatched', () => {
    const out = html({ layout: 'x' })
    expect(out).toContain('stroke-dasharray="2 2"') // the pending satellites
    expect(out).toMatch(/url\(#core-hatch/) // the agent demo record
  })

  it('carries the class that the WebGL hand-over fades, and packets that CSS can pause', () => {
    const out = html({ layout: 'x' })
    expect(out).toContain('core-figure')
    expect(out).toContain('anim-packet')
  })

  it('draws the mark in both tones', () => {
    const out = html({ layout: 'mark' })
    expect(out).toContain('fill-signal')
    expect(out).toContain('fill-ink')
  })
})
