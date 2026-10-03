import { describe, expect, it } from 'vitest'
import { FINAL, PHASES, STOPS, phaseIndex, phaseName, staffPhase } from './phase.js'

const steps = Array.from({ length: 401 }, (_, i) => i / 400)

describe('staffPhase', () => {
  it('starts closed: flat, together, nothing annotated', () => {
    const s = staffPhase(0)
    expect(s).toMatchObject({ open: 0, assemble: 0, explode: 0, labels: 0, pins: 0, phase: 'closed' })
  })

  it('stays closed up to 0.15, then opens until 0.45', () => {
    expect(staffPhase(STOPS.closedEnd).open).toBe(0)
    expect(staffPhase(0.3).open).toBeGreaterThan(0.3)
    expect(staffPhase(0.3).open).toBeLessThan(0.7)
    expect(staffPhase(STOPS.openEnd).open).toBe(1)
  })

  it('holds fully open between 0.45 and 0.65 so it can be explored', () => {
    for (const p of [0.45, 0.5, 0.55, 0.6, 0.65]) {
      const s = staffPhase(p)
      expect(s.explode, String(p)).toBe(1)
      expect(s.labels, String(p)).toBe(p === 0.65 ? s.labels : 1)
      expect(s.assemble).toBe(0)
      expect(s.phase).toBe('open')
    }
  })

  it('reassembles from 0.65 to 1: the gap closes and the callouts appear', () => {
    expect(staffPhase(0.8).explode).toBeLessThan(0.7)
    expect(staffPhase(0.9).explode).toBeLessThan(0.3)
    expect(staffPhase(1)).toMatchObject({ open: 1, assemble: 1, explode: 0, labels: 0, pins: 1, phase: 'assembled' })
    expect(staffPhase(0.7).pins).toBe(0)
    expect(staffPhase(0.9).pins).toBeGreaterThan(0)
  })

  it('moves smoothly: no value jumps more than a few percent (7%) between 1/400 steps', () => {
    let prev = staffPhase(0)
    for (const p of steps.slice(1)) {
      const s = staffPhase(p)
      for (const key of ['open', 'assemble', 'explode', 'labels', 'pins']) {
        expect(Math.abs(s[key] - prev[key]), `${key} at ${p}`).toBeLessThan(0.07)
      }
      prev = s
    }
  })

  it('keeps every value in 0..1, and open/assemble never run backwards', () => {
    let open = 0
    let assemble = 0
    for (const p of steps) {
      const s = staffPhase(p)
      for (const key of ['open', 'assemble', 'explode', 'labels', 'pins']) {
        expect(s[key]).toBeGreaterThanOrEqual(0)
        expect(s[key]).toBeLessThanOrEqual(1)
      }
      expect(s.open).toBeGreaterThanOrEqual(open)
      expect(s.assemble).toBeGreaterThanOrEqual(assemble)
      open = s.open
      assemble = s.assemble
    }
  })

  it('shows labels only while the model is open, never closed or assembled', () => {
    expect(staffPhase(0.1).labels).toBe(0)
    expect(staffPhase(0.5).labels).toBe(1)
    expect(staffPhase(0.95).labels).toBe(0)
  })

  it('clamps and survives bad input', () => {
    expect(staffPhase(-3).p).toBe(0)
    expect(staffPhase(9).p).toBe(1)
    expect(staffPhase(NaN).p).toBe(0)
    expect(staffPhase(undefined).phase).toBe('closed')
  })
})

describe('phase names', () => {
  it('has closed, open and assembled, in that order', () => {
    expect(PHASES).toEqual(['closed', 'open', 'assembled'])
    expect(phaseIndex('assembled')).toBe(2)
    expect(phaseIndex('nonsense')).toBe(0)
  })

  it('changes the caption half way through each move', () => {
    expect(phaseName(0.2)).toBe('closed')
    expect(phaseName(0.3)).toBe('open')
    expect(phaseName(0.7)).toBe('open')
    expect(phaseName(0.8)).toBe('assembled')
    expect(phaseName(1)).toBe('assembled')
  })

  it('uses the assembled, annotated state for a page without motion', () => {
    expect(FINAL.phase).toBe('assembled')
    expect(FINAL.explode).toBe(0)
    expect(FINAL.pins).toBe(1)
  })
})
