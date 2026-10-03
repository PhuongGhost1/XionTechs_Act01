// The process drawing as data. One axonometric drawing that is built in six stages; every item carries the
// stage at which it first appears (`from`), optionally the last stage at which it is fully drawn (`until`) and
// how much of it remains after that (`rest`). The drawing is cumulative: at stage s an item is visible when
// from <= s <= until. Pure and deterministic: ProcessDrawing.jsx only renders it, process.css animates it.
//
// Geometry uses the hero's projection (model/project.js `iso`, 30 degree dimetric, y up) and its slab size
// (model/layers.js), so this sheet draws the same kind of building as the hero. World units: x right, z toward
// the viewer, y up; the slab is 10 x 7. Nothing here is a measurement: dimension lines are symbolic.
//
// Item kinds
//   path    { d, c, draw }       stroke path; `draw` plots it with stroke-dashoffset (pathLength 1), else it fades
//   rise    { d, h, c }          a box top: plotted at its base, then lifted by h px
//   grow    { d, ox, oy }        a vertical edge that grows from its base point (ox, oy)
//   pillar  { d, ox, oy }        a connector between two slabs; its length follows the gap between the slabs
//   circle  { x, y, r }          a grid bubble
//   text    { x, y, s, anchor }  a label; `rot` rotates it about its centre, `bg` puts paper behind it
//   g       { children, ax, ay } a group that arrives from (ax, ay) px away
// Layers: ground (the site), slabs[0..3] (they lift: Experience, Services, API, Data), top (frame, dimensions).
//
// Sizes: 'lg' and 'md' are the pinned desktop drawing, 'sm' the stacked one. Text is always drawn at a size
// that stays 11 px or more once the drawing is fitted to its column, so the smaller sizes use a smaller K (world
// unit in px) and leave out the labels that would not fit (`nc`, "not compact"). The stacked version crops the
// view box to what each stage shows (`viewBoxes`).

import { iso } from '../model/project.js'
import { SLAB } from '../model/layers.js'
import { copy } from './copy.js'
import { process as processContent } from '../content.js'

export const STAGE_COUNT = 6
/** Gap between slabs, per stage, in world units: flat, tight stack, open, open, locked, locked. */
export const GAPS = [0, 0.16, 2.3, 2.3, 0.85, 0.85]
export const GAP_OPEN = 2.3
export const SLAB_COUNT = 4
export const SIZES = {
  lg: { K: 30, fs: 12.5, compact: false },
  md: { K: 19, fs: 13, compact: true },
  sm: { K: 14, fs: 14, compact: true, callouts: true },
}
const MIN_WIDTH = { lg: 0, md: 0, sm: 340 }

const HW = SLAB.w / 2
const HD = SLAB.d / 2
const COLS = [-3, 0, 3] // structural grid A, B, C
const ROWS = [-1.5, 1.5] // structural grid 1, 2
const NH = 0.75 // half the side of a node
const SITE = { x0: -6, x1: 11, z0: -4.5, z1: 4.5 }
const BAY = { x: HW, w: 3.6, col: 6.5 }
const FRAME = { x0: -5.6, x1: 5.6, z0: -4.1, z1: 4.1, y0: -0.35, y1: 3 * GAPS[4] + 0.85, xBay: 5.6 + BAY.w }
const EXT = { xs: [-4.5, -1.5, 1.5, 4.5], z: 7.0, w: 1.8, d: 1.4, h: 0.5 }
const PLATE_T = 0.14 // slab thickness

const SLABS = [
  {
    id: 'experience',
    nodeH: 0.22,
    boxes: [
      { cx: 0, cz: -2.9, w: 8.4, d: 0.7, h: 0.1 },
      ...COLS.map((x) => ({ cx: x, cz: 2.85, w: 2.2, d: 0.7, h: 0.1 })),
    ],
    lines: [],
  },
  {
    id: 'services',
    nodeH: 0.5,
    boxes: [],
    lines: [
      [[-4.4, 0], [4.4, 0]],
      ...COLS.flatMap((x) => ROWS.map((z) => [[x, z - Math.sign(z) * NH], [x, 0]])),
    ],
  },
  {
    id: 'api',
    nodeH: 0.2,
    boxes: [{ cx: 0, cz: 0, w: 9.2, d: 0.9, h: 0.3 }],
    lines: COLS.flatMap((x) => ROWS.map((z) => [[x, z - Math.sign(z) * NH], [x, Math.sign(z) * 0.45]])),
  },
  {
    id: 'data',
    nodeH: 0.4,
    boxes: [-1.5, 1.5].flatMap((x) => [-2.9, 2.9].map((z) => ({ cx: x, cz: z, w: 2.2, d: 0.6, h: 0.12 }))),
    lines: [],
  },
]

const f1 = (n) => Math.round(n * 10) / 10
const textWidth = (s, fs) => s.length * fs * 0.68

/** All the numbers of an M/L path as [x, y] pairs. */
function pathPoints(d) {
  const n = d.match(/-?\d+(?:\.\d+)?/g) || []
  const out = []
  for (let i = 0; i + 1 < n.length; i += 2) out.push([Number(n[i]), Number(n[i + 1])])
  return out
}

const visibleAt = (it, s) => it.from <= s && (it.until == null || s <= it.until || (it.rest ?? 0) > 0)

export function buildScene(size = 'lg') {
  const { K, fs, compact, callouts } = SIZES[size]
  const P = (x, y, z) => iso(x, y, z, K)
  const M = (p) => `M${f1(p[0])} ${f1(p[1])}`
  const L = (p) => `L${f1(p[0])} ${f1(p[1])}`
  const seg = (a, b) => `${M(a)}${L(b)}`
  const ring = (pts, close = true) => pts.map((p, i) => (i ? L(p) : M(p))).join('') + (close ? 'Z' : '')
  const rect = (cx, cz, w, d, y = 0) => [
    P(cx - w / 2, y, cz - d / 2), // back
    P(cx + w / 2, y, cz - d / 2), // right
    P(cx + w / 2, y, cz + d / 2), // front
    P(cx - w / 2, y, cz + d / 2), // left
  ]
  const sq = (p, s) => ring([[p[0] - s, p[1] - s], [p[0] + s, p[1] - s], [p[0] + s, p[1] + s], [p[0] - s, p[1] + s]])
  const vseg = (b, dy) => seg(b, [b[0], b[1] + dy])
  const wp = P

  const ground = []
  const slabs = Array.from({ length: SLAB_COUNT }, () => [])
  const top = []

  // `nc`: leave this out of the compact sizes.
  const path = (list, d, o = {}) => {
    if (o.nc && compact) return
    list.push({ t: 'path', d, c: o.c ?? 'ln', draw: o.draw ?? true, from: o.from ?? 0, until: o.until, rest: o.rest, alpha: o.alpha, delay: o.delay ?? 0 })
  }
  const text = (list, x, y, s, o = {}) => {
    if (o.nc && compact) return
    const lines = o.lines ?? [s]
    list.push({
      t: 'text', x: f1(x), y: f1(y), s: lines[0], lines, anchor: o.anchor ?? 'start', c: o.c ?? 'lbl', rot: o.rot ?? 0,
      bg: o.bg ?? false, w: o.w ?? (o.bg ? f1(Math.max(...lines.map((l) => textWidth(l, fs))) + 10) : undefined), from: o.from ?? 0, until: o.until, rest: o.rest, delay: o.delay ?? 0,
    })
  }
  const split = (s) => (compact && s.includes(': ') ? s.split(': ').map((p, i, a) => (i < a.length - 1 ? `${p}:` : p)) : [s])
  const GROUND_REST = compact ? 0 : 0.55

  /** A dimension: extension lines (optional), the yellow line, end ticks and its label, between A2 and B2. */
  const drawDim = (list, { A, B, A2, B2, label, stage, until = stage, rest = 0, delay = 0, ext = true, side = 1, labelAt = 0.5, marks = [] }) => {
    const len = Math.hypot(B2[0] - A2[0], B2[1] - A2[1])
    const ux = (B2[0] - A2[0]) / len
    const uy = (B2[1] - A2[1]) / len
    const nx = -uy
    const ny = ux
    const extend = (P0, P1) => {
      const ox = P1[0] - P0[0]
      const oy = P1[1] - P0[1]
      const l = Math.hypot(ox, oy) || 1
      return seg([P0[0] + (ox / l) * 4, P0[1] + (oy / l) * 4], [P1[0] + (ox / l) * 7, P1[1] + (oy / l) * 7])
    }
    if (ext) path(list, `${extend(A, A2)}${extend(B, B2)}`, { c: 'hair', from: stage, until, rest, delay })
    path(list, seg(A2, B2), { c: 'sig', from: stage, until, rest, delay: delay + 250 })
    const tk = 6
    const tick = (p) => seg([p[0] - nx * tk, p[1] - ny * tk], [p[0] + nx * tk, p[1] + ny * tk])
    path(list, [A2, B2, ...marks].map(tick).join(''), {
      c: 'tick', draw: false, from: stage, until, rest, delay: delay + 700,
    })
    if (label) {
      let ang = (Math.atan2(uy, ux) * 180) / Math.PI
      if (ang > 90) ang -= 180
      if (ang <= -90) ang += 180
      const w = textWidth(label, fs) + 14
      const fits = w <= len - 6
      const off = fits ? 0 : side * (fs + 6)
      text(list, A2[0] + (B2[0] - A2[0]) * labelAt + nx * off, A2[1] + (B2[1] - A2[1]) * labelAt + ny * off, label, {
        anchor: 'middle', c: 'dim', rot: f1(ang), bg: fits, w: f1(w), from: stage, until, rest, delay: delay + 800,
      })
    }
  }
  const dims = []
  const S = processContent.stages
  const dimWorld = (key, stage, a, b, off, o = {}) => {
    const A2 = wp(a[0] + off[0], a[1] + off[1], a[2] + off[2])
    const B2 = wp(b[0] + off[0], b[1] + off[1], b[2] + off[2])
    drawDim(o.list ?? top, { A: wp(...a), B: wp(...b), A2, B2, label: S[stage].dim, stage, delay: o.delay ?? 0 })
    dims.push({ key, stage, label: S[stage].dim })
  }

  // ---------------------------------------------------------------- stage 0: the site
  // Ground grid: one hairline per world unit, plotted line by line.
  let gi = 0
  for (let x = SITE.x0; x <= SITE.x1; x++) {
    path(ground, seg(wp(x, 0, SITE.z0), wp(x, 0, SITE.z1)), { c: 'rule', from: 0, until: 1, rest: GROUND_REST, delay: 60 + gi++ * 22 })
  }
  for (let z = SITE.z0; z <= SITE.z1; z++) {
    path(ground, seg(wp(SITE.x0, 0, z), wp(SITE.x1, 0, z)), { c: 'rule', from: 0, until: 1, rest: GROUND_REST, delay: 60 + gi++ * 22 })
  }
  // Site boundary and survey marks at its corners.
  const corners = [[SITE.x0, SITE.z0], [SITE.x1, SITE.z0], [SITE.x1, SITE.z1], [SITE.x0, SITE.z1]]
  path(ground, ring(corners.map(([x, z]) => wp(x, 0, z))), { c: 'dash', draw: false, from: 0, until: 1, rest: GROUND_REST, delay: 500 })
  for (const [x, z] of corners) {
    const r = 0.22
    const e = Array.from({ length: 21 }, (_, k) => {
      const a = (k / 20) * Math.PI * 2
      return wp(x + Math.cos(a) * r, 0, z + Math.sin(a) * r)
    })
    path(ground, `${ring(e, false)}${seg(wp(x - 0.55, 0, z), wp(x + 0.55, 0, z))}${seg(wp(x, 0, z - 0.55), wp(x, 0, z + 0.55))}`, {
      c: 'hair', from: 0, until: 1, rest: 0, delay: 700,
    })
  }
  // Structural grid: axes through the six node centres, bubbles A B C (back) and 1 2 (left).
  const bubble = (x, y, label, delay) => {
    ground.push({ t: 'circle', x: f1(x), y: f1(y), r: compact ? 12 : 11, from: 0, until: 1, rest: 0, delay })
    text(ground, x, y + fs * 0.36, label, { anchor: 'middle', from: 0, until: 1, rest: 0, delay: delay + 100 })
  }
  COLS.forEach((x, i) => {
    path(ground, seg(wp(x, 0, -5.4), wp(x, 0, SITE.z1)), { c: 'axis', from: 0, until: 1, rest: 0, delay: 500 + i * 120 })
    const [bx, by] = wp(x, 0, -5.4)
    bubble(bx, by, copy.axes.columns[i], 700 + i * 120)
  })
  ROWS.forEach((z, i) => {
    path(ground, seg(wp(-6.9, 0, z), wp(SITE.x1, 0, z)), { c: 'axis', from: 0, until: 1, rest: 0, delay: 500 + i * 120 })
    const [bx, by] = wp(-6.9, 0, z)
    bubble(bx, by, copy.axes.rows[i], 700 + i * 120)
  })
  // North arrow, lying on the ground and pointing along -z.
  {
    const base = wp(-9, 0, -3)
    const tip = wp(-9, 0, -5.6)
    path(ground, `${seg(base, tip)}${seg(wp(-9.35, 0, -4.8), tip)}${seg(wp(-8.65, 0, -4.8), tip)}`, { c: 'ln', from: 0, until: 1, rest: 0, delay: 900 })
    text(ground, tip[0] + 8, tip[1] - 8, copy.north, { from: 0, until: 1, rest: 0, delay: 1100 })
  }

  // ---------------------------------------------------------------- the six nodes (they live on the Data slab, at the ground)
  const nodes = ROWS.flatMap((z) => COLS.map((x) => [x, z]))
  const data = slabs[SLAB_COUNT - 1]

  // ---------------------------------------------------------------- slabs
  const labelY = (p) => p[1] + fs * 0.34
  SLABS.forEach((spec, i) => {
    const list = slabs[i]
    const n = SLAB_COUNT - 1 - i
    const plan = [wp(-HW, 0, -HD), wp(HW, 0, -HD), wp(HW, 0, HD), wp(-HW, 0, HD)]
    const tPx = PLATE_T * K

    // Pillars: a connector from each node down to the slab below. Its length follows the gap.
    if (i < SLAB_COUNT - 1) {
      for (const [x, z] of [...nodes, [BAY.col, ROWS[0]], [BAY.col, ROWS[1]]]) {
        const p = wp(x, 0, z)
        const late = x === BAY.col
        list.push({ t: 'pillar', d: vseg(p, GAP_OPEN * K), ox: f1(p[0]), oy: f1(p[1]), from: late ? 5 : 2, delay: late ? 700 : 600 })
      }
    }
    // Tracing paper: the plate fill, its edge and its outline.
    list.push({ t: 'path', d: ring(plan), c: 'plate', draw: false, from: 2, delay: 350 })
    {
      const [l, b, r] = [plan[3], plan[2], plan[1]]
      const dn = (p) => [p[0], p[1] + tPx]
      list.push({
        t: 'path', d: `${M(l)}${L(b)}${L(r)}${L(dn(r))}${L(dn(b))}${L(dn(l))}Z${seg(b, dn(b))}`, c: 'edge', draw: false, from: 2, delay: 350,
      })
    }
    path(list, ring(plan), { from: 1, delay: 250 + n * 120 })

    // Scale: the plate continues to the right. The shared edge is already drawn.
    {
      const bay = [wp(BAY.x, 0, -HD), wp(BAY.x + BAY.w, 0, -HD), wp(BAY.x + BAY.w, 0, HD), wp(BAY.x, 0, HD)]
      const [b0, b1, b2, b3] = bay
      list.push({ t: 'path', d: ring(bay), c: 'plate', draw: false, from: 5, delay: 100 + n * 90 })
      list.push({
        t: 'path', d: `${M(b3)}${L(b2)}${L(b1)}${L([b1[0], b1[1] + tPx])}${L([b2[0], b2[1] + tPx])}${L([b3[0], b3[1] + tPx])}Z${seg(b2, [b2[0], b2[1] + tPx])}`,
        c: 'edge', draw: false, from: 5, delay: 100 + n * 90,
      })
      path(list, `${M(b0)}${L(b1)}${L(b2)}${L(b3)}`, { from: 5, delay: n * 90 })
    }

    // The ground network between the six nodes (the Data slab sits on the ground): Architect.
    if (i === SLAB_COUNT - 1) {
      let k = 0
      for (const z of ROWS) for (let c = 0; c < COLS.length - 1; c++) {
        path(list, seg(wp(COLS[c] + NH, 0, z), wp(COLS[c + 1] - NH, 0, z)), { from: 1, delay: 500 + k++ * 90 })
      }
      for (const x of COLS) path(list, seg(wp(x, 0, ROWS[0] + NH), wp(x, 0, ROWS[1] - NH)), { from: 1, delay: 500 + k++ * 90 })
    }

    // Wiring on the slab (flat lines).
    spec.lines.forEach(([a, b], k) => {
      path(list, seg(wp(a[0], 0, a[1]), wp(b[0], 0, b[1])), { c: 'hair', from: 2, delay: 900 + k * 40 })
    })

    // Boxes, nearest drawn last.
    const boxes = [
      ...nodes.map(([x, z]) => ({ cx: x, cz: z, w: 2 * NH, d: 2 * NH, h: spec.nodeH, node: true })),
      ...ROWS.map((z) => ({ cx: BAY.col, cz: z, w: 2 * NH, d: 2 * NH, h: spec.nodeH, late: true })),
      ...spec.boxes,
    ].sort((a, b) => a.cx + a.cz - (b.cx + b.cz))
    boxes.forEach((bx, k) => {
      const isData = i === SLAB_COUNT - 1
      const fromBase = bx.late ? 5 : bx.node && isData ? 1 : 2
      const fromExt = bx.late ? 5 : 2
      const delay = bx.late ? 450 : bx.node && isData ? 250 : 750 + (k % 6) * 60
      const base = rect(bx.cx, bx.cz, bx.w, bx.d)
      const hp = bx.h * K
      if (bx.node && isData) {
        // Discover: the node is an empty dashed square.
        path(list, ring(base), { c: 'dash', draw: false, from: 0, until: 0, delay: 650 })
      }
      path(list, ring(base), { from: fromBase, delay })
      for (const v of [3, 2, 1]) {
        const b = base[v]
        list.push({ t: 'grow', d: vseg(b, -hp), ox: f1(b[0]), oy: f1(b[1]), from: fromExt, delay: delay + 250 })
      }
      list.push({ t: 'rise', d: ring(base), h: f1(hp), c: 'face', from: fromExt, delay: delay + 250 })
      // Scale: a yellow marker on each new module.
      if (bx.late) list.push({ t: 'rise', d: sq(wp(bx.cx, 0, bx.cz), 3), h: f1(hp), c: 'mark', from: 5, delay: delay + 500 })
    })

    // Scale: the new column is joined to the old one.
    for (const z of ROWS) {
      path(list, seg(wp(COLS[2] + NH, 0, z), wp(BAY.col - NH, 0, z)), { from: 5, delay: 800 })
    }

    // Layer labels (Engineer): a leader to the left of each slab's left corner.
    {
      const l = plan[3]
      path(list, seg([l[0] - 4, l[1]], [l[0] - 20, l[1]]), { c: 'hair', from: 2, until: 2, rest: 0, delay: 1300 })
      text(list, l[0] - 26, labelY(l), copy.layers[i], { anchor: 'end', bg: true, from: 2, until: 2, rest: 0, delay: 1350 })
    }
    // The API tag (Integrate): a leader to the right of the right corner.
    if (spec.id === 'api') {
      const r = plan[1]
      path(list, seg([r[0] + 4, r[1]], [r[0] + 20, r[1]]), { c: 'hair', from: 3, until: 3, rest: 0, delay: 1300, nc: true })
      text(list, r[0] + 26, labelY(r), copy.api, { from: 3, until: 3, rest: 0, delay: 1350, nc: true })

      // Integrate: external systems arrive from outside, in a row in front of the structure, and join the
      // gateway with yellow connectors.
      const kids = []
      const blocks = EXT.xs.map((x) => rect(x, EXT.z, EXT.w, EXT.d))
      blocks.forEach((base, k) => {
        const hp = EXT.h * K
        path(kids, ring(base), { from: 3, delay: k * 90 })
        for (const v of [3, 2, 1]) {
          const b = base[v]
          kids.push({ t: 'grow', d: vseg(b, -hp), ox: f1(b[0]), oy: f1(b[1]), from: 3, delay: 300 + k * 90 })
        }
        kids.push({ t: 'rise', d: ring(base), h: f1(hp), c: 'face', from: 3, delay: 300 + k * 90 })
      })
      list.push({ t: 'g', children: kids, ax: f1(-1.2 * 0.866 * K), ay: f1(0.6 * K), from: 3, delay: 0 })

      const zf = EXT.z - EXT.d / 2
      for (const x of EXT.xs) path(list, seg(wp(x, 0, 0.45), wp(x, 0, zf)), { c: 'sig', from: 3, delay: 900 })
      // End bars where each connector meets a block or the gateway.
      const bar = (x, z) => path(list, seg(wp(x - 0.3, 0, z), wp(x + 0.3, 0, z)), { c: 'tick', draw: false, from: 3, delay: 1500 })
      for (const x of EXT.xs) {
        bar(x, zf)
        bar(x, 0.45)
      }

      if (callouts) {
        // Stacked drawing: the names sit in a column to the left, each on a leader from its block. The
        // "Interfaces" dimension is the caption under the drawing.
        const lefts = blocks.map((b) => b[3])
        const maxW = Math.max(...copy.externals.map((n) => textWidth(n, fs)))
        const textX = Math.min(...lefts.map((p) => p[0])) - 20 - maxW
        lefts.forEach((p, k) => {
          path(list, seg([p[0] - 5, p[1]], [textX - 4, p[1]]), { c: 'hair', from: 3, until: 3, rest: 0, delay: 1400 + k * 80 })
          text(list, textX, p[1] - 5, copy.externals[k], { from: 3, until: 3, rest: 0, delay: 1500 + k * 80 })
        })
        dims.push({ key: 'interfaces', stage: 3, label: S[3].dim })
      } else {
        // Names hang below-left of each block's front corner, which is clear of the next block.
        blocks.forEach((base, k) => {
          text(list, base[2][0] + 3, base[2][1] + fs + 7, copy.externals[k], { anchor: 'end', from: 3, until: 3, rest: 0, delay: 1500 + k * 80 })
        })
        // The dimension runs under the row, measured from the outer faces of the first and last block.
        const zFront = EXT.z + EXT.d / 2
        // far enough below the names, whatever the scale: 0.866 K px per unit of z across the row
        const dimDrop = Math.max(3.1, (0.5 * Math.max(...copy.externals.map((n) => textWidth(n, fs))) + 0.866 * (fs + 11) + 14) / (0.866 * K))
        const xa = EXT.xs[0] - EXT.w / 2
        const xb = EXT.xs[3] + EXT.w / 2
        drawDim(list, {
          A: wp(xa, 0, zFront), B: wp(xb, 0, zFront), A2: wp(xa, 0, zFront + dimDrop), B2: wp(xb, 0, zFront + dimDrop), label: S[3].dim, stage: 3, delay: 1700,
        })
        dims.push({ key: 'interfaces', stage: 3, label: S[3].dim })
      }
    }
    // Scale: a label on the new bay, on the top slab.
    if (i === 0) {
      const r = wp(BAY.x + BAY.w, 0, -HD)
      path(list, seg([r[0] + 4, r[1]], [r[0] + 56, r[1]]), { c: 'hair', from: 5, delay: 1700, nc: true })
      text(list, r[0] + 62, labelY(r), copy.newModules, { from: 5, delay: 1750, nc: true })
    }
  })

  // The Discover survey stakes and the Architect markers sit on the node centres (Data slab).
  nodes.forEach(([x, z], k) => {
    const c = wp(x, 0, z)
    path(data, `${seg([c[0] - 4, c[1]], [c[0] + 4, c[1]])}${seg([c[0], c[1] - 4], [c[0], c[1] + 4])}`, { c: 'hair', draw: false, from: 0, until: 0, delay: 800 + k * 40 })
    data.push({ t: 'path', d: sq(c, 3), c: 'mark', draw: false, from: 1, until: 1, rest: 0, delay: 700 + k * 80 })
  })

  // The note that explains the line types: a leader up from a node, then one sentence.
  {
    const n = wp(-NH, 0, -1.5 - NH)
    const tipY = n[1] - 5.4 * K
    path(top, seg(n, [n[0], tipY]), { c: 'hair', from: 0, until: 1, rest: 0, delay: 1400 })
    const note = (s, from, delay) => text(top, n[0] + 8, tipY + fs * 0.34, s, { lines: split(s), from, until: from, rest: 0, delay })
    note(copy.note.open, 0, 1600)
    note(copy.note.fixed, 1, 900)
  }

  // ---------------------------------------------------------------- dimension lines (yellow), one per stage
  dimWorld('site', 0, [SITE.x0, 0, SITE.z1], [SITE.x1, 0, SITE.z1], [0, 0, 1.4], { delay: 1000 })
  dimWorld('structure', 1, [-HW, 0, HD], [HW, 0, HD], [0, 0, 1.3], { delay: 1000 })
  dimWorld('depth', 2, [HW, 0, -HD], [HW, 3 * GAP_OPEN, -HD], [1.4, 0, -1.4], { delay: 1500 })
  // (stage 3, "Interfaces", is drawn with the external systems above)
  dimWorld('envelope', 4, [FRAME.x1, FRAME.y0, FRAME.z0], [FRAME.x1, FRAME.y1, FRAME.z0], [1.1, 0, -1.1], { delay: 1600 })
  // Extension: the dimension of the structure runs on to the new bay, with a tick where the old one ended.
  {
    const zOff = FRAME.z1 + 1.8
    const xm = (FRAME.x1 + FRAME.xBay) / 2
    const lenAll = FRAME.xBay - FRAME.x0
    drawDim(top, {
      A: wp(FRAME.x0, FRAME.y0, FRAME.z1), B: wp(FRAME.xBay, FRAME.y0, FRAME.z1),
      A2: wp(FRAME.x0, FRAME.y0, zOff), B2: wp(FRAME.xBay, FRAME.y0, zOff),
      label: S[5].dim, stage: 5, delay: 1500, labelAt: (xm - FRAME.x0) / lenAll, marks: [wp(FRAME.x1, FRAME.y0, zOff)],
    })
    dims.push({ key: 'extension', stage: 5, label: S[5].dim })
  }
  dims.sort((a, b) => a.stage - b.stage)

  // ---------------------------------------------------------------- Deploy: the frame closes, the slabs lock
  {
    const { x0, x1, z0, z1, y0, y1, xBay } = FRAME
    const c = wp
    let k = 0
    const edge = (a, b, o = {}) => path(top, seg(c(...a), c(...b)), { c: 'frame', from: 4, delay: 650 + k++ * 70, ...o })
    // bottom and top rings, then the four posts
    // the three edges at the back are hidden lines: drawn lighter
    const hidden = { alpha: 0.38 }
    edge([x0, y0, z0], [x1, y0, z0], hidden)
    edge([x0, y0, z1], [x0, y0, z0], hidden)
    edge([x0, y1, z0], [x1, y1, z0])
    edge([x0, y1, z1], [x0, y1, z0])
    edge([x0, y0, z1], [x1, y0, z1])
    edge([x0, y1, z1], [x1, y1, z1])
    edge([x0, y0, z0], [x0, y1, z0], hidden)
    edge([x0, y0, z1], [x0, y1, z1])
    // the right face becomes a partition when the bay is added
    const part = { until: 4, rest: 0.4 }
    edge([x1, y0, z0], [x1, y0, z1], part)
    edge([x1, y1, z0], [x1, y1, z1], part)
    edge([x1, y0, z0], [x1, y1, z0], part)
    edge([x1, y0, z1], [x1, y1, z1], part)
    // Scale: the frame continues
    k = 0
    const ext = (a, b) => path(top, seg(c(...a), c(...b)), { c: 'frame', from: 5, delay: 500 + k++ * 70 })
    ext([x1, y0, z0], [xBay, y0, z0])
    ext([x1, y0, z1], [xBay, y0, z1])
    ext([x1, y1, z0], [xBay, y1, z0])
    ext([x1, y1, z1], [xBay, y1, z1])
    ext([xBay, y0, z0], [xBay, y0, z1])
    ext([xBay, y1, z0], [xBay, y1, z1])
    ext([xBay, y0, z0], [xBay, y1, z0])
    ext([xBay, y0, z1], [xBay, y1, z1])

    // Locks: a pin from each slab corner to the frame post, at the closed height.
    for (let i = 0; i < SLAB_COUNT; i++) {
      const n = SLAB_COUNT - 1 - i
      const y = n * GAPS[4]
      const left = [c(-HW, y, HD), c(x0, y, z1)]
      const right = [c(HW, y, -HD), c(x1, y, z0)]
      for (const [a, b, side] of [[...left, 'l'], [...right, 'r']]) {
        const keep = side === 'r' ? { until: 4, rest: 0.3 } : {}
        path(top, seg(a, b), { c: 'sig', from: 4, delay: 1300 + i * 110, ...keep })
        top.push({ t: 'path', d: sq(b, 3.5), c: 'mark', draw: false, from: 4, delay: 1450 + i * 110, ...keep })
      }
    }
    // The interfaces pass through the envelope: a port where each connector crosses the frame.
    for (const x of EXT.xs) {
      const p = c(x, GAPS[4], z1)
      top.push({ t: 'path', d: sq(p, 4), c: 'mark', draw: false, from: 4, delay: 1700 })
    }
    // "Locked", off the left post at the top slab.
    const lp = c(x0, 3 * GAPS[4], z1)
    path(top, seg([lp[0] - 5, lp[1]], [lp[0] - 17, lp[1]]), { c: 'hair', from: 4, delay: 1800 })
    text(top, lp[0] - 22, lp[1] + fs * 0.34, copy.locked, { anchor: 'end', from: 4, delay: 1850 })
  }

  // ---------------------------------------------------------------- bounds, per stage
  const boundsAt = (s) => {
    const bb = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity }
    const grow = (x, y) => {
      if (x < bb.x0) bb.x0 = x
      if (x > bb.x1) bb.x1 = x
      if (y < bb.y0) bb.y0 = y
      if (y > bb.y1) bb.y1 = y
    }
    const visit = (it, lift) => {
      if (!visibleAt(it, s)) return
      if (it.t === 'g') return it.children.forEach((c) => visit(c, lift))
      if (it.t === 'pillar') return undefined
      if (it.t === 'circle') {
        grow(it.x - it.r, it.y - it.r - lift)
        grow(it.x + it.r, it.y + it.r - lift)
        return undefined
      }
      if (it.t === 'text') {
        const w = Math.max(...it.lines.map((l) => textWidth(l, fs)))
        const h = fs * 1.25 * it.lines.length
        if (it.rot) {
          const a = (it.rot * Math.PI) / 180
          const hx = (Math.abs(Math.cos(a)) * w + Math.abs(Math.sin(a)) * h) / 2 + 2
          const hy = (Math.abs(Math.sin(a)) * w + Math.abs(Math.cos(a)) * h) / 2 + 2
          grow(it.x - hx, it.y - hy - lift)
          grow(it.x + hx, it.y + hy - lift)
          return undefined
        }
        const x0 = it.anchor === 'end' ? it.x - w : it.anchor === 'middle' ? it.x - w / 2 : it.x
        grow(x0, it.y - fs - lift)
        grow(x0 + w, it.y + h - fs + 4 - lift)
        return undefined
      }
      for (const [x, y] of pathPoints(it.d)) {
        grow(x, y - lift)
        if (it.t === 'rise') grow(x, y - it.h - lift)
      }
      return undefined
    }
    ground.forEach((it) => visit(it, 0))
    slabs.forEach((list, i) => list.forEach((it) => visit(it, (SLAB_COUNT - 1 - i) * GAPS[s] * K)))
    top.forEach((it) => visit(it, 0))
    return bb
  }
  const pad = 14
  const toBox = (b, minW = 0) => {
    let x = b.x0 - pad
    let w = b.x1 - b.x0 + 2 * pad
    if (w < minW) {
      x -= (minW - w) / 2
      w = minW
    }
    return { x: Math.floor(x), y: Math.floor(b.y0 - pad), w: Math.ceil(w), h: Math.ceil(b.y1 - b.y0 + 2 * pad) }
  }
  const raw = Array.from({ length: STAGE_COUNT }, (_, s) => boundsAt(s))
  const union = raw.reduce((u, b) => ({ x0: Math.min(u.x0, b.x0), y0: Math.min(u.y0, b.y0), x1: Math.max(u.x1, b.x1), y1: Math.max(u.y1, b.y1) }), {
    x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity,
  })
  return {
    size, K, fs, compact,
    viewBox: toBox(union),
    viewBoxes: raw.map((b) => toBox(b, MIN_WIDTH[size])),
    ground, slabs, top, dims,
  }
}

const cache = new Map()
export function getScene(size = 'lg') {
  if (!cache.has(size)) cache.set(size, buildScene(size))
  return cache.get(size)
}

/** Every item of a scene, flattened (children of groups included). */
export function allItems(scene) {
  const out = []
  const walk = (it) => {
    out.push(it)
    if (it.t === 'g') it.children.forEach(walk)
  }
  scene.ground.forEach(walk)
  scene.slabs.forEach((l) => l.forEach(walk))
  scene.top.forEach(walk)
  return out
}
