// The dock's honest readout (doc 4.9, 9): what this page is really doing on this device. Pure:
// it maps the live state to keys, and the components turn the keys into words from content/.
// A value that cannot be read yet is null, and the component prints N/A for it. Nothing here is
// ever a claim about performance: it says which renderer drew the core and which tier is set.
//
//   render   'webgl' once the canvas has painted its first frame, else 'svg' (the finished SVG
//            figures are what is on screen); null before the tier is known
//   quality  the tier: 'high' | 'low' | 'off'; null before the tier is known
//   motion   'on' | 'off' (the toggle, or the OS reduced-motion setting)

/**
 * @param {{ tier: 'off'|'low'|'high'|null, webgl: string|null, motionOff: boolean }} input
 * @returns {{ render: 'svg'|'webgl'|null, quality: 'off'|'low'|'high'|null, motion: 'on'|'off' }}
 */
export function readoutValues({ tier = null, webgl = null, motionOff = false } = {}) {
  const known = tier === 'off' || tier === 'low' || tier === 'high'
  return {
    render: known ? (webgl === 'drawn' && tier !== 'off' ? 'webgl' : 'svg') : null,
    quality: known ? tier : null,
    motion: motionOff ? 'off' : 'on',
  }
}
