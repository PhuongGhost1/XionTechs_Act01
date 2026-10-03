import { chips, staffxp } from '../content.js'
import { copy } from './copy.js'

// Pure facts about each plane of the StaffXP model, read from `staffxp.layers` in content.js. The two layers
// that have a real screenshot show it; the data layer draws the modules the product navigation names; the
// rest are dashed placeholder drawings. Nothing is invented here: it only decides which drawing to use.

export const LAYERS = staffxp.layers
export const COUNT = LAYERS.length

/** 'screen' = a real, sanitized screenshot; 'bays' = the visible modules as labelled bays; 'hidden' = a dashed placeholder. */
export function faceKind(layer) {
  if (layer.face) return 'screen'
  if (layer.modules && layer.modules.length > 0) return 'bays'
  return 'hidden'
}

/** The screenshot that belongs to a layer, or null. */
export function shotOf(layer) {
  if (layer.face === 'dashboard') return staffxp.main
  if (layer.face === 'signin') return staffxp.secondary
  return null
}

/** Dashed linework = not confirmed (plan §4): drawn that way on the plane, the tag and the card. */
export const isDashed = (layer) => layer.confirmed === false

/** Drawing code, bottom-up like the levels on sheet 02: the top layer is L05, infrastructure is L01. */
export const layerCode = (index, count = COUNT) => `L${String(count - index).padStart(2, '0')}`

/** The chip text that goes with a layer: what the screenshots show, or the reference model. */
export const statusLabel = (layer) => (layer.confirmed ? chips.confirmed : staffxp.chips.model)

/** Position of a layer in the stack (top = 0), or -1. */
export const indexOfLayer = (id) => LAYERS.findIndex((l) => l.id === id)

/** The note under a layer's detail: none for a layer with a screen, the data note, or the dashed-placeholder note. */
export function noteFor(layer) {
  if (layer.face) return null
  return layer.confirmed ? copy.dataNote : staffxp.noScreen
}
