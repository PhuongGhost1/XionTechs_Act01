import {
  BufferGeometry,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Points,
  PointsMaterial,
  SRGBColorSpace,
  Scene,
  Vector2,
  WebGLRenderer,
} from 'three'
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js'
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js'
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js'
import { LAYER_COUNT, SLAB } from '../../model/layers.js'
import { FOV } from '../camera.js'
import { createProbe } from '../quality.js'
import { layerInk, TRAIL } from '../svgRenderer.js'
import { connectorSegments, layerData, markerEdges, markerTriangles } from './build.js'

// The hero's WebGL scene (Level 3). The same five tracing-paper layers as the SVG drawing, built from the same
// model and seen through the same camera (frame.js -> camera.js), so the canvas can fade in over the SVG
// without the picture moving. Plain three, named imports only, loaded from its own chunk. The scene is a
// driver renderer: it draws whatever frame the driver hands it and owns no clock and no scroll listener.
//
// Transparent sheets: no depth buffer, explicit renderOrder re-sorted back to front every frame (the camera
// moves), so there is nothing to z-fight.

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v)
const STAGGER = 170 // ms, same as the SVG's draw-on
const DRAW_MS = 1400
const READY_AFTER = 2700 // ms after the page started: both renderers have finished plotting by then
const PAPER_OPACITY = 0.68

export function createScene({ canvas, driver, probe = true, onReady, onFail, onLost, onRestored }) {
  let renderer
  try {
    renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true })
  } catch {
    onFail('no-context')
    return { dispose() {} }
  }
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
  renderer.setPixelRatio(dpr)
  renderer.setClearColor(0x000000, 0)

  // Colours come from the page tokens, never from hex in code.
  const style = getComputedStyle(canvas)
  const token = (name, fallback) => {
    const v = style.getPropertyValue(name).trim().split(/\s+/).map(Number)
    const [r, g, b] = v.length === 3 && v.every(Number.isFinite) ? v : fallback
    return new Color().setRGB(r / 255, g / 255, b / 255, SRGBColorSpace)
  }
  const cLine = token('--bp-line', [8, 35, 74])
  const cSignal = token('--bp-signal', [244, 196, 0])
  const cPaper = token('--bp-bg', [247, 246, 241])

  const scene = new Scene()
  const camera = new PerspectiveCamera(FOV, 1, 4, 260)
  const res = new Vector2(1, 1)
  const geometries = []
  const materials = []
  const lineMats = []

  const lineMat = ({ color = cLine, width, opacity = 1 }) => {
    const m = new LineMaterial({ color, linewidth: width, transparent: true, opacity, depthWrite: false, depthTest: false })
    m.resolution = res
    lineMats.push(m)
    materials.push(m)
    return m
  }
  const meshMat = (color, opacity = 1) => {
    // DoubleSide: the marker triangles are wound for a camera below the layer, and the sheets are seen from either side
    const m = new MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, depthTest: false, side: DoubleSide })
    materials.push(m)
    return m
  }
  const lines = (positions, material) => {
    const g = new LineSegmentsGeometry()
    g.setPositions(positions)
    geometries.push(g)
    const o = new LineSegments2(g, material)
    o.frustumCulled = false
    return o
  }
  const triangles = (positions, material) => {
    const g = new BufferGeometry()
    g.setAttribute('position', new Float32BufferAttribute(positions, 3))
    geometries.push(g)
    const o = new Mesh(g, material)
    o.frustumCulled = false
    return o
  }

  const slabGeo = new PlaneGeometry(SLAB.w, SLAB.d).rotateX(-Math.PI / 2)
  geometries.push(slabGeo)
  const tris = markerTriangles()
  const edges = markerEdges()

  // ---- the five layers
  const layers = layerData.map((d, i) => {
    const group = new Group()
    const paper = meshMat(cPaper, 0)
    const fill = new Mesh(slabGeo, paper)
    const OUTLINE = 4 * 6 // the slab outline is the first four segments of the flat linework
    const outline = lines(d.flat.subarray(0, OUTLINE), lineMat({ width: 1.5 }))
    const flatMat = lineMat({ width: 1.15 })
    const flat = lines(d.flat.subarray(OUTLINE), flatMat)
    const raisedMat = lineMat({ width: 1.15 })
    const raised = lines(d.raised, raisedMat)
    const markFillMat = meshMat(cSignal, 0)
    const markFill = triangles(tris, markFillMat)
    const markLineMat = lineMat({ width: 1, opacity: 0 })
    const markLine = lines(edges, markLineMat)
    group.add(fill, outline, flat, raised, markFill, markLine)
    scene.add(group)
    return {
      i,
      group,
      paper,
      fill,
      outline,
      flat,
      flatMat,
      raised,
      raisedMat,
      markFill,
      markFillMat,
      markLine,
      markLineMat,
      counts: { flat: d.flat.length / 6 - 4, raised: d.raised.length / 6 },
    }
  })

  // ---- connectors between layers, and the one signal
  const connMat = lineMat({ width: 1, opacity: 0.8 })
  const conns = Array.from({ length: LAYER_COUNT - 1 }, () => {
    const o = lines(connectorSegments(), connMat)
    scene.add(o)
    return o
  })
  const sigGeo = new BufferGeometry()
  sigGeo.setAttribute('position', new Float32BufferAttribute([0, 0, 0], 3))
  geometries.push(sigGeo)
  const pointMat = (color, size) => {
    const m = new PointsMaterial({ color, size: size * dpr, sizeAttenuation: false, transparent: true, depthWrite: false, depthTest: false })
    materials.push(m)
    return m
  }
  const sigRingMat = pointMat(cLine, 11)
  const sigDotMat = pointMat(cSignal, 8)
  const sigRing = new Points(sigGeo, sigRingMat)
  const sigDot = new Points(sigGeo, sigDotMat)
  const trailMat = lineMat({ color: cSignal, width: 2.5 })
  const trail = lines(new Float32Array([0, 0, 0, 0, 1, 0]), trailMat)
  for (const o of [sigRing, sigDot]) o.frustumCulled = false
  scene.add(sigRing, sigDot, trail)

  // ---- per frame
  let sizeW = 0
  let sizeH = 0
  let lost = false
  let ready = false
  let failed = false
  let lastNow = 0
  const pr = probe ? createProbe() : null

  function resize(W, H) {
    sizeW = W
    sizeH = H
    renderer.setSize(W, H, false)
    res.set(W, H)
    for (const m of lineMats) m.resolution = res
  }

  function render(f) {
    if (lost || failed || f.W < 2 || f.H < 2) return
    if (f.W !== sizeW || f.H !== sizeH) resize(f.W, f.H)
    const cam = f.cam
    const t = f.mode === 'final' ? 1e6 : f.now - f.born // ms since the page started plotting
    const lift = f.params.lift

    camera.up.set(cam.basis.up[0], cam.basis.up[1], cam.basis.up[2])
    camera.position.set(cam.position[0], cam.position[1], cam.position[2])
    camera.lookAt(cam.target[0], cam.target[1], cam.target[2])
    camera.aspect = f.W / f.H
    camera.setViewOffset(f.W, f.H, -cam.ox, -cam.oy, f.W, f.H)

    // Back to front: the layer farthest from the camera first. The order is re-derived every frame.
    const far = f.ys
      .map((y, i) => ({ i, d: (cam.position[1] - y) ** 2 + cam.position[0] ** 2 + cam.position[2] ** 2 }))
      .sort((a, b) => b.d - a.d)
    const rank = []
    far.forEach((e, k) => {
      rank[e.i] = k
    })

    const draw = (ms) => 1 - (1 - clamp01((t - ms) / DRAW_MS)) ** 3
    for (const L of layers) {
      const i = L.i
      const base = rank[i] * 10
      L.group.position.y = f.ys[i]
      const own = i * STAGGER
      const ink = layerInk(i, lift)

      L.paper.opacity = PAPER_OPACITY * clamp01((t - own) / 700)
      L.fill.renderOrder = base
      L.outline.renderOrder = base + 1
      L.flat.renderOrder = base + 2
      L.raised.renderOrder = base + 3
      L.markFill.renderOrder = base + 4
      L.markLine.renderOrder = base + 5

      L.outline.geometry.instanceCount = Math.ceil(draw(own) * 4)
      L.flat.geometry.instanceCount = Math.ceil(draw(own + 220) * L.counts.flat)
      L.flatMat.opacity = ink

      const depth = f.params.depth
      L.raised.visible = depth > 0.015
      L.raised.scale.y = Math.max(depth, 1e-4)
      L.raised.geometry.instanceCount = Math.ceil(draw(own + 220) * L.counts.raised)
      L.raisedMat.opacity = ink

      const marks = clamp01((t - (own + 900)) / 700) * ink
      L.markFillMat.opacity = marks
      L.markLineMat.opacity = marks
    }

    conns.forEach((o, j) => {
      const span = f.ys[j] - f.ys[j + 1]
      o.visible = f.params.connect > 0.01 && span > 0.02
      o.position.y = f.ys[j]
      o.scale.y = Math.max(span * f.params.connect, 1e-4)
      o.renderOrder = rank[j + 1] * 10 + 6
    })

    const s = f.signal
    sigGeo.attributes.position.setXYZ(0, s.x, s.y, 0)
    sigGeo.attributes.position.needsUpdate = true
    const top = Math.min(s.y + TRAIL, f.ys[0])
    trail.position.set(s.x, s.y, 0)
    trail.scale.y = Math.max(top - s.y, 1e-4)
    sigRingMat.opacity = s.alpha
    sigDotMat.opacity = s.alpha
    trailMat.opacity = s.alpha
    const on = s.alpha > 0.01
    sigRing.visible = sigDot.visible = trail.visible = on
    sigRing.renderOrder = 1000
    sigDot.renderOrder = 1001
    trail.renderOrder = 999

    renderer.render(scene, camera)

    if (!ready && !failed) {
      if (pr && lastNow) {
        const v = pr.push(f.now - lastNow)
        if (v && !v.ok) {
          failed = true
          onFail(`slow:${Math.round(v.fps)}fps`)
          return
        }
      }
      lastNow = f.now
      if (t > READY_AFTER && (!pr || (pr.verdict && pr.verdict.ok))) {
        ready = true
        onReady()
      }
    }
  }

  const onLostEvent = (e) => {
    e.preventDefault()
    lost = true
    onLost()
  }
  const onRestoredEvent = () => {
    lost = false
    sizeW = 0
    driver.request()
    onRestored()
  }
  canvas.addEventListener('webglcontextlost', onLostEvent)
  canvas.addEventListener('webglcontextrestored', onRestoredEvent)

  const { W, H } = driver.size
  resize(Math.max(2, W), Math.max(2, H))
  const unregister = driver.add({ render })

  return {
    dispose() {
      unregister()
      canvas.removeEventListener('webglcontextlost', onLostEvent)
      canvas.removeEventListener('webglcontextrestored', onRestoredEvent)
      for (const g of geometries) g.dispose()
      for (const m of materials) m.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
    },
  }
}
