// Two-link planar inverse kinematics (SCARA style: both links turn about vertical axes, the gripper
// lifts on its own shaft). Analytic, law of cosines. The elbow side is fixed per arm, so the elbow
// never flips while the gripper travels; a target beyond reach is clamped onto the reachable annulus.
export function solveArm(base, target, l1, l2, side = -1) {
  const dx = target.x - base.x
  const dy = target.y - base.y
  const dist = Math.hypot(dx, dy)
  const phi = dist < 1e-9 ? 0 : Math.atan2(dy, dx)
  const dMax = (l1 + l2) * 0.999
  const dMin = Math.max(Math.abs(l1 - l2) * 1.001, (l1 + l2) * 0.12)
  const d = Math.min(dMax, Math.max(dMin, dist))
  const cosA = (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d)
  const a = Math.acos(Math.max(-1, Math.min(1, cosA)))
  const ang = phi + side * a
  return {
    elbow: { x: base.x + l1 * Math.cos(ang), y: base.y + l1 * Math.sin(ang) },
    wrist: { x: base.x + d * Math.cos(phi), y: base.y + d * Math.sin(phi) },
    reach: d,
    clamped: Math.abs(d - dist) > 1e-9,
  }
}
