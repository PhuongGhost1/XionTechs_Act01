# "Agent at work" view — design spec

Date: 2026-10-01
Branch: `feat/agent-at-work` (stacked on `feat/agent-workflow-graph`, which is stacked on `feat/landing-redesign`; neither is merged yet)
Status: awaiting review
Builds on: `docs/superpowers/specs/2026-10-01-agent-workflow-graph-design.md`

## 1. Goal

Add a second view to the agent demo, inspired by Relevance AI's "Cowork & Codex"
animation: one agent travelling a long stepped path, picking up resources and
skills as it passes, with a context ring that fills and then compacts. The
existing workflow graph answers "how do agents cooperate?"; this view answers
"can one agent handle a long, multi-step job without losing track?".

Audience unchanged: business decision-makers. Everything shown is illustrative
and labeled.

### Decisions already made

| Topic | Decision |
|---|---|
| Placement | Toggle inside the agent demo panel: **Workflow \| Agent at work**. Scenario tabs, Pause/Replay, illustrative badge and run monitor are shared. |
| Content | One journey per scenario tab (support, inventory, factory), so the toggle shows the same scenario two ways. |
| Animation | Tick-based steps with CSS transform transitions, reusing the demo's existing timer, Pause and in-view logic. No requestAnimationFrame loop. |
| Branding | Agent pill reads "XionTechs agent" — never another vendor's product/model name. |
| Numbers | None. The context ring fills visually; no token counts or percentages (existing no-digits rule). |

## 2. Data (`src/content/site.js`)

```js
// ILLUSTRATIVE: invented single-agent journeys, not client claims.
// Rendered with the "Illustrative scenario" badge. No digits anywhere (npm test).
export const agentJourneys = [
  {
    id: 'support', // matches workflows[].id
    task: 'Working through the morning support queue',
    stops: [
      { kind: 'resource', label: 'support/inbox', status: 'Reading new tickets' },
      { kind: 'skill', label: 'skills/triage', status: 'Using skill: triage' },
      // …
      { kind: 'compact', status: 'Compacting context…' },
      // …
    ],
  },
  // inventory, factory
]
```

- `kind` ∈ `resource | skill | compact`. `compact` stops have no `label`.
- Exactly one `compact` stop per journey, not first or last.
- Labels unique within a journey, path-like, ≤ 26 characters.
- Every `workflows[].id` has exactly one journey and vice versa.

### The three journeys

| Scenario | Stops (compact marked ⟳) |
|---|---|
| support — "Working through the morning support queue" | `support/inbox` (Reading new tickets) → `skills/triage` (Using skill: triage) → `orders/system` (Looking up order status) → `shipping/tracker` (Checking deliveries) → ⟳ → `policy/refunds` (Checking the refund policy) → `skills/reply-writing` (Using skill: reply writing) → `escalations/queue` (Handing exceptions to the team) |
| inventory — "Running the daily stock review" | `stock/levels` (Reading stock levels) → `sales/history` (Reviewing recent sales) → `skills/forecasting` (Using skill: forecasting) → `suppliers/lead-times` (Checking supplier lead times) → ⟳ → `orders/open` (Checking open orders) → `skills/reorder-drafting` (Using skill: reorder drafting) → `approvals/buyer` (Sending drafts for approval) |
| factory — "Handling a machine health alert" | `sensors/vibration-feed` (Reading the sensor feed) → `skills/anomaly-detection` (Using skill: anomaly detection) → `machines/maintenance-log` (Reading the maintenance log) → ⟳ → `shifts/roster` (Checking the shift roster) → `skills/scheduling` (Using skill: scheduling) → `technicians/calendar` (Booking a technician) → `alerts/shift-lead` (Alerting the shift lead) |

Note: `sensors/vibration-feed` (22) and `skills/anomaly-detection` (24) and
`machines/maintenance-log` (24) fit the 26-character limit.

## 3. Pure logic (`src/workflow/journey.js`, tested)

```js
export const JOURNEY_VIEW = { w: 760, h: 360 } // visible window, same width as the graph canvas
export function layoutJourney(journey)
// → { points: {x,y}[] (one per stop, staircase), path: string (SVG d through all points),
//     tags: { x, y, side: 'above'|'below', stopIndex }[], width, height }
export function journeyTicks(journey) // total ticks for a full run
export function journeyStateAt(journey, tick)
// → { stopIndex: number, phase: 'moving'|'working', ringFill: number 0..1,
//     compacting: boolean, lit: Set<number>, status: string, done: boolean }
export function cameraX(layout, stopIndex) // canvas translate so the stop sits near the window centre, clamped to [0, width - view.w]
```

- **Staircase layout:** stop *i* sits at `x = PAD + i * STEP_X`; `y` alternates
  between an upper and lower level (`LEVELS = [140, 220]`); the path between
  consecutive points is orthogonal (vertical then horizontal then vertical, same
  elbow style as workflow edges). `compact` stops sit on the path with no tag.
  Tags hang on short stubs, alternating above/below the path, never overlapping
  each other or leaving the canvas.
- **Timeline:** per stop, tick `2i` = moving to stop *i* (tick 0 = appear at
  stop 0), tick `2i+1` = working at stop *i*; for the compact stop, two working
  ticks (fill turns amber, then drains). `done` after the last stop's working
  tick.
- **Ring:** rises evenly across non-compact stops before the compaction to
  about 0.85; at the compact stop it becomes `compacting: true` and drains to
  about 0.15; then rises again but never above 0.85. Exact values are
  implementation details pinned by tests (monotonic between compactions, drop
  at compaction, always within [0, 1]).
- `status` = the current stop's `status`; after `done` = "Task complete".

## 4. Component (`src/components/AgentJourney.jsx`)

Props: `{ journey, tick, reduced }` — AgentDemo owns the timer.

### Desktop (≥ 1024 px)
- A fixed-height window (`aspect 760/360`, `overflow-hidden`, dotted-grid
  background via SVG pattern in `--line`) containing a wide inner canvas
  translated by `-cameraX` with `transition: transform 700ms ease`.
- SVG layer: the full staircase path in `stroke-muted`; the travelled part in
  `stroke-accent` (dash-offset or a second path up to the current point).
- Tags: monospace `text-xs` chips (file icon for `resource`, sparkle icon for
  `skill`) on a stub. Unvisited: `border-muted text-muted`; lit (visited):
  `border-accent text-ink`; current: plus a soft accent ring. Text never
  dimmed below 4.5:1.
- Agent pill, absolutely positioned at the current point
  (`transition: left/top 700ms ease` or transform): dark chip
  `bg-ink text-paper`, bot icon, "XionTechs agent".
- Status chip directly below the pill: `bg-surface border-line text-ink`, a
  ring icon (SVG circle with `stroke-dasharray` showing `ringFill`; track in
  `stroke-line`, fill in `stroke-primary` normally and `stroke-accent` while
  compacting) and the status text. While compacting the status text uses
  `text-accent`.
- Task caption above the window: "Agent at work · <task>".

### Phones (< 1024 px) and text alternative
`AgentJourneyList`-style ordered list (inside the same component): each stop
as a row with icon, monospace label and status; the compact stop renders as a
divider "Context compacted — continuing". Current stop highlighted, visited
stops marked done. On desktop the list is `sr-only` as the text alternative;
the visual window is `aria-hidden`.

### Reduced motion
`tick` = end of run (AgentDemo already derives this). Window shows the whole
path scaled to fit (no camera transform), every tag lit, status "Task
complete". No transitions.

## 5. AgentDemo changes

- New state `view: 'workflow' | 'agent'`, default `'workflow'`.
- Segmented control **Workflow | Agent at work** (radiogroup, arrow keys,
  token colours: selected `bg-primary text-primaryInk`, other
  `border-line text-ink/70`) placed with the Pause/Replay controls.
- The run timer counts ticks for whichever view is active
  (`total = view === 'workflow' ? totalTicks(run) : journeyTicks(journey)`).
  Changing view or tab resets `tick` to 0 in the same handler.
- Replay: workflow view → next branch (unchanged); agent view → restart the
  journey. Under reduced motion the agent view shows no Pause/Replay controls
  (restarting would change nothing visible); the workflow view keeps its
  existing reduced-motion Replay behaviour.
- Status line under the view: workflow text unchanged; agent view →
  "Running · <task>" / "Task complete · <task>".
- Step-details panel shows only in workflow view.
- RunMonitor unchanged and shared.

## 6. Testing

- `src/workflow/journey.test.js`: layout staircase (x increasing, y alternating
  levels, orthogonal path, tags inside canvas and non-overlapping), timeline
  (stop order, moving/working phases, compact gets two working ticks, `done`
  exactly at `journeyTicks`, ticks beyond end), ring (monotonic between
  compactions, drops at compaction, within [0, 1]), `cameraX` clamped.
- `src/content/site.test.js`: one journey per workflow id; exactly one
  compact stop, not first/last; unique labels ≤ 26 chars; no digits in task,
  labels or statuses.
- Lint, build, tests at every commit; bundle ≤ 71 kB gzip.
- Controller browser checklist: both views × three themes × 1280/390 px;
  toggle keyboard; camera pans and agent glides; tags light; compaction state;
  Pause stops agent view and run log; reduced motion static fit; contrast
  samples on pill, tags, status chip.

## 7. Out of scope

- Any real agent telemetry or token counts.
- Continuous (requestAnimationFrame) motion.
- Showing the agent view in the hero.
- Naming specific Azure services (still pending team confirmation).
