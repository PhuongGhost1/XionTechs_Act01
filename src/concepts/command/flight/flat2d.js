// The flat top view used by the SVG drawing and by the labels when there is no 3D: the same plot
// layout, seen from above, with altitude shown as a small upward shift. Pure (flat2d.test.js).

export const ALT_SHIFT = 0.22 // screen units of lift per unit of altitude
const PAD = 28 // px kept clear around the plot
const PAD_WIDE_X = 120 // wider stages leave room for the labels at the left and right edge
export const WIDE_STAGE = 900

export function createFlatView(frame, size) {
  const x0 = frame.x[0]
  const x1 = frame.x[1]
  const s0 = frame.z[0] - ALT_SHIFT * frame.y[1]
  const s1 = frame.z[1]
  const padX = size.w >= WIDE_STAGE ? PAD_WIDE_X : PAD
  const w = Math.max(1, size.w - padX * 2)
  const h = Math.max(1, size.h - PAD * 2)
  const scale = Math.min(w / (x1 - x0), h / (s1 - s0))
  const ox = (size.w - (x1 - x0) * scale) / 2
  const oy = (size.h - (s1 - s0) * scale) / 2
  const project = (p) => ({ x: ox + (p[0] - x0) * scale, y: oy + (p[2] - ALT_SHIFT * p[1] - s0) * scale })
  return { project, scale }
}

// SVG path data for a polyline of 3D points.
export function pathOf(project, pts) {
  return pts.map((p, i) => {
    const q = project(p)
    return `${i === 0 ? 'M' : 'L'}${q.x.toFixed(1)} ${q.y.toFixed(1)}`
  }).join(' ')
}
