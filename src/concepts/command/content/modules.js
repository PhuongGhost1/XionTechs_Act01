import { LIVE_SITE, brief, draft, live } from './wrap.js'

// The four modules (doc 4.4) and the eight confirmed services, each exactly once.
//
// Nodes use the graph node shape of doc 12.1: { id, kind, label, parent, evidence, src, source?, quote? }.
// core/graph.js derives the graph from these, so a node is never typed twice.
//
// FACT: the eight service names, and the platform and capability names under them (live site).
// BRIEF: the four module names (docs/idea/v2/01-X-Command.md, section 7).
// CONFIRMED by the team on 2026-10-03 (HANDOFF section 5, content/TODO.md): which service sits under
// which module. It is no longer flagged. DRAFT: the one-line module definitions and the row words.

const leaf = (id, label, parent, group) => ({
  id,
  kind: 'leaf',
  label,
  parent,
  group, // 'platform' = a named product, 'capability' = a kind of work
  evidence: 'fact',
  src: 'FACT',
  source: LIVE_SITE,
})

const service = (id, label, parent, leaves = []) => ({
  id,
  kind: 'service',
  label,
  parent,
  evidence: 'fact',
  src: 'FACT',
  source: LIVE_SITE,
  leaves,
})

const mod = (id, index, label, short, title, definition, services) => ({
  id,
  kind: 'hub',
  label,
  parent: 'core',
  evidence: 'fact',
  src: 'BRIEF',
  source: 'docs/idea/v2/01-X-Command.md',
  index, // '01'..'04', printed in tags and rows
  short, // the hub word in the X: CODE, AI, CLOUD, PRODUCT
  // OFFERED states what the live site lists; it is never capacity or availability (doc 5.6).
  state: live(`${id}.state`, 'OFFERED'),
  // The row word of station 02 is sentence case (doc 5.2); `label` stays the uppercase module name.
  title: draft(`${id}.title`, title),
  definition: draft(`${id}.definition`, definition),
  services,
})

/** The centre of the X. Artwork-free: it is the brief's own "X data core". */
export const core = {
  id: 'core',
  kind: 'core',
  label: 'X CORE',
  parent: null,
  evidence: 'fact',
  src: 'BRIEF',
  source: 'docs/idea/v2/01-X-Command.md',
}

export const modules = [
  mod(
    'mod.software',
    '01',
    'SOFTWARE ENGINEERING',
    'CODE',
    'Software engineering',
    'Custom applications and low-code solutions, built around how your team works.',
    [
      service('svc.custom-app', 'Custom App Development', 'mod.software'),
      service('svc.low-code', 'Low-code Solutions', 'mod.software', [
        leaf('leaf.power-platform', 'Power Platform', 'svc.low-code', 'platform'),
        leaf('leaf.make', 'Make', 'svc.low-code', 'platform'),
        leaf('leaf.n8n', 'n8n', 'svc.low-code', 'platform'),
        leaf('leaf.retool', 'Retool', 'svc.low-code', 'platform'),
        leaf('leaf.bubble', 'Bubble', 'svc.low-code', 'platform'),
      ]),
    ],
  ),
  mod(
    'mod.ai',
    '02',
    'AI SYSTEMS',
    'AI',
    'AI systems',
    'Intelligent automation and analytics, wired into the systems you already run.',
    [
      service('svc.ai-solutions', 'AI-Powered Solutions', 'mod.ai', [
        leaf('leaf.intelligent-automation', 'intelligent automation', 'svc.ai-solutions', 'capability'),
        leaf('leaf.predictive-analytics', 'predictive analytics', 'svc.ai-solutions', 'capability'),
        leaf('leaf.conversational-interfaces', 'conversational interfaces', 'svc.ai-solutions', 'capability'),
        leaf('leaf.process-automation', 'process automation', 'svc.ai-solutions', 'capability'),
      ]),
      service('svc.ai-analytics', 'AI-Driven Analytics', 'mod.ai'),
    ],
  ),
  mod(
    'mod.cloud',
    '03',
    'CLOUD & PLATFORM',
    'CLOUD',
    'Cloud & platform',
    'Migration, optimisation and integration across Azure, AWS and GCP.',
    [
      service('svc.cloud', 'Cloud Computing', 'mod.cloud', [
        leaf('leaf.azure', 'Azure', 'svc.cloud', 'platform'),
        leaf('leaf.aws', 'AWS', 'svc.cloud', 'platform'),
        leaf('leaf.gcp', 'GCP', 'svc.cloud', 'platform'),
        leaf('leaf.migration', 'migration', 'svc.cloud', 'capability'),
        leaf('leaf.optimisation', 'optimisation', 'svc.cloud', 'capability'),
        leaf('leaf.integration', 'integration', 'svc.cloud', 'capability'),
      ]),
    ],
  ),
  mod(
    'mod.product',
    '04',
    'PRODUCT DEVELOPMENT',
    'PRODUCT',
    'Product development',
    'Products engineered and co-created with you, and the people to staff them.',
    [
      service('svc.product-engineering', 'Product Engineering', 'mod.product'),
      service('svc.product-co-creation', 'Product Co-Creation', 'mod.product'),
      service('svc.staffing', 'Staffing Services', 'mod.product'),
    ],
  ),
]

// Words around the module rows (doc 4.4).
export const deploy = {
  heading: draft('deploy.heading', 'Pick what you need.'),
  headingMuted: draft('deploy.heading.muted', 'We wire the rest.'),
  add: draft('deploy.add', 'ADD TO BRIEF'),
  added: draft('deploy.added', 'IN BRIEF'),
  // Shown only in review: the module wording is still draft (the grouping itself is confirmed).
  definitionsNote: draft('deploy.definitions', 'Module definitions and row words await sign-off.'),
  // Words of the module rows and the service panel (station 02). All DRAFT, none is a fact.
  modulesLabel: draft('deploy.modules', 'Modules'),
  platformsLabel: draft('deploy.platforms', 'PLATFORMS'),
  coversLabel: draft('deploy.covers', 'COVERS'),
  countLabel: draft('deploy.count', 'BRIEF'),
  panelHint: draft('deploy.hint', 'Tick what you need. It goes into the email you send at the end.'),
  fullTag: {
    // "MOD 02 / AI SYSTEMS / OFFERED": the three lines of the full tag are composed in code from
    // the module; only the prefix word is copy.
    mod: brief('deploy.tag.mod', 'MOD'),
  },
}
