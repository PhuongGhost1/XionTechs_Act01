// The three.js scene of the flight plan. This module is the only one in the section that imports
// `three`, and it only ever loads through the lazy FlightCanvas chunk (never for the SVG tier).
//
// It draws one small plot, on its own canvas: a ground grid, thin drop lines, the curved trajectory
// (hairline lines, no tubes, no bloom, no glow), one marker per node, one craft with a short trail.
// What it draws comes from the pure model (model.js) and the live demo snapshot (`getLive`), read every
// frame from a plain object, never from React state. Labels are HTML; their positions are projected here
// (camera.js projectPoint) and written as CSS transforms.
//
// Nothing is allocated inside the frame loop except short strings for the label transforms. The loop
// sleeps when nothing moves, when the plot is off screen and while the tab is hidden.

import {
  BoxGeometry, BufferGeometry, Color, ConeGeometry, EdgesGeometry, Float32BufferAttribute, Group, Line, LineBasicMaterial,
  LineDashedMaterial, LineSegments, Mesh, MeshBasicMaterial, OctahedronGeometry, PerspectiveCamera, Quaternion, SRGBColorSpace,
  Scene, Vector3, WebGLRenderer,
} from 'three'
import { sceneState, subscribe } from '../scene/store'
import {
  FOV, DOLLY_MS, cameraEye, cameraGoal, clamp, clampOrbit, ndcToPx, parallaxOffset, projectPoint, toRad, tweenCamera,
} from './camera'
import { TIERS } from './tier'
import { ALT_STEP, ORBIT, advanceCraft, craftPose, focusNodeId, journeyNodeStatus, litFraction, orbitPoint, planNodeStatus } from './model'
import { pointsUpTo } from './curves'

const TICK_MS = 700
const UP = new Vector3(0, 1, 0)
const FORWARD = new Vector3(0, 0, 1)
const tmpQ = new Quaternion()
const tmpV = new Vector3()

// "r g b" custom properties (the page's tokens) to three colours.
function readColors(el) {
  const cs = getComputedStyle(el)
  const get = (name, fallback) => {
    const raw = cs.getPropertyValue(`--c-${name}`).trim()
    const [r, g, b] = (raw || fallback).split(/\s+/).map(Number)
    return new Color().setRGB(r / 255, g / 255, b / 255, SRGBColorSpace)
  }
  return {
    bg: get('bg', '7 27 52'), line: get('line', '31 58 94'), faint: get('faint', '128 148 174'), muted: get('muted', '184 196 212'),
    text: get('text', '255 255 255'), signal: get('signal', '245 196 0'), danger: get('danger', '249 112 102'), ok: get('ok', '71 205 137'),
  }
}

const toGeometry = (pts) => {
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(pts.flat(), 3))
  return g
}

const ring = (r, n = 40, plane = 'xy') => {
  const pts = []
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2
    const c = Math.cos(a) * r
    const s = Math.sin(a) * r
    pts.push(plane === 'xy' ? [c, s, 0] : [c, 0, s])
  }
  return pts
}

const bracketPoints = (half, arm) => {
  const out = []
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      const cx = sx * half
      const cy = sy * half
      out.push([cx, cy, 0], [cx - sx * arm, cy, 0], [cx, cy, 0], [cx, cy - sy * arm, 0])
    }
  }
  return out
}

export function createFlightScene({ container, tier, getLive, getLabels, onFirstFrame, onContextLost }) {
  const cfg = TIERS[tier] ?? TIERS.lite
  const renderer = new WebGLRenderer({ antialias: cfg.antialias, alpha: true, powerPreference: 'low-power' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, cfg.dpr))
  renderer.setClearColor(0x000000, 0)
  const canvas = renderer.domElement
  canvas.style.cssText = 'display:block;width:100%;height:100%'
  container.appendChild(canvas)

  const C = readColors(container)
  const scene = new Scene()
  const camera = new PerspectiveCamera(FOV, 1, 0.5, 300)
  const disposables = []
  const track = (x) => {
    disposables.push(x)
    return x
  }
  const basic = (color, opacity = 1) => track(new LineBasicMaterial({ color, transparent: opacity < 1, opacity }))
  const dashed = (color, opacity = 1, dash = 0.26, gap = 0.2) =>
    track(new LineDashedMaterial({ color, transparent: opacity < 1, opacity, dashSize: dash, gapSize: gap }))

  // ---- persistent objects: the craft, its trail, the context ring ----
  const craftMat = track(new MeshBasicMaterial({ color: C.signal }))
  const craft = new Mesh(track(new ConeGeometry(0.15, 0.6, 4)), craftMat)
  scene.add(craft)

  const TRAIL = cfg.trail
  const trailPos = new Float32Array(TRAIL * 3)
  const trailCol = new Float32Array(TRAIL * 3)
  const trailGeo = track(new BufferGeometry())
  trailGeo.setAttribute('position', new Float32BufferAttribute(trailPos, 3))
  trailGeo.setAttribute('color', new Float32BufferAttribute(trailCol, 3))
  trailGeo.setDrawRange(0, 0)
  const trailLine = new Line(trailGeo, track(new LineBasicMaterial({ vertexColors: true })))
  trailLine.frustumCulled = false
  scene.add(trailLine)
  let trailCount = 0

  const CTX_N = 64
  const ctxGroup = new Group()
  const ctxBase = new Line(track(toGeometry(ring(0.72, CTX_N, 'xz'))), basic(C.line))
  const ctxGeo = track(toGeometry(ring(0.72, CTX_N, 'xz')))
  const ctxFillLine = new Line(ctxGeo, basic(C.signal))
  ctxGroup.add(ctxBase, ctxFillLine)
  ctxGroup.visible = false
  scene.add(ctxGroup)

  // ---- what the current model draws ----
  let built = null
  let builtModel = null

  function disposeBuilt() {
    if (!built) return
    scene.remove(built.group)
    built.group.traverse((o) => {
      o.geometry?.dispose()
      if (o.material) o.material.dispose()
    })
    built = null
  }

  const lineOf = (pts, material, isDashed = false) => {
    const line = new Line(toGeometry(pts), material)
    if (isDashed) line.computeLineDistances()
    return line
  }
  const segmentsOf = (pts, material) => new LineSegments(toGeometry(pts), material)
  const wire = (geometry, material) => new LineSegments(new EdgesGeometry(geometry), material)

  function build(model) {
    disposeBuilt()
    builtModel = model
    const group = new Group()
    const frame = model.frame

    // Ground grid and its frame.
    const grid = []
    for (let x = Math.ceil(frame.x[0]); x <= frame.x[1]; x++) grid.push([x, 0, frame.z[0]], [x, 0, frame.z[1]])
    for (let z = Math.ceil(frame.z[0]); z <= frame.z[1]; z++) grid.push([frame.x[0], 0, z], [frame.x[1], 0, z])
    group.add(segmentsOf(grid, new LineBasicMaterial({ color: C.line, transparent: true, opacity: 0.55 })))
    const [x0, x1] = frame.x
    const [z0, z1] = frame.z
    group.add(lineOf([[x0, 0, z0], [x1, 0, z0], [x1, 0, z1], [x0, 0, z1], [x0, 0, z0]], new LineBasicMaterial({ color: C.faint, transparent: true, opacity: 0.5 })))

    // Altitude axis on the near left corner, with a tick for every step level of the plan.
    const axis = [[x0, 0, z1], [x0, frame.y[1], z1]]
    if (model.view === 'plan') for (let l = 1; l * ALT_STEP <= frame.y[1]; l++) axis.push([x0, l * ALT_STEP, z1], [x0 + 0.3, l * ALT_STEP, z1])
    group.add(segmentsOf(axis, new LineBasicMaterial({ color: C.faint, transparent: true, opacity: 0.6 })))

    // Drop lines and footprints.
    const drops = []
    for (const n of model.nodes) {
      drops.push([n.x, n.y, n.z], [n.x, 0, n.z], [n.x - 0.16, 0, n.z], [n.x + 0.16, 0, n.z], [n.x, 0, n.z - 0.16], [n.x, 0, n.z + 0.16])
    }
    group.add(segmentsOf(drops, new LineBasicMaterial({ color: C.line, transparent: true, opacity: 0.9 })))

    // The trajectory's shadow on the ground, so the climb reads as height above the plane.
    const shadow = []
    for (const e of model.edges) for (let i = 1; i < e.poly.pts.length; i++) {
      const a = e.poly.pts[i - 1]
      const b = e.poly.pts[i]
      shadow.push([a[0], 0, a[2]], [b[0], 0, b[2]])
    }
    group.add(segmentsOf(shadow, new LineBasicMaterial({ color: C.faint, transparent: true, opacity: 0.22 })))

    // Edges: a base line (dashed when it is a candidate arc), and the lit part drawn twice, a hair apart.
    const edges = model.edges.map((e) => {
      const baseMat = e.candidate ? dashed(C.line, 0.9) : basic(C.line, 0.9)
      const base = lineOf(e.poly.pts, baseMat, e.candidate)
      const litA = lineOf(e.poly.pts, basic(C.signal))
      const litB = lineOf(e.poly.pts, basic(C.signal))
      litB.position.y = 0.035
      for (const l of [litA, litB]) l.geometry.setDrawRange(0, 0)
      group.add(base, litA, litB)
      return { edge: e, base, baseMat, litA, litB }
    })

    // Retry correction arcs: dashed, in the error colour, only once the fault has happened.
    const arcs = model.retryArcs.map((a) => {
      const mat = dashed(C.danger, 1, 0.2, 0.14)
      const line = lineOf(a.poly.pts, mat, true)
      line.visible = false
      group.add(line)
      return { arc: a, line, mat }
    })

    // Markers.
    const nodes = new Map()
    for (const n of model.nodes) {
      const g = new Group()
      g.position.set(n.x, n.y, n.z)
      const oriented = new Group()
      oriented.quaternion.setFromUnitVectors(FORWARD, tmpV.set(...n.tangent).normalize())
      const upright = new Group()
      g.add(oriented, upright)
      const mats = []
      const mat = (color = C.faint) => {
        const m = new LineBasicMaterial({ color })
        mats.push(m)
        return m
      }
      let bracket = null
      let ellipse = null
      let dot = null
      let scaleGroup = upright
      const addDot = (size = 0.1) => {
        dot = new Mesh(new BoxGeometry(size, size, size), new MeshBasicMaterial({ color: C.faint }))
        upright.add(dot)
      }
      if (n.kind === 'trigger') {
        upright.add(wire(new ConeGeometry(0.3, 0.6, 4), mat()))
        upright.add(lineOf(ring(0.5, 36, 'xz'), mat()))
        addDot(0.08)
      } else if (n.kind === 'agent') {
        oriented.add(lineOf(ring(0.34, 40), mat()))
        addDot(0.1)
        scaleGroup = oriented
      } else if (n.kind === 'router') {
        upright.add(wire(new OctahedronGeometry(0.36), mat()))
        upright.add(lineOf(ring(0.58, 40, 'xz'), mat()))
      } else if (n.kind === 'human') {
        oriented.add(lineOf(ring(0.52, 44), mat()))
        oriented.add(lineOf(ring(0.4, 44), mat()))
        bracket = segmentsOf(bracketPoints(0.9, 0.3), new LineBasicMaterial({ color: C.signal }))
        bracket.visible = false
        oriented.add(bracket)
        addDot(0.08)
        scaleGroup = oriented
      } else if (n.kind === 'outcome') {
        const pts = Array.from({ length: 65 }, (_, i) => orbitPoint([0, 0, 0], (i / 64) * Math.PI * 2, ORBIT))
        const visiblePts = n.abort ? pts.slice(0, 49) : pts // an abort arc stays open
        const baseMat = n.abort ? dashed(C.faint, 1, 0.16, 0.12) : mat()
        if (n.abort) mats.push(baseMat)
        upright.add(lineOf(visiblePts, baseMat, n.abort))
        ellipse = lineOf(visiblePts, new LineBasicMaterial({ color: C.signal }), false)
        ellipse.geometry.setDrawRange(0, 0)
        ellipse.position.y = 0.03
        upright.add(ellipse)
        addDot(0.1)
      } else if (n.kind === 'resource') {
        upright.add(wire(new BoxGeometry(0.42, 0.42, 0.42), mat()))
        addDot(0.07)
      } else if (n.kind === 'skill') {
        upright.add(wire(new OctahedronGeometry(0.34), mat()))
        addDot(0.07)
      } else if (n.kind === 'compact') {
        upright.add(lineOf(ring(0.8, 48, 'xz'), mat()))
        upright.add(lineOf(ring(0.58, 48, 'xz'), mat()))
        oriented.add(lineOf(ring(0.7, 48), mat()))
        scaleGroup = upright
      }
      group.add(g)
      nodes.set(n.id, { node: n, group: g, mats, bracket, ellipse, dot, scaleGroup, reveal: 0 })
    }

    scene.add(group)
    built = { group, edges, arcs, nodes }
  }

  // ---- camera rig ----
  const size = { w: 1, h: 1 }
  const cam = { target: [0, 0, 0], distance: 40, yaw: 0, pitch: toRad(55) }
  let tween = null // { from, to, t0 }
  let goal = null
  let goalKey = ''
  let orbit = { yaw: 0, pitch: 0 } // degrees, what the visitor asked for (clamped)
  let orbitNow = { yaw: 0, pitch: 0 }
  let par = { yaw: 0, pitch: 0 }
  let parNow = { yaw: 0, pitch: 0 }
  let dragging = null

  // ---- craft, orbit and context ring state ----
  let f = 0
  let lastRun = -1
  let orbitT = 0 // seconds the craft has been riding the final ellipse
  let orbitAngle = 0
  let ctxFill = 0
  let labelsOn = false
  const trailLast = [0, 0, 0]

  function pushTrail(p) {
    if (TRAIL === 0) return
    if (trailCount === TRAIL) {
      trailPos.copyWithin(0, 3)
      trailCount--
    }
    trailPos.set(p, trailCount * 3)
    trailCount++
  }
  function drainTrail() {
    if (trailCount === 0) return
    trailPos.copyWithin(0, 3, trailCount * 3)
    trailCount--
  }
  function paintTrail() {
    for (let j = 0; j < trailCount; j++) {
      const t = (j + 1) / trailCount
      trailCol[j * 3] = C.bg.r + (C.signal.r - C.bg.r) * t
      trailCol[j * 3 + 1] = C.bg.g + (C.signal.g - C.bg.g) * t
      trailCol[j * 3 + 2] = C.bg.b + (C.signal.b - C.bg.b) * t
    }
    trailGeo.attributes.position.needsUpdate = true
    trailGeo.attributes.color.needsUpdate = true
    trailGeo.setDrawRange(0, trailCount)
  }

  // ---- loop control ----
  let rafId = 0
  let last = 0
  let disposed = false
  let onScreen = true
  let sleepAt = 0 // the loop sleeps once nothing has moved since this time
  let firstFrame = true
  let version = ''

  const wake = () => {
    sleepAt = performance.now() + 700
    if (!rafId && !disposed && onScreen && !document.hidden) rafId = requestAnimationFrame(frame)
  }

  const statusOf = (id, L) => {
    if (L.model.view === 'journey') return journeyNodeStatus(Number(id.slice(5)), L.jState)
    return planNodeStatus(id, L.run, L.state)
  }

  const statusColor = (s) => {
    switch (s) {
      case 'off': return C.line
      case 'path': return C.faint
      case 'failing': case 'retrying': return C.danger
      case 'recovered': return C.ok
      default: return C.signal // waiting, working, active, retried
    }
  }

  function frame(now) {
    rafId = 0
    if (disposed) return
    if (document.hidden || !onScreen) {
      last = 0
      return
    }
    const dt = last ? Math.min(now - last, 50) : 16.7
    last = now
    const L = getLive()
    if (!L || !L.model) {
      rafId = requestAnimationFrame(frame)
      return
    }
    const model = L.model
    if (model !== builtModel) {
      build(model)
      goalKey = ''
    }
    if (L.runId !== lastRun) {
      lastRun = L.runId
      trailCount = 0
      orbitT = 0
    }
    const paused = sceneState.paused
    const ambient = paused ? 0 : dt

    // The craft's clock. A jump of more than a leg (a restart) snaps.
    const prevF = f
    f = advanceCraft(f, L.tick, model.legs, dt, TICK_MS)
    if (f < prevF - 1e-6) trailCount = 0
    let pose = craftPose(model.legs, model.start, f)
    let pos = pose.p
    let tan = pose.t
    let active = Math.abs(f - prevF) > 1e-6

    // Once the run is done on a successful outcome the craft rides the orbit ellipse (ambient, stops on pause).
    const finalNode = model.view === 'plan' ? model.byId[L.run.steps.at(-1)[0]] : null
    const orbiting = Boolean(finalNode && finalNode.kind === 'outcome' && !finalNode.abort && L.state.done && f >= L.tick - 1e-6)
    if (orbiting) {
      orbitT += ambient / 1000
      orbitAngle += (ambient / 1000) * 0.9
      const w = clamp(orbitT / 0.7, 0, 1)
      const ep = orbitPoint(finalNode.pos, orbitAngle)
      const ahead = orbitPoint(finalNode.pos, orbitAngle + 0.05)
      pos = [pos[0] + (ep[0] - pos[0]) * w, pos[1] + (ep[1] - pos[1]) * w, pos[2] + (ep[2] - pos[2]) * w]
      tan = [ahead[0] - ep[0], ahead[1] - ep[1], ahead[2] - ep[2]]
      active = active || !paused
    } else {
      orbitT = 0
    }

    craft.position.set(pos[0], pos[1], pos[2])
    tmpQ.setFromUnitVectors(UP, tmpV.set(tan[0], tan[1], tan[2]).normalize())
    craft.quaternion.copy(tmpQ)

    // Trail: grows while the craft moves, drains once it rests.
    const moved = Math.hypot(pos[0] - trailLast[0], pos[1] - trailLast[1], pos[2] - trailLast[2])
    if (moved > 0.03 && TRAIL > 0) {
      pushTrail(pos)
      trailLast[0] = pos[0]
      trailLast[1] = pos[1]
      trailLast[2] = pos[2]
      active = true
    } else if (trailCount > 0) {
      drainTrail()
      active = true
    }
    paintTrail()

    // Markers and edges follow the run.
    for (const [id, o] of built.nodes) {
      const s = statusOf(id, L)
      const color = statusColor(s)
      for (const m of o.mats) m.color.copy(color)
      if (o.dot) o.dot.material.color.copy(color)
      const k = s === 'working' ? 1.18 : 1
      o.scaleGroup.scale.setScalar(k)
      if (o.bracket) o.bracket.visible = s === 'waiting'
      if (o.ellipse) {
        o.reveal = s === 'active' ? Math.min(1, o.reveal + ambient / 700) : 0
        const total = o.ellipse.geometry.attributes.position.count
        o.ellipse.geometry.setDrawRange(0, Math.round(o.reveal * total))
        if (o.reveal > 0 && o.reveal < 1) active = true
      }
    }
    for (const e of built.edges) {
      const frac = litFraction(e.edge, f)
      const n = pointsUpTo(e.edge.poly, frac)
      e.litA.geometry.setDrawRange(0, n)
      e.litB.geometry.setDrawRange(0, n)
      const failed = L.state?.errorEdges?.has(e.edge.key)
      e.baseMat.color.copy(failed ? C.danger : e.edge.onPath ? C.faint : C.line)
    }
    for (const a of built.arcs) {
      const r = a.arc.r
      a.line.visible = f >= 2 * r - 1
      a.mat.opacity = f >= 2 * r + 1 ? 0.55 : 1
      a.mat.transparent = true
    }

    // The context ring follows the craft in the Agent at work view and drains when it compacts.
    const journey = model.view === 'journey'
    ctxGroup.visible = journey
    if (journey) {
      const target = L.jState.ringFill
      const before = ctxFill
      ctxFill += (target - ctxFill) * (1 - Math.exp(-3 * (dt / 1000)))
      if (Math.abs(target - ctxFill) < 0.002) ctxFill = target
      if (ctxFill !== before) active = true
      ctxGroup.position.set(pos[0], pos[1], pos[2])
      ctxGeo.setDrawRange(0, Math.max(2, Math.round(ctxFill * (CTX_N + 1))))
      ctxFillLine.material.color.copy(L.jState.compacting ? C.danger : C.signal)
    }

    // Camera: dolly toward the waypoint the craft is heading to, orbit and parallax on top.
    const aspect = size.w / size.h
    const focusId = focusNodeId(model, L.run, L.tick, L.jState)
    const focusPos = model.byId[focusId]?.pos ?? null
    const key = `${model.view}|${focusId}|${aspect.toFixed(2)}|${tier}`
    if (key !== goalKey) {
      const first = goalKey === ''
      goalKey = key
      goal = cameraGoal({ frame: model.frame, points: model.fit, focus: focusPos, aspect, flat: cfg.flat })
      if (first) {
        cam.target = goal.target
        cam.distance = goal.distance
        cam.yaw = goal.yaw
        cam.pitch = goal.pitch
        tween = null
      } else {
        tween = { from: { target: [...cam.target], distance: cam.distance }, to: goal, t0: now }
      }
    }
    if (tween) {
      const t = tweenCamera(tween.from, tween.to, now - tween.t0, DOLLY_MS)
      cam.target = t.target
      cam.distance = t.distance
      if (t.done) tween = null
      else active = true
    }
    if (goal) {
      cam.yaw = goal.yaw
      cam.pitch = goal.pitch
    }
    const k = 1 - Math.exp(-8 * (dt / 1000))
    const px = parNow.yaw
    const py = parNow.pitch
    const pTarget = paused || !cfg.parallax ? { yaw: 0, pitch: 0 } : par
    parNow.yaw += (pTarget.yaw - parNow.yaw) * k
    parNow.pitch += (pTarget.pitch - parNow.pitch) * k
    const ox = orbitNow.yaw
    const oy = orbitNow.pitch
    orbitNow.yaw += (orbit.yaw - orbitNow.yaw) * k
    orbitNow.pitch += (orbit.pitch - orbitNow.pitch) * k
    if (Math.abs(parNow.yaw - px) + Math.abs(parNow.pitch - py) + Math.abs(orbitNow.yaw - ox) + Math.abs(orbitNow.pitch - oy) > 0.002) active = true

    const view = { target: cam.target, distance: cam.distance, yaw: cam.yaw + toRad(orbitNow.yaw + parNow.yaw), pitch: clamp(cam.pitch + toRad(orbitNow.pitch + parNow.pitch), toRad(20), toRad(88)) }
    const eye = cameraEye(view)
    camera.position.set(eye[0], eye[1], eye[2])
    camera.lookAt(view.target[0], view.target[1], view.target[2])
    if (camera.aspect !== aspect) {
      camera.aspect = aspect
      camera.updateProjectionMatrix()
    }

    // Labels: projected, written as transforms.
    if (labelsOn) {
      const labels = getLabels()
      const proj = { eye, target: view.target, fov: FOV, aspect }
      for (const n of model.nodes) {
        const el = labels.get(n.id)
        if (!el) continue
        const q = projectPoint(n.pos, proj)
        const p = ndcToPx(q, size.w, size.h)
        const tf = `translate3d(${p.x.toFixed(1)}px,${p.y.toFixed(1)}px,0)`
        if (el.__src !== tf) {
          el.style.transform = tf
          el.__src = tf
          el.__tf = el.style.transform // the browser's normalised spelling, to tell later whether it is still ours
        }
        const vis = q.visible ? 'visible' : 'hidden'
        if (el.__vis !== vis) {
          el.style.visibility = vis
          el.__vis = vis
        }
      }
    }

    renderer.render(scene, camera)
    if (firstFrame) {
      firstFrame = false
      onFirstFrame?.()
    }

    const v = `${L.tick}|${L.runId}|${L.view}|${model.nodes.length}`
    if (v !== version) {
      version = v
      active = true
    }
    if (active) sleepAt = now + 700
    if (now < sleepAt) rafId = requestAnimationFrame(frame)
    else last = 0
  }

  // Hands the labels back: a transform is cleared only while it is still the one this scene wrote
  // (React may already have replaced it with the flat drawing's position).
  function releaseLabels() {
    for (const el of getLabels().values()) {
      if (el.__tf && el.style.transform === el.__tf) el.style.transform = ''
      el.style.visibility = ''
      el.__tf = el.__src = el.__vis = undefined
    }
  }

  // ---- events ----
  const resize = () => {
    const w = Math.max(1, container.clientWidth)
    const h = Math.max(1, container.clientHeight)
    size.w = w
    size.h = h
    renderer.setSize(w, h, false)
    goalKey = ''
    if (builtModel) tween = null
    wake()
  }
  const ro = new ResizeObserver(resize)
  ro.observe(container)
  const io = new IntersectionObserver(
    ([entry]) => {
      onScreen = entry.isIntersecting
      if (onScreen) wake()
    },
    { rootMargin: '80px' },
  )
  io.observe(container)
  const onVisibility = () => {
    if (!document.hidden) wake()
  }
  document.addEventListener('visibilitychange', onVisibility)
  const onLost = (e) => {
    e.preventDefault()
    disposed = true
    if (rafId) cancelAnimationFrame(rafId)
    rafId = 0
    onContextLost?.()
  }
  canvas.addEventListener('webglcontextlost', onLost)
  const unsubscribe = subscribe(wake) // un-pausing wakes the loop

  const fine = window.matchMedia?.('(pointer: fine)')
  const onDown = (e) => {
    if (e.pointerType === 'touch') return // touch keeps scrolling the page
    dragging = { x: e.clientX, y: e.clientY }
    container.setPointerCapture?.(e.pointerId)
    container.dataset.drag = 'on'
  }
  const onMove = (e) => {
    if (e.pointerType === 'touch') return
    if (dragging) {
      const o = clampOrbit(orbit.yaw - (e.clientX - dragging.x) * 0.25, orbit.pitch + (e.clientY - dragging.y) * 0.2)
      orbit = o
      dragging = { x: e.clientX, y: e.clientY }
    } else if (cfg.parallax && fine?.matches) {
      const r = container.getBoundingClientRect()
      par = parallaxOffset(((e.clientX - r.left) / r.width) * 2 - 1, ((e.clientY - r.top) / r.height) * 2 - 1)
    }
    wake()
  }
  const onUp = (e) => {
    dragging = null
    delete container.dataset.drag
    container.releasePointerCapture?.(e.pointerId)
  }
  const onLeave = () => {
    par = { yaw: 0, pitch: 0 }
    wake()
  }
  container.addEventListener('pointerdown', onDown)
  container.addEventListener('pointermove', onMove)
  container.addEventListener('pointerup', onUp)
  container.addEventListener('pointercancel', onUp)
  container.addEventListener('pointerleave', onLeave)

  resize()
  wake()

  return {
    wake,
    setLabelsEnabled(on) {
      labelsOn = on
      if (!on) releaseLabels()
      wake()
    },
    nudge(dyaw, dpitch) {
      orbit = clampOrbit(orbit.yaw + dyaw, orbit.pitch + dpitch)
      wake()
    },
    resetView() {
      orbit = { yaw: 0, pitch: 0 }
      par = { yaw: 0, pitch: 0 }
      wake()
    },
    dispose() {
      disposed = true
      if (rafId) cancelAnimationFrame(rafId)
      rafId = 0
      ro.disconnect()
      io.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      canvas.removeEventListener('webglcontextlost', onLost)
      container.removeEventListener('pointerdown', onDown)
      container.removeEventListener('pointermove', onMove)
      container.removeEventListener('pointerup', onUp)
      container.removeEventListener('pointercancel', onUp)
      container.removeEventListener('pointerleave', onLeave)
      unsubscribe()
      releaseLabels()
      disposeBuilt()
      for (const d of disposables) d.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
      canvas.remove()
    },
  }
}
