// Extra strings for the hero (content.js stays the lead's). Source tags as in content.js:
//   DRAFT   written for this concept, wording only, pending team sign-off
//   MODEL   derived from model/layers.js, so it is true of the drawing by construction
// No em dashes. CSS uppercases the mono labels, so the text here is in normal case.

import { LAYER_COUNT } from '../model/layers.js'

export const heroCopy = {
  elevation: 'Elevation', // DRAFT: the live camera elevation readout, a measured value
  azimuth: 'Azimuth', // DRAFT: the live camera azimuth readout, a measured value
  layersLabel: 'The five layers of the reference architecture', // DRAFT: accessible name of the layer list
  layerDimension: `${LAYER_COUNT} layers`, // MODEL: the count of drawn layers, the symbolic vertical dimension
}
