// Vocabularies shared by the UI primitives. Words come from content/legend.js; these are keys.

/** <Chip kind=...>: always a word, never colour alone (doc 5.5). */
export const CHIP_KINDS = Object.freeze(['live', 'real', 'sample', 'measured', 'build', 'pending', 'illustrative', 'draft'])

/** <EvidenceDot kind=...> and the hero legend: solid dot, dashed ring, hatched square. */
export const EVIDENCE_KINDS = Object.freeze(['confirmed', 'pending', 'illustrative'])

/** True for the structured pending value of content/wrap.js pendingValue(). */
export const isPendingValue = (v) => v !== null && typeof v === 'object' && v.pending === true
