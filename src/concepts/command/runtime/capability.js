// Quality tier selection (doc 6.2). Pure: detectTier(env) maps a plain description of the device
// to 'off' | 'low' | 'high'. readEnvironment() is the only part that touches the browser.
//
//   off   no canvas at all: every anchor shows its CoreFigure SVG. With motion on this is Level 2
//         (CSS and SVG motion), with motion off Level 1 (final states). Both are finished pages.
//   low   WebGL2 on a weak device: DPR 1, 500 points, 8 packets, no orbiters, no pointer follow
//   high  everything: DPR up to 1.5, 1,200 points, 24 packets, 16 orbiters, pointer yaw
//
// The FPS governor (governor.js) can only move a session DOWN from the tier chosen here.

/** Matches the WebGL renderer strings of software rasterisers, which are far too slow for the core. */
export const SOFTWARE_RENDERER = /swiftshader|llvmpipe|softpipe|software/i

/**
 * @typedef {object} TierEnv
 * @property {boolean} [webgl2]            a WebGL2 context could be created
 * @property {string}  [renderer]          unmasked renderer string, '' when unknown
 * @property {boolean} [contextLost]       a context was lost and not restored
 * @property {boolean} [chunkFailed]       the lazy WebGL chunk failed to load
 * @property {boolean} [motionOff]         data-motion is off (toggle or reduced motion)
 * @property {boolean} [reducedMotion]     prefers-reduced-motion: reduce
 * @property {boolean} [saveData]          navigator.connection.saveData
 * @property {boolean} [rawView]           data-view is raw
 * @property {number}  [deviceMemory]      GB, undefined when the browser does not say
 * @property {number}  [hardwareConcurrency]
 * @property {boolean} [coarsePointer]     (pointer: coarse)
 * @property {number}  [width]             viewport width in CSS px
 * @property {number}  [medianFrameMs]     measured median frame time, when known
 */

/** Reasons the canvas is switched off entirely (doc 6.2, tier off). */
export function offReasons(env = {}) {
  const r = []
  if (!env.webgl2) r.push('no WebGL2')
  if (env.renderer && SOFTWARE_RENDERER.test(env.renderer)) r.push('software rasteriser')
  if (env.contextLost) r.push('context lost')
  if (env.chunkFailed) r.push('chunk failed')
  if (env.motionOff) r.push('motion off')
  if (env.reducedMotion) r.push('reduced motion')
  if (env.saveData) r.push('save-data')
  if (env.rawView) r.push('raw view')
  return r
}

/** Reasons a WebGL2 device is held to the low tier. */
export function lowReasons(env = {}) {
  const r = []
  if (env.deviceMemory !== undefined && env.deviceMemory <= 4) r.push('device memory')
  if (env.hardwareConcurrency !== undefined && env.hardwareConcurrency <= 4) r.push('few cores')
  if (env.coarsePointer && env.width !== undefined && env.width < 768) r.push('coarse pointer, narrow')
  if (env.medianFrameMs !== undefined && env.medianFrameMs > 25) r.push('slow frames')
  return r
}

/** Why a device gets the tier it gets: every reason that applies, or [] for 'high'. */
export const tierReasons = (env = {}) => {
  const off = offReasons(env)
  return off.length ? off : lowReasons(env)
}

/** 'off' | 'low' | 'high' */
export function detectTier(env = {}) {
  if (offReasons(env).length) return 'off'
  return lowReasons(env).length ? 'low' : 'high'
}

/** Human readable readout for the dock, e.g. "LOW ( few cores )". Not live-announced. */
export function describeTier(env) {
  const tier = detectTier(env)
  const reasons = tierReasons(env)
  return reasons.length ? `${tier.toUpperCase()} ( ${reasons.join(', ')} )` : tier.toUpperCase()
}

/**
 * Reads the real environment. Probes WebGL2 on a throwaway canvas and releases the context so
 * the page's own canvas is not the second one. Returns a TierEnv; with no window it describes a
 * device without WebGL, which selects 'off'.
 * @returns {TierEnv}
 */
export function readEnvironment() {
  if (typeof window === 'undefined') return { webgl2: false }
  const html = document.documentElement
  const matches = (q) => (typeof matchMedia === 'function' ? matchMedia(q).matches : false)
  const env = {
    webgl2: false,
    renderer: '',
    motionOff: html.getAttribute('data-motion') === 'off',
    reducedMotion: matches('(prefers-reduced-motion: reduce)') && html.getAttribute('data-motion') !== 'on',
    saveData: Boolean(navigator.connection?.saveData),
    rawView: html.getAttribute('data-view') === 'raw',
    deviceMemory: navigator.deviceMemory,
    hardwareConcurrency: navigator.hardwareConcurrency,
    coarsePointer: matches('(pointer: coarse)'),
    width: window.innerWidth,
  }
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2')
    if (gl) {
      env.webgl2 = true
      const info = gl.getExtension('WEBGL_debug_renderer_info')
      env.renderer = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : ''
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    }
  } catch {
    env.webgl2 = false
  }
  return env
}
