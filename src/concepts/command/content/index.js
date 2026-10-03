import { brand, frame } from './brand.js'
import { contact } from './contact.js'
import { flags } from './flags.js'
import { ESS_HOTSPOTS, ESS_IMAGE, STAFFXP_HOTSPOTS, STAFFXP_IMAGE, hotspotEvidence } from './hotspots.js'
import { hero } from './hero.js'
import { ledger } from './ledger.js'
import { legend } from './legend.js'
import { core, deploy, modules } from './modules.js'
import { premise } from './premise.js'
import { processContent } from './process.js'
import { onFile, records } from './records.js'
import { validateContent } from './validate.js'

// The single door to the copy of Concept 01 v2. Sections import from here, never hardcode strings.
// Frozen deeply, and in dev (and tests) checked against the rules of doc 12.4 at import time, so a
// broken edit shows up as an error on the page instead of as a quietly dishonest label.

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const v of Object.values(value)) deepFreeze(v)
  }
  return value
}

export const content = deepFreeze({
  brand,
  frame,
  hero,
  premise,
  core,
  modules,
  deploy,
  process: processContent,
  records,
  onFile,
  hotspots: {
    visibleLine: hotspotEvidence, // third line of the full tag: VISIBLE IN CAPTURE
    staffxp: { image: STAFFXP_IMAGE, boxes: STAFFXP_HOTSPOTS },
    ess: { image: ESS_IMAGE, boxes: ESS_HOTSPOTS },
  },
  ledger,
  contact,
  legend,
  flags,
})

if (import.meta.env?.DEV) {
  const problems = validateContent(content)
  if (problems.length) {
    throw new Error(`content/ breaks the honesty rules:\n  ${problems.join('\n  ')}`)
  }
}

export { brand, frame, hero, premise, core, modules, deploy, records, onFile, ledger, contact, legend, flags }
export { processContent as process }
export { STAFFXP_IMAGE, ESS_IMAGE, STAFFXP_HOTSPOTS, ESS_HOTSPOTS, hotspotEvidence } from './hotspots.js'
export * from './select.js'
export { NAME_PRODUCTS, SHOW_REPO_STRIP, isReviewMode, showDraftMarks } from './flags.js'
export { validateContent } from './validate.js'
export default content
