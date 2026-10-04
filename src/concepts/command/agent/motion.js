// Easing and the one move profile every arm transfer uses. Pure.
export const clamp01 = (n) => (n < 0 ? 0 : n > 1 ? 1 : n)
export const lerp = (a, b, t) => a + (b - a) * t
export const ease = (t) => {
  const x = clamp01(t)
  return x * x * (3 - 2 * x)
}
export const easeIO = (t) => {
  const x = clamp01(t)
  return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2
}
// 0 before a, 1 after b, linear between.
export const seg = (u, a, b) => clamp01((u - a) / (b - a))
export const mix = (p, q, t) => ({ x: lerp(p.x, q.x, t), y: lerp(p.y, q.y, t), z: lerp(p.z ?? 0, q.z ?? 0, t) })

// Lift, glide, lower: straight in the plan (so the joints sweep), over the tops of everything between.
export function transfer(from, to, u, carryZ = Math.max(1.9, from.z + 0.5, to.z + 0.5)) {
  const m = easeIO(seg(u, 0.14, 0.86))
  let z
  if (u < 0.22) z = lerp(from.z, carryZ, ease(u / 0.22))
  else if (u > 0.78) z = lerp(carryZ, to.z, ease((u - 0.78) / 0.22))
  else z = carryZ
  return { x: lerp(from.x, to.x, m), y: lerp(from.y, to.y, m), z }
}
