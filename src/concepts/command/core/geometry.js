// Hero geometry shared by the SVG figure (WP2, drawn in a 320-unit box) and the DOM tags that sit
// on the arm tips (WP3). Single source: doc 6.1. At 1440 x 900 the core is a 280 px square around
// P = (72vw, 30vh); its arms have a 140 px radius and the tips sit at P +/- (119, 74).
//
// All fractions are of the core's anchor box (0..1, y down), for layout "x".

// The one angle of the page: near-diagonal of the viewport, atan(0.625).
export const HERO_ANGLE_DEG = 32

// Where the core's centre P sits in the viewport, as fractions of its width and height.
export const HERO_P = {
  desktop: { x: 0.72, y: 0.3 },
  phone: { x: 0.72, y: 0.22 },
}

// Core box size in CSS px at the hero for the main widths (the anchor box is square).
export const HERO_CORE_SIZE = { 320: 140, 390: 160, 768: 200, 1024: 240, 1280: 280, 1440: 280, 1920: 320 }

// Arm tips, in reading order of the modules: CODE (NW), AI (NE), CLOUD (SE), PRODUCT (SW).
// 119/280 and 74/280 around the centre of a 280 px box.
export const X_TIPS = Object.freeze({
  code: Object.freeze({ x: 0.075, y: 0.236, placement: 'nw' }),
  ai: Object.freeze({ x: 0.925, y: 0.236, placement: 'ne' }),
  cloud: Object.freeze({ x: 0.925, y: 0.764, placement: 'se' }),
  product: Object.freeze({ x: 0.075, y: 0.764, placement: 'sw' }),
})

// Module order used by every figure and instrument (index = CoreFigure's `active`).
export const ARM_ORDER = Object.freeze(['code', 'ai', 'cloud', 'product'])

// The two hairlines of the hero: endpoints of the lines through P at +/- HERO_ANGLE_DEG.
// Returns [[x1,y1,x2,y2], [x1,y1,x2,y2]] in px for a viewport of vw x vh, edge to edge.
export function heroHairlines(vw, vh, p = HERO_P.desktop) {
  const px = vw * p.x
  const py = vh * p.y
  const slope = Math.tan((HERO_ANGLE_DEG * Math.PI) / 180)
  const at = (x, sign) => py + sign * slope * (x - px)
  return [
    [0, at(0, -1), vw, at(vw, -1)],
    [0, at(0, 1), vw, at(vw, 1)],
  ]
}
