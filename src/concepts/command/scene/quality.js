// Decides how the hero visual is drawn: 'static' (SVG), 'low' or 'high' (WebGL). Plan section 5.
// `decideQuality` is pure and tested; `detectEnvironment` is the only part that touches the browser.

// Particle budgets and pixel-ratio cap per tier. `dpr` is window.devicePixelRatio.
export function qualityProfile(quality, dpr = 1) {
  const low = quality === 'low'
  return {
    antialias: !low,
    powerPreference: low ? 'low-power' : 'high-performance',
    pixelRatio: Math.max(1, Math.min(dpr || 1, low ? 1.5 : 2)),
    orbitParticles: low ? 60 : 180, // about a third on low
    packets: low ? 18 : 36,
  }
}

export function decideQuality({
  webgl = false,
  reducedMotion = false,
  saveData = false,
  hardwareConcurrency,
  deviceMemory,
  coarsePointer = false,
  width = 1280,
} = {}) {
  if (!webgl || reducedMotion || saveData) return 'static'
  if (coarsePointer && typeof hardwareConcurrency === 'number' && hardwareConcurrency <= 4) return 'static'
  if (width < 768 || coarsePointer || (typeof deviceMemory === 'number' && deviceMemory <= 4)) return 'low'
  return 'high'
}

let webglProbe // memoised: creating contexts is not free and browsers cap how many exist

function probeWebGL() {
  if (webglProbe !== undefined) return webglProbe
  webglProbe = false
  try {
    const c = document.createElement('canvas')
    const opts = { failIfMajorPerformanceCaveat: true }
    const gl = c.getContext('webgl2', opts) || c.getContext('webgl', opts)
    if (gl) {
      webglProbe = true
      gl.getExtension('WEBGL_lose_context')?.loseContext() // hand the context back at once
    }
  } catch {
    webglProbe = false
  }
  return webglProbe
}

// Browser only. Returns the argument object for `decideQuality`.
export function detectEnvironment() {
  const mq = (q) => typeof window.matchMedia === 'function' && window.matchMedia(q).matches
  return {
    webgl: probeWebGL(),
    reducedMotion: mq('(prefers-reduced-motion: reduce)'),
    saveData: Boolean(navigator.connection && navigator.connection.saveData),
    hardwareConcurrency: navigator.hardwareConcurrency,
    deviceMemory: navigator.deviceMemory,
    coarsePointer: mq('(pointer: coarse)'),
    width: window.innerWidth,
  }
}
