import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { modules, services } from '../../content/index.js'
import { CONFIRMED_SERVICES } from '../../content/validate.js'
import Deploy from './index.jsx'
import { ServicesPanel } from './ServicesPanel.jsx'

// The sections are plain React, so they render to a string in Node (no window, so the first
// render is the narrow layout, before any observer runs). These tests hold the facts that must be
// in the DOM whatever the layout: every service once, real checkboxes, one active row.

const html = (el) => renderToStaticMarkup(el)
// Static markup escapes & and quotes; undo that to read text back.
const unescape = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;/g, "'")
const brief = { has: () => false, toggleService: () => true }

describe('DEPLOY markup', () => {
  const raw = html(createElement(Deploy))
  const out = unescape(raw)

  it('lists each of the eight confirmed services exactly once, as a checkbox', () => {
    for (const name of CONFIRMED_SERVICES) {
      const count = out.split(`>${name}<`).length - 1
      expect(count, name).toBe(1)
    }
    expect((raw.match(/type="checkbox"/g) ?? []).length).toBe(8)
  })

  it('gives every checkbox a stable id that names the service', () => {
    for (const s of services()) expect(out).toContain(`id="${s.id}-box"`)
  })

  it('has four module rows as buttons and marks exactly one as current', () => {
    expect((raw.match(/class="deploy-row__btn"/g) ?? []).length).toBe(4)
    expect((raw.match(/aria-current="true"/g) ?? []).length).toBe(1)
    for (const m of modules) {
      expect(out).toContain(m.title.text)
      expect(out).toContain(m.definition.text)
    }
  })

  it('states OFFERED, a status word, for every module and never anything else', () => {
    expect((out.match(/OFFERED/g) ?? []).length).toBeGreaterThanOrEqual(4)
    expect(out).not.toMatch(/ONLINE|AVAILABLE|SUCCESS|UPTIME/)
  })

  it('shows the LIVE chip on each service and a platforms list where the live site names one', () => {
    expect((raw.match(/data-chip="live"/g) ?? []).length).toBe(8)
    for (const name of ['Power Platform', 'Make', 'n8n', 'Retool', 'Bubble', 'Azure', 'AWS', 'GCP']) {
      expect(out).toContain(name)
    }
  })

  it('announces the brief count politely', () => {
    expect(out).toContain('aria-live="polite"')
    expect(out).toContain('BRIEF ( 0 )')
  })
})

describe('ServicesPanel', () => {
  it('keeps a hidden panel in the DOM but out of view', () => {
    const panel = html(createElement(ServicesPanel, { module: modules[1], hidden: true, brief }))
    expect(panel).toContain('hidden')
    expect(panel).toContain('AI-Powered Solutions')
    expect(panel).toContain('AI-Driven Analytics')
  })

  it('names the group by its module for assistive tech', () => {
    const panel = html(createElement(ServicesPanel, { module: modules[2], brief }))
    expect(unescape(panel)).toContain('CLOUD & PLATFORM: ')
    expect(panel).toContain('ADD TO BRIEF')
  })

  it('checks the box of a service that is in the brief', () => {
    const inBrief = { has: (id) => id === 'svc.cloud', toggleService: () => true }
    const panel = html(createElement(ServicesPanel, { module: modules[2], brief: inBrief }))
    expect(panel).toContain('checked=""')
  })
})
