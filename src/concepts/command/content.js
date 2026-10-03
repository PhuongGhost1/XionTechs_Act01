// Every string on the X / Command page. Source tags (see CLAUDE.md "Content rules"):
//   BRIEF     docs/idea/01-X-Command.md, team-authored
//   LIVE      the live xiontechs.com site, captured 2026-09-22
//   VERIFIED  checked against the team's sanitized screenshots in public/work/
//   DRAFT     written for this concept from the sources above, pending sign-off (never used for a fact)
//   PENDING   a value the team has not confirmed; shown to every visitor as "Pending confirmation"
//   ILLUSTRATIVE  not real; always labelled on the page
// Open items: content/TODO.md.

export const PENDING = 'Pending confirmation'

export const brand = {
  name: 'XionTechs',
  logo: { src: '/concepts/command/logo-reversed.png', width: 250, height: 46 }, // white wordmark copy of the team logo
  slogan: ['Get', 'IT', 'Done.'], // BRIEF §15
}

// BRIEF §6. LAB and ABOUT have no real content, so they are not here.
export const nav = {
  tag: 'System / 2026', // BRIEF §6
  items: [
    { label: 'Work', href: '#work', id: 'work' },
    { label: 'Services', href: '#deploy', id: 'deploy' },
    { label: 'Process', href: '#pipeline', id: 'pipeline' },
    { label: 'Signals', href: '#signals', id: 'signals' },
  ],
  cta: { label: 'Start a Project', href: '#build' },
}

// Section index used by the header, the build counter and the scan labels. BRIEF §7 names.
export const sections = [
  { id: 'boot', code: '00', name: 'Boot' },
  { id: 'deploy', code: '01', name: 'What we can deploy' },
  { id: 'pipeline', code: '02', name: 'From request to production' },
  { id: 'work', code: '03', name: 'Selected deployments' },
  { id: 'signals', code: '04', name: 'Engineering signals' },
  { id: 'build', code: '05', name: 'Final build' },
]

// BRIEF §5. Three lines; the last one carries the yellow sweep.
export const hero = {
  boot: '[ BOOTING X-CORE SYSTEM... ]', // BRIEF §14
  headline: ['Engineering', 'that gets', 'IT done.'],
  sweepLine: 2,
  intro:
    'From idea to production, we build digital products, intelligent systems, and scalable software that move businesses forward.',
  primary: { label: 'Start a Project', href: '#build', arrow: true },
  secondary: { label: 'Explore Our Work', href: '#work' },
  // Decorative telemetry corner labels (BRIEF §14 example). The latitude and longitude are the real
  // coordinates of Ho Chi Minh City, where XionTechs has offices; nothing here is a measurement.
  coords: [
    { k: 'SYS', v: 'X-CORE' },
    { k: 'LAT', v: '10.77' },
    { k: 'LON', v: '106.70' },
  ],
  pause: { pause: 'Pause Motion', play: 'Play Motion' },
  fallbackLabel:
    'Diagram: an X-shaped network. Four arms meet at a hub, one for each capability: software engineering, AI systems, cloud and platform, and product development.',
}

// BRIEF §5 labels, tied to the four modules. State words are the brief's hover text ("Available").
// The panel is headed Illustrative: it is a UI motif, not live telemetry.
export const statusPanel = {
  title: 'System status',
  badge: 'Illustrative',
  state: 'Available',
  activation: 'Module activation',
  build: 'Build',
  ready: 'All modules available',
}

// BRIEF §7 module names; BRIEF §14 arm names (AI / CODE / DATA / CLOUD) mapped to the four modules.
// `tools` come from the live site's service copy (LIVE); `pending: true` marks a tool the team has not
// confirmed it wants to market. Summaries are DRAFT.
export const modules = [
  {
    id: 'software',
    code: 'MOD-01',
    arm: 'Code',
    name: 'Software engineering',
    statusLabel: 'API systems',
    summary: 'Custom applications, APIs and internal tools, built by product, backend and frontend engineers.', // DRAFT
    capabilities: ['Custom application development', 'Backend and APIs', 'Frontend', 'Internal tools'], // LIVE service copy
    tools: [{ name: 'React', pending: true }, { name: '.NET', pending: true }], // PLAN §10 example list, not confirmed
    visual: 'stack',
  },
  {
    id: 'ai',
    code: 'MOD-02',
    arm: 'AI',
    name: 'AI systems',
    statusLabel: 'AI agents',
    summary: 'Agents that take a request, decide the next step, use your tools and hand exceptions to a person.', // DRAFT
    capabilities: ['Workflow automation', 'AI routing and decisions', 'Tool integration', 'Human-in-the-loop'], // LIVE service copy
    tools: [{ name: 'Power Platform' }, { name: 'Make' }, { name: 'n8n' }, { name: 'Retool' }, { name: 'Bubble' }], // LIVE
    visual: 'agent',
  },
  {
    id: 'cloud',
    code: 'MOD-03',
    arm: 'Cloud',
    name: 'Cloud & platform',
    statusLabel: 'Cloud',
    summary: 'Cloud foundations and integrations that connect new systems to the software a business already runs.', // DRAFT
    capabilities: ['Cloud and APIs', 'System integration', 'Platform engineering'], // LIVE service copy
    tools: [{ name: 'Azure' }, { name: 'AWS' }, { name: 'GCP' }], // LIVE
    visual: 'cloud',
  },
  {
    id: 'product',
    code: 'MOD-04',
    arm: 'Product',
    name: 'Product development',
    statusLabel: 'Engineering',
    summary: 'From a workflow or an idea to a working product increment, then to a platform that teams use every day.', // DRAFT
    capabilities: ['Enterprise platforms', 'CRM and operations', 'Workflow systems', 'Dedicated engineering capacity'], // LIVE service copy
    tools: [],
    visual: 'product',
  },
]

export const deploy = {
  title: 'What we can deploy',
  intro: 'Four modules, one engineering team. Pick a bay to see what is inside.', // DRAFT
  toolsLabel: 'Tools',
  capabilitiesLabel: 'Capabilities',
  pendingTool: 'Pending',
}

// BRIEF §7 stage names. Descriptions are DRAFT, adapted from the live site's process copy. No digits.
export const pipeline = {
  title: 'From request to production',
  intro: 'One signal travels the whole way. Scroll to move it.', // DRAFT
  stages: [
    { id: 'request', name: 'Request', note: 'A business problem, an idea or a workflow arrives, in whatever shape it is in.' },
    { id: 'discovery', name: 'Discovery', note: 'We work out which workflow or product increment is worth solving first.' },
    { id: 'architecture', name: 'Architecture', note: 'Systems, data and integrations are laid out before anything is built.' },
    { id: 'build', name: 'Build', note: 'A working pilot or product increment, built and reviewed in the open.' },
    { id: 'deploy', name: 'Deploy', note: 'Released into the systems, users and workflows the business already runs.' },
    { id: 'scale', name: 'Scale', note: 'Capability, automation and engineering capacity grow with the work.' },
  ],
}

// Selected deployments. Facts are VERIFIED against the sanitized screenshots (descriptions and visible
// modules come from the team's earlier verified copy). Stack, status and client are PENDING / UNDISCLOSED.
// BRIEF §7 calls StaffXP an "enterprise workforce platform" in "production" on ".NET / React / AI / Cloud":
// none of that is confirmed (content/TODO.md), so the record shows the verified descriptor instead.
export const work = {
  title: 'Selected deployments',
  intro: 'Real products, shown as records. Names and identifying details in the screenshots are replaced with sample values.', // DRAFT
  tabs: [
    { id: 'summary', label: 'Summary' },
    { id: 'spec', label: 'Spec' },
    { id: 'log', label: 'Log' },
    { id: 'screen', label: 'Screen' },
  ],
  columns: { id: 'ID', system: 'System', domain: 'Domain', status: 'Status' },
  open: 'Open record',
  close: 'Close record',
  sampleNote: 'Sample data.',
  pendingScreen: 'Screenshot pending privacy review.',
  // DRAFT: honest note for a record that has no screenshot (the Agent demo is an illustrative scenario).
  noScreen: 'No screenshot. This is an illustrative scenario, not a client system, so there is nothing real to show here.',
  assembly: {
    title: 'Assembly',
    illustrativeChip: 'Illustrative architecture',
    play: 'Replay',
    // Steps follow BRIEF §14 (request packet, architecture nodes, services, interface, final state).
    steps: ['Request packet', 'Architecture', 'Services', 'Interface', 'State'],
    layers: ['Interface', 'API', 'Data', 'Integration'], // generic layers, not a claim about the real stack
    finalState: PENDING,
  },
  records: [
    {
      id: 'DEP-001',
      key: 'staffxp',
      system: 'StaffXP',
      domain: 'Education',
      kind: 'Staff experience platform',
      status: { label: PENDING, tone: 'pending' },
      summary:
        'A staff experience platform that brings everyday activities, notices, wellbeing, tasks and operational information into one workspace.', // VERIFIED
      tags: ['Staff experience', 'Business workflow', 'Role-based platform', 'Integrated operations'], // team tags, pending owner sign-off
      spec: [
        { k: 'Client', v: 'Undisclosed', tone: 'pending' },
        { k: 'Domain', v: 'Education' }, // VERIFIED
        { k: 'Product type', v: 'Staff experience platform' }, // VERIFIED
        { k: 'Sign-in', v: 'Microsoft' }, // VERIFIED, sign-in screenshot
        { k: 'Stack', v: PENDING, tone: 'pending' },
        { k: 'Status', v: PENDING, tone: 'pending' },
      ],
      // What the dashboard screenshot shows (VERIFIED, one line per visible surface).
      log: [
        { t: 'ui', m: 'Academic calendar' },
        { t: 'ui', m: 'To-do list, linked to Microsoft To Do' },
        { t: 'ui', m: 'Notices' },
        { t: 'ui', m: 'Quick links, including employee self-service' },
        { t: 'ui', m: 'Assignments to mark' },
        { t: 'ui', m: 'AI assistant panel' },
      ],
      logTitle: 'Screen inventory',
      screens: [
        {
          src: '/work/staffxp-dashboard.webp',
          alt: 'StaffXP staff dashboard with academic calendar, to-do list, notices, quick links, assignments to mark and an AI assistant panel. Sample data.',
          width: 1869,
          height: 958,
          label: 'Dashboard',
          // % boxes measured on the screenshot (x, y, w, h).
          hotspots: [
            { id: 'calendar', label: 'Academic calendar', box: { x: 0.7, y: 34.4, w: 19.1, h: 61.1 } },
            { id: 'tasks', label: 'To-do list', box: { x: 21.5, y: 34.4, w: 38.2, h: 32.4 } },
            { id: 'notices', label: 'Notices', box: { x: 21.5, y: 69.4, w: 38.2, h: 30.6 } },
            { id: 'links', label: 'Quick links', box: { x: 61.4, y: 34.4, w: 19.1, h: 22.2 } },
            { id: 'marking', label: 'Assignments to mark', box: { x: 61.4, y: 59.3, w: 19.1, h: 34.1 } },
            { id: 'assistant', label: 'AI assistant panel', box: { x: 81.9, y: 5.7, w: 17.8, h: 93.5 } },
          ],
        },
        {
          src: '/work/staffxp-sign-in.webp',
          alt: 'StaffXP sign-in screen with a Sign in with Microsoft button.',
          width: 1874,
          height: 954,
          label: 'Sign-in',
          hotspots: [],
        },
      ],
      assembly: true,
    },
    {
      id: 'DEP-002',
      key: 'ess',
      system: 'ESS',
      domain: 'Enterprise',
      kind: 'Employee self-service',
      status: { label: PENDING, tone: 'pending' },
      summary:
        'A connected employee experience that brings everyday HR actions, workforce information, requests and self-service workflows into one place.', // VERIFIED
      tags: [],
      spec: [
        { k: 'Client', v: 'Undisclosed', tone: 'pending' },
        { k: 'Domain', v: 'Enterprise' }, // VERIFIED
        { k: 'Product type', v: 'Employee self-service portal' }, // VERIFIED
        { k: 'Stack', v: PENDING, tone: 'pending' },
        { k: 'Status', v: PENDING, tone: 'pending' },
      ],
      // Modules visible in the portal screenshot (VERIFIED).
      log: [
        { t: 'ui', m: 'Profile and employment' },
        { t: 'ui', m: 'Company directory and org chart' },
        { t: 'ui', m: 'Skills and performance' },
        { t: 'ui', m: 'Attendance and time off' },
        { t: 'ui', m: 'Requests and approval delegations' },
        { t: 'ui', m: 'Rewards, benefits and payslips' },
        { t: 'ui', m: 'Courses' },
      ],
      logTitle: 'Screen inventory',
      screens: [
        {
          src: '/work/ess-portal.webp',
          alt: 'ESS employee self-service portal: profile, company directory, employment, skills and performance, attendance, rewards, approval delegations, org chart, requests, time off, payslips, tasks and courses. Sample data.',
          width: 1867,
          height: 956,
          label: 'Portal',
          hotspots: [],
        },
      ],
      assembly: false,
    },
    {
      id: 'DEP-003',
      key: 'agents',
      system: 'Agent demo',
      domain: 'AI and automation',
      kind: 'Illustrative scenario',
      status: { label: 'Demo / illustrative', tone: 'illustrative' },
      summary:
        'An illustrative scenario, not a client project: a request reaches an agent, which decides, acts through business systems and hands a judgment call to a person.', // DRAFT, from the team's hero system copy
      tags: [],
      spec: [
        { k: 'Client', v: 'None, not a client project' },
        { k: 'Domain', v: 'AI and automation' },
        { k: 'Human control', v: 'A person approves sensitive decisions' },
        { k: 'Status', v: 'Demo / illustrative', tone: 'illustrative' },
      ],
      log: [
        { t: 'in', m: 'A request or event comes in' },
        { t: 'ai', m: 'The agent understands the request' },
        { t: 'ai', m: 'The agent chooses the next step' },
        { t: 'sys', m: 'The agent works with a business system' },
        { t: 'hum', m: 'A person steps in when judgment is needed' },
        { t: 'out', m: 'The work gets done' },
      ],
      logTitle: 'Illustrative run',
      screens: [],
      assembly: false,
    },
  ],
}

// Engineering signals: categorical evidence, not invented statistics. Every value shows its source.
export const signals = {
  title: 'Engineering signals',
  intro: 'What we can show today, and where it comes from. Anything unconfirmed says so.', // DRAFT
  sourceLabel: 'Source',
  illustrativeLabel: 'illustrative', // DRAFT: chip beside the documented count
  stack: {
    title: 'Stack matrix',
    columns: { item: 'Item', state: 'State', source: 'Source' },
    confirmed: 'Confirmed',
    pending: 'Pending',
    rows: [
      { item: 'Azure', state: 'confirmed', source: 'Live site' },
      { item: 'AWS', state: 'confirmed', source: 'Live site' },
      { item: 'GCP', state: 'confirmed', source: 'Live site' },
      { item: 'Power Platform', state: 'confirmed', source: 'Live site' },
      { item: 'Make', state: 'confirmed', source: 'Live site' },
      { item: 'n8n', state: 'confirmed', source: 'Live site' },
      { item: 'Retool', state: 'confirmed', source: 'Live site' },
      { item: 'Bubble', state: 'confirmed', source: 'Live site' },
      { item: 'React', state: 'pending', source: 'Team plan' },
      { item: '.NET', state: 'pending', source: 'Team plan' },
    ],
  },
  facts: [
    { id: 'offices', value: 3, label: 'Offices', detail: 'Dallas, Ho Chi Minh City and Da Nang', source: 'Live site, to verify' },
    { id: 'leadership', value: 25, suffix: '+', label: 'Years of leadership experience', detail: 'Across the leadership team, in IT services and product engineering', source: 'Live site, to verify' },
  ],
  documented: {
    label: 'Systems documented here',
    detail: 'Two products and one illustrative demo, listed under Selected deployments',
    source: 'This page',
  },
  build: {
    label: 'Build number',
    detail: 'Commits in the repository when this page was built',
    source: 'Git history',
  },
  empty: {
    label: 'Delivery metrics',
    state: 'No data',
    detail: 'Awaiting verified input',
    source: 'Pending',
  },
}

// BRIEF §7 final CTA and §15 ending.
export const finale = {
  kicker: 'Have a system to build?',
  headline: ["Let's get", 'IT', 'done.'], // BRIEF §7 and §15, set on three stepped lines
  cta: { label: 'Start a Project', href: 'mailto:contact@xiontechs.com?subject=Start%20a%20project', arrow: true }, // LIVE address
  logoLabel: 'The XionTechs logo, assembled from points.',
  contactTitle: 'Contact',
}

export const contact = {
  email: 'contact@xiontechs.com', // LIVE
  phones: ['+1 469 322 9899', '+84 908 107 552'], // LIVE
  offices: [
    // LIVE; the full office list is on the release checklist in content/TODO.md
    { city: 'Ho Chi Minh City', address: 'Viettel Tower, Floor 12, 285 CMT8, Ho Chi Minh City 70064, Vietnam' },
    { city: 'Ho Chi Minh City', address: 'Floor 15, B1 Building, 279 Nguyen Tri Phuong, Ho Chi Minh City, Vietnam' },
  ],
  social: [
    { label: 'Facebook', href: 'https://www.facebook.com/xiontechs/' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/company/xiontechs/about/' },
  ],
}

export const footer = {
  line: 'XionTechs. Get IT done.',
  note: 'Design concept 01, X / Command. Not the launch page.',
}
