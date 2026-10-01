// Content sourced from the live xiontechs.com homepage (screenshots + HTML captured 2026-09-22),
// unless marked PLACEHOLDER. Anything marked PLACEHOLDER must be replaced with real data before
// demo day (see content/TODO.md).

export const company = {
  name: 'XionTechs',
  legalName: 'XionTech Joint Stock Company',
  logo: '/XionTechs-Logo_s.png',
  tagline: 'Get IT Done',
  // PLACEHOLDER: new positioning copy written for the redesign, pending team sign-off.
  // The old live-site headline was "Perfect IT Solutions For Your Business".
  heroHeadline: 'AI agents and smart platforms that get IT done for your business',
  heroHeadlineAccent: 'get IT done',
  // "25+ years" is real (live-site stats). The framing sentence is PLACEHOLDER copy.
  heroSubline:
    'From your first AI pilot to connected operations at scale — built by a team with 25+ years of engineering leadership.',
  // Real: office locations from the live site stats.
  offices: ['Dallas', 'Ho Chi Minh City', 'Da Nang'],
}

export const nav = [
  { label: 'Solutions', href: '#solutions' },
  { label: 'Agent Demo', href: '#demo' },
  { label: 'Why Us', href: '#why-us' },
  { label: 'How We Work', href: '#roadmap' },
  { label: 'FAQ', href: '#faqs' },
  { label: 'Contact', href: '#contact' },
]

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

export const services = [
  {
    title: 'Product Engineering',
    desc: 'Transform innovative ideas into market-ready digital products with our comprehensive engineering expertise. We build scalable, user-centered solutions designed for commercial success and market differentiation.',
    icon: 'Layers',
  },
  {
    title: 'AI-Driven Analytics',
    desc: 'Transform raw data into actionable intelligence using AI and advanced visualization techniques. Our solutions reveal hidden patterns, optimize operations, and enable data-driven decision-making for measurable business outcomes.',
    icon: 'BarChart3',
  },
  {
    title: 'Product Co-Creation',
    desc: 'Accelerate innovation through collaboration that combines your domain knowledge with our technical expertise to develop customized solutions aligned with your specific business objectives.',
    icon: 'Handshake',
  },
  {
    title: 'Staffing Services',
    desc: 'Access specialized technology talent when needed with flexible solutions that provide skilled professionals who integrate seamlessly with your team to accelerate project delivery.',
    icon: 'UserPlus',
  },
  {
    title: 'Custom App Development',
    desc: 'Develop custom solutions aligned with your unique requirements and modernize legacy systems. Our applications enhance efficiency, eliminate manual processes, and drive competitive advantage.',
    icon: 'Code2',
  },
  {
    title: 'Low-code Solutions',
    desc: 'Accelerate transformation with modern platforms like Power Platform, Make, n8n, Retool, and Bubble. Our low-code solutions enable faster deployment, reduce costs, and empower teams to create their own applications.',
    icon: 'Puzzle',
  },
  {
    title: 'AI-Powered Solutions',
    desc: 'Harness artificial intelligence to transform operations with intelligent automation, predictive analytics, conversational interfaces, and AI-driven process automation that accelerates growth.',
    icon: 'BrainCircuit',
  },
  {
    title: 'Cloud Computing',
    desc: 'Deliver expert solutions on Azure, AWS, and GCP for seamless migration, optimization, and integration of cloud resources. We ensure improved scalability, enhanced security, and optimized operational costs.',
    icon: 'Cloud',
  },
]

// Helper: reuse the real service copy inside the pillars so nothing is duplicated.
const svc = (title) => {
  const s = services.find((x) => x.title === title)
  return { title: s.title, desc: s.desc }
}

// Three solution pillars. `placeholder: true` renders a visible "Draft copy" tag.
export const pillars = [
  {
    id: 'agentic',
    title: 'AI Agentic Development',
    icon: 'Bot',
    // PLACEHOLDER: no captured site copy describes agentic work. Draft framing only.
    placeholder: true,
    outcome: 'PLACEHOLDER — Agents that handle routine work end to end, so your team only sees the exceptions.',
    bullets: [
      { title: 'PLACEHOLDER — Workflow agents', desc: 'Draft: agents that read requests, check your systems and act, with a human approving the exceptions.' },
      { title: 'PLACEHOLDER — Conversational assistants', desc: 'Draft: customer- and staff-facing assistants grounded in your own data.' },
      svc('AI-Powered Solutions'),
      svc('AI-Driven Analytics'),
    ],
    detail: 'PLACEHOLDER — Confirm with the team: typical agent use cases delivered, integration approach, and how outcomes are measured.',
  },
  {
    id: 'platform',
    title: 'Smart Agent Platform (IoT)',
    icon: 'Wifi',
    // PLACEHOLDER: no captured site copy describes an IoT platform. Draft framing only.
    placeholder: true,
    outcome: 'PLACEHOLDER — Connect devices, sensors and systems so agents can watch, decide and act on live operations.',
    bullets: [
      { title: 'PLACEHOLDER — Device & sensor connectivity', desc: 'Draft: bring machines, sensors and existing systems onto one platform.' },
      { title: 'PLACEHOLDER — Live monitoring & alerts', desc: 'Draft: anomalies surfaced and routed to the right person or agent.' },
      { title: 'PLACEHOLDER — Agent-driven actions', desc: 'Draft: agents that schedule maintenance, reorder parts, or escalate.' },
    ],
    detail: 'PLACEHOLDER — Confirm with the team: supported protocols, cloud targets, and reference deployments.',
  },
  {
    id: 'engineering',
    title: 'Engineering & Cloud',
    icon: 'Layers',
    placeholder: false,
    // Real: summarises the live-site service copy below.
    outcome: 'The product engineering, cloud and staffing expertise that turns a pilot into a product.',
    bullets: [
      svc('Product Engineering'),
      svc('Custom App Development'),
      svc('Low-code Solutions'),
      svc('Cloud Computing'),
      svc('Staffing Services'),
      svc('Product Co-Creation'),
    ],
    detail:
      'Delivered on Azure, AWS and GCP with modern platforms like Power Platform, Make, n8n, Retool and Bubble, by a team with 25+ years of leadership experience across three offices.',
  },
]

// ILLUSTRATIVE: invented demo scenarios, not client claims. Rendered with a visible
// "Illustrative scenario — not a client case study" badge. Outcomes are words only —
// no numbers, so nothing reads as a measured result.
export const agentScenarios = [
  {
    id: 'support',
    label: 'Customer Support',
    icon: 'MessageCircle',
    illustrative: true,
    steps: [
      { role: 'Request', text: 'A customer asks: "Where is my order #1042?"' },
      { role: 'Understand', text: 'The agent recognises an order-status question and pulls the order number.' },
      { role: 'Check systems', text: 'It queries the order system and the shipping tracker.' },
      { role: 'Act', text: 'It replies with the tracking link and flags that delivery is running late.' },
      { role: 'Outcome', text: 'Customer answered instantly; your team only sees the exceptions.' },
    ],
  },
  {
    id: 'inventory',
    label: 'Inventory & Orders',
    icon: 'TrendingUp',
    illustrative: true,
    steps: [
      { role: 'Request', text: 'Stock for a fast-moving part drops below its safety level.' },
      { role: 'Understand', text: 'The agent recognises a reorder situation, not a one-off dip.' },
      { role: 'Check systems', text: 'It checks recent sales, open orders and supplier lead times.' },
      { role: 'Act', text: 'It drafts a reorder with quantity and supplier, and sends it for approval.' },
      { role: 'Outcome', text: 'Stock-outs caught before they happen; a human approves instead of chasing.' },
    ],
  },
  {
    id: 'factory',
    label: 'Smart Factory (IoT)',
    icon: 'Factory',
    illustrative: true,
    steps: [
      { role: 'Request', text: 'A vibration sensor on a packaging line reports an unusual spike.' },
      { role: 'Understand', text: 'The agent identifies the pattern as an early bearing-wear signal.' },
      { role: 'Check systems', text: 'It checks the maintenance history and the shift roster.' },
      { role: 'Act', text: 'It schedules a technician for the next break and alerts the shift lead.' },
      { role: 'Outcome', text: 'Downtime prevented instead of repaired.' },
    ],
  },
]

// PLACEHOLDER: generic capability labels until the team confirms which Azure services each
// step runs on (see content/TODO.md). Rendered with "draft" styling.
export const capabilityLabels = ['AI model', 'Integration', 'IoT gateway', 'Data store']

// ILLUSTRATIVE: invented demo workflows, not client claims. Rendered with a visible
// "Illustrative scenario — not a client case study" badge. No digits anywhere (npm test).
// x/y are node centres in a 760 × 520 canvas (see src/workflow/layout.js).
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
      { id: 'approve', type: 'human', title: 'Human approves', x: 560, y: 345, desc: 'A team member approves the refund before any money moves.' },
      { id: 'done', type: 'outcome', title: 'Customer answered', x: 380, y: 440, desc: 'The customer gets an answer quickly; your team only sees the exceptions.' },
    ],
    edges: [
      ['email', 'triage'], ['triage', 'route'],
      ['route', 'lookup'], ['lookup', 'reply'], ['reply', 'done'],
      ['route', 'refund'], ['refund', 'approve'], ['approve', 'done'],
    ],
    branches: [
      { label: 'Order status', path: ['email', 'triage', 'route', 'lookup', 'reply', 'done'] },
      { label: 'Refund request', path: ['email', 'triage', 'route', 'refund', 'approve', 'done'] },
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
      { id: 'buyer', type: 'human', title: 'Buyer approves', x: 560, y: 420, desc: 'A buyer reviews the draft and approves it with one click.' },
      { id: 'sent', type: 'outcome', title: 'Reorder sent', x: 560, y: 490, desc: 'Stock-outs are caught before they happen; a human approves instead of chasing.' },
    ],
    edges: [
      ['check', 'monitor'], ['monitor', 'route'],
      ['route', 'skip'],
      ['route', 'forecast'], ['forecast', 'draft'], ['draft', 'buyer'], ['buyer', 'sent'],
    ],
    branches: [
      { label: 'Low stock', path: ['check', 'monitor', 'route', 'forecast', 'draft', 'buyer', 'sent'] },
      { label: 'Stock healthy', path: ['check', 'monitor', 'route', 'skip'] },
    ],
  },
  {
    id: 'factory',
    label: 'Smart Factory (IoT)',
    icon: 'Factory',
    illustrative: true,
    nodes: [
      { id: 'sensor', type: 'trigger', title: 'Vibration sensor spike', x: 380, y: 40, desc: 'A vibration sensor on a packaging line reports an unusual spike.' },
      { id: 'anomaly', type: 'agent', title: 'Anomaly agent', capability: 'IoT gateway', x: 380, y: 120, desc: 'Recognises the pattern as an early sign of bearing wear.' },
      { id: 'history', type: 'agent', title: 'Maintenance history agent', capability: 'Data store', x: 200, y: 210, desc: 'Looks up when this machine was last serviced and what was replaced.' },
      { id: 'roster', type: 'agent', title: 'Shift roster agent', capability: 'Integration', x: 560, y: 210, desc: 'Finds the next break and which technician is on shift.' },
      { id: 'schedule', type: 'agent', title: 'Scheduler agent', capability: 'AI model', x: 380, y: 300, desc: 'Books the technician into the next break and alerts the shift lead.' },
      { id: 'booked', type: 'outcome', title: 'Technician booked', x: 380, y: 390, desc: 'Downtime is prevented instead of repaired; the shift lead is kept in the loop.' },
    ],
    edges: [
      ['sensor', 'anomaly'],
      ['anomaly', 'history'], ['anomaly', 'roster'],
      ['history', 'schedule'], ['roster', 'schedule'],
      ['schedule', 'booked'],
    ],
    branches: [
      { label: 'Sensor alert', path: ['sensor', 'anomaly', ['history', 'roster'], 'schedule', 'booked'] },
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
  solutions: {
    eyebrow: 'Solutions',
    title: 'Three ways we get IT done',
    intro: "Start with an agent, connect your operations, and lean on a full engineering team when it's time to build.",
  },
  demo: {
    eyebrow: 'Agent demo',
    title: 'See what an AI agent does for your business',
    intro: 'Pick a situation. Watch how an agent takes it from request to result while your team only handles the exceptions.',
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
