// Strings for sheet 04 that content.js does not carry. Source tags as in CLAUDE.md "Content rules":
//   BRIEF  docs/idea/02-X-Architecture.md (team-authored)
//   DRAFT  wording written for this concept, pending sign-off; never a fact
// The stage names, descriptions and dimension words are in content.js (`process.stages`). No digits are used as
// facts here: every number on the drawing is a drawing convention (grid letters, sheet code), not a measurement.

import { hero, process, titleBlock } from '../content.js'

const layerLabel = (id) => hero.layers.find((l) => l.id === id).label // BRIEF §14 layer names

export const copy = {
  schedule: 'Drawing schedule', // DRAFT
  stage: process.stageLabel, // DRAFT (content.js)
  of: 'of',
  scale: titleBlock.fields.scale, // BRIEF-derived drawing convention (content.js)
  scaleValue: titleBlock.fields.scaleValue,
  hint: 'Scroll to build the drawing. Choose a stage to jump to it.', // DRAFT

  // What the drawing shows at each stage: the caption under the drawing and its text equivalent. DRAFT wording
  // that only describes the drawing itself.
  shows: [
    'Six nodes marked out on the site, still empty.',
    'The nodes are joined and the layers are outlined flat.',
    'The layers lift apart and gain depth and components.',
    'External systems join at the API layer.',
    'A frame closes around the structure and the layers lock together.',
    'New modules extend outward from the locked structure.',
  ],

  // Marks drawn on the sheet.
  note: { open: 'Dashed: not yet decided', fixed: 'Solid: decided' }, // DRAFT; the page-wide line-type convention
  north: 'N',
  axes: { columns: ['A', 'B', 'C'], rows: ['1', '2'] }, // grid references, a drawing convention
  layers: ['experience', 'services', 'api', 'data'].map(layerLabel), // top to bottom
  api: layerLabel('api'),
  externals: ['Systems', 'Users', 'Data', 'Workflows'], // MOTION §18 (integrate): "systems, users, data and operational workflows"
  locked: 'Locked', // DRAFT
  newModules: 'New modules', // DRAFT; process.stages[5].desc, "Expand capability"
}

/** The text equivalent of the drawing at stage i. */
export function figureLabel(i, count = process.stages.length) {
  const s = process.stages[Math.max(0, i)]
  return `${copy.stage} ${s.no} ${copy.of} ${String(count).padStart(2, '0')}, ${s.label}. ${copy.shows[Math.max(0, i)]}`
}
