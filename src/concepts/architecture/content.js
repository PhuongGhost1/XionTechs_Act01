// Every string on the Concept 02 page. Sources, as in CLAUDE.md "Content rules":
//   BRIEF       docs/idea/02-X-Architecture.md (team-authored)
//   LIVE / PLAN verified material from src/content/site.js, imported below, never copied
//   DRAFT       written for this concept from BRIEF / LIVE material, pending team sign-off. Never used for
//               a fact (a number, a client, an outcome, a technology nobody confirmed)
//   ILLUSTRATIVE / PENDING   not real or not confirmed. Always labelled on the page, in dashed line type
// Open items live in content/TODO.md, "Concept 02". Source text is written in normal case; CSS uppercases
// it so screen readers read words. No em dashes in new body copy.

import { company, contact, selectedWork, team } from '../../content/site.js'

export const brand = {
  name: 'XionTechs', // LIVE
  legalName: company.legalName, // LIVE; spelling to verify (content/TODO.md)
  logo: { src: '/XionTechs-Logo_s.png', width: 250, height: 46 }, // the official navy PNG
  // A white-wordmark copy of the same PNG, for the navy sheets. The vector logo has not been supplied.
  logoReversed: { src: '/concepts/architecture/logo-reversed.png', width: 250, height: 46 },
  slogan: ['Get', 'IT', 'Done'], // LIVE / BRIEF
  positioning: company.positioning, // PLAN §0
}

// BRIEF §6: tiny technical metadata beside the navigation. Labels, not claims. REV is the real commit count.
export const meta = { sys: 'SYS.01', arch: 'ARCH.004', build: 'BUILD.2026' }

// Sheet order is the page order. BRIEF §7 numbers the sections 01-07.
export const sheets = [
  { id: 'top', no: '01', code: 'A-001', title: 'Digital architecture studio' },
  { id: 'architecture', no: '02', code: 'A-002', title: 'The architecture' },
  { id: 'capabilities', no: '03', code: 'A-003', title: 'Capability layers' },
  { id: 'process', no: '04', code: 'A-004', title: 'Process' },
  { id: 'staffxp', no: '05', code: 'A-005', title: 'StaffXP, opened' },
  { id: 'work', no: '06', code: 'A-006', title: 'Selected work' },
  { id: 'about', no: '07', code: 'A-007', title: 'Final statement' },
]

export const sheetOf = (id) => sheets.find((s) => s.id === id)

// BRIEF §6 navigation. `contact` is the title block at the foot of sheet 07.
export const nav = [
  { label: 'Capabilities', href: '#capabilities' },
  { label: 'Process', href: '#process' },
  { label: 'Work', href: '#work' },
  { label: 'About', href: '#about' },
  { label: 'Contact', href: '#contact' },
]

export const cta = {
  label: 'Start a Project',
  href: 'mailto:contact@xiontechs.com?subject=Project%20enquiry', // LIVE email, as on the main page
  note: 'Opens an email to contact@xiontechs.com', // main page finalCta.primaryNote
}

// UI words. DRAFT.
export const ui = {
  skip: 'Skip to content',
  pause: 'Pause Motion',
  play: 'Play Motion',
  menuOpen: 'Sheet Index',
  menuClose: 'Close',
  menuTitle: 'Sheet index',
  railLabel: 'Sheets',
  sheet: 'Sheet',
  of: 'of',
  loading: '[ PLOTTING DRAWING A-001... ]', // brief 00, Level 0: a text loader that fits the concept
  rev: 'REV',
}

// The line-type legend (see the plan, §4). Solid navy is confirmed or structural; dashed is anything not
// confirmed; yellow is a measurement or the live signal.
export const legend = {
  title: 'Line types',
  items: [
    { kind: 'solid', label: 'Confirmed or structural' },
    { kind: 'dashed', label: 'Illustrative or pending confirmation' },
    { kind: 'signal', label: 'Measurement and live signal' },
  ],
}

export const chips = {
  illustrative: 'Illustrative',
  pending: 'Pending confirmation',
  reference: 'Reference model',
  confirmed: 'Seen in the product',
  draft: 'Draft',
}

// ------------------------------------------------------------------ 01 hero
export const hero = {
  eyebrow: 'Digital architecture studio', // BRIEF §1
  headline: 'We architect digital systems.', // BRIEF §5
  intro: 'Strategy, architecture, engineering and delivery, connected into one execution layer.', // BRIEF §5
  core: 'We architect digital systems, then engineer them into production.', // BRIEF §1
  primary: { label: 'See the Work', href: '#work' },
  secondary: { label: cta.label, href: cta.href },
  scrollHint: 'Scroll to open the model',
  figureTitle: 'Reference architecture',
  figureNote: 'Reference architecture · illustrative', // not a client system
  viewLabel: 'View',
  // The drawing's five layers (BRIEF §14). Descriptions are DRAFT. Shown as labels with leader lines in the
  // WebGL scene and as a list in the fallback.
  layers: [
    { id: 'experience', label: 'Experience', desc: 'Screens, devices and the interface people use.', draft: true },
    { id: 'services', label: 'Services', desc: 'Business logic, split into modules that can change independently.', draft: true },
    { id: 'api', label: 'API', desc: 'The contracts between every part, and with the systems you already run.', draft: true },
    { id: 'data', label: 'Data', desc: 'Stores that keep the information of the business consistent and reachable.', draft: true },
    { id: 'infrastructure', label: 'Infrastructure', desc: 'Cloud, networks and runtime that carry the whole structure.', draft: true },
  ],
  figureAlt:
    'Drawing of a reference architecture: five layers, experience, services, API, data and infrastructure, that start as one flat plan and lift apart into an exploded model. Illustrative, not a client system.',
}

// ------------------------------------------------------------------ 02 the architecture
export const architecture = {
  kicker: 'The architecture',
  title: 'Products are systems, not isolated screens.', // BRIEF §7 principle
  lede: 'Every screen sits on an application, an API, data and the infrastructure beneath them. We draw the whole section before any of it is built.', // DRAFT
  draft: true,
  hint: 'Hover or focus a level to trace what it carries.', // DRAFT
  loadPath: 'Load path', // DRAFT: the yellow line that runs through every level
  total: 'One system', // symbolic dimension label over the full height
  // BRIEF §7 levels, top to bottom. Descriptions are DRAFT.
  levels: [
    { id: 'business', code: 'L06', label: 'Business', desc: 'The outcome the system exists to serve.' },
    { id: 'product', code: 'L05', label: 'Product', desc: 'What people see, use and decide with.' },
    { id: 'application', code: 'L04', label: 'Application', desc: 'The logic that makes the product behave.' },
    { id: 'api', code: 'L03', label: 'API', desc: 'The contracts between the parts, and with the systems you already run.' },
    { id: 'data', code: 'L02', label: 'Data', desc: 'What the business knows, kept consistent and within reach.' },
    { id: 'infrastructure', code: 'L01', label: 'Infrastructure', desc: 'Where it all runs, and what keeps it running.' },
  ],
}

// ------------------------------------------------------------------ 03 capability layers
// BRIEF §7 names the six layers. Descriptions and examples are LIVE / PLAN wording from src/content/site.js
// where noted; the rest is DRAFT.
export const capabilities = {
  kicker: 'Capability layers',
  title: 'Six layers, one structure.', // DRAFT
  lede: 'Each layer can be engaged on its own. Together they carry a system from the first sketch to production.', // DRAFT
  draft: true,
  expandHint: 'Select a layer to open its drawing.',
  layers: [
    {
      id: 'discovery',
      no: '01',
      label: 'Discovery',
      glyph: 'survey',
      desc: 'Find the workflow, product or engineering opportunity worth solving.', // MOTION §18 (howWeWork.discover)
      items: ['Workflow discovery', 'Product discovery', 'Engineering opportunity'], // DRAFT, from the line above
      draftItems: true,
    },
    {
      id: 'product',
      no: '02',
      label: 'Product',
      glyph: 'screens',
      desc: 'Business applications designed around the way teams actually work.', // PLAN §4 (solutions.software)
      items: ['Enterprise platforms', 'CRM and operations', 'Internal tools', 'Workflow systems'], // PLAN §4
    },
    {
      id: 'application',
      no: '03',
      label: 'Application',
      glyph: 'modules',
      desc: 'Product, backend, frontend, cloud and integration engineers when you need to build.', // PLAN §4 (solutions.teams)
      items: ['Product engineering', 'Custom application development', 'Cloud and APIs', 'Dedicated engineering capacity'], // PLAN §4
    },
    {
      id: 'ai',
      no: '04',
      label: 'AI',
      glyph: 'agent',
      desc: 'Agents that understand requests, make decisions, use tools and hand off exceptions.', // PLAN §4 (solutions.agents)
      items: ['Workflow automation', 'AI routing and decisions', 'Tool integration', 'Human-in-the-loop'], // PLAN §4
      tools: ['Power Platform', 'Make', 'n8n', 'Retool', 'Bubble'], // LIVE service copy (site.js engineering.layers)
    },
    {
      id: 'platform',
      no: '05',
      label: 'Platform',
      glyph: 'bus',
      desc: 'Connect new systems to the software and workflows already used by the business.', // PLAN (whyUs, integration-first)
      items: ['System integration', 'APIs', 'Connected workflows'], // DRAFT
      draftItems: true,
    },
    {
      id: 'cloud',
      no: '06',
      label: 'Cloud',
      glyph: 'nodes',
      desc: 'Where the system runs.', // DRAFT
      items: ['Azure', 'AWS', 'GCP'], // LIVE service copy (site.js engineering.layers)
      draft: true,
    },
  ],
}

// ------------------------------------------------------------------ 04 process
// BRIEF §7 stages; the sentences reuse MOTION §18 where it has one. No durations, cadences or prices: none
// are confirmed. `dim` is a symbolic dimension label, not a measurement.
export const process = {
  kicker: 'Process',
  title: 'How a system gets built.', // DRAFT
  lede: 'Six stages, drawn as one structure that gains depth as work moves forward.', // DRAFT
  draft: true,
  stageLabel: 'Stage',
  stages: [
    { id: 'discover', no: '01', label: 'Discover', dim: 'Site', desc: 'Find the workflow, product or engineering opportunity worth solving.' }, // MOTION §18
    { id: 'architect', no: '02', label: 'Architect', dim: 'Structure', desc: 'Draw the whole system: its layers, its boundaries and how the parts connect.', draft: true },
    { id: 'engineer', no: '03', label: 'Engineer', dim: 'Depth', desc: 'Turn the drawing into a working pilot or product increment.' }, // MOTION §18 (build)
    { id: 'integrate', no: '04', label: 'Integrate', dim: 'Interfaces', desc: 'Connect systems, users, data and operational workflows.' }, // MOTION §18
    { id: 'deploy', no: '05', label: 'Deploy', dim: 'Envelope', desc: 'Release into production, so what ships is what was drawn.', draft: true },
    { id: 'scale', no: '06', label: 'Scale', dim: 'Extension', desc: 'Expand capability, automation and engineering capacity.' }, // MOTION §18
  ],
}

// ------------------------------------------------------------------ 05 StaffXP, opened
const sx = selectedWork.staffxp // LIVE / PLAN §7, verified descriptors and measured screenshots
export const staffxp = {
  kicker: 'Case study',
  name: sx.name,
  eyebrow: sx.eyebrow,
  title: sx.title,
  desc: sx.desc,
  main: sx.main, // the sanitized dashboard screenshot
  secondary: sx.secondary, // the sanitized sign-in screenshot
  hotspots: sx.hotspots, // % boxes measured on the dashboard screenshot
  hotspotsTitle: 'On this screen',
  chips: { model: chips.reference },
  modelNote:
    'The layers are a reference model of how a product like this is organised. Only what appears in the screenshots is confirmed.', // DRAFT
  hint: 'Hover or focus a layer to inspect it. Choose one to bring its screen forward.', // DRAFT
  phases: { closed: 'One system.', open: 'Five layers.', assembled: 'One interface.' }, // DRAFT captions
  fields: { role: 'Role', seen: 'Seen in the product', tech: 'Technology' },
  techPending: 'Pending confirmation',
  noScreen: 'No screen at this layer. It is drawn dashed because nothing here is visible in the product.', // DRAFT
  // Layers top to bottom. `seen` is what the sanitized screenshots visibly show (LIVE); `role` is DRAFT.
  // The brief's MOBILE / ADMIN / CRM / HR nodes and its React / .NET / MySQL hover values are not confirmed
  // for StaffXP, so they do not appear (content/TODO.md).
  layers: [
    {
      id: 'experience',
      label: 'Experience',
      role: 'What staff see and use every day.',
      seen: 'A dashboard with an academic calendar, a to-do list, notices, quick links, assignments to mark and an AI assistant panel.',
      face: 'dashboard',
      confirmed: true,
    },
    {
      id: 'identity',
      label: 'Identity and integration',
      role: 'How staff get in, and how StaffXP reaches the tools they already use.',
      seen: 'Sign in with Microsoft, a link out to Microsoft To Do, and a link to employee self-service.',
      face: 'signin',
      confirmed: true,
    },
    {
      id: 'services',
      label: 'Services and API',
      role: 'The logic and the interfaces between the product and its data.',
      seen: 'Not visible in the product.',
      face: null,
      confirmed: false,
    },
    {
      id: 'data',
      label: 'Operational data',
      role: 'The records behind each part of the day.',
      seen: 'The navigation names Attendance, Notices, Activities, Wellbeing, Extra-curricular and T&L.',
      face: null,
      confirmed: true,
      modules: ['Attendance', 'Notices', 'Activities', 'Wellbeing', 'Extra-curricular', 'T&L'], // visible in the screenshot
    },
    {
      id: 'infrastructure',
      label: 'Infrastructure',
      role: 'Where the product runs.',
      seen: 'Not visible in the product.',
      face: null,
      confirmed: false,
    },
  ],
}

// ------------------------------------------------------------------ 06 selected work
const ess = selectedWork.ess
export const work = {
  kicker: 'Selected work',
  title: 'One sheet per project.', // DRAFT
  lede: 'Each project is drawn the same way: the problem it answers, its architecture, its technology and its outcome.', // DRAFT
  draft: true,
  fields: { problem: 'Problem it answers', architecture: 'Architecture', technology: 'Technology', outcome: 'Outcome' },
  outcomePending: 'No verified outcome or metric has been supplied yet.', // honesty: no invented results
  techPending: 'Pending confirmation',
  index: [
    { id: 'staffxp', code: 'A-005', name: 'StaffXP', href: '#staffxp', note: 'Drawn open above' },
    { id: 'ess', code: 'A-006.1', name: 'ESS', href: '#work-ess' },
    { id: 'agents', code: 'A-006.2', name: 'Agent system', href: '#work-agents', note: chips.illustrative },
  ],
  ess: {
    id: 'work-ess',
    code: 'A-006.1',
    name: ess.name,
    eyebrow: ess.eyebrow,
    title: ess.title,
    problem: ess.desc, // LIVE / PLAN §8, the product's verified remit
    screen: ess.screen,
    areasTitle: ess.areasTitle,
    areas: ess.areas, // LIVE: modules visible in the sanitized screenshot, with measured regions
    architectureNote: 'Six areas, grouped from the modules visible on the screen.', // DRAFT
  },
  agents: {
    id: 'work-agents',
    code: 'A-006.2',
    name: 'Agent system',
    eyebrow: 'AI and automation',
    title: 'An agent with a person in the loop.', // DRAFT
    problem: 'Work that needs speed at most steps and judgment at a few.', // ILLUSTRATIVE
    // The six nodes of the main page's hero system (PLAN / MOTION §5), in order.
    flow: ['Request', 'AI agent', 'Decision', 'Business system', 'Human', 'Done'],
    architectureNote: 'A request reaches an agent, which decides, works with a business system and hands judgment calls to a person.', // LIVE, main page hero.systemLabel in plain words
    outcome: 'Illustrative scenario. Not a client project.', // ILLUSTRATIVE
    note: 'Illustrative scenario, not a client project.',
  },
}

// ------------------------------------------------------------------ 07 final statement
export const finale = {
  statement: ['Good products start', 'with good architecture.'], // BRIEF §7
  slogan: 'Get IT Done.', // BRIEF §7 / LIVE
  chain: ['Architect', 'Engineer', 'Deploy', 'XionTechs'], // BRIEF §14 final transition
  chainLabel: 'From architecture to deployment',
  cta,
}

// ------------------------------------------------------------------ title block (about + contact)
export const titleBlock = {
  about: {
    heading: 'About',
    body: company.positioning, // PLAN §0
    facts: team.facts, // LIVE; both are on the release checklist to verify
    factNote: 'From the live site, to be verified.',
  },
  contact: {
    heading: 'Contact',
    email: contact.email,
    phones: contact.phones,
    addresses: contact.addresses,
    social: contact.social,
  },
  fields: {
    studio: 'Studio',
    drawing: 'Drawing',
    drawingValue: 'Digital systems, architected and engineered', // BRIEF §1, in plain words
    scale: 'Scale',
    scaleValue: 'Not to scale', // drawing convention: NTS
    sheet: 'Sheet',
    revision: 'Revision',
  },
}
