// The hero's reference architecture ("digital twin"): five tracing-paper layers, top to bottom, each a
// plan drawing (x right, z toward the viewer, y up) with a few low extrusions. ILLUSTRATIVE: a generic
// platform, not a client system. Pure data: the SVG fallback and the three.js scene both build from it,
// so the two renderers always draw the same building. Source: BRIEF 02 §14 (layer names and contents).
//
// Primitives (plan units; the slab is 10 x 7):
//   rect  { x, z, w, d, h }   centre, size, extrusion height (0 = flat outline)
//   cyl   { x, z, r, h }      a drum (data store)
//   line  { pts }             open polyline in plan
// The four ports are columns every layer shares; a vertical connector and a yellow marker pass through each.

export const SLAB = { w: 10, d: 7 }
export const PORT_X = [-3.6, -1.2, 1.2, 3.6]
export const PORT_Z = 0

const ports = PORT_X.map((x) => [x, PORT_Z])

export const layers = [
  {
    id: 'experience',
    label: 'Experience',
    prims: [
      { t: 'rect', x: -2.4, z: -0.4, w: 4.4, d: 3.6, h: 0.16 }, // desktop window
      { t: 'line', pts: [[-4.6, -1.7], [-0.2, -1.7]] },
      { t: 'rect', x: -3.5, z: 0, w: 1.8, d: 1.8, h: 0.1 },
      { t: 'rect', x: -1.3, z: 0, w: 1.8, d: 1.8, h: 0.1 },
      { t: 'rect', x: 1.4, z: -0.3, w: 1.5, d: 3.0, h: 0.16 }, // phone
      { t: 'line', pts: [[0.9, 0.95], [1.9, 0.95]] },
      { t: 'rect', x: 3.5, z: -1.3, w: 1.6, d: 1.0, h: 0.1 }, // widgets
      { t: 'rect', x: 3.5, z: 0.3, w: 1.6, d: 1.4, h: 0.1 },
    ],
  },
  {
    id: 'services',
    label: 'Services',
    prims: [
      ...PORT_X.map((x) => ({ t: 'rect', x, z: 0.7, w: 1.8, d: 2.0, h: 0.45 })),
      { t: 'line', pts: [[-4.4, -1.6], [4.4, -1.6]] }, // service bus
      ...PORT_X.map((x) => ({ t: 'line', pts: [[x, -0.3], [x, -1.6]] })),
    ],
  },
  {
    id: 'api',
    label: 'API',
    prims: [
      { t: 'rect', x: 0, z: 0, w: 8.8, d: 1.0, h: 0.3 }, // gateway
      ...[-3.6, 0, 3.6].map((x) => ({ t: 'rect', x, z: 2.3, w: 1.0, d: 0.8, h: 0.15 })), // clients
      ...[-3.6, 0, 3.6].map((x) => ({ t: 'line', pts: [[x, 0.5], [x, 1.9]] })),
      ...[-2.4, 2.4].map((x) => ({ t: 'rect', x, z: -2.3, w: 1.0, d: 0.8, h: 0.15 })), // upstream systems
      ...[-2.4, 2.4].map((x) => ({ t: 'line', pts: [[x, -0.5], [x, -1.9]] })),
    ],
  },
  {
    id: 'data',
    label: 'Data',
    prims: [
      ...PORT_X.map((x) => ({ t: 'cyl', x, z: 0, r: 0.85, h: 0.55 })),
      ...[-2.4, 0, 2.4].map((x) => ({ t: 'rect', x, z: 2.4, w: 1.4, d: 0.7, h: 0.12 })), // replicas
      ...[-2.4, 0, 2.4].map((x) => ({ t: 'line', pts: [[x, 2.05], [x, 0.9]] })),
    ],
  },
  {
    id: 'infrastructure',
    label: 'Infrastructure',
    prims: [
      ...[-2.2, 0, 2.2].flatMap((z) => PORT_X.map((x) => ({ t: 'rect', x, z, w: 0.9, d: 0.9, h: 0.45 }))),
      ...[-2.2, 0, 2.2].flatMap((z) =>
        PORT_X.slice(0, -1).map((x, k) => ({ t: 'line', pts: [[x + 0.45, z], [PORT_X[k + 1] - 0.45, z]] })),
      ),
      ...PORT_X.flatMap((x) => [-2.2, 0].map((z) => ({ t: 'line', pts: [[x, z + 0.45], [x, z + 2.2 - 0.45]] }))),
    ],
  },
]

export const LAYER_COUNT = layers.length
export const PORTS = ports

/** Height of layer `index` (0 = top) above the ground plane for a given gap between layers. */
export const layerY = (index, gap) => (LAYER_COUNT - 1 - index) * gap
