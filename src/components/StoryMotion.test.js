import { describe, it, expect } from 'vitest'
import { selectedWork } from '../content/site'
import { activeSpot, areaAtProgress, chipPlacement, spotlightInit, spotlightReducer } from './StoryMotion'

const run = (actions, state = spotlightInit) => actions.reduce(spotlightReducer, state)
const ids = ['a', 'b', 'c']

describe('spotlight state machine', () => {
  it('highlights the automatic step until the visitor points somewhere', () => {
    const s = run([{ type: 'auto', index: 1 }])
    expect(activeSpot(s, ids)).toBe('b')
    expect(activeSpot(run([{ type: 'preview', id: 'c' }], s), ids)).toBe('c')
  })

  it('lets a pinned region outlast the preview, and a second click unpins it', () => {
    const pinned = run([{ type: 'auto', index: 0 }, { type: 'preview', id: 'b' }, { type: 'pin', id: 'b' }, { type: 'preview', id: null }])
    expect(activeSpot(pinned, ids)).toBe('b')
    expect(activeSpot(run([{ type: 'pin', id: 'b' }], pinned), ids)).toBe('a')
  })

  it('ends a one-time tour for good once the visitor has interacted', () => {
    const s = run([
      { type: 'auto', index: 0, yieldToUser: true },
      { type: 'preview', id: 'c' },
      { type: 'preview', id: null },
      { type: 'auto', index: 1, yieldToUser: true },
    ])
    expect(activeSpot(s, ids)).toBe(null)
  })

  it('keeps following the scroll after the visitor has interacted', () => {
    const s = run([{ type: 'preview', id: 'c' }, { type: 'preview', id: null }, { type: 'auto', index: 2 }])
    expect(activeSpot(s, ids)).toBe('c')
  })

  it('shows nothing automatic when there are no steps (reduced motion)', () => {
    expect(activeSpot(run([{ type: 'auto', index: 1 }]), [])).toBe(null)
  })

  it('returns the same state for a repeated action, so React skips the render', () => {
    const s = run([{ type: 'auto', index: 1 }])
    expect(spotlightReducer(s, { type: 'auto', index: 1 })).toBe(s)
    expect(spotlightReducer(s, { type: 'preview', id: null })).toBe(s)
  })
})

describe('areaAtProgress', () => {
  it('walks through every area once while the screen crosses the viewport', () => {
    const seen = new Set()
    for (let p = 0; p <= 1.0001; p += 0.01) seen.add(areaAtProgress(p, 6))
    expect([...seen]).toEqual([0, 1, 2, 3, 4, 5])
  })

  it('clamps before and after the active stretch', () => {
    expect(areaAtProgress(0, 6)).toBe(0)
    expect(areaAtProgress(1, 6)).toBe(5)
    expect(areaAtProgress(0.5, 0)).toBe(-1)
  })
})

describe('chipPlacement', () => {
  it('opens labels toward the centre and keeps top-edge labels inside their box', () => {
    expect(chipPlacement({ x: 0.7, y: 34.4, w: 19.1, h: 61.1 })).toEqual({ align: 'left', inside: false })
    expect(chipPlacement({ x: 81.9, y: 5.7, w: 17.8, h: 93.5 })).toEqual({ align: 'right', inside: true })
  })
})

describe('ESS annotation layout', () => {
  const { areas } = selectedWork.ess
  const near = (a, b) => Math.abs(a - b) < 0.06

  it('puts every label in a gutter and ends its connector on the edge of one of its regions', () => {
    for (const a of areas) {
      expect(['left', 'right'], a.id).toContain(a.side)
      const onEdge = a.regions.some((r) => {
        const edgeX = a.side === 'left' ? r.x : r.x + r.w
        return near(a.marker.x, edgeX) && a.marker.y > r.y && a.marker.y < r.y + r.h
      })
      expect(onEdge, a.id).toBe(true)
    }
  })

  it('numbers labels top to bottom, whichever gutter they sit in', () => {
    const ys = areas.map((a) => a.marker.y)
    expect(ys).toEqual([...ys].sort((p, q) => p - q))
  })

  it('spaces labels in the same gutter far enough apart that they never overlap', () => {
    for (const side of ['left', 'right']) {
      const ys = areas.filter((a) => a.side === side).map((a) => a.marker.y)
      for (let i = 1; i < ys.length; i++) expect(ys[i] - ys[i - 1], `${side} ${i}`).toBeGreaterThanOrEqual(15)
    }
  })
})

describe('StaffXP hotspots', () => {
  it('has a unique id and a label for every region', () => {
    const { hotspots } = selectedWork.staffxp
    expect(new Set(hotspots.map((h) => h.id)).size).toBe(hotspots.length)
    for (const h of hotspots) expect(h.label.length, h.id).toBeGreaterThan(0)
  })
})

describe('spotlightReducer unpinning on touch', () => {
  it('clears the preview left by the focusing tap when the same item is unpinned', () => {
    // Tap 1: focus sets the preview, click pins. Tap 2 on the same button: click only.
    const s = run([
      { type: 'preview', id: 'tasks' },
      { type: 'pin', id: 'tasks' },
      { type: 'pin', id: 'tasks' },
    ])
    expect(s.pinned).toBeNull()
    expect(s.preview).toBeNull()
    expect(activeSpot(s, ['calendar', 'tasks'])).toBeNull()
  })

  it('keeps a preview of a different item when another item is unpinned', () => {
    const s = run([
      { type: 'pin', id: 'tasks' },
      { type: 'preview', id: 'notices' },
      { type: 'pin', id: 'tasks' },
    ])
    expect(s.preview).toBe('notices')
  })
})
