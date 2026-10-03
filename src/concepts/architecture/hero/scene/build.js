import { cachedGeometry } from '../../model/geometry.js'
import { PORT_X, PORT_Z, layers } from '../../model/layers.js'
import { MARKER } from '../paths.js'

// The scene's vertex data as plain typed arrays, built from the same model the SVG drawing uses. No three
// here, so it is tested in node and the segment order (slab outline first) is the draw-on order.

/** Flat linework: x1 y1 z1 x2 y2 z2 per segment, on the layer's plane (y = 0 in layer space). */
export function flatSegments(layer) {
  const g = cachedGeometry(layer)
  const out = new Float32Array(g.flat.length * 6)
  g.flat.forEach(([x1, z1, x2, z2], i) => out.set([x1, 0, z1, x2, 0, z2], i * 6))
  return out
}

/** Extrusion edges at full height; the scene scales them in y by the `depth` parameter. */
export function raisedSegments(layer) {
  const g = cachedGeometry(layer)
  const out = new Float32Array(g.raised.length * 6)
  g.raised.forEach((s, i) => out.set(s, i * 6))
  return out
}

const squares = () => PORT_X.map((x) => [x - MARKER, x + MARKER, PORT_Z - MARKER, PORT_Z + MARKER])

/** The four port markers as triangles (two per square) for the yellow fill. */
export function markerTriangles() {
  const out = []
  for (const [x0, x1, z0, z1] of squares()) {
    out.push(x0, 0, z0, x1, 0, z0, x1, 0, z1, x0, 0, z0, x1, 0, z1, x0, 0, z1)
  }
  return new Float32Array(out)
}

/** The same squares as outline segments. */
export function markerEdges() {
  const out = []
  for (const [x0, x1, z0, z1] of squares()) {
    const c = [[x0, z0], [x1, z0], [x1, z1], [x0, z1]]
    for (let i = 0; i < 4; i += 1) out.push(c[i][0], 0, c[i][1], c[(i + 1) % 4][0], 0, c[(i + 1) % 4][1])
  }
  return new Float32Array(out)
}

/** One gap's four vertical connectors, drawn from y = 0 down to y = -1; the scene scales them by gap * connect. */
export function connectorSegments() {
  const out = []
  for (const x of PORT_X) out.push(x, 0, PORT_Z, x, -1, PORT_Z)
  return new Float32Array(out)
}

export const layerData = layers.map((layer) => ({
  id: layer.id,
  flat: flatSegments(layer),
  raised: raisedSegments(layer),
}))
