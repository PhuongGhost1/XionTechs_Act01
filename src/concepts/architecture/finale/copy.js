// Extra strings for sheet 07, with a source tag on every value (see content.js for the tags).
//   BRIEF   docs/idea/02-X-Architecture.md
//   DRAFT   written for this concept, pending team sign-off; wording only, never a fact
import { hero } from '../content.js'

export const copy = {
  figureDrawing: hero.figureNote, // BRIEF §14: the exploded model is the hero's reference architecture, illustrative
  figureMark: 'The X mark', // DRAFT: caption once the layers have become the mark
  step: 'Step', // DRAFT: prefix of the assistive text of a chain item
  newTab: 'opens in a new tab', // DRAFT: assistive text for external links
  labels: {
    email: 'Email',
    phone: 'Phone',
    address: 'Address',
    social: 'Social',
    reference: 'Reference',
  }, // DRAFT: title block field names
  logoAlt: 'XionTechs, Get IT Done', // LIVE: the wordmark and slogan the logo image shows
}
