# "You're the approver" + failure drills — design spec

Date: 2026-10-01
Branch: `feat/approve-and-drills` (stacked on `feat/agent-at-work` → `feat/agent-workflow-graph` → `feat/landing-redesign`; none merged yet)
Status: awaiting review
Builds on: `docs/superpowers/specs/2026-10-01-agent-workflow-graph-design.md`

## 1. Goal

Make the workflow demo answer the business visitor's "can I trust it?" question
by letting them (a) make the human decision themselves — the run stops at the
approval step and waits for Approve / Reject — and (b) throw a problem at the
agent and watch it retry, ask, cross-check or escalate. Competitor demos we
reviewed (Sierra, Relevance AI) show happy paths only; this shows control and
graceful failure.

Everything remains illustrative and labeled. No numbers.

### Decisions already made

| Topic | Decision |
|---|---|
| Where | Workflow view only. "Agent at work" view unchanged (drill button hidden there). |
| Approval coverage | Every scenario has exactly one approval step; Smart Factory gains "Shift lead confirms". |
| Decision behaviour | The run stops at the approval step and waits indefinitely. Approve → continue to outcome; Reject → a new "sent back" outcome. No timer, no auto-decision. Both logged. |
| First run | Each scenario's first run takes the path with the approval step. |
| Drills | "Throw a problem at it" menu, 2 drills per scenario, each ending in recovery (retry / detour) or escalation (skips ahead to the approval step, which then waits). |
| Implementation | Data-driven predefined paths on the existing pure run logic (`buildRun` / `stateAt`); no event engine. |

## 2. Data model changes (`site.js` → `workflows`)

New node fields:
- `waitsForDecision: true` — exactly one per workflow, on a `human` node.
- `drillOnly: true` — node hidden unless the active drill's path includes it.

New workflow fields:

```js
branches: [ /* normal paths; branch 0 is the approval path */ ],
decision: {
  nodeId: 'approve',                       // the waitsForDecision node
  verb: 'refund',                          // used in button names: "Approve the refund"
  approve: ['done'],                      // steps after the decision node on Approve
  reject:  ['sentBack'],                  // steps after the decision node on Reject
  log: { approve: 'Approved by you · …', reject: 'Rejected by you · …' },
},
drills: [
  {
    id: 'timeout',
    label: 'Order system timeout',
    hint: 'Watch it retry',
    problemNodeId: 'lookup',
    path: ['email', 'triage', 'route', 'lookup', 'lookup', 'reply', 'done'],
    log: { status: 'retried', text: 'Retried · order system timeout, then succeeded' },
  },
  // second drill
],
```

Path rules (extending the existing ones):
- A node id appearing twice consecutively in a path is a **retry** of that node.
- A path that reaches the `decision.nodeId` stops there until a decision; the
  continuation is `decision.approve` or `decision.reject` appended after it.
- Every consecutive pair (except a retry pair) must be an edge.
- Any branch or drill path that goes through the decision node **ends at it**
  (e.g. support's refund branch becomes `email → triage → route → refund →
  approve`); the outcome after it comes only from `decision.approve` /
  `decision.reject`. Paths that don't reach the decision node end at an outcome
  as before.
- Drill log `status` is one of the existing `passed | flagged | retried`.

### Per scenario

| Scenario | Decision node | Reject outcome (new) | Drill 1 | Drill 2 |
|---|---|---|---|---|
| support | `approve` "Human approves" (existing) | `sentBack` "Sent back with a note" | **Order system timeout** — retry at `lookup`; path `email → triage → route → lookup → lookup → reply → done` | **Customer request is unclear** — problem at `triage`, detour via new drill-only agent `clarify` "Clarifying question" (AI model); path `email → triage → clarify → route → lookup → reply → done` |
| inventory | `buyer` "Buyer approves" (existing) | `held` "Reorder held for review" | **Supplier system offline** — retry at `draft`; path `check → monitor → route → forecast → draft → draft → buyer` (then waits) | **Sales spike looks wrong** — problem at `forecast`, escalates: `check → monitor → route → forecast → buyer` (then waits; `draft` skipped, new edge forecast→buyer) |
| factory | new `confirm` "Shift lead confirms" (human) between `schedule` and `booked` | `standby` "Kept under watch" | **Sensor reading looks faulty** — problem at `anomaly`, detour via new drill-only agent `crosscheck` "Second sensor check" (IoT gateway): `sensor → anomaly → crosscheck → [history, roster] → schedule → confirm` (then waits) | **No technician on shift** — problem at `roster`, escalates: `sensor → anomaly → [history, roster] → confirm` (then waits; `schedule` skipped, new edges history→confirm, roster→confirm) |

Branch order per workflow: branch 0 = the path through the decision node
(support: refund path; inventory: low-stock path; factory: its single path, now
via `confirm`). Existing other branches keep their order after it.

All new titles ≤ 26 chars, no digits; coordinates inside 760 × 520, no
overlaps (existing tests extend to new nodes). Decision log texts and drill log
texts have no digits.

## 3. Pure logic (`src/workflow/run.js`)

- `buildRun(workflow, branchIndex, opts?)` gains `opts = { drillId?, decision? }`:
  - `drillId` → use that drill's `path` instead of a branch path.
  - `decision: 'approve' | 'reject'` → if the path ends at `decision.nodeId`,
    append the matching continuation.
  - Returned run gains `retries: Set<stepIndex>` (steps that repeat the
    previous step), `waitStep: number | null` (index of the decision step when
    no decision given), `problemNodeId`, `drillId`.
  - Edges for a retry pair are not created.
- `stateAt(run, tick)` additionally returns `waiting: boolean` (true when the
  run has reached `waitStep` and has no decision) and `retrying: Set<nodeId>`
  (nodes on a retry step currently working). Ticks never advance past
  `waitStep` while waiting: `totalTicks(run)` counts only up to and including
  the wait step's working tick when `waitStep !== null`.
- `visibleNodeIds(workflow, run)` → all nodes except `drillOnly` ones not in
  the run's path.

## 4. Components

### WorkflowGraph / WorkflowList / workflowStyles
- Hidden nodes (not in `visibleNodeIds`) and edges touching them are not
  rendered; when a drill shows them they fade in (`transition-opacity`,
  motion-safe).
- Problem node: a "⚠ Problem" tag (AlertTriangle icon + word) in the tag slot
  above the card (`typeTag` style), token colours only.
- Retry: while working on the retry step the card shows a "↻ Retrying" tag; the
  status line reads "Retrying…".
- Waiting node: pulsing accent ring overlay (motion-safe, existing pattern) and
  two buttons rendered directly below the card on desktop (absolutely
  positioned, inside the canvas bounds) and inside the list item on phones:
  **Approve** (`bg-primary text-primaryInk`) and **Reject**
  (`border-line text-ink`).

### AgentDemo
- State: `drillId: string | null`, `decision: 'approve' | 'reject' | null`.
- `run = buildRun(workflow, branch, { drillId, decision })`.
- Timer stops when `state.waiting`. Pause button disabled while waiting.
- Approve/Reject set `decision` (tick continues from where it is — no reset)
  and push a "your actions" log row.
- Replay, tab switch, view switch, drill select and drill clear reset
  `decision` to null, tick to 0, bump `runId`.
- "Throw a problem at it ▾" menu (workflow view only): button with
  `aria-haspopup="menu"`, `aria-expanded`; menu `role="menu"`, items
  `role="menuitem"`, arrow keys move, Escape closes and returns focus. Each item:
  drill label + hint. Selecting sets `drillId` and restarts.
- Active-drill chip "Drill: <label>" with a clear (✕) button (`aria-label`
  "Stop drill") → back to normal runs.
- Status line (workflow view): "Waiting for your decision" while waiting;
  "Problem: <drill label>" while the problem step is reached and not finished;
  "Retrying…" during retry; otherwise unchanged.
- Carry-over fix: `selectView` returns early when the view is unchanged.

### RunMonitor
- New prop `actions: { status, text }[]` (newest first, session-only, from
  AgentDemo state; cleared on reload). Rendered above the rotating illustrative
  rows with the same row style. Statuses: existing `passed`/`flagged`/`retried`
  plus `approved` (check icon, "Approved by you") and `rejected` (undo icon,
  "Rejected by you"). Words always shown next to icons.

## 5. Reduced motion

Runs render at their final state immediately: a run with a pending decision
shows the path up to the decision step, waiting, with buttons; after a
decision, the full continuation. Drills show the full path with Problem /
Retry tags at once. No pulses, fades or packets.

## 6. Accessibility

- Decision buttons are real buttons with clear names ("Approve the refund",
  "Reject the refund" — from per-workflow `decision.verb` text, e.g. `refund`,
  `reorder`, `technician booking`).
- No automatic focus moves; the status line (`aria-live="polite"`) announces
  "Waiting for your decision", "Problem: …", and the final outcome once each.
- Menu semantics and keyboard behaviour as in §4.
- Tags use icon + word, never colour alone.

## 7. Testing

- `run.test.js`: retry detection; `waitStep`; ticks stop at the wait step;
  approve/reject continuations; escalation edges; drill path selection;
  `visibleNodeIds` hides drill-only nodes on normal runs and shows them in
  their drill.
- `site.test.js`: exactly one `waitsForDecision` human node per workflow equal
  to `decision.nodeId`; branch 0 passes through it; approve/reject
  continuations end at outcomes; exactly 2 drills each with a valid
  `problemNodeId` on its path; every drill path follows edges (retry pairs
  excepted) and either ends at an outcome or at the decision node; drill-only
  nodes appear on no normal branch; no digits in new text; titles ≤ 26; layout
  inside canvas without overlaps.
- Browser checklist (controller): approve + reject in all three scenarios; all
  six drills; Replay / tab / view switch while waiting; reduced motion; phone
  list buttons; contrast of Problem/Retry tags and decision buttons in all
  three themes; no console errors.

## 8. Out of scope

- "Build your agent" (idea 1) — next round.
- Decisions or drills in the "Agent at work" view.
- Persisting decisions beyond the session.
