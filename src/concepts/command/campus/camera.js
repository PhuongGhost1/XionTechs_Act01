// Camera maths for the smart campus, pure so it is tested in node and shared by the WebGL scene (which hands
// the same eye and target to three.js) and the HTML label projection. y is up; at yaw 0 the camera sits on
// the +z (south) side looking north. Angles are radians unless named Deg. Adapted from the flight plan's
// camera (git history: src/concepts/command/flight/camera.js): the campus may be turned all the way round.

export const FOV = 30 // vertical field of view, degrees
export const YAW_DEG = -26 // resting turn, so the campus reads as a 3D model and not a site plan
export const PITCH_DEG = { campus: 46, building: 40, room: 52 }
export const PITCH_FLAT_DEG = 66 // the higher view phones start from
export const PITCH_MIN_DEG = 16
export const PITCH_MAX_DEG = 86
export const ZOOM_MIN = 0.5
export const ZOOM_MAX = 1.6
export const ZOOM_STEP = 0.8
export const PARALLAX_DEG = 3
export const DOLLY_MS = 800 // 600 to 900 ms, ease-out, never faster
export const DOLLY_MIN_MS = 600
export const DOLLY_MAX_MS = 900

const RAD = Math.PI / 180
export const toRad = (deg) => deg * RAD
export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))
export const easeOutCubic = (t) => 1 - (1 - clamp(t, 0, 1)) ** 3

export function cameraEye({ target, distance, yaw, pitch }) {
  const cp = Math.cos(pitch)
  return [target[0] + distance * Math.sin(yaw) * cp, target[1] + distance * Math.sin(pitch), target[2] + distance * Math.cos(yaw) * cp]
}

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const unit = (a) => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1
  return [a[0] / l, a[1] / l, a[2] / l]
}

// World point to normalised device coordinates (x right, y up, -1..1 inside the frame). `depth` is the
// distance along the view direction; the point is behind the camera when it is not positive.
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

// Distance at which every corner of `box` stays inside the frame (margin > 1 is breathing room).
export function fitDistance(box, { target, yaw, pitch, aspect, fov = FOV, margin = 1.08 }) {
  const corners = boxCorners(box)
  let distance = 40
  for (let pass = 0; pass < 10; pass++) {
    const eye = cameraEye({ target, distance, yaw, pitch })
    let worst = 0
    for (const c of corners) {
      const q = projectPoint(c, { eye, target, fov, aspect })
      worst = Math.max(worst, Math.abs(q.x), Math.abs(q.y))
    }
    const next = Math.max(2, distance * worst * margin)
    if (Math.abs(next - distance) < 0.01) return next
    distance = next
  }
  return distance
}

// Where the camera rests for a focus box at a level ('campus' | 'building' | 'room').
export function cameraGoal({ box, level, aspect, flat = false }) {
  const target = boxCenter(box)
  const pitch = toRad(flat && level === 'campus' ? PITCH_FLAT_DEG : PITCH_DEG[level] ?? PITCH_DEG.campus)
  const yaw = toRad(YAW_DEG)
  const distance = fitDistance(box, { target, yaw, pitch, aspect, margin: level === 'room' ? 1.25 : 1.08 })
  return { target, distance, yaw, pitch }
}

// Blend of two camera states at `elapsedMs` of an ease-out dolly, held to 600-900 ms.
export function tweenCamera(from, to, elapsedMs, durationMs = DOLLY_MS) {
  const dur = clamp(durationMs, DOLLY_MIN_MS, DOLLY_MAX_MS)
  const e = easeOutCubic(elapsedMs / dur)
  return {
    target: [0, 1, 2].map((i) => from.target[i] + (to.target[i] - from.target[i]) * e),
    distance: from.distance + (to.distance - from.distance) * e,
    pitch: from.pitch + (to.pitch - from.pitch) * e,
    done: elapsedMs >= dur,
  }
}

// The visitor's turn on top of the resting view: yaw wraps freely, the total pitch stays between the limits.
export function orbitBy(orbit, dyawDeg, dpitchDeg, basePitchDeg) {
  const yaw = (((orbit.yaw + dyawDeg + 180) % 360) + 360) % 360 - 180
  const pitch = clamp(basePitchDeg + orbit.pitch + dpitchDeg, PITCH_MIN_DEG, PITCH_MAX_DEG) - basePitchDeg
  return { yaw, pitch }
}

export const zoomBy = (zoom, factor) => clamp(zoom * factor, ZOOM_MIN, ZOOM_MAX)

export function parallaxOffset(nx, ny, maxDeg = PARALLAX_DEG) {
  return { yaw: clamp(nx, -1, 1) * maxDeg, pitch: clamp(-ny, -1, 1) * maxDeg }
}

// Keys on the stage: arrows turn, + and - zoom, Escape goes up a level. Null for any other key.
export function keyCommand(key) {
  switch (key) {
    case 'ArrowLeft':
      return { dyaw: -10, dpitch: 0 }
    case 'ArrowRight':
      return { dyaw: 10, dpitch: 0 }
    case 'ArrowUp':
      return { dyaw: 0, dpitch: 5 }
    case 'ArrowDown':
      return { dyaw: 0, dpitch: -5 }
    case '+':
    case '=':
      return { zoom: ZOOM_STEP }
    case '-':
    case '_':
      return { zoom: 1 / ZOOM_STEP }
    case 'Escape':
      return { up: true }
    default:
      return null
  }
}
