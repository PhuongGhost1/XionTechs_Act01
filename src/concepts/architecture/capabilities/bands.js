// Pure helpers for sheet 03, "Capability layers": the accordion keyboard model and the drawing codes. No React.

/** The six plan-view glyphs, by the name content.js gives each layer (drawn in Glyph.jsx). */
export const GLYPH_NAMES = ['survey', 'screens', 'modules', 'agent', 'bus', 'nodes']

/** Only one band is open at a time: choosing the open one closes it, choosing another replaces it. */
export const nextOpen = (current, id) => (current === id ? null : id)

/** The band to focus for an arrow, Home or End key, or null for any other key. Wraps at both ends. */
export function focusTarget(key, index, count) {
  switch (key) {
    case 'ArrowDown':
      return (index + 1) % count
    case 'ArrowUp':
      return (index - 1 + count) % count
    case 'Home':
      return 0
    case 'End':
      return count - 1
    default:
      return null
  }
}

/** The sub-drawing code of a layer: sheet A-003 holds drawings A-003.1 to A-003.6. */
export const drawingCode = (sheetCode, index) => `${sheetCode}.${index + 1}`

/** The ids that tie a header button to its panel for aria-controls / aria-labelledby. */
export const bandIds = (base, id) => ({ head: `${base}-head-${id}`, panel: `${base}-panel-${id}` })
