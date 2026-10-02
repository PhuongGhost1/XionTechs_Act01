// Page copy. Every value comes from one of these sources (see CLAUDE.md, "Content rules"):
//   LIVE         the live xiontechs.com site, captured 2026-09-22
//   PLAN §n      the team's redesign brief, docs/idea/XionTechs_Landing_Page_Redesign_Plan_v3.md
//   MOTION §n    the team's 3D / motion brief, docs/idea/XionTechs_Landing_Page_3D_Motion_Automation_Plan.md
//   DRAFT        written for the redesign from LIVE / PLAN material, pending team sign-off;
//                flagged `draft: true` and marked on the page in development and with `?review`
//   ILLUSTRATIVE / PLACEHOLDER   not real; always labelled on the page for every visitor
// Open items live in content/TODO.md.

export const company = {
  name: 'XionTechs',
  legalName: 'XionTech Joint Stock Company', // LIVE; spelling to verify (content/TODO.md)
  logo: { src: '/XionTechs-Logo_s.png', width: 250, height: 46 },
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

// PLAN §3 copy; MOTION §5–6 for the hero system and the slogan sequence.
// `system` is the hero's connected system (MOTION §5): a signal travels request → agent →
// decision, branches to a business system (and, when judgment is needed, a human), and ends at
// done. `hint` is the delayed hover/focus tooltip; MOTION gives the agent, decision, integration
// and human lines; the request and done lines are DRAFT. Nothing depends on hover.
export const hero = {
  eyebrow: 'Get IT Done',
  slogan: ['Get', 'IT', 'Done'],
  headline: 'AI agents and software engineering for the work that matters.',
  headlineAccent: 'the work that matters',
  intro:
    'XionTechs helps businesses turn ideas, workflows and operational problems into production-ready software, from AI agents to complete engineering teams.',
  primary: { label: 'See What We Build', href: '#work' },
  secondary: { label: 'Talk to Us', href: '#contact' },
  system: [
    { id: 'request', label: 'Request', hint: 'A request or event comes in.' },
    { id: 'agent', label: 'AI agent', hint: 'Understands the request.', core: true },
    { id: 'decision', label: 'Decision', hint: 'Chooses the next step.' },
    { id: 'system', label: 'Business system', hint: 'Works with your systems.' },
    { id: 'human', label: 'Human', hint: 'Steps in when judgment is needed.' },
    { id: 'done', label: 'Done', hint: 'The work gets done.' },
  ],
  systemLabel:
    'Diagram: a request reaches an AI agent, which makes a decision, works with a business system, hands judgment calls to a person, and finishes the work.',
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
      // MOTION §7: one signal travels these steps.
      visual: { kind: 'flow', steps: ['Request', 'Agent', 'Decision', 'Action'] },
    },
    {
      id: 'software',
      title: 'Business software',
      icon: 'LayoutGrid',
      desc: 'Business applications designed around the way teams actually work.',
      examples: ['Enterprise platforms', 'CRM and operations', 'Internal tools', 'Workflow systems'],
      link: { label: 'See Selected Work', href: '#work' },
      // MOTION §7: layered product frames slide into alignment.
      visual: { kind: 'layers' },
    },
    {
      id: 'teams',
      title: 'Engineering teams',
      icon: 'Users',
      desc: 'Product, backend, frontend, cloud, and integration engineers when you need to build.',
      examples: ['Product engineering', 'Custom application development', 'Cloud and APIs', 'Dedicated engineering capacity'],
      // MOTION §7: architecture blocks stack in this order.
      visual: { kind: 'stack', steps: ['Frontend', 'API', 'Cloud', 'Integration'] },
    },
  ],
}

// MOTION §8 heading and supporting copy; PLAN §5 for the demo below it.
export const aiAgents = {
  eyebrow: 'AI agents',
  title: 'AI agents that move work forward.',
  intro: 'From requests to decisions, system actions, and human approval.',
  // MOTION §12: shown while the run waits for the visitor's approval.
  humanMessage: 'Automation with human control.',
  // DRAFT: callout descriptions written for the redesign, pending team sign-off.
  callouts: [
    { title: 'Understand', icon: 'ScanSearch', draft: true, desc: 'Reads the request and works out what is being asked, and by whom.' },
    { title: 'Decide', icon: 'GitBranch', draft: true, desc: 'Routes the work to the right step, and stops for a person when a decision needs one.' },
    { title: 'Act', icon: 'Zap', draft: true, desc: 'Uses your systems to finish the task, and records what it did.' },
  ],
  // MOTION §10: the advanced controls appear after the first meaningful action.
  advanced: {
    more: 'Explore What Happens Next',
    less: 'Back to the Basic Run',
    moreHint: 'Try other scenarios, throw a problem at the agent, or watch one agent work a long task.',
    lessHint: 'Scenarios, drills, the Agent at work view and the run log are open.',
  },
}

// PLAN §6–9, MOTION §13–16. Two real product stories plus the Agent Demo as the third proof
// point (no invented third case study). Screenshots are the team's, sanitized before commit:
// browser chrome cropped, and personal names, staff IDs, class codes and the client's school
// names replaced with sample values (PROMPT_LOG, 2026-10-02). No metrics or outcomes, and no
// digits in this copy (npm test). Region boxes are % of the screenshot: { x, y, w, h }.
export const selectedWork = {
  eyebrow: 'Selected work',
  title: 'Software we\u2019ve engineered.',
  intro:
    'Selected product experiences from the kinds of systems we build. Names and identifying details in the screenshots are replaced with sample values.',
  pendingNote: 'Screenshot pending privacy review. The layout is shown as an outline.',
  proofs: [
    { id: 'staffxp', label: 'Product engineering', name: 'StaffXP', href: '#work-staffxp' },
    { id: 'ess', label: 'Enterprise workflow', name: 'ESS', href: '#work-ess' },
    { id: 'agents', label: 'AI and automation', name: 'Agent demo', href: '#ai-agents', note: 'Illustrative' },
  ],
  agentsNote: 'The agent demo above is the third proof point: an illustrative scenario, not a client project.',
  agentsLink: { label: 'See an Agent Work', href: '#ai-agents' },
  staffxp: {
    id: 'work-staffxp',
    name: 'StaffXP',
    eyebrow: 'Education / staff experience',
    title: 'A connected workspace for school staff.',
    desc: 'A staff experience platform bringing everyday activities, notices, wellbeing, tasks, and operational information into one workspace.',
    tags: ['Staff experience', 'Business workflow', 'Role-based platform', 'Integrated operations'],
    main: {
      src: '/work/staffxp-dashboard.webp',
      alt: 'StaffXP staff dashboard with academic calendar, to-do list, notices, quick links, assignments to mark and an AI assistant panel. Sample data.',
      width: 1869,
      height: 958,
    },
    secondary: {
      src: '/work/staffxp-sign-in.webp',
      alt: 'StaffXP sign-in screen with a Sign in with Microsoft button.',
      width: 1874,
      height: 954,
    },
    // MOTION §13: only UI visible in the screenshot is annotated.
    hotspots: [
      { id: 'calendar', label: 'Academic calendar', box: { x: 0.7, y: 34.4, w: 19.1, h: 61.1 } },
      { id: 'tasks', label: 'To-do list, linked to Microsoft To Do', box: { x: 21.5, y: 34.4, w: 38.2, h: 32.4 } },
      { id: 'notices', label: 'Notices', box: { x: 21.5, y: 69.4, w: 38.2, h: 30.6 } },
      { id: 'links', label: 'Quick links, including employee self-service', box: { x: 61.4, y: 34.4, w: 19.1, h: 22.2 } },
      { id: 'marking', label: 'Assignments to mark', box: { x: 61.4, y: 59.3, w: 19.1, h: 34.1 } },
      { id: 'assistant', label: 'AI assistant panel', box: { x: 81.9, y: 5.7, w: 17.8, h: 93.5 } },
    ],
  },
  ess: {
    id: 'work-ess',
    name: 'ESS',
    eyebrow: 'Enterprise / ESS',
    title: 'Self-service software around the employee.',
    desc: 'A connected employee experience that brings everyday HR actions, workforce information, requests, and self-service workflows into one place.',
    screen: {
      src: '/work/ess-portal.webp',
      alt: 'ESS employee self-service portal: profile, company directory, employment, skills and performance, attendance, rewards, approval delegations, org chart, requests, time off, payslips, tasks and courses. Sample data.',
      width: 1867,
      height: 956,
    },
    // Modules visible in the screenshot, grouped under the plans' annotations (PLAN §8, MOTION §15).
    // `marker` anchors the numbered label; `regions` are highlighted together.
    areas: [
      {
        id: 'profile',
        label: 'Employee profile',
        modules: ['Profile', 'Employment'],
        marker: { x: 3.5, y: 9 },
        regions: [{ x: 2.5, y: 7.4, w: 95.2, h: 25.1 }, { x: 2.5, y: 47.3, w: 30.9, h: 6.5 }],
      },
      {
        id: 'requests',
        label: 'Self-service requests',
        modules: ['Requests', 'Approval delegations'],
        marker: { x: 35.7, y: 37 },
        regions: [{ x: 34.7, y: 35.1, w: 30.8, h: 27.3 }, { x: 2.5, y: 79.7, w: 30.9, h: 6.5 }],
      },
      {
        id: 'workforce',
        label: 'Workforce information',
        modules: ['Company directory', 'Org chart', 'Rewards & benefits', 'Payslips'],
        marker: { x: 3.5, y: 37 },
        regions: [
          { x: 2.5, y: 35.1, w: 30.9, h: 10.9 },
          { x: 2.5, y: 87.9, w: 30.9, h: 6.3 },
          { x: 2.5, y: 71.7, w: 30.9, h: 6.4 },
          { x: 34.7, y: 85.7, w: 30.8, h: 8.5 },
        ],
      },
      {
        id: 'performance',
        label: 'Skills & performance',
        modules: ['Skills & performance'],
        marker: { x: 3.5, y: 57 },
        regions: [{ x: 2.5, y: 55.4, w: 30.9, h: 6.4 }],
      },
      {
        id: 'time',
        label: 'Time and attendance',
        modules: ['Attendance', 'Time off'],
        marker: { x: 35.7, y: 65.5 },
        regions: [{ x: 2.5, y: 63.5, w: 30.9, h: 6.4 }, { x: 34.7, y: 63.7, w: 30.8, h: 20.6 }],
      },
      {
        id: 'learning',
        label: 'Learning',
        modules: ['Courses', 'Academy courses'],
        marker: { x: 67.8, y: 53.5 },
        regions: [{ x: 66.8, y: 51.9, w: 30.9, h: 15.5 }, { x: 66.8, y: 68.7, w: 30.9, h: 25.4 }],
      },
    ],
  },
}

// MOTION §17 heading, layers and equation. `items` name tools only where the live site names
// them (LIVE service copy); `.NET` and `React` come from PLAN §10's example list and stay draft
// until the team confirms it wants to market them.
export const engineering = {
  eyebrow: 'Engineering capability',
  title: 'When you need more engineering power.',
  // Listed top to bottom; the stack assembles from the bottom up.
  layers: [
    { id: 'product', label: 'Product' },
    { id: 'frontend', label: 'Frontend', items: 'React', draft: true },
    { id: 'backend', label: 'Backend / API', items: '.NET and APIs', draft: true },
    { id: 'data', label: 'Data' },
    { id: 'cloud', label: 'Cloud / Integration', items: 'Azure, AWS, GCP' },
    { id: 'ai', label: 'AI / Automation', items: 'Power Platform, Make, n8n, Retool, Bubble' },
  ],
  result: 'XionTechs engineering team',
  equation: ['Your idea', 'XionTechs engineering', 'Production software'],
}

// MOTION §18 stage copy. No durations, cadences or prices: none of them are confirmed.
export const howWeWork = {
  eyebrow: 'How we work',
  title: 'From idea to production, one step at a time.',
  steps: [
    { id: 'discover', title: 'Discover', icon: 'Compass', desc: 'Find the workflow, product, or engineering opportunity worth solving.' },
    { id: 'build', title: 'Build', icon: 'Hammer', desc: 'Turn the idea into a working pilot or product increment.' },
    { id: 'integrate', title: 'Integrate', icon: 'Cable', desc: 'Connect systems, users, data, and operational workflows.' },
    { id: 'scale', title: 'Scale', icon: 'TrendingUp', desc: 'Expand capability, automation, and engineering capacity.' },
  ],
}

// MOTION §19. Evidence-oriented pillars replace the live site's generic values.
export const whyUs = {
  eyebrow: 'Why us',
  title: 'Why XionTechs',
  pillars: [
    { title: 'Engineering mindset', icon: 'Wrench', desc: 'We build around workflows, products, and real operating needs.' },
    { title: 'AI where it helps', icon: 'Sparkles', desc: 'We use AI agents and automation where they create meaningful leverage.' },
    { title: 'Flexible delivery', icon: 'Users', desc: 'Work with XionTechs for a focused build, complete product development, or additional engineering capacity.' },
    { title: 'Integration-first', icon: 'Cable', desc: 'Connect new systems to the software and workflows already used by the business.' },
  ],
}

// PLAN §13. A compact human section; no team photos until real ones are approved.
export const team = {
  // MOTION §20 heading.
  title: 'A focused engineering team, built to get IT done.',
  // DRAFT: delivery approach summarised from PLAN §11, pending sign-off.
  body: 'Start with one workflow or one product increment, then add capability, automation and engineering capacity as the business grows.',
  draft: true,
  // LIVE stats, worded so the company itself is not read as decades old (PLAN §13). Both are on
  // the release checklist in content/TODO.md.
  facts: [
    { value: '25+', label: 'Years of leadership experience in IT services and product engineering, across our leadership team' },
    { value: '3', label: 'Offices: Dallas, Ho Chi Minh City and Da Nang' },
  ],
}

// PLAN §14 questions. DRAFT answers, written from the plan's positioning and the live site's
// service copy, pending team sign-off.
export const faq = {
  eyebrow: 'FAQ',
  title: 'Questions buyers ask before they start.',
  draft: true,
  items: [
    {
      q: 'What kinds of AI agents can XionTechs build?',
      a: 'Agents that take a request, work out what it needs, and act on it through your systems: triaging support requests, preparing reorders for approval, or scheduling maintenance. Each agent is built around one workflow rather than a general chatbot.',
    },
    {
      q: 'Can an agent connect to our existing systems?',
      a: 'Yes. Agents work through the APIs and integrations your systems already offer, so they read and update the same data your team uses. Where a system has no API, the integration is planned with you before anything is built.',
    },
    {
      q: 'Do you also provide traditional software engineering?',
      a: 'Yes. Alongside AI work, XionTechs builds business software: product engineering, custom applications, cloud and integration work, and dedicated engineering capacity for your team.',
    },
    {
      q: 'Can we start with a small pilot?',
      a: 'Yes. You can start with one workflow or one product increment and expand once you have seen it working with your own data and people.',
    },
    {
      q: 'How do you keep humans in control of important decisions?',
      a: 'Agents stop at the steps you mark as needing approval and wait for a person to approve or reject. You can try this in the agent demo above, where you make the approval decision.',
    },
    {
      q: 'Can you work with an existing engineering team?',
      a: 'Yes. XionTechs can add engineers to your team, take ownership of one part of the product, or build alongside your developers.',
    },
  ],
}

// PLAN §15. "Talk to Us" opens an email; there is no booking flow, so nothing says "book".
export const finalCta = {
  eyebrow: 'Get IT Done',
  title: 'What would you build next?',
  intro: 'Tell us about the workflow, product, or engineering gap you’re trying to solve.',
  primary: { label: 'Talk to Us', href: 'mailto:contact@xiontechs.com?subject=Project%20enquiry' },
  primaryNote: 'Opens an email to contact@xiontechs.com',
  secondary: { label: 'See an Agent Work', href: '#ai-agents' },
  // MOTION §21: the closing completion sequence, then the slogan with "Done" settling in gold.
  completion: ['Request', 'Build', 'Automate', 'Done'],
  // DRAFT: accessible name for the completion steps, pending sign-off.
  completionLabel: 'From request to done',
  slogan: ['Get', 'IT', 'Done'],
}

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

// LIVE contact details (office locations are on the release checklist in content/TODO.md).
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

// DRAFT: heading for the demo's illustrative run log (shown under Explore Further).
export const sections = {
  monitor: {
    title: 'Agents are watched, not left alone.',
    intro: 'Every run is checked. Anything unusual goes to a person.',
  },
}
