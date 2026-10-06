// Which renderer the smart campus gets. Pure, so the rules are tested in node (tier.test.js).
//   svg   the flat SVG site plan of the same campus; the WebGL chunk is never requested
//   lite  3D with fewer trees and cars, no desks, a lower pixel ratio, a higher camera and no parallax (phones)
//   full  the whole 3D campus
// It builds on the page's own gate (scene/store.js detectQuality: reduced motion, no WebGL and saveData all
// mean "off") and adds a low-power rule: two cores or two gigabytes of memory or less get the drawing.
import { detectQuality } from '../scene/store'

export function campusTier(env) {
  const quality = detectQuality(env)
  if (quality === 'off') return 'svg'
  const lowPower = (env.deviceMemory && env.deviceMemory <= 2) || (env.cores && env.cores <= 2)
  if (lowPower) return 'svg'
  return quality === 'low' ? 'lite' : 'full'
}

// What each tier draws. `flat` starts the camera from higher up (phones); `trees` caps the decor trees;
// `cars` is how many cars drive the road; `seats` draws the desks inside an open building.
export const TIERS = {
  full: { dpr: 2, parallax: true, flat: false, antialias: true, trees: 80, cars: 6, seats: true },
  lite: { dpr: 1.5, parallax: false, flat: true, antialias: false, trees: 36, cars: 3, seats: false },
  svg: { dpr: 1, parallax: false, flat: true, antialias: false, trees: 0, cars: 0, seats: false },
}
