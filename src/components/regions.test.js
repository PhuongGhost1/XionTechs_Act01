import { describe, expect, it, vi } from 'vitest'
import { deployments } from './content'
import {
  activeRegion,
  boxStyle,
  chipSide,
  focusInit,
  focusReducer,
  nextTabIndex,
  pad2,
  regionHandlers,
  scrollTargetLeft,
} from './regions'

describe('nextTabIndex', () => {
  it('moves down and up, wrapping at the ends', () => {
    expect(nextTabIndex('ArrowDown', 0, 3)).toBe(1)
    expect(nextTabIndex('ArrowDown', 2, 3)).toBe(0)
    expect(nextTabIndex('ArrowUp', 1, 3)).toBe(0)
    expect(nextTabIndex('ArrowUp', 0, 3)).toBe(2)
  })
  it('jumps with Home and End', () => {
    expect(nextTabIndex('Home', 2, 3)).toBe(0)
    expect(nextTabIndex('End', 0, 3)).toBe(2)
  })
  it('ignores every other key, so typing and shortcuts are untouched', () => {
    expect(nextTabIndex('Tab', 0, 3)).toBeNull()
    expect(nextTabIndex('Enter', 0, 3)).toBeNull()
    expect(nextTabIndex('ArrowDown', 0, 0)).toBeNull()
  })
})

describe('focusReducer', () => {
  it('lets a hover preview win over a pinned region', () => {
    let s = focusReducer(focusInit, { type: 'pin', id: 'a' })
    expect(activeRegion(s)).toBe('a')
    s = focusReducer(s, { type: 'preview', id: 'b' })
    expect(activeRegion(s)).toBe('b')
    s = focusReducer(s, { type: 'preview', id: null })
    expect(activeRegion(s)).toBe('a')
  })
  it('unpins on a second tap and drops the preview that tap set', () => {
    let s = focusReducer(focusInit, { type: 'preview', id: 'a' })
    s = focusReducer(s, { type: 'pin', id: 'a' })
    s = focusReducer(s, { type: 'pin', id: 'a' })
    expect(activeRegion(s)).toBeNull()
  })
  it('keeps the same state object when nothing changes', () => {
    const s = focusReducer(focusInit, { type: 'preview', id: 'a' })
    expect(focusReducer(s, { type: 'preview', id: 'a' })).toBe(s)
  })
})

describe('regionHandlers', () => {
  const pointer = (pointerType) => ({ pointerType })
  it('previews on mouse hover but not on the enter/leave around a touch', () => {
    const dispatch = vi.fn()
    const h = regionHandlers(dispatch, 'a')
    h.onPointerEnter(pointer('mouse'))
    h.onPointerEnter(pointer('touch'))
    h.onPointerLeave(pointer('touch'))
    expect(dispatch).toHaveBeenCalledTimes(1)
    expect(dispatch).toHaveBeenCalledWith({ type: 'preview', id: 'a' })
  })
  it('scrolls the region into view on focus and click', () => {
    const dispatch = vi.fn()
    const reveal = vi.fn()
    const h = regionHandlers(dispatch, 'a', reveal)
    h.onFocus()
    h.onClick()
    expect(reveal).toHaveBeenCalledTimes(2)
    expect(reveal).toHaveBeenCalledWith('a')
  })
})

describe('box geometry', () => {
  it('turns a box into CSS percentages', () => {
    expect(boxStyle({ x: 1, y: 2.5, w: 30, h: 4 })).toEqual({ left: '1%', top: '2.5%', width: '30%', height: '4%' })
  })
  it('opens the chip toward the centre of the screen', () => {
    expect(chipSide({ x: 0.7, y: 0, w: 19, h: 5 })).toBe('left')
    expect(chipSide({ x: 81.9, y: 0, w: 17.8, h: 5 })).toBe('right')
  })
  it('pads indexes to two digits', () => {
    expect(pad2(1)).toBe('01')
    expect(pad2(12)).toBe('12')
  })
})

describe('scrollTargetLeft', () => {
  const view = { viewWidth: 300, contentWidth: 700 }
  it('does nothing when the box is already fully visible', () => {
    expect(scrollTargetLeft({ ...view, boxLeft: 20, boxWidth: 100, scrollLeft: 0 })).toBeNull()
  })
  it('centres a box that is off screen', () => {
    expect(scrollTargetLeft({ ...view, boxLeft: 400, boxWidth: 100, scrollLeft: 0 })).toBe(300)
  })
  it('never scrolls past either end', () => {
    expect(scrollTargetLeft({ ...view, boxLeft: 650, boxWidth: 40, scrollLeft: 0 })).toBe(400)
    expect(scrollTargetLeft({ ...view, boxLeft: 5, boxWidth: 40, scrollLeft: 300 })).toBe(0)
  })
  it('aligns a box wider than the frame to its left edge', () => {
    expect(scrollTargetLeft({ ...view, boxLeft: 100, boxWidth: 500, scrollLeft: 0 })).toBe(100)
  })
})

describe('deployment records (content.js)', () => {
  it('keeps every region box inside the screenshot', () => {
    for (const record of deployments.records.filter((r) => r.regions)) {
      for (const region of record.regions) {
        expect(region.boxes.length).toBeGreaterThan(0)
        for (const b of region.boxes) {
          expect(b.x).toBeGreaterThanOrEqual(0)
          expect(b.y).toBeGreaterThanOrEqual(0)
          expect(b.x + b.w).toBeLessThanOrEqual(100)
          expect(b.y + b.h).toBeLessThanOrEqual(100)
        }
      }
    }
  })
  it('gives every region of a record a unique id', () => {
    for (const record of deployments.records.filter((r) => r.regions)) {
      const ids = record.regions.map((r) => r.id)
      expect(new Set(ids).size).toBe(ids.length)
    }
  })
  it('never states a stack or a status the team has not confirmed', () => {
    for (const record of deployments.records) {
      expect(record.stack).toBeNull()
      expect(record.status).toBeNull()
    }
  })
})
