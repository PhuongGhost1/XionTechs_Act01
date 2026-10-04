// Own isometric projection for the arm-on-the-hex-board stage. No library: a yaw about the vertical
// axis, then an elevation (pitch) tilt. World units are hex radii; x runs right, y toward the viewer
// at yaw 0, z is up. `project` and `unproject` are exact inverses on a horizontal plane.
export const DEG = Math.PI / 180
export const YAW_LIMIT = 60 // the visitor can swing the board this far either side of its resting yaw

export function makeProjection({ yaw = 35, pitch = 55, scale = 1, cx = 0, cy = 0, origin = { x: 0, y: 0 } } = {}) {
  const cY = Math.cos(yaw * DEG)
  const sY = Math.sin(yaw * DEG)
  const cP = Math.cos(pitch * DEG)
  const sP = Math.sin(pitch * DEG)
  const rot = (x, y) => ({ x: (x - origin.x) * cY - (y - origin.y) * sY, y: (x - origin.x) * sY + (y - origin.y) * cY })
  return {
    yaw, pitch, scale, cx, cy, origin,
    // Screen point plus `d`, the depth toward the viewer (larger = nearer), used to sort for painting.
    project(x, y, z = 0) {
      const r = rot(x, y)
      return { x: cx + scale * r.x, y: cy + scale * (r.y * sP - z * cP), d: r.y * cP + z * sP }
    },
    // Screen point back to the world point on the horizontal plane at height z.
    unproject(sx, sy, z = 0) {
      const rx = (sx - cx) / scale
      const ry = ((sy - cy) / scale + z * cP) / sP
      return { x: origin.x + rx * cY + ry * sY, y: origin.y - rx * sY + ry * cY }
    },
    // A direction in the ground plane, rotated by the yaw: `y` > 0 means it faces the viewer.
    facing(dx, dy) {
      return { x: dx * cY - dy * sY, y: dx * sY + dy * cY }
    },
  }
}

const bounds = (pts) => {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  for (const p of pts) {
    x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y)
  }
  return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 }
}

// Scale and centre so every world point (3-D, in `points`) stays inside w x h at the resting yaw and at
// both yaw extremes, so dragging never rescales or clips the board. Rotation is about the board centre.
export function fitProjection(points, w, h, { yaw = 35, pitch = 55, pad = 16, padX = pad, swing = YAW_LIMIT } = {}) {
  const b = bounds(points)
  const origin = { x: (b.x0 + b.x1) / 2, y: (b.y0 + b.y1) / 2 }
  let scale = Infinity
  for (const dy of [-swing, 0, swing]) {
    const p = makeProjection({ yaw: yaw + dy, pitch, origin })
    const bb = bounds(points.map((q) => p.project(q.x, q.y, q.z ?? 0)))
    scale = Math.min(scale, (w - 2 * padX) / Math.max(bb.w, 1e-6), (h - 2 * pad) / Math.max(bb.h, 1e-6))
  }
  const rest = makeProjection({ yaw, pitch, origin })
  const bb = bounds(points.map((q) => rest.project(q.x, q.y, q.z ?? 0)))
  // Vertical centre follows the resting pose; horizontal centre is the origin (rotation keeps it there).
  const cx = w / 2
  const cy = h / 2 - scale * ((bb.y0 + bb.y1) / 2)
  return { pitch, origin, scale, cx, cy }
}

export const clampYaw = (yaw, base, swing = YAW_LIMIT) => Math.max(base - swing, Math.min(base + swing, yaw))

// Damped approach used by the render loop; snaps once it is close enough to stop the loop.
export function dampYaw(current, target, k = 0.2, eps = 0.05) {
  const next = current + (target - current) * k
  return Math.abs(target - next) < eps ? target : next
}
