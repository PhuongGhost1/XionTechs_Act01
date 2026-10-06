// Which renderer the flight plan gets. Pure, so the rules are tested in node (tier.test.js).
//   svg   the flat SVG drawing of the same layout; the WebGL chunk is never requested
//   lite  3D with fewer segments, a lower pixel ratio, a near-top camera and no pointer parallax (phones)
//   full  the whole 3D plot
// It builds on the page's own gate (scene/store.js detectQuality: reduced motion, no WebGL and saveData all
// mean "off") and adds a low-power rule: two cores or two gigabytes of memory or less get the drawing.
import { detectQuality } from '../scene/store'

export function flightTier(env) {
  const quality = detectQuality(env)
  if (quality === 'off') return 'svg'
  const lowPower = (env.deviceMemory && env.deviceMemory <= 2) || (env.cores && env.cores <= 2)
  if (lowPower) return 'svg'
  return quality === 'low' ? 'lite' : 'full'
}

export const TIERS = {
  full: { segments: 24, trail: 48, dpr: 2, parallax: true, flat: false, antialias: true },
  lite: { segments: 12, trail: 24, dpr: 1.5, parallax: false, flat: true, antialias: false },
  svg: { segments: 12, trail: 0, dpr: 1, parallax: false, flat: true, antialias: false },
}
