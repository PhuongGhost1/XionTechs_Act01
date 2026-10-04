// Polyline helpers for the flight plan: every curve is sampled once into a polyline with
// cumulative arc lengths, so a craft moves at constant speed along any of them (the same job as
// getPointAt in three.js, but pure, so it is tested in node and shared by the SVG and WebGL drawings).
// Points are [x, y, z] arrays; y is up.

export const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
export const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
export const add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
export const len3 = (a) => Math.hypot(a[0], a[1], a[2])
export const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
export function norm3(a, fallback = [0, 0, 1]) {
  const l = len3(a)
  return l > 1e-9 ? [a[0] / l, a[1] / l, a[2] / l] : fallback
}

// { pts, cum, total } from a list of points. Zero-length steps are kept (they add nothing).
export function polyline(pts) {
  const cum = [0]
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + len3(sub3(pts[i], pts[i - 1])))
  return { pts, cum, total: cum[cum.length - 1] }
}

// Quadratic Bezier a -> b with control point c, sampled into `n` segments.
export function quadratic(a, c, b, n = 24) {
  const pts = []
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const u = 1 - t
    pts.push([
      u * u * a[0] + 2 * u * t * c[0] + t * t * b[0],
      u * u * a[1] + 2 * u * t * c[1] + t * t * b[1],
      u * u * a[2] + 2 * u * t * c[2] + t * t * b[2],
    ])
  }
  return polyline(pts)
}

export const reversed = (poly) => polyline([...poly.pts].reverse())

// Joins polylines end to start (the shared point is kept once).
export function concat(polys) {
  const pts = []
  polys.forEach((p, i) => pts.push(...(i === 0 ? p.pts : p.pts.slice(1))))
  return polyline(pts)
}

// Point and unit tangent at fraction `s` (0..1) of the arc length.
export function pointAt(poly, s) {
  const { pts, cum, total } = poly
  if (pts.length === 1 || total <= 1e-9) return { p: pts[0], t: [0, 0, 1] }
  const target = Math.min(1, Math.max(0, s)) * total
  let i = 1
  while (i < pts.length - 1 && cum[i] < target) i++
  const seg = cum[i] - cum[i - 1]
  const k = seg > 1e-9 ? (target - cum[i - 1]) / seg : 0
  return { p: lerp3(pts[i - 1], pts[i], k), t: norm3(sub3(pts[i], pts[i - 1])) }
}

export const startOf = (poly) => poly.pts[0]
export const endOf = (poly) => poly.pts[poly.pts.length - 1]
export const tangentAtStart = (poly) => pointAt(poly, 0).t
export const tangentAtEnd = (poly) => pointAt(poly, 1).t

// Number of leading points that cover fraction `s` of the length (for a draw range).
export function pointsUpTo(poly, s) {
  if (s <= 0) return 0
  if (s >= 1) return poly.pts.length
  const target = s * poly.total
  let n = 1
  while (n < poly.pts.length && poly.cum[n] <= target) n++
  return Math.min(poly.pts.length, n + 1)
}
