// Colour tokens for the WebGL scene (doc 5.1, 6.3): read once at init from the CSS custom
// properties of tokens.css, so the canvas and the page can never disagree and no colour literal
// lives in the scene code.

/** Reads the colour tokens from the page: space separated RGB channels (tokens.css) to 0..1. */
export function readTokens(el = document.documentElement) {
  const cs = getComputedStyle(el)
  const channels = (name) => {
    const parts = cs.getPropertyValue(name).trim().split(/\s+/).map(Number)
    return parts.length === 3 && parts.every(Number.isFinite) ? parts.map((v) => v / 255) : [1, 1, 1]
  }
  const alpha = (name, fallback) => {
    const v = parseFloat(cs.getPropertyValue(name))
    return Number.isFinite(v) ? v : fallback
  }
  return {
    ink: channels('--ink'),
    ink2: channels('--ink-2'),
    ink3: channels('--ink-3'),
    signal: channels('--signal'),
    ghost: [...channels('--ghost'), alpha('--ghost-a', 0.1)],
    hair: [...channels('--hair-strong'), alpha('--hair-strong-a', 0.3)],
  }
}
