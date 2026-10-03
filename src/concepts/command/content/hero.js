import { brief, draft } from './wrap.js'

// Station 00 STANDBY (doc 4.2). BRIEF: headline, sub, CTAs. DRAFT: the figure caption.

export const hero = {
  h1: brief('hero.h1', 'ENGINEERING THAT GETS IT DONE.', {
    // The three lines the headline breaks into at phone width (doc 5.2). The last line ends with
    // the yellow full stop, which is drawn (FullStop), not typed: lines carry no period.
    lines: ['ENGINEERING', 'THAT GETS', 'IT DONE'],
  }),
  // Quoted verbatim from the brief, em dash included.
  sub: brief(
    'hero.sub',
    'From idea to production — we build digital products, intelligent systems, and scalable software that move businesses forward.',
  ),
  cta: {
    primary: brief('hero.cta.primary', 'START A PROJECT', { href: '#contact', arrow: 'right' }),
    secondary: brief('hero.cta.secondary', 'EXPLORE OUR WORK', { href: '#work', arrow: 'down' }),
  },
  // The four tags at the arm tips. Labels, numbers and the full tag come from the module.
  tags: [
    { id: 'hero.tag.code', module: 'mod.software', placement: 'nw', src: 'BRIEF' },
    { id: 'hero.tag.ai', module: 'mod.ai', placement: 'ne', src: 'BRIEF' },
    { id: 'hero.tag.cloud', module: 'mod.cloud', placement: 'se', src: 'BRIEF' },
    { id: 'hero.tag.product', module: 'mod.product', placement: 'sw', src: 'BRIEF' },
  ],
  figCaption: draft(
    'hero.figCaption',
    'FIG 01 · X CORE · NODES ARE THE SERVICES WE LIST · LAYOUT IS ARTWORK',
    { label: 'LAYOUT IS ARTWORK' },
  ),
}
