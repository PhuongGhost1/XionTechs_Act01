// Extra strings for sheet 06, "Selected work". Everything that is not in ../content.js lives here, with its
// source tag (same vocabulary as content.js):
//   LIVE         the live site / src/content/site.js (verified)
//   DRAFT        wording written for this concept, pending sign-off. Never a fact
//   ILLUSTRATIVE the agent sheet only. Invented on purpose, always labelled on the page
// No numbers, clients, quotes or outcomes are written here. No em dashes in body copy.

export const copy = {
  // The sheet index strip above the two project sheets.
  indexTitle: 'Sheets in this set', // DRAFT
  indexLabel: 'Project sheets', // DRAFT, aria-label of the index
  indexAbove: 'Back to sheet 05', // DRAFT, screen reader hint for the StaffXP entry

  // The plate's title block. The values come from content.titleBlock.fields where they exist.
  titleBlock: { drawing: 'Drawing', sheet: 'Sheet' }, // DRAFT

  ess: {
    fig: 'Fig. 1', // DRAFT
    figTitle: 'ESS portal, home screen', // DRAFT, plain description of the sanitized screenshot
    // LIVE: the same sentence the main page prints (selectedWork.intro), shortened to the screenshot.
    sampleNote: 'Sample data. Names and identifying details are replaced.',
    hint: 'Hover, focus or select a group to find it on the screen.', // DRAFT
  },

  agents: {
    fig: 'Fig. 2', // DRAFT
    figTitle: 'Agent flow', // DRAFT (the Illustrative chip beside it carries the label)
    // Edge labels and the gate's name. Invented on purpose, drawn dashed, labelled Illustrative.
    routine: 'Routine', // ILLUSTRATIVE
    judgment: 'Judgment call', // ILLUSTRATIVE
    approved: 'Approved', // ILLUSTRATIVE
    gate: 'Approval gate', // ILLUSTRATIVE
    dimension: 'Request to done', // ILLUSTRATIVE, symbolic, not a measurement
    // Text equivalent of the drawing (screen readers). Built from content.work.agents.
    altLead: 'Flow, in order:', // DRAFT
    altTail: 'Judgment calls go to a person; routine work goes straight to the business system.', // ILLUSTRATIVE
  },
}
