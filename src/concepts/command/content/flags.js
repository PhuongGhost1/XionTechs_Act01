// Content flags (doc 12.2 `flags`). Not copy, so they carry no source tag.

/**
 * Whether the page prints the product names StaffXP and ESS (open question 7). The team's
 * decision for now: yes (the captures show the names in their top bars anyway). When false,
 * select.js displayName() and specRows() fall back to the generic names.
 */
export const NAME_PRODUCTS = true

/** P2 and not built: a weekly commit strip labelled "this site's repository". */
export const SHOW_REPO_STRIP = false

/**
 * True when the URL carries ?review. Safe without a window (tests, SSR).
 */
export function isReviewMode() {
  try {
    return typeof location !== 'undefined' && new URLSearchParams(location.search).has('review')
  } catch {
    return false
  }
}

/**
 * DRAFT marks and the review-only rows (offices, legal name, the DRAFT ledger row) are shown in
 * `npm run dev` and on any build opened with ?review. Production visitors see draft copy unmarked.
 */
export function showDraftMarks() {
  const dev = typeof import.meta !== 'undefined' && Boolean(import.meta.env?.DEV)
  return dev || isReviewMode()
}

export const flags = Object.freeze({ NAME_PRODUCTS, SHOW_REPO_STRIP })
