// Pure logic for the page frame (Nav, BuildHud): which section is active, what the build readout
// says, and when the transient effects may play. No DOM, so it is tested in node.

// The active section is the one that holds this fraction of the viewport height (from the top).
export const ACTIVE_LINE = 0.45

// Sections whose activation sends the yellow signal line across the viewport (M4).
export const SIGNAL_SECTIONS = ['modules', 'process', 'deployments', 'contact']

// `sections` is [{ id, top }] in page order, `top` being the section's top edge in viewport px.
// The active section is the last one that has started above the line, so a gap between two
// sections (or the footer after the last one) keeps the previous section active.
export function pickActiveSection(sections, viewportHeight, ratio = ACTIVE_LINE) {
  if (!sections.length) return null
  const line = viewportHeight * ratio
  let current = sections[0].id
  for (const section of sections) {
    if (section.top > line) break
    current = section.id
  }
  return current
}

// A nav link is active when it points at the active section ("#process" for "process").
export const isActiveHref = (href, sectionId) => href === `#${sectionId}`

export const isSignalSection = (id) => SIGNAL_SECTIONS.includes(id)

// Text for the bottom-left readout: "BUILD 003 / 006 · PIPELINE". An unknown id reads as the first.
export function readout(sections, id) {
  const found = sections.find((s) => s.id === id) ?? sections[0]
  return { build: found.build, total: String(sections.length).padStart(found.build.length, '0'), label: found.label }
}

// The scan line and signal line are one-off flourishes: never for reduced motion, never while
// the visitor has paused motion.
export const shouldPlayTransient = ({ reduced, paused }) => !reduced && !paused
