import { describe, it, expect } from 'vitest'
import * as site from './site'

// Collect every string value in the exported content, however deeply nested.
function collectStrings(value, out = []) {
  if (typeof value === 'string') out.push(value)
  else if (Array.isArray(value)) value.forEach((v) => collectStrings(v, out))
  else if (value && typeof value === 'object') Object.values(value).forEach((v) => collectStrings(v, out))
  return out
}

describe('site content rules', () => {
  it('contains no lorem ipsum', () => {
    const offenders = collectStrings(site).filter((s) => /lorem/i.test(s))
    expect(offenders).toEqual([])
  })

  it('flags every agent scenario as illustrative with exactly five steps', () => {
    expect(site.agentScenarios.length).toBe(3)
    for (const s of site.agentScenarios) {
      expect(s.illustrative).toBe(true)
      expect(s.steps.map((st) => st.role)).toEqual(['Request', 'Understand', 'Check systems', 'Act', 'Outcome'])
    }
  })

  it('keeps agent outcomes free of invented numbers', () => {
    for (const s of site.agentScenarios) {
      const outcome = s.steps[4].text
      expect(outcome).not.toMatch(/\d/)
    }
  })

  it('has three pillars and four roadmap stages', () => {
    expect(site.pillars.map((p) => p.id)).toEqual(['agentic', 'platform', 'engineering'])
    expect(site.roadmap.map((r) => r.stage)).toEqual(['Explore', 'Pilot', 'Production', 'Scale'])
  })
})
