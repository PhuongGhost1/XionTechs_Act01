import { BufferAttribute } from 'three/src/core/BufferAttribute.js'
import { BufferGeometry } from 'three/src/core/BufferGeometry.js'
import { InstancedBufferAttribute } from 'three/src/core/InstancedBufferAttribute.js'
import { InstancedBufferGeometry } from 'three/src/core/InstancedBufferGeometry.js'
import { ShaderMaterial } from 'three/src/materials/ShaderMaterial.js'
import { PerspectiveCamera } from 'three/src/cameras/PerspectiveCamera.js'
import { Group } from 'three/src/objects/Group.js'
import { LineSegments } from 'three/src/objects/LineSegments.js'
import { Mesh } from 'three/src/objects/Mesh.js'
import { Points } from 'three/src/objects/Points.js'
import { WebGLRenderer } from 'three/src/renderers/WebGLRenderer.js'
import { Scene } from 'three/src/scenes/Scene.js'
import { QUAD, buildSceneData } from './buffers.js'
import {
  HALO_FRAG,
  HALO_VERT,
  LINES_FRAG,
  LINES_VERT,
  ORBITERS_FRAG,
  ORBITERS_VERT,
  PACKETS_FRAG,
  PACKETS_VERT,
  POINTS_FRAG,
  POINTS_VERT,
} from './shaders.js'

// The one WebGL scene of the page (doc 6.3): vanilla three.js, deep imports only, five draw calls,
// no post-processing. One point pool morphs between the five layouts in the vertex shader; the
// CPU only updates uniforms. Position and size come from the DOM anchor's rect (single source),
// the camera is set so that z = 0 maps to CSS pixels.
//
//   createCore({ canvas, graph, tier, tokens, sample, idle, viewport, renderer, raf, caf, now })
//     tokens    { ink, ink2, ink3, signal: [r,g,b] 0..1, ghost, hair: [r,g,b,a] } read from the CSS tokens
//     sample    (state) => void, fills { k, alpha, active, flow, still, hasRect, cx, cy, w, h, yaw, pitch }
//               in place each frame (no allocation); without it setUniforms / setAnchorRect drive the scene
//     idle      (state) => boolean, true to stop the loop after the frame (it wakes with wake())
//     viewport  () => { width, height, dpr }
//     renderer  inject a renderer (tests); otherwise a WebGLRenderer on `canvas`
//   returns { start, stop, wake, frame, resize, setTier, setUniforms, setAnchorRect, on, dispose, scene, group, state }
//   events: 'painted' (first frame on screen), 'lost' (context lost), 'error'

const FOV = 20
const PACKET_PERIOD = 2.4 // seconds per edge at flow 1 (doc 6.1)
const ACTIVE_RAMP = 0.16 // seconds, the arm cross-fade
const TAU = Math.PI * 2
const IDLE_YAW = (5 * Math.PI) / 180 // +-5 degrees over 40 s (M02)
const BREATH = 0.015 // +-1.5 % over 8 s (M02)

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v)

const makeUniforms = (tokens) => ({
  uK: { value: 0 },
  uMix: { value: 0 },
  uAlpha: { value: 1 },
  uActive: { value: -1 },
  uPrev: { value: -1 },
  uActiveMix: { value: 1 },
  uDpr: { value: 1 },
  uCamD: { value: 1000 },
  uTime: { value: 0 },
  uClock: { value: 0 },
  uInk: { value: tokens.ink },
  uInk2: { value: tokens.ink2 },
  uInk3: { value: tokens.ink3 },
  uSignal: { value: tokens.signal },
  uGhost: { value: tokens.ghost },
  uHair: { value: tokens.hair },
  uCoreA: { value: [0, 0, 0] },
  uCoreB: { value: [0, 0, 0] },
})

const material = (uniforms, vertexShader, fragmentShader) =>
  new ShaderMaterial({ uniforms, vertexShader, fragmentShader, transparent: true, depthTest: false, depthWrite: false })

const f32 = (arr, size) => new BufferAttribute(new Float32Array(arr), size)

export function createCore({
  canvas,
  graph,
  tier = 'high',
  tokens,
  sample,
  idle,
  viewport = () => ({ width: window.innerWidth, height: window.innerHeight, dpr: window.devicePixelRatio || 1 }),
  renderer: injected,
  raf = (fn) => requestAnimationFrame(fn),
  caf = (id) => cancelAnimationFrame(id),
  now = () => performance.now(),
}) {
  const listeners = { painted: [], lost: [], error: [] }
  const emit = (name, arg) => listeners[name].forEach((fn) => fn(arg))

  const renderer = injected ?? new WebGLRenderer({ canvas, alpha: true, antialias: false, stencil: false, depth: false, powerPreference: 'high-performance' })
  renderer.setClearColor(0x000000, 0)
  const scene = new Scene()
  const camera = new PerspectiveCamera(FOV, 1, 1, 10000)
  const group = new Group()
  scene.add(group)
  const U = makeUniforms(tokens)

  // The live state: written by `sample` (or setUniforms) and read by frame(). One object, reused.
  const state = {
    k: 0,
    alpha: 1,
    active: -1,
    flow: 1,
    still: false,
    hasRect: false,
    cx: 0,
    cy: 0,
    w: 1,
    h: 1,
    yaw: 0,
    pitch: 0,
  }

  let tierNow = tier
  let data = null
  let objects = null
  let pair = -1 // layout index whose attributes are loaded as `from`
  let vw = 1
  let vh = 1
  let dprEff = 1
  let running = false
  let rafId = 0
  let last = 0
  let time = 0
  let painted = false
  let frames = 0
  let activeSince = -1e9
  let disposed = false

  // -- scene objects -------------------------------------------------------------------------------

  function build() {
    data = buildSceneData(graph, tierNow)
    const { spec } = data
    const o = {}

    // Points: one pool, the glyphs and the braid. `position` shares aFrom's buffer: three needs it.
    const pg = new BufferGeometry()
    o.pFrom = new BufferAttribute(new Float32Array(data.n * 3), 3)
    o.pTo = new BufferAttribute(new Float32Array(data.n * 3), 3)
    pg.setAttribute('position', o.pFrom)
    pg.setAttribute('aFrom', o.pFrom)
    pg.setAttribute('aTo', o.pTo)
    pg.setAttribute('aDelay', f32(data.points.delay, 1))
    pg.setAttribute('aKind', f32(data.points.kind, 1))
    pg.setAttribute('aEvidence', f32(data.points.evidence, 1))
    pg.setAttribute('aArm', f32(data.points.arm, 1))
    pg.setAttribute('aTone', f32(data.points.tone, 1))
    pg.setAttribute('aSeed', f32(data.points.seed, 1))
    o.points = new Points(pg, material(U, POINTS_VERT, POINTS_FRAG))

    // Ghost lines and braid strands.
    const lg = new BufferGeometry()
    o.lFrom = new BufferAttribute(new Float32Array(data.lines.count * 3), 3)
    o.lTo = new BufferAttribute(new Float32Array(data.lines.count * 3), 3)
    lg.setAttribute('position', o.lFrom)
    lg.setAttribute('aFrom', o.lFrom)
    lg.setAttribute('aTo', o.lTo)
    lg.setAttribute('aDelay', f32(data.lines.delay, 1))
    lg.setAttribute('aKindE', f32(data.lines.kind, 1))
    lg.setAttribute('aArm', f32(data.lines.arm, 1))
    lg.setAttribute('aT', f32(data.lines.t, 1))
    o.lines = new LineSegments(lg, material(U, LINES_VERT, LINES_FRAG))

    // Packets: one quad per dash, instanced. The path is read from two attribute triples (the
    // layout pair), swapped with the points.
    const kg = new InstancedBufferGeometry()
    kg.setIndex(new BufferAttribute(QUAD.index, 1))
    kg.setAttribute('position', new BufferAttribute(QUAD.position, 3))
    const inst = (name, size) => {
      const a = new InstancedBufferAttribute(new Float32Array(data.packets.count * size), size)
      kg.setAttribute(name, a)
      return a
    }
    o.kA = [inst('aA0', 3), inst('aAc', 3), inst('aA1', 3)]
    o.kB = [inst('aB0', 3), inst('aBc', 3), inst('aB1', 3)]
    kg.setAttribute('aPhase', new InstancedBufferAttribute(data.packets.phase, 1))
    kg.setAttribute('aArm', new InstancedBufferAttribute(data.packets.arm, 1))
    kg.setAttribute('aIdx', new InstancedBufferAttribute(Float32Array.from({ length: data.packets.count }, (_, i) => i), 1))
    kg.instanceCount = data.packets.count
    o.packets = new Mesh(kg, material(U, PACKETS_VERT, PACKETS_FRAG))

    // Orbiters (high tier) and the halo (high tier): the doc's draw calls four and five.
    if (spec.orbiters > 0) {
      const og = new BufferGeometry()
      og.setAttribute('position', new BufferAttribute(new Float32Array(spec.orbiters * 3), 3))
      og.setAttribute('aPhase', f32(data.orbiters.phase, 1))
      og.setAttribute('aRx', f32(data.orbiters.rx, 1))
      og.setAttribute('aRy', f32(data.orbiters.ry, 1))
      og.setAttribute('aTilt', f32(data.orbiters.tilt, 1))
      og.setAttribute('aSpeed', f32(data.orbiters.speed, 1))
      o.orbiters = new Points(og, material(U, ORBITERS_VERT, ORBITERS_FRAG))
    }
    if (spec.halo) {
      const hg = new BufferGeometry()
      hg.setAttribute('position', new BufferAttribute(new Float32Array(3), 3))
      o.halo = new Points(hg, material(U, HALO_VERT, HALO_FRAG))
    }

    // Draw order: halo behind everything, then lines, points, packets, orbiters.
    const order = [o.halo, o.lines, o.points, o.packets, o.orbiters].filter(Boolean)
    order.forEach((obj, i) => {
      obj.frustumCulled = false
      obj.renderOrder = i
      group.add(obj)
    })
    o.all = order
    objects = o
    pair = -1
    loadPair(0)
  }

  function unbuild() {
    if (!objects) return
    for (const obj of objects.all) {
      group.remove(obj)
      obj.geometry.dispose()
      obj.material.dispose()
    }
    objects = null
  }

  // Swap the two attribute sets when floor(k) changes. Typed-array set + needsUpdate: never per frame.
  function loadPair(li) {
    if (li === pair || !objects) return
    pair = li
    const { points, lines, packets, corePos } = data
    objects.pFrom.array.set(points.pos[li])
    objects.pTo.array.set(points.pos[li + 1])
    objects.pFrom.needsUpdate = true
    objects.pTo.needsUpdate = true
    objects.lFrom.array.set(lines.pos[li])
    objects.lTo.array.set(lines.pos[li + 1])
    objects.lFrom.needsUpdate = true
    objects.lTo.needsUpdate = true
    const keys = ['p0', 'c', 'p1']
    for (let q = 0; q < 3; q += 1) {
      objects.kA[q].array.set(packets.curve[li][keys[q]])
      objects.kB[q].array.set(packets.curve[li + 1][keys[q]])
      objects.kA[q].needsUpdate = true
      objects.kB[q].needsUpdate = true
    }
    for (let q = 0; q < 3; q += 1) {
      U.uCoreA.value[q] = corePos[li][q]
      U.uCoreB.value[q] = corePos[li + 1][q]
    }
  }

  // -- size and camera --------------------------------------------------------------------------------

  function resize(width, height, dpr = 1) {
    vw = Math.max(1, width)
    vh = Math.max(1, height)
    const spec = data.spec
    dprEff = Math.min(dpr, spec.dpr)
    // Render pixel cap (doc 6.2): shrink the pixel ratio, never the CSS size.
    if (vw * vh * dprEff * dprEff > spec.mp) dprEff = Math.sqrt(spec.mp / (vw * vh))
    renderer.setPixelRatio(dprEff)
    renderer.setSize(vw, vh, false)
    // z = 0 maps to CSS px: distance so that the plane at z = 0 is exactly vh tall.
    const d = vh / 2 / Math.tan((FOV * Math.PI) / 360)
    camera.aspect = vw / vh
    camera.position.set(0, 0, d)
    camera.near = d * 0.2
    camera.far = d * 3
    camera.updateProjectionMatrix()
    U.uDpr.value = dprEff
    U.uCamD.value = d
  }

  // -- the frame -----------------------------------------------------------------------------------------

  const fitW = (li, w, h) => (data.fit[li] === 'stretch' ? w : Math.min(w, h))
  const fitH = (li, w, h) => (data.fit[li] === 'stretch' ? h : Math.min(w, h))

  function frame(nowMs = now()) {
    if (disposed || !objects) return
    const dt = last ? Math.min(0.1, (nowMs - last) / 1000) : 0
    last = nowMs
    if (sample) sample(state)

    // Layout pair and progress inside it.
    const k = state.k < 0 ? 0 : state.k > 4 ? 4 : state.k
    const li = k >= 4 ? 3 : Math.floor(k)
    loadPair(li)
    const mix = k >= 4 ? 1 : k - li
    U.uK.value = k
    U.uMix.value = mix
    U.uAlpha.value = clamp01(state.alpha)

    // The lit arm, with a 160 ms cross-fade from the previous one.
    if (state.active !== U.uActive.value) {
      U.uPrev.value = U.uActive.value
      U.uActive.value = state.active
      activeSince = nowMs
    }
    U.uActiveMix.value = clamp01((nowMs - activeSince) / 1000 / ACTIVE_RAMP)

    // Time: idle motion and packets stop under data-motion=off (state.still) but never the frame.
    if (!state.still) {
      time += dt
      U.uClock.value = (U.uClock.value + (dt * state.flow) / PACKET_PERIOD) % 1000
    }
    U.uTime.value = time

    // Placement: the group sits at the anchor rect, scaled to it (square layouts fit the short side).
    const e = mix * mix * (3 - 2 * mix)
    const sx = fitW(li, state.w, state.h) * (1 - e) + fitW(li + 1, state.w, state.h) * e
    const sy = fitH(li, state.w, state.h) * (1 - e) + fitH(li + 1, state.w, state.h) * e
    const breath = state.still || !data.spec.orbiters ? 1 : 1 + BREATH * Math.sin((TAU * time) / 8)
    group.position.set(state.cx - vw / 2, vh / 2 - state.cy, 0)
    group.scale.set(sx * breath, sy * breath, Math.min(sx, sy) * breath)
    group.rotation.y = (state.still ? 0 : IDLE_YAW * Math.sin((TAU * time) / 40)) + state.yaw
    group.rotation.x = state.pitch

    renderer.render(scene, camera)
    frames += 1
    if (!painted) {
      painted = true
      // After the browser has actually presented this frame.
      raf(() => {
        if (!disposed) emit('painted')
      })
    }
  }

  function loop(t) {
    rafId = 0
    if (!running) return
    frame(t)
    if (idle && idle(state)) {
      running = false
      last = 0
      return
    }
    rafId = raf(loop)
  }

  const api = {
    scene,
    group,
    state,
    camera,
    renderer,
    get tier() {
      return tierNow
    },
    get frames() {
      return frames
    },
    get running() {
      return running
    },
    get data() {
      return data
    },
    start() {
      if (running || disposed) return
      running = true
      last = 0
      rafId = raf(loop)
    },
    stop() {
      running = false
      if (rafId) caf(rafId)
      rafId = 0
      last = 0
    },
    /** Re-reads the sources and says whether the loop has nothing to draw (the idle test). */
    probe() {
      if (sample) sample(state)
      return idle ? idle(state) : false
    },
    /** Restart the loop if it stopped because it was idle and there is something to draw now. */
    wake() {
      if (running || disposed) return
      if (!this.probe()) this.start()
    },
    frame,
    resize,
    /** Drop to a cheaper tier: rebuild the buffers for it (an event, never per frame). */
    setTier(next) {
      if (next === tierNow || disposed) return
      tierNow = next
      unbuild()
      build()
      resize(vw, vh, viewport().dpr)
    },
    setUniforms({ k, alpha, active, flow, pointer } = {}) {
      if (k !== undefined) state.k = k
      if (alpha !== undefined) state.alpha = alpha
      if (active !== undefined) state.active = active
      if (flow !== undefined) state.flow = flow
      if (pointer) {
        state.yaw = pointer.yaw ?? 0
        state.pitch = pointer.pitch ?? 0
      }
    },
    setAnchorRect(rect) {
      state.hasRect = Boolean(rect)
      if (!rect) return
      state.cx = rect.x + rect.width / 2
      state.cy = rect.y + rect.height / 2
      state.w = rect.width
      state.h = rect.height
    },
    on(name, fn) {
      listeners[name]?.push(fn)
      return () => {
        const i = listeners[name].indexOf(fn)
        if (i >= 0) listeners[name].splice(i, 1)
      }
    },
    /** The context was lost (the canvas event, or a test): stop and tell the owner. */
    lose() {
      this.stop()
      emit('lost')
    },
    dispose() {
      if (disposed) return
      this.stop()
      disposed = true
      unbuild()
      renderer.dispose?.()
      listeners.painted.length = 0
      listeners.lost.length = 0
      listeners.error.length = 0
    },
  }

  build()
  const v = viewport()
  resize(v.width, v.height, v.dpr)
  return api
}
