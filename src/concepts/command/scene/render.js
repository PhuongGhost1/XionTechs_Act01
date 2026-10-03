// The three.js scene of the X data core (docs/concepts/01-command-implementation.md §5). This is
// the only module that imports `three`, and it is only ever loaded through the lazy canvas chunk.
//
// What is drawn, in six draw calls and no post-processing:
//   lines    the graph's edges, thin and additive
//   nodes    soft points, with larger ones for the tips and the hub
//   packets  a small pool of yellow points (with a short trail) running along the edges
//   orbit    particles circling their current cluster, which become the logo's pixels at the end
//   core     one soft yellow sprite at the hub, as strong as the X is still assembled
//
// Everything is placed by layout.js (which phase is on screen and where its anchors are) and
// phases.js (which phase that is). Nothing is allocated inside the frame loop: every buffer is
// created once and updated in place.

import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  DynamicDrawUsage,
  Group,
  LineBasicMaterial,
  LineSegments,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Scene,
  SRGBColorSpace,
  Sprite,
  SpriteMaterial,
  WebGLRenderer,
} from 'three'
import { ANCHOR_ATTR, SECTION_IDS, sceneState, stepFlow, subscribe } from './store'
import { armNodeIdOf, buildXGraph, ARM_COUNT, seeded } from './graph'
import { blendLayout, createBlend, createLayout, ORBIT_SLOTS, updateLayout } from './layout'
import { computePhase, coversViewport, smoothstep } from './phases'

export const QUALITY_SETTINGS = {
  high: { orbit: 360, packets: 28, dprCap: 2, antialias: true, power: 'default', pointer: true },
  low: { orbit: 140, packets: 12, dprCap: 1.25, antialias: false, power: 'low-power', pointer: false },
}

const FOV = 35 // degrees; a mild perspective so the depth of the X shows when it turns
const TAN_HALF_FOV = Math.tan((FOV * Math.PI) / 360)
const SIGNALS_INDEX = SECTION_IDS.indexOf('signals')

const PHASE_RATE = 7 // how quickly the phase follows the scroll position (about 1 / seconds to settle)
const PACKET_SPEED = 80 // px per second at idle flow
const TRAIL = [0, 9, 20] // distance in px of the packet's head and its two trail points
const MAX_LEAN = 0.1 // radians of yaw at the screen edge
const MAX_OFFSET = 18 // px the object follows the pointer

// Colours come from the page's CSS tokens (command.css), so the scene can not drift from the
// design. The fallbacks only matter if a token is missing; they mirror the tokens.
function readToken(name, fallback) {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  const parts = raw.split(/\s+/).map(Number)
  return parts.length === 3 && parts.every(Number.isFinite) ? parts : fallback
}

// Linear-space rgb of an sRGB token, as vertex colours need.
const tokenColor = (name, fallback) => {
  const [r, g, b] = readToken(name, fallback)
  const c = new Color().setRGB(r / 255, g / 255, b / 255, SRGBColorSpace)
  return [c.r, c.g, c.b]
}

// A small soft round sprite drawn once into a canvas. `stops` are [offset, alpha] pairs.
function softTexture(stops) {
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  for (const [offset, alpha] of stops) gradient.addColorStop(offset, `rgba(255,255,255,${alpha})`)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.generateMipmaps = false
  return texture
}

const dynamic = (array, itemSize) => new BufferAttribute(array, itemSize).setUsage(DynamicDrawUsage)

// Builds the scene inside `container` and starts drawing. Returns { wake, setLogo, logoBudget,
// dispose }. Throws if WebGL is not available: the caller keeps the static fallbacks then.
export function createXCore({ container, quality = 'high', onFirstFrame, onContextLost }) {
  const settings = QUALITY_SETTINGS[quality] ?? QUALITY_SETTINGS.low
  const graph = buildXGraph()
  const N = graph.nodes.length
  const E = graph.edges.length
  const K = settings.orbit
  const P = settings.packets
  const rand = seeded(11)

  // ---- renderer, camera, scene ----
  const canvas = document.createElement('canvas')
  canvas.style.cssText = 'display:block;width:100%;height:100%'
  container.appendChild(canvas)
  let renderer
  try {
    renderer = new WebGLRenderer({
      canvas,
      alpha: true,
      antialias: settings.antialias,
      powerPreference: settings.power,
    })
  } catch (error) {
    canvas.remove()
    throw error
  }
  renderer.setClearColor(0, 0)
  const scene = new Scene()
  const camera = new PerspectiveCamera(FOV, 1, 1, 10)
  // Everything hangs off one group so the pointer can nudge the whole object at once.
  const root = new Group()
  scene.add(root)

  // ---- colours and sprites ----
  const cText = tokenColor('--c-text', [255, 255, 255])
  const cLine = tokenColor('--c-muted', [184, 196, 212])
  const cSignal = tokenColor('--c-signal', [245, 196, 0])
  const dotTexture = softTexture([[0, 1], [0.3, 0.9], [0.55, 0.35], [1, 0]])
  const glowTexture = softTexture([[0, 1], [0.25, 0.55], [0.6, 0.14], [1, 0]])

  // ---- lines: two vertices per edge ----
  const linePos = new Float32Array(E * 6)
  const lineCol = new Float32Array(E * 8)
  const lineGeo = new BufferGeometry()
  lineGeo.setAttribute('position', dynamic(linePos, 3))
  lineGeo.setAttribute('color', dynamic(lineCol, 4))
  const lineMat = new LineBasicMaterial({ vertexColors: true, transparent: true, blending: AdditiveBlending, depthWrite: false, depthTest: false })
  const lines = new LineSegments(lineGeo, lineMat)

  // ---- nodes: the hub and tips are drawn larger than the rest, from the same buffers ----
  const nodePos = new Float32Array(N * 3)
  const nodeCol = new Float32Array(N * 4)
  const nodePosAttr = dynamic(nodePos, 3)
  const nodeColAttr = dynamic(nodeCol, 4)
  const bigIds = []
  const smallIds = []
  graph.nodes.forEach((n) => (n.kind === 'node' ? smallIds : bigIds).push(n.id))
  const pointsOf = (ids) => {
    const geo = new BufferGeometry()
    geo.setAttribute('position', nodePosAttr)
    geo.setAttribute('color', nodeColAttr)
    geo.setIndex(new BufferAttribute(Uint16Array.from(ids), 1))
    return geo
  }
  const pointMaterial = (size, map) =>
    new PointsMaterial({ size, map, vertexColors: true, transparent: true, blending: AdditiveBlending, depthWrite: false, depthTest: false, sizeAttenuation: false })
  const nodeGeo = pointsOf(smallIds)
  const tipGeo = pointsOf(bigIds)
  const nodeMat = pointMaterial(3.4, dotTexture)
  const tipMat = pointMaterial(6, dotTexture)
  const nodes = new Points(nodeGeo, nodeMat)
  const tips = new Points(tipGeo, tipMat)

  // ---- packets: head plus a short trail each ----
  const packetPos = new Float32Array(P * 3 * 3)
  const packetCol = new Float32Array(P * 3 * 4)
  const packetGeo = new BufferGeometry()
  packetGeo.setAttribute('position', dynamic(packetPos, 3))
  packetGeo.setAttribute('color', dynamic(packetCol, 4))
  const packetMat = pointMaterial(5, dotTexture)
  const packets = new Points(packetGeo, packetMat)

  // ---- orbit particles ----
  const orbitPos = new Float32Array(K * 3)
  const orbitCol = new Float32Array(K * 4)
  const orbitGeo = new BufferGeometry()
  orbitGeo.setAttribute('position', dynamic(orbitPos, 3))
  orbitGeo.setAttribute('color', dynamic(orbitCol, 4))
  const orbitMat = pointMaterial(2.6, dotTexture)
  const orbit = new Points(orbitGeo, orbitMat)
  const oRho = new Float32Array(K)
  const oOmega = new Float32Array(K)
  const oTheta = new Float32Array(K)
  const oCos = new Float32Array(K) // tilt of the orbit's ellipse in the screen plane
  const oSin = new Float32Array(K)
  const oFlat = new Float32Array(K)
  const oDepth = new Float32Array(K)
  const oRank = new Float32Array(K) // which particles stay visible when only a share is shown
  const oStagger = new Float32Array(K) // when it leaves for the logo
  const oBright = new Float32Array(K)
  const oYellow = new Uint8Array(K)
  for (let j = 0; j < K; j++) {
    oRho[j] = 0.45 + 0.7 * Math.pow(rand(), 0.85)
    oOmega[j] = (0.07 + 0.2 * rand()) * (rand() < 0.5 ? -1 : 1)
    oTheta[j] = rand() * Math.PI * 2
    const tilt = rand() * Math.PI
    oCos[j] = Math.cos(tilt)
    oSin[j] = Math.sin(tilt)
    oFlat[j] = 0.3 + 0.7 * rand()
    oDepth[j] = (rand() - 0.5) * 0.7
    oRank[j] = rand()
    oStagger[j] = rand()
    oBright[j] = 0.45 + 0.55 * rand()
    oYellow[j] = rand() < 0.07 ? 1 : 0
  }

  // ---- core: one soft yellow sprite at the hub ----
  const coreMat = new SpriteMaterial({ map: glowTexture, color: new Color().setRGB(cSignal[0], cSignal[1], cSignal[2]), transparent: true, blending: AdditiveBlending, depthWrite: false, depthTest: false })
  const core = new Sprite(coreMat)

  for (const object of [lines, nodes, tips, packets, orbit, core]) {
    object.frustumCulled = false // buffers change every frame; a stale bounding sphere would cull them
    root.add(object)
  }

  // ---- per-node and per-packet state ----
  const nodeDrift = new Float32Array(N * 3) // phase offsets for the idle drift
  for (let i = 0; i < N * 3; i++) nodeDrift[i] = rand() * Math.PI * 2
  const glow = new Float32Array(N) // lit by a packet arriving, decays

  // Adjacency (CSR) for packets walking the graph, plus the way outward along each arm.
  const adjStart = new Uint16Array(N + 1)
  for (const [a, b] of graph.edges) {
    adjStart[a + 1]++
    adjStart[b + 1]++
  }
  for (let i = 0; i < N; i++) adjStart[i + 1] += adjStart[i]
  const adjEdge = new Uint16Array(adjStart[N])
  const fill = Uint16Array.from(adjStart.subarray(0, N))
  graph.edges.forEach(([a, b], e) => {
    adjEdge[fill[a]++] = e
    adjEdge[fill[b]++] = e
  })
  const edgeA = new Uint16Array(E)
  const edgeB = new Uint16Array(E)
  graph.edges.forEach(([a, b], e) => {
    edgeA[e] = a
    edgeB[e] = b
  })
  const outEdge = new Int16Array(N).fill(-1) // arm edge leading outward from a node
  const hubEdge = new Int16Array(ARM_COUNT).fill(-1)
  graph.edges.forEach(([a, b, kind], e) => {
    if (kind !== 'arm') return
    if (a === 0) hubEdge[graph.nodes[b].arm] = e
    else outEdge[a] = e
  })
  const edgeRing = Uint8Array.from(graph.edges, (e) => (e[2] === 'ring' ? 1 : 0))
  const level = Uint8Array.from(graph.nodes, (n) => n.level)

  const pEdge = new Int16Array(P)
  const pFrom = new Uint16Array(P)
  const pTo = new Uint16Array(P)
  const pT = new Float32Array(P)
  const pSpeed = new Float32Array(P)
  const pWait = new Float32Array(P)
  for (let p = 0; p < P; p++) pSpeed[p] = 0.75 + 0.5 * rand()

  // ---- layout and measurements ----
  const layout = createLayout(graph, { orbitCount: K })
  const blend = createBlend(layout)
  const viewport = { width: 1, height: 1 }
  const anchors = new Map() // id -> { cx, cy, w, h, el }
  let anchorEls = []
  let sectionEls = SECTION_IDS.map(() => null)
  const sectionRects = SECTION_IDS.map(() => ({ top: 0, bottom: 0 }))
  const sectionRectArr = SECTION_IDS.map(() => null) // the rect, or null while the section is not in the page
  let logo = null

  function queryElements() {
    anchors.clear()
    anchorEls = Array.from(document.querySelectorAll(`[${ANCHOR_ATTR}]`))
    for (const el of anchorEls) {
      const id = el.getAttribute(ANCHOR_ATTR)
      if (!anchors.has(id)) anchors.set(id, { cx: 0, cy: 0, w: 0, h: 0, el }) // a duplicate id: the first wins
    }
    sectionEls = SECTION_IDS.map((id) => document.getElementById(id))
  }

  function measureSections() {
    for (let k = 0; k < SECTION_IDS.length; k++) {
      const el = sectionEls[k]
      if (!el || !el.isConnected) {
        sectionRectArr[k] = null
        continue
      }
      const r = el.getBoundingClientRect()
      sectionRects[k].top = r.top
      sectionRects[k].bottom = r.bottom
      sectionRectArr[k] = sectionRects[k]
    }
  }

  function measureAnchors() {
    for (const el of anchorEls) {
      const a = anchors.get(el.getAttribute(ANCHOR_ATTR))
      if (a.el !== el) continue
      const r = el.getBoundingClientRect()
      a.cx = r.left + r.width / 2
      a.cy = r.top + r.height / 2
      a.w = r.width
      a.h = r.height
    }
  }

  // ---- loop control ----
  let disposed = false
  let rafId = 0
  let last = 0
  let dirty = true // something moved or resized: measure again
  let stale = true // the set of anchors may have changed: query again
  let layoutDirty = true
  let sized = false
  let covered = false
  let firstFrame = true
  let clock = 0
  let phase = 0
  let phaseTarget = 0
  let pointerX = 0
  let pointerY = 0

  let sizedW = 0
  let sizedH = 0
  let sizedRatio = 0
  function resize() {
    const w = container.clientWidth
    const h = container.clientHeight
    if (!w || !h) return
    const ratio = Math.min(window.devicePixelRatio || 1, settings.dprCap)
    if (w === sizedW && h === sizedH && ratio === sizedRatio) return // setSize would clear the canvas
    sizedW = w
    sizedH = h
    sizedRatio = ratio
    renderer.setPixelRatio(ratio)
    renderer.setSize(w, h, false)
    // Camera distance chosen so the z = 0 plane maps 1 world unit to 1 CSS px.
    const z = h / 2 / TAN_HALF_FOV
    camera.aspect = w / h
    camera.position.set(0, 0, z)
    camera.near = z * 0.1
    camera.far = z * 3
    camera.updateProjectionMatrix()
    viewport.width = w
    viewport.height = h
    sized = true
    layoutDirty = true
    dirty = true
  }

  const schedule = () => {
    if (!rafId && !disposed) rafId = requestAnimationFrame(frame)
  }
  const wake = () => {
    dirty = true
    schedule()
  }

  // ---- per-frame work ----
  function nextEdge(node, from, ringW, backW) {
    // A weighted pick among the visible edges at `node`, outward along the arm preferred.
    let total = 0
    for (let k = adjStart[node]; k < adjStart[node + 1]; k++) {
      const e = adjEdge[k]
      if (e === from) continue
      total += edgeWeight(e, node, ringW, backW)
    }
    if (total <= 0) return -1
    let r = rand() * total
    for (let k = adjStart[node]; k < adjStart[node + 1]; k++) {
      const e = adjEdge[k]
      if (e === from) continue
      r -= edgeWeight(e, node, ringW, backW)
      if (r <= 0) return e
    }
    return -1
  }

  function edgeWeight(e, node, ringW, backW) {
    const other = edgeA[e] === node ? edgeB[e] : edgeA[e]
    if (blend.edgeVis[e] * Math.min(blend.vis[node], blend.vis[other]) < 0.05) return 0
    if (edgeRing[e]) return ringW
    return level[other] > level[node] ? 6 : backW
  }

  function respawn(p, delay) {
    // Packets are born at the hub while the X is whole, and at the first level once it has split.
    const arm = Math.floor(rand() * ARM_COUNT)
    if (phase < 0.6) {
      pEdge[p] = hubEdge[arm]
      pFrom[p] = 0
    } else {
      pFrom[p] = armNodeIdOf(graph, arm, 1)
      pEdge[p] = outEdge[pFrom[p]]
    }
    pTo[p] = edgeA[pEdge[p]] === pFrom[p] ? edgeB[pEdge[p]] : edgeA[pEdge[p]]
    pT[p] = 0
    pWait[p] = delay
  }

  function stepPackets(dt, flow) {
    const spread = Math.min(1, Math.max(0, 1.5 - phase)) // sideways and backward moves fade out after the hero
    const ringW = 0.15 + spread * 0.85
    const backW = spread * 0.5
    for (let p = 0; p < P; p++) {
      if (pWait[p] > 0) {
        pWait[p] -= dt
        continue
      }
      const a = pFrom[p] * 3
      const b = pTo[p] * 3
      const length = Math.hypot(nodePos[b] - nodePos[a], nodePos[b + 1] - nodePos[a + 1])
      pT[p] += (PACKET_SPEED * flow * pSpeed[p] * dt) / Math.max(length, 8)
      if (pT[p] < 1) continue
      glow[pTo[p]] = 1
      const arrived = pTo[p]
      const e = nextEdge(arrived, pEdge[p], ringW, backW)
      if (e < 0 || outEdge[arrived] < 0) {
        respawn(p, rand() * 0.9) // delivered at a tip, or nowhere left to go
        continue
      }
      pFrom[p] = arrived
      pTo[p] = edgeA[e] === arrived ? edgeB[e] : edgeA[e]
      pEdge[p] = e
      pT[p] = Math.max(0, pT[p] - 1)
    }
  }

  function frame(now) {
    rafId = 0
    if (disposed) return
    if (document.hidden || !sized) {
      last = 0 // visibilitychange or the first resize wakes the loop again
      return
    }
    const dt = last ? Math.min((now - last) / 1000, 0.05) : 1 / 60
    last = now

    // Measure on scroll, resize and layout changes. While the paper band covers the viewport only
    // its own rect is read: that is all it takes to know when to start drawing again.
    if (dirty) {
      dirty = false
      if (stale) {
        queryElements()
        stale = false
      }
      measureSections()
      covered = coversViewport(sectionRectArr[SIGNALS_INDEX], viewport.height)
      if (!covered) {
        measureAnchors()
        layoutDirty = true
      }
    }
    if (covered) {
      last = 0
      return
    }

    const paused = sceneState.paused
    const sdt = paused ? 0 : dt // simulated time: frozen while the visitor has paused motion
    clock += sdt
    sceneState.flow = stepFlow(sceneState.flow, sceneState.flowTarget, dt)
    const flow = sceneState.flow

    phaseTarget = computePhase(sectionRectArr, viewport.height)
    phase = firstFrame ? phaseTarget : stepFlow(phase, phaseTarget, dt, PHASE_RATE)
    if (layoutDirty) {
      updateLayout(layout, anchors, viewport, logo)
      layoutDirty = false
    }
    blendLayout(layout, phase, blend)
    const s = blend.scalars

    // Pointer lean and offset (high quality only; the store holds 0 otherwise).
    const targetX = settings.pointer ? sceneState.pointerX : 0
    const targetY = settings.pointer ? sceneState.pointerY : 0
    pointerX = stepFlow(pointerX, targetX, dt, 5)
    pointerY = stepFlow(pointerY, targetY, dt, 5)
    // pointerY follows clientY (positive is down), so the front tips up when the pointer is above.
    const yaw = (0.14 * Math.sin(clock * 0.21) + MAX_LEAN * pointerX) * s.spin
    const pitch = (0.07 * Math.sin(clock * 0.17 + 1) + MAX_LEAN * 0.8 * pointerY) * s.spin
    const breathe = 1 + 0.02 * Math.sin(clock * 0.9) * s.spin
    root.position.set(pointerX * MAX_OFFSET * s.spin, -pointerY * MAX_OFFSET * s.spin, 0)
    const cosY = Math.cos(yaw)
    const sinY = Math.sin(yaw)
    const cosP = Math.cos(pitch)
    const sinP = Math.sin(pitch)
    const logoMix = s.logoMix

    // ---- nodes ----
    const decay = Math.exp(-sdt * 2.2)
    for (let i = 0; i < N; i++) {
      const o = i * 3
      const lx = blend.pos[o] - blend.piv[o]
      const ly = blend.pos[o + 1] - blend.piv[o + 1]
      const lz = blend.pos[o + 2] - blend.piv[o + 2]
      const x1 = lx * cosY + lz * sinY
      const z1 = -lx * sinY + lz * cosY
      const y2 = ly * cosP - z1 * sinP
      const z2 = ly * sinP + z1 * cosP
      const d = s.drift
      nodePos[o] = blend.piv[o] + x1 * breathe + Math.sin(clock * 0.5 + nodeDrift[o]) * d
      nodePos[o + 1] = blend.piv[o + 1] + y2 * breathe + Math.cos(clock * 0.43 + nodeDrift[o + 1]) * d
      nodePos[o + 2] = blend.piv[o + 2] + z2 * breathe + Math.sin(clock * 0.37 + nodeDrift[o + 2]) * d
      glow[i] *= decay
      const lit = Math.max(blend.tint[i], glow[i])
      const c = i * 4
      const base = 0.5 // node colour sits halfway between the line colour and white
      nodeCol[c] = (cLine[0] + (cText[0] - cLine[0]) * base) * (1 - lit) + cSignal[0] * lit
      nodeCol[c + 1] = (cLine[1] + (cText[1] - cLine[1]) * base) * (1 - lit) + cSignal[1] * lit
      nodeCol[c + 2] = (cLine[2] + (cText[2] - cLine[2]) * base) * (1 - lit) + cSignal[2] * lit
      nodeCol[c + 3] = blend.vis[i] * (0.62 + (1 - 0.62) * logoMix + 0.38 * glow[i])
    }
    nodePosAttr.needsUpdate = true
    nodeColAttr.needsUpdate = true
    // The logo is made of small dots: shrink the nodes to match the orbit particles.
    nodeMat.size = 3.4 - 1.0 * logoMix
    tipMat.size = 6 - 3.4 * logoMix

    // ---- lines ----
    for (let e = 0; e < E; e++) {
      const a = edgeA[e] * 3
      const b = edgeB[e] * 3
      const v = e * 6
      linePos[v] = nodePos[a]
      linePos[v + 1] = nodePos[a + 1]
      linePos[v + 2] = nodePos[a + 2]
      linePos[v + 3] = nodePos[b]
      linePos[v + 4] = nodePos[b + 1]
      linePos[v + 5] = nodePos[b + 2]
      const strength = blend.edgeVis[e] * (edgeRing[e] ? 0.13 : 0.46)
      const c = e * 8
      lineCol[c] = lineCol[c + 4] = cLine[0]
      lineCol[c + 1] = lineCol[c + 5] = cLine[1]
      lineCol[c + 2] = lineCol[c + 6] = cLine[2]
      lineCol[c + 3] = lineCol[c + 7] = strength * Math.min(blend.vis[edgeA[e]], blend.vis[edgeB[e]]) // one fade per edge: a line to a hidden node is gone, not a gradient
    }
    lineGeo.attributes.position.needsUpdate = true
    lineGeo.attributes.color.needsUpdate = true

    // ---- packets ----
    stepPackets(sdt, flow)
    for (let p = 0; p < P; p++) {
      const e = pEdge[p]
      const live = e >= 0 && pWait[p] <= 0
      const a = pFrom[p] * 3
      const b = pTo[p] * 3
      const length = live ? Math.hypot(nodePos[b] - nodePos[a], nodePos[b + 1] - nodePos[a + 1]) : 1
      const edgeFade = live ? blend.edgeVis[e] * Math.min(blend.vis[pFrom[p]], blend.vis[pTo[p]]) : 0
      const fade = Math.min(1, pT[p] * 8, (1 - pT[p]) * 8) * edgeFade * s.packetAlpha
      for (let k = 0; k < 3; k++) {
        const t = Math.max(0, pT[p] - TRAIL[k] / Math.max(length, 8))
        const v = (p * 3 + k) * 3
        const c = (p * 3 + k) * 4
        packetPos[v] = nodePos[a] + (nodePos[b] - nodePos[a]) * t
        packetPos[v + 1] = nodePos[a + 1] + (nodePos[b + 1] - nodePos[a + 1]) * t
        packetPos[v + 2] = nodePos[a + 2] + (nodePos[b + 2] - nodePos[a + 2]) * t
        packetCol[c] = cSignal[0]
        packetCol[c + 1] = cSignal[1]
        packetCol[c + 2] = cSignal[2]
        packetCol[c + 3] = live ? fade * (k === 0 ? 1 : k === 1 ? 0.5 : 0.22) : 0
      }
    }
    packetGeo.attributes.position.needsUpdate = true
    packetGeo.attributes.color.needsUpdate = true

    // ---- orbit particles ----
    const spinStep = sdt * flow
    for (let j = 0; j < K; j++) {
      oTheta[j] += oOmega[j] * spinStep
      const slot = j % ORBIT_SLOTS
      const rx = blend.orbitRx[slot] * oRho[j]
      const ry = blend.orbitRy[slot] * oRho[j] * oFlat[j]
      const u = rx * Math.cos(oTheta[j])
      const w = ry * Math.sin(oTheta[j])
      let x = blend.orbitCx[slot] + u * oCos[j] - w * oSin[j]
      let y = blend.orbitCy[slot] + u * oSin[j] + w * oCos[j]
      let z = rx * oDepth[j] * Math.sin(oTheta[j])
      let alpha = s.orbitAlpha * oBright[j] * Math.min(1, Math.max(0, (s.orbitFraction - oRank[j]) * 12))
      let yellow = oYellow[j]
      if (logoMix > 0) {
        // Each particle leaves for its pixel of the logo at its own moment.
        const m = smoothstep(0, 1, logoMix * 1.5 - oStagger[j] * 0.5)
        x += (layout.logoTarget[j * 3] - x) * m
        y += (layout.logoTarget[j * 3 + 1] - y) * m
        z += (layout.logoTarget[j * 3 + 2] - z) * m
        alpha += (0.95 - alpha) * m
        yellow = yellow + (layout.logoYellow[j] - yellow) * m
      }
      const v = j * 3
      const c = j * 4
      orbitPos[v] = x
      orbitPos[v + 1] = y
      orbitPos[v + 2] = z
      orbitCol[c] = cLine[0] * (1 - yellow) + cSignal[0] * yellow
      orbitCol[c + 1] = cLine[1] * (1 - yellow) + cSignal[1] * yellow
      orbitCol[c + 2] = cLine[2] * (1 - yellow) + cSignal[2] * yellow
      orbitCol[c + 3] = alpha
    }
    orbitGeo.attributes.position.needsUpdate = true
    orbitGeo.attributes.color.needsUpdate = true
    orbitMat.size = 2.6 - 0.5 * logoMix

    // ---- core ----
    core.visible = s.core > 0.01
    if (core.visible) {
      core.position.set(nodePos[0], nodePos[1], nodePos[2])
      const size = s.coreSize * (0.7 + 0.3 * s.core) * (1 + 0.05 * Math.sin(clock * 1.6))
      core.scale.set(size, size, 1)
      coreMat.opacity = 0.5 * s.core
    }

    renderer.render(scene, camera)
    if (firstFrame) {
      firstFrame = false
      onFirstFrame?.()
    }

    // Keep drawing while anything moves; otherwise sleep until a scroll, resize, pointer move or
    // un-pause wakes the loop.
    const settling =
      Math.abs(phase - phaseTarget) > 0.0005 ||
      Math.abs(sceneState.flow - sceneState.flowTarget) > 0.002 ||
      Math.abs(pointerX - targetX) > 0.002 ||
      Math.abs(pointerY - targetY) > 0.002
    if (!paused || settling) schedule()
    else last = 0
  }

  // ---- events ----
  const onVisibility = () => {
    if (!document.hidden) wake()
  }
  const onContextLostEvent = () => {
    disposed = true
    if (rafId) cancelAnimationFrame(rafId)
    rafId = 0
    onContextLost?.()
  }
  const observer = new ResizeObserver(() => {
    stale = true
    resize() // the container's own size (dynamic toolbars on phones) and any layout shift
    wake()
  })
  observer.observe(container)
  observer.observe(document.body)
  window.addEventListener('scroll', wake, { passive: true })
  window.addEventListener('resize', wake, { passive: true })
  document.addEventListener('visibilitychange', onVisibility)
  canvas.addEventListener('webglcontextlost', onContextLostEvent)
  const unsubscribe = subscribe(wake) // un-pausing, or a new active section
  for (let p = 0; p < P; p++) respawn(p, rand() * 2.5) // staggered, so the packets do not leave in step
  resize()
  schedule()

  return {
    wake,
    // Points to converge into at the end: the orbit particles plus the graph's nodes.
    logoBudget: K + N,
    setLogo(points, aspect) {
      logo = points && points.length > 0 ? { points, aspect } : null
      layoutDirty = true
      wake()
    },
    dispose() {
      disposed = true
      if (rafId) cancelAnimationFrame(rafId)
      rafId = 0
      observer.disconnect()
      window.removeEventListener('scroll', wake)
      window.removeEventListener('resize', wake)
      document.removeEventListener('visibilitychange', onVisibility)
      canvas.removeEventListener('webglcontextlost', onContextLostEvent)
      unsubscribe()
      for (const geometry of [lineGeo, nodeGeo, tipGeo, packetGeo, orbitGeo]) geometry.dispose()
      for (const material of [lineMat, nodeMat, tipMat, packetMat, orbitMat, coreMat]) material.dispose()
      dotTexture.dispose()
      glowTexture.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
      canvas.remove()
    },
  }
}
