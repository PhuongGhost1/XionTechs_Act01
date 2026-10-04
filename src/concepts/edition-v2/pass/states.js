// Pure logic for the copy-edit pass. A heading starts as a draft and is passed exactly once.

export const DRAFT = 'draft'
export const CLEAN = 'clean'
export const PASS_THRESHOLD = 0.55

// One-way: once clean, a heading never reverts when scrolled away.
export function nextPass(state, { ratio = 0, off = false } = {}) {
  if (state === CLEAN || off) return CLEAN
  return ratio >= PASS_THRESHOLD ? CLEAN : DRAFT
}

// Splits `text` around the first occurrence of `word`. Null when the word is missing.
export function editParts(text, word) {
  if (!word) return null
  const at = text.indexOf(word)
  if (at < 0) return null
  return { before: text.slice(0, at), match: word, after: text.slice(at + word.length) }
}

// Scroll progress of a box, clamped to 0..1.
//   exit:    0 while its top is at or below `offset`, 1 once it has scrolled fully past
//   through: for a tall container with a sticky child; 0 when it pins, 1 when it releases
export function progress({ top, height }, viewport, mode = 'exit', offset = 0) {
  const span = mode === 'through' ? height - (viewport - offset) : height
  if (span <= 0) return 0
  return Math.min(1, Math.max(0, (offset - top) / span))
}
