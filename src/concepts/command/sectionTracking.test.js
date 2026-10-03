import { describe, expect, it } from 'vitest'
import { sections as pageSections, nav } from './content'
import { SECTION_IDS } from './scene/store'
import { ACTIVE_LINE, SIGNAL_SECTIONS, isActiveHref, isSignalSection, pickActiveSection, readout, shouldPlayTransient } from './sectionTracking'

const at = (...tops) => SECTION_IDS.map((id, i) => ({ id, top: tops[i] }))

describe('pickActiveSection', () => {
  const vh = 1000 // the line sits at 450 px

  it('picks the first section at the top of the page', () => {
    expect(pickActiveSection(at(0, 900, 1800, 2700, 3600, 4500), vh)).toBe('top')
  })

  it('switches once a section starts above the 45 percent line', () => {
    expect(pickActiveSection(at(-500, 460, 1400, 2300, 3200, 4100), vh)).toBe('top')
    expect(pickActiveSection(at(-500, 450, 1400, 2300, 3200, 4100), vh)).toBe('modules')
    expect(pickActiveSection(at(-1400, -500, 300, 1200, 2100, 3000), vh)).toBe('process')
  })

  it('keeps the last section active through the footer and short gaps', () => {
    expect(pickActiveSection(at(-5000, -4100, -3200, -2300, -1400, -400), vh)).toBe('contact')
    expect(pickActiveSection(at(-900, 100, 900, 1700, 2500, 3300), vh)).toBe('modules')
  })

  it('falls back to the first section when everything is still below the line', () => {
    expect(pickActiveSection(at(600, 1500, 2400, 3300, 4200, 5100), vh)).toBe('top')
  })

  it('returns null when the page has no sections', () => {
    expect(pickActiveSection([], vh)).toBeNull()
  })

  it('uses a line at 45 percent of the viewport', () => {
    expect(ACTIVE_LINE).toBe(0.45)
  })
})

describe('nav links', () => {
  it('marks the link that points at the active section', () => {
    expect(isActiveHref('#process', 'process')).toBe(true)
    expect(isActiveHref('#process', 'modules')).toBe(false)
  })

  it('has no active link while the hero or the finale is active', () => {
    for (const id of ['top', 'contact']) {
      expect(nav.links.some((l) => isActiveHref(l.href, id))).toBe(false)
    }
  })

  it('points every link at a real section id', () => {
    for (const l of nav.links) expect(SECTION_IDS).toContain(l.href.slice(1))
  })
})

describe('signal sections', () => {
  it('lists modules, process, deployments and contact only', () => {
    expect(SIGNAL_SECTIONS).toEqual(['modules', 'process', 'deployments', 'contact'])
    expect(isSignalSection('top')).toBe(false)
    expect(isSignalSection('signals')).toBe(false)
    expect(isSignalSection('process')).toBe(true)
  })
})

describe('readout', () => {
  it('reads "BUILD 003 / 006 · PIPELINE" for the process section', () => {
    expect(readout(pageSections, 'process')).toEqual({ build: '003', total: '006', label: 'Pipeline' })
  })

  it('covers every section id the page uses', () => {
    for (const id of SECTION_IDS) expect(pageSections.some((s) => s.id === id)).toBe(true)
  })

  it('reads as the first section for an unknown id', () => {
    expect(readout(pageSections, 'nope').build).toBe('001')
  })
})

describe('shouldPlayTransient', () => {
  it('plays only when motion is neither reduced nor paused', () => {
    expect(shouldPlayTransient({ reduced: false, paused: false })).toBe(true)
    expect(shouldPlayTransient({ reduced: true, paused: false })).toBe(false)
    expect(shouldPlayTransient({ reduced: false, paused: true })).toBe(false)
  })
})
