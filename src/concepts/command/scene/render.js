// WebGL renderer for the X data core. Plain three.js with named imports, loaded only through a dynamic
// import from hero/XCore.jsx so it lands in its own chunk.
//
// Five draw calls: edges (LineSegments), nodes (Points), packets (Points), orbiting particles (Points,
// orbits computed in the vertex shader) and the yellow core (one quad with a radial falloff).
// All geometry is built once; the frame loop only writes into existing typed arrays.
import {
  AddEquation,
  BufferAttribute,
  BufferGeometry,
  CustomBlending,
  DynamicDrawUsage,
  Group,
  LineSegments,
  Mesh,
  OneFactor,
  PerspectiveCamera,
  PlaneGeometry,
  Points,
  Scene,
  ShaderMaterial,
  WebGLRenderer,
} from 'three'
import { live, store } from '../state/store.js'
import {
  EDGE_CANDIDATE,
  EDGE_LATERAL,
  SPLIT_GAIN,
  armOfModule,
  buildGraph,
  cameraForAspect,
  clamp01,
} from './graph.js'
import { createLinkScheduler, createPacketPool, easeToward, flowSpeed, packetPosition, stepLinks, stepPackets } from './flow.js'
import { qualityProfile } from './quality.js'

// "143 163 186" (the CSS token format) to [r, g, b] in 0..1, or null.
export function parseChannels(text) {
  const parts = String(text).trim().split(/\s+/).map(Number)
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return null
  return parts.map((n) => n / 255)
}

function readToken(name) {
  return parseChannels(getComputedStyle(document.documentElement).getPropertyValue(name))
}

// ------------------------------------------------------------------ shaders
// Output is premultiplied alpha with additive blending, so the transparent canvas composites cleanly
// over the page background. Raw sRGB values from the CSS tokens go straight to the canvas.
const HEAD = /* glsl */ `
uniform float uSplit;
uniform float uGain;
uniform float uPulse;
uniform float uPulseArm;
uniform float uPx;
uniform float uDist;
uniform float uTime;
float pulseOf(float arm) { return abs(arm - uPulseArm) < 0.5 ? uPulse : 0.0; }
`

const LINE_VERT = /* glsl */ `
${HEAD}
attribute float aT;
attribute float aArm;
attribute float aAlpha;
varying float vAlpha;
varying float vPulse;
void main() {
  vec3 p = position;
  p.xy *= 1.0 + uGain * uSplit * aT;
  vPulse = pulseOf(aArm);
  vAlpha = aAlpha * (1.0 - uSplit * 0.6 * (1.0 - smoothstep(0.0, 0.5, aT)));
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
`
const LINE_FRAG = /* glsl */ `
uniform vec3 uFaint;
uniform vec3 uSignal;
uniform float uLineAlpha;
varying float vAlpha;
varying float vPulse;
void main() {
  float a = clamp(uLineAlpha * vAlpha * (1.0 + vPulse * 1.8), 0.0, 1.0);
  gl_FragColor = vec4(mix(uFaint, uSignal, vPulse) * a, a);
}
`

const NODE_VERT = /* glsl */ `
${HEAD}
attribute float aT;
attribute float aArm;
attribute float aSize;
varying float vPulse;
varying float vHub;
void main() {
  vec3 p = position;
  p.xy *= 1.0 + uGain * uSplit * aT;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vPulse = pulseOf(aArm);
  vHub = aT < 0.001 ? 1.0 : 0.0;
  gl_PointSize = aSize * uPx * (1.0 + vPulse * 0.55) * (uDist / -mv.z);
  gl_Position = projectionMatrix * mv;
}
`
const NODE_FRAG = /* glsl */ `
uniform vec3 uMute;
uniform vec3 uSignal;
uniform vec3 uText;
uniform float uSplit;
varying float vPulse;
varying float vHub;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float disc = 1.0 - smoothstep(0.36, 0.5, d);
  vec3 c = mix(mix(uMute, uText, vHub), uSignal, vPulse);
  float a = clamp(disc * 0.92 * (1.0 - vHub * uSplit * 0.75), 0.0, 1.0);
  gl_FragColor = vec4(c * a, a);
}
`

const ORBIT_VERT = /* glsl */ `
${HEAD}
attribute float aT;
attribute float aArm;
attribute vec3 aU;
attribute vec3 aV;
attribute vec3 aOrb; // radius, angular speed, phase
varying float vPulse;
void main() {
  vec3 centre = position;
  centre.xy *= 1.0 + uGain * uSplit * aT;
  float ang = aOrb.z + uTime * aOrb.y;
  vec3 p = centre + (aU * cos(ang) + aV * sin(ang)) * aOrb.x * (1.0 + uSplit * 0.35);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vPulse = pulseOf(aArm);
  gl_PointSize = (2.2 + vPulse * 1.4) * uPx * (uDist / -mv.z);
  gl_Position = projectionMatrix * mv;
}
`
const ORBIT_FRAG = /* glsl */ `
uniform vec3 uMute;
uniform vec3 uSignal;
varying float vPulse;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = (1.0 - smoothstep(0.3, 0.5, d)) * (0.7 + vPulse * 0.3);
  gl_FragColor = vec4(mix(uMute, uSignal, vPulse) * a, a);
}
`

const PACKET_VERT = /* glsl */ `
${HEAD}
attribute float aU;
attribute float aArm;
varying float vLife;
varying float vPulse;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vPulse = pulseOf(aArm);
  vLife = sin(3.14159265 * clamp(aU, 0.0, 1.0)); // fades in and out along each edge
  gl_PointSize = 12.0 * uPx * (1.0 + vPulse * 0.7) * (uDist / -mv.z);
  gl_Position = projectionMatrix * mv;
}
`
const PACKET_FRAG = /* glsl */ `
uniform vec3 uSignal;
uniform float uPulse;
varying float vLife;
varying float vPulse;
void main() {
  float d = length(gl_PointCoord - 0.5) * 2.0;
  float glow = pow(clamp(1.0 - d, 0.0, 1.0), 2.2);
  float dim = mix(1.0 - 0.3 * uPulse, 1.0, vPulse);
  float a = clamp(glow * vLife * dim * (0.85 + vPulse * 0.4), 0.0, 1.0);
  gl_FragColor = vec4(uSignal * a, a);
}
`

const CORE_VERT = /* glsl */ `
uniform float uCoreSize;
varying vec2 vUv;
void main() {
  vUv = position.xy;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position.xy * uCoreSize, 0.0, 1.0);
}
`
const CORE_FRAG = /* glsl */ `
uniform vec3 uSignal;
uniform vec3 uText;
uniform float uTime;
uniform float uSplit;
varying vec2 vUv;
void main() {
  float r = length(vUv);
  float breath = 0.5 + 0.5 * sin(uTime * 0.9);
  float pt = 1.0 - smoothstep(0.05, 0.1, r);
  float glow = exp(-r * r * 9.0) * (0.3 + 0.2 * breath) * (1.0 - smoothstep(0.75, 1.0, r));
  float a = clamp((pt + glow) * (1.0 - uSplit * 0.8), 0.0, 1.0);
  vec3 c = mix(uSignal, uText, pt * 0.35);
  gl_FragColor = vec4(c * a, a);
}
`

function makeMaterial(vertexShader, fragmentShader, uniforms) {
  return new ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: CustomBlending, // additive on premultiplied colour
    blendEquation: AddEquation,
    blendSrc: OneFactor,
    blendDst: OneFactor,
    blendSrcAlpha: OneFactor,
    blendDstAlpha: OneFactor,
  })
}

const attr = (array, size, dynamic = false) => {
  const a = new BufferAttribute(array, size)
  if (dynamic) a.setUsage(DynamicDrawUsage)
  return a
}

const NODE_SIZE = [4.4, 5, 4.4, 7.5] // by depth level, the last is the arm tip
const HUB_SIZE = 6.5

// ------------------------------------------------------------------ scene
export function createScene(
  canvas,
  { quality = 'high', onFail = () => {}, onReady = () => {}, onFrame = () => {}, onQuality = () => {} } = {},
) {
  const tokens = {
    faint: readToken('--x-faint'),
    mute: readToken('--x-mute'),
    signal: readToken('--x-signal'),
    text: readToken('--x-text'),
  }
  if (Object.values(tokens).some((t) => !t)) {
    onFail()
    return { dispose() {} }
  }

  let renderer
  let q = quality === 'low' ? 'low' : 'high'
  let prof = qualityProfile(q, window.devicePixelRatio)
  try {
    renderer = new WebGLRenderer({
      canvas,
      antialias: prof.antialias, // fixed for the life of the context; a later drop to low cannot change it
      alpha: true,
      depth: false,
      stencil: false,
      premultipliedAlpha: true,
      powerPreference: prof.powerPreference,
    })
  } catch {
    onFail()
    return { dispose() {} }
  }
  renderer.setClearAlpha(0)

  const g = buildGraph()
  const scene = new Scene()
  const group = new Group()
  scene.add(group)
  const camera = new PerspectiveCamera(30, 1, 0.1, 30)

  const U = {
    uTime: { value: 0 },
    uSplit: { value: 0 },
    uGain: { value: SPLIT_GAIN },
    uPulse: { value: 0 },
    uPulseArm: { value: -5 },
    uPx: { value: prof.pixelRatio },
    uDist: { value: 6 },
    uFaint: { value: tokens.faint },
    uMute: { value: tokens.mute },
    uSignal: { value: tokens.signal },
    uText: { value: tokens.text },
    uLineAlpha: { value: 0.5 },
    uCoreSize: { value: 0.3 },
  }
  const disposables = []
  const track = (...objs) => disposables.push(...objs)

  // edges: two vertices per edge, per-vertex alpha is rewritten for the cross-links
  const E = g.edgeCount
  const linePos = new Float32Array(E * 6)
  const lineT = new Float32Array(E * 2)
  const lineArm = new Float32Array(E * 2)
  const lineAlpha = new Float32Array(E * 2)
  for (let e = 0; e < E; e++) {
    const ends = [g.edgeA[e], g.edgeB[e]]
    for (let k = 0; k < 2; k++) {
      const n = ends[k]
      const v = e * 2 + k
      linePos.set(g.positions.subarray(n * 3, n * 3 + 3), v * 3)
      lineT[v] = g.nodeT[n]
      lineArm[v] = g.edgeArm[e]
      lineAlpha[v] = g.edgeKind[e] === EDGE_LATERAL ? 0.55 : g.edgeKind[e] === EDGE_CANDIDATE ? 0 : 1
    }
  }
  const lineGeo = new BufferGeometry()
  lineGeo.setAttribute('position', attr(linePos, 3))
  lineGeo.setAttribute('aT', attr(lineT, 1))
  lineGeo.setAttribute('aArm', attr(lineArm, 1))
  const lineAlphaAttr = attr(lineAlpha, 1, true)
  lineGeo.setAttribute('aAlpha', lineAlphaAttr)
  const lineMat = makeMaterial(LINE_VERT, LINE_FRAG, U)
  const lines = new LineSegments(lineGeo, lineMat)

  // nodes
  const nodeSize = new Float32Array(g.nodeCount)
  const nodeArm = new Float32Array(g.nodeCount)
  for (let n = 0; n < g.nodeCount; n++) {
    nodeSize[n] = n === 0 ? HUB_SIZE : NODE_SIZE[g.nodeLevel[n]]
    nodeArm[n] = g.nodeArm[n]
  }
  const nodeGeo = new BufferGeometry()
  nodeGeo.setAttribute('position', attr(g.positions, 3))
  nodeGeo.setAttribute('aT', attr(g.nodeT, 1))
  nodeGeo.setAttribute('aArm', attr(nodeArm, 1))
  nodeGeo.setAttribute('aSize', attr(nodeSize, 1))
  const nodeMat = makeMaterial(NODE_VERT, NODE_FRAG, U)
  const nodes = new Points(nodeGeo, nodeMat)

  // orbiting particles: everything about an orbit is an attribute, the shader moves them
  const O = qualityProfile('high').orbitParticles
  const oPos = new Float32Array(O * 3)
  const oT = new Float32Array(O)
  const oArm = new Float32Array(O)
  const oU = new Float32Array(O * 3)
  const oV = new Float32Array(O * 3)
  const oOrb = new Float32Array(O * 3)
  for (let i = 0; i < O; i++) {
    const hub = Math.random() < 0.22
    const n = hub ? 0 : 1 + Math.floor(Math.random() * (g.nodeCount - 1))
    oPos.set(g.positions.subarray(n * 3, n * 3 + 3), i * 3)
    oT[i] = g.nodeT[n]
    oArm[i] = g.nodeArm[n]
    // an orbit plane from a random normal: u = normalise(normal x e), v = normal x u
    let nx = Math.random() - 0.5
    let ny = Math.random() - 0.5
    let nz = Math.random() - 0.5
    const nl = Math.hypot(nx, ny, nz) || 1
    nx /= nl
    ny /= nl
    nz /= nl
    let ux = ny
    let uy = -nx
    let uz = 0 // normal x z-axis
    const ul = Math.hypot(ux, uy, uz) || 1
    ux /= ul
    uy /= ul
    uz /= ul
    oU.set([ux, uy, uz], i * 3)
    oV.set([ny * uz - nz * uy, nz * ux - nx * uz, nx * uy - ny * ux], i * 3)
    const radius = hub ? 0.16 + Math.random() * 0.16 : 0.045 + Math.random() * 0.075
    const speed = (0.35 + Math.random() * 1.0) * (Math.random() < 0.5 ? -1 : 1)
    oOrb.set([radius, speed, Math.random() * Math.PI * 2], i * 3)
  }
  const orbitGeo = new BufferGeometry()
  orbitGeo.setAttribute('position', attr(oPos, 3))
  orbitGeo.setAttribute('aT', attr(oT, 1))
  orbitGeo.setAttribute('aArm', attr(oArm, 1))
  orbitGeo.setAttribute('aU', attr(oU, 3))
  orbitGeo.setAttribute('aV', attr(oV, 3))
  orbitGeo.setAttribute('aOrb', attr(oOrb, 3))
  const orbitMat = makeMaterial(ORBIT_VERT, ORBIT_FRAG, U)
  const orbits = new Points(orbitGeo, orbitMat)

  // packets
  const P = qualityProfile('high').packets
  const pool = createPacketPool(g, P)
  const pPos = new Float32Array(P * 3)
  const pU = new Float32Array(P)
  const pArm = new Float32Array(P)
  const packetGeo = new BufferGeometry()
  const pPosAttr = attr(pPos, 3, true)
  const pUAttr = attr(pU, 1, true)
  const pArmAttr = attr(pArm, 1, true)
  packetGeo.setAttribute('position', pPosAttr)
  packetGeo.setAttribute('aU', pUAttr)
  packetGeo.setAttribute('aArm', pArmAttr)
  const packetMat = makeMaterial(PACKET_VERT, PACKET_FRAG, U)
  const packets = new Points(packetGeo, packetMat)

  // core
  const coreGeo = new PlaneGeometry(2, 2)
  const coreMat = makeMaterial(CORE_VERT, CORE_FRAG, U)
  const core = new Mesh(coreGeo, coreMat)

  for (const o of [lines, nodes, orbits, packets, core]) {
    o.frustumCulled = false // the vertex shader moves vertices, so the bounding sphere is not valid
    group.add(o)
  }
  track(lineGeo, lineMat, nodeGeo, nodeMat, orbitGeo, orbitMat, packetGeo, packetMat, coreGeo, coreMat)

  const links = createLinkScheduler(g.candidateCount, 4)
  const linkAlphas = new Float32Array(g.candidateCount)

  // ---------------------------------------------------------------- state
  let simTime = 0
  let split = 0
  let boost = 0
  let px = 0
  let py = 0
  let pulse = 0
  let pulseArm = -5
  let width = 1
  let height = 1
  let aspect = 1
  let running = false
  let raf = 0
  let last = 0
  let inView = typeof IntersectionObserver === 'undefined'
  let hidden = document.visibilityState === 'hidden'
  let lost = false
  let disposed = false
  let readyFired = false
  let lostTimer = 0
  const probe = { warm: 0, frames: 0, time: 0, done: false }
  const resetProbe = () => {
    probe.warm = 0
    probe.frames = 0
    probe.time = 0
  }

  function frame(dtRaw) {
    const dt = Math.min(Math.max(dtRaw, 0), 0.05)
    simTime += dt
    split = easeToward(split, clamp01(live.split), dt, 5)
    boost = easeToward(boost, clamp01(live.flowBoost), dt, 4)
    px = easeToward(px, live.pointerX, dt, 3)
    py = easeToward(py, live.pointerY, dt, 3)
    const wantArm = armOfModule(live.pulseModule)
    if (wantArm >= 0) pulseArm = wantArm
    pulse = easeToward(pulse, wantArm >= 0 ? 1 : 0, dt, 6)
    if (pulse < 0.003 && wantArm < 0) pulseArm = -5

    U.uTime.value = simTime
    U.uSplit.value = split
    U.uPulse.value = pulse
    U.uPulseArm.value = pulseArm

    stepLinks(links, simTime, linkAlphas)
    for (let k = 0; k < g.candidateCount; k++) {
      const v = (g.staticEdgeCount + k) * 2
      lineAlpha[v] = lineAlpha[v + 1] = linkAlphas[k] * 0.75
    }
    lineAlphaAttr.needsUpdate = true

    stepPackets(pool, g, dt, flowSpeed(boost), Math.random, prof.packets)
    for (let i = 0; i < prof.packets; i++) {
      packetPosition(pPos, i * 3, g, pool, i, split)
      pU[i] = pool.u[i]
      pArm[i] = g.edgeArm[pool.edge[i]]
    }
    pPosAttr.needsUpdate = true
    pUAttr.needsUpdate = true
    pArmAttr.needsUpdate = true

    // idle breathing and a slow sway (a full turn would break the X silhouette); the cursor eases it
    group.rotation.y = Math.sin(simTime * 0.15) * 0.05 + px * 0.1
    group.rotation.x = Math.sin(simTime * 0.11) * 0.025 + py * 0.06
    group.scale.setScalar(1 + Math.sin(simTime * 0.5) * 0.012)

    renderer.render(scene, camera)
    if (!readyFired) {
      readyFired = true
      onReady()
    }
    onFrame(split, aspect, width, height)
  }

  function evaluateProbe(dtRaw) {
    if (probe.done) return
    if (dtRaw <= 0 || dtRaw > 0.25) {
      resetProbe() // a stall (tab switch, shader compile) is not a measurement
      return
    }
    if (probe.warm < 10) {
      probe.warm++
      return
    }
    probe.time += dtRaw
    probe.frames++
    if (probe.frames < 60) return
    const fps = probe.frames / probe.time
    resetProbe()
    if (q === 'high' && fps < 40) {
      applyQuality('low')
      onQuality('low')
    } else if (q === 'low' && fps < 30) {
      probe.done = true
      stop()
      onFail()
    } else {
      probe.done = true // fast enough
    }
  }

  function tick(now) {
    if (!running) return
    raf = requestAnimationFrame(tick)
    const dtRaw = (now - last) / 1000
    last = now
    frame(dtRaw)
    evaluateProbe(dtRaw)
  }
  function start() {
    if (running) return
    running = true
    last = performance.now()
    raf = requestAnimationFrame(tick)
  }
  function stop() {
    running = false
    cancelAnimationFrame(raf)
    resetProbe()
  }
  // Decides between running, one still frame (paused) and stopped (off screen, hidden, context lost).
  function sync() {
    if (disposed) return
    if (lost || hidden || !inView) {
      stop()
      return
    }
    if (store.get().paused) {
      stop()
      frame(0)
      return
    }
    start()
  }

  function resize() {
    const parent = canvas.parentElement || canvas
    width = Math.max(1, Math.round(parent.clientWidth))
    height = Math.max(1, Math.round(parent.clientHeight))
    aspect = width / height
    renderer.setPixelRatio(prof.pixelRatio)
    renderer.setSize(width, height, false)
    const cam = cameraForAspect(aspect)
    camera.fov = cam.fov
    camera.aspect = aspect
    camera.position.set(0, 0, cam.distance)
    camera.updateProjectionMatrix()
    U.uPx.value = prof.pixelRatio
    U.uDist.value = cam.distance
    if (!running) sync()
  }

  function applyQuality(next) {
    q = next
    prof = qualityProfile(q, window.devicePixelRatio)
    orbitGeo.setDrawRange(0, prof.orbitParticles)
    packetGeo.setDrawRange(0, prof.packets)
    resize()
  }
  orbitGeo.setDrawRange(0, prof.orbitParticles)
  packetGeo.setDrawRange(0, prof.packets)

  // ---------------------------------------------------------------- listeners
  const ro = new ResizeObserver(resize)
  ro.observe(canvas.parentElement || canvas)
  const io =
    typeof IntersectionObserver === 'undefined'
      ? null
      : new IntersectionObserver((entries) => {
          inView = entries[entries.length - 1].isIntersecting
          sync()
        })
  io?.observe(canvas)
  const onVisibility = () => {
    hidden = document.visibilityState === 'hidden'
    sync()
  }
  document.addEventListener('visibilitychange', onVisibility)
  const offPaused = store.subscribe((s) => s.paused, sync)

  // three.js re-uploads buffers and recompiles programs from the CPU-side arrays after a restore.
  const onLost = (e) => {
    e.preventDefault()
    lost = true
    stop()
    clearTimeout(lostTimer)
    lostTimer = setTimeout(() => {
      if (lost && !disposed) onFail()
    }, 3000)
  }
  const onRestored = () => {
    clearTimeout(lostTimer)
    lost = false
    sync()
  }
  canvas.addEventListener('webglcontextlost', onLost)
  canvas.addEventListener('webglcontextrestored', onRestored)

  resize()

  return {
    dispose() {
      disposed = true
      stop()
      clearTimeout(lostTimer)
      ro.disconnect()
      io?.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      offPaused()
      canvas.removeEventListener('webglcontextlost', onLost)
      canvas.removeEventListener('webglcontextrestored', onRestored)
      for (const d of disposables) d.dispose()
      renderer.dispose()
    },
  }
}
