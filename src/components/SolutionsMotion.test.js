import { describe, it, expect } from 'vitest'
import { solutions } from '../content/site'
import { KINDS, LAYERS, VIEW, bandsReducer, flowLayout, initialBands, stackLayout, visualMode } from './SolutionsMotion'

// Generous width of an 11px Inter label in canvas units, so a label that fits here fits on the page.
const labelWidth = (s) => s.length * 6.6
const stepsOf = (kind) => solutions.bands.find((b) => b.visual?.kind === kind)?.visual.steps

describe('What We Build band visuals', () => {
  it('gives every band a known visual, with steps where the visual draws them', () => {
    for (const b of solutions.bands) {
      expect(KINDS, b.id).toContain(b.visual?.kind)
      if (b.visual.kind !== 'layers') expect(b.visual.steps.length, b.id).toBeGreaterThanOrEqual(2)
    }
  })

  it('draws the agent flow as request, agent, decision, action, with labels that fit', () => {
    const steps = stepsOf('flow')
    const { nodes, branch } = flowLayout(steps)
    expect(nodes.map((n) => n.shape)).toEqual(['dot', 'core', 'diamond', 'square'])
    for (const n of nodes) {
      expect(n.x - labelWidth(n.label) / 2, n.label).toBeGreaterThanOrEqual(0)
      expect(n.x + labelWidth(n.label) / 2, n.label).toBeLessThanOrEqual(VIEW.w)
    }
    for (let i = 1; i < nodes.length; i++) {
      const room = (labelWidth(nodes[i - 1].label) + labelWidth(nodes[i].label)) / 2 + 4
      expect(nodes[i].x - nodes[i - 1].x, nodes[i].label).toBeGreaterThan(room)
    }
    expect(branch.y2 + 6).toBeLessThanOrEqual(VIEW.h)
  })

  it('stacks the architecture blocks in order, inside the canvas, without overlap', () => {
    const steps = stepsOf('stack')
    const { slabs, depth, spine } = stackLayout(steps)
    expect(slabs.map((s) => s.label)).toEqual(steps)
    slabs.forEach((s, i) => {
      expect(s.x, s.label).toBeGreaterThan(spine.x)
      expect(s.x + s.w, s.label).toBeLessThanOrEqual(VIEW.w)
      expect(s.y, s.label).toBeGreaterThanOrEqual(0)
      expect(s.y + s.h + depth, s.label).toBeLessThanOrEqual(VIEW.h)
      expect(labelWidth(s.label) + 24, s.label).toBeLessThanOrEqual(s.w)
      if (i > 0) expect(s.y, s.label).toBeGreaterThanOrEqual(slabs[i - 1].y + s.h + depth)
    })
  })

  it('keeps the product frames inside the canvas, each one nearer than the last', () => {
    LAYERS.frames.forEach((f, i) => {
      expect(f.left + LAYERS.w, f.content).toBeLessThanOrEqual(100)
      expect(f.top + LAYERS.h, f.content).toBeLessThanOrEqual(100)
      if (i > 0) expect(f.z, f.content).toBeGreaterThan(LAYERS.frames[i - 1].z)
    })
  })
})

describe('What We Build section state', () => {
  it('tracks one hot band and counts replays', () => {
    let s = initialBands(['agents', 'software'])
    expect(s).toEqual({ hot: null, runs: { agents: 0, software: 0 } })

    s = bandsReducer(s, { type: 'enter', id: 'agents', replay: true })
    expect(s).toEqual({ hot: 'agents', runs: { agents: 1, software: 0 } })

    // Focus moving between links inside the hot band does not replay it again.
    expect(bandsReducer(s, { type: 'enter', id: 'agents', replay: true })).toBe(s)

    s = bandsReducer(s, { type: 'enter', id: 'software', replay: false })
    expect(s).toEqual({ hot: 'software', runs: { agents: 1, software: 0 } })

    expect(bandsReducer(s, { type: 'leave', id: 'agents' })).toBe(s)
    expect(bandsReducer(s, { type: 'leave', id: 'software' }).hot).toBeNull()
  })

  it('holds, plays, replays, or rests with reduced motion', () => {
    expect(visualMode({ reduced: false, seen: false, run: 0 })).toBe('pre')
    expect(visualMode({ reduced: false, seen: true, run: 0 })).toBe('enter')
    expect(visualMode({ reduced: false, seen: true, run: 2 })).toBe('replay')
    expect(visualMode({ reduced: true, seen: false, run: 0 })).toBe('rest')
    expect(visualMode({ reduced: true, seen: true, run: 3 })).toBe('rest')
  })
})
