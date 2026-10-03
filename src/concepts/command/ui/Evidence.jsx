import { cx } from './cx.js'

// Evidence glyphs (doc 5.5): ONE definition used by the legend, the SVG figures and (as the same
// shapes) three.js. A glyph is never the only signal: a word (CONFIRMED, PENDING, ILLUSTRATIVE)
// always sits next to it.
//   confirmed     solid dot, 1 px outline
//   pending       dashed ring, hollow
//   illustrative  hatched square, 45 degrees
// Colour comes from currentColor, so set it with a text-* class.

const BOX = 10

/** The shape alone, as SVG children in a 10 x 10 box. Use inside your own <svg> with a transform. */
export function EvidenceShape({ kind }) {
  if (kind === 'pending') {
    return <circle cx="5" cy="5" r="3.75" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="1.6 1.4" />
  }
  if (kind === 'illustrative') {
    return (
      <>
        <rect x="1" y="1" width="8" height="8" fill="none" stroke="currentColor" strokeWidth="1" />
        <path d="M1 5L5 1M1 9L9 1M5 9L9 5" stroke="currentColor" strokeWidth="1" strokeOpacity="0.7" fill="none" />
      </>
    )
  }
  return <circle cx="5" cy="5" r="4" fill="currentColor" stroke="currentColor" strokeWidth="1" />
}

/** A standalone glyph: <EvidenceDot kind="confirmed|pending|illustrative" size={10} />. */
export function EvidenceDot({ kind = 'confirmed', size = BOX, className }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={size}
      height={size}
      viewBox={`0 0 ${BOX} ${BOX}`}
      className={cx('inline-block shrink-0 align-middle', className)}
      data-evidence={kind}
    >
      <EvidenceShape kind={kind} />
    </svg>
  )
}
