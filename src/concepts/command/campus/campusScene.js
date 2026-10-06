// The three.js scene of the smart campus. This module is the only one in the section that imports `three`,
// and it only ever loads through the lazy CampusCanvas chunk (never for the SVG tier).
//
// It draws an architect's maquette from the pure model (model.js): flat-shaded buildings with ribbon
// windows, floor slabs and roofs (solar panels on the teaching block), paved paths, a road, the car park,
// the park, the sports field, trees, lamps, benches and cars. Opening a building lifts its roof and floors
// apart, turns its rooms into glass boxes and shows the desks and device pins inside. A layer tints rooms
// by a simulated value; time moves the sun, the window glow, the parked and moving cars and the people.
//
// What it draws each frame comes from `getLive()` (selection, hover, layer, time and the per-room states that
// React computed with simulate.js), read from a plain object, never from React state. Labels are HTML; their
// positions are projected here (camera.js) and written as CSS transforms. The loop stops off screen and while
// the tab is hidden; it sleeps when nothing moves.

import {
  AmbientLight, BoxGeometry, BufferGeometry, Color, ConeGeometry, CylinderGeometry, DirectionalLight, EdgesGeometry, Float32BufferAttribute,
  Group, HemisphereLight, IcosahedronGeometry, InstancedMesh, LineBasicMaterial, LineSegments, Mesh, MeshBasicMaterial, MeshLambertMaterial,
  Object3D, OctahedronGeometry, PCFShadowMap, PerspectiveCamera, PlaneGeometry, Raycaster, SRGBColorSpace, Scene, SphereGeometry, Vector2,
  WebGLRenderer,
} from 'three'
import { sceneState, subscribe } from '../scene/store'
import { FOV, cameraEye, cameraGoal, clamp, ndcToPx, orbitBy, parallaxOffset, projectPoint, toRad, tweenCamera, zoomBy } from './camera'
import { GATE_ROAD, PATHS, ROAD, floorLift } from './model'
import { focusBox, levelOf } from './navigation'
import { TIERS } from './tier'

const OPEN_RATE = 5 // 1 / seconds: how fast a building opens and the others fade
const AUTO_YAW_DEG_S = 2.2 // the campus turns slowly while nobody is looking at anything
const CAR_SPEED = 5.5 // plot units per second
const DRAG_PX = 5

function readColors(el) {
  const cs = getComputedStyle(el)
  const get = (name, fallback) => {
    const raw = cs.getPropertyValue(`--c-${name}`).trim()
    const [r, g, b] = (raw || fallback).split(/\s+/).map(Number)
    return new Color().setRGB(r / 255, g / 255, b / 255, SRGBColorSpace)
  }
  return {
    bg: get('bg', '7 27 52'), surface: get('surface', '11 35 66'), raise: get('raise', '17 47 86'), line: get('line', '31 58 94'),
    faint: get('faint', '128 148 174'), muted: get('muted', '184 196 212'), text: get('text', '255 255 255'),
    signal: get('signal', '245 196 0'), ok: get('ok', '71 205 137'), danger: get('danger', '249 112 102'),
  }
}
const mix = (a, b, t) => a.clone().lerp(b, t)

export function createCampusScene({ container, tier, model, getLive, getLabels, onFirstFrame, onContextLost, onHover, onPick }) {
  const cfg = TIERS[tier] ?? TIERS.lite
  const renderer = new WebGLRenderer({ antialias: cfg.antialias, alpha: true, powerPreference: 'low-power' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, cfg.dpr))
  renderer.setClearColor(0x000000, 0)
  const shadows = tier === 'full'
  if (shadows) {
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = PCFShadowMap
  }
  const canvas = renderer.domElement
  canvas.style.cssText = 'display:block;width:100%;height:100%'
  container.appendChild(canvas)

  const C = readColors(container)
  const P = {
    lawn: mix(C.bg, C.ok, 0.2),
    field: mix(C.bg, C.ok, 0.3),
    paved: mix(C.surface, C.line, 0.55),
    road: mix(C.bg, C.surface, 0.5),
    wall: mix(C.raise, C.muted, 0.42),
    roof: mix(C.raise, C.muted, 0.28),
    slab: mix(C.surface, C.raise, 0.5),
    glassDay: mix(C.line, C.muted, 0.18),
    glassLit: mix(C.signal, C.text, 0.25),
    plate: mix(C.raise, C.line, 0.5),
    low: mix(C.raise, C.line, 0.6),
    dim: mix(C.surface, C.bg, 0.4),
    crown: mix(C.bg, C.ok, 0.5),
    trunk: mix(C.bg, C.faint, 0.5),
    solar: mix(C.bg, C.line, 0.7),
    desk: mix(C.raise, C.faint, 0.45),
    person: mix(C.muted, C.text, 0.3),
  }
  const scene = new Scene()
  const camera = new PerspectiveCamera(FOV, 1, 0.5, 500)
  const disposables = []
  const track = (x) => {
    disposables.push(x)
    return x
  }
  const lambert = (color, extra = {}) => track(new MeshLambertMaterial({ color, ...extra }))
  const basic = (color, extra = {}) => track(new MeshBasicMaterial({ color, ...extra }))
  const lineMat = (color, extra = {}) => track(new LineBasicMaterial({ color, ...extra }))
  const box = (w, h, d) => track(new BoxGeometry(w, h, d))
  const segments = (pts, material) => {
    const g = track(new BufferGeometry())
    g.setAttribute('position', new Float32BufferAttribute(pts.flat(), 3))
    return new LineSegments(g, material)
  }
  const pickables = []

  // ---- light ----
  const hemi = new HemisphereLight(mix(C.text, C.muted, 0.3), C.bg, 1)
  const ambient = new AmbientLight(C.muted, 0.15)
  const sun = new DirectionalLight(C.text, 1.4)
  if (shadows) {
    sun.castShadow = true
    sun.shadow.mapSize.set(2048, 2048)
    const s = sun.shadow.camera
    s.left = -36
    s.right = 36
    s.top = 36
    s.bottom = -36
    s.near = 1
    s.far = 160
    sun.shadow.bias = -0.0008
    sun.shadow.normalBias = 0.04
  }
  scene.add(hemi, ambient, sun, sun.target)

  // ---- ground: lawn, paving, road, zones ----
  const plot = model.frame
  const ground = new Mesh(track(new PlaneGeometry(plot.x[1] - plot.x[0] + 6, plot.z[1] - plot.z[0] + 6)), lambert(P.lawn))
  ground.rotation.x = -Math.PI / 2
  ground.receiveShadow = shadows
  scene.add(ground)
  const base = new Mesh(box(plot.x[1] - plot.x[0] + 6, 1.2, plot.z[1] - plot.z[0] + 6), lambert(P.dim))
  base.position.y = -0.61
  scene.add(base)
  const plate = (rect, color, y = 0.02, material) => {
    const m = new Mesh(box(rect.x[1] - rect.x[0], 0.04, rect.z[1] - rect.z[0]), material ?? lambert(color))
    m.position.set((rect.x[0] + rect.x[1]) / 2, y, (rect.z[0] + rect.z[1]) / 2)
    m.receiveShadow = shadows
    scene.add(m)
    return m
  }
  for (const p of PATHS) plate(p, P.paved)
  plate(ROAD, P.road, 0.025)
  plate(GATE_ROAD, P.road, 0.025)
  // Road centre line, dashed.
  const dashes = []
  for (let x = ROAD.x[0] + 0.5; x < ROAD.x[1]; x += 2) dashes.push([x, 0.06, (ROAD.z[0] + ROAD.z[1]) / 2], [x + 1, 0.06, (ROAD.z[0] + ROAD.z[1]) / 2])
  scene.add(segments(dashes, lineMat(C.faint, { transparent: true, opacity: 0.6 })))

  // ---- rooms and buildings ----
  const rooms = new Map() // roomId -> view
  const blds = new Map() // buildingId -> view
  const tmp = new Object3D()

  function pinMesh(shape, material) {
    switch (shape) {
      case 'cone': {
        const m = new Mesh(track(new ConeGeometry(0.2, 0.42, 10)), material)
        m.rotation.x = Math.PI * 0.75
        return m
      }
      case 'bar':
        return new Mesh(box(0.62, 0.16, 0.18), material)
      case 'box':
        return new Mesh(box(0.32, 0.32, 0.32), material)
      case 'gem':
        return new Mesh(track(new OctahedronGeometry(0.26)), material)
      case 'dome':
        return new Mesh(track(new SphereGeometry(0.22, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2)), material)
      default:
        return new Mesh(track(new CylinderGeometry(0.22, 0.22, 0.09, 16)), material)
    }
  }

  function addPins(room, parent) {
    const group = new Group()
    const mat = basic(C.faint)
    const pins = []
    for (const d of room.devices) {
      const m = pinMesh(d.shape, mat)
      m.position.set(d.pos[0], d.pos[1], d.pos[2])
      m.userData = { deviceId: d.id, roomId: room.id, buildingId: room.buildingId }
      group.add(m)
      pins.push(m)
      if (room.outdoor) {
        const pole = segments([[d.pos[0], 0, d.pos[2]], [d.pos[0], d.pos[1], d.pos[2]]], lineMat(C.faint))
        group.add(pole)
      }
    }
    parent.add(group)
    return { group, mat, pins }
  }

  // Desks and the anonymous people markers (occupancy only, never a per-person state).
  function addSeats(room, parent) {
    if (!cfg.seats || !room.seats.length) return null
    const n = room.seats.length
    const desks = track(new InstancedMesh(box(0.7, 0.42, 0.45), lambert(P.desk), n))
    const people = track(new InstancedMesh(track(new CylinderGeometry(0.16, 0.2, 0.62, 8)), lambert(P.person), n))
    const order = Array.from({ length: n }, (_, i) => (i * 7) % n) // spreads who arrives first across the room
    if (new Set(order).size !== n) order.splice(0, n, ...Array.from({ length: n }, (_, i) => i))
    room.seats.forEach(([x, z], i) => {
      tmp.position.set(x, room.y[0] + 0.21 + 0.1, z)
      tmp.updateMatrix()
      desks.setMatrixAt(i, tmp.matrix)
    })
    order.forEach((seat, i) => {
      const [x, z] = room.seats[seat]
      tmp.position.set(x, room.y[0] + 0.41, z + 0.45)
      tmp.updateMatrix()
      people.setMatrixAt(i, tmp.matrix)
    })
    people.count = 0
    const group = new Group()
    group.add(desks, people)
    parent.add(group)
    return { group, people, n }
  }

  for (const b of model.buildings) {
    const view = { b, floors: [], roof: null, open: 0, fade: 0, roofMats: [], bandMats: [] }
    blds.set(b.id, view)
    if (b.outdoor) {
      for (const id of b.roomIds) {
        const r = model.byId[id]
        const baseColor = r.usage === 'field' ? P.field : r.usage === 'park' ? P.lawn : P.paved
        const mat = lambert(baseColor)
        const m = plate(r, baseColor, 0.035, mat)
        m.userData = { roomId: r.id, buildingId: b.id }
        pickables.push(m)
        const outline = segments(
          [[r.x[0], 0.07, r.z[0]], [r.x[1], 0.07, r.z[0]], [r.x[1], 0.07, r.z[0]], [r.x[1], 0.07, r.z[1]], [r.x[1], 0.07, r.z[1]], [r.x[0], 0.07, r.z[1]], [r.x[0], 0.07, r.z[1]], [r.x[0], 0.07, r.z[0]]],
          lineMat(C.line),
        )
        scene.add(outline)
        const pins = addPins(r, scene)
        rooms.set(r.id, { r, b, mat, baseColor, edges: outline, pins, seats: null, kind: 'zone' })
      }
      continue
    }
    for (let f = 0; f < b.floors; f++) {
      const g = new Group()
      scene.add(g)
      view.floors.push(g)
      const y0 = f * b.floorHeight
      const slab = new Mesh(box(b.x[1] - b.x[0] + 0.3, 0.22, b.z[1] - b.z[0] + 0.3), lambert(P.slab))
      slab.position.set((b.x[0] + b.x[1]) / 2, y0 + 0.11, (b.z[0] + b.z[1]) / 2)
      slab.castShadow = shadows
      slab.receiveShadow = shadows
      g.add(slab)
    }
    for (const id of b.roomIds) {
      const r = model.byId[id]
      const g = view.floors[r.floor]
      const w = r.x[1] - r.x[0]
      const d = r.z[1] - r.z[0]
      const h = r.y[1] - r.y[0] - 0.22
      const cx = (r.x[0] + r.x[1]) / 2
      const cz = (r.z[0] + r.z[1]) / 2
      const cy = r.y[0] + 0.22 + h / 2
      const mat = lambert(P.wall, { transparent: true, opacity: 1 })
      const vol = new Mesh(box(w - 0.06, h, d - 0.06), mat)
      vol.position.set(cx, cy, cz)
      vol.castShadow = shadows
      vol.receiveShadow = shadows
      vol.userData = { roomId: r.id, buildingId: b.id }
      pickables.push(vol)
      g.add(vol)
      // Ribbon window: a band a hair outside the walls, lit from inside after dark.
      const bandMat = basic(P.glassDay)
      const atW = r.x[0] <= b.x[0] + 0.01
      const atE = r.x[1] >= b.x[1] - 0.01
      const band = new Mesh(box(w + (atW ? 0.06 : 0) + (atE ? 0.06 : 0) - 0.3, 1.1, d + 0.08), bandMat)
      band.position.set(cx + ((atE ? 0.03 : 0) - (atW ? 0.03 : 0)), r.y[0] + 0.22 + h * 0.55, cz)
      g.add(band)
      // Glass-box view: the floor plate of the room, tinted by the layer.
      const plateMat = lambert(P.plate)
      const fl = new Mesh(box(w - 0.12, 0.06, d - 0.12), plateMat)
      fl.position.set(cx, r.y[0] + 0.25, cz)
      fl.visible = false
      g.add(fl)
      const edgeMat = lineMat(C.line, { transparent: true, opacity: 0.9 })
      const edges = new LineSegments(track(new EdgesGeometry(vol.geometry)), edgeMat)
      edges.position.copy(vol.position)
      g.add(edges)
      const pins = addPins(r, g)
      pins.group.visible = false
      const seats = addSeats(r, g)
      if (seats) seats.group.visible = false
      // The security room's camera wall: a grid of abstract screens on the north wall.
      let wall = null
      if (r.cameraWall) {
        wall = new Group()
        const screens = []
        for (let i = 0; i < 9; i++) {
          const s = new Mesh(box(1.25, 0.72, 0.05), basic(C.line))
          s.position.set(r.x[0] + 1.2 + (i % 3) * 1.45, r.y[0] + 0.9 + Math.floor(i / 3) * 0.85, r.z[0] + 0.25)
          wall.add(s)
          screens.push(s)
        }
        wall.visible = false
        wall.userData.screens = screens
        g.add(wall)
      }
      rooms.set(r.id, { r, b, vol, mat, band, bandMat, plate: fl, plateMat, edges, edgeMat, pins, seats, wall, kind: 'room', baseColor: P.wall })
    }
    // Roof: a slab with a parapet; solar rows on the teaching block.
    const roof = new Group()
    const top = b.floors * b.floorHeight
    const roofMat = lambert(P.roof, { transparent: true, opacity: 1 })
    view.roofMats.push(roofMat)
    const slab = new Mesh(box(b.x[1] - b.x[0] + 0.3, 0.3, b.z[1] - b.z[0] + 0.3), roofMat)
    slab.position.set((b.x[0] + b.x[1]) / 2, top + 0.15, (b.z[0] + b.z[1]) / 2)
    slab.castShadow = shadows
    slab.userData = { buildingId: b.id }
    pickables.push(slab)
    roof.add(slab)
    if (b.roof === 'solar') {
      const solarMat = lambert(P.solar, { transparent: true, opacity: 1 })
      view.roofMats.push(solarMat)
      for (let x = b.x[0] + 1.5; x < b.x[1] - 1.5; x += 2.6) {
        for (let z = b.z[0] + 1.4; z < b.z[1] - 1; z += 2.1) {
          const p = new Mesh(box(2.2, 0.06, 1.4), solarMat)
          p.position.set(x + 1.1, top + 0.65, z + 0.6)
          p.rotation.x = -0.32
          p.castShadow = shadows
          roof.add(p)
        }
      }
    }
    scene.add(roof)
    view.roof = roof
  }

  // ---- trees, lamps, benches, playground, field markings ----
  const trees = model.decor.trees.slice(0, cfg.trees + 6)
  if (trees.length) {
    const trunks = track(new InstancedMesh(track(new CylinderGeometry(0.12, 0.16, 1, 6)), lambert(P.trunk), trees.length))
    const crowns = track(new InstancedMesh(track(new IcosahedronGeometry(1, 0)), lambert(P.crown, { flatShading: true }), trees.length))
    trees.forEach(([x, z, s], i) => {
      tmp.position.set(x, 0.5 * s, z)
      tmp.scale.set(1, s, 1)
      tmp.rotation.set(0, 0, 0)
      tmp.updateMatrix()
      trunks.setMatrixAt(i, tmp.matrix)
      tmp.position.set(x, 1.55 * s, z)
      tmp.scale.set(0.95 * s, 1.15 * s, 0.95 * s)
      tmp.rotation.set(0, i * 1.7, 0)
      tmp.updateMatrix()
      crowns.setMatrixAt(i, tmp.matrix)
    })
    trunks.castShadow = crowns.castShadow = shadows
    scene.add(trunks, crowns)
  }
  tmp.scale.set(1, 1, 1)
  tmp.rotation.set(0, 0, 0)
  const lampsPos = model.decor.lamps
  const lampPoles = segments(lampsPos.flatMap(([x, z]) => [[x, 0, z], [x, 2.6, z]]), lineMat(C.faint))
  scene.add(lampPoles)
  const lampMat = basic(C.faint)
  const lampHeads = track(new InstancedMesh(box(0.34, 0.14, 0.34), lampMat, lampsPos.length))
  lampsPos.forEach(([x, z], i) => {
    tmp.position.set(x, 2.65, z)
    tmp.updateMatrix()
    lampHeads.setMatrixAt(i, tmp.matrix)
  })
  scene.add(lampHeads)
  const benchMat = lambert(P.desk)
  for (const [x, z] of model.decor.benches) {
    const m = new Mesh(box(1.4, 0.35, 0.5), benchMat)
    m.position.set(x, 0.18, z)
    scene.add(m)
  }
  {
    const [px, pz] = model.decor.playground
    const pts = []
    const legs = [[-1.5, -0.8], [1.5, -0.8], [-1.5, 0.8], [1.5, 0.8]]
    for (const [dx, dz] of legs) pts.push([px + dx, 0, pz + dz], [px + dx * 0.8, 2, pz + dz * 0.3])
    pts.push([px - 1.2, 2, pz], [px + 1.2, 2, pz])
    scene.add(segments(pts, lineMat(C.muted)))
    const slide = new Mesh(box(0.7, 0.08, 3), lambert(C.signal))
    slide.position.set(px + 3, 0.7, pz)
    slide.rotation.x = 0.45
    scene.add(slide)
  }
  const field = model.byId.field
  if (field) {
    const [x0, x1] = [field.x[0] + 0.8, field.x[1] - 0.8]
    const [z0, z1] = [field.z[0] + 0.8, field.z[1] - 0.8]
    const zm = (z0 + z1) / 2
    const y = 0.08
    const pts = [[x0, y, z0], [x1, y, z0], [x1, y, z0], [x1, y, z1], [x1, y, z1], [x0, y, z1], [x0, y, z1], [x0, y, z0], [x0, y, zm], [x1, y, zm]]
    const xm = (x0 + x1) / 2
    for (let i = 0; i < 32; i++) {
      const a = (i / 32) * Math.PI * 2
      const b2 = ((i + 1) / 32) * Math.PI * 2
      pts.push([xm + Math.cos(a) * 1.8, y, zm + Math.sin(a) * 1.8], [xm + Math.cos(b2) * 1.8, y, zm + Math.sin(b2) * 1.8])
    }
    scene.add(segments(pts, lineMat(C.muted, { transparent: true, opacity: 0.7 })))
  }

  // ---- cars: parked in the bays, and a few driving the road ----
  const carBodyGeo = box(0.9, 0.5, 1.9)
  const carColors = [C.muted, C.faint, mix(C.danger, C.bg, 0.25), mix(C.signal, C.bg, 0.2), C.text, mix(C.line, C.text, 0.3)]
  const bays = model.decor.bays
  const parked = track(new InstancedMesh(carBodyGeo, lambert(C.text), bays.length))
  bays.forEach(([x, z], i) => {
    tmp.position.set(x, 0.3, z)
    tmp.updateMatrix()
    parked.setMatrixAt(i, tmp.matrix)
    parked.setColorAt(i, carColors[(i * 5) % carColors.length])
  })
  parked.count = 0
  parked.castShadow = shadows
  scene.add(parked)
  const moving = []
  for (let i = 0; i < cfg.cars; i++) {
    const m = new Mesh(carBodyGeo, lambert(carColors[(i * 3 + 1) % carColors.length]))
    m.rotation.y = Math.PI / 2
    m.castShadow = shadows
    m.visible = false
    scene.add(m)
    moving.push({ m, lane: i % 2, offset: (i * 58) / Math.max(1, cfg.cars) + (i % 2) * 7 })
  }

  // ---- camera rig ----
  const size = { w: 1, h: 1 }
  const cam = { target: [0, 0, 0], distance: 60, yaw: toRad(-26), pitch: toRad(46) }
  let goal = null
  let goalKey = ''
  let tween = null
  let orbit = { yaw: 0, pitch: 0 }
  let orbitNow = { yaw: 0, pitch: 0 }
  let zoom = 1
  let zoomNow = 1
  let par = { yaw: 0, pitch: 0 }
  const parNow = { yaw: 0, pitch: 0 }
  let autoYaw = 0
  let carClock = 0
  let pulse = 0
  let labelsOn = false

  // ---- picking ----
  const ray = new Raycaster()
  const ndc = new Vector2()
  let pointer = null // last pointer position over the canvas, for hover
  let hoverKey = ''
  let down = null
  function hitAt(clientX, clientY) {
    const rect = canvas.getBoundingClientRect()
    ndc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1)
    ray.setFromCamera(ndc, camera)
    const list = pickables.filter((o) => o.visible && o.parent?.visible !== false)
    for (const v of rooms.values()) if (v.pins.group.visible) for (const p of v.pins.pins) list.push(p)
    const hits = ray.intersectObjects(list, false)
    if (!hits.length) return null
    const pin = hits.find((x) => x.object.userData.deviceId)
    const first = pin && pin.distance < hits[0].distance + 1.5 ? pin : hits[0]
    return { ...first.object.userData }
  }

  // ---- loop ----
  let rafId = 0
  let last = 0
  let disposed = false
  let onScreen = true
  let sleepAt = 0
  let firstFrame = true
  let version = ''
  const wake = () => {
    sleepAt = performance.now() + 800
    if (!rafId && !disposed && onScreen && !document.hidden) rafId = requestAnimationFrame(frame)
  }

  function frame(now) {
    rafId = 0
    if (disposed) return
    if (document.hidden || !onScreen) {
      last = 0
      return
    }
    const dt = last ? Math.min(now - last, 50) / 1000 : 1 / 60
    last = now
    const L = getLive()
    if (!L) {
      rafId = requestAnimationFrame(frame)
      return
    }
    const paused = sceneState.paused || L.reduced
    let active = false
    const sel = L.sel
    const level = levelOf(sel)
    const ease = 1 - Math.exp(-OPEN_RATE * dt)

    // Hover from the last pointer position (once per frame, not per event).
    if (pointer && !down?.dragging) {
      const hit = hitAt(pointer.x, pointer.y)
      const key = hit ? `${hit.buildingId}|${hit.roomId ?? ''}|${hit.deviceId ?? ''}` : ''
      if (key !== hoverKey) {
        hoverKey = key
        onHover?.(hit)
        canvas.style.cursor = hit ? 'pointer' : ''
      }
    }
    const hov = L.hover

    // Sun, sky light and lamps follow the time of day.
    const sunNow = L.sun
    sun.position.set(sunNow.dir[0] * 60, sunNow.dir[1] * 60 + 8, sunNow.dir[2] * 60)
    sun.intensity = 0.25 + 1.35 * sunNow.daylight
    hemi.intensity = 0.55 + 0.6 * sunNow.daylight
    ambient.intensity = 0.12 + 0.1 * (1 - sunNow.daylight)
    lampMat.color.copy(L.lamps ? C.signal : C.faint)
    if (!paused) pulse += dt
    const glow = 0.5 + 0.5 * Math.sin(pulse * 3)

    // Buildings open and fade.
    for (const [id, v] of blds) {
      const targetOpen = sel.buildingId === id ? 1 : 0
      const targetFade = sel.buildingId && sel.buildingId !== id ? 1 : 0
      const before = v.open + v.fade
      v.open += (targetOpen - v.open) * ease
      v.fade += (targetFade - v.fade) * ease
      if (Math.abs(targetOpen - v.open) < 0.002) v.open = targetOpen
      if (Math.abs(targetFade - v.fade) < 0.002) v.fade = targetFade
      if (v.open + v.fade !== before) active = true
      if (v.b.outdoor) continue
      v.floors.forEach((g, f) => {
        g.position.y = floorLift(f, v.open, v.b.floors)
      })
      if (v.roof) {
        v.roof.position.y = floorLift(v.b.floors, v.open, v.b.floors)
        for (const m of v.roofMats) {
          // A layer looks through the roofs, so the tinted rooms show from above.
          m.opacity = Math.max(0.08, 1 - 0.88 * v.open - 0.5 * v.fade - (L.layer !== 'none' ? 0.72 : 0))
          m.depthWrite = m.opacity > 0.95
        }
        v.roof.visible = v.open < 0.98
      }
    }

    // Rooms: colour from the layer, status, hover and selection.
    for (const [id, v] of rooms) {
      const st = L.states[id]
      const bv = blds.get(v.b.id)
      const isSel = sel.roomId === id
      // Inside the open building a hover marks one room; anywhere else it marks the whole building.
      const isHover = Boolean(hov && hov.buildingId === v.b.id && (sel.buildingId === v.b.id ? hov.roomId === id : true))
      const inOpen = bv.open > 0.5
      let color = v.baseColor
      if (L.layer !== 'none') color = st?.layer == null ? P.dim : mix(P.low, C.signal, st.layer)
      if (v.kind === 'zone') {
        v.mat.color.copy(color)
        v.edges.material.color.copy(isSel || isHover ? C.signal : C.line)
        v.pins.group.visible = true
        v.pins.mat.color.copy(isSel || (sel.buildingId === v.b.id) ? C.signal : C.faint)
        continue
      }
      const ghost = bv.open
      v.mat.color.copy(color)
      v.mat.opacity = 1 - 0.86 * ghost - 0.55 * bv.fade
      v.mat.depthWrite = v.mat.opacity > 0.95
      v.vol.castShadow = shadows && ghost < 0.5
      const attention = st?.status === 'attention' && L.layer === 'none'
      v.mat.emissive.copy(C.signal).multiplyScalar(attention ? 0.22 + 0.18 * glow : 0)
      if (attention) active = true
      v.edgeMat.color.copy(isSel || isHover ? C.signal : inOpen ? C.faint : C.line)
      v.edgeMat.opacity = bv.fade > 0.5 ? 0.35 : 0.9
      v.plate.visible = ghost > 0.05
      v.plateMat.color.copy(L.layer !== 'none' ? color : isSel ? mix(P.plate, C.signal, 0.35) : P.plate)
      v.band.visible = ghost < 0.6 && L.layer === 'none'
      v.bandMat.color.copy(st?.lights && sunNow.daylight < 0.6 ? mix(P.glassDay, P.glassLit, 0.85 - sunNow.daylight) : P.glassDay)
      v.pins.group.visible = inOpen
      v.pins.mat.color.copy(isSel ? C.signal : C.muted)
      if (v.seats) {
        v.seats.group.visible = inOpen
        v.seats.people.count = Math.min(v.seats.n, st?.people ?? 0)
      }
      if (v.wall) {
        v.wall.visible = inOpen
        const watched = L.cameraRooms
        v.wall.userData.screens.forEach((s, i) => {
          const w = watched[i % Math.max(1, watched.length)]
          const ws = w ? L.states[w] : null
          s.material.color.copy(ws?.status === 'attention' ? C.signal : L.lamps ? mix(C.line, C.ok, 0.25) : mix(C.line, C.muted, 0.35))
        })
      }
    }
    // Device pin hover.
    for (const v of rooms.values()) for (const p of v.pins.pins) {
      const s = hov?.deviceId === p.userData.deviceId ? 1.6 : 1
      p.scale.setScalar(s)
    }

    // Cars.
    parked.count = Math.min(bays.length, L.parked ?? 0)
    if (!paused) carClock += dt
    const traffic = L.traffic ?? 0
    const shown = Math.round(traffic * moving.length + (L.lamps ? 0 : 0.6))
    moving.forEach((c, i) => {
      c.m.visible = i < shown
      if (!c.m.visible) return
      const len = ROAD.x[1] - ROAD.x[0]
      const s = (carClock * CAR_SPEED + c.offset) % len
      const x = c.lane ? ROAD.x[1] - s : ROAD.x[0] + s
      c.m.position.set(x, 0.3, c.lane ? ROAD.z[0] + 0.8 : ROAD.z[1] - 0.8)
      c.m.rotation.y = c.lane ? -Math.PI / 2 : Math.PI / 2
    })
    if (!paused && shown > 0) active = true

    // Camera.
    const aspect = size.w / size.h
    const fBox = focusBox(model, sel)
    const key = `${sel.buildingId}|${sel.roomId}|${aspect.toFixed(2)}`
    if (key !== goalKey) {
      const first = goalKey === ''
      goalKey = key
      goal = cameraGoal({ box: fBox, level, aspect, flat: cfg.flat })
      if (first) {
        cam.target = goal.target
        cam.distance = goal.distance
        cam.pitch = goal.pitch
        tween = null
      } else {
        tween = { from: { target: [...cam.target], distance: cam.distance, pitch: cam.pitch }, to: goal, t0: now }
      }
    }
    if (tween) {
      const t = tweenCamera(tween.from, tween.to, now - tween.t0)
      cam.target = t.target
      cam.distance = t.distance
      cam.pitch = t.pitch
      if (t.done) tween = null
      active = true
    }
    if (goal) cam.yaw = goal.yaw
    const idle = level === 'campus' && !hov && !down && !paused && tier === 'full'
    if (idle) {
      autoYaw += AUTO_YAW_DEG_S * dt
      active = true
    }
    const k = 1 - Math.exp(-8 * dt)
    const before = orbitNow.yaw + orbitNow.pitch + zoomNow + parNow.yaw + parNow.pitch
    orbitNow.yaw += (orbit.yaw - orbitNow.yaw) * k
    orbitNow.pitch += (orbit.pitch - orbitNow.pitch) * k
    zoomNow += (zoom - zoomNow) * k
    const pT = paused || !cfg.parallax ? { yaw: 0, pitch: 0 } : par
    parNow.yaw += (pT.yaw - parNow.yaw) * k
    parNow.pitch += (pT.pitch - parNow.pitch) * k
    if (Math.abs(orbitNow.yaw + orbitNow.pitch + zoomNow + parNow.yaw + parNow.pitch - before) > 0.0005) active = true
    const view = {
      target: cam.target,
      distance: cam.distance * zoomNow,
      yaw: cam.yaw + toRad(orbitNow.yaw + parNow.yaw + autoYaw),
      pitch: clamp(cam.pitch + toRad(orbitNow.pitch + parNow.pitch), toRad(14), toRad(88)),
    }
    const eye = cameraEye(view)
    camera.position.set(eye[0], eye[1], eye[2])
    camera.lookAt(view.target[0], view.target[1], view.target[2])
    if (camera.aspect !== aspect) {
      camera.aspect = aspect
      camera.updateProjectionMatrix()
    }

    // Labels.
    if (labelsOn) {
      const proj = { eye, target: view.target, fov: FOV, aspect }
      for (const [key2, el] of getLabels()) {
        const p3 = anchorOf(key2, L)
        if (!p3) continue
        const q = projectPoint(p3, proj)
        const p = ndcToPx(q, size.w, size.h)
        const tf = `translate3d(${p.x.toFixed(1)}px,${p.y.toFixed(1)}px,0)`
        if (el.__src !== tf) {
          el.style.transform = tf
          el.__src = tf
          el.__tf = el.style.transform
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
    const v2 = `${L.version}`
    if (v2 !== version) {
      version = v2
      active = true
    }
    if (active) sleepAt = now + 800
    if (now < sleepAt) rafId = requestAnimationFrame(frame)
    else last = 0
  }

  // Where a label sits: above a building, above a room (with its floor's lift), or on a device pin.
  function anchorOf(key, L) {
    const [kind, id] = key.split(':')
    if (kind === 'b') {
      const b = model.byId[id]
      if (!b) return null
      const h = b.outdoor ? 0.5 : b.height + floorLift(b.floors, blds.get(id).open, b.floors) + 1.2
      return [b.center[0], h, b.outdoor ? b.center[2] : b.z[1]]
    }
    if (kind === 'r') {
      const r = model.byId[id]
      if (!r) return null
      const b = model.byId[r.buildingId]
      const lift = b.outdoor ? 0 : floorLift(r.floor, blds.get(b.id).open, b.floors)
      return [r.center[0], (r.outdoor ? 0.3 : r.y[1]) + lift, r.z[1]]
    }
    if (kind === 'tip') {
      const d = L.hover?.deviceId ? model.devices.find((x) => x.id === L.hover.deviceId) : null
      if (!d) return [0, -999, 0]
      const r = model.byId[d.roomId]
      const b = model.byId[r.buildingId]
      const lift = b.outdoor ? 0 : floorLift(r.floor, blds.get(b.id).open, b.floors)
      return [d.pos[0], d.pos[1] + lift + 0.3, d.pos[2]]
    }
    return null
  }

  function releaseLabels() {
    for (const el of getLabels().values()) {
      if (el.__tf && el.style.transform === el.__tf) el.style.transform = ''
      el.style.visibility = ''
      el.__tf = el.__src = el.__vis = undefined
    }
  }

  // ---- events ----
  const resize = () => {
    size.w = Math.max(1, container.clientWidth)
    size.h = Math.max(1, container.clientHeight)
    renderer.setSize(size.w, size.h, false)
    goalKey = ''
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
  const unsubscribe = subscribe(wake)

  const fine = window.matchMedia?.('(pointer: fine)')
  const onDown = (e) => {
    down = { x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY, touch: e.pointerType === 'touch', dragging: false, id: e.pointerId }
  }
  const onMove = (e) => {
    if (e.pointerType !== 'touch') pointer = { x: e.clientX, y: e.clientY }
    if (down && !down.touch) {
      if (!down.dragging && Math.hypot(e.clientX - down.x, e.clientY - down.y) > DRAG_PX) {
        down.dragging = true
        container.setPointerCapture?.(e.pointerId)
        container.dataset.drag = 'on'
      }
      if (down.dragging) {
        const basePitch = (cam.pitch * 180) / Math.PI
        orbit = orbitBy(orbit, -(e.clientX - down.lx) * 0.3, (e.clientY - down.ly) * 0.2, basePitch)
        down.lx = e.clientX
        down.ly = e.clientY
      }
    } else if (cfg.parallax && fine?.matches) {
      const r = container.getBoundingClientRect()
      par = parallaxOffset(((e.clientX - r.left) / r.width) * 2 - 1, ((e.clientY - r.top) / r.height) * 2 - 1)
    }
    wake()
  }
  const onUp = (e) => {
    const d = down
    down = null
    delete container.dataset.drag
    container.releasePointerCapture?.(e.pointerId)
    if (!d || d.dragging) return
    if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > DRAG_PX * 2) return // a touch swipe scrolled the page
    onPick?.(hitAt(e.clientX, e.clientY))
    wake()
  }
  const onCancel = () => {
    down = null
    delete container.dataset.drag
  }
  const onLeave = () => {
    pointer = null
    par = { yaw: 0, pitch: 0 }
    if (hoverKey) {
      hoverKey = ''
      onHover?.(null)
      canvas.style.cursor = ''
    }
    wake()
  }
  container.addEventListener('pointerdown', onDown)
  container.addEventListener('pointermove', onMove)
  container.addEventListener('pointerup', onUp)
  container.addEventListener('pointercancel', onCancel)
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
      orbit = orbitBy(orbit, dyaw, dpitch, (cam.pitch * 180) / Math.PI)
      wake()
    },
    zoomBy(factor) {
      zoom = zoomBy(zoom, factor)
      wake()
    },
    resetView() {
      orbit = { yaw: 0, pitch: 0 }
      zoom = 1
      autoYaw = 0
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
      container.removeEventListener('pointercancel', onCancel)
      container.removeEventListener('pointerleave', onLeave)
      unsubscribe()
      releaseLabels()
      for (const d of disposables) d.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
      canvas.remove()
    },
  }
}
