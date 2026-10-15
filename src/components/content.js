// Copy for Concept 01, X / Command. Every value carries its source (CLAUDE.md "Content rules"):
//   CONCEPT §n    docs/idea/01-X-Command.md (the team's art direction for this concept)
//   SITE          reused from src/content/site.js, so it matches the main page
//   LIVE          the live xiontechs.com site, captured 2026-09-22
//   DRAFT         written for this concept, pending team sign-off; flagged `draft: true`
//   ILLUSTRATIVE / PLACEHOLDER   not real; always labelled on the page for every visitor
// Open items live in content/TODO.md ("Concept 01: X / Command").

import { company, contact, engineering, finalCta, selectedWork } from '../content/site'

export const brand = {
  name: company.name,
  // Two colourways of the same wordmark, picked by theme mode (useThemeMode in theme.js) wherever
  // the logo is drawn as a plain <img> — Nav, Footer, FinalCta. `logo` (white, generated from
  // public/XionTechs-Logo_s.png) reads on the two dark themes; `logoLight` (the original navy art)
  // reads on the two light ones. TEMPORARY: replace `logo` with the official reversed logo (SVG).
  // XCoreCanvas's sampleLogoPoints call keeps using `logo` regardless of theme — it only reads the
  // image's alpha mask for shape, and the particles it places are coloured by the scene's own
  // theme tokens, not the source image, so a second variant would be redundant there.
  logo: { src: '/concepts/command/logo-reversed.png', width: company.logo.width, height: company.logo.height },
  logoLight: { src: company.logo.src, width: company.logo.width, height: company.logo.height },
}

// CONCEPT §6: compact, technical navigation. The "Lab" link is left out: there is no Lab page.
export const nav = {
  links: [
    { label: 'Services', href: '#modules' },
    { label: 'Process', href: '#process' },
    { label: 'Work', href: '#deployments' },
    { label: 'About', href: '#signals' },
  ],
  indicator: 'System / 2026',
  cta: { label: 'Start a Project', href: finalCta.primary.href }, // SITE: opens an email
}

// The seven sections in page order. The data core scene still counts six (scene/store.js SECTION_IDS):
// `campus` is an opaque band that covers it, like `signals`. `build` feeds the scroll counter (CONCEPT §14, "Build Counter").
export const sections = [
  { id: 'top', build: '001', label: 'Command' },
  { id: 'modules', build: '002', label: 'Modules' },
  { id: 'process', build: '003', label: 'Pipeline' },
  { id: 'deployments', build: '004', label: 'Deployments' },
  { id: 'campus', build: '005', label: 'Smart school campus' },
  { id: 'signals', build: '006', label: 'Signals' },
  { id: 'contact', build: '007', label: 'Deploy' },
]

// CONCEPT §5.
export const hero = {
  eyebrow: 'XionTechs / X-Core',
  headline: ['Engineering', 'that gets', 'IT done.'],
  headlineAccent: 'IT done.', // the line the yellow highlight sweeps behind
  headlineLabel: 'Engineering that gets IT done.',
  intro:
    'From idea to production — we build digital products, intelligent systems, and scalable software that move businesses forward.',
  primary: { label: 'Start a Project', href: finalCta.primary.href },
  secondary: { label: 'Explore Our Work', href: '#deployments' },
  // CONCEPT §14 hero background: decorative coordinate labels, not claims. LAT/LON is Ho Chi Minh City.
  telemetry: [
    { k: 'SYS', v: '0412' },
    { k: 'LAT', v: '10.77' },
    { k: 'LON', v: '106.70' },
    { k: 'NODE', v: '014' },
  ],
}

// CONCEPT §5 example panel. ILLUSTRATIVE: an interface mock-up with demo values, not live
// monitoring and not a claim about any client system. The panel carries the label on screen.
export const systemStatus = {
  title: 'System status',
  illustrative: true,
  rows: [
    { id: 'agents', label: 'AI agents' },
    { id: 'api', label: 'API systems' },
    { id: 'cloud', label: 'Cloud' },
    { id: 'engineering', label: 'Engineering' },
  ],
  stateLabel: 'Online',
  deployment: { label: 'Deployment', value: 98 },
  build: { label: 'Build', id: '#4821', result: 'Success' },
}

// CONCEPT §7 / 02. Capabilities as system modules. Copy is condensed from LIVE service text and
// SITE (src/content/site.js solutions); `short` is the label the data core's cluster carries.
// Each module has a `kind` that selects its small technical visual.
export const modules = {
  index: '02',
  label: 'What we can deploy',
  title: 'Four modules. One engineering system.',
  intro: 'Software, AI, cloud and product work, deployed on their own or connected into one delivery system.',
  statusLabel: 'Available',
  items: [
    {
      id: 'software',
      index: '01',
      anchor: 'module-1',
      kind: 'code',
      short: 'Code',
      title: 'Software engineering',
      desc: 'Custom applications built around your requirements, and modernization of legacy systems, to remove manual work and raise efficiency.',
      points: ['Custom application development', 'Legacy system modernization', 'APIs and integrations'],
      source: 'LIVE',
    },
    {
      id: 'ai',
      index: '02',
      anchor: 'module-2',
      kind: 'ai',
      short: 'AI',
      title: 'AI systems',
      desc: 'Agents and automation that understand requests, make decisions, use your tools, and hand exceptions to people.',
      points: ['AI agents and workflow automation', 'AI-driven analytics', 'Human-in-the-loop approval'],
      link: { label: 'See an Agent Work', href: '/#ai-agents' }, // the main page's illustrative agent demo
      source: 'SITE',
    },
    {
      id: 'cloud',
      index: '03',
      anchor: 'module-3',
      kind: 'cloud',
      short: 'Cloud',
      title: 'Cloud & platform',
      desc: 'Migration, optimization and integration on Azure, AWS and GCP, plus low-code platforms for faster delivery.',
      points: ['Azure, AWS and GCP', 'Power Platform, Make, n8n, Retool, Bubble', 'Integration with your existing systems'],
      source: 'LIVE',
    },
    {
      id: 'product',
      index: '04',
      anchor: 'module-4',
      kind: 'product',
      short: 'Product',
      title: 'Product development',
      desc: 'From idea to a market-ready product: engineering, co-creation, and dedicated capacity alongside your own team.',
      points: ['Product engineering', 'Product co-creation', 'Dedicated engineering capacity'],
      source: 'LIVE',
    },
  ],
}

// CONCEPT §7 / 03. The four-step operational flow. Step text reuses MOTION §18 wording where it
// exists (via SITE) and is DRAFT otherwise. No durations or cadences: none are confirmed.
// Team review (2026-10-15, Phuong Hoang): dropped Request and Architecture to tighten the pipeline
// to four steps; the title follows the new first/last step, same as before.
export const process = {
  index: '03',
  label: 'How we work',
  title: 'Discovery in. Scale out.',
  intro: 'One pipeline from the first conversation to a system that is running and growing.',
  steps: [
    { id: 'discovery', index: '01', anchor: 'process-1', title: 'Discovery', desc: 'Find the workflow, product, or engineering opportunity worth solving.' },
    { id: 'build', index: '02', anchor: 'process-2', title: 'Build', desc: 'Turn the idea into a working pilot or product increment.' },
    { id: 'deploy', index: '03', anchor: 'process-3', title: 'Deploy', desc: 'Connect systems, users, data, and operational workflows, then release.' },
    { id: 'scale', index: '04', anchor: 'process-4', title: 'Scale', desc: 'Expand capability, automation, and engineering capacity.' },
  ],
}

// CONCEPT §7 / 04. Deployment records, built from the team's real, sanitized screenshots (SITE
// selectedWork). Only UI visible in a screenshot is annotated. STACK and STATUS are not confirmed
// (content/TODO.md), so they render as pending, never as "production".
const toRegions = (list) => list.map((h) => ({ id: h.id, label: h.label, boxes: h.regions ?? [h.box] }))

export const deployments = {
  index: '04',
  // Not "deployments" or "shipped": a project's production status is not confirmed (content/TODO.md).
  label: selectedWork.eyebrow, // SITE: "Selected work"
  title: selectedWork.title, // SITE: "Software we've engineered."
  intro: selectedWork.intro, // SITE
  pendingNote: selectedWork.pendingNote, // SITE
  fields: { sector: 'Sector', seen: 'Seen in the product', stack: 'Stack', status: 'Status' },
  records: [
    {
      id: 'staffxp',
      code: 'Project 001',
      name: selectedWork.staffxp.name,
      kind: selectedWork.staffxp.eyebrow,
      summary: selectedWork.staffxp.desc,
      tags: selectedWork.staffxp.tags, // SITE; tags are awaiting owner confirmation (content/TODO.md)
      tagsDraft: true,
      screen: selectedWork.staffxp.main,
      regionsTitle: selectedWork.staffxp.hotspotsTitle,
      regions: toRegions(selectedWork.staffxp.hotspots.map((h) => ({ id: h.id, label: h.label, box: h.box }))),
      stack: null, // PLACEHOLDER: stack not confirmed
      status: null, // PLACEHOLDER: production status not confirmed
    },
    {
      id: 'ess',
      code: 'Project 002',
      name: selectedWork.ess.name,
      kind: selectedWork.ess.eyebrow,
      summary: selectedWork.ess.desc,
      tags: [],
      screen: selectedWork.ess.screen,
      regionsTitle: selectedWork.ess.areasTitle,
      scrollHint: selectedWork.ess.scrollHint,
      regions: toRegions(selectedWork.ess.areas.map((a) => ({ id: a.id, label: a.label, regions: a.regions }))),
      stack: null,
      status: null,
    },
    {
      id: 'campus',
      code: 'Project 003',
      name: 'Smart school campus', // matches campus.label below
      kind: 'AI and automation',
      // DRAFT: a short version of the campus section's own intro (content.js `campus.intro`),
      // written for the card format. 2026-10-13: this slot used to describe a standalone
      // "Agent demo" section that no longer exists on this page (it moved to /concepts/command/
      // when Command was promoted to the homepage); repointed to the campus demo that replaced it.
      summary: "An illustrative smart-campus model: a school's buildings and rooms, each with simulated climate, occupancy, energy and security readings you can explore in 3D. It's a demo, not a client project.",
      summaryDraft: true,
      tags: [],
      screen: null,
      illustrative: true,
      link: { label: 'See the campus model', href: '#campus' },
      stack: null,
      status: null,
    },
  ],
}

// Section 05, the smart campus: a 3D model of an example school and the IoT services in each room
// (docs/superpowers/specs/2026-10-06-smart-campus-design.md). The campus and its readings are ILLUSTRATIVE
// (campusData.js, campus/simulate.js); the service list is PLACEHOLDER until the team confirms it. The
// wording below is DRAFT, pending sign-off.
// Team review (2026-10-15, Phuong Ghost): the badge/servicesNote chips at the top of the model (and the
// dev-only "Draft copy" tag on the intro) were removed from the page as visual clutter, against this
// file's original "always visible" plan. `badge`/`servicesNote` are kept here, unused, in case the team
// wants to reintroduce the disclosure in a lighter-weight form later; the per-reading "Simulated" tag
// inside the model (campus.simulated) and the Selected Work ledger's "Illustrative" card badge are what's
// left on the page saying this demo isn't real.
export const campus = {
  index: '05',
  label: 'Smart school campus',
  title: 'A school that knows how it is doing.',
  intro:
    'Walk an example campus. Every room carries the sensors and services we connect for schools: climate, air, occupancy, energy, security and anonymous classroom analytics. Scrub through the day to watch it change.',
  draft: true,
  badge: 'Illustrative campus · simulated readings', // no longer rendered, see note above
  servicesNote: 'Services shown are examples pending team confirmation.', // no longer rendered, see note above
  stageLabel: 'Campus model',
  stageHint: 'Hover or tap a building. Drag or use the arrow keys to turn the model, Escape goes back.',
  fallbackNote: 'Flat site plan. The same campus, drawn without 3D.',
  resetView: 'Reset View',
  zoomIn: 'Zoom in',
  zoomOut: 'Zoom out',
  layerLabel: 'Layer',
  campusCrumb: 'Campus',
  simulated: 'Simulated',
  floorNames: ['Ground floor', 'Upper floor'],
  panel: {
    campusTitle: 'Buildings',
    campusIntro: 'Pick a building to open it up and see its rooms.',
    roomsTitle: 'Rooms',
    devices: 'Devices',
    readings: 'Live readings',
    automations: 'Automations',
    services: 'Services',
    engagement: 'Class engagement',
    engagementNote: 'Anonymous and class-level. No faces recognised, no names stored.',
    noClass: 'No class in session',
    status: { ok: 'Normal', attention: 'Needs attention' },
    back: 'Back',
    open: 'Open',
    cameraWall: 'Camera wall',
    cameraWallNote: 'Feeds are rendered from the 3D model: plain figures and cars, never video of people.',
    cameraView: 'Camera view',
    cam: 'Cam',
    rec: 'Rec',
    feedTag: 'Simulated feed', // on every feed, for every visitor
    feedFallback: 'Shows occupancy only. The rendered feed needs the 3D model.',
    // The room panel speaks the vocabulary of an IoT platform: assets, devices, telemetry, alarms, rule chains.
    tabs: { telemetry: 'Telemetry', attributes: 'Attributes', devices: 'Devices', alarms: 'Alarms', rules: 'Rule chain' },
    severity: { CRITICAL: 'Critical', MAJOR: 'Major', MINOR: 'Minor', WARNING: 'Warning' },
    alarm: {
      title: 'Alarms',
      active: 'Active',
      cleared: 'Cleared',
      acked: 'Acknowledged',
      ack: 'Acknowledge',
      none: 'No alarms so far today.',
      noneActive: 'No active alarms.',
      originator: 'Originator',
      note: 'Simulated alarms raised by the rule chain. Acknowledging only changes this page.',
    },
    attr: {
      type: 'Asset type',
      code: 'Asset code',
      parent: 'Belongs to',
      relation: 'Relation',
      floor: 'Floor',
      usage: 'Usage',
      capacity: 'Capacity',
      devices: 'Devices',
      room: 'Room',
      zone: 'Zone',
      contains: 'Contains',
      open: 'Open air',
    },
    device: { profile: 'Profile', transport: 'Transport', keys: 'Telemetry keys' },
    chain: { input: 'Telemetry', save: 'Save time series', filter: 'Filter', alarm: 'Create alarm', action: 'Action', none: 'No alarm rules watch this room.', other: 'Other automations' },
  },
  day: { label: 'School day', play: 'Play Day', pause: 'Pause Day', scrubber: 'Time of day' },
  pauseMotion: { pause: 'Pause Motion', play: 'Play Motion' },
}

// CONCEPT §7 / 05. Engineering signals. Only figures the live site states are shown as numbers
// (SITE team.facts). Figures that do not exist yet are PLACEHOLDER tiles, never invented numbers.
export const signals = {
  index: '06',
  label: 'Engineering signals',
  title: 'What the system is made of.',
  intro: 'The figures we can stand behind today, the technologies the live site names, and the numbers still to come.',
  metrics: [
    { id: 'leadership', value: 25, suffix: '+', label: 'Years of leadership experience', note: 'Across our leadership team', source: 'LIVE' },
    {
      id: 'offices',
      value: 3,
      label: 'Offices',
      note: 'Dallas, Ho Chi Minh City and Da Nang',
      source: 'LIVE',
      confirm: true, // the two street addresses on file are both in Ho Chi Minh City (content/TODO.md)
    },
    { id: 'delivered', placeholder: true, label: 'Projects delivered', note: 'The real count goes here' },
    { id: 'engineers', placeholder: true, label: 'Engineers on the team', note: 'The real count goes here' },
  ],
  confirmLabel: 'To confirm',
  placeholderLabel: 'Placeholder',
  stackTitle: 'Capability map',
  stackNote: 'Technologies named on xiontechs.com. A layer marked to confirm is waiting for the team to sign off its technologies.',
}

// Capability map rows come from SITE engineering.layers so both pages agree. A row's `items`
// string ("Azure, AWS, GCP", ".NET and APIs") is split into chips; `draft` follows the layer.
export function toCapabilityMap(layers = engineering.layers) {
  return layers.map((layer) => ({
    id: layer.id,
    label: layer.label,
    draft: Boolean(layer.draft),
    chips: layer.items ? layer.items.split(/,\s*|\s+and\s+/).filter(Boolean) : [],
  }))
}
export const capabilityMap = toCapabilityMap()

// CONCEPT §7 / 06 and §15. The closing statement and the signature ending.
export const finale = {
  index: '07',
  kicker: 'Have a system to build?',
  title: 'Let’s get it done.',
  slogan: ['Get', 'IT', 'Done.'], // set as a staircase; the accessible name is `title`
  primary: { ...finalCta.primary, label: 'Start a Project' }, // SITE href: opens an email to contact@xiontechs.com
  primaryNote: finalCta.primaryNote,
  secondary: finalCta.secondary, // SITE: "See an Agent Work"
  agentHref: '/#ai-agents', // the main page's illustrative agent demo
}

export const footer = {
  email: contact.email,
  phones: contact.phones,
  addresses: contact.addresses,
  social: contact.social,
  positioning: company.positioning,
  note: 'Concept 01 of the XionTechs design exploration.',
  copyright: `© ${new Date().getFullYear()} ${company.name}`, // the legal name is still to be verified
}
