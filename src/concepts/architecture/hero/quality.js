// The Level 3 gate: may the WebGL scene load at all? A pure function of an environment snapshot, so the
// rules are tested. Everything the gate refuses keeps the SVG drawing, which is the permanent renderer on
// phones, under reduced motion, without WebGL, on saveData and on low-power devices (brief 00 fallback ladder).

export const MIN_WIDTH = 768
export const MAX_LOW_POWER_CORES = 4
export const MIN_FPS = 40
export const PROBE_FRAMES = 60

/**
 * env: { width, webgl, reducedMotion, saveData, touch, cores, force }
 *   force 'svg'    never load the scene (a ?hero=svg override, for testing the fallback)
 * Returns { ok, reason }.
 */
export function qualityGate(env) {
  if (env.force === 'svg') return { ok: false, reason: 'forced-svg' }
  if (!env.webgl) return { ok: false, reason: 'no-webgl' }
  if (env.reducedMotion) return { ok: false, reason: 'reduced-motion' }
  if (env.saveData) return { ok: false, reason: 'save-data' }
  if (!(env.width >= MIN_WIDTH)) return { ok: false, reason: 'narrow' }
  if (env.touch && env.cores > 0 && env.cores <= MAX_LOW_POWER_CORES) return { ok: false, reason: 'low-power' }
  return { ok: true, reason: 'ok' }
}

/** Reads the real environment. Only called in the browser. */
export function readEnv() {
  const nav = typeof navigator === 'undefined' ? {} : navigator
  const mm = (q) => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(q).matches : false)
  const params = typeof window === 'undefined' ? new URLSearchParams() : new URLSearchParams(window.location.search)
  return {
    width: typeof window === 'undefined' ? 0 : window.innerWidth,
    webgl: typeof window !== 'undefined' && typeof window.WebGLRenderingContext !== 'undefined',
    reducedMotion: mm('(prefers-reduced-motion: reduce)'),
    saveData: Boolean(nav.connection && nav.connection.saveData),
    touch: mm('(pointer: coarse)') || (nav.maxTouchPoints || 0) > 0,
    cores: nav.hardwareConcurrency || 0,
    force: params.get('hero'), // 'svg' keeps the drawing, 'webgl' skips the FPS probe (for headless QA)
  }
}

/**
 * The FPS probe: the median frame time over the first PROBE_FRAMES rendered frames (the first few are
 * compile and upload noise, and a stalled tab is not a slow GPU). Pure, fed one delta in ms at a time.
 */
export function createProbe({ frames = PROBE_FRAMES, minFps = MIN_FPS, skip = 8 } = {}) {
  const samples = []
  let seen = 0
  let verdict = null
  return {
    push(dt) {
      if (verdict) return verdict
      seen += 1
      if (seen <= skip || dt > 250) return null
      samples.push(dt)
      if (samples.length < frames - skip) return null
      const sorted = [...samples].sort((a, b) => a - b)
      const median = sorted[Math.floor(sorted.length / 2)]
      verdict = { fps: 1000 / median, ok: 1000 / median >= minFps }
      return verdict
    },
    get verdict() {
      return verdict
    },
  }
}
