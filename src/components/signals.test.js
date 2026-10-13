import { describe, expect, it } from 'vitest'
import { team } from '../content/site'
import { capabilityMap, deployments, signals, toCapabilityMap } from './content'
import { countValue, easeOutCubic } from './countUp'

describe('countValue', () => {
  it('starts at 0 and ends on exactly the target', () => {
    expect(countValue(25, 0)).toBe(0)
    expect(countValue(25, 1)).toBe(25)
    expect(countValue(3, 1)).toBe(3)
  })
  it('only counts up, in whole numbers', () => {
    let last = -1
    for (let i = 0; i <= 20; i++) {
      const v = countValue(25, i / 20)
      expect(Number.isInteger(v)).toBe(true)
      expect(v).toBeGreaterThanOrEqual(last)
      last = v
    }
  })
  it('clamps progress outside 0 to 1', () => {
    expect(countValue(25, -1)).toBe(0)
    expect(countValue(25, 7)).toBe(25)
  })
  it('eases out: more than half the count is done at half the time', () => {
    expect(easeOutCubic(0.5)).toBeGreaterThan(0.5)
  })
})

describe('signals (content.js)', () => {
  it('shows a number only for figures the live site states', () => {
    for (const m of signals.metrics) {
      if (m.placeholder) expect(m.value).toBeUndefined()
      else {
        expect(typeof m.value).toBe('number')
        expect(m.source).toBe('LIVE')
      }
    }
  })
  it('matches the figures in the shared site content', () => {
    const years = signals.metrics.find((m) => m.id === 'leadership')
    const offices = signals.metrics.find((m) => m.id === 'offices')
    expect(team.facts[0].value).toBe(years.value + '+')
    expect(team.facts[1].value).toBe(String(offices.value))
  })
  it('flags the offices figure for confirmation, because the addresses on file disagree', () => {
    expect(signals.metrics.find((m) => m.id === 'offices').confirm).toBe(true)
  })
  it('keeps at least one placeholder tile for the figures that do not exist yet', () => {
    expect(signals.metrics.some((m) => m.placeholder)).toBe(true)
  })
  it('splits each layer into technology chips', () => {
    const map = toCapabilityMap([
      { id: 'cloud', label: 'Cloud', items: 'Azure, AWS, GCP' },
      { id: 'be', label: 'Backend', items: '.NET and APIs', draft: true },
      { id: 'data', label: 'Data' },
    ])
    expect(map[0].chips).toEqual(['Azure', 'AWS', 'GCP'])
    expect(map[1].chips).toEqual(['.NET', 'APIs'])
    expect(map[1].draft).toBe(true)
    expect(map[2].chips).toEqual([])
  })
  it('gives the capability map one row per layer with a unique id', () => {
    const ids = capabilityMap.map((l) => l.id)
    expect(ids.length).toBeGreaterThan(0)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('deployments (content.js)', () => {
  it('never claims a status or stack for a project', () => {
    for (const r of deployments.records) {
      expect(r.status).toBeNull()
      expect(r.stack).toBeNull()
    }
  })
  it('does not call the work shipped or deployed while the status is pending', () => {
    expect(`${deployments.label} ${deployments.title}`).not.toMatch(/ship|deploy|production/i)
  })
  it('links the campus-demo card to the campus section on this same page', () => {
    const record = deployments.records.find((r) => r.id === 'campus')
    expect(record.illustrative).toBe(true)
    expect(record.link.href).toBe('#campus')
  })
})
