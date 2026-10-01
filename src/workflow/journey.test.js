import { describe, it, expect } from 'vitest'
import {
  JOURNEY_VIEW, TAG_H, CHIP, tagWidth, layoutJourney, pathUpTo, cameraX,
  travelledLength, totalLength, journeyEvents, journeyTicks, journeyStateAt,
} from './journey'

const j = {
  id: 't',
  task: 'Test task',
  stops: [
    { kind: 'resource', label: 'a/one', status: 'One' },
    { kind: 'skill', label: 'skills/two', status: 'Two' },
    { kind: 'compact', status: 'Compacting context…' },
    { kind: 'resource', label: 'c/three', status: 'Three' },
    { kind: 'resource', label: 'd/four', status: 'Four' },
  ],
}

describe('layoutJourney', () => {
  const L = layoutJourney(j)

  it('places stops left to right on alternating levels', () => {
    expect(L.points.map((p) => p.x)).toEqual([120, 360, 600, 840, 1080])
    expect(L.points.map((p) => p.y)).toEqual([140, 220, 140, 220, 140])
    expect(L.width).toBe(1200)
    expect(L.height).toBe(JOURNEY_VIEW.h)
  })

  it('draws an orthogonal path with a lead-in and lead-out', () => {
    expect(L.path).toBe('M 0 140 H 120 H 240 V 220 H 360 H 480 V 140 H 600 H 720 V 220 H 840 H 960 V 140 H 1080 H 1200')
  })

  it('gives every non-compact stop a tag, above on the upper level and below on the lower', () => {
    expect(L.tags.map((t) => [t.stopIndex, t.side, t.y])).toEqual([
      [0, 'above', 60], [1, 'below', 300], [3, 'below', 300], [4, 'above', 60],
    ])
    expect(L.tags[0].w).toBe(tagWidth('a/one'))
  })

  it('cuts the travelled path at the requested stop', () => {
    expect(pathUpTo(L, 0)).toBe('M 0 140 H 120')
    expect(pathUpTo(L, 2)).toBe('M 0 140 H 120 H 240 V 220 H 360 H 480 V 140 H 600')
  })

  it('measures the stepped path length to a stop and in total', () => {
    expect(travelledLength(L, 0)).toBe(120)
    expect(travelledLength(L, 2)).toBe(760)
    expect(totalLength(L)).toBe(1520)
  })

  it('centres the camera on the stop but never scrolls past the canvas', () => {
    expect(cameraX(L, 0)).toBe(0)
    expect(cameraX(L, 2)).toBe(600 - 380)
    expect(cameraX(L, 4)).toBe(1200 - 760)
  })
})

describe('journey timeline', () => {
  it('moves then works at every stop, with an extra draining tick at the compaction', () => {
    expect(journeyEvents(j).map((e) => `${e.stop}${e.phase[0]}${e.drain ? 'd' : ''}`)).toEqual([
      '0m', '0w', '1m', '1w', '2m', '2w', '2wd', '3m', '3w', '4m', '4w',
    ])
    expect(journeyTicks(j)).toBe(11)
  })

  it('reports the current stop, phase and status', () => {
    const s = journeyStateAt(j, 3)
    expect(s.stopIndex).toBe(1)
    expect(s.phase).toBe('working')
    expect(s.status).toBe('Two')
    expect(s.done).toBe(false)
  })

  it('shows the previous stop status while moving to the next one', () => {
    expect(journeyStateAt(j, 4).status).toBe('Two')
    expect(journeyStateAt(j, 0).status).toBe('One')
  })

  it('lights visited non-compact stops only', () => {
    expect([...journeyStateAt(j, 2).lit]).toEqual([0])
    expect([...journeyStateAt(j, 3).lit]).toEqual([0, 1])
    expect([...journeyStateAt(j, 8).lit]).toEqual([0, 1, 3])
  })

  it('fills the ring before compaction, flags compaction, drains, then refills', () => {
    const fill = (t) => journeyStateAt(j, t).ringFill
    expect(fill(0)).toBe(0)
    expect(fill(1)).toBeCloseTo(0.425)
    expect(fill(3)).toBeCloseTo(0.85)
    expect(journeyStateAt(j, 5).compacting).toBe(true)
    expect(fill(5)).toBeCloseTo(0.85)
    expect(journeyStateAt(j, 6).compacting).toBe(true)
    expect(fill(6)).toBeCloseTo(0.15)
    expect(journeyStateAt(j, 7).compacting).toBe(false)
    expect(fill(8)).toBeCloseTo(0.5)
    expect(fill(10)).toBeCloseTo(0.85)
  })

  it('is done at journeyTicks and stays done beyond it', () => {
    for (const t of [11, 50]) {
      const s = journeyStateAt(j, t)
      expect(s.done).toBe(true)
      expect(s.stopIndex).toBe(4)
      expect(s.status).toBe('Task complete')
      expect(s.compacting).toBe(false)
      expect([...s.lit]).toEqual([0, 1, 3, 4])
    }
  })

  it('keeps the ring within bounds on every tick', () => {
    for (let t = 0; t <= journeyTicks(j); t++) {
      const f = journeyStateAt(j, t).ringFill
      expect(f >= 0 && f <= 1).toBe(true)
    }
  })

  it('sizes tags from the label length', () => {
    expect(tagWidth('abc')).toBe(3 * 7.2 + 34)
    expect(TAG_H).toBe(24)
    expect(CHIP).toEqual({ w: 230, h: 28, dy: 22 })
  })
})
