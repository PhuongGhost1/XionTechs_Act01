# Agent workflow graph, monitoring strip, Azure strip — design spec

Date: 2026-10-01
Branch: `feat/agent-workflow-graph` (stacked on `feat/landing-redesign`, which is not yet merged)
Status: awaiting review
Builds on: `docs/superpowers/specs/2026-09-30-landing-redesign-design.md`

## 1. Goal

Replace the linear "Watch an agent work" timeline with a live workflow graph —
triggers, agents, routing, human approval and outcomes connected on a canvas,
with a run animating along one branch — in the style used by leading AI-agent
sites (Relevance AI, Sierra). Add a monitoring strip showing that agent runs are
checked and corrected, and a "Built on Azure" strip. Remove the chat guide: the
leading agent sites show workflows instead of a chatbot, and every chat answer
already exists as page content.

Audience is unchanged: business decision-makers. Everything a visitor sees must
be either verified real or visibly labeled draft / illustrative.

### Decisions already made

| Topic | Decision |
|---|---|
| Graph rendering | Hand-built SVG + React from data in `site.js`. No new dependencies. |
| Azure services on nodes | Not confirmed yet. Use generic capability labels ("AI model", "Integration", "IoT gateway", "Data store"), flagged PLACEHOLDER, styled as draft. |
| Chat guide | Removed entirely (component, engine, tests, copy, CSS, conventions). Recoverable from git history. |
| Scope | Graph + monitoring strip + Azure strip + chat removal. The self-check and Trust & safety ideas are out of scope for this round. |
| Phones | Vertical flow below 1024 px, driven by the same data. |

### Source notes (for PROMPT_LOG)

- Azure-first focus: stated by team member Phuong Hoang, 2026-10-01. The live
  site copy names "Azure, AWS, and GCP". Azure-first wording ships as
  PLACEHOLDER pending team sign-off; specific Azure service names stay
  generic until confirmed.
- Chat removal rationale: user review of sierra.ai and relevanceai.com/agents —
  workflow visualisation rather than a chatbot.

## 2. Page changes

| Section | Change |
|---|---|
| Agent demo (`#demo`) | `AgentDemo.jsx` timeline replaced by `WorkflowGraph.jsx` (desktop canvas) + `WorkflowList.jsx` (phone layout and screen-reader text), orchestrated by `AgentDemo.jsx`. Monitoring strip `RunMonitor.jsx` sits inside the same section, under the graph. |
| New strip | `AzureStrip.jsx` between Pillars and Why-Us. |
| Chat | `ChatGuide.jsx`, `src/chat/` (engine, intents, tests), `chat` export in `site.js`, `.chat-panel` CSS and `<ChatGuide />` in `App.jsx` deleted. |

Section order otherwise unchanged. Nav links unchanged.

## 3. Scenario data model

`agentScenarios` in `site.js` is replaced by `workflows`:

```js
// ILLUSTRATIVE: invented demo workflows, not client claims.
export const workflows = [
  {
    id: 'support',
    label: 'Customer Support',
    icon: 'MessageCircle',
    illustrative: true,
    nodes: [
      { id: 't', type: 'trigger', title: 'New support email', x: 380, y: 40, desc: '…' },
      { id: 'triage', type: 'agent', title: 'Triage agent', capability: 'AI model', x: 380, y: 140, desc: '…' },
      { id: 'route', type: 'router', title: 'AI routing', x: 380, y: 240, desc: '…' },
      // …
    ],
    edges: [ ['t', 'triage'], ['triage', 'route'], /* … */ ],
    branches: [
      { label: 'Order status', path: ['t', 'triage', 'route', 'lookup', 'reply', 'done'] },
      { label: 'Refund request', path: ['t', 'triage', 'route', 'refund', 'approve', 'done'] },
    ],
  },
  // inventory, factory
]

// PLACEHOLDER: generic capability labels until the team confirms which Azure
// services each step uses (see content/TODO.md).
export const capabilityLabels = ['AI model', 'Integration', 'IoT gateway', 'Data store']
```

- Node `type` ∈ `trigger | agent | router | human | outcome`.
- `capability` (agents only) must be one of `capabilityLabels`.
- `x`, `y` are canvas coordinates in a fixed 760 × 520 viewBox.
- `desc` holds the explanatory sentence (the old step texts move here).
- A branch `path` is the ordered steps of one run. Each step is either a node
  id (string) or an array of node ids that run in parallel, e.g.
  `['t', 'anomaly', ['history', 'roster'], 'sched', 'done']`. Every node in
  one step must have an edge to every node in the next step.

### The three workflows

- **Customer Support** — *New support email* (trigger) → *Triage agent* (AI
  model) → *AI routing* →
  - Order status: *Order lookup agent* (Integration) → *Reply writer* (AI
    model) → *Customer answered* (outcome)
  - Refund request: *Refund agent* (Integration) → *Human approves* (human) →
    *Customer answered*
- **Inventory & Orders** — *Daily stock check* (trigger) → *Stock monitor
  agent* (Data store) → *AI routing* →
  - Normal: *Logged, no action* (outcome)
  - Low stock: *Demand forecaster* (AI model) → *Reorder drafter* (Integration)
    → *Buyer approves* (human) → *Reorder sent* (outcome)
- **Smart Factory (IoT)** — *Vibration sensor spike* (trigger) → *Anomaly
  agent* (IoT gateway) → *Maintenance history agent* (Data store) and *Shift
  roster agent* (Integration) in parallel → *Scheduler agent* (AI model) →
  *Technician booked, shift lead alerted* (outcome). Single branch; Replay
  replays it.

No digits in any title, desc, capability or branch label (the trigger is
"Daily stock check", not "Daily at 9am").

### Run logic

`src/workflow/run.js` (pure, tested):

```js
export function buildRun(workflow, branchIndex)
// → { steps: string[][], edges: [from, to][], branchLabel }
//   steps: each path step normalised to an array of node ids (parallel steps keep both)
//   edges: every (a, b) with a in step i and b in step i + 1, in order
export function nextBranchIndex(workflow, current) // → (current + 1) % branches.length
```

The animation advances one step at a time: all edges into the step travel
together, and all nodes of a parallel step work at once.

## 4. Desktop graph (≥ 1024 px)

- SVG canvas, `viewBox="0 0 760 520"`, width 100 % of container, dotted grid
  background drawn with an SVG pattern in `--line`.
- Edges: orthogonal "elbow" paths between node anchors, stroke `--line`;
  active edges stroke `--accent`.
- Nodes are HTML-styled cards rendered via `<foreignObject>` or absolutely
  positioned buttons over the SVG (implementer's choice; must remain focusable
  buttons with visible focus rings and token colours only).
- Node looks:
  - trigger: small "Trigger" tag above a pill
  - agent: card with icon, title, capability chip (dashed border, "Draft"
    styling)
  - router: small dashed pill
  - human: card with person icon and "Approval" tag
  - outcome: card with check icon; accent fill when reached
- **Run animation** (only while the section is in view):
  1. The trigger pulses.
  2. A packet (small accent dot) travels the next edge (~0.6 s), using CSS
     `offset-path`; where unsupported, the edge fills instead.
  3. The receiving node shows a working ring (~0.8 s), then turns active.
  4. Repeat to the end of the path. At the router, the non-chosen branch
     dims its borders and edges only — text keeps full contrast.
  5. The outcome glows; a line under the graph reads "Run complete · took the
     *<branch label>* path".
- Controls: scenario tabs (WAI-ARIA tabs, arrow/Home/End), Pause/Play,
  Replay. Replay advances to the next branch (`nextBranchIndex`). Play when
  finished = Replay.
- Clicking a node opens a detail panel beside the graph with its title,
  capability (if any) and `desc`. The panel is `aria-live="polite"`.
- Switching tabs clears all timers and starts the new workflow at branch 0.
- Badge: "Illustrative scenario — not a client case study" (unchanged).

## 5. Phone layout (< 1024 px) and text alternative

`WorkflowList.jsx` renders the same run as an ordered list:

- Linear steps as stacked cards joined by a vertical line.
- The router renders as "AI routing — routes to one of:" followed by the two
  branches indented side by side (stacked below 480 px); the chosen branch is
  highlighted, the other dimmed (chrome only).
- During a run, the highlight moves down the list step by step.
- On desktop the same list is rendered visually hidden (`sr-only`) as the
  graph's text alternative; the SVG is `aria-hidden` apart from the node
  buttons.

## 6. Reduced motion

No packets, rings or step timing. The chosen path renders fully active at
once; Replay switches branch instantly; the monitoring strip is a static list.

## 7. Monitoring strip (`RunMonitor.jsx`)

- Heading: "Agents are watched, not left alone." Sub-line: "Every run is
  checked. Anything unusual goes to a person." (PLACEHOLDER copy.)
- A run log of six rows from `runLog` in `site.js`:
  `{ status: 'passed' | 'flagged' | 'retried', workflow: 'support', text }`.
  Example rows:
  - passed — "Order-status reply · grounded in order data"
  - flagged — "Refund over limit · sent to approver"
  - retried — "Supplier system timeout · retried, then succeeded"
- Status shown by icon + word ("Passed checks", "Flagged for review",
  "Retried"), never colour alone.
- While in view, a new row slides in at the top every ~3 s, cycling through
  the six (newest first, four visible). Reduced motion: static list of all six.
- "Illustrative" badge. No numbers, percentages, counts or timings — enforced
  by test.

## 8. "Built on Azure" strip (`AzureStrip.jsx`)

- Slim band, `#stack` id, between Pillars and Why-Us.
- Line: "Built on Microsoft Azure — with AWS and GCP when your stack needs it."
  `// PLACEHOLDER: Azure-first framing pending team sign-off; the three clouds
  are real live-site copy.`
- Text chips (no logos): **Azure** (primary chip style), AWS, GCP, Power
  Platform, Make, n8n, Retool, Bubble — all named in the real service copy.
- Content in `site.js` as `stack: { line, chips: [{ label, primary? }] }`.

## 9. Content, docs, housekeeping

- `site.js`: remove `agentScenarios` and `chat`; add `workflows`,
  `capabilityLabels`, `runLog`, `stack`, and `sections.monitor`
  ({ title, intro }). Keep `sections.demo`.
- `icons.js`: add the icons the node types need (e.g. `Zap`, `GitBranch`,
  `UserCheck`, `CheckCircle2`, `Bot`, plus `ShieldCheck`, `Flag`, `RotateCw`
  for the monitor); remove icons no longer referenced (verify with grep).
- `content/TODO.md`: add "Confirm Azure services per workflow step (replace
  capability labels)", "Azure-first strip wording", "Monitoring strip copy".
  Remove "Chat guide answers".
- `CLAUDE.md`: remove the three chat conventions; add "Workflow scenarios in
  `site.js` are illustrative; capability labels are placeholders until the
  team confirms real Azure services; no digits in workflow or run-log text
  (`npm test` enforces this)."
- `PROMPT_LOG.md`: entry for this round with the source notes in §1.

## 10. Testing

### Automated (Vitest)

- `site.test.js`:
  - every workflow is `illustrative: true`
  - every edge references existing node ids; every branch path follows edges
  - each workflow has exactly one trigger and at least one outcome; every
    branch path starts at the trigger and ends at an outcome
  - every agent node's `capability` is in `capabilityLabels`
  - no digit in any workflow title, desc, capability, branch label, or
    `runLog` text
  - `runLog` has six rows using only the three statuses
  - existing lorem guard kept; old `agentScenarios` tests removed
- `src/workflow/run.test.js`: `buildRun` returns the steps and edges in order
  for each branch; the Smart Factory parallel step yields one two-node step and
  four edges around it (anomaly→history, anomaly→roster, history→sched,
  roster→sched); `nextBranchIndex` wraps.
- Chat tests deleted with the chat code.

### Build checks

`npm run lint`, `npm run build`, `npm test` pass at every commit. Main JS
chunk ≤ 71 kB gzipped (currently 64.54 kB; chat removal frees roughly 3–4 kB).

### Browser checklist (controller, before completion)

All three themes at 1280 px and 390 px:
- graph renders, run plays along one branch, router dims the other
- Replay switches branch; tab switch restarts cleanly; node click opens detail
- phone shows the vertical list with the moving highlight
- monitoring rows cycle; reduced motion shows static path and static list
- no chat bubble anywhere; no console errors; all anchors resolve
- contrast samples on node text, capability chips, monitor rows

## 11. Out of scope

- Naming specific Azure services (pending team confirmation).
- "Is my process a good fit?" self-check, Trust & safety section.
- Real monitoring data or any live backend.
- Drag/zoom/editable graph.
- Fixing the parked mobile chat-panel height item (moot: chat removed).
