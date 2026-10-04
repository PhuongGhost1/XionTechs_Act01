// PORTED from the main page: src/workflow/journey.test.js (read 2026-10-04): the timeline and the
// state at a tick. The layout, camera and ring tests belong to the main page's SVG.
import { describe, expect, it } from 'vitest'
import { agent } from '../../content/agent.js'
import { journeyEvents, journeyStateAt, journeyTicks } from './journey.js'

const j = {
  id: 't',
  stops: [
    { kind: 'resource', text: 'a/one', doing: 'One' },
    { kind: 'skill', text: 'skills/two', doing: 'Two' },
    { kind: 'compact', text: 'context', doing: 'Compacting context…' },
    { kind: 'resource', text: 'c/three', doing: 'Three' },
    { kind: 'resource', text: 'd/four', doing: 'Four' },
  ],
}

describe('journey timeline', () => {
  it('moves then works at every stop, with an extra draining tick at the compaction', () => {
    expect(journeyEvents(j).map((e) => `${e.stop}${e.phase[0]}${e.drain ? 'd' : ''}`)).toEqual([
      '0m', '0w', '1m', '1w', '2m', '2w', '2wd', '3m', '3w', '4m', '4w',
    ])
    expect(journeyTicks(j)).toBe(11)
  })

  it('reports the current stop, phase and what the agent is doing', () => {
    const s = journeyStateAt(j, 3)
    expect(s.stopIndex).toBe(1)
    expect(s.phase).toBe('working')
    expect(s.doing).toBe('Two')
    expect(s.done).toBe(false)
  })

  it('shows the previous stop while moving to the next one', () => {
    expect(journeyStateAt(j, 4).doing).toBe('Two')
    expect(journeyStateAt(j, 0).doing).toBe('One')
  })

  it('lights visited non-compact stops only', () => {
    expect([...journeyStateAt(j, 2).lit]).toEqual([0])
    expect([...journeyStateAt(j, 3).lit]).toEqual([0, 1])
    expect([...journeyStateAt(j, 8).lit]).toEqual([0, 1, 3])
  })

  it('flags the compaction on its working ticks only', () => {
    expect(journeyStateAt(j, 5).compacting).toBe(true)
    expect(journeyStateAt(j, 6).compacting).toBe(true)
    expect(journeyStateAt(j, 7).compacting).toBe(false)
  })

  it('is done at journeyTicks and stays done beyond it', () => {
    for (const t of [11, 50]) {
      const s = journeyStateAt(j, t)
      expect(s.done).toBe(true)
      expect(s.stopIndex).toBe(4)
      expect(s.compacting).toBe(false)
      expect([...s.lit]).toEqual([0, 1, 3, 4])
    }
  })
})

describe('the ported journeys', () => {
  it('each has one compaction stop and eight stops', () => {
    expect(agent.journeys).toHaveLength(3)
    for (const journey of agent.journeys) {
      expect(journey.stops.filter((s) => s.kind === 'compact')).toHaveLength(1)
      expect(journey.stops.length).toBeGreaterThanOrEqual(7)
      for (const s of journey.stops) expect(s.doing, s.id).toBeTruthy()
    }
  })
})
