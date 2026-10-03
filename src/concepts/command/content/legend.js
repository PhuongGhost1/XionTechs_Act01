import { draft } from './wrap.js'

// The honesty system's words (doc 5.5). A chip is always a word, never colour alone.
// `glyphs` is the always-visible hero legend: solid dot, dashed ring, hatched square.
// `chips` is the vocabulary of <Chip kind=...>; the kind is the key used by ledger rows and by
// the data-chip attribute that the chip highlight (M18) selects on.

export const legend = {
  glyphs: [
    draft('legend.confirmed', 'CONFIRMED', { kind: 'confirmed' }),
    draft('legend.pending', 'PENDING', { kind: 'pending' }),
    draft('legend.illustrative', 'ILLUSTRATIVE', { kind: 'illustrative' }),
  ],
  chips: [
    draft('chip.live', 'LIVE', { kind: 'live' }),
    draft('chip.real', 'REAL', { kind: 'real' }),
    draft('chip.sample', 'SAMPLE', { kind: 'sample' }),
    draft('chip.measured', 'MEASURED', { kind: 'measured' }),
    draft('chip.build', 'BUILD', { kind: 'build' }),
    draft('chip.pending', 'PENDING', { kind: 'pending' }),
    draft('chip.illustrative', 'ILLUSTRATIVE', { kind: 'illustrative' }),
    // Shown only in dev or with ?review (flags.showDraftMarks).
    draft('chip.draft', 'DRAFT', { kind: 'draft' }),
  ],
  // One short line per chip, for the ledger and for title attributes.
  meanings: {
    live: draft('legend.live.meaning', 'From the live xiontechs.com site.'),
    real: draft('legend.real.meaning', 'A real capture, sanitized.'),
    sample: draft('legend.sample.meaning', 'A sample value, not real data.'),
    measured: draft('legend.measured.meaning', 'Measured on this device.'),
    build: draft('legend.build.meaning', 'Written at build time.'),
    pending: draft('legend.pending.meaning', 'Not confirmed by the team yet.'),
    illustrative: draft('legend.illustrative.meaning', 'Artwork or demo, not client work.'),
    draft: draft('legend.draft.meaning', 'Wording awaiting sign-off.'),
  },
}
