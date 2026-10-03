import { LAYER_COUNT, SLAB, layerY } from '../model/layers.js'
import { iso } from '../model/project.js'
import { GAP_MAX, lerp, range, smooth } from '../model/timeline.js'
import { clamp01 } from '../state/scroll.js'

// The signature final transition (BRIEF 02 §14): the exploded digital architecture compresses into the X
// mark. Pure geometry, no DOM. About a hundred short segments are sampled along the five slab outlines of the
// hero's reference model (same layers, same axonometric projection, same gap as the hero's open state) and
// each is paired with a target segment on one of the two strokes of the X. converge(p) interpolates them;
// pathD() turns a list of segments into path data, so the component writes two `d` attributes per frame and
// never touches React state. Nothing here is a measurement or a claim: it is a drawing.
//
// Timeline (p = 0 -> 1 over the sticky stage):
//   0.00 - 0.05   hold: the exploded model, as at the end of the hero
//   0.05 - 0.62   the segments collapse toward the centre, farthest first, and spread onto the two strokes
//   0.60 - 0.80   the hairlines thicken into the strokes of the mark
//   0.66 - 0.84   the second stroke turns yellow (the final reveal)
//   0.80 - 1.00   the mark holds while the logo resolves

export const VIEW = { w: 600, h: 600, cx: 300, cy: 300 }
export const K = 30 // px per model unit in the 600 x 600 drawing
export const GAP = GAP_MAX // the open state of the hero model

// The X, in the 100 x 100 box of ui/Marks.jsx (XMark), scaled to the drawing. Stroke 0 is the line colour
// (the logo's navy stroke, paper on the navy band), stroke 1 is brand yellow and is drawn on top.
export const X_SCALE = 6
export const X_STROKES = [
  { id: 'line', from: [16 * X_SCALE, 14 * X_SCALE], to: [84 * X_SCALE, 86 * X_SCALE] },
  { id: 'signal', from: [84 * X_SCALE, 14 * X_SCALE], to: [16 * X_SCALE, 86 * X_SCALE] },
]
export const X_STROKE_WIDTH = 13 * X_SCALE
export const THIN = 1.5

const PER_EDGE = [6, 4, 6, 4] // pieces along the x edge, the z edge, and back
const PIECES_PER_LAYER = PER_EDGE.reduce((a, b) => a + b, 0)
export const SEGMENT_COUNT = PIECES_PER_LAYER * LAYER_COUNT // 100
const PER_STROKE = SEGMENT_COUNT / 2
const PER_ARM = PER_STROKE / 2

export const T_START = 0.05
export const T_END = 0.62
const SPREAD_WINDOW = 0.5 // each segment spends half of the phase moving
const PULL = 0.28 // how far a moving segment is drawn toward the centre mid-flight

const mid = (s) => [(s[0] + s[2]) / 2, (s[1] + s[3]) / 2]
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1])
const along = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)]
const cut = (a, b, n) =>
  Array.from({ length: n }, (_, j) => {
    const p = along(a, b, j / n)
    const q = along(a, b, (j + 1) / n)
    return [p[0], p[1], q[0], q[1]]
  })

// ------------------------------------------------------------------ sources: the five slab outlines
function buildOutlines() {
  const hw = SLAB.w / 2
  const hd = SLAB.d / 2
  const corners = [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]]
  const raw = Array.from({ length: LAYER_COUNT }, (_, i) => corners.map(([x, z]) => iso(x, layerY(i, GAP), z, K)))
  const xs = raw.flat().map((p) => p[0])
  const ys = raw.flat().map((p) => p[1])
  const ox = VIEW.cx - (Math.min(...xs) + Math.max(...xs)) / 2
  const oy = VIEW.cy - (Math.min(...ys) + Math.max(...ys)) / 2
  return raw.map((pts) => pts.map(([x, y]) => [x + ox, y + oy]))
}

/** Four projected corners of each slab, top layer first, in drawing coordinates. */
export const OUTLINES = buildOutlines()

const sourceSegments = OUTLINES.flatMap((pts) =>
  pts.flatMap((a, k) => cut(a, pts[(k + 1) % 4], PER_EDGE[k])),
)

// ------------------------------------------------------------------ targets: the two strokes of the X
// Four arms of equal length leave the centre: NW and SE are the line stroke, NE and SW the yellow stroke.
// Pieces are numbered from the centre outwards inside an arm.
const CENTRE = [VIEW.cx, VIEW.cy]
const strokePieces = X_STROKES.map((s) => cut(s.from, s.to, PER_STROKE))
const ARMS = [
  { stroke: 0, pieces: strokePieces[0].slice(0, PER_ARM) }, // NW
  { stroke: 1, pieces: strokePieces[1].slice(0, PER_ARM) }, // NE
  { stroke: 0, pieces: strokePieces[0].slice(PER_ARM) }, // SE
  { stroke: 1, pieces: strokePieces[1].slice(PER_ARM) }, // SW
].map((arm) => ({
  stroke: arm.stroke,
  pieces: [...arm.pieces].sort((a, b) => dist(mid(a), CENTRE) - dist(mid(b), CENTRE)),
}))

// ------------------------------------------------------------------ pairing
// Sources are sorted by the angle of their midpoint around the centre and cut into four equal groups, one per
// arm (NW, NE, SE, SW in angle order). Inside a group, the outermost source takes the outermost target.
function buildPairs() {
  const order = sourceSegments
    .map((s, i) => ({ i, angle: Math.atan2(mid(s)[1] - CENTRE[1], mid(s)[0] - CENTRE[0]), r: dist(mid(s), CENTRE) }))
    .sort((a, b) => a.angle - b.angle)
  const target = new Array(SEGMENT_COUNT)
  const group = new Array(SEGMENT_COUNT)
  ARMS.forEach((arm, a) => {
    const chunk = order.slice(a * PER_ARM, (a + 1) * PER_ARM).sort((p, q) => p.r - q.r)
    chunk.forEach(({ i }, j) => {
      const src = sourceSegments[i]
      const t = arm.pieces[j]
      // Flip the target when that keeps the two ends from crossing over each other in flight.
      const straight = dist([src[0], src[1]], [t[0], t[1]]) + dist([src[2], src[3]], [t[2], t[3]])
      const flipped = dist([src[0], src[1]], [t[2], t[3]]) + dist([src[2], src[3]], [t[0], t[1]])
      target[i] = flipped < straight ? [t[2], t[3], t[0], t[1]] : t
      group[i] = arm.stroke
    })
  })
  return { target, group }
}

const pairs = buildPairs()

/** Segment i at p = 0: [x1, y1, x2, y2] on a slab outline. */
export const SOURCE = sourceSegments
/** Segment i at p = 1: on one of the two strokes of the X. */
export const TARGET = pairs.target
/** 0 = the line colour stroke, 1 = the yellow stroke. */
export const GROUP = pairs.group
export const LINE_INDEX = GROUP.flatMap((g, i) => (g === 0 ? [i] : []))
export const SIGNAL_INDEX = GROUP.flatMap((g, i) => (g === 1 ? [i] : []))

// ------------------------------------------------------------------ stagger
// Farthest from the centre starts first; a little deterministic jitter keeps the wave from looking ruled.
const START = (() => {
  const byRadius = sourceSegments.map((s, i) => ({ i, r: dist(mid(s), CENTRE) })).sort((a, b) => a.r - b.r)
  const start = new Array(SEGMENT_COUNT)
  byRadius.forEach(({ i }, rank) => {
    const far = rank / (SEGMENT_COUNT - 1)
    const jitter = ((i * 73) % 97) / 97
    start[i] = ((1 - far) * 0.88 + jitter * 0.12) * (1 - SPREAD_WINDOW)
  })
  return start
})()

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)

/** Eased progress of every segment, 0 -> 1, for the stage progress p. Never decreases as p grows. */
export function segmentProgress(p) {
  const u = range(clamp01(p), T_START, T_END)
  return START.map((s) => easeInOut(clamp01((u - s) / SPREAD_WINDOW)))
}

/** The interpolated segments at stage progress p: p = 0 is the sources exactly, p = 1 is the targets exactly. */
export function converge(p) {
  return segmentProgress(p).map((e, i) => {
    if (e <= 0) return SOURCE[i]
    if (e >= 1) return TARGET[i]
    const pull = PULL * Math.sin(Math.PI * e)
    const s = SOURCE[i]
    const t = TARGET[i]
    const out = new Array(4)
    for (let k = 0; k < 4; k += 2) {
      const x = lerp(s[k], t[k], e)
      const y = lerp(s[k + 1], t[k + 1], e)
      out[k] = x + (CENTRE[0] - x) * pull
      out[k + 1] = y + (CENTRE[1] - y) * pull
    }
    return out
  })
}

const f = (n) => Math.round(n * 100) / 100

/** One SVG path `d` for a list of [x1, y1, x2, y2] segments: a move and a line each. */
export function pathD(segments) {
  let d = ''
  for (const s of segments) d += `M${f(s[0])} ${f(s[1])}L${f(s[2])} ${f(s[3])}`
  return d
}

export const strokeWidth = (p) => lerp(THIN, X_STROKE_WIDTH, smooth(range(p, 0.6, 0.8)))
/** 0 = the second stroke still reads as paper linework, 1 = brand yellow. */
export const signalMix = (p) => smooth(range(p, 0.66, 0.84))

// The four captions light up as the drawing changes character: the model, the collapse, the lock, the mark.
export const STEP_AT = [0, 0.22, 0.5, 0.8]
export const chainStep = (p) => STEP_AT.reduce((n, at, i) => (p >= at ? i : n), 0)

/** Everything the component writes for one frame. */
export function frame(p) {
  const segs = converge(p)
  return {
    line: pathD(LINE_INDEX.map((i) => segs[i])),
    signal: pathD(SIGNAL_INDEX.map((i) => segs[i])),
    width: strokeWidth(p),
    mix: signalMix(p),
    step: chainStep(p),
  }
}

/** Where the five layer labels hang: the right-hand tip of each slab, top layer first. */
export const LABEL_ANCHORS = OUTLINES.map((pts) => ({ x: pts[1][0], y: pts[1][1] }))
