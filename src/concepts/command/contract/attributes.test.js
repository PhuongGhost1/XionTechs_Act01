import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  ATTR,
  STORAGE_KEYS,
  normalise,
  readAttr,
  setActive,
  setBrief,
  setMotion,
  setStation,
  setTabHidden,
  setTier,
  setView,
  setWebgl,
} from './attributes.js'

// Vitest runs in Node: there is no document. A minimal stand-in records what is written.
function fakeDocument() {
  const attrs = new Map()
  const el = {
    getAttribute: (n) => (attrs.has(n) ? attrs.get(n) : null),
    setAttribute: vi.fn((n, v) => attrs.set(n, v)),
    removeAttribute: vi.fn((n) => attrs.delete(n)),
  }
  vi.stubGlobal('document', { documentElement: el })
  return { attrs, el }
}

afterEach(() => vi.unstubAllGlobals())

describe('attribute names', () => {
  it('are the eight of the contract', () => {
    expect(ATTR).toEqual({
      tier: 'data-tier',
      motion: 'data-motion',
      view: 'data-view',
      station: 'data-station',
      active: 'data-active',
      webgl: 'data-webgl',
      brief: 'data-brief',
      tabHidden: 'data-tab-hidden',
    })
    expect(STORAGE_KEYS).toEqual({ view: 'xt-view', motion: 'xt-motion' })
  })
})

describe('normalise', () => {
  it('accepts only the documented values', () => {
    expect(normalise(ATTR.tier, 'high')).toBe('high')
    expect(normalise(ATTR.tier, 'ultra')).toBeNull()
    expect(normalise(ATTR.motion, 'off')).toBe('off')
    expect(normalise(ATTR.motion, true)).toBeNull()
    expect(normalise(ATTR.view, 'raw')).toBe('raw')
    expect(normalise(ATTR.view, 'RAW')).toBeNull()
    expect(normalise(ATTR.station, 6)).toBe('6')
    expect(normalise(ATTR.station, 7)).toBeNull()
    expect(normalise(ATTR.station, 1.5)).toBeNull()
    expect(normalise(ATTR.active, 'line')).toBe('line')
    expect(normalise(ATTR.active, 'Not An Id')).toBeNull()
    expect(normalise(ATTR.webgl, 'drawn')).toBe('drawn')
    expect(normalise(ATTR.webgl, 'yes')).toBeNull()
    expect(normalise(ATTR.brief, 5)).toBe('5')
    expect(normalise(ATTR.brief, -1)).toBeNull()
    expect(normalise(ATTR.tabHidden, 'true')).toBe('true')
    expect(normalise(ATTR.tabHidden, 'yes')).toBeNull()
    expect(normalise('data-other', 'x')).toBeNull()
  })
})

describe('setters without a document', () => {
  it('do nothing and never throw', () => {
    expect(setTier('low')).toBe(false)
    expect(setMotion('off', { persist: true })).toBe(false)
    expect(setView('raw', { persist: true })).toBe(false)
    expect(setStation(3)).toBe(false)
    expect(setActive('line')).toBe(false)
    expect(setWebgl(true)).toBe(false)
    expect(setBrief(2)).toBe(false)
    expect(setTabHidden(true)).toBe(false)
    expect(readAttr(ATTR.tier)).toBeNull()
  })
})

describe('setters with a document', () => {
  it('write the attribute and skip identical writes', () => {
    const { attrs, el } = fakeDocument()
    expect(setStation(2)).toBe(true)
    expect(attrs.get('data-station')).toBe('2')
    setStation(2)
    expect(el.setAttribute).toHaveBeenCalledTimes(1)
    setActive('deploy')
    setTier('low')
    setBrief(3)
    expect(Object.fromEntries(attrs)).toEqual({
      'data-station': '2',
      'data-active': 'deploy',
      'data-tier': 'low',
      'data-brief': '3',
    })
    expect(readAttr(ATTR.tier)).toBe('low')
  })

  it('ignore invalid values and keep the old one', () => {
    const { attrs } = fakeDocument()
    setTier('high')
    expect(setTier('nope')).toBe(false)
    expect(attrs.get('data-tier')).toBe('high')
  })

  it('draw and clear data-webgl', () => {
    const { attrs } = fakeDocument()
    setWebgl(true)
    expect(attrs.get('data-webgl')).toBe('drawn')
    setWebgl(false)
    expect(attrs.has('data-webgl')).toBe(false)
  })

  it('set and clear data-tab-hidden (the only writer of it)', () => {
    const { attrs } = fakeDocument()
    setTabHidden(true)
    expect(attrs.get('data-tab-hidden')).toBe('true')
    setTabHidden(false)
    expect(attrs.has('data-tab-hidden')).toBe(false)
  })

  it('persist motion and view when asked, and survive blocked storage', () => {
    fakeDocument()
    const store = new Map()
    vi.stubGlobal('localStorage', { setItem: (k, v) => store.set(k, v) })
    setMotion('off', { persist: true })
    setView('raw', { persist: true })
    setMotion('on')
    expect(store.get('xt-motion')).toBe('off')
    expect(store.get('xt-view')).toBe('raw')
    vi.stubGlobal('localStorage', {
      setItem: () => {
        throw new Error('blocked')
      },
    })
    expect(() => setMotion('off', { persist: true })).not.toThrow()
  })
})
