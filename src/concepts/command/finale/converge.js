// Pure maths for the finale: every point travels from a spot on the page's X network to its place in
// the logo. Progress `p` (0..1) is scroll-scrubbed, so the motion is reversible and costs nothing
// while the visitor is not scrolling.

const clamp01 = (n) => (n < 0 ? 0 : n > 1 ? 1 : n)
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)

// Deterministic hash in 0..1 so a point's jitter and delay never change between renders.
export function hash(i, salt = 0) {
  let x = (i + 1) * 374761393 + salt * 668265263
  x = (x ^ (x >>> 13)) * 1274126177
  x = x ^ (x >>> 16)
  return ((x >>> 0) % 10000) / 10000
}

// Start position of point i in the unit square: on one of the two diagonals of the X, with a little
// scatter, clustering a few points near the hub (the network's nodes).
export function startPoint(i) {
  const diag = i % 2 === 0
  const along = hash(i, 1)
  const t = along < 0.18 ? 0.5 + (hash(i, 2) - 0.5) * 0.08 : along // 18% of points sit at the hub
  const x = t
  const y = diag ? t : 1 - t
  return { x: x + (hash(i, 3) - 0.5) * 0.04, y: y + (hash(i, 4) - 0.5) * 0.06 }
}

// Where the logo sits inside a canvas of w x h (CSS px): scaled to at most maxW wide, centred.
export function logoBox(w, h, logoW, logoH, maxW = 980, fill = 0.86) {
  const width = Math.min(maxW, w * fill)
  const scale = width / logoW
  return { scale, left: (w - width) / 2, top: (h - logoH * scale) / 2 }
}

// Position of point i at progress p, in canvas CSS px. `target` is the logo pixel (tx, ty).
export function pointAt(i, p, w, h, box, tx, ty) {
  const s = startPoint(i)
  const delay = hash(i, 5) * 0.4
  const t = easeInOut(clamp01((p - delay) / (1 - 0.4)))
  const sx = s.x * w
  const sy = s.y * h
  const ex = box.left + (tx + 0.5) * box.scale
  const ey = box.top + (ty + 0.5) * box.scale
  return { x: sx + (ex - sx) * t, y: sy + (ey - sy) * t, t }
}

// Maps the section's flow progress to convergence progress: nothing until the stage is near, whole
// by the time it is centred.
export function convergeProgress(flow) {
  return clamp01((flow - 0.1) / 0.4)
}
