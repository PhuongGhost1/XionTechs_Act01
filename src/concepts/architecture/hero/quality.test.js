import { describe, expect, it } from 'vitest'
import { MIN_FPS, PROBE_FRAMES, createProbe, qualityGate } from './quality.js'

const good = { width: 1440, webgl: true, reducedMotion: false, saveData: false, touch: false, cores: 8, force: null }

describe('hero quality gate', () => {
  it('lets a normal desktop through', () => {
    expect(qualityGate(good)).toEqual({ ok: true, reason: 'ok' })
  })

  it.each([
    ['no WebGL', { webgl: false }, 'no-webgl'],
    ['reduced motion', { reducedMotion: true }, 'reduced-motion'],
    ['saveData', { saveData: true }, 'save-data'],
    ['a narrow screen', { width: 767 }, 'narrow'],
    ['a forced SVG override', { force: 'svg' }, 'forced-svg'],
    ['a touch device with four cores', { touch: true, cores: 4 }, 'low-power'],
    ['a touch device with two cores', { touch: true, cores: 2 }, 'low-power'],
  ])('refuses %s', (_name, patch, reason) => {
    expect(qualityGate({ ...good, ...patch })).toEqual({ ok: false, reason })
  })

  it('lets a capable touch device through, and does not punish a desktop for few cores', () => {
    expect(qualityGate({ ...good, touch: true, cores: 8 }).ok).toBe(true)
    expect(qualityGate({ ...good, touch: false, cores: 2 }).ok).toBe(true)
  })

  it('accepts exactly the minimum width', () => {
    expect(qualityGate({ ...good, width: 768 }).ok).toBe(true)
  })
})

describe('hero FPS probe', () => {
  const run = (dt, n = PROBE_FRAMES) => {
    const probe = createProbe()
    let verdict = null
    for (let i = 0; i < n && !verdict; i += 1) verdict = probe.push(dt(i))
    return verdict
  }

  it('passes a steady 60 fps', () => {
    const v = run(() => 16.7)
    expect(v.ok).toBe(true)
    expect(v.fps).toBeGreaterThan(MIN_FPS)
  })

  it('fails a steady 25 fps', () => {
    const v = run(() => 40)
    expect(v.ok).toBe(false)
  })

  it('ignores the first frames (shader compile) and stalled frames (a background tab)', () => {
    const v = run((i) => (i < 8 ? 400 : i % 10 === 0 ? 900 : 16.7), PROBE_FRAMES * 2)
    expect(v.ok).toBe(true)
  })

  it('decides only once, after enough frames', () => {
    const probe = createProbe()
    for (let i = 0; i < PROBE_FRAMES - 2; i += 1) expect(probe.push(16.7)).toBeNull()
    expect(probe.verdict).toBeNull()
  })
})
