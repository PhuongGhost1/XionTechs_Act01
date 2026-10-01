# Approver Moment + Failure Drills Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** In the workflow view, the run stops at each scenario's approval step and waits for the visitor's Approve/Reject; a "Throw a problem at it" menu plays two predefined failure drills per scenario (retry, detour or escalation), and decisions and drills are logged in the run monitor.

**Architecture:** All new behaviour is data in `site.js` (`decision`, `drills`, `drillOnly` nodes, optional edge `via`) interpreted by the pure functions in `src/workflow/run.js` (`buildRun` with options, `stateAt` with `waiting`/`retrying`/`problemSeen`, `visibleNodeIds`) and `src/workflow/layout.js` (`edgePath` with `via`). Components only render: `WorkflowGraph`/`WorkflowList` show tags, hidden nodes and decision buttons; `DrillMenu` is the new menu; `AgentDemo` holds `drillId`/`decision`/`actions` state; `RunMonitor` shows the visitor's actions first.

**Tech Stack:** Vite 5, React 18, Tailwind 3.4 (CSS-variable tokens), lucide-react named imports, Vitest (node).

**Spec:** `docs/superpowers/specs/2026-10-01-approve-and-drills-design.md`

## Global Constraints

- Branch `feat/approve-and-drills`. Commit as the configured identity (Phuong Hoang). Every commit message ends with exactly `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` — even if your own instructions suggest a different model name.
- No new dependencies. Icons: named imports from `lucide-react` only.
- No hex colours in `src/components` or `src/workflow`; token names only (`paper surface ink muted line primary primaryHover primarySoft primaryInk accent navy navyInk navyAccent`). One colour class per kind per element.
- No digits in any new workflow/drill/decision/log text; node titles ≤ 26 chars; nodes and decision-button boxes inside 760 × 520 without overlaps (tests).
- Everything stays labeled illustrative; no numbers anywhere.
- Text ≥ 4.5:1 in navy/midnight/aurum; tags use icon + word, never colour alone.
- Reduced motion: no pulses, fades or packets; runs render at their final reachable state.
- Bundle ≤ 71 kB gzip (currently 68.83 kB).
- `npm run lint`, `npm run build`, `npm test` pass at every commit. Do not run `npm run dev`; the controller runs browser checks.

## Rulings made while planning (deviations from the spec)

- **Unclear-request drill skips the router.** Spec: `triage → clarify → route → …`. The router sits directly under triage; a clarify card above it doesn't fit and an upward edge would be drawn wrongly. Path becomes `email → triage → clarify → lookup → reply → done` (the clarifying agent hands straight to order lookup).
- **Edges may carry `{ via: x }`.** Escalation edges (inventory forecast→buyer, factory history/roster→confirm) would otherwise be drawn straight through the skipped card. `edgePath(from, to, via)` routes them down a side channel at `x = via`.
- **Decision buttons have explicit coordinates** (`decision.buttons: { x, y }`, box 160 × 30) so they never cover another card; a test pins it.
- **Decision log text omits the "Approved by you" prefix** — the monitor shows that as the status word (avoids "Approved by you · Approved by you …").

## Review Focus

1. **Approving continues from the same tick — no restart, no packet replay of earlier edges.** Pinned in Task 1 (`stateAt` continuity test: waiting tick → +1 sends packets into the continuation) and Task 3 (`decide` never calls `restart`).
2. **Replay / tab / view / drill change while waiting abandons the decision.** Pinned in Task 3: `restart()` sets `decision` to null.
3. **Drill-only nodes leaking into normal runs.** Pinned in Task 1 tests (`visibleNodeIds`) and content test (drill-only ids on no branch).
4. **Duplicate React keys from a retry step in the list.** Pinned in Task 2: the list skips retry steps (`run.retries`).
5. **Decision buttons overlapping cards or edges' labels.** Pinned in Task 1 content test (buttons box vs every node box, inside canvas).

---

## File map

| Path | Responsibility |
|---|---|
| `src/workflow/layout.js` (+ test) | `edgePath(from, to, via?)`, `DECISION_SIZE`, `decisionBox(decision)` (T1) |
| `src/workflow/run.js` (+ test) | `buildRun(wf, i, opts)`, `totalTicks`, `stateAt` additions, `visibleNodeIds` (T1) |
| `src/content/site.js` (+ `site.test.js`) | workflows: new nodes, edges, branches, `decision`, `drills` (T1) |
| `src/components/workflowStyles.js` | `problemTag`, `retryTag` helpers (T2) |
| `src/components/DecisionButtons.jsx` | Approve / Reject pair (T2) |
| `src/components/WorkflowGraph.jsx` | hidden nodes, via edges, tags, decision buttons, fade-in (T2) |
| `src/components/WorkflowList.jsx` | run-driven chosen branch, linear drill/single-branch list, tags, buttons (T2) |
| `src/index.css` | `wf-fade-in` keyframes (+ reduced-motion override) (T2) |
| `src/components/DrillMenu.jsx` | "Throw a problem at it" menu (T3) |
| `src/components/RunMonitor.jsx` | `actions` prop, approved/rejected statuses (T3) |
| `src/components/AgentDemo.jsx` | state, timer stop, decide, drills, status line, selectView no-op (T3) |
| `CLAUDE.md`, `PROMPT_LOG.md`, `content/TODO.md` | docs (T3) |

---

### Task 1: Data and pure logic

**Files:**
- Modify: `src/workflow/layout.js`, `src/workflow/layout.test.js`, `src/workflow/run.js`, `src/workflow/run.test.js`, `src/content/site.js`, `src/content/site.test.js`

**Interfaces:**
- Produces (layout.js): `edgePath(from, to, via?) → string`; `DECISION_SIZE = [160, 30]`; `decisionBox(decision) → { x, y, w, h }`.
- Produces (run.js):
  - `buildRun(workflow, branchIndex, opts = {}) → { steps: string[][], edges: {from,to,step}[], retries: Set<number>, waitStep: number|null, branchLabel, drillId: string|null, problemNodeId: string|null, decision: 'approve'|'reject'|null }` (`opts = { drillId?, decision? }`)
  - `totalTicks(run)` — `2 * waitStep` when `waitStep !== null`, else `2 * (steps.length - 1) + 1`
  - `stateAt(run, tick)` adds `waiting: boolean`, `retrying: Set<nodeId>`, `problemSeen: boolean`; ticks beyond `totalTicks` clamp when waiting.
  - `visibleNodeIds(workflow, run) → Set<nodeId>`
- Produces (site.js): per workflow `decision = { nodeId, verb, approve: string[], reject: string[], log: { approve, reject }, buttons: { x, y } }`, `drills = [{ id, label, hint, problemNodeId, path, log: { status, text } }]` (exactly 2), node flags `waitsForDecision`, `drillOnly`, edge 3rd element `{ via }`.

- [ ] **Step 1: Failing layout tests**

Append to `src/workflow/layout.test.js` inside its `describe`:

```js
  it('routes an edge down a side channel when given a via x', () => {
    const from = { type: 'agent', x: 560, y: 270 } // bottom 297
    const to = { type: 'human', x: 560, y: 420 } // top 393
    expect(edgePath(from, to, 700)).toBe('M 560 297 V 309 H 700 V 381 H 560 V 393')
  })

  it('sizes the decision button box around its centre', () => {
    expect(DECISION_SIZE).toEqual([160, 30])
    expect(decisionBox({ buttons: { x: 380, y: 345 } })).toEqual({ x: 300, y: 330, w: 160, h: 30 })
  })
```

and add `DECISION_SIZE, decisionBox` to the test's import from `./layout`.

Run: `npx vitest run src/workflow/layout.test.js` — expected FAIL.

- [ ] **Step 2: Implement in `src/workflow/layout.js`**

Replace `edgePath` with:

```js
// `via` routes the edge down a vertical side channel at that x (used by escalation edges that
// skip a card, so the line doesn't run through it).
export function edgePath(from, to, via) {
  const y1 = from.y + NODE_SIZE[from.type][1] / 2
  const y2 = to.y - NODE_SIZE[to.type][1] / 2
  if (via !== undefined) return `M ${from.x} ${y1} V ${y1 + 12} H ${via} V ${y2 - 12} H ${to.x} V ${y2}`
  const mid = (y1 + y2) / 2
  return `M ${from.x} ${y1} V ${mid} H ${to.x} V ${y2}`
}
```

and add:

```js
// Approve / Reject buttons shown on the canvas while a run waits for the visitor.
export const DECISION_SIZE = [160, 30]

export function decisionBox(decision) {
  const [w, h] = DECISION_SIZE
  return { x: decision.buttons.x - w / 2, y: decision.buttons.y - h / 2, w, h }
}
```

Run: `npx vitest run src/workflow/layout.test.js` — PASS.

- [ ] **Step 3: Failing run-logic tests**

Append to `src/workflow/run.test.js` (add `visibleNodeIds` to the import from `./run`):

```js
const decided = {
  nodes: [
    { id: 't', type: 'trigger' }, { id: 'a', type: 'agent' }, { id: 'h', type: 'human', waitsForDecision: true },
    { id: 'ok', type: 'outcome' }, { id: 'no', type: 'outcome' }, { id: 'x', type: 'agent', drillOnly: true },
  ],
  branches: [{ label: 'Main', path: ['t', 'a', 'h'] }],
  decision: { nodeId: 'h', approve: ['ok'], reject: ['no'] },
  drills: [
    { id: 'retry', label: 'Retry drill', problemNodeId: 'a', path: ['t', 'a', 'a', 'h'] },
    { id: 'detour', label: 'Detour drill', problemNodeId: 'a', path: ['t', 'a', 'x', 'h'] },
  ],
}

describe('decisions', () => {
  it('stops at the decision node until a decision is given', () => {
    const run = buildRun(decided, 0)
    expect(run.waitStep).toBe(2)
    expect(totalTicks(run)).toBe(4)
    const s = stateAt(run, 4)
    expect(s.waiting).toBe(true)
    expect([...s.working]).toEqual(['h'])
    expect(s.done).toBe(false)
    expect(stateAt(run, 9).waiting).toBe(true) // clamps, never runs past the decision
    expect([...stateAt(run, 9).working]).toEqual(['h'])
  })

  it('continues from the same tick after approve or reject', () => {
    const ok = buildRun(decided, 0, { decision: 'approve' })
    expect(ok.waitStep).toBe(null)
    expect(ok.steps.flat()).toEqual(['t', 'a', 'h', 'ok'])
    expect([...stateAt(ok, 5).travelling]).toEqual(['h>ok'])
    expect(stateAt(ok, totalTicks(ok)).done).toBe(true)
    const no = buildRun(decided, 0, { decision: 'reject' })
    expect(no.steps.flat()).toEqual(['t', 'a', 'h', 'no'])
    expect(no.decision).toBe('reject')
  })
})

describe('drills', () => {
  it('uses the drill path, label and problem node', () => {
    const run = buildRun(decided, 0, { drillId: 'detour' })
    expect(run.drillId).toBe('detour')
    expect(run.branchLabel).toBe('Detour drill')
    expect(run.problemNodeId).toBe('a')
    expect(run.steps.flat()).toEqual(['t', 'a', 'x', 'h'])
  })

  it('treats a repeated step as a retry with no edge into it', () => {
    const run = buildRun(decided, 0, { drillId: 'retry' })
    expect([...run.retries]).toEqual([2])
    expect(run.edges.map(edgeKey)).toEqual(['t>a', 'a>h'])
    expect(run.edges[1].step).toBe(3)
    expect([...stateAt(run, 4).retrying]).toEqual(['a'])
    expect([...stateAt(run, 4).working]).toEqual(['a'])
    expect(stateAt(run, 3).retrying.size).toBe(0)
  })

  it('reports when the problem step has been reached', () => {
    const run = buildRun(decided, 0, { drillId: 'detour' })
    expect(stateAt(run, 1).problemSeen).toBe(false)
    expect(stateAt(run, 2).problemSeen).toBe(true)
    expect(stateAt(buildRun(decided, 0), 6).problemSeen).toBe(false)
  })

  it('hides drill-only nodes unless the run passes through them', () => {
    expect(visibleNodeIds(decided, buildRun(decided, 0)).has('x')).toBe(false)
    expect(visibleNodeIds(decided, buildRun(decided, 0, { drillId: 'detour' })).has('x')).toBe(true)
    expect(visibleNodeIds(decided, buildRun(decided, 0)).has('ok')).toBe(true)
  })
})
```

Run: `npx vitest run src/workflow/run.test.js` — expected FAIL.

- [ ] **Step 4: Implement in `src/workflow/run.js`**

Replace `buildRun` and `totalTicks` and `stateAt` with:

```js
// opts.drillId plays that drill's path instead of a branch. A path that ends at the workflow's
// decision node waits there (waitStep) until opts.decision appends the approve/reject
// continuation. A step identical to the previous one is a retry: no edge, the node works again.
export function buildRun(workflow, branchIndex, opts = {}) {
  const drill = opts.drillId ? workflow.drills?.find((d) => d.id === opts.drillId) ?? null : null
  const source = drill ?? workflow.branches[branchIndex]
  let steps = source.path.map(asStep)
  const dec = workflow.decision
  let waitStep = null
  const last = steps[steps.length - 1]
  if (dec && last.length === 1 && last[0] === dec.nodeId) {
    if (opts.decision) steps = [...steps, ...dec[opts.decision].map(asStep)]
    else waitStep = steps.length - 1
  }
  const retries = new Set()
  const edges = []
  for (let i = 1; i < steps.length; i++) {
    const prev = steps[i - 1]
    const cur = steps[i]
    if (prev.length === 1 && cur.length === 1 && prev[0] === cur[0]) {
      retries.add(i)
      continue
    }
    for (const from of prev) {
      for (const to of cur) edges.push({ from, to, step: i })
    }
  }
  return {
    steps,
    edges,
    retries,
    waitStep,
    branchLabel: source.label,
    drillId: drill?.id ?? null,
    problemNodeId: drill?.problemNodeId ?? null,
    decision: waitStep === null && opts.decision ? opts.decision : null,
  }
}

export function totalTicks(run) {
  if (run.waitStep !== null && run.waitStep !== undefined) return 2 * run.waitStep
  return 2 * (run.steps.length - 1) + 1
}

export function stateAt(run, rawTick) {
  const waitingRun = run.waitStep !== null && run.waitStep !== undefined
  const tick = waitingRun ? Math.min(rawTick, totalTicks(run)) : rawTick
  const active = new Set()
  const working = new Set()
  const travelling = new Set()
  const lit = new Set()
  const retrying = new Set()

  run.steps.forEach((step, i) => {
    const workTick = i === 0 ? 0 : 2 * i
    for (const id of step) {
      if (tick === workTick) {
        working.add(id)
        if (run.retries?.has(i)) retrying.add(id)
      }
      if (tick > workTick) active.add(id)
    }
  })
  // A node working again on a retry step is not also "active".
  for (const id of working) active.delete(id)
  for (const edge of run.edges) {
    if (tick === 2 * edge.step - 1) travelling.add(edgeKey(edge))
    if (tick >= 2 * edge.step) lit.add(edgeKey(edge))
  }

  let problemSeen = false
  if (run.problemNodeId) {
    const first = run.steps.findIndex((s) => s.includes(run.problemNodeId))
    problemSeen = first >= 0 && tick >= (first === 0 ? 0 : 2 * first)
  }

  const waiting = waitingRun && tick >= totalTicks(run)
  return { active, working, travelling, lit, retrying, problemSeen, waiting, done: !waitingRun && tick >= totalTicks(run) }
}

// Drill-only nodes are drawn only when the current run passes through them.
export function visibleNodeIds(workflow, run) {
  const onRun = new Set(run.steps.flat())
  return new Set(workflow.nodes.filter((n) => !n.drillOnly || onRun.has(n.id)).map((n) => n.id))
}
```

Update the header comment's last sentence to: `The run is done at totalTicks(run), or waits there when it has a pending decision.`

Run: `npx vitest run src/workflow/run.test.js` — PASS (existing tests included). Check by hand: retry fixture steps `t,a,a,h` → retries {2}; edges `t>a` (step 1), `a>h` (step 3); tick 4 = work tick of step 2 → working {a}, retrying {a}.

- [ ] **Step 5: Failing content tests**

In `src/content/site.test.js`, add `decisionBox` to the import from `'../workflow/layout'`, then:

(a) Replace the body of `it('starts every branch at the single trigger and ends at an outcome', …)` with:

```js
    it('starts every branch at the single trigger and ends at an outcome or the decision node', () => {
      for (const wf of site.workflows) {
        const nodes = byId(wf)
        const triggers = wf.nodes.filter((n) => n.type === 'trigger')
        expect(triggers.length).toBe(1)
        for (const b of wf.branches) {
          const ids = flat(b.path)
          expect(ids[0]).toBe(triggers[0].id)
          const end = ids[ids.length - 1]
          expect(nodes[end].type === 'outcome' || end === wf.decision.nodeId, `${wf.id}: ${b.label}`).toBe(true)
        }
      }
    })
```

(b) Append inside `describe('workflows', …)`:

```js
    it('has exactly one approval step that waits for a decision, reached by branch zero', () => {
      for (const wf of site.workflows) {
        const nodes = byId(wf)
        const waits = wf.nodes.filter((n) => n.waitsForDecision)
        expect(waits.map((n) => n.id), wf.id).toEqual([wf.decision.nodeId])
        expect(waits[0].type).toBe('human')
        expect(flat(wf.branches[0].path).at(-1)).toBe(wf.decision.nodeId)
        for (const choice of ['approve', 'reject']) {
          const cont = wf.decision[choice]
          expect(nodes[cont.at(-1)].type, `${wf.id} ${choice}`).toBe('outcome')
          const run = buildRun(wf, 0, { decision: choice })
          const edgeSet = new Set(wf.edges.map(([a, b]) => `${a}>${b}`))
          for (const e of run.edges) expect(edgeSet.has(`${e.from}>${e.to}`), `${wf.id} ${choice} ${e.from}>${e.to}`).toBe(true)
        }
        expect(wf.decision.verb.length).toBeGreaterThan(0)
      }
    })

    it('has exactly two drills that follow edges and name a problem step on their path', () => {
      for (const wf of site.workflows) {
        const nodes = byId(wf)
        expect(wf.drills.length, wf.id).toBe(2)
        const edgeSet = new Set(wf.edges.map(([a, b]) => `${a}>${b}`))
        for (const d of wf.drills) {
          const ids = flat(d.path)
          expect(ids).toContain(d.problemNodeId)
          const run = buildRun(wf, 0, { drillId: d.id })
          for (const e of run.edges) expect(edgeSet.has(`${e.from}>${e.to}`), `${wf.id}/${d.id} ${e.from}>${e.to}`).toBe(true)
          const end = ids.at(-1)
          expect(nodes[end].type === 'outcome' || end === wf.decision.nodeId, `${wf.id}/${d.id} end`).toBe(true)
          expect(['passed', 'flagged', 'retried']).toContain(d.log.status)
        }
      }
    })

    it('keeps drill-only steps off every normal branch', () => {
      for (const wf of site.workflows) {
        const drillOnly = wf.nodes.filter((n) => n.drillOnly).map((n) => n.id)
        for (const b of wf.branches) for (const id of flat(b.path)) expect(drillOnly, `${wf.id}: ${id}`).not.toContain(id)
      }
    })

    it('places the decision buttons inside the canvas without covering a card', () => {
      for (const wf of site.workflows) {
        const d = decisionBox(wf.decision)
        expect(d.x >= 0 && d.y >= 0 && d.x + d.w <= VIEW.w && d.y + d.h <= VIEW.h, wf.id).toBe(true)
        for (const n of wf.nodes) {
          const b = nodeBox(n)
          const overlap = d.x < b.x + b.w && b.x < d.x + d.w && d.y < b.y + b.h && b.y < d.y + d.h
          expect(overlap, `${wf.id}: buttons over ${n.id}`).toBe(false)
        }
      }
    })

    it('contains no digits in decision and drill text', () => {
      for (const wf of site.workflows) {
        const texts = [wf.decision.verb, wf.decision.log.approve, wf.decision.log.reject, ...wf.drills.flatMap((d) => [d.label, d.hint, d.log.text])]
        for (const t of texts) expect(t, `${wf.id}: ${t}`).not.toMatch(/\d/)
      }
    })
```

Run: `npm test` — expected FAIL (no `decision` / `drills` yet).

- [ ] **Step 6: Update `workflows` in `src/content/site.js`**

Support — add nodes (keep existing ones), replace `edges` and `branches`, add `decision` and `drills`; set `waitsForDecision: true` on the existing `approve` node:

```js
      { id: 'clarify', type: 'agent', title: 'Clarifying question', capability: 'AI model', x: 170, y: 195, drillOnly: true, desc: 'Asks the customer one short question before going any further.' },
      { id: 'sentBack', type: 'outcome', title: 'Sent back with a note', x: 640, y: 440, desc: 'The refund is not made; the customer gets a note and a person follows up.' },
```

```js
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
```

Inventory — add node, set `waitsForDecision: true` on `buyer`, replace `edges`, `branches`, add `decision`, `drills`:

```js
      { id: 'held', type: 'outcome', title: 'Reorder held for review', x: 330, y: 490, desc: 'Nothing is ordered; the draft waits for the buyer to look again.' },
```

```js
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
```

Factory — replace the whole `nodes`, `edges`, `branches` and add `decision`, `drills`:

```js
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
```

Keep each workflow's `id`, `label`, `icon`, `illustrative` unchanged. Update the comment above `workflows` to mention: `decision` (the step that waits for the visitor), `drills` (two predefined problems), `drillOnly` nodes, and edge `{ via }` side channels.

- [ ] **Step 7: Run all tests, lint, build; commit**

Run: `npm test && npm run lint && npm run build` — all pass. If a layout/overlap test fails, report the exact pair and stop (do not loosen tests; the controller decides coordinates).

```bash
git add src/workflow src/content/site.js src/content/site.test.js
git commit -m "feat: decision and drill data with pure run logic for waits, retries and escalations

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Rendering — graph, list, tags, decision buttons

**Files:**
- Create: `src/components/DecisionButtons.jsx`
- Modify: `src/components/workflowStyles.js`, `src/components/WorkflowGraph.jsx`, `src/components/WorkflowList.jsx`, `src/index.css`

**Interfaces:**
- Consumes: Task 1 (`edgePath(from, to, via)`, `decisionBox`, `visibleNodeIds`, run fields `retries`, `waitStep`, `drillId`, `problemNodeId`; state fields `waiting`, `retrying`, `problemSeen`).
- Produces:
  - `<DecisionButtons verb onDecide size="sm"|"md" />` — two buttons; `onDecide('approve'|'reject')`.
  - `WorkflowGraph` new props: `onDecide` (all others unchanged).
  - `WorkflowList` new prop: `onDecide`.

- [ ] **Step 1: `src/components/DecisionButtons.jsx`**

```jsx
// Approve / Reject pair shown while a run waits for the visitor's decision.
export default function DecisionButtons({ verb, onDecide, size = 'md' }) {
  const pad = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => onDecide('approve')}
        aria-label={`Approve the ${verb}`}
        className={`flex-1 rounded-full bg-primary font-medium text-primaryInk transition hover:bg-primaryHover ${pad}`}
      >
        Approve
      </button>
      <button
        type="button"
        onClick={() => onDecide('reject')}
        aria-label={`Reject the ${verb}`}
        className={`flex-1 rounded-full border border-line bg-paper font-medium text-ink transition hover:border-primary ${pad}`}
      >
        Reject
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Tag helper in `src/components/workflowStyles.js`**

Add:

```js
import { AlertTriangle, RotateCw } from 'lucide-react'

// Problem / retry tag for a node in the current run, or null. Icon + word, never colour alone.
export function runTag(nodeId, run, state) {
  if (state.retrying.has(nodeId)) return { Icon: RotateCw, word: 'Retrying' }
  if (run.problemNodeId === nodeId && state.problemSeen) return { Icon: AlertTriangle, word: 'Problem' }
  return null
}
```

(Merge the import with the existing lucide import line.)

- [ ] **Step 3: `WorkflowGraph.jsx`**

- Imports: add `decisionBox` from `../workflow/layout`, `visibleNodeIds` from `../workflow/run`, `runTag` from `./workflowStyles`, and `DecisionButtons` from `./DecisionButtons`.
- Signature: `export default function WorkflowGraph({ workflow, run, state, selectedId, onSelect, reduced, onDecide })`.
- At the top of the component add:

```jsx
  const visible = visibleNodeIds(workflow, run)
  const via = Object.fromEntries(workflow.edges.map(([a, b, o]) => [`${a}>${b}`, o?.via]))
```

- Edges: iterate `workflow.edges.filter(([a, b]) => visible.has(a) && visible.has(b)).map(([from, to]) => …)` and use `d={edgePath(nodes[from], nodes[to], via[`${from}>${to}`])}`.
- Packets: `d={edgePath(nodes[e.from], nodes[e.to], via[edgeKey(e)])}`.
- Nodes: iterate `workflow.nodes.filter((n) => visible.has(n.id))`; add `node.drillOnly ? 'wf-fade-in' : ''` to the button className; inside the button, after the type tag, render:

```jsx
            {(() => {
              const tag = runTag(node.id, run, state)
              if (!tag) return null
              const TagIcon = tag.Icon
              return (
                <span className="absolute -top-2.5 right-3 inline-flex items-center gap-1 rounded-full border border-accent bg-paper px-2 text-[10px] font-medium uppercase tracking-wide text-ink">
                  <TagIcon className="h-3 w-3 text-accent" strokeWidth={2} />
                  {tag.word}
                </span>
              )
            })()}
```

- After the nodes map, render the decision buttons while waiting:

```jsx
      {state.waiting && workflow.decision && (() => {
        const d = decisionBox(workflow.decision)
        return (
          <div className="absolute" style={{ left: pct(d.x, VIEW.w), top: pct(d.y, VIEW.h), width: pct(d.w, VIEW.w), height: pct(d.h, VIEW.h) }}>
            <DecisionButtons verb={workflow.decision.verb} onDecide={onDecide} size="sm" />
          </div>
        )
      })()}
```

- [ ] **Step 4: `WorkflowList.jsx`**

Replace the file with:

```jsx
import { splitBranches } from '../workflow/run'
import DecisionButtons from './DecisionButtons'
import { isWorking, nodeClasses, nodeStatus, runTag, typeIcon } from './workflowStyles'

function Item({ node, run, state, workflow, onDecide }) {
  const status = nodeStatus(node.id, run, state)
  const Icon = typeIcon[node.type]
  const outcomeActive = status === 'active' && node.type === 'outcome'
  const tag = runTag(node.id, run, state)
  const waitingHere = state.waiting && workflow.decision?.nodeId === node.id
  return (
    <li className={`relative rounded-xl p-3 ${nodeClasses(node, status, false)}`}>
      {isWorking(status) && <span aria-hidden="true" className="pointer-events-none absolute -inset-1 rounded-[inherit] ring-2 ring-accent/50 motion-safe:animate-pulse" />}
      <div className="flex flex-wrap items-center gap-2">
        <Icon className={`h-4 w-4 shrink-0 ${outcomeActive ? '' : 'text-accent'}`} strokeWidth={1.75} />
        <span className="text-sm font-medium">{node.title}</span>
        {node.capability && (
          <span className="rounded border border-dashed border-line px-1.5 text-[11px] text-muted">{node.capability}</span>
        )}
        {tag && (
          <span className="inline-flex items-center gap-1 rounded-full border border-accent px-2 text-[11px] font-medium text-ink">
            <tag.Icon className="h-3 w-3 text-accent" strokeWidth={2} />
            {tag.word}
          </span>
        )}
      </div>
      <p className={`mt-1 text-sm ${outcomeActive ? '' : 'text-muted'}`}>{node.desc}</p>
      {waitingHere && (
        <div className="mt-3">
          <p className="mb-2 text-sm font-medium text-ink">Waiting for your decision</p>
          <DecisionButtons verb={workflow.decision.verb} onDecide={onDecide} />
        </div>
      )}
    </li>
  )
}

// Renders steps as list items. Routers are represented by the "routes to one of" label, and a
// retry step repeats the previous node, so both are skipped.
function Steps({ steps, startIndex = 0, nodes, ...rest }) {
  return steps.flatMap((step, i) => {
    if (rest.run.retries?.has(startIndex + i)) return []
    return step.filter((id) => nodes[id].type !== 'router').map((id) => <Item key={id} node={nodes[id]} {...rest} />)
  })
}

// Phone layout and, on desktop, the screen-reader text alternative of the graph.
export default function WorkflowList({ workflow, run, state, className = '', onDecide }) {
  const nodes = Object.fromEntries(workflow.nodes.map((n) => [n.id, n]))
  const shared = { nodes, run, state, workflow, onDecide }

  // Drills and single-branch workflows read top to bottom as the run's own steps.
  if (run.drillId || workflow.branches.length === 1) {
    return (
      <div className={className}>
        <ol className="space-y-3 border-l-2 border-line pl-4">
          <Steps steps={run.steps} {...shared} />
        </ol>
      </div>
    )
  }

  const { prefix, branches, suffix } = splitBranches(workflow)
  return (
    <div className={className}>
      <ol className="space-y-3 border-l-2 border-line pl-4">
        <Steps steps={prefix} {...shared} />
      </ol>
      <div className="mt-3 border-l-2 border-line pl-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">AI routing — routes to one of:</p>
        <div className="mt-2 grid gap-3 min-[480px]:grid-cols-2">
          {branches.map((b) => {
            const chosen = b.label === run.branchLabel
            // The chosen branch shows the run's own steps, including any decision continuation.
            const steps = chosen ? run.steps.slice(prefix.length) : b.steps
            return (
              <div key={b.label} className={`rounded-xl border p-2 ${chosen ? 'border-accent' : 'border-dashed border-line'}`}>
                <p className="mb-2 text-xs font-medium text-ink">
                  {b.label}
                  {chosen && <span className="ml-2 text-muted">(this run)</span>}
                </p>
                <ol className="space-y-2">
                  <Steps steps={steps} startIndex={chosen ? prefix.length : 0} {...shared} />
                </ol>
              </div>
            )
          })}
        </div>
      </div>
      {suffix.length > 0 && (
        <ol className="mt-3 space-y-3 border-l-2 border-line pl-4">
          <Steps steps={suffix} {...shared} />
        </ol>
      )}
    </div>
  )
}
```

Note: `<tag.Icon …/>` is a capitalised member expression and is valid JSX.

- [ ] **Step 5: Fade-in CSS in `src/index.css`**

Before the `@media (prefers-reduced-motion: reduce)` block add:

```css
/* Drill-only workflow steps fade in when a drill reveals them */
@keyframes wf-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
.wf-fade-in {
  animation: wf-fade-in 400ms ease both;
}
```

and inside the reduced-motion block add `.wf-fade-in { animation: none; }`.

- [ ] **Step 6: Lint, build, test, commit**

`AgentDemo` passes no `onDecide` yet; buttons only render when `state.waiting`, which can now happen on branch 0 — that is wired in Task 3. Lint/build/test must pass.

Run: `npm run lint && npm run build && npm test` — all pass; grep `#[0-9a-fA-F]{3,6}\b` in `src/components` — no output.

```bash
git add src/components/DecisionButtons.jsx src/components/workflowStyles.js src/components/WorkflowGraph.jsx src/components/WorkflowList.jsx src/index.css
git commit -m "feat: render waiting decisions, problem and retry tags, drill-only steps

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: AgentDemo wiring, drill menu, run monitor actions, docs

**Files:**
- Create: `src/components/DrillMenu.jsx`
- Modify: `src/components/AgentDemo.jsx`, `src/components/RunMonitor.jsx`, `CLAUDE.md`, `PROMPT_LOG.md`

**Interfaces:**
- Consumes: Tasks 1–2.
- Produces: `<DrillMenu drills onSelect />`; `RunMonitor` prop `actions: { key, status, text }[]`.

- [ ] **Step 1: `src/components/DrillMenu.jsx`**

```jsx
import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, ChevronDown } from 'lucide-react'

// "Throw a problem at it" menu: lists the current workflow's drills.
export default function DrillMenu({ drills, onSelect }) {
  const [open, setOpen] = useState(false)
  const buttonRef = useRef(null)
  const itemRefs = useRef([])

  useEffect(() => {
    if (open) itemRefs.current[0]?.focus()
  }, [open])

  function close() {
    setOpen(false)
    buttonRef.current?.focus()
  }

  function onMenuKey(e) {
    const i = itemRefs.current.indexOf(document.activeElement)
    if (e.key === 'Escape') {
      e.preventDefault()
      close()
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      const n = drills.length
      const next = e.key === 'ArrowDown' ? (i + 1) % n : (i - 1 + n) % n
      itemRefs.current[next]?.focus()
    } else if (e.key === 'Tab') {
      setOpen(false)
    }
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink/80 transition hover:border-primary hover:text-primary"
      >
        <AlertTriangle className="h-3.5 w-3.5 text-accent" strokeWidth={2} />
        Throw a problem at it
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div role="menu" aria-label="Problems to throw at the agent" onKeyDown={onMenuKey} className="absolute right-0 z-20 mt-2 w-64 rounded-xl border border-line bg-surface p-1 shadow-lg">
          {drills.map((d, i) => (
            <button
              key={d.id}
              ref={(el) => {
                itemRefs.current[i] = el
              }}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false)
                onSelect(d.id)
              }}
              className="block w-full rounded-lg px-3 py-2 text-left hover:bg-primarySoft focus-visible:bg-primarySoft focus-visible:outline-none"
            >
              <span className="block text-sm font-medium text-ink">{d.label}</span>
              <span className="block text-xs text-muted">{d.hint}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: `RunMonitor.jsx` — visitor actions first**

- Change the lucide import to `import { CheckCircle2, Flag, RotateCw, Undo2 } from 'lucide-react'` and add to `STATUS`:

```js
  approved: { Icon: CheckCircle2, word: 'Approved by you' },
  rejected: { Icon: Undo2, word: 'Rejected by you' },
```

- Signature: `export default function RunMonitor({ reduced, inView, playing, actions = [] })`.
- Replace `{rows.map((r) => { … })}` with a render over `[...actions.map((a) => ({ ...a, mine: true })), ...rows]`, keyed by `r.key ?? r.text`, and for `r.mine` rows add the word `· this session` after the text in `text-muted` (so visitors can tell their own actions from the illustrative log):

```jsx
        {[...actions.map((a) => ({ ...a, mine: true })), ...rows].map((r) => {
          const { Icon, word } = STATUS[r.status]
          return (
            <li key={r.key ?? r.text} className="monitor-row flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-line bg-paper px-3 py-2 text-sm">
              <span className="inline-flex items-center gap-1.5 font-medium text-ink">
                <Icon className="h-4 w-4 text-accent" strokeWidth={1.75} />
                {word}
              </span>
              <span className="text-muted">
                {r.text}
                {r.mine && ' · this session'}
              </span>
            </li>
          )
        })}
```

- [ ] **Step 3: `AgentDemo.jsx` — state and derived values**

- Imports: add `X` to the lucide import; add `import DrillMenu from './DrillMenu'`.
- After `const [runId, setRunId] = useState(0)` add:

```jsx
  const [drillId, setDrillId] = useState(null)
  const [decision, setDecision] = useState(null)
  const [actions, setActions] = useState([])
  const loggedRunRef = useRef(-1)
```

- Change the run memo to `const run = useMemo(() => buildRun(workflow, branch, { drillId, decision }), [workflow, branch, drillId, decision])`.
- After `const done = …` add:

```jsx
  const drill = drillId ? workflow.drills.find((d) => d.id === drillId) : null
  const waiting = view === 'workflow' && state.waiting

  function pushAction(status, text) {
    setActions((list) => [{ key: `${Date.now()}-${list.length}`, status, text }, ...list].slice(0, 6))
  }

  // Log a drill once per run, when the agent has handled the problem (run done or waiting).
  useEffect(() => {
    if (!drill || view !== 'workflow' || loggedRunRef.current === runId) return
    if (state.done || state.waiting) {
      loggedRunRef.current = runId
      pushAction(drill.log.status, drill.log.text)
    }
  }, [drill, view, runId, state.done, state.waiting])
```

(`pushAction` is a plain function; if react-hooks lint asks for it in deps, wrap it in `useCallback` with `[]` deps — `setActions` is stable.)

- [ ] **Step 4: Handlers**

Replace `restart`, `selectTab`, `replay`, `selectView` with:

```jsx
  function restart() {
    setTick(0)
    setPlaying(true)
    setDecision(null)
    setRunId((r) => r + 1)
  }

  function selectTab(i) {
    setActive(i)
    setBranch(0)
    setSelectedId(null)
    setDrillId(null)
    restart()
  }

  function replay() {
    if (view === 'workflow' && !drillId) setBranch((b) => nextBranchIndex(workflow, b))
    restart()
  }

  function selectView(v) {
    if (v === view) return
    setView(v)
    restart()
  }

  function selectDrill(id) {
    setDrillId(id)
    restart()
  }

  function clearDrill() {
    setDrillId(null)
    setBranch(0)
    restart()
  }

  // Continue from the current tick — never restart — so the run picks up at the decision step.
  function decide(choice) {
    setDecision(choice)
    setPlaying(true)
    pushAction(choice === 'approve' ? 'approved' : 'rejected', workflow.decision.log[choice])
  }
```

- [ ] **Step 5: Controls row**

In the controls `div` (the one containing the radiogroup and Pause/Replay):
- On the Pause/Play button add `disabled={waiting}` and append ` disabled:opacity-40` to its className via `className={`${btn} disabled:opacity-40`}`.
- After the workflow-view Replay button, add (workflow view only):

```jsx
            {view === 'workflow' && <DrillMenu key={workflow.id} drills={workflow.drills} onSelect={selectDrill} />}
```

- Directly under the controls row (still inside the header area, before `<div className="mt-6">`), add the active-drill chip:

```jsx
        {view === 'workflow' && drill && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-accent px-3 py-1 text-xs font-medium text-ink">
            Drill: {drill.label}
            <button type="button" onClick={clearDrill} aria-label="Stop drill" className="rounded-full p-0.5 text-ink/70 hover:text-primary">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
```

- [ ] **Step 6: Workflow body and status line**

- Pass `onDecide={decide}` to both `<WorkflowGraph …/>` and `<WorkflowList …/>`.
- Replace the workflow status `<p … aria-live="polite">` content with:

```jsx
                {state.waiting
                  ? 'Waiting for your decision'
                  : state.retrying.size > 0
                    ? 'Retrying…'
                    : drill && state.problemSeen && !state.done
                      ? `Problem: ${drill.label}`
                      : state.done
                        ? drill
                          ? `Drill complete · ${drill.label}`
                          : run.decision
                            ? `Run complete · ${run.decision === 'approve' ? 'approved' : 'rejected'} by you`
                            : `Run complete · took the “${run.branchLabel}” path`
                        : drill
                          ? `Running · ${drill.label}`
                          : `Running · ${run.branchLabel} path`}
```

- Pass `actions={actions}` to `<RunMonitor …/>`.

- [ ] **Step 7: Behaviour check (reason it through in the report)**

- Branch 0 of every workflow ends at its decision node → first run waits; timer stops because `tick >= total` (`total = 2 * waitStep`).
- `decide` changes the run (continuation appended, `waitStep` null) → `total` grows → the timer resumes from the same tick; no `runId` bump, so the graph doesn't remount.
- `restart` clears `decision`; tab, Replay, view, drill select/clear all go through it.
- Under reduced motion `shownTick = total`: a waiting run shows the decision step with buttons; after a decision the full continuation shows at once.

- [ ] **Step 8: Docs**

`CLAUDE.md` Working conventions — add:

```markdown
- Each workflow has one `decision` (the step that waits for the visitor's Approve/Reject) and
  two `drills` (predefined problems). Paths through the decision node end at it; outcomes come
  from `decision.approve` / `decision.reject`. A repeated step in a path is a retry. Edges may
  carry `{ via: x }` to route around a skipped card. All of it is illustrative and tested in
  `src/content/site.test.js`.
```

`PROMPT_LOG.md` — append:

```markdown
## 2026-10-01 — approver moment + failure drills (Phuong Hoang + Claude)
- Asked for ideas that go beyond what other agent sites already show. Chose "You're the
  approver" (the run stops and waits for the visitor's Approve/Reject — no timer, so the agent
  never decides for them) and "Throw a problem at it" (two predefined drills per scenario:
  retry, ask-first detour, cross-check, or escalation to the human step).
- Built as data-driven paths on the existing pure run logic rather than an event engine, so
  demos are predictable in front of clients.
- Planning corrections: the unclear-request drill skips the router (no room for an upward
  detour), escalation edges got a side-channel `via` so they don't run through the skipped
  card, and decision buttons got explicit, tested coordinates so they never cover a card.
```

`content/TODO.md` — add before the final paragraph:

```markdown
- [ ] **Decision and drill copy** — approval steps, "sent back" outcomes and drill wording in
      `workflows` are illustrative; confirm they match how the team would really run these.
```

- [ ] **Step 9: Verify and commit**

Run: `npm run lint && npm run build && npm test` — all pass; report gzip (≤ 71 kB). Hex grep in `src/components` and `src/workflow` — no output.

```bash
git add src/components/DrillMenu.jsx src/components/AgentDemo.jsx src/components/RunMonitor.jsx CLAUDE.md PROMPT_LOG.md content/TODO.md
git commit -m "feat: approve/reject moment, problem drills menu and session action log

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
