// Extra strings for sheet 02. Source tags as in content.js. Source text is written in normal case; CSS
// uppercases it. No em dashes. Nothing here is a fact about XionTechs: it is drawing furniture.

import { architecture, titleBlock } from '../content.js'

export const copy = {
  // Drawing title, as under a view on a real sheet: a section mark, a name and the scale note.
  drawingMark: 'A', // DRAFT, drawing convention
  drawingTitle: 'Section A-A', // DRAFT, drawing convention
  drawingScale: `${titleBlock.fields.scale}: ${titleBlock.fields.scaleValue}`, // content.js titleBlock (BRIEF convention NTS)
  // The key under the drawing. `load` reuses the content label so the two always agree.
  keyTitle: 'Key', // DRAFT
  key: [
    { kind: 'datum', label: 'Level datum' }, // DRAFT
    { kind: 'slab', label: 'Floor slab' }, // DRAFT
    { kind: 'load', label: architecture.loadPath }, // content.js
  ],
  joiner: 'to', // DRAFT, joins the first and the chosen level in the caption
  pressHint: 'Press a level to hold its load path.', // DRAFT, for touch and keyboard, where there is no hover
}
