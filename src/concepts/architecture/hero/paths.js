import { cachedGeometry } from '../model/geometry.js'
import { PORT_X, PORT_Z, SLAB } from '../model/layers.js'

// SVG path data for the hero drawing, built from the shared model and projected through the hero camera.
// Consecutive segments that share an end point are chained into one polyline, so rectangles close with proper
// corners instead of four butt-ended strokes.

const EPS = 1e-6
export const MARKER = 0.13 // half the side of a port marker, in plan units

const pt = (q) => `${q[0].toFixed(1)} ${q[1].toFixed(1)}`

/** Flat linework of one layer (everything that lies on its plane). `y` is the layer's height in the world. */
export function flatPath(layer, y, project) {
  const g = cachedGeometry(layer)
  let d = ''
  let ex = NaN
  let ez = NaN
  for (const [x1, z1, x2, z2] of g.flat) {
    if (Math.abs(x1 - ex) < EPS && Math.abs(z1 - ez) < EPS) d += `L${pt(project(x2, y, z2))}`
    else d += `M${pt(project(x1, y, z1))}L${pt(project(x2, y, z2))}`
    ex = x2
    ez = z2
  }
  return d
}

/** The extrusions: top outlines and vertical edges, scaled by `depth`. Empty while the drawing is still flat. */
export function raisedPath(layer, y, depth, project) {
  if (depth < 0.015) return ''
  const g = cachedGeometry(layer)
  let d = ''
  let ex = NaN
  let ey = NaN
  let ez = NaN
  for (const [x1, y1, z1, x2, y2, z2] of g.raised) {
    const a = y + y1 * depth
    const b = y + y2 * depth
    if (Math.abs(x1 - ex) < EPS && Math.abs(a - ey) < EPS && Math.abs(z1 - ez) < EPS) d += `L${pt(project(x2, b, z2))}`
    else d += `M${pt(project(x1, a, z1))}L${pt(project(x2, b, z2))}`
    ex = x2
    ey = b
    ez = z2
  }
  return d
}

/** The slab outline as a closed polygon. Used for the paper fill and for the first stroke that plots. */
export function slabPath(y, project) {
  const hw = SLAB.w / 2
  const hd = SLAB.d / 2
  const c = [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]].map(([x, z]) => pt(project(x, y, z)))
  return `M${c[0]}L${c[1]}L${c[2]}L${c[3]}Z`
}

/** The four port markers of a layer: small squares on its plane. */
export function markerPath(y, project) {
  let d = ''
  for (const x of PORT_X) {
    const c = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sz]) => pt(project(x + sx * MARKER, y, PORT_Z + sz * MARKER)))
    d += `M${c[0]}L${c[1]}L${c[2]}L${c[3]}Z`
  }
  return d
}

/** The four vertical connectors between two layers; `connect` (0..1) grows them from the upper layer down. */
export function connectorPath(upperY, lowerY, connect, project) {
  if (connect < 0.01 || upperY - lowerY < 0.02) return ''
  const yEnd = upperY - (upperY - lowerY) * connect
  let d = ''
  for (const x of PORT_X) d += `M${pt(project(x, upperY, PORT_Z))}L${pt(project(x, yEnd, PORT_Z))}`
  return d
}
