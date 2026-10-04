// Canvas 2D renderer for the arm-on-the-hex-board stage. Everything is a hairline: no gradients, no glow.
// Solid navy fills exist only to hide what is behind a prism (painter's algorithm). Yellow is the token,
// the human bracket and nothing else. `drawFrame` reads a pose from plan.js / journeyPlan.js and a
// projection from iso.js; it keeps no state.
import { edgeKey } from '../../../workflow/run.js'
import { SQ3, hexCorners } from './hexboard.js'
import { LINK_Z, SLAB } from './plan.js'

const rgba = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`

export function readColors(el) {
  const cs = getComputedStyle(el)
  const get = (n) => cs.getPropertyValue(`--x-${n}`).trim().split(/\s+/).map(Number)
  const ink = get('ink')
  const signal = get('signal')
  return {
    bg: get('bg'), bg2: get('bg2'), line: get('line'), faint: get('faint'), mute: get('mute'), text: get('text'),
    signal, ink, shade: signal.map((v, i) => Math.round(v * 0.62 + ink[i] * 0.38)), // flat darker yellow for token sides
  }
}

const R_HEX = 0.93 // footprint radius: leaves a thin gap between neighbouring hexes
const hexFoot = (x, y, r = R_HEX) => hexCorners(x, y, r)

function barFoot(a, b, w) {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len = Math.hypot(dx, dy) || 1
  const ux = dx / len
  const uy = dy / len
  const nx = -uy * w
  const ny = ux * w
  const ax = a.x - ux * w
  const ay = a.y - uy * w
  const bx = b.x + ux * w
  const by = b.y + uy * w
  return [{ x: ax + nx, y: ay + ny }, { x: bx + nx, y: by + ny }, { x: bx - nx, y: by - ny }, { x: ax - nx, y: ay - ny }]
}

const signedArea = (pts) => {
  let s = 0
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i]
    const q = pts[(i + 1) % pts.length]
    s += p.x * q.y - q.x * p.y
  }
  return s
}

function path(ctx, pts) {
  ctx.beginPath()
  pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)))
  ctx.closePath()
}

// Parallel lines clipped to a screen polygon. `from` / `to` sweep along the normal (0..1) so a bay can
// hatch in progressively.
function hatch(ctx, pts, { angle = 45, gap = 5, color, alpha = 1, width = 1, from = 0, to = 1 }) {
  if (to <= from) return
  ctx.save()
  path(ctx, pts)
  ctx.clip()
  let cx = 0
  let cy = 0
  for (const p of pts) {
    cx += p.x
    cy += p.y
  }
  cx /= pts.length
  cy /= pts.length
  let r = 0
  for (const p of pts) r = Math.max(r, Math.hypot(p.x - cx, p.y - cy))
  const a = (angle * Math.PI) / 180
  const dx = Math.cos(a)
  const dy = Math.sin(a)
  ctx.strokeStyle = rgba(color, alpha)
  ctx.lineWidth = width
  ctx.setLineDash([])
  ctx.beginPath()
  for (let off = -r; off <= r; off += gap) {
    const f = (off + r) / (2 * r)
    if (f < from || f > to) continue
    ctx.moveTo(cx - dy * off - dx * r, cy + dx * off - dy * r)
    ctx.lineTo(cx - dy * off + dx * r, cy + dx * off + dy * r)
  }
  ctx.stroke()
  ctx.restore()
}

// An extruded polygon: visible side faces (hatched on the shaded side), then the flat top.
function prism(ctx, proj, foot, z0, z1, st) {
  const area = signedArea(foot)
  const n = foot.length
  const bot = foot.map((p) => proj.project(p.x, p.y, z0))
  const top = foot.map((p) => proj.project(p.x, p.y, z1))
  ctx.save()
  ctx.globalAlpha = st.alpha ?? 1
  ctx.lineJoin = 'round'
  ctx.lineWidth = st.w ?? 1
  ctx.setLineDash(st.dash ?? [])
  const faces = []
  for (let k = 0; k < n; k++) {
    const p = foot[k]
    const q = foot[(k + 1) % n]
    const dx = q.x - p.x
    const dy = q.y - p.y
    const f = proj.facing(area > 0 ? dy : -dy, area > 0 ? -dx : dx)
    if (f.y > 0.001) faces.push({ k, f })
  }
  for (const { k, f } of faces) {
    const k2 = (k + 1) % n
    const quad = [bot[k], bot[k2], top[k2], top[k]]
    path(ctx, quad)
    ctx.fillStyle = rgba(st.side, 1)
    ctx.fill()
    if (st.hatchSides !== false && f.x > -0.2) hatch(ctx, quad, { angle: 90, gap: 4, color: st.hatchColor ?? st.edge, alpha: 0.4 })
    path(ctx, quad)
    ctx.strokeStyle = rgba(st.edge, st.edgeA ?? 1)
    ctx.stroke()
  }
  path(ctx, top)
  if (st.top) {
    ctx.fillStyle = rgba(st.top, 1)
    ctx.fill()
  }
  ctx.strokeStyle = rgba(st.edge, st.edgeA ?? 1)
  ctx.stroke()
  ctx.restore()
  return top
}

function ellipsePts(proj, x, y, z, r, steps = 28) {
  return Array.from({ length: steps }, (_, i) => {
    const a = (i / steps) * Math.PI * 2
    return proj.project(x + r * Math.cos(a), y + r * Math.sin(a), z)
  })
}

function line(ctx, pts, color, alpha, w = 1, dash = []) {
  ctx.save()
  ctx.beginPath()
  pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)))
  ctx.strokeStyle = rgba(color, alpha)
  ctx.lineWidth = w
  ctx.setLineDash(dash)
  ctx.stroke()
  ctx.restore()
}

// ---- stations ------------------------------------------------------------------------------------------------
function stationStyle(c, status) {
  const base = { side: c.bg, top: c.bg2, edge: c.faint, edgeA: 0.8, w: 1, hatchColor: c.faint }
  switch (status) {
    case 'off': return { ...base, top: c.bg, edgeA: 0.34, dash: [3, 3], alpha: 0.7, hatchSides: false }
    case 'future': return { ...base, edgeA: 0.62 }
    case 'active': return { ...base, edge: c.mute, edgeA: 0.95 }
    case 'working': return { ...base, edge: c.text, edgeA: 1, w: 1.7, hatchColor: c.text }
    case 'failing': return { ...base, edge: c.text, edgeA: 1, w: 1.7, dash: [4, 3], hatchColor: c.text }
    case 'waiting': return { ...base, edge: c.text, edgeA: 1, w: 1.7, hatchColor: c.text }
    default: return base
  }
}

function notchedFoot(x, y, r = R_HEX) {
  const pts = hexCorners(x, y, r)
  // pull the middle of the upper-right edge inward: reads as a notched hex
  const a = pts[0]
  const b = pts[1]
  const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
  const d = Math.hypot(mid.x - x, mid.y - y) || 1
  const inward = { x: mid.x - ((mid.x - x) / d) * 0.34, y: mid.y - ((mid.y - y) / d) * 0.34 }
  const along = { x: (b.x - a.x) * 0.14, y: (b.y - a.y) * 0.14 }
  return [pts[0], { x: mid.x - along.x, y: mid.y - along.y }, inward, { x: mid.x + along.x, y: mid.y + along.y }, ...pts.slice(1)]
}

function drawStation(ctx, f, st) {
  const { proj, c } = f
  const style = { ...stationStyle(c, st.status), ...(st.hover ? { edge: c.signal } : {}) }
  const foot = st.shape === 'notch' ? notchedFoot(st.x, st.y) : hexFoot(st.x, st.y)
  prism(ctx, proj, foot, 0, st.top, style)
  const dim = st.status === 'off' ? 0.5 : 1
  const z = st.top
  ctx.save()
  ctx.globalAlpha = dim
  const inner = (r, a = 0.6, col = c.faint, w = 1, dash = []) => {
    const ring = hexFoot(st.x, st.y, r).map((p) => proj.project(p.x, p.y, z))
    line(ctx, [...ring, ring[0]], col, a, w, dash)
  }
  const active = st.status === 'working' || st.status === 'waiting' || st.status === 'failing'
  switch (st.type) {
    case 'trigger': {
      inner(0.58, 0.8, active ? c.text : c.faint)
      const p0 = proj.project(st.x - 0.22, st.y, z)
      const p1 = proj.project(st.x + 0.22, st.y, z)
      const p2 = proj.project(st.x, st.y - 0.22, z)
      const p3 = proj.project(st.x, st.y + 0.22, z)
      line(ctx, [p0, p1], c.faint, 0.9)
      line(ctx, [p2, p3], c.faint, 0.9)
      break
    }
    case 'agent': {
      inner(0.62, active ? 0.95 : 0.55, active ? c.text : c.faint, active ? 1.4 : 1)
      hatch(ctx, hexFoot(st.x, st.y, 0.5).map((p) => proj.project(p.x, p.y, z)), { angle: -30, gap: 5, color: c.faint, alpha: active ? 0.55 : 0.28 })
      break
    }
    case 'router': {
      line(ctx, ellipsePts(proj, st.x, st.y, z, 0.66).concat([proj.project(st.x + 0.66, st.y, z)]), active ? c.text : c.faint, 0.9, 1)
      const a = st.angle ?? 0
      const tip = { x: st.x + Math.cos(a) * 0.62, y: st.y + Math.sin(a) * 0.62 }
      const tail = { x: st.x - Math.cos(a) * 0.3, y: st.y - Math.sin(a) * 0.3 }
      const wingL = { x: tip.x - Math.cos(a - 0.5) * 0.32, y: tip.y - Math.sin(a - 0.5) * 0.32 }
      const wingR = { x: tip.x - Math.cos(a + 0.5) * 0.32, y: tip.y - Math.sin(a + 0.5) * 0.32 }
      const P = (p) => proj.project(p.x, p.y, z)
      line(ctx, [P(tail), P(tip)], c.text, 1, 1.6)
      line(ctx, [P(wingL), P(tip), P(wingR)], c.text, 1, 1.6)
      break
    }
    case 'outcome': {
      inner(0.7, 0.7, st.reject ? c.mute : c.faint, 1, st.reject ? [3, 2] : [])
      const poly = hexFoot(st.x, st.y, 0.68).map((p) => proj.project(p.x, p.y, z))
      hatch(ctx, poly, { angle: st.reject ? 135 : 45, gap: 5, color: c.text, alpha: 0.75, to: st.fill ?? 0 })
      break
    }
    case 'resource':
    case 'skill': {
      inner(0.5, active ? 0.95 : 0.55, active ? c.text : c.faint, active ? 1.4 : 1, st.type === 'skill' ? [] : [])
      if (st.type === 'skill') {
        const P = (p) => proj.project(p.x, p.y, z)
        line(ctx, [P({ x: st.x - 0.16, y: st.y }), P({ x: st.x + 0.2, y: st.y })], c.faint, 0.9)
      }
      break
    }
    case 'compact': {
      inner(0.6, active ? 0.95 : 0.6, active ? c.text : c.faint)
      const P = (p) => proj.project(st.x + p.x, st.y + p.y, z)
      const col = active ? c.text : c.mute
      line(ctx, [P({ x: -0.5, y: 0 }), P({ x: -0.16, y: 0 })], col, 1, 1.4)
      line(ctx, [P({ x: -0.3, y: -0.14 }), P({ x: -0.16, y: 0 }), P({ x: -0.3, y: 0.14 })], col, 1, 1.4)
      line(ctx, [P({ x: 0.5, y: 0 }), P({ x: 0.16, y: 0 })], col, 1, 1.4)
      line(ctx, [P({ x: 0.3, y: -0.14 }), P({ x: 0.16, y: 0 }), P({ x: 0.3, y: 0.14 })], col, 1, 1.4)
      line(ctx, [P({ x: 0, y: -0.28 }), P({ x: 0, y: 0.28 })], col, 1, 1.4)
      break
    }
    case 'tray': {
      inner(0.74, 0.8, c.mute)
      inner(0.5, 0.5, c.faint, 1, [2, 3])
      break
    }
    default:
  }
  ctx.restore()
}

// Locked gate frame over the human hex: two posts and a crossbar that lifts on approve.
function drawGate(ctx, f, st, gate) {
  const { proj, c } = f
  const w = 0.82
  const zBar = st.top + 0.62 + gate.lift * 1.05
  const L = { x: st.x - w, y: st.y }
  const Rr = { x: st.x + w, y: st.y }
  const P = (p, z) => proj.project(p.x, p.y, z)
  const a = gate.lift > 0.02 ? 0.85 : 1
  for (const p of [L, Rr]) line(ctx, [P(p, st.top), P(p, st.top + 1.9)], c.text, a, 1.6)
  line(ctx, [P(L, zBar), P(Rr, zBar)], c.text, a, 2.2)
  // lock plate on the bar while locked
  if (gate.lift < 0.5) {
    const m = { x: st.x, y: st.y }
    const q = [P({ x: m.x - 0.12, y: m.y }, zBar - 0.1), P({ x: m.x + 0.12, y: m.y }, zBar - 0.1), P({ x: m.x + 0.12, y: m.y }, zBar - 0.34), P({ x: m.x - 0.12, y: m.y }, zBar - 0.34)]
    path(ctx, q)
    ctx.fillStyle = rgba(c.bg, 1)
    ctx.fill()
    ctx.strokeStyle = rgba(c.text, 1)
    ctx.lineWidth = 1.2
    ctx.stroke()
  }
}

// Static yellow bracket around a hex: six corner ticks, no pulse.
function drawBracket(ctx, f, st) {
  const { proj, c } = f
  const pts = hexCorners(st.x, st.y, 1.16)
  ctx.save()
  ctx.strokeStyle = rgba(c.signal, 1)
  ctx.lineWidth = 2.2
  ctx.lineCap = 'butt'
  ctx.beginPath()
  for (let k = 0; k < 6; k++) {
    const a = pts[k]
    const prev = pts[(k + 5) % 6]
    const next = pts[(k + 1) % 6]
    const to = (b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t })
    const p1 = proj.project(to(prev, 0.3).x, to(prev, 0.3).y, 0.02)
    const p0 = proj.project(a.x, a.y, 0.02)
    const p2 = proj.project(to(next, 0.3).x, to(next, 0.3).y, 0.02)
    ctx.moveTo(p1.x, p1.y)
    ctx.lineTo(p0.x, p0.y)
    ctx.lineTo(p2.x, p2.y)
  }
  ctx.stroke()
  ctx.restore()
}

// ---- tokens, stacks, arm -------------------------------------------------------------------------------------
function drawToken(ctx, f, t) {
  const { proj, c } = f
  const r = 0.4 * (t.scale ?? 1)
  if (r < 0.02) return
  if (t.kind === 'copy') {
    prism(ctx, proj, hexFoot(t.x, t.y, r), t.z, t.z + SLAB * t.scale, { side: c.bg, top: null, edge: c.signal, w: 1.4, alpha: t.alpha, hatchSides: false })
    return
  }
  prism(ctx, proj, hexFoot(t.x, t.y, r), t.z, t.z + SLAB, { side: c.shade, top: c.signal, edge: c.signal, w: 1, hatchColor: c.ink, alpha: t.alpha ?? 1 })
}

function drawStack(ctx, f, s) {
  const { proj, c } = f
  for (let k = 0; k < s.n; k++) {
    const z0 = s.base + k * SLAB * s.f
    const top = k === s.n - 1
    prism(ctx, proj, hexFoot(s.x, s.y, 0.52), z0, z0 + SLAB * s.f * 0.94, {
      side: c.bg, top: top ? c.bg2 : c.bg, edge: c.text, edgeA: top ? 1 : 0.8, w: 1, hatchColor: c.text,
    })
  }
}

function drawChip(ctx, f, chip) {
  const { proj, c } = f
  const pts = hexFoot(chip.x, chip.y, 0.34).map((p) => proj.project(p.x, p.y, chip.z))
  ctx.save()
  path(ctx, pts)
  ctx.strokeStyle = rgba(c.mute, 0.85)
  ctx.lineWidth = 1
  ctx.setLineDash([2, 2])
  ctx.stroke()
  ctx.restore()
}

function drawArmShadow(ctx, f, arm) {
  const { proj, c } = f
  const sh = (p, z) => ({ x: p.x + z * 0.42, y: p.y + z * 0.3 })
  const bars = [
    barFoot(sh(arm.base, LINK_Z.one), sh(arm.elbow, LINK_Z.one), 0.15),
    barFoot(sh(arm.elbow, LINK_Z.two), sh(arm.wrist, LINK_Z.two), 0.13),
  ]
  for (const bar of bars) {
    const pts = bar.map((p) => proj.project(p.x, p.y, 0))
    hatch(ctx, pts, { angle: 50, gap: 4, color: c.faint, alpha: 0.5 })
    path(ctx, pts)
    ctx.strokeStyle = rgba(c.faint, 0.22)
    ctx.lineWidth = 1
    ctx.stroke()
  }
  const g = sh(arm.wrist, arm.z)
  const pts = hexFoot(g.x, g.y, 0.4).map((p) => proj.project(p.x, p.y, 0))
  hatch(ctx, pts, { angle: 50, gap: 4, color: c.faint, alpha: 0.5 })
}

function drawArm(ctx, f, arm) {
  const { proj, c } = f
  const st = { side: c.bg, top: c.bg2, edge: c.text, edgeA: 0.95, w: 1, hatchColor: c.text }
  // base plinth and column
  prism(ctx, proj, hexFoot(arm.base.x, arm.base.y, 0.62), 0, 0.5, { ...st, edgeA: 0.8 })
  prism(ctx, proj, hexFoot(arm.base.x, arm.base.y, 0.2), 0.5, LINK_Z.one, { ...st, hatchSides: false })
  // link one, link two (different heights so they pass each other)
  prism(ctx, proj, barFoot(arm.base, arm.elbow, 0.15), LINK_Z.one - 0.1, LINK_Z.one + 0.12, st)
  prism(ctx, proj, hexFoot(arm.base.x, arm.base.y, 0.3), LINK_Z.one - 0.12, LINK_Z.one + 0.16, st)
  prism(ctx, proj, hexFoot(arm.elbow.x, arm.elbow.y, 0.26), LINK_Z.one - 0.1, LINK_Z.two + 0.1, st)
  prism(ctx, proj, barFoot(arm.elbow, arm.wrist, 0.13), LINK_Z.two - 0.1, LINK_Z.two + 0.12, st)
  prism(ctx, proj, hexFoot(arm.wrist.x, arm.wrist.y, 0.24), LINK_Z.two - 0.12, LINK_Z.two + 0.18, st)
  // shaft and jaws: the gripper lifts on its own column
  const zTop = LINK_Z.two - 0.1
  const P = (x, y, z) => proj.project(x, y, z)
  for (const off of [-0.055, 0.055]) line(ctx, [P(arm.wrist.x + off, arm.wrist.y, zTop), P(arm.wrist.x + off, arm.wrist.y, arm.z + 0.34)], c.text, 1, 1.2)
  const dx = arm.elbow.x - arm.wrist.x
  const dy = arm.elbow.y - arm.wrist.y
  const len = Math.hypot(dx, dy) || 1
  const nx = -dy / len
  const ny = dx / len
  const open = arm.holding ? 0.2 : 0.42
  for (const s of [-1, 1]) {
    const jx = arm.wrist.x + nx * open * s
    const jy = arm.wrist.y + ny * open * s
    line(ctx, [P(arm.wrist.x, arm.wrist.y, arm.z + 0.34), P(jx, jy, arm.z + 0.3), P(jx, jy, arm.z), P(jx - nx * 0.09 * s, jy - ny * 0.09 * s, arm.z)], c.text, 1, 1.6)
  }
}

// ---- frame ---------------------------------------------------------------------------------------------------
export function drawFrame(ctx, w, h, dpr, f) {
  const { scene, pose, proj, c, trail, statusMap, state, hover } = f
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, w, h)
  f.c = c

  // 1. the board: faint hairline hexes
  ctx.beginPath()
  for (const t of scene.layout.tiles) {
    const pts = hexCorners(t.x, t.y, R_HEX + 0.02).map((p) => proj.project(p.x, p.y, 0))
    pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)))
    ctx.closePath()
  }
  ctx.strokeStyle = rgba(c.faint, 0.2)
  ctx.lineWidth = 1
  ctx.stroke()

  // 2. connections: planned (dashed), reached (solid)
  const links = []
  if (scene.kind === 'workflow') {
    for (const e of scene.run.edges) {
      const a = scene.nodes[e.from]
      const b = scene.nodes[e.to]
      if (!a?.visible || !b?.visible) continue
      links.push({ a, b, lit: state.lit.has(edgeKey(e)) })
    }
  } else {
    for (const s of scene.stops) {
      if (s.kind === 'compact') continue
      links.push({ a: scene.tray, b: s, lit: trail.some((p) => p.id === s.id) })
    }
  }
  for (const l of links) {
    const pts = [proj.project(l.a.x, l.a.y, 0.03), proj.project(l.b.x, l.b.y, 0.03)]
    line(ctx, pts, l.lit ? c.text : c.faint, l.lit ? 0.7 : 0.45, l.lit ? 1.3 : 1, l.lit ? [] : [4, 4])
  }

  // 3. arm shadows on the ground
  for (const arm of pose.arms) drawArmShadow(ctx, f, arm)

  // 4. stations and plinths, far to near
  const stations = scene.kind === 'workflow'
    ? Object.values(scene.nodes).filter((n) => statusMap[n.id] !== 'hidden').map((n) => ({
      id: n.id, type: n.type, x: n.x, y: n.y, top: n.top, status: statusMap[n.id], angle: pose.routers[n.id], fill: pose.bays[n.id],
      reject: scene.workflow.decision?.reject.includes(n.id), hover: hover === n.id,
    }))
    : [
      ...scene.stops.map((s) => ({ id: s.id, type: s.kind, shape: s.kind === 'skill' ? 'notch' : 'hex', x: s.x, y: s.y, top: s.top, status: statusMap[s.id], hover: hover === s.id })),
      { id: 'tray', type: 'tray', x: scene.tray.x, y: scene.tray.y, top: scene.tray.top, status: 'active' },
    ]
  const items = stations.map((s) => ({ s, d: proj.project(s.x, s.y, 0).d }))
  items.sort((p, q) => p.d - q.d)
  for (const { s } of items) {
    drawStation(ctx, f, s)
    if (s.type === 'human') {
      if (pose.gate) drawGate(ctx, f, s, pose.gate)
      if (s.status === 'waiting') drawBracket(ctx, f, s)
    }
  }
  for (const s of pose.stacks ?? []) drawStack(ctx, f, s)
  for (const chip of pose.chips ?? []) drawChip(ctx, f, chip)

  // 5. the hairline trail the token has travelled
  if (trail.length > 1) line(ctx, trail.map((p) => proj.project(p.x, p.y, p.z + 0.04)), c.text, 0.85, 1.4)

  // 6. working rings
  for (const r of pose.rings) {
    const rad = 0.5 + r.t * 0.95
    const pts = ellipsePts(proj, r.x, r.y, r.z + 0.02, rad)
    line(ctx, pts.concat([pts[0]]), c.text, (1 - r.t) * 0.95, 1.3)
  }

  // 7. tokens under the gripper, then the arms over them
  for (const t of pose.tokens) drawToken(ctx, f, t)
  for (const arm of pose.arms) drawArm(ctx, f, arm)
}

export const HEX_W = SQ3
