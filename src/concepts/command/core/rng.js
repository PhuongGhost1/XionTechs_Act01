// Seeded random numbers for the layouts. Every layout is a pure function of (graph, seed), so the
// SVG figure and the WebGL core place the same node in the same spot on every load and in every
// test. Math.random is never used in core/.

/** mulberry32: a 32 bit generator, small and good enough for artwork. Returns () => [0, 1). */
export function mulberry32(seed) {
  let a = seed >>> 0
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** A generator for a string key: the same name always gives the same stream. */
export function rngFor(key, base = 0x58494f4e) {
  let h = base >>> 0
  for (let i = 0; i < key.length; i += 1) h = Math.imul(h ^ key.charCodeAt(i), 0x01000193) >>> 0
  return mulberry32(h)
}

export const range = (rng, lo, hi) => lo + (hi - lo) * rng()

/** Roughly normal (sum of three uniforms), -1..1, for jitter that clusters near zero. */
export const bell = (rng) => (rng() + rng() + rng() - 1.5) / 1.5
