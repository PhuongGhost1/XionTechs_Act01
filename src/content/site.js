// Content sourced from the live xiontechs.com homepage (screenshots + HTML captured 2026-09-22),
// unless marked PLACEHOLDER. Anything marked PLACEHOLDER must be replaced with real data before
// demo day (see content/TODO.md).

export const company = {
  name: 'XionTechs',
  legalName: 'XionTech Joint Stock Company', // LIVE; spelling to verify (content/TODO.md)
  logo: { src: '/XionTechs-Logo_s.png', width: 250, height: 46 },
  tagline: 'Get IT Done',
  // PLAN §0 core positioning.
  positioning: 'XionTechs builds AI-enabled software and provides the engineering capability to get real business work done.',
}

// Source: redesign plan v3 §2. Anchor navigation; the demo is a capability, not a product page.
export const nav = [
  { label: 'Solutions', href: '#solutions' },
  { label: 'AI Agents', href: '#ai-agents' },
  { label: 'Selected Work', href: '#work' },
  { label: 'How We Work', href: '#how-we-work' },
  { label: 'Why Us', href: '#why-us' },
  { label: 'FAQ', href: '#faq' },
]

export const navCta = { label: 'Talk to Us', href: '#contact' }

// PLAN §3. `system` is the hero diagram: Request → AI → Business logic → Existing systems → Human.
export const hero = {
  eyebrow: 'Get IT Done',
  headline: 'AI agents and software engineering for the work that matters.',
  headlineAccent: 'the work that matters',
  intro:
    'XionTechs helps businesses turn ideas, workflows and operational problems into production-ready software, from AI agents to complete engineering teams.',
  primary: { label: 'See What We Build', href: '#work' },
  secondary: { label: 'Talk to Us', href: '#contact' },
  system: ['Request', 'AI', 'Business logic', 'Existing systems', 'Human'],
  systemLabel: 'Diagram: a request goes to AI, then business logic, then your existing systems, then a person.',
}

// PLAN §4. Three capability bands instead of three equal cards.
export const solutions = {
  eyebrow: 'Solutions',
  title: 'One engineering partner. From AI to software.',
  bands: [
    {
      id: 'agents',
      title: 'AI agents',
      icon: 'Bot',
      desc: 'Agents that understand requests, make decisions, use tools, and hand off exceptions.',
      examples: ['Workflow automation', 'AI routing and decisions', 'Tool integration', 'Human-in-the-loop'],
      link: { label: 'See an Agent Work', href: '#ai-agents', preloadDemo: true },
    },
    {
      id: 'software',
      title: 'Business software',
      icon: 'LayoutGrid',
      desc: 'Business applications designed around the way teams actually work.',
      examples: ['Enterprise platforms', 'CRM and operations', 'Internal tools', 'Workflow systems'],
      link: { label: 'See Selected Work', href: '#work' },
    },
    {
      id: 'teams',
      title: 'Engineering teams',
      icon: 'Users',
      desc: 'Product, backend, frontend, cloud, and integration engineers when you need to build.',
      examples: ['Product engineering', 'Custom application development', 'Cloud and APIs', 'Dedicated engineering capacity'],
    },
  ],
}

export const stats = [
  {
    value: '25+',
    label: 'Years of Leadership Experience',
    desc: 'Our leadership team brings decades of expertise in IT services and product engineering across multiple industries and technology transformations.',
    icon: 'Award',
  },
  {
    value: '3',
    label: 'Strategic Office Locations',
    desc: 'With presence in Dallas (USA), Ho Chi Minh City and Da Nang (Vietnam) to serve clients 24/7 across global time zones with seamless collaboration.',
    icon: 'MapPin',
  },
  {
    value: '20+',
    label: 'Tech Stack Expertise',
    desc: 'From AI/ML and cloud solutions to microservices and frontend frameworks, enabling innovative solutions for diverse business challenges.',
    icon: 'Cpu',
  },
]

// PLACEHOLDER: generic capability labels until the team confirms which Azure services each
// step runs on (see content/TODO.md). Rendered with "draft" styling.
export const capabilityLabels = ['AI model', 'Integration', 'IoT gateway', 'Data store']

// ILLUSTRATIVE: invented demo workflows, not client claims. Rendered with a visible
// "Illustrative scenario — not a client case study" badge. No digits anywhere (npm test).
// x/y are node centres in a 760 × 520 canvas (see src/workflow/layout.js).
// `decision` is the step that waits for the visitor (Approve / Reject buttons at `buttons`);
// `drills` are two predefined problems (retry, detour or escalation) a visitor can trigger;
// `drillOnly` nodes are drawn only while a drill passes through them; an edge's optional third
// element `{ via }` routes it down a vertical side channel at that x so it skips a card.
export const workflows = [
  {
    id: 'support',
    label: 'Customer Support',
    icon: 'MessageCircle',
    illustrative: true,
    nodes: [
      { id: 'email', type: 'trigger', title: 'New support email', x: 380, y: 40, desc: 'A customer emails asking where their order is, or asking for a refund.' },
      { id: 'triage', type: 'agent', title: 'Triage agent', capability: 'AI model', x: 380, y: 120, desc: 'Reads the email, works out what the customer wants and pulls out the order details.' },
      { id: 'route', type: 'router', title: 'AI routing', x: 380, y: 195, desc: 'Sends the request down the right path based on what the customer asked for.' },
      { id: 'lookup', type: 'agent', title: 'Order lookup agent', capability: 'Integration', x: 200, y: 270, desc: 'Checks the order system and the shipping tracker for the latest status.' },
      { id: 'reply', type: 'agent', title: 'Reply writer', capability: 'AI model', x: 200, y: 345, desc: 'Writes a clear reply with the tracking link and flags a late delivery.' },
      { id: 'refund', type: 'agent', title: 'Refund agent', capability: 'Integration', x: 560, y: 270, desc: 'Checks the order against the refund policy and prepares the refund.' },
      { id: 'approve', type: 'human', title: 'Human approves', x: 560, y: 345, waitsForDecision: true, desc: 'A team member approves the refund before any money moves.' },
      { id: 'done', type: 'outcome', title: 'Customer answered', x: 380, y: 440, desc: 'The customer gets an answer quickly; your team only sees the exceptions.' },
      { id: 'clarify', type: 'agent', title: 'Clarifying question', capability: 'AI model', x: 170, y: 195, drillOnly: true, desc: 'Asks the customer one short question before going any further.' },
      { id: 'sentBack', type: 'outcome', title: 'Sent back with a note', x: 640, y: 440, desc: 'The refund is not made; the customer gets a note and a person follows up.' },
    ],
    edges: [
      ['email', 'triage'], ['triage', 'route'],
      ['route', 'lookup'], ['lookup', 'reply'], ['reply', 'done'],
      ['route', 'refund'], ['refund', 'approve'], ['approve', 'done'], ['approve', 'sentBack'],
      ['triage', 'clarify'], ['clarify', 'lookup'],
    ],
    branches: [
      { label: 'Refund request', path: ['email', 'triage', 'route', 'refund', 'approve'] },
      { label: 'Order status', path: ['email', 'triage', 'route', 'lookup', 'reply', 'done'] },
    ],
    decision: {
      nodeId: 'approve',
      verb: 'refund',
      approve: ['done'],
      reject: ['sentBack'],
      log: { approve: 'refund sent to the customer', reject: 'refund held, customer sent a note' },
      buttons: { x: 382, y: 345 },
    },
    drills: [
      { id: 'timeout', label: 'Order system timeout', hint: 'Watch it retry', problemNodeId: 'lookup', path: ['email', 'triage', 'route', 'lookup', 'lookup', 'reply', 'done'], log: { status: 'retried', text: 'Order system timeout · retried, then succeeded' } },
      { id: 'unclear', label: 'Customer request is unclear', hint: 'Watch it ask first', problemNodeId: 'triage', path: ['email', 'triage', 'clarify', 'lookup', 'reply', 'done'], log: { status: 'flagged', text: 'Unclear request · asked the customer first' } },
    ],
  },
  {
    id: 'inventory',
    label: 'Inventory & Orders',
    icon: 'TrendingUp',
    illustrative: true,
    nodes: [
      { id: 'check', type: 'trigger', title: 'Daily stock check', x: 380, y: 40, desc: 'Every morning the stock levels are reviewed automatically.' },
      { id: 'monitor', type: 'agent', title: 'Stock monitor agent', capability: 'Data store', x: 380, y: 120, desc: 'Compares current stock with safety levels and recent sales.' },
      { id: 'route', type: 'router', title: 'AI routing', x: 380, y: 195, desc: 'Decides whether anything needs reordering today.' },
      { id: 'skip', type: 'outcome', title: 'Logged, no action', x: 170, y: 270, desc: 'Stock is healthy, so the check is logged and nobody is interrupted.' },
      { id: 'forecast', type: 'agent', title: 'Demand forecaster', capability: 'AI model', x: 560, y: 270, desc: 'Estimates upcoming demand from sales history and open orders.' },
      { id: 'draft', type: 'agent', title: 'Reorder drafter', capability: 'Integration', x: 560, y: 345, desc: 'Drafts a reorder with quantity and supplier, using supplier lead times.' },
      { id: 'buyer', type: 'human', title: 'Buyer approves', x: 560, y: 420, waitsForDecision: true, desc: 'A buyer reviews the draft and approves it with one click.' },
      { id: 'sent', type: 'outcome', title: 'Reorder sent', x: 560, y: 490, desc: 'Stock-outs are caught before they happen; a human approves instead of chasing.' },
      { id: 'held', type: 'outcome', title: 'Reorder held for review', x: 330, y: 490, desc: 'Nothing is ordered; the draft waits for the buyer to look again.' },
    ],
    edges: [
      ['check', 'monitor'], ['monitor', 'route'],
      ['route', 'skip'],
      ['route', 'forecast'], ['forecast', 'draft'], ['draft', 'buyer'], ['buyer', 'sent'], ['buyer', 'held'],
      ['forecast', 'buyer', { via: 700 }],
    ],
    branches: [
      { label: 'Low stock', path: ['check', 'monitor', 'route', 'forecast', 'draft', 'buyer'] },
      { label: 'Stock healthy', path: ['check', 'monitor', 'route', 'skip'] },
    ],
    decision: {
      nodeId: 'buyer',
      verb: 'reorder',
      approve: ['sent'],
      reject: ['held'],
      log: { approve: 'reorder sent to the supplier', reject: 'reorder held for review' },
      buttons: { x: 370, y: 420 },
    },
    drills: [
      { id: 'offline', label: 'Supplier system offline', hint: 'Watch it retry', problemNodeId: 'draft', path: ['check', 'monitor', 'route', 'forecast', 'draft', 'draft', 'buyer'], log: { status: 'retried', text: 'Supplier system offline · retried, then drafted' } },
      { id: 'spike', label: 'Sales spike looks wrong', hint: 'Watch it escalate', problemNodeId: 'forecast', path: ['check', 'monitor', 'route', 'forecast', 'buyer'], log: { status: 'flagged', text: 'Unusual sales spike · escalated to the buyer' } },
    ],
  },
  {
    id: 'factory',
    label: 'Smart Factory (IoT)',
    icon: 'Factory',
    illustrative: true,
    nodes: [
      { id: 'sensor', type: 'trigger', title: 'Vibration sensor spike', x: 380, y: 40, desc: 'A vibration sensor on a packaging line reports an unusual spike.' },
      { id: 'anomaly', type: 'agent', title: 'Anomaly agent', capability: 'IoT gateway', x: 380, y: 115, desc: 'Recognises the pattern as an early sign of bearing wear.' },
      { id: 'crosscheck', type: 'agent', title: 'Second sensor check', capability: 'IoT gateway', x: 380, y: 185, drillOnly: true, desc: 'Reads a second sensor on the same line before trusting the first one.' },
      { id: 'history', type: 'agent', title: 'Maintenance history agent', capability: 'Data store', x: 200, y: 255, desc: 'Looks up when this machine was last serviced and what was replaced.' },
      { id: 'roster', type: 'agent', title: 'Shift roster agent', capability: 'Integration', x: 560, y: 255, desc: 'Finds the next break and which technician is on shift.' },
      { id: 'schedule', type: 'agent', title: 'Scheduler agent', capability: 'AI model', x: 380, y: 330, desc: 'Proposes a technician slot in the next break.' },
      { id: 'confirm', type: 'human', title: 'Shift lead confirms', x: 380, y: 405, waitsForDecision: true, desc: 'The shift lead confirms the plan before anyone is booked.' },
      { id: 'booked', type: 'outcome', title: 'Technician booked', x: 380, y: 480, desc: 'Downtime is prevented instead of repaired; the shift lead is kept in the loop.' },
      { id: 'standby', type: 'outcome', title: 'Kept under watch', x: 620, y: 480, desc: 'No one is booked yet; the machine stays under closer watch.' },
    ],
    edges: [
      ['sensor', 'anomaly'],
      ['anomaly', 'history'], ['anomaly', 'roster'],
      ['history', 'schedule'], ['roster', 'schedule'],
      ['schedule', 'confirm'], ['confirm', 'booked'], ['confirm', 'standby'],
      ['anomaly', 'crosscheck'], ['crosscheck', 'history'], ['crosscheck', 'roster'],
      ['history', 'confirm', { via: 200 }], ['roster', 'confirm', { via: 560 }],
    ],
    branches: [
      { label: 'Sensor alert', path: ['sensor', 'anomaly', ['history', 'roster'], 'schedule', 'confirm'] },
    ],
    decision: {
      nodeId: 'confirm',
      verb: 'technician booking',
      approve: ['booked'],
      reject: ['standby'],
      log: { approve: 'technician booked for the next break', reject: 'machine kept under watch' },
      buttons: { x: 590, y: 405 },
    },
    drills: [
      { id: 'faulty', label: 'Sensor reading looks faulty', hint: 'Watch it double-check', problemNodeId: 'anomaly', path: ['sensor', 'anomaly', 'crosscheck', ['history', 'roster'], 'schedule', 'confirm'], log: { status: 'flagged', text: 'Faulty-looking reading · second sensor checked' } },
      { id: 'notech', label: 'No technician on shift', hint: 'Watch it escalate', problemNodeId: 'roster', path: ['sensor', 'anomaly', ['history', 'roster'], 'confirm'], log: { status: 'flagged', text: 'No technician on shift · escalated to the shift lead' } },
    ],
  },
]

// ILLUSTRATIVE: invented run log for the monitoring strip. Words only — no numbers,
// percentages or timings (npm test).
export const runLog = [
  { status: 'passed', workflow: 'support', text: 'Order-status reply · grounded in order data' },
  { status: 'flagged', workflow: 'support', text: 'Refund over limit · sent to approver' },
  { status: 'retried', workflow: 'inventory', text: 'Supplier system timeout · retried, then succeeded' },
  { status: 'passed', workflow: 'inventory', text: 'Reorder draft · matches recent demand' },
  { status: 'flagged', workflow: 'factory', text: 'Unusual sensor pattern · shift lead asked to confirm' },
  { status: 'passed', workflow: 'factory', text: 'Technician booking · matched to the shift roster' },
]

// ILLUSTRATIVE: invented single-agent journeys for the "Agent at work" view, one per workflow
// tab. Not client claims. No digits anywhere (npm test).
export const agentJourneys = [
  {
    id: 'support',
    illustrative: true,
    task: 'Working through the morning support queue',
    stops: [
      { kind: 'resource', label: 'support/inbox', status: 'Reading new tickets' },
      { kind: 'skill', label: 'skills/triage', status: 'Using skill: triage' },
      { kind: 'resource', label: 'orders/system', status: 'Looking up order status' },
      { kind: 'resource', label: 'shipping/tracker', status: 'Checking deliveries' },
      { kind: 'compact', status: 'Compacting context…' },
      { kind: 'resource', label: 'policy/refunds', status: 'Checking the refund policy' },
      { kind: 'skill', label: 'skills/reply-writing', status: 'Using skill: reply writing' },
      { kind: 'resource', label: 'escalations/queue', status: 'Handing exceptions to the team' },
    ],
  },
  {
    id: 'inventory',
    illustrative: true,
    task: 'Running the daily stock review',
    stops: [
      { kind: 'resource', label: 'stock/levels', status: 'Reading stock levels' },
      { kind: 'resource', label: 'sales/history', status: 'Reviewing recent sales' },
      { kind: 'skill', label: 'skills/forecasting', status: 'Using skill: forecasting' },
      { kind: 'resource', label: 'suppliers/lead-times', status: 'Checking supplier lead times' },
      { kind: 'compact', status: 'Compacting context…' },
      { kind: 'resource', label: 'orders/open', status: 'Checking open orders' },
      { kind: 'skill', label: 'skills/reorder-drafting', status: 'Using skill: reorder drafting' },
      { kind: 'resource', label: 'approvals/buyer', status: 'Sending drafts for approval' },
    ],
  },
  {
    id: 'factory',
    illustrative: true,
    task: 'Handling a machine health alert',
    stops: [
      { kind: 'resource', label: 'sensors/vibration-feed', status: 'Reading the sensor feed' },
      { kind: 'skill', label: 'skills/anomaly-detection', status: 'Using skill: anomaly detection' },
      { kind: 'resource', label: 'machines/maintenance-log', status: 'Reading the maintenance log' },
      { kind: 'compact', status: 'Compacting context…' },
      { kind: 'resource', label: 'shifts/roster', status: 'Checking the shift roster' },
      { kind: 'skill', label: 'skills/scheduling', status: 'Using skill: scheduling' },
      { kind: 'resource', label: 'technicians/calendar', status: 'Booking a technician' },
      { kind: 'resource', label: 'alerts/shift-lead', status: 'Alerting the shift lead' },
    ],
  },
]

// PLACEHOLDER: Azure-first framing pending team sign-off (stated by a team member on
// 2026-10-01). The cloud and platform names are real live-site service copy.
export const stack = {
  draft: true,
  line: 'Built on Microsoft Azure — with AWS and GCP when your stack needs it.',
  chips: [
    { label: 'Azure', primary: true },
    { label: 'AWS' },
    { label: 'GCP' },
    { label: 'Power Platform' },
    { label: 'Make' },
    { label: 'n8n' },
    { label: 'Retool' },
    { label: 'Bubble' },
  ],
}

export const whoWeAre = {
  eyebrow: 'Who We Are',
  title: 'We Deliver Consumer-Centric Tech Solutions.',
  body: "XionTechs specializes in delivering consumer-centric technology solutions that empower businesses to thrive in today's digital landscape. Our client-focused approach combines cutting-edge technical expertise with deep industry knowledge, enabling us to create tailored solutions that drive measurable results and sustainable growth.",
  bullets: [
    'Identify growth opportunities and expand market presence',
    'Enhance operational efficiency and reduce waste',
    'Make informed decisions based on data-driven insights',
  ],
  badge: { value: '25', label: 'Years of experience in IT Development Industry' },
}

// PLACEHOLDER: engagement model framing written for the redesign, pending team sign-off.
// Replaces the live site's Discovery/Design/Development/Deployment steps. No durations
// or prices — those would be invented.
export const roadmap = [
  {
    stage: 'Explore',
    title: 'Find the right first use case',
    icon: 'Compass',
    get: 'A short workshop that maps your workflows and picks the one where an agent pays off first.',
    involvement: 'A few hours from the people who know the process.',
    next: 'A scoped pilot proposal.',
  },
  {
    stage: 'Pilot',
    title: 'One agent, one workflow',
    icon: 'FlaskConical',
    get: 'A working agent on real data, with a human approving every action.',
    involvement: 'Weekly check-ins and feedback on what the agent gets right or wrong.',
    next: 'A go/no-go decision backed by what you saw.',
  },
  {
    stage: 'Production',
    title: 'Integrated and monitored',
    icon: 'Rocket',
    get: 'The agent wired into your systems, with monitoring, fallbacks and support.',
    involvement: 'Sign-off on integrations and access.',
    next: 'A backlog of the next workflows to automate.',
  },
  {
    stage: 'Scale',
    title: 'More agents, connected operations',
    icon: 'TrendingUp',
    get: 'Additional agents, IoT and data platform work, and the engineering to keep it all running.',
    involvement: 'A quarterly roadmap review.',
    next: 'Ongoing partnership.',
  },
]

export const whyChooseUs = {
  eyebrow: 'Why Choose Us',
  title: 'Our Priority, Our Commitment, Our Solutions',
  body: 'Choose XionTechs for integrated solutions, industry experience, and metric-driven delivery. We bring ideas to life through collaborative creation and a "Get IT Done" attitude.',
}

export const values = [
  {
    title: 'Client Centricity Focus',
    desc: 'XionTechs emphasizes a client-first approach, focusing on providing exceptional experiences and valuable outcomes.',
  },
  {
    title: 'Integrity & Ethical Standards',
    // PLACEHOLDER: the live site shows this as a collapsed accordion item with no body text visible.
    desc: 'PLACEHOLDER — confirm the real supporting copy for this value.',
  },
  {
    title: 'High Quality Delivery',
    // PLACEHOLDER: same as above — collapsed on the live site, body text not captured.
    desc: 'PLACEHOLDER — confirm the real supporting copy for this value.',
  },
]

// PLACEHOLDER: redesign copy, pending team sign-off. The live-site CTA read
// "We Make Awesome IT Services For Your Newly Business".
export const ctaBand = {
  title: 'Ready to explore your first agent?',
  body: "Tell us about one workflow that eats your team's time. We'll come back with what an agent could do about it.",
}

// Real situation: no verified case studies yet (see content/TODO.md).
export const caseStudiesNote =
  'Client case studies are being prepared — ask us for references on a call.'

// PLACEHOLDER: the live site's "project" cards link to wordpress.themeholy.com/webteck —
// the WordPress theme vendor's own demo site, not a real client project. Confirms these are
// unedited theme-demo content. Replace with real case study details (client, scope, stack,
// outcome) before demo day.
export const caseStudies = [
  { title: 'Cloud Security Service', tag: 'PLACEHOLDER', desc: 'Add real scope, stack, and outcome once available.' },
  { title: 'Data Analytics System', tag: 'PLACEHOLDER', desc: 'Add real scope, stack, and outcome once available.' },
  { title: 'IT Solution & Consultancy', tag: 'PLACEHOLDER', desc: 'Add real scope, stack, and outcome once available.' },
]

// DRAFT: project showcase copy taken from the team's briefs in docs/idea/project-*.md, pending
// sign-off before publication. Rendered with a visible "Draft copy" tag. No client names, no
// metrics, no digits (npm test). `mock` holds invented sample values for the illustrative UI
// mock-up (labelled "not a product screenshot" on the page) — swap the mock for sanitized real
// screenshots once the team supplies them (see content/TODO.md).
export const projects = [
  {
    id: 'performance',
    draft: true,
    eyebrow: 'Enterprise platform',
    title: 'Performance Management Platform',
    desc: 'A connected enterprise workflow for employee goals, performance reviews, approvals, and calibration.',
    tags: ['Enterprise', 'Workflow', 'Integration'],
    proofPoints: ['Goal workflows', 'Manager approvals', 'Enterprise integration'],
    detail:
      'XionTechs designed and engineered a role-aware platform that connects multiple stages of the performance review lifecycle, from goal setting through review and calibration.',
    stages: ['Goal Setting', 'Mid-Year Review', 'End-Year Review', 'Calibration'],
    proves: [
      'Complex business workflow implementation',
      'Role-aware enterprise applications',
      'Multi-stage approval flows',
      'Connected to existing enterprise systems',
    ],
    cta: 'Explore the workflow',
    mock: {
      label: 'Performance management screen',
      heading: 'Goal Setting',
      context: 'Employee A · current review cycle',
      view: 'Manager view',
      currentStage: 0,
      goals: [
        { title: 'Improve the onboarding guide', kind: 'Development', status: 'Submitted' },
        { title: 'Reduce rework after releases', kind: 'Business', status: 'Approved' },
        { title: 'Mentor a new teammate', kind: 'People', status: 'Needs revision' },
      ],
      actions: ['Reject', 'Approve'],
    },
  },
  {
    id: 'crm',
    draft: true,
    eyebrow: 'Business platform',
    title: 'CRM & Customer Operations',
    desc: 'A centralized platform that brings customer data, workflows, and operational actions into one connected workspace.',
    tags: ['CRM', 'Workflow', 'Integration'],
    proofPoints: ['Customer workflows', 'Operational UI', 'System integration'],
    detail:
      'XionTechs engineers business platforms around the workflows teams actually use, connecting customer data, internal processes, and operational actions in a single experience.',
    // Generic status model from the brief; replace with the real product's states once confirmed.
    stages: ['New', 'In Progress', 'Pending', 'Completed'],
    proves: [
      'Business application development',
      'Search, filtering and data-rich interfaces',
      'Role-based operational workflows',
      'API and system integration',
    ],
    // Broader positioning line from the brief; the CRM itself is not presented as an AI product.
    note: 'We build the platform — and we can add the agent.',
    cta: 'See how it works',
    mock: {
      label: 'Customer record screen',
      search: 'Search customers and records',
      record: 'Customer A',
      recordMeta: 'Customer record · sample data',
      status: 'In Progress',
      fields: [
        { label: 'Owner', value: 'Team member B' },
        { label: 'Open request', value: 'Account update' },
      ],
      activityTitle: 'Recent activity',
      activity: ['Follow-up call logged', 'Request moved to In Progress', 'Record details updated'],
      actions: ['Add note', 'Update status'],
    },
  },
  {
    // AI flagship card. No real AI project screenshots or sign-off exist yet, so it is badged as
    // an illustrative concept and points to the (also illustrative) Agent Demo.
    id: 'agent',
    draft: true,
    badge: 'Illustrative concept — not a delivered client project',
    eyebrow: 'AI engineering',
    title: 'AI Agent Workflow Automation',
    desc: 'AI agents that connect business requests, decisions, integrations, and human approval into one workflow.',
    tags: ['Agent', 'Automation', 'Integration'],
    proofPoints: ['Agent orchestration', 'Business integration', 'Human-in-the-loop'],
    detail:
      'XionTechs builds AI workflows that go beyond chat — connecting specialized agents, business systems, and human decisions to automate real operational work.',
    stages: ['Business event', 'Triage agent', 'AI decision', 'Specialized agents', 'Human approval', 'Final outcome'],
    proves: [
      'AI agent engineering and orchestration',
      'API and tool integration',
      'Human-in-the-loop control for sensitive decisions',
      'Retry, escalation and run visibility',
    ],
    note: 'AI is not just a chatbot. It can become part of the workflow.',
    cta: 'Explore the workflow',
    link: { label: 'See an agent work', href: '#demo' },
    mock: {
      label: 'Agent workflow view',
      flow: {
        trigger: 'Business event',
        triage: 'Triage agent',
        decision: 'AI decision',
        agents: [
          { title: 'Lookup agent', does: 'Integration' },
          { title: 'Action agent', does: 'Action' },
        ],
        approval: 'Human approval',
        outcome: 'Final outcome',
      },
    },
  },
]

export const faqs = [
  {
    q: 'How can we help your business?',
    a: 'XionTechs offers digital product engineering, co-creation, and staffing services. They provide skilled resources and an integrated platform to bring your product ideas to life.',
  },
  {
    q: "What are XionTechs' advantages?",
    // PLACEHOLDER: collapsed on the live site, body text not captured.
    a: 'PLACEHOLDER — confirm the real answer copy.',
  },
  {
    q: 'How is the working process simplified?',
    // PLACEHOLDER: collapsed on the live site, body text not captured.
    a: 'PLACEHOLDER — confirm the real answer copy.',
  },
]

export const footerBlurb =
  'We deliver exceptional client experiences with metric-driven results, collaborative creation, and industry expertise, leveraging AI techniques and agile methods to bring innovative solutions and outstanding results to clients.'

export const footerServiceLinks = [
  'Product Engineering',
  'Custom Software',
  'Product Co-Creation',
  'AI/ML Solutions',
  'Staffing Services',
]

export const footerCompanyLinks = [
  'About Us',
  'Support Center',
  'Privacy Policy',
  'Terms of Service',
  'Contact us',
]

export const contact = {
  phones: ['+1 469 322 9899', '+84 908 107 552'],
  email: 'contact@xiontechs.com',
  addresses: [
    'Viettel Tower, Floor 12, 285 CMT8, Ho Chi Minh City 70064, Vietnam',
    'Floor 15, B1 Building, 279 Nguyen Tri Phuong, Ho Chi Minh City, Vietnam',
  ],
  social: [
    { label: 'Facebook', icon: 'Facebook', href: 'https://www.facebook.com/xiontechs/' },
    { label: 'LinkedIn', icon: 'LinkedIn', href: 'https://www.linkedin.com/company/xiontechs/about/' },
  ],
}

// No testimonials section appears anywhere on the live homepage (confirmed via full-page
// screenshots) — the "testimonials" markup found in the raw HTML during initial extraction is
// unrendered leftover WordPress/Elementor theme-demo content (image filenames like
// testi_2_1.png, a "CTO of Portfolio" title, never actually displayed to visitors). We do not
// carry it over. This section stays empty/placeholder until the team has real client quotes.
export const testimonials = []

// PLACEHOLDER: redesign section copy, pending team sign-off.
export const sections = {
  demo: {
    eyebrow: 'Agent demo',
    title: 'See what an AI agent does for your business',
    intro: 'Pick a situation. Watch how an agent takes it from request to result while your team only handles the exceptions.',
  },
  projects: {
    eyebrow: 'Selected work',
    title: 'Software we have engineered',
    intro: 'The kinds of platforms we build, shown without client names. Screens are illustrative until approved screenshots are ready.',
    mockNote: 'Illustrative UI with sample data — not a product screenshot',
  },
  monitor: {
    title: 'Agents are watched, not left alone.',
    intro: 'Every run is checked. Anything unusual goes to a person.',
  },
  roadmap: {
    eyebrow: 'How we work',
    title: 'From idea to agent, one step at a time',
    intro: 'Start small and low-risk. Each stage ends with something you can see and a decision you control.',
    draftNote: 'Draft engagement model — pending team sign-off.',
  },
}
