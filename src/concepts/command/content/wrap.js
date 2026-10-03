// Source tags and the wrapper helpers every content file uses (doc 12.1).
//
//   FACT          live xiontechs.com (captured 2026-09-22) or a fact the team stated
//   BRIEF         team-authored docs/idea/v2/01-X-Command.md, counts as a source
//   DRAFT         written for this page from FACT or BRIEF material, pending sign-off.
//                 Always draft: true. Shown marked only in dev or with ?review. Never for a fact.
//   ILLUSTRATIVE  not real. Always labelled on the page for every visitor.
//   PLACEHOLDER   a value not yet known. Rendered as a PENDING chip, never as a made-up string.

export const SOURCES = Object.freeze(['FACT', 'BRIEF', 'DRAFT', 'ILLUSTRATIVE', 'PLACEHOLDER'])

export const LIVE_SITE = 'live-site 2026-09-22'

const make = (id, text, src, extra) => ({
  id,
  text,
  src,
  ...(src === 'DRAFT' ? { draft: true } : {}),
  ...extra,
})

/** A fact taken from the live site. */
export const live = (id, text, extra) => make(id, text, 'FACT', { source: LIVE_SITE, ...extra })

/** A fact the team stated, or that is visible in a real capture. `source` says which. */
export const fact = (id, text, source, extra) => make(id, text, 'FACT', { source, ...extra })

/** Copy from the team's own brief. */
export const brief = (id, text, extra) => make(id, text, 'BRIEF', { source: 'docs/idea/v2/01-X-Command.md', ...extra })

/** Copy written for this page, pending sign-off. Never a fact (a number, a client, an outcome). */
export const draft = (id, text, extra) => make(id, text, 'DRAFT', extra)

/** Artwork or demo copy. The page labels it for every visitor. */
export const illustrative = (id, text, extra) => make(id, text, 'ILLUSTRATIVE', { label: 'ILLUSTRATIVE', ...extra })

/** Wrapper for text standing in for something not yet known. */
export const placeholder = (id, text, extra) => make(id, text, 'PLACEHOLDER', extra)

/**
 * A value that is not known. Renders as a dashed PENDING chip carrying `label`, never as a
 * string. When the team confirms the value, this object is replaced by a sourced wrapper.
 */
export const pendingValue = (id, label) => ({ id, pending: true, label, src: 'PLACEHOLDER' })
