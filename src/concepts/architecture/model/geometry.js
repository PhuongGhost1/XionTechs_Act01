import { PORTS, SLAB } from './layers.js'

// Turns a layer's primitives into line segments. `flat` segments lie on the layer's plane (y = 0);
// `raised` segments carry their full extrusion height in y and are scaled by the `depth` parameter
// (0 = flat drawing, 1 = full relief). Segment order is the draw order, so a renderer can reveal the first
// n of them for the draw-on effect.
//   flat   [x1, z1, x2, z2]
//   raised [x1, y1, z1, x2, y2, z2]

const CIRCLE_STEPS = 20

function rectCorners({ x, z, w, d }) {
  const hw = w / 2
  const hd = d / 2
  return [
    [x - hw, z - hd],
    [x + hw, z - hd],
    [x + hw, z + hd],
    [x - hw, z + hd],
  ]
}

function circlePoints({ x, z, r }) {
  return Array.from({ length: CIRCLE_STEPS }, (_, i) => {
    const a = (i / CIRCLE_STEPS) * Math.PI * 2
    return [x + Math.cos(a) * r, z + Math.sin(a) * r]
  })
}

function ring(points, push) {
  points.forEach((p, i) => push(p, points[(i + 1) % points.length]))
}

export function layerGeometry(layer) {
  const flat = []
  const raised = []
  const nodes = PORTS.map(([x, z]) => [x, z])
  const flatSeg = (a, b) => flat.push([a[0], a[1], b[0], b[1]])

  // The slab outline comes first so it draws first.
  ring(rectCorners({ x: 0, z: 0, w: SLAB.w, d: SLAB.d }), flatSeg)

  for (const p of layer.prims) {
    if (p.t === 'line') {
      for (let i = 0; i < p.pts.length - 1; i++) flatSeg(p.pts[i], p.pts[i + 1])
    } else {
      const pts = p.t === 'cyl' ? circlePoints(p) : rectCorners(p)
      ring(pts, flatSeg)
      if (p.h > 0) {
        ring(pts, (a, b) => raised.push([a[0], p.h, a[1], b[0], p.h, b[1]]))
        // Rects get four vertical edges; drums get two silhouette edges.
        const verts = p.t === 'cyl' ? [pts[0], pts[CIRCLE_STEPS / 2]] : pts
        for (const v of verts) raised.push([v[0], 0, v[1], v[0], p.h, v[1]])
      }
    }
  }
  return { flat, raised, nodes }
}

export const geometryCache = new Map()
export function cachedGeometry(layer) {
  if (!geometryCache.has(layer.id)) geometryCache.set(layer.id, layerGeometry(layer))
  return geometryCache.get(layer.id)
}
