import { LAYER_COUNT, SLAB, layerY, layers } from './layers.js'
import { cachedGeometry } from './geometry.js'

// Axonometric projection (30 degree dimetric, y up) for the SVG renderers: the hero fallback, the finale
// and any small diagram that must show the same building as the WebGL scene. In axonometric projection a
// lift in y is a pure vertical screen translation, so layers can be separated with a CSS transform.

const ANGLE = Math.PI / 6
const COS = Math.cos(ANGLE)
const SIN = Math.sin(ANGLE)

/** World (x, y, z) -> screen [sx, sy], y down, one unit = `k` px. */
export function iso(x, y, z, k = 1) {
  return [(x - z) * COS * k, ((x + z) * SIN - y) * k]
}

const f = (n) => Math.round(n * 100) / 100
const move = (pt) => `M${f(pt[0])} ${f(pt[1])}`
const line = (pt) => `L${f(pt[0])} ${f(pt[1])}`

/**
 * SVG path data for one layer, in a coordinate space whose origin is the layer's own centre (the caller
 * translates it by `layerY`). `depth` scales the extrusions: 0 draws the flat plan, 1 the full relief.
 */
export function layerPaths(layer, { depth = 1, k = 1 } = {}) {
  const g = cachedGeometry(layer)
  const flat = g.flat
    .map(([x1, z1, x2, z2]) => `${move(iso(x1, 0, z1, k))}${line(iso(x2, 0, z2, k))}`)
    .join('')
  const raised = g.raised
    .map(([x1, y1, z1, x2, y2, z2]) => `${move(iso(x1, y1 * depth, z1, k))}${line(iso(x2, y2 * depth, z2, k))}`)
    .join('')
  const hw = SLAB.w / 2
  const hd = SLAB.d / 2
  const slab = [iso(-hw, 0, -hd, k), iso(hw, 0, -hd, k), iso(hw, 0, hd, k), iso(-hw, 0, hd, k)]
  return {
    flat,
    raised,
    slab: `${move(slab[0])}${slab.slice(1).map(line).join('')}Z`,
    nodes: g.nodes.map(([x, z]) => iso(x, 0, z, k)),
  }
}

/** The vertical offset (screen px, negative = up) of layer `index` for a given gap. */
export const layerOffset = (index, gap, k = 1) => -layerY(index, gap) * k

/** Bounding box of the whole exploded stack in projected units, with padding. */
export function stackBounds({ gap, k = 1, pad = 0.6 }) {
  const hw = SLAB.w / 2
  const hd = SLAB.d / 2
  const top = layerY(0, gap)
  const xs = []
  const ys = []
  for (const [x, z] of [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]]) {
    for (const y of [0, top + 0.6]) {
      const [sx, sy] = iso(x, y, z, k)
      xs.push(sx)
      ys.push(sy)
    }
  }
  const x0 = Math.min(...xs) - pad * k
  const y0 = Math.min(...ys) - pad * k
  return { x: x0, y: y0, w: Math.max(...xs) + pad * k - x0, h: Math.max(...ys) + pad * k - y0 }
}

export { layers, LAYER_COUNT }
