// Copy for Concept 03 v2, X / Edition "The Proof". Every value carries its source:
//   BRIEF        docs/idea/03-X-Edition.md (team-authored)
//   SITE         imported from src/content/site.js (LIVE / PLAN, verified there); never copied
//   DRAFT        wording written for this concept from SITE material, pending sign-off; flagged
//                `draft: true` and marked on the page in development and with `?review`.
//                Never a fact (a number, a client, an outcome, a technology nobody confirmed)
//   FURNITURE    page furniture (folios, figure numbers, edition label), not a claim
// An `edit` is the copy-editor's pass on a headline: `strike` is drawn through, `insert` is the word
// that stays (it must occur in the headline). Struck words are neutral wordplay from STRIKES only.
import { company, contact, engineering, finalCta, hero, howWeWork, selectedWork, solutions, team, whyUs } from '../../content/site.js'

export const STRIKES = ['People', 'support', 'demo', 'the system', 'offer', 'blog', 'discuss']

export const PENDING = 'Pending confirmation'
export const ILLUSTRATIVE = 'Illustrative'
export const SAMPLE = 'Sample data'

export const edition = {
  label: 'XionTechs / Edition 01', // BRIEF §5
  topics: 'AI · Engineering · Product · Cloud', // BRIEF §5
  year: '2026', // BRIEF §5
  logo: company.logo, // SITE
  logoReversed: { src: '/concepts/edition-v2/logo-reversed.png', width: 250, height: 46 },
}

// Section order, running heads and bands (plan §3). `nav` is the brief's label (BRIEF §6).
export const SECTIONS = [
  { id: 'top', no: '01', head: 'Cover', band: 'paper' },
  { id: 'manifesto', no: '02', head: 'Manifesto', band: 'paper' },
  { id: 'feature', no: '03', head: 'Feature', band: 'navy', nav: 'Work' },
  { id: 'story', no: '04', head: 'Story', band: 'paper' },
  { id: 'index', no: '05', head: 'Index', band: 'alt', nav: 'Services' },
  { id: 'dispatches', no: '06', head: 'Dispatches', band: 'paper', nav: 'Stories' },
  { id: 'about', no: '07', head: 'Contributors', band: 'alt', nav: 'About' },
  { id: 'contact', no: '08', head: 'Sign-off', band: 'navy', nav: 'Contact' },
]

export const chrome = {
  skip: 'Skip to content', // DRAFT (UI label)
  contents: 'Contents',
  close: 'Close',
  pause: 'Pause Motion',
  play: 'Play Motion',
  draft: 'Draft',
}

export const cover = {
  lines: ['The', 'Engineers', 'Behind', 'Digital', 'Products.'], // BRIEF §5
  edit: { strike: 'People', insert: 'Engineers', end: true, keep: true },
  standfirst: company.positioning, // SITE (PLAN §0)
  primary: { label: 'Read the Feature', href: '#feature' }, // DRAFT (UI label)
  secondary: { label: finalCta.primary.label, href: '#contact' }, // SITE
  plate: {
    ...selectedWork.staffxp.main, // SITE: the real, sanitized StaffXP dashboard
    caption: `Fig. 01 · StaffXP · ${SAMPLE}`, // FURNITURE
    loading: '[ plate loading ]',
  },
}

export const manifesto = {
  lines: ['Software', 'should', 'move', 'business.'], // BRIEF §7
  edit: { strike: 'support', insert: 'move', keep: 'lg' },
  // SITE: hero intro (PLAN §3).
  body: hero.intro,
  // SITE: MOTION §17 equation, set as a marginal note.
  equation: engineering.equation,
}

const sx = selectedWork.staffxp
export const feature = {
  numeral: '01', // BRIEF §7 ("01 STAFFXP")
  name: sx.name, // SITE
  kicker: sx.eyebrow, // SITE
  title: 'From business requirements to a production platform.', // BRIEF §7
  edit: { strike: 'demo', insert: 'production' },
  chapters: [
    {
      id: 'problem',
      label: 'The problem', // BRIEF §14
      // DRAFT: paraphrase of the verified descriptor; says nothing about how things were before.
      body: 'School staff work across everyday activities, notices, wellbeing, tasks and operational information. The requirement: one workspace for all of it.',
      draft: true,
      figure: { ...sx.secondary, caption: `Fig. 02 · StaffXP sign-in` },
    },
    {
      id: 'system',
      label: 'The system', // BRIEF §14
      body: sx.desc, // SITE
      hotspotsTitle: sx.hotspotsTitle, // SITE (DRAFT there)
      hotspots: sx.hotspots, // SITE: only UI visible in the screenshot
      figure: { ...sx.main, caption: `Fig. 03 · StaffXP dashboard, annotated · ${SAMPLE}` },
    },
    {
      id: 'result',
      label: 'The result', // BRIEF §14
      body: sx.title, // SITE
      tags: sx.tags, // SITE (to confirm with the project owner, content/TODO.md)
      pending: [`Outcome: ${PENDING.toLowerCase()}`, `Technology: ${PENDING.toLowerCase()}`],
      figure: { ...sx.main, caption: `Fig. 04 · StaffXP dashboard · ${SAMPLE}` },
    },
  ],
}

const ess = selectedWork.ess
export const story = {
  numeral: '02',
  name: ess.name, // SITE
  kicker: ess.eyebrow, // SITE
  title: ess.title, // SITE
  edit: { strike: 'the system', insert: 'the employee' },
  body: ess.desc, // SITE
  areasTitle: ess.areasTitle, // SITE
  areas: ess.areas, // SITE
  scrollHint: ess.scrollHint, // SITE
  figure: { ...ess.screen, caption: `Fig. 05 · ESS portal · ${SAMPLE}` },
  pending: [`Outcome: ${PENDING.toLowerCase()}`],
  sidebar: {
    title: 'An agent at work', // DRAFT
    label: ILLUSTRATIVE,
    steps: hero.system, // SITE (MOTION §5): labels and hints
    note: selectedWork.agentsNote.replace('The agent demo above is the third proof point: ', ''), // SITE
    draft: true,
  },
}

const [agents, software, teams] = solutions.bands
const cloud = engineering.layers.find((l) => l.id === 'cloud')
const ai = engineering.layers.find((l) => l.id === 'ai')
export const index = {
  title: 'What else we engineer.', // DRAFT
  edit: { strike: 'offer', insert: 'engineer' },
  draft: true,
  // Titles are BRIEF §7. Descriptors and lists are SITE unless tagged.
  items: [
    { id: 'product', title: 'Product engineering', desc: software.desc, list: ['Product engineering', 'Custom application development'] },
    { id: 'ai', title: 'AI systems', desc: agents.desc, list: agents.examples, tools: ai.items },
    {
      id: 'cloud',
      title: 'Cloud',
      desc: 'Cloud, APIs and the integrations between the systems a business already runs.', // DRAFT wording from SITE (FAQ, whyUs)
      draft: true,
      list: ['Cloud and APIs'],
      tools: cloud.items,
    },
    { id: 'platform', title: 'Platform', desc: whyUs.pillars[3].desc, list: software.examples },
    { id: 'team', title: 'Team augmentation', desc: teams.desc, list: ['Dedicated engineering capacity'] },
  ],
  toolsLabel: 'Named on xiontechs.com', // FURNITURE: where the tool names come from
}

// DRAFT wording throughout, assembled from sentences already on the main page (whyUs, FAQ, team).
// No dates, bylines, reading times or article counts: these are points of view, not published articles.
export const dispatches = {
  title: 'Notes from the build.', // DRAFT
  edit: { strike: 'blog', insert: 'build' },
  note: 'Points of view, not published articles.', // DRAFT
  draft: true,
  items: [
    {
      id: 'agents',
      kicker: 'AI agents', // BRIEF §7 topic
      title: 'AI where it helps.',
      standfirst: whyUs.pillars[1].desc, // SITE
      paras: [
        'Each agent is built around one workflow rather than a general chatbot.',
        'Agents stop at the steps you mark as needing approval and wait for a person to approve or reject.',
      ],
    },
    {
      id: 'integration',
      kicker: 'System architecture', // BRIEF §7 topic
      title: 'Integration first.',
      standfirst: whyUs.pillars[3].desc, // SITE
      paras: [
        'Agents work through the APIs and integrations your systems already offer, so they read and update the same data your team uses.',
        'Where a system has no API, the integration is planned with you before anything is built.',
      ],
    },
    {
      id: 'increment',
      kicker: 'Product development', // BRIEF §7 topic
      title: 'Start with one workflow.',
      standfirst: team.body, // SITE (DRAFT there)
      paras: [
        'You can start with one workflow or one product increment and expand once you have seen it working with your own data and people.',
        howWeWork.steps[1].desc, // SITE
      ],
    },
  ],
}

export const contributors = {
  title: team.title, // SITE (MOTION §20)
  mark: 'get IT done',
  // Role names are BRIEF §7. A line appears only where the main page already says it (SITE).
  roles: [
    { id: 'engineers', name: 'Engineers', line: teams.desc },
    { id: 'designers', name: 'Designers', line: null },
    { id: 'product', name: 'Product', line: howWeWork.steps[1].desc },
    { id: 'ai', name: 'AI', line: whyUs.pillars[1].desc },
  ],
  facts: team.facts, // SITE (LIVE; on the release checklist)
  portraits: `Portraits: ${PENDING.toLowerCase()}`,
}

export const signoff = {
  lines: ['Have an idea?', 'Let’s build it.'], // BRIEF §7
  edit: { strike: 'discuss', insert: 'build' },
  slogan: 'Get it done.', // BRIEF §2
  intro: finalCta.intro, // SITE
  primary: finalCta.primary, // SITE
  primaryNote: finalCta.primaryNote, // SITE
  colophon: {
    title: 'Colophon', // FURNITURE
    contact, // SITE (LIVE)
    legalName: company.legalName, // SITE
    set: 'Set in Newsreader, Schibsted Grotesk and DM Mono.', // FURNITURE: true of this page
    rev: 'Rev', // FURNITURE: followed by the real git commit count
    concept: 'Design concept 03 v2. Not the launch page.',
  },
}
