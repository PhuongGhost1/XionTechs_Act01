import { draft, illustrative, placeholder } from './wrap.js'

// Station 05 AGENT RUN: the illustrative AI agent demo as a printer tape (docs/concepts/command-v2/
// 02-agent-demo-notes.md).
//
// Where the words come from:
//   ILLUSTRATIVE  the three scenarios, their branches, decisions, drills and the "Agent at work"
//                 journeys are PORTED (copied, adapted, tagged) from the main page's agent demo,
//                 src/content/site.js `workflows` and `agentJourneys` in the main checkout (read
//                 2026-10-04). They are invented demo material, not client claims: the page labels
//                 them for every visitor. No digits (content.test.js enforces it).
//   PLACEHOLDER   the four capability labels (`capabilityLabels` in the same file): generic words
//                 until the team confirms which Azure services each step runs on. The tape always
//                 draws them as dashed PENDING-style tags.
//   DRAFT         every word of the interface (heading, controls, status words), written for this
//                 station or ported from the main page's `aiAgents.run` words. Never a fact.
//
// Shape notes: a node says `type` (not `kind`) and `text` (the wrapper's words), a stop says `doing`,
// and no key is called `status` or `state`: the validator reserves those for OFFERED / ACTIVE /
// PENDING.

const SOURCE = 'main page agent demo (src/content/site.js)'
const il = (id, text, extra) => illustrative(id, text, { source: SOURCE, ...extra })
const named = (id, label, extra) => ({ id, label, src: 'ILLUSTRATIVE', source: SOURCE, ...extra })

// A step. Ids are the bare ids the paths use (they repeat across scenarios on purpose, as in the
// main page, where a path is a list of ids inside one scenario).
const n = (id, type, text, desc, extra) => il(id, text, { type, desc, ...extra })

const support = {
  id: 'support',
  ...named('support', 'Customer Support'),
  nodes: [
    n('email', 'trigger', 'New support email', 'A customer emails asking where their order is, or asking for a refund.'),
    n('triage', 'agent', 'Triage agent', 'Reads the email, works out what the customer wants and pulls out the order details.', { cap: 'ai' }),
    n('route', 'router', 'AI routing', 'Sends the request down the right path based on what the customer asked for.'),
    n('lookup', 'agent', 'Order lookup agent', 'Checks the order system and the shipping tracker for the latest status.', { cap: 'integration' }),
    n('reply', 'agent', 'Reply writer', 'Writes a clear reply with the tracking link and flags a late delivery.', { cap: 'ai' }),
    n('refund', 'agent', 'Refund agent', 'Checks the order against the refund policy and prepares the refund.', { cap: 'integration' }),
    n('approve', 'human', 'Human approves', 'A team member approves the refund before any money moves.', { waitsForDecision: true }),
    n('done', 'outcome', 'Customer answered', 'The customer gets an answer quickly; your team only sees the exceptions.'),
    n('clarify', 'agent', 'Clarifying question', 'Asks the customer one short question before going any further.', { cap: 'ai', drillOnly: true }),
    n('sentBack', 'outcome', 'Sent back with a note', 'The refund is not made; the customer gets a note and a person follows up.'),
  ],
  branches: [
    named('support.refund', 'Refund request', { path: ['email', 'triage', 'route', 'refund', 'approve'] }),
    named('support.status', 'Order status', { path: ['email', 'triage', 'route', 'lookup', 'reply', 'done'] }),
  ],
  decision: {
    ...il('support.decision', 'refund'),
    nodeId: 'approve',
    approve: ['done'],
    reject: ['sentBack'],
    log: {
      approve: il('support.decision.approve', 'refund sent to the customer'),
      reject: il('support.decision.reject', 'refund held, customer sent a note'),
    },
  },
  drills: [
    named('support.timeout', 'Order system timeout', {
      hint: 'Watch it retry',
      fault: 'Timeout',
      problemNodeId: 'lookup',
      path: ['email', 'triage', 'route', 'lookup', 'lookup', 'reply', 'done'],
    }),
    named('support.unclear', 'Customer request is unclear', {
      hint: 'Watch it ask first',
      problemNodeId: 'triage',
      path: ['email', 'triage', 'clarify', 'lookup', 'reply', 'done'],
    }),
  ],
}

const inventory = {
  id: 'inventory',
  ...named('inventory', 'Inventory & Orders'),
  nodes: [
    n('check', 'trigger', 'Daily stock check', 'Every morning the stock levels are reviewed automatically.'),
    n('monitor', 'agent', 'Stock monitor agent', 'Compares current stock with safety levels and recent sales.', { cap: 'data' }),
    n('route', 'router', 'AI routing', 'Decides whether anything needs reordering today.'),
    n('skip', 'outcome', 'Logged, no action', 'Stock is healthy, so the check is logged and nobody is interrupted.'),
    n('forecast', 'agent', 'Demand forecaster', 'Estimates upcoming demand from sales history and open orders.', { cap: 'ai' }),
    n('draft', 'agent', 'Reorder drafter', 'Drafts a reorder with quantity and supplier, using supplier lead times.', { cap: 'integration' }),
    n('buyer', 'human', 'Buyer approves', 'A buyer reviews the draft and approves it with one click.', { waitsForDecision: true }),
    n('sent', 'outcome', 'Reorder sent', 'Stock-outs are caught before they happen; a human approves instead of chasing.'),
    n('held', 'outcome', 'Reorder held for review', 'Nothing is ordered; the draft waits for the buyer to look again.'),
  ],
  branches: [
    named('inventory.low', 'Low stock', { path: ['check', 'monitor', 'route', 'forecast', 'draft', 'buyer'] }),
    named('inventory.healthy', 'Stock healthy', { path: ['check', 'monitor', 'route', 'skip'] }),
  ],
  decision: {
    ...il('inventory.decision', 'reorder'),
    nodeId: 'buyer',
    approve: ['sent'],
    reject: ['held'],
    log: {
      approve: il('inventory.decision.approve', 'reorder sent to the supplier'),
      reject: il('inventory.decision.reject', 'reorder held for review'),
    },
  },
  drills: [
    named('inventory.offline', 'Supplier system offline', {
      hint: 'Watch it retry',
      fault: 'Offline',
      problemNodeId: 'draft',
      path: ['check', 'monitor', 'route', 'forecast', 'draft', 'draft', 'buyer'],
    }),
    named('inventory.spike', 'Sales spike looks wrong', {
      hint: 'Watch it escalate',
      problemNodeId: 'forecast',
      path: ['check', 'monitor', 'route', 'forecast', 'buyer'],
    }),
  ],
}

const factory = {
  id: 'factory',
  ...named('factory', 'Smart Factory (IoT)'),
  nodes: [
    n('sensor', 'trigger', 'Vibration sensor spike', 'A vibration sensor on a packaging line reports an unusual spike.'),
    n('anomaly', 'agent', 'Anomaly agent', 'Recognises the pattern as an early sign of bearing wear.', { cap: 'iot' }),
    n('crosscheck', 'agent', 'Second sensor check', 'Reads a second sensor on the same line before trusting the first one.', { cap: 'iot', drillOnly: true }),
    n('history', 'agent', 'Maintenance history agent', 'Looks up when this machine was last serviced and what was replaced.', { cap: 'data' }),
    n('roster', 'agent', 'Shift roster agent', 'Finds the next break and which technician is on shift.', { cap: 'integration' }),
    n('schedule', 'agent', 'Scheduler agent', 'Proposes a technician slot in the next break.', { cap: 'ai' }),
    n('confirm', 'human', 'Shift lead confirms', 'The shift lead confirms the plan before anyone is booked.', { waitsForDecision: true }),
    n('booked', 'outcome', 'Technician booked', 'Downtime is prevented instead of repaired; the shift lead is kept in the loop.'),
    n('standby', 'outcome', 'Kept under watch', 'No one is booked yet; the machine stays under closer watch.'),
  ],
  branches: [
    named('factory.alert', 'Sensor alert', { path: ['sensor', 'anomaly', ['history', 'roster'], 'schedule', 'confirm'] }),
  ],
  decision: {
    ...il('factory.decision', 'technician booking'),
    nodeId: 'confirm',
    approve: ['booked'],
    reject: ['standby'],
    log: {
      approve: il('factory.decision.approve', 'technician booked for the next break'),
      reject: il('factory.decision.reject', 'machine kept under watch'),
    },
  },
  drills: [
    named('factory.faulty', 'Sensor reading looks faulty', {
      hint: 'Watch it double-check',
      problemNodeId: 'anomaly',
      path: ['sensor', 'anomaly', 'crosscheck', ['history', 'roster'], 'schedule', 'confirm'],
    }),
    named('factory.notech', 'No technician on shift', {
      hint: 'Watch it escalate',
      problemNodeId: 'roster',
      path: ['sensor', 'anomaly', ['history', 'roster'], 'confirm'],
    }),
  ],
}

// "Agent at work": one agent working one long task, stop by stop. `kind` is resource, skill or
// compact (the context is folded). `doing` is what the agent says it is doing.
const stop = (id, kind, label, doing) => il(id, label, { kind, doing })
const journey = (id, task, stops) => ({
  id,
  ...il(`journey.${id}`, task),
  stops: stops.map(([kind, label, doing], i) => stop(`journey.${id}.${i}`, kind, label, doing)),
})

const FOLD = 'Compacting context…'

const journeys = [
  journey('support', 'Working through the morning support queue', [
    ['resource', 'support/inbox', 'Reading new tickets'],
    ['skill', 'skills/triage', 'Using skill: triage'],
    ['resource', 'orders/system', 'Looking up order status'],
    ['resource', 'shipping/tracker', 'Checking deliveries'],
    ['compact', 'context', FOLD],
    ['resource', 'policy/refunds', 'Checking the refund policy'],
    ['skill', 'skills/reply-writing', 'Using skill: reply writing'],
    ['resource', 'escalations/queue', 'Handing exceptions to the team'],
  ]),
  journey('inventory', 'Running the daily stock review', [
    ['resource', 'stock/levels', 'Reading stock levels'],
    ['resource', 'sales/history', 'Reviewing recent sales'],
    ['skill', 'skills/forecasting', 'Using skill: forecasting'],
    ['resource', 'suppliers/lead-times', 'Checking supplier lead times'],
    ['compact', 'context', FOLD],
    ['resource', 'orders/open', 'Checking open orders'],
    ['skill', 'skills/reorder-drafting', 'Using skill: reorder drafting'],
    ['resource', 'approvals/buyer', 'Sending drafts for approval'],
  ]),
  journey('factory', 'Handling a machine health alert', [
    ['resource', 'sensors/vibration-feed', 'Reading the sensor feed'],
    ['skill', 'skills/anomaly-detection', 'Using skill: anomaly detection'],
    ['resource', 'machines/maintenance-log', 'Reading the maintenance log'],
    ['compact', 'context', FOLD],
    ['resource', 'shifts/roster', 'Checking the shift roster'],
    ['skill', 'skills/scheduling', 'Using skill: scheduling'],
    ['resource', 'technicians/calendar', 'Booking a technician'],
    ['resource', 'alerts/shift-lead', 'Alerting the shift lead'],
  ]),
]

// Interface words. DRAFT unless said otherwise. The `run.*` words are ported from the main page's
// aiAgents.run (same wording, same {placeholders}).
const d = (id, text) => draft(`agent.${id}`, text)
const dm = (id, text) => draft(`agent.${id}`, text, { source: SOURCE })

export const agent = {
  heading: d('heading', 'One run, printed line by line.'),
  headingMuted: d('heading.muted', 'It stops where a person decides.'),
  intro: d(
    'intro',
    'Each step of an AI agent prints as one line. When the work needs a decision, the printer stops and waits for you.',
  ),
  // The honesty label, always on screen (chip in the panel and on the printer).
  chip: il('chip', 'Illustrative scenario, not a client case study'),
  agentName: il('agentName', 'XionTechs agent'),
  scenarios: d('scenarios', 'Scenario'),
  workflows: [support, inventory, factory],
  journeys,
  // PLACEHOLDER: generic capability words until the team confirms the real services. Drawn as
  // dashed PENDING tags (never as a fact).
  capabilities: {
    ai: placeholder('agent.cap.ai', 'AI model', { source: SOURCE }),
    integration: placeholder('agent.cap.integration', 'Integration', { source: SOURCE }),
    iot: placeholder('agent.cap.iot', 'IoT gateway', { source: SOURCE }),
    data: placeholder('agent.cap.data', 'Data store', { source: SOURCE }),
  },
  capabilityNote: d('capabilityNote', 'Capability tags are placeholders until confirmed.'),
  // The right-hand tag of a line that is not an agent step.
  types: {
    trigger: d('type.trigger', 'Trigger'),
    router: d('type.router', 'Router'),
    human: d('type.human', 'Human'),
    outcome: d('type.outcome', 'Outcome'),
  },
  // Left prefix of a line in the "Agent at work" view.
  prefixes: {
    resource: d('prefix.resource', 'Resource'),
    skill: d('prefix.skill', 'Skill'),
    compact: d('prefix.compact', 'Folded'),
  },
  controls: {
    group: d('controls.group', 'Run controls'),
    view: d('controls.view', 'Agent at work'),
    viewHint: d('controls.view.hint', 'One agent, one long task, stop by stop'),
    drills: d('controls.drills', 'Inject a problem'),
    clear: d('controls.clear', 'Clear'),
    pause: d('controls.pause', 'Pause'),
    replay: d('controls.replay', 'Replay'),
    approve: d('controls.approve', 'Approve'),
    reject: d('controls.reject', 'Reject'),
    decide: d('controls.decide', 'Decision'),
  },
  tape: {
    label: d('tape.label', 'Printed run'),
    sign: d('tape.sign', 'Awaiting approval'),
    signHint: dm('tape.sign.hint', 'Automation with human control.'),
    stampApproved: d('tape.stamp.approved', 'Approved'),
    stampRejected: d('tape.stamp.rejected', 'Rejected'),
    abort: d('tape.abort', 'Abort'),
    notTaken: d('tape.notTaken', 'Not taken'),
    retry: d('tape.retry', 'Retry'),
    problem: d('tape.problem', 'Problem'),
    folded: d('tape.folded', 'Context folded'),
    complete: d('tape.complete', 'Task complete'),
    ifApproved: d('tape.ifApproved', 'If approved'),
    ifRejected: d('tape.ifRejected', 'If rejected'),
    printer: d('tape.printer', 'XionTechs agent printer'),
    tagsPending: d('tape.tagsPending', 'Capability tags: pending'),
  },
  // Words of the status line and of the phase word, ported from aiAgents.run.
  run: {
    phase: {
      running: dm('run.phase.running', 'Running'),
      decision: dm('run.phase.decision', 'Deciding'),
      approval: dm('run.phase.approval', 'Your call'),
      error: dm('run.phase.error', 'Error'),
      retrying: dm('run.phase.retrying', 'Retrying'),
      recovered: dm('run.phase.recovered', 'Recovered'),
      completed: dm('run.phase.completed', 'Complete'),
      paused: dm('run.phase.paused', 'Paused'),
    },
    line: {
      waiting: dm('run.line.waiting', 'Waiting for your decision'),
      error: dm('run.line.error', 'Error · {problem}'),
      retrying: dm('run.line.retrying', 'Retrying…'),
      recovered: dm('run.line.recovered', 'Recovered · {step}'),
      problem: dm('run.line.problem', 'Problem: {problem}'),
      drillDone: dm('run.line.drillDone', 'Drill complete · {problem}'),
      approved: dm('run.line.approved', 'Run complete · approved by you'),
      rejected: dm('run.line.rejected', 'Run complete · rejected by you'),
      pathDone: dm('run.line.pathDone', 'Run complete · took the “{path}” path'),
      running: dm('run.line.running', 'Running · {what}'),
      runningPath: dm('run.line.runningPath', 'Running · {path} path'),
    },
    journey: {
      running: d('run.journey.running', 'Running · {task}'),
      done: d('run.journey.done', 'Task complete · {task}'),
    },
  },
  a11y: {
    tabs: d('a11y.tabs', 'Scenarios'),
    tape: d('a11y.tape', 'The printed run, one line per step'),
    live: d('a11y.live', 'Run progress'),
  },
}
