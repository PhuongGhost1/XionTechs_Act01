// Word lighting of the PREMISE statement (M06, doc 7.2). Pure functions, so the effect is a
// function of the scroll position alone: scroll back and the words go dim again, load the page
// halfway down and the right words are already lit (doc 10.4).

const clamp01 = (t) => (Number.isFinite(t) ? (t < 0 ? 0 : t > 1 ? 1 : t) : 0)

/** Where in the viewport the statement starts lighting and where it is done (fractions of vh). */
export const LIGHT_START = 0.82 // the top of the statement reaches 82% of the viewport height
export const LIGHT_END = 0.5 // the bottom of the statement reaches the middle of the viewport

/**
 * Progress 0..1 of the statement for any scrollY. `top` is the statement's document offset and
 * `height` its height. 0 when its top is at LIGHT_START of the viewport, 1 when its bottom is at
 * LIGHT_END.
 */
export function statementProgress(scrollY, top, height, vh) {
  if (![scrollY, top, height, vh].every(Number.isFinite)) return 0
  const start = top - vh * LIGHT_START
  const end = top + height - vh * LIGHT_END
  if (!(end > start)) return scrollY >= start ? 1 : 0
  return clamp01((scrollY - start) / (end - start))
}

/** How many words a lighting ramp spans: each word is part lit while the next one starts. */
export const RAMP = 2

/**
 * The lit amount (0..1) of each of `count` words, followed by one more entry for the full stop,
 * which is lit only when the last word is. Monotonic in `progress`: 0 gives all dim, 1 all lit.
 */
export function litAmounts(progress, count) {
  const p = clamp01(progress)
  const out = []
  for (let i = 0; i <= count; i += 1) out.push(clamp01((p * (count + RAMP) - i) / RAMP))
  return out
}

/** Splits the statement into words and drops the final period (it is drawn as the full stop). */
export function statementWords(text) {
  return String(text)
    .replace(/\.\s*$/, '')
    .split(/\s+/)
    .filter(Boolean)
}
