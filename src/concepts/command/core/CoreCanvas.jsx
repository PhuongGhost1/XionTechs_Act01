// STUB (WP2 replaces the drawing). Keep the default export and the `tier` prop.
//
// The lazy WebGL mount point (doc 6.3). App.jsx loads this with React.lazy after first paint and
// idle, and only when data-tier is not "off". WP2 turns it into: one fixed, aria-hidden,
// full-viewport <canvas>, createCore() from ./three after import(), the painted flag
// (setWebgl(true) from contract/attributes.js on the first drawn frame, which fades the SVG
// anchors out), the context-loss handling and the governor hook-up. Until then it draws nothing.
//
//   tier   'low' | 'high'   (never 'off': App does not mount it then)
export default function CoreCanvas({ tier }) {
  void tier
  return null
}
