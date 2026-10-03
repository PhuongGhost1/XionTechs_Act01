import { afterEach, describe, expect, it } from 'vitest'
import { HIGHLIGHT_MS, chipsOfKind, clearHighlight, highlightKind, isInView, scrollTarget } from './chipHighlight.js'

// A chip stand-in: just what the module touches. `top` and `height` place it in an 800 px viewport.
function chip(kind, top, height = 20) {
  const attrs = new Map()
  return {
    kind,
    attrs,
    scrolled: null,
    getBoundingClientRect: () => ({ top, bottom: top + height, height }),
    setAttribute: (k, v) => attrs.set(k, v),
    removeAttribute: (k) => attrs.delete(k),
    scrollIntoView(opts) {
      this.scrolled = opts
    },
  }
}

const rootOf = (chips) => ({
  querySelectorAll: (sel) => chips.filter((c) => sel === `[data-chip="${c.kind}"]`),
})

// A timer stand-in so the 3 s window can be stepped by hand.
function clock() {
  const jobs = []
  return {
    schedule: (fn, ms) => {
      jobs.push({ fn, ms })
      return jobs.length
    },
    clear: (id) => {
      if (jobs[id - 1]) jobs[id - 1].fn = null
    },
    fire: () => jobs.forEach((j) => j.fn?.()),
    jobs,
  }
}

afterEach(() => clearHighlight())

const win = { innerHeight: 800 }
const band = { top: 64, bottom: 48 }

describe('chip highlight (M18)', () => {
  it('finds the chips of one kind', () => {
    const a = chip('live', 100)
    const b = chip('pending', 100)
    expect(chipsOfKind(rootOf([a, b]), 'live')).toEqual([a])
  })

  it('counts a chip as in view only inside the band between header and dock', () => {
    expect(isInView(chip('live', 300), { viewportHeight: 800, ...band })).toBe(true)
    expect(isInView(chip('live', 20), { viewportHeight: 800, ...band })).toBe(false) // under the header
    expect(isInView(chip('live', 790), { viewportHeight: 800, ...band })).toBe(false) // under the dock
    expect(isInView(chip('live', 2000), { viewportHeight: 800, ...band })).toBe(false)
  })

  it('outlines every chip of the kind, including those off screen, and nothing else', () => {
    const a = chip('live', 300)
    const b = chip('live', 3000)
    const c = chip('real', 300)
    const t = clock()
    const r = highlightKind('live', { root: rootOf([a, b, c]), win, band, schedule: t.schedule, clear: t.clear })
    expect(r.count).toBe(2)
    expect(a.attrs.has('data-highlight')).toBe(true)
    expect(b.attrs.has('data-highlight')).toBe(true)
    expect(c.attrs.has('data-highlight')).toBe(false)
  })

  it('removes the outline after 3 seconds', () => {
    const a = chip('live', 300)
    const t = clock()
    highlightKind('live', { root: rootOf([a]), win, band, schedule: t.schedule, clear: t.clear })
    expect(t.jobs[0].ms).toBe(HIGHLIGHT_MS)
    expect(HIGHLIGHT_MS).toBe(3000)
    t.fire()
    expect(a.attrs.has('data-highlight')).toBe(false)
  })

  it('does not scroll when a chip of the kind is already in view', () => {
    const near = chip('live', 300)
    const far = chip('live', 3000)
    const r = highlightKind('live', { root: rootOf([near, far]), win, band, schedule: clock().schedule })
    expect(r.scrolled).toBe(false)
    expect(far.scrolled).toBeNull()
  })

  it('scrolls to the first chip when none is in view', () => {
    const first = chip('live', 2000)
    const second = chip('live', 3000)
    const r = highlightKind('live', { root: rootOf([first, second]), win, band, schedule: clock().schedule })
    expect(r.scrolled).toBe(true)
    expect(first.scrolled).toEqual({ block: 'center', behavior: 'smooth' })
    expect(second.scrolled).toBeNull()
  })

  it('under reduced motion the scroll, if any, is instant', () => {
    const only = chip('live', 2000)
    highlightKind('live', { root: rootOf([only]), win, band, smooth: false, schedule: clock().schedule })
    expect(only.scrolled).toEqual({ block: 'center', behavior: 'auto' })
  })

  it('ignores chips inside the ledger panel when deciding to scroll', () => {
    const own = chip('live', 300) // in the table the visitor just clicked
    const elsewhere = chip('live', 2500)
    const skip = (el) => el === own
    expect(scrollTarget([own, elsewhere], { viewportHeight: 800, ...band }, skip)).toBe(elsewhere)
    // and when the only chip is the panel's own, there is nowhere to go
    expect(scrollTarget([own], { viewportHeight: 800, ...band }, skip)).toBeNull()
    const r = highlightKind('live', { root: rootOf([own]), win, band, skip, schedule: clock().schedule })
    expect(r).toEqual({ count: 1, scrolled: false })
    expect(own.attrs.has('data-highlight')).toBe(true)
  })

  it('a second selection replaces the first', () => {
    const live = chip('live', 300)
    const real = chip('real', 300)
    const t = clock()
    const opts = { root: rootOf([live, real]), win, band, schedule: t.schedule, clear: t.clear }
    highlightKind('live', opts)
    highlightKind('real', opts)
    expect(live.attrs.has('data-highlight')).toBe(false)
    expect(real.attrs.has('data-highlight')).toBe(true)
    expect(t.jobs[0].fn).toBeNull() // the first timer was cancelled
  })

  it('reports zero when no chip of the kind is on the page', () => {
    const r = highlightKind('measured', { root: rootOf([chip('live', 1)]), win, band, schedule: clock().schedule })
    expect(r).toEqual({ count: 0, scrolled: false })
  })
})
