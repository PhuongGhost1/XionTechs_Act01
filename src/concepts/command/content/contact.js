import { brief, draft, live, placeholder } from './wrap.js'

// Station 06 DONE and the contact composer (doc 4.8, 4.9).
//
// FACT (live site): the email, the two phone numbers, the LinkedIn and Facebook pages.
// BRIEF: the finale words. DRAFT: composer labels and microcopy, and the mail body template.
// PLACEHOLDER (shown only under ?review, never in production): offices, street addresses and the
// legal name, which the team has not confirmed.

const endpoint = (id, kind, label, text, href) => live(id, text, { kind, label, href })

export const contact = {
  // The finale (doc 4.8). Three stair-stepped lines; the yellow full stop is drawn.
  finale: {
    lines: [brief('finale.get', 'GET'), brief('finale.it', 'IT'), brief('finale.done', 'DONE')],
    kicker: brief('finale.kicker', 'HAVE A SYSTEM TO BUILD?'),
    line: brief('finale.line', 'LET’S GET IT DONE.'),
  },

  composer: {
    heading: draft('contact.heading', 'Tell us what to build.'),
    briefLabel: draft('contact.brief.label', 'YOUR BRIEF'),
    briefEmpty: draft('contact.brief.empty', '( nothing selected yet )'),
    noteLabel: draft('contact.note.label', 'TELL US ABOUT THE SYSTEM'),
    noteOptional: draft('contact.note.optional', '( optional )'),
    // Shown only when the note is long enough that the email link has to cut it (brief.js cap).
    noteLong: draft('contact.note.long', 'Long note. The email keeps the start of it and marks the cut.'),
    send: draft('contact.send', 'SEND EMAIL'),
    copy: draft('contact.copy', 'COPY TEXT'),
    copied: draft('contact.copied', 'COPIED'),
    // Neither the clipboard API nor the selection fallback worked: the text is shown selected instead.
    copyFailed: draft('contact.copy.failed', 'Copy was blocked. The text is selected below: copy it by hand.'),
    clear: draft('contact.clear', 'CLEAR'),
    sendHint: draft('contact.send.hint', 'Opens your mail app. Nothing is stored.'),
    copyHint: draft('contact.copy.hint', 'Mail app did not open? Copy the text instead.'),
  },

  // The email's own words, assembled by contract/brief.js. Subject and greeting are DRAFT.
  mail: {
    subject: draft('mail.subject', 'Project enquiry'),
    greeting: draft('mail.greeting', 'Hello XionTechs,'),
    intro: draft('mail.intro', 'I would like to talk about a project.'),
    servicesHeading: draft('mail.services', 'Services I am interested in:'),
    recordsHeading: draft('mail.records', 'I looked at:'),
    noteHeading: draft('mail.note', 'About the system:'),
    truncated: draft('mail.truncated', '[ shortened ]'),
  },

  // Read out by screen readers after an endpoint that leaves the page (LinkedIn, Facebook).
  newTab: draft('contact.newtab', '( opens in a new tab )'),

  endpoints: [
    endpoint('contact.email', 'email', 'EMAIL', 'contact@xiontechs.com', 'mailto:contact@xiontechs.com'),
    endpoint('contact.phone.us', 'phone', 'PHONE US', '+1 469 322 9899', 'tel:+14693229899'),
    endpoint('contact.phone.vn', 'phone', 'PHONE VN', '+84 908 107 552', 'tel:+84908107552'),
    // Real pages from the live site (supplied by the team).
    endpoint(
      'contact.linkedin',
      'social',
      'LINKEDIN',
      'linkedin.com/company/xiontechs',
      'https://www.linkedin.com/company/xiontechs/about/',
    ),
    endpoint('contact.facebook', 'social', 'FACEBOOK', 'facebook.com/xiontechs', 'https://www.facebook.com/xiontechs/'),
  ],

  footer: {
    description: draft(
      'footer.description',
      'An engineering and AI team: custom software, intelligent systems, cloud platforms and staffing.',
    ),
  },

  // Not confirmed. Rendered only when ?review is set, each with a PENDING chip (open questions 2, 3).
  review: {
    offices: [
      placeholder('review.office.dallas', 'Dallas', { reviewOnly: true }),
      placeholder('review.office.hcmc', 'Ho Chi Minh City', { reviewOnly: true }),
      placeholder('review.office.danang', 'Da Nang', { reviewOnly: true }),
    ],
    legalName: placeholder('review.legalName', 'XionTech Joint Stock Company', { reviewOnly: true }),
  },
}
