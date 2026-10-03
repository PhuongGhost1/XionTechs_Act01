import { ESS_IMAGE, STAFFXP_IMAGE } from './hotspots.js'
import { brief, draft, fact, illustrative, pendingValue, placeholder } from './wrap.js'

// Station 04 ON FILE (doc 4.6, 8). Three records: StaffXP, ESS and the illustrative agent demo.
//
// What is written here is only what the captures show or the team stated. Everything else is one
// dashed PENDING row per record (not four). The brief's example row (enterprise scale, .NET and
// React, PRODUCTION) is NOT used: none of it is confirmed. The three project-0n write-ups describe
// other projects and supply no claims.
//
// Product names: NAME_PRODUCTS (flags.js) decides whether the page prints StaffXP and ESS or the
// generic names below. Use select.js `displayName` and `specRows`; do not print `name` directly.

const TEAM = 'team-stated'
const CAPTURE = 'real capture, sanitized'

const row = (id, label, value, extra) => ({ id, label, src: 'DRAFT', draft: true, value, ...extra })

const details = (rid) =>
  row(
    `${rid}.row.details`,
    'DETAILS',
    // One structured pending value; the chip is the only place "pending" appears (doc 8.5).
    pendingValue(`${rid}.details`, '[ STACK · STATUS · CLIENT ] ( PENDING TEAM CONFIRMATION )'),
  )

const results = (rid) =>
  row(`${rid}.row.results`, 'RESULTS', placeholder(`${rid}.results`, 'NOT PUBLISHED', { muted: true }))

export const records = [
  {
    id: 'dep-001',
    kind: 'record',
    label: 'STAFFXP',
    parent: 'mod.product',
    evidence: 'fact',
    src: 'FACT',
    source: TEAM,
    code: draft('dep-001.code', 'DEP-001'),
    name: fact('dep-001.name', 'StaffXP', TEAM),
    genericName: draft('dep-001.generic', 'School staff platform'),
    // Open question 5: "staff experience platform" (team fact) vs the sign-in screen's wording.
    descriptor: fact('dep-001.is', 'a staff experience platform for schools', TEAM),
    image: {
      id: 'dep-001.image',
      url: '/work/staffxp-dashboard.webp',
      width: STAFFXP_IMAGE.width,
      height: STAFFXP_IMAGE.height,
      alt: fact('dep-001.image.alt', 'Sanitized capture of the staff platform dashboard, with sample values.', CAPTURE),
      caption: fact('dep-001.image.caption', 'SANITIZED CAPTURE ( SAMPLE VALUES )', CAPTURE),
    },
    hotspots: 'staffxp', // key into content.hotspots
    // Rows after PRODUCT and IS. select.js specRows() prepends those two from name, genericName and
    // descriptor, so the product is named once here and NAME_PRODUCTS can swap it.
    rows: [
      row(
        'dep-001.row.capture',
        'CAPTURE SHOWS',
        fact(
          'dep-001.capture',
          'top navigation (Attendance, Notices, Activities, Wellbeing, Extra-curricular, T&L) · four counters (To mark, Classes, Messages, Tasks) · Academic calendar · To do list (opens in Microsoft To Do) · Notices · Quick links (including Employee self-service) · Assignments to mark · AI assistant panel',
          CAPTURE,
        ),
      ),
      // From the sign-in capture, which is not shown; the fact appears as text only.
      row('dep-001.row.signin', 'SIGN-IN', fact('dep-001.signin', 'Sign in with Microsoft', 'sign-in capture')),
      details('dep-001'),
      results('dep-001'),
    ],
    // The status satellite in the hero core (doc 6.1): pending, dashed, hollow.
    satellite: {
      id: 'dep-001.status',
      kind: 'status',
      label: 'STATUS ( PENDING )',
      parent: 'dep-001',
      evidence: 'pending',
      src: 'PLACEHOLDER',
    },
  },
  {
    id: 'dep-002',
    kind: 'record',
    label: 'ESS',
    parent: 'mod.product',
    evidence: 'fact',
    src: 'FACT',
    source: TEAM,
    code: draft('dep-002.code', 'DEP-002'),
    name: fact('dep-002.name', 'ESS', TEAM),
    genericName: draft('dep-002.generic', 'Employee self-service portal'),
    descriptor: fact('dep-002.is', 'an employee self-service portal', TEAM),
    image: {
      id: 'dep-002.image',
      url: '/work/ess-portal.webp',
      width: ESS_IMAGE.width,
      height: ESS_IMAGE.height,
      alt: fact('dep-002.image.alt', 'Sanitized capture of the employee self-service portal, with sample values.', CAPTURE),
      caption: fact('dep-002.image.caption', 'SANITIZED CAPTURE ( SAMPLE VALUES )', CAPTURE),
    },
    hotspots: 'ess',
    rows: [
      row(
        'dep-002.row.capture',
        'CAPTURE SHOWS',
        fact(
          'dep-002.capture',
          'Profile summary · Company directory search · Employment, Skills & performance, Attendance, Rewards & Benefits, Approval delegations, Org chart · Submit request · Time off balances · Payslips · Tasks · Courses · Academy courses',
          CAPTURE,
        ),
      ),
      details('dep-002'),
      results('dep-002'),
    ],
    satellite: {
      id: 'dep-002.status',
      kind: 'status',
      label: 'STATUS ( PENDING )',
      parent: 'dep-002',
      evidence: 'pending',
      src: 'PLACEHOLDER',
    },
  },
  {
    // No screenshot. A dashed hairline row, hatched node: the third proof point, never delivered work.
    id: 'dep-003',
    kind: 'record',
    label: 'AGENT WORKFLOW DEMO',
    parent: 'mod.ai',
    evidence: 'illustrative',
    src: 'ILLUSTRATIVE',
    code: illustrative('dep-003.code', 'DEP-003'),
    name: illustrative('dep-003.name', 'AGENT WORKFLOW DEMO'),
    genericName: illustrative('dep-003.generic', 'AGENT WORKFLOW DEMO'),
    sentence: illustrative('dep-003.sentence', 'Illustrative demo. Not a client project.'),
    // Lives on the main page (open question 12). Hover or focus should preload the demo chunk.
    link: illustrative('dep-003.link', 'OPEN DEMO', { href: '/#ai-agents', arrow: 'right' }),
    rows: [],
    hotspots: null,
    image: null,
  },
]

// Words around the plates (doc 4.6).
export const onFile = {
  heading: draft('onfile.heading', 'Two products on file.'),
  headingMuted: draft('onfile.heading.muted', 'Anything not confirmed is marked pending.'),
  add: draft('onfile.add', 'ADD TO BRIEF'),
  endLine: draft('onfile.end', 'Have a system to build?'),
  endCta: brief('onfile.end.cta', 'START A PROJECT', { href: '#contact', arrow: 'right' }),
  // Caption under the viewer's sector grid and the touch hint, WP5 may extend.
  tapHint: draft('onfile.tap', 'Tap a row to zoom to its region.'),
  // The region index beside the spec facts: the accessible twin of the boxes over the capture.
  regionsLabel: draft('onfile.regions', 'REGIONS IN THE CAPTURE'),
  resetZoom: draft('onfile.reset', 'SHOW FULL SCREEN'),
  // Tells assistive tech what the region buttons do (the boxes over the image are decorative).
  regionsHint: draft('onfile.regions.hint', 'Select a region to mark it on the capture.'),
}
