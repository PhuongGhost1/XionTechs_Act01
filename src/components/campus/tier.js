// Which renderer the smart campus gets. Pure, so the rules are tested in node (tier.test.js).
//   svg   the flat SVG site plan of the same campus; the WebGL chunk is never requested
//   lite  3D with no desks, a lower pixel ratio, no antialiasing, a higher flat camera and no parallax (phones)
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

// What each tier draws. `flat` starts the camera from higher up (phones); `seats` draws the desks
// inside an open building. (Trees and cars were dropped from the 3D drawing in the 2026-10-13
// blueprint pass — see campusScene.js's header comment — so there's no decor count to tier here
// any more; `dpr`/`antialias`/`parallax` still scale with device capability.)
export const TIERS = {
  full: { dpr: 2, parallax: true, flat: false, antialias: true, seats: true },
  lite: { dpr: 1.5, parallax: false, flat: true, antialias: false, seats: false },
  svg: { dpr: 1, parallax: false, flat: true, antialias: false, seats: false },
}
