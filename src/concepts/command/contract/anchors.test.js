import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { trackProgress } from '../runtime/scroll.js'
import { FRAME, STATIONS } from './stations.js'
import {
  ANCHOR_NAMES,
  CoreAnchor,
  HERO_LEG_END,
  coreAnchorSegment,
  ease,
} from './anchors.js'

describe('anchor helpers', () => {
  it('know the five anchors', () => {
    expect(ANCHOR_NAMES).toEqual(['hero', 'premise', 'deploy', 'line', 'done'])
  })

  it('ease is monotonic, clamped and fixed at the ends', () => {
    expect(ease(-1)).toBe(0)
    expect(ease(0)).toBe(0)
    expect(ease(1)).toBe(1)
    expect(ease(2)).toBe(1)
    let last = -1
    for (let t = 0; t <= 1; t += 0.05) {
      expect(ease(t)).toBeGreaterThanOrEqual(last)
      last = ease(t)
    }
  })
})

describe('coreAnchorSegment', () => {
  it('parks on the hero at the top and runs hero -> premise over STANDBY', () => {
    expect(coreAnchorSegment({})).toEqual({ from: 'hero', to: 'premise', t: 0 })
    expect(coreAnchorSegment({ standby: HERO_LEG_END / 2 })).toEqual({ from: 'hero', to: 'premise', t: 0.5 })
    expect(coreAnchorSegment({ standby: HERO_LEG_END }).t).toBe(1)
    expect(coreAnchorSegment({ standby: 1 })).toEqual({ from: 'hero', to: 'premise', t: 1 })
  })

  it('holds the core on the premise anchor for the whole PREMISE track', () => {
    for (const premise of [0.01, 0.25, 0.5, 1]) {
      expect(coreAnchorSegment({ standby: 1, premise })).toEqual({ from: 'hero', to: 'premise', t: 1 })
    }
    // Even when a progress map arrives without standby (the leg is finished by definition).
    expect(coreAnchorSegment({ premise: 0.1 }).t).toBe(1)
  })

  it('has no nonsense in, no NaN out', () => {
    expect(coreAnchorSegment({ standby: Number.NaN, premise: Number.NaN }).t).toBe(0)
  })

  it('weights the premise anchor 0 -> 1 -> 0 with no jump from the hero through DEPLOY', () => {
    // Walk the real track progress one scroll pixel at a time (desktop, 900 px window) and follow
    // how much of the core sits on the premise anchor: 0 at the hero, 1 on the premise, back to 0
    // as it flies on to deploy. Nothing may jump by more than a pixel's worth of progress.
    const vh = 900
    const top = (id) =>
      STATIONS.slice(0, STATIONS.findIndex((s) => s.id === id)).reduce((y, s) => y + (s.lvh / 100) * vh, FRAME.headerDesktop)
    const raw = (y) =>
      Object.fromEntries(
        ['standby', 'premise', 'deploy'].map((id) => {
          const s = STATIONS.find((x) => x.id === id)
          return [id, trackProgress(y, top(id), (s.lvh / 100) * vh, vh, s.mode)]
        }),
      )
    const weight = (y) => {
      const seg = coreAnchorSegment(raw(y))
      return seg.from === 'hero' ? seg.t : 1 - seg.t
    }
    let last = weight(0)
    let max = 0
    for (let y = 1; y <= top('deploy') + 600; y += 1) {
      const w = weight(y)
      max = Math.max(max, Math.abs(w - last))
      last = w
    }
    expect(max).toBeLessThan(0.02)
    expect(weight(0)).toBe(0)
    expect(weight(top('premise') - FRAME.headerDesktop)).toBe(1)
    expect(weight(top('deploy') - 1)).toBe(1)
  })

  it('is on the premise anchor at the premise stop, on desktop, phones and short windows', () => {
    // The #premise landing: scrollY = premise top - header. STANDBY is 'span' mode, so its progress
    // there is 1 - header / track height; the leg must be finished by then.
    for (const [vh, header] of [
      [900, FRAME.headerDesktop],
      [844, FRAME.headerPhone],
      [600, FRAME.headerDesktop], // short window
      [360, FRAME.headerPhone], // landscape phone
    ]) {
      const standby = trackProgress(vh, header, vh, vh, 'span') // premise top = header + vh
      expect(standby).toBeLessThan(1)
      expect(coreAnchorSegment({ standby }).t).toBe(1)
    }
  })

  it('travels premise -> deploy -> line and then hides', () => {
    expect(coreAnchorSegment({ premise: 1, deploy: 0.1 }).from).toBe('premise')
    expect(coreAnchorSegment({ premise: 1, deploy: 1 / 6 }).t).toBeCloseTo(0.5, 5)
    expect(coreAnchorSegment({ premise: 1, deploy: 1, line: 0.075 })).toEqual({ from: 'deploy', to: 'line', t: 0.5 })
    expect(coreAnchorSegment({ premise: 1, deploy: 1, line: 1, work: 0.2 })).toEqual({ from: 'line', to: 'line', t: 0 })
    expect(coreAnchorSegment({ line: 1, work: 1, ledger: 0.5 })).toEqual({ from: 'line', to: 'line', t: 0 })
  })

  it('docks on the finale', () => {
    expect(coreAnchorSegment({ done: 0.01 })).toEqual({ from: 'done', to: 'done', t: 0 })
  })
})

describe('CoreAnchor', () => {
  it('renders an aria-hidden decorative box carrying its name, with its children inside', () => {
    const out = renderToStaticMarkup(createElement(CoreAnchor, { name: 'deploy', className: 'h-40' }, createElement('i', null, 'x')))
    expect(out).toContain('data-core-anchor="deploy"')
    expect(out).toContain('aria-hidden="true"')
    expect(out).toContain('data-decor')
    expect(out).toContain('class="h-40"')
    expect(out).toContain('<i>x</i>')
  })
})
