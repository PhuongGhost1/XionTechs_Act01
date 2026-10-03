// The XionTechs X mark as vector strokes (doc 6.6).
//
// HAND TRACE: the only logo files are two 250 x 46 PNGs (public/XionTechs-Logo_s.png and the
// reversed copy), far too small to enlarge. These strokes were traced by hand from the reversed
// PNG: the pixel runs of every row were read out, each shape was reduced to a centre line with a
// thickness, and the result was overlaid on a 16x zoom of the PNG until the two matched. It is
// good enough to converge into, and crisp at any size, but it is NOT the official artwork.
// REPLACE it by tracing the vector logo when one exists (doc 14, question 1); nothing else in
// core/ depends on the numbers below, only on this file's exports.
//
// What the mark is: an "X" built from a yellow check (a left arm and a long swoosh that rises to
// the upper right), a white inverted V whose left leg trails away as a thin tail, a white bar
// that stands beside the check, and a hairline white arc over the check's tip. Yellow is the
// signal colour, white is ink.
//
// A stroke is a centre line with a thickness at every point: [x, y, width, corner?]. A point with
// corner = 1 is a sharp turn; the others are smoothed (Catmull-Rom). `end` and `start` may carry
// `cut` (the slope dy/dx of a straight cut across the stroke end; 0 is horizontal) when the real
// shape is not cut square to its direction. Strokes are listed bottom layer first.

const LOGO_PX = { x0: 0.8, x1: 85.4, yMid: 23 } // the mark's extent inside the 250 x 46 PNG

// Logo pixels, y down.
const RAW = [
  {
    id: 'bar',
    tone: 'ink',
    points: [
      [66.95, 36.7, 6.9],
      [66.95, 7.0, 6.9],
    ],
    end: { cut: -0.696 }, // the top is cut along the check's swoosh
  },
  {
    id: 'arc',
    tone: 'ink',
    points: [
      [57.0, 11.9, 0.8],
      [60.5, 9.6, 1.0],
      [64.0, 7.4, 1.5],
      [67.5, 5.6, 1.9],
      [70.45, 4.5, 1.4],
      [72.55, 3.5, 1.35],
      [75.5, 2.5, 1.2],
      [79.0, 1.5, 1.1],
      [83.1, 0.5, 0.9],
      [85.4, 0.1, 0.4],
    ],
  },
  {
    id: 'vee',
    tone: 'ink',
    points: [
      [1.9, 45.7, 0.7],
      [8.0, 43.5, 1.7],
      [14.85, 40.5, 2.6],
      [21.35, 36.5, 3.3],
      [25.75, 33.5, 4.0],
      [29.55, 30.5, 4.5],
      [35.4, 26.2, 5.3, 1],
      [45.8, 36.6, 5.9],
    ],
    end: { cut: 0 }, // the right leg stands on the same baseline as the bar
  },
  {
    id: 'check',
    tone: 'signal',
    points: [
      [29.3, 10.1, 6.3],
      [40.8, 21.6, 5.6, 1],
      [46.0, 16.5, 4.7],
      [48.8, 14.5, 3.9],
      [51.5, 12.5, 3.6],
      [54.45, 10.5, 3.3],
      [57.55, 8.5, 2.9],
      [61.1, 6.5, 2.2],
      [65.5, 4.5, 1.5],
      [70.6, 2.5, 1.1],
      [74.0, 1.1, 0.2],
    ],
    start: { cut: 0 },
  },
]

// ---------------------------------------------------------------------------------------------
// Box: every stroke is scaled to a 100 x 100 box, the mark centred vertically.
// ---------------------------------------------------------------------------------------------

export const MARK_BOX = 100
const SCALE = MARK_BOX / (LOGO_PX.x1 - LOGO_PX.x0)
/** The mark is wider than tall: width/height of its traced extent (about 1.84). */
export const MARK_ASPECT = 84.6 / 46

const toBox = ([x, y, w, corner]) => [(x - LOGO_PX.x0) * SCALE, MARK_BOX / 2 + (y - LOGO_PX.yMid) * SCALE, w * SCALE, corner ? 1 : 0]

/** The traced strokes in the 100 x 100 box. Frozen. */
export const MARK_STROKES = Object.freeze(
  RAW.map((s) =>
    Object.freeze({
      id: s.id,
      tone: s.tone,
      points: Object.freeze(s.points.map((p) => Object.freeze(toBox(p)))),
      start: s.start ? Object.freeze({ ...s.start }) : null,
      end: s.end ? Object.freeze({ ...s.end }) : null,
    }),
  ),
)

// ---------------------------------------------------------------------------------------------
// Outline of a stroke
// ---------------------------------------------------------------------------------------------

const hypot = Math.hypot

/** Catmull-Rom between p1 and p2 (p0 and p3 are the neighbours), uniform parameterisation. */
const cr = (p0, p1, p2, p3, t) => {
  const t2 = t * t
  const t3 = t2 * t
  return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
}

/**
 * The centre line with smoothing applied between corners, about `step` box units apart.
 * Returns [[x, y, w, corner]]. Corner points keep both of their neighbours' directions.
 */
export function densify(points, step = 1.6) {
  const out = []
  // Split into runs at the corners (a corner belongs to the run on each side of it).
  const runs = []
  let run = [points[0]]
  for (let i = 1; i < points.length; i += 1) {
    run.push(points[i])
    if (points[i][3] && i < points.length - 1) {
      runs.push(run)
      run = [points[i]]
    }
  }
  runs.push(run)

  // A run ends at its corner without emitting it; the next run starts there and emits it once.
  runs.forEach((r) => {
    for (let i = 0; i < r.length - 1; i += 1) {
      const p0 = r[Math.max(0, i - 1)]
      const p1 = r[i]
      const p2 = r[i + 1]
      const p3 = r[Math.min(r.length - 1, i + 2)]
      const len = hypot(p2[0] - p1[0], p2[1] - p1[1])
      const n = Math.max(1, Math.ceil(len / step))
      for (let s = 0; s < n; s += 1) {
        const t = s / n
        const w = Math.max(0.05, cr(p0[2], p1[2], p2[2], p3[2], t))
        out.push([cr(p0[0], p1[0], p2[0], p3[0], t), cr(p0[1], p1[1], p2[1], p3[1], t), w, s === 0 && p1[3] ? 1 : 0])
      }
    }
  })
  const last = points[points.length - 1]
  out.push([last[0], last[1], last[2], 0])
  return out
}

// A cut across a stroke end: where the two sides meet a straight line through the end point with
// slope `cut` (dy/dx). d points out of the stroke, n is the side normal, h the half width.
function cutShift(d, n, h, cut) {
  const den = d[1] - cut * d[0]
  if (Math.abs(den) < 1e-6) return 0
  return (h * (cut * n[0] - n[1])) / den
}

/**
 * The closed outline of a stroke: left side forward, right side back, mitred joins (limited),
 * butt ends unless the stroke carries a `cut`. Returns { dense, left, right, polygon }.
 */
export function strokeOutline(stroke, step = 1.6) {
  const dense = densify(stroke.points, step)
  // A slanted cut moves one side's end point along the stroke; points closer to the end than
  // that shift would fold the outline back on itself, so they are dropped.
  const trim = (atStart) => {
    const cut = (atStart ? stroke.start : stroke.end)?.cut
    if (!Number.isFinite(cut) || dense.length < 3) return
    const a = atStart ? dense[0] : dense[dense.length - 1]
    const b = atStart ? dense[1] : dense[dense.length - 2]
    const l = hypot(b[0] - a[0], b[1] - a[1]) || 1
    const d = [(a[0] - b[0]) / l, (a[1] - b[1]) / l]
    const n = [-d[1], d[0]]
    const h = a[2] / 2
    const reach = Math.max(Math.abs(cutShift(d, n, h, cut)), Math.abs(cutShift(d, [-n[0], -n[1]], h, cut)))
    while (dense.length > 3) {
      const e = atStart ? dense[1] : dense[dense.length - 2]
      if (hypot(e[0] - a[0], e[1] - a[1]) > reach + 0.2) break
      if (atStart) dense.splice(1, 1)
      else dense.splice(dense.length - 2, 1)
    }
  }
  trim(true)
  trim(false)
  const m = dense.length
  const left = []
  const right = []
  const dirs = []
  for (let i = 0; i < m - 1; i += 1) {
    const dx = dense[i + 1][0] - dense[i][0]
    const dy = dense[i + 1][1] - dense[i][1]
    const l = hypot(dx, dy) || 1
    dirs.push([dx / l, dy / l])
  }
  for (let i = 0; i < m; i += 1) {
    const [x, y, w] = dense[i]
    const h = w / 2
    const a = dirs[Math.max(0, i - 1)]
    const b = dirs[Math.min(m - 2, i)]
    // Normal of a direction (dx, dy) is (-dy, dx).
    const an = [-a[1], a[0]]
    const bn = [-b[1], b[0]]
    let mx = an[0] + bn[0]
    let my = an[1] + bn[1]
    const k = 1 + an[0] * bn[0] + an[1] * bn[1]
    if (i === 0) {
      mx = bn[0]
      my = bn[1]
    } else if (i === m - 1) {
      mx = an[0]
      my = an[1]
    } else if (k < 0.34) {
      mx = an[0]
      my = an[1]
    } else {
      mx /= k
      my /= k
    }
    let lx = x + mx * h
    let ly = y + my * h
    let rx = x - mx * h
    let ry = y - my * h
    const end = i === m - 1 ? stroke.end : i === 0 ? stroke.start : null
    if (end && Number.isFinite(end.cut)) {
      // t is the travel direction at this end, n its left normal (the side `left` is on), d the
      // direction out of the stroke.
      const t = i === 0 ? dirs[0] : dirs[m - 2]
      const n = [-t[1], t[0]]
      const d = i === 0 ? [-t[0], -t[1]] : t
      const sl = cutShift(d, n, h, end.cut)
      const sr = cutShift(d, [-n[0], -n[1]], h, end.cut)
      lx = x + n[0] * h + d[0] * sl
      ly = y + n[1] * h + d[1] * sl
      rx = x - n[0] * h + d[0] * sr
      ry = y - n[1] * h + d[1] * sr
    }
    left.push([lx, ly])
    right.push([rx, ry])
  }
  const polygon = [...left, ...right.reverse()]
  right.reverse()
  return { dense, left, right, polygon }
}

const area = (poly) => {
  let a = 0
  for (let i = 0; i < poly.length; i += 1) {
    const [x1, y1] = poly[i]
    const [x2, y2] = poly[(i + 1) % poly.length]
    a += x1 * y2 - x2 * y1
  }
  return Math.abs(a) / 2
}

export function pointInPolygon(x, y, poly) {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i, i += 1) {
    const [xi, yi] = poly[i]
    const [xj, yj] = poly[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

let cache = null

/** Outlines of every stroke, built once: [{ id, tone, polygon, area, length, ... }]. */
export function markOutlines() {
  if (cache) return cache
  cache = MARK_STROKES.map((s) => {
    const o = strokeOutline(s)
    let length = 0
    for (let i = 1; i < o.dense.length; i += 1) length += hypot(o.dense[i][0] - o.dense[i - 1][0], o.dense[i][1] - o.dense[i - 1][1])
    return { id: s.id, tone: s.tone, ...o, area: area(o.polygon), length }
  })
  return cache
}

/** An SVG path `d` for a polygon, two decimals. */
export const polygonPath = (poly) =>
  `${poly.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`).join('')}Z`

// ---------------------------------------------------------------------------------------------
// Sampler
// ---------------------------------------------------------------------------------------------

/** 0 = ink (white), 1 = signal (yellow): the tone of a sampled point. */
export const TONE = Object.freeze({ ink: 0, signal: 1 })

/**
 * n points on the mark, in the 100 x 100 box: `edge` of them sit exactly on the stroke edges (so
 * the silhouette is crisp), the rest are scattered through the body. A point that falls under a
 * stroke drawn later (the white strokes under the yellow check) is moved, so no white shows through
 * the yellow. Deterministic for a given rng.
 * @param {number} n
 * @param {() => number} rng
 * @param {number} [edge] share of the points on the edges, 0..1
 * @returns {{ x: Float32Array, y: Float32Array, tone: Uint8Array }}
 */
export function sampleMark(n, rng, edge = 0.5) {
  const outlines = markOutlines()
  const weight = outlines.map((o) => o.area * 0.5 + o.length * 2)
  const total = weight.reduce((a, b) => a + b, 0)
  const x = new Float32Array(n)
  const y = new Float32Array(n)
  const tone = new Uint8Array(n)

  // Cumulative segment weights per stroke, for picking a segment by length x width.
  const segs = outlines.map((o) => {
    const cum = []
    let acc = 0
    for (let i = 0; i < o.dense.length - 1; i += 1) {
      const len = hypot(o.dense[i + 1][0] - o.dense[i][0], o.dense[i + 1][1] - o.dense[i][1])
      acc += len * (0.3 + (o.dense[i][2] + o.dense[i + 1][2]) / 2)
      cum.push(acc)
    }
    return cum
  })

  // How many points each stroke gets (largest remainder, so the sum is exactly n).
  const share = weight.map((w) => (w / total) * n)
  const count = share.map(Math.floor)
  let rest = n - count.reduce((a, b) => a + b, 0)
  share
    .map((s, i) => [s - Math.floor(s), i])
    .sort((a, b) => b[0] - a[0])
    .forEach(([, i]) => {
      if (rest > 0) {
        count[i] += 1
        rest -= 1
      }
    })

  let at = 0
  outlines.forEach((o, si) => {
    const cum = segs[si]
    const top = cum[cum.length - 1]
    for (let c = 0; c < count[si]; c += 1) {
      let px = 0
      let py = 0
      for (let attempt = 0; attempt < 12; attempt += 1) {
        const pick = rng() * top
        let lo = 0
        let hi = cum.length - 1
        while (lo < hi) {
          const mid = (lo + hi) >> 1
          if (cum[mid] < pick) lo = mid + 1
          else hi = mid
        }
        const t = rng()
        const s = rng() < edge ? (rng() < 0.5 ? -1 : 1) : rng() * 2 - 1
        const l = o.left
        const r = o.right
        const lx = l[lo][0] + (l[lo + 1][0] - l[lo][0]) * t
        const ly = l[lo][1] + (l[lo + 1][1] - l[lo][1]) * t
        const rx = r[lo][0] + (r[lo + 1][0] - r[lo][0]) * t
        const ry = r[lo][1] + (r[lo + 1][1] - r[lo][1]) * t
        const u = (1 + s) / 2
        px = rx + (lx - rx) * u
        py = ry + (ly - ry) * u
        let hidden = false
        for (let j = si + 1; j < outlines.length && !hidden; j += 1) hidden = pointInPolygon(px, py, outlines[j].polygon)
        if (!hidden) break
      }
      x[at] = px
      y[at] = py
      tone[at] = TONE[o.tone]
      at += 1
    }
  })
  return { x, y, tone }
}
