// Camera maths for the flight plan, pure so it is tested in node and shared by the WebGL scene (which
// hands the same eye and target to three.js) and the label projection (which does not need three).
// y is up, the camera looks down at the plot from the +z side. Angles are radians unless named Deg.

export const FOV = 28 // vertical field of view, degrees
export const PITCH_DEG = 58 // how far the camera looks down at the plot
export const PITCH_FLAT_DEG = 80 // the near-top view used on phones
export const YAW_DEG = -12 // a slight turn, so the trajectory reads as a 3D path and not a flat diagram
export const ORBIT_LIMIT_DEG = 25 // drag and keys may turn the view this far either way
export const PARALLAX_DEG = 4
export const DOLLY_MS = 800 // 600 to 900 ms, ease-out, never faster
export const DOLLY_MIN_MS = 600
export const DOLLY_MAX_MS = 900
export const FOCUS_WEIGHT = 0.15 // how far the target leans from the plot centre to the active waypoint

const RAD = Math.PI / 180
export const toRad = (deg) => deg * RAD

export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))
export const easeOutCubic = (t) => 1 - (1 - clamp(t, 0, 1)) ** 3

export function cameraEye({ target, distance, yaw, pitch }) {
  const cp = Math.cos(pitch)
  return [
    target[0] + distance * Math.sin(yaw) * cp,
    target[1] + distance * Math.sin(pitch),
    target[2] + distance * Math.cos(yaw) * cp,
  ]
}

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const unit = (a) => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1
  return [a[0] / l, a[1] / l, a[2] / l]
}

// Projects a world point to normalised device coordinates (x right, y up, both -1..1 inside the
// frame) for a camera at `eye` looking at `target`. `depth` is the distance along the view
// direction; the point is behind the camera when it is not positive.
export function projectPoint(p, { eye, target, fov = FOV, aspect }) {
  const fwd = unit(sub(target, eye))
  const right = unit(cross(fwd, [0, 1, 0]))
  const up = cross(right, fwd)
  const d = sub(p, eye)
  const depth = dot(d, fwd)
  const k = Math.tan(toRad(fov) / 2)
  const safe = depth > 1e-6 ? depth : 1e-6
  return { x: dot(d, right) / safe / (k * aspect), y: dot(d, up) / safe / k, depth, visible: depth > 1e-6 }
}

export const ndcToPx = (ndc, width, height) => ({ x: (ndc.x * 0.5 + 0.5) * width, y: (1 - (ndc.y * 0.5 + 0.5)) * height })

export const boxCorners = (box) => {
  const out = []
  for (const x of box.x) for (const y of box.y) for (const z of box.z) out.push([x, y, z])
  return out
}
export const boxCenter = (box) => [(box.x[0] + box.x[1]) / 2, (box.y[0] + box.y[1]) / 2, (box.z[0] + box.z[1]) / 2]

// Centre of the bounding box of a set of points.
export function pointsCenter(points) {
  const lo = [Infinity, Infinity, Infinity]
  const hi = [-Infinity, -Infinity, -Infinity]
  for (const p of points) for (let i = 0; i < 3; i++) { lo[i] = Math.min(lo[i], p[i]); hi[i] = Math.max(hi[i], p[i]) }
  return lo.map((v, i) => (v + hi[i]) / 2)
}

// Distance at which every point (or every corner of a box) stays inside the frame, with `margin` > 1 as breathing room,
// for the given look-at target and angles. A few passes of rescaling converge, because the projection
// is nearly proportional to 1 / distance.
export function fitDistance(points, { target, yaw, pitch, aspect, fov = FOV, margin = 1.06 }) {
  const corners = Array.isArray(points) ? points : boxCorners(points)
  let distance = 30
  for (let pass = 0; pass < 8; pass++) {
    const eye = cameraEye({ target, distance, yaw, pitch })
    let worst = 0
    for (const c of corners) {
      const q = projectPoint(c, { eye, target, fov, aspect })
      worst = Math.max(worst, Math.abs(q.x), Math.abs(q.y))
    }
    const next = Math.max(1, distance * worst * margin)
    if (Math.abs(next - distance) < 0.01) {
      distance = next
      break
    }
    distance = next
  }
  return distance
}

// The camera's goal for a plot: look at a point between the plot centre and the active waypoint, at
// the distance that frames the whole plot. `flat` is the near-top view for phones.
export function cameraGoal({ frame, points, focus, aspect, flat = false }) {
  const fit = points ?? boxCorners(frame)
  const center = pointsCenter(fit)
  const target = focus ? center.map((c, i) => c + (focus[i] - c) * FOCUS_WEIGHT) : center
  const pitch = toRad(flat ? PITCH_FLAT_DEG : PITCH_DEG)
  const yaw = toRad(flat ? 0 : YAW_DEG)
  const distance = fitDistance(fit, { target: center, yaw, pitch, aspect })
  return { target, distance, yaw, pitch }
}

// Blend of two camera states at `elapsedMs` of an ease-out dolly. The duration is held to 600-900 ms.
export function tweenCamera(from, to, elapsedMs, durationMs = DOLLY_MS) {
  const dur = clamp(durationMs, DOLLY_MIN_MS, DOLLY_MAX_MS)
  const e = easeOutCubic(elapsedMs / dur)
  return {
    target: [0, 1, 2].map((i) => from.target[i] + (to.target[i] - from.target[i]) * e),
    distance: from.distance + (to.distance - from.distance) * e,
    done: elapsedMs >= dur,
  }
}

// Drag and keys turn the view by at most +-25 degrees from its resting angle.
export function clampOrbit(yawDeg, pitchDeg, limit = ORBIT_LIMIT_DEG) {
  return { yaw: clamp(yawDeg, -limit, limit), pitch: clamp(pitchDeg, -limit, limit) }
}

// Pointer position (nx, ny in -1..1 from the centre of the stage) to a small turn of the view.
export function parallaxOffset(nx, ny, maxDeg = PARALLAX_DEG) {
  return { yaw: clamp(nx, -1, 1) * maxDeg, pitch: clamp(-ny, -1, 1) * maxDeg }
}

// Keys: arrows nudge the view by `stepDeg`, Escape resets it. Returns null for any other key.
export function keyOrbit(key, stepDeg = 5) {
  switch (key) {
    case 'ArrowLeft':
      return { dyaw: -stepDeg, dpitch: 0 }
    case 'ArrowRight':
      return { dyaw: stepDeg, dpitch: 0 }
    case 'ArrowUp':
      return { dyaw: 0, dpitch: stepDeg }
    case 'ArrowDown':
      return { dyaw: 0, dpitch: -stepDeg }
    case 'Escape':
      return { reset: true }
    default:
      return null
  }
}
