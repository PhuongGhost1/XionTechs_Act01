import { describe, expect, it } from 'vitest'
import {
  GROUP,
  LINE_INDEX,
  OUTLINES,
  SEGMENT_COUNT,
  SIGNAL_INDEX,
  SOURCE,
  STEP_AT,
  TARGET,
  THIN,
  VIEW,
  X_STROKES,
  X_STROKE_WIDTH,
  chainStep,
  converge,
  frame,
  pathD,
  segmentProgress,
  signalMix,
  strokeWidth,
} from './converge.js'

// Distance from point q to the segment a-b.
function distToSegment(q, a, b) {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const t = Math.max(0, Math.min(1, ((q[0] - a[0]) * dx + (q[1] - a[1]) * dy) / (dx * dx + dy * dy)))
  return Math.hypot(q[0] - (a[0] + t * dx), q[1] - (a[1] + t * dy))
}

const steps = Array.from({ length: 101 }, (_, i) => i / 100)

describe('converge segments', () => {
  it('uses about sixty to a hundred segments, the same number at both ends and in the colour groups', () => {
    expect(SEGMENT_COUNT).toBeGreaterThanOrEqual(60)
    expect(SEGMENT_COUNT).toBeLessThanOrEqual(100)
    expect(SOURCE).toHaveLength(SEGMENT_COUNT)
    expect(TARGET).toHaveLength(SEGMENT_COUNT)
    expect(GROUP).toHaveLength(SEGMENT_COUNT)
    expect(LINE_INDEX.length + SIGNAL_INDEX.length).toBe(SEGMENT_COUNT)
    expect(LINE_INDEX.length).toBe(SIGNAL_INDEX.length)
    expect(converge(0.4)).toHaveLength(SEGMENT_COUNT)
  })

  it('starts exactly on the five slab outlines, twenty segments per layer', () => {
    const start = converge(0)
    expect(start).toEqual(SOURCE)
    start.forEach((s, i) => {
      const layer = OUTLINES[Math.floor(i / (SEGMENT_COUNT / OUTLINES.length))]
      for (const q of [[s[0], s[1]], [s[2], s[3]]]) {
        const d = Math.min(...layer.map((a, k) => distToSegment(q, a, layer[(k + 1) % 4])))
        expect(d).toBeLessThan(1e-9)
      }
    })
  })

  it('draws the outlines closed: every slab edge is covered end to end by contiguous pieces', () => {
    for (let l = 0; l < OUTLINES.length; l++) {
      const n = SEGMENT_COUNT / OUTLINES.length
      const pieces = SOURCE.slice(l * n, (l + 1) * n)
      pieces.forEach((s, j) => {
        const next = pieces[(j + 1) % n]
        const gap = Math.hypot(s[2] - next[0], s[3] - next[1])
        expect(gap).toBeLessThan(1e-9)
      })
    }
  })

  it('ends exactly on the two strokes of the X, each stroke covered end to end', () => {
    const end = converge(1)
    expect(end).toEqual(TARGET)
    X_STROKES.forEach((stroke, g) => {
      const mine = end.filter((_, i) => GROUP[i] === g)
      expect(mine).toHaveLength(SEGMENT_COUNT / 2)
      let covered = 0
      for (const s of mine) {
        for (const q of [[s[0], s[1]], [s[2], s[3]]]) expect(distToSegment(q, stroke.from, stroke.to)).toBeLessThan(1e-9)
        covered += Math.hypot(s[2] - s[0], s[3] - s[1])
      }
      expect(covered).toBeCloseTo(Math.hypot(stroke.to[0] - stroke.from[0], stroke.to[1] - stroke.from[1]), 6)
    })
  })

  it('gives the two strokes the geometry of the XMark: they cross at the centre of the drawing', () => {
    const [a, b] = X_STROKES
    expect((a.from[0] + a.to[0]) / 2).toBe(VIEW.cx)
    expect((a.from[1] + a.to[1]) / 2).toBe(VIEW.cy)
    expect((b.from[0] + b.to[0]) / 2).toBe(VIEW.cx)
    expect((b.from[1] + b.to[1]) / 2).toBe(VIEW.cy)
    expect(X_STROKE_WIDTH).toBe(78)
  })

  it('never moves a segment backwards: every segment, and the total, only progresses as p grows', () => {
    let prev = segmentProgress(0)
    let prevTotal = 0
    for (const p of steps.slice(1)) {
      const cur = segmentProgress(p)
      cur.forEach((e, i) => expect(e).toBeGreaterThanOrEqual(prev[i] - 1e-12))
      const total = cur.reduce((a, b) => a + b, 0)
      expect(total).toBeGreaterThanOrEqual(prevTotal - 1e-9)
      prev = cur
      prevTotal = total
    }
    expect(prev.every((e) => e === 1)).toBe(true)
  })

  it('staggers the segments: mid-way some have landed, some are moving and some have not started', () => {
    const e = segmentProgress(0.3)
    expect(e.some((v) => v === 0)).toBe(true)
    expect(e.some((v) => v > 0 && v < 1)).toBe(true)
    expect(Math.max(...e)).toBeGreaterThan(0.5)
    expect(new Set(e.map((v) => v.toFixed(3))).size).toBeGreaterThan(10)
  })

  it('collapses toward the centre first: the cloud is tighter mid-flight than at either end', () => {
    const spread = (segs) => segs.reduce((a, s) => a + Math.hypot((s[0] + s[2]) / 2 - VIEW.cx, (s[1] + s[3]) / 2 - VIEW.cy), 0) / segs.length
    const at = (p) => spread(converge(p))
    expect(at(0.4)).toBeLessThan(at(0))
    expect(at(0.4)).toBeLessThan(at(1))
  })

  it('stays inside the drawing at every step and clamps p outside 0..1', () => {
    const all = steps.flatMap((p) => converge(p).flat())
    expect(all.every(Number.isFinite)).toBe(true)
    expect(Math.min(...all)).toBeGreaterThanOrEqual(0)
    expect(Math.max(...all)).toBeLessThanOrEqual(VIEW.w)
    expect(converge(-3)).toEqual(converge(0))
    expect(converge(7)).toEqual(converge(1))
  })
})

describe('path data', () => {
  it('writes one move and one line per segment, so a colour group is a single path', () => {
    const d = pathD(converge(0.5))
    expect(d.match(/M/g)).toHaveLength(SEGMENT_COUNT)
    expect(d.match(/L/g)).toHaveLength(SEGMENT_COUNT)
    expect(d).toMatch(/^M-?\d+(\.\d+)? -?\d+(\.\d+)?L/)
    expect(pathD([])).toBe('')
  })

  it('rounds to two decimals', () => {
    expect(pathD([[1.23456, 2.34567, 3.45678, 4.56789]])).toBe('M1.23 2.35L3.46 4.57')
  })

  it('splits a frame into two paths of equal size', () => {
    const fr = frame(0.4)
    expect(fr.line.match(/M/g)).toHaveLength(SEGMENT_COUNT / 2)
    expect(fr.signal.match(/M/g)).toHaveLength(SEGMENT_COUNT / 2)
  })
})

describe('stroke, colour and captions', () => {
  it('thickens from a hairline into the stroke of the mark, never thinning', () => {
    expect(strokeWidth(0)).toBe(THIN)
    expect(strokeWidth(0.5)).toBe(THIN)
    expect(strokeWidth(1)).toBe(X_STROKE_WIDTH)
    let prev = 0
    for (const p of steps) {
      expect(strokeWidth(p)).toBeGreaterThanOrEqual(prev)
      prev = strokeWidth(p)
    }
  })

  it('reveals the yellow last: paper until the mark is nearly formed, yellow at the end', () => {
    expect(signalMix(0)).toBe(0)
    expect(signalMix(0.5)).toBe(0)
    expect(signalMix(1)).toBe(1)
    let prev = 0
    for (const p of steps) {
      expect(signalMix(p)).toBeGreaterThanOrEqual(prev)
      prev = signalMix(p)
    }
  })

  it('lights the four captions in order, the last one only once the mark has formed', () => {
    expect(chainStep(0)).toBe(0)
    expect(chainStep(1)).toBe(STEP_AT.length - 1)
    let prev = 0
    for (const p of steps) {
      expect(chainStep(p)).toBeGreaterThanOrEqual(prev)
      expect(chainStep(p) - prev).toBeLessThanOrEqual(1)
      prev = chainStep(p)
    }
    expect(strokeWidth(STEP_AT[3])).toBe(X_STROKE_WIDTH)
    expect(segmentProgress(STEP_AT[3]).every((e) => e === 1)).toBe(true)
  })
})
