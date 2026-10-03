import { describe, expect, it } from 'vitest'
import { LAYER_COUNT } from '../model/layers.js'
import { LABEL_ROOM } from './camera.js'
import { FINAL_PARAMS, LABEL_STEP, LABEL_WIDTH, computeFrame, layoutLabels, paramsFor } from './frame.js'

const stage = (p, W = 700, H = 760, extra = {}) => computeFrame({ mode: 'stage', p, W, H, ...extra })

describe('hero frame', () => {
  it('starts as a plan view and ends as an open axonometric one', () => {
    const a = stage(0)
    expect(a.view.label).toBe('Plan')
    expect(a.view.elevation).toBe(90)
    expect(a.params.lift).toBe(0)
    const b = stage(1)
    expect(b.view.label).toBe('Axonometric')
    expect(b.view.elevation).toBeCloseTo(35.264)
    expect(b.params.lift).toBe(1)
  })

  it('lays the layers out top to bottom on screen once they are apart', () => {
    const f = stage(0.7)
    for (let i = 1; i < LAYER_COUNT; i += 1) expect(f.anchors[i][1]).toBeGreaterThan(f.anchors[i - 1][1])
  })

  it('places the label column to the right of every leader anchor, inside the box', () => {
    for (const W of [524, 700, 820]) {
      const f = stage(1, W, 700)
      for (const a of f.anchors) expect(f.labelX).toBeGreaterThan(a[0])
      expect(f.labelX + LABEL_WIDTH).toBeLessThanOrEqual(W)
    }
  })

  it('reserves enough room on the right for the leader, the text and a little air', () => {
    expect(LABEL_ROOM).toBeGreaterThanOrEqual(30 + LABEL_WIDTH + 10)
  })

  it('never lets two label rows closer than the minimum step', () => {
    for (const p of [0, 0.3, 0.5, 0.62, 0.8, 1]) {
      const f = stage(p)
      for (let i = 1; i < LAYER_COUNT; i += 1) expect(f.labelYs[i] - f.labelYs[i - 1]).toBeGreaterThanOrEqual(LABEL_STEP - 1e-9)
    }
  })

  it('keeps the dimension lines on the model: the horizontal one spans the bottom slab, the vertical one the stack', () => {
    const f = stage(1)
    expect(f.dims.x1).toBeGreaterThan(f.dims.x0)
    expect(f.dims.y).toBeGreaterThanOrEqual(f.dims.y0)
    expect(f.dims.y).toBeGreaterThanOrEqual(f.dims.y1)
    expect(f.dims.bottomY).toBeGreaterThan(f.dims.top)
    expect(f.dims.left).toBeLessThan(f.dims.x0 + 1)
  })

  it('collapses the vertical dimension to nothing in plan view, where the stack has no height on screen', () => {
    const f = stage(0)
    expect(f.dims.bottomY - f.dims.top).toBeLessThan(2)
  })

  it('produces only finite numbers across the whole timeline', () => {
    for (let p = 0; p <= 1.0001; p += 0.05) {
      const f = stage(Math.min(1, p), 700, 760, { time: p * 10 })
      const nums = [...f.anchors.flat(), ...f.labelYs, f.labelX, ...Object.values(f.dims), f.signal.x, f.signal.y, f.signal.alpha]
      for (const n of nums) expect(Number.isFinite(n)).toBe(true)
    }
  })

  it('shows the signal only once the connectors have drawn', () => {
    const early = stage(0.0, 700, 760, { time: 0.9 })
    expect(early.signal.alpha).toBe(0)
    const late = stage(1, 700, 760, { time: 0.9 })
    expect(late.signal.alpha).toBeGreaterThan(0.9)
  })

  it('freezes the signal when asked, for reduced motion', () => {
    const a = computeFrame({ mode: 'final', p: 1, W: 700, H: 760, time: 0, still: true })
    const b = computeFrame({ mode: 'final', p: 1, W: 700, H: 760, time: 5, still: true })
    expect(a.signal).toEqual(b.signal)
    expect(a.signal.alpha).toBeGreaterThan(0.9)
  })
})

describe('hero modes', () => {
  it('uses the full timeline on the desktop stage', () => {
    expect(paramsFor('stage', 0.3).tilt).toBeGreaterThan(0)
    expect(paramsFor('stage', 0.3).tilt).toBeLessThan(1)
  })

  it('keeps the camera axonometric on a phone and only opens the layers as the figure passes', () => {
    for (const p of [0, 0.2, 0.5, 1]) {
      const params = paramsFor('pass', p)
      expect(params.tilt).toBe(1)
      expect(params.depth).toBe(1)
      expect(params.dolly).toBe(0)
    }
    expect(paramsFor('pass', 0).lift).toBe(0)
    expect(paramsFor('pass', 0.5).lift).toBe(1)
  })

  it('shows the finished model under reduced motion', () => {
    expect(paramsFor('final', 0)).toEqual(FINAL_PARAMS)
    expect(Object.values(FINAL_PARAMS).filter((v) => v !== 1)).toEqual([0]) // everything open, no dolly
  })
})

describe('hero label layout', () => {
  const anchors = [[300, 100], [305, 104], [300, 108], [296, 112], [290, 116]]

  it('pushes crowded rows apart and keeps their order', () => {
    const { ys } = layoutLabels(anchors, 700)
    for (let i = 1; i < ys.length; i += 1) expect(ys[i] - ys[i - 1]).toBeGreaterThanOrEqual(LABEL_STEP)
    expect(ys[0]).toBe(100)
  })

  it('leaves well-spaced rows exactly at their anchors', () => {
    const spaced = [[300, 100], [300, 200], [300, 300], [300, 400], [300, 500]]
    expect(layoutLabels(spaced, 700).ys).toEqual([100, 200, 300, 400, 500])
  })

  it('clamps the column so the text stays inside the box', () => {
    const { x } = layoutLabels([[690, 100], [690, 200]], 700)
    expect(x + LABEL_WIDTH).toBeLessThanOrEqual(700)
  })
})
