import { draft } from './wrap.js'

// Station 05 LEDGER, "what on this page is real" (doc 4.7). Six rows, REAL first: a legend chip
// kind, a plain sentence and where it appears. Clicking a row highlights every chip of that kind
// (M18), so `kind` must match a chip kind in legend.js and the data-chip attribute on <Chip>.
//
// The sentences name no product, so they stay true when NAME_PRODUCTS is false.
// "Where it appears" names the stations that carry a chip of that kind in the page as rendered (the
// contact endpoints carry none, and the X is artwork, not a chip), so the words match the outline
// that selecting the row draws.
// The DRAFT row only shows in dev or with ?review (devOnly), because a visitor must not read
// "this wording awaits sign-off" in production (plan: no development labels in production).

const rowOf = (kind, text, where, extra) => ({
  ...draft(`ledger.${kind}`, text, extra),
  kind,
  where: draft(`ledger.${kind}.where`, where),
})

export const ledger = {
  heading: draft('ledger.heading', 'What on this page is real.'),
  // Panel anatomy (doc 4.7): title, scope, one sentence of definition, then the table.
  panel: {
    title: draft('ledger.panel.title', 'PROVENANCE'),
    scope: draft('ledger.panel.scope', 'SCOPE ( THIS PAGE )'),
    definition: draft(
      'ledger.panel.definition',
      'Every chip on this page is one of these kinds. Select a row to outline each chip of that kind.',
    ),
  },
  columns: {
    kind: draft('ledger.col.kind', 'KIND'),
    meaning: draft('ledger.col.meaning', 'WHAT IT MEANS'),
    where: draft('ledger.col.where', 'WHERE IT APPEARS'),
  },
  // Spoken and printed after a row is selected. The count is how many chips were outlined.
  outlined: draft('ledger.outlined', 'chips outlined'),
  outlinedOne: draft('ledger.outlined.one', 'chip outlined'),
  none: draft('ledger.none', 'No chip of this kind is on the page right now.'),
  rows: [
    rowOf(
      'live',
      'The eight services, the contact details and the 25+ years sentence come from xiontechs.com, captured 2026-09-22.',
      'Services, premise',
    ),
    rowOf(
      'real',
      'The two product screens are the team’s own, sanitized before publication.',
      'Selected deployments',
    ),
    rowOf('sample', 'Names, staff IDs and numbers inside those screens are sample values.', 'Selected deployments'),
    rowOf(
      'illustrative',
      'The agent workflow demo, the failure beat in the line and the layout of the X are artwork, not client work.',
      'The line, selected deployments',
    ),
    rowOf(
      'draft',
      'Module and process wording is written for this page and awaits sign-off.',
      'Services',
      { devOnly: true },
    ),
    rowOf(
      'pending',
      'Stack, status, client and results for each product; offices; legal name. Not published until the team confirms them.',
      'Selected deployments',
    ),
  ],
  // Two sourced lines under the table. The BUILD values are injected at build (runtime/build.js).
  buildLabel: draft('ledger.build', 'BUILD'),
  counterNote: draft(
    'ledger.counterNote',
    'BUILD 00n is which section you are in. It is a UI state, not a claim.',
  ),
  // P2, behind flags.SHOW_REPO_STRIP, not built. The caption never claims company delivery history.
  repo: {
    label: draft('ledger.repo.label', 'THIS SITE’S REPOSITORY'),
    caption: draft('ledger.repo.caption', 'this page, built with AI assistance, real git history'),
  },
  unavailable: draft('ledger.unavailable', 'N/A'),
}
