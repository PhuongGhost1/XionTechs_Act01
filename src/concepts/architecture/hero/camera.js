import { SLAB, layerY } from '../model/layers.js'

// One camera for the whole hero. The SVG drawing, the DOM labels and the three.js scene all project the same
// five layers through this pose, so the SVG that paints first and the canvas that fades in over it show the
// same picture. Pure maths, no DOM, no three: the scene feeds the numbers into a PerspectiveCamera.
//
// World: x right, y up, z toward the viewer in plan. The camera sits on a sphere around `target`:
//   toCam = (cos e sin a, sin e, cos e cos a)   e = elevation (90 = straight down), a = azimuth
// The screen axes are written out analytically, so the straight-down plan view has no up-vector singularity.

export const FOV = 22 // degrees, vertical. Low on purpose: it reads as axonometric but keeps a little depth.
export const TAN = Math.tan((FOV * Math.PI) / 360)
const RAD = Math.PI / 180

const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
export const lerp = (a, b, t) => a + (b - a) * t

export function basisFor(elevation, azimuth) {
  const e = elevation * RAD
  const a = azimuth * RAD
  const ce = Math.cos(e)
  const se = Math.sin(e)
  const ca = Math.cos(a)
  const sa = Math.sin(a)
  return {
    toCam: [ce * sa, se, ce * ca],
    right: [ca, 0, -sa],
    up: [-se * sa, ce, -se * ca],
  }
}

export const COMPACT_BELOW = 460 // px; narrower than this is a phone drawing: no labels, no vertical dimension
/** Room reserved on the right for the leader lines and the layer names: 30 px of leader, 132 px of text, 10 px of air. */
export const LABEL_ROOM = 176

/**
 * Where the model may sit inside a W x H box, in px. The left margin holds the vertical dimension, the top one
 * the camera readout, the bottom one the horizontal dimension and the figure note. The right margin is the
 * label column; it is only reserved as the camera tilts (the room argument), so the plan view can use the whole width.
 * A phone-sized box has no labels, so its sides are small.
 */
export function marginsFor(W, H, room = 1) {
  if (W >= COMPACT_BELOW) {
    return {
      l: Math.max(W * 0.05, 60),
      r: lerp(W * 0.05, LABEL_ROOM, room),
      t: Math.max(H * 0.11, 70),
      b: Math.max(H * 0.15, 104),
    }
  }
  return { l: W * 0.06, r: W * 0.06, t: 64, b: 66 }
}

/** The corners that bound the exploded stack, in world space, for a given gap between layers. */
export function stackCorners(gap) {
  const hw = SLAB.w / 2
  const hd = SLAB.d / 2
  const top = layerY(0, gap) + 0.2
  const out = []
  for (const y of [0, top]) {
    for (const [x, z] of [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]]) out.push([x, y, z])
  }
  return out
}

/**
 * The camera for one frame.
 *   elevation, azimuth  degrees (from cameraAngles(tilt))
 *   gap                 distance between layers (from heroGap(lift))
 *   dolly               0..1, the slow move in at the end
 *   room                0..1, how much of the right margin the label column takes (follows the tilt)
 *   W, H                size of the box the picture is drawn in, px
 * Returns the pose and `project(x, y, z) -> [px, py, depth]`.
 */
export function cameraPose({ elevation, azimuth, gap, dolly = 0, room = 1, W, H, margins = marginsFor(W, H, room) }) {
  const b = basisFor(elevation, azimuth)
  const top = layerY(0, gap)
  const target = [0, lerp(top / 2, top * 0.34, dolly), 0]
  const wu = Math.max(40, W - margins.l - margins.r)
  const hu = Math.max(40, H - margins.t - margins.b)
  const ox = (margins.l - margins.r) / 2
  const oy = (margins.t - margins.b) / 2

  // Smallest distance at which every corner of the stack lands inside the usable region.
  let dist = 0
  for (const c of stackCorners(gap)) {
    const rel = [c[0] - target[0], c[1] - target[1], c[2] - target[2]]
    const need = Math.max((H * Math.abs(dot(rel, b.right))) / (wu * TAN), (H * Math.abs(dot(rel, b.up))) / (hu * TAN))
    dist = Math.max(dist, need + dot(rel, b.toCam))
  }
  dist *= lerp(1, 0.93, dolly)

  const position = [target[0] + b.toCam[0] * dist, target[1] + b.toCam[1] * dist, target[2] + b.toCam[2] * dist]
  const cx = W / 2 + ox
  const cy = H / 2 + oy

  function project(x, y, z) {
    const rx = x - target[0]
    const ry = y - target[1]
    const rz = z - target[2]
    const xc = rx * b.right[0] + ry * b.right[1] + rz * b.right[2]
    const yc = rx * b.up[0] + ry * b.up[1] + rz * b.up[2]
    const depth = dist - (rx * b.toCam[0] + ry * b.toCam[1] + rz * b.toCam[2])
    const s = H / 2 / (depth * TAN)
    return [cx + xc * s, cy - yc * s, depth]
  }

  return { elevation, azimuth, basis: b, target, position, dist, W, H, ox, oy, margins, project }
}

/** The three world axes as 2D screen vectors (unit length at the plane of the view), for the axis triad. */
export function axisTriad(pose) {
  const { right, up } = pose.basis
  return [
    { id: 'X', v: [right[0], -up[0]] },
    { id: 'Y', v: [right[1], -up[1]] },
    { id: 'Z', v: [right[2], -up[2]] },
  ]
}
