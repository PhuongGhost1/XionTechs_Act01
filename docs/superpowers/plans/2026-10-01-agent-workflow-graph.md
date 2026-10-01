# Agent Workflow Graph Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the linear agent-demo timeline with a live, branching workflow graph, add a monitoring strip and a "Built on Azure" strip, and remove the chat guide.

**Architecture:** Workflows are plain data in `src/content/site.js`. Pure functions in `src/workflow/run.js` turn a workflow plus a branch into ordered steps and, for any tick, which nodes/edges are active, working or travelling; `src/workflow/layout.js` turns node coordinates into SVG geometry. Components only render those results: `WorkflowGraph.jsx` (desktop SVG canvas + positioned node buttons), `WorkflowList.jsx` (phone layout and screen-reader text), `RunMonitor.jsx`, `AzureStrip.jsx`, orchestrated by a rewritten `AgentDemo.jsx`.

**Tech Stack:** Vite 5, React 18, Tailwind 3.4 (CSS-variable colour tokens), lucide-react (named imports), Vitest (node environment). SVG SMIL `<animateMotion>` for packets.

**Spec:** `docs/superpowers/specs/2026-10-01-agent-workflow-graph-design.md`

## Global Constraints

- Branch: `feat/agent-workflow-graph`. Commit as the configured git identity (Phuong Hoang); never change git config. End every commit message with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- No new dependencies (runtime or dev).
- Icons: named imports from `lucide-react` only, via `src/components/icons.js` or direct named import. Never `import * as`.
- Colours: never hardcode hex in `src/components`, `src/workflow` or `src/chat`. Use Tailwind token names: `paper surface ink muted line primary primaryHover primarySoft primaryInk accent navy navyInk navyAccent`. `text-primary` is already foreground-safe. Inside `bg-navy` sections use `text-navyAccent` for accent text. Text on `bg-accent` uses `text-paper`.
- Copy: every new string in `site.js` is either real live-site copy or marked `PLACEHOLDER` / `ILLUSTRATIVE` in a comment. No digits in any workflow title, desc, capability, branch label or run-log text. No percentages, counts or timings in the monitoring strip.
- Capability labels shown on agent nodes are exactly: `AI model`, `Integration`, `IoT gateway`, `Data store` (PLACEHOLDER until the team confirms Azure services).
- Contrast: body text ≥ 4.5:1, large text/UI ≥ 3:1 in all three themes. Dimming an off-path node changes border/edge chrome only — never text opacity.
- Reduced motion (`prefers-reduced-motion: reduce`): no packets, no pulsing, no timed steps, no sliding rows.
- Bundle: main JS chunk ≤ 71 kB gzipped (current 64.54 kB).
- `npm run lint`, `npm run build`, `npm test` pass at every commit.
- Windows/Git Bash. Do not run `npm run dev`; the controller runs browser checks.

## Review Focus

1. **SMIL packets inserted after page load jump straight to their end** (an `<animateMotion>` added dynamically starts relative to the document timeline). Expected: each packet visibly travels its edge. Pinned in Task 3: `begin="indefinite"` + `beginElement()` on mount.
2. **Switching tab or pressing Replay mid-run** must never show nodes from the previous workflow/branch as active. Expected: clean restart. Pinned in Task 4: single `setTimeout` per tick cleared by effect cleanup; `tick` reset in the same handler that changes workflow/branch; `stateAt` derives everything from `(run, tick)`.
3. **Long node titles overflowing the fixed-size cards** at the 1024 px breakpoint. Expected: every title fits one line. Pinned in Task 2 test: every node title ≤ 26 characters.
4. **Node cards overlapping or leaving the canvas** when coordinates are edited later. Expected: layout stays clean. Pinned in Task 2 test: every node box lies inside the 760 × 520 viewBox and no two boxes in a workflow intersect.
5. **Reduced motion switched on mid-run** must jump to the completed path, not freeze half-way. Pinned in Task 4: the rendered tick is `reduced ? totalTicks(run) : tick`, derived on every render.

---

## File map

| Path | Responsibility |
|---|---|
| `src/components/ChatGuide.jsx`, `src/chat/*` | deleted (Task 1) |
| `src/content/site.js` | remove `chat` (T1) and `agentScenarios` (T4); add `workflows`, `capabilityLabels`, `runLog`, `stack`, `sections.monitor` (T2) |
| `src/content/site.test.js` | workflow/run-log content rules (T2); drop old scenario tests (T4) |
| `src/workflow/run.js` (+ `run.test.js`) | `buildRun`, `nextBranchIndex`, `totalTicks`, `stateAt`, `edgeKey`, `splitBranches`, `visibleRows` |
| `src/workflow/layout.js` (+ `layout.test.js`) | `VIEW`, `NODE_SIZE`, `nodeBox`, `edgePath`, `pct` |
| `src/components/WorkflowGraph.jsx` | desktop canvas (T3) |
| `src/components/WorkflowList.jsx` | phone layout + sr-only text alternative (T3) |
| `src/components/workflowStyles.js` | shared node state → class helpers and type icons for Graph and List (T3) |
| `src/components/AgentDemo.jsx` | tabs, run timer, branch switching, detail panel, hosts RunMonitor (T4) |
| `src/components/RunMonitor.jsx` | monitoring strip (T5) |
| `src/components/AzureStrip.jsx` | stack strip (T5) |
| `src/components/icons.js` | icon map updates (T3) |
| `src/index.css` | remove chat + demo-step CSS; add monitor row animation |
| `src/App.jsx` | remove ChatGuide (T1), add AzureStrip (T5) |
| `CLAUDE.md`, `content/TODO.md`, `PROMPT_LOG.md` | docs (T1, T6) |

---

### Task 1: Remove the chat guide

**Files:**
- Delete: `src/components/ChatGuide.jsx`, `src/chat/answerEngine.js`, `src/chat/answerEngine.test.js`, `src/chat/intents.js`
- Modify: `src/App.jsx`, `src/content/site.js`, `src/index.css`, `CLAUDE.md`, `content/TODO.md`, `PROMPT_LOG.md`

**Interfaces:**
- Produces: no `chat` export in `site.js`; no `src/chat/` directory; no `.chat-panel` CSS.

- [ ] **Step 1: Delete chat code**

```bash
git rm src/components/ChatGuide.jsx src/chat/answerEngine.js src/chat/answerEngine.test.js src/chat/intents.js
```

- [ ] **Step 2: Remove ChatGuide from `src/App.jsx`**

Delete the line `import ChatGuide from './components/ChatGuide'` and the line `<ChatGuide />`.

- [ ] **Step 3: Remove the `chat` export from `src/content/site.js`**

Delete this block entirely (comment included):

```js
// Chat guide copy. The assistant is scripted; it never claims to be a live AI.
export const chat = {
  ...
}
```

- [ ] **Step 4: Remove chat CSS from `src/index.css`**

Delete the `/* Chat guide panel: fixed card on desktop, full screen on small phones */` comment, the `.chat-panel { ... }` rule and the `@media (max-width: 479px) { .chat-panel { ... } }` block.

- [ ] **Step 5: Verify nothing references chat**

Run: `grep -rn "chat\|ChatGuide\|getAnswer" src`
Expected: no output.

- [ ] **Step 6: Update `CLAUDE.md`**

Under "Working conventions" delete these two bullets:
- the bullet starting `- The chat guide is scripted.`
- `- Chat keyword matching is word-bounded at both ends (see \`src/chat/answerEngine.js\`).`

(and its continuation lines). Leave every other line unchanged.

- [ ] **Step 7: Update `content/TODO.md`**

Delete the item `- [ ] **Chat guide answers** — review \`src/chat/intents.js\` wording once the pillar copy is real.` (both lines).

- [ ] **Step 8: Log the decision in `PROMPT_LOG.md`**

Append at the end of the file:

```markdown
## 2026-10-01 — workflow graph round (Phuong Hoang + Claude)
- User reviewed sierra.ai and relevanceai.com/agents and observed the leading agent
  sites show agents as live workflow graphs rather than a chatbot. Decision: remove
  the "Ask XionTechs" chat guide entirely (recoverable from git history) and replace
  the linear agent-demo timeline with a branching workflow graph.
- Azure-first focus stated by team member Phuong Hoang on 2026-10-01. The captured
  live-site copy names "Azure, AWS, and GCP", so the Azure-first strip ships as
  PLACEHOLDER and node capability labels stay generic ("AI model", "Integration",
  "IoT gateway", "Data store") until the team confirms the actual Azure services.
- Relevance AI shows pass-rate percentages per node; we deliberately show run
  statuses in words only, because any number on our page would be invented.
```

- [ ] **Step 9: Verify and commit**

Run: `npm run lint && npm run build && npm test`
Expected: all pass (test count drops by the 13 chat tests).

```bash
git add -A src/App.jsx src/content/site.js src/index.css CLAUDE.md content/TODO.md PROMPT_LOG.md
git commit -m "chore: remove chat guide in favour of workflow visualisation

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Workflow data, layout geometry and run logic

**Files:**
- Create: `src/workflow/run.js`, `src/workflow/run.test.js`, `src/workflow/layout.js`, `src/workflow/layout.test.js`
- Modify: `src/content/site.js`, `src/content/site.test.js`, `content/TODO.md`

**Interfaces:**
- Produces (site.js): `workflows`, `capabilityLabels`, `runLog`, `stack`, `sections.monitor` with the exact shapes below.
- Produces (run.js):
  - `buildRun(workflow, branchIndex) → { steps: string[][], edges: { from, to, step }[], branchLabel: string }`
  - `nextBranchIndex(workflow, current) → number`
  - `totalTicks(run) → number`
  - `edgeKey(edge) → string` (`"from>to"`)
  - `stateAt(run, tick) → { active: Set<string>, working: Set<string>, travelling: Set<string>, lit: Set<string>, done: boolean }` (edge sets hold `edgeKey`s)
  - `splitBranches(workflow) → { prefix: string[][], branches: { label, steps: string[][] }[], suffix: string[][] }`
  - `visibleRows(log, offset, count) → row[]`
- Produces (layout.js): `VIEW = { w: 760, h: 520 }`, `NODE_SIZE` (type → `[w, h]`), `nodeBox(node) → { x, y, w, h }`, `edgePath(fromNode, toNode) → string`, `pct(value, total) → string`.

- [ ] **Step 1: Write failing run-logic tests**

Create `src/workflow/run.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { buildRun, nextBranchIndex, totalTicks, stateAt, edgeKey, splitBranches, visibleRows } from './run'

const linear = {
  branches: [{ label: 'Only', path: ['a', 'b', 'c'] }],
}
const forked = {
  branches: [
    { label: 'Left', path: ['t', 'r', 'l', 'end'] },
    { label: 'Right', path: ['t', 'r', 'x', 'y', 'end'] },
  ],
}
const parallel = {
  branches: [{ label: 'Par', path: ['t', 'a', ['h', 's'], 'k', 'done'] }],
}

describe('buildRun', () => {
  it('normalises steps and derives edges in order', () => {
    const run = buildRun(linear, 0)
    expect(run.steps).toEqual([['a'], ['b'], ['c']])
    expect(run.edges).toEqual([
      { from: 'a', to: 'b', step: 1 },
      { from: 'b', to: 'c', step: 2 },
    ])
    expect(run.branchLabel).toBe('Only')
  })

  it('expands a parallel step into every incoming and outgoing edge', () => {
    const run = buildRun(parallel, 0)
    expect(run.steps[2]).toEqual(['h', 's'])
    expect(run.edges.map(edgeKey)).toEqual(['t>a', 'a>h', 'a>s', 'h>k', 's>k', 'k>done'])
  })

  it('picks the requested branch', () => {
    expect(buildRun(forked, 1).steps.flat()).toEqual(['t', 'r', 'x', 'y', 'end'])
  })
})

describe('nextBranchIndex', () => {
  it('wraps around', () => {
    expect(nextBranchIndex(forked, 0)).toBe(1)
    expect(nextBranchIndex(forked, 1)).toBe(0)
    expect(nextBranchIndex(linear, 0)).toBe(0)
  })
})

describe('stateAt', () => {
  const run = buildRun(linear, 0) // steps a, b, c → totalTicks 5

  it('counts ticks as two per step after the trigger plus one', () => {
    expect(totalTicks(run)).toBe(5)
  })

  it('pulses the trigger at tick 0', () => {
    const s = stateAt(run, 0)
    expect([...s.working]).toEqual(['a'])
    expect(s.active.size).toBe(0)
    expect(s.done).toBe(false)
  })

  it('travels, works, then activates each later step', () => {
    expect([...stateAt(run, 1).travelling]).toEqual(['a>b'])
    expect([...stateAt(run, 1).active]).toEqual(['a'])
    expect([...stateAt(run, 2).working]).toEqual(['b'])
    expect([...stateAt(run, 2).lit]).toEqual(['a>b'])
    expect([...stateAt(run, 3).active]).toEqual(['a', 'b'])
  })

  it('is done with every node active and every edge lit at totalTicks', () => {
    const s = stateAt(run, totalTicks(run))
    expect([...s.active]).toEqual(['a', 'b', 'c'])
    expect([...s.lit]).toEqual(['a>b', 'b>c'])
    expect(s.working.size).toBe(0)
    expect(s.travelling.size).toBe(0)
    expect(s.done).toBe(true)
  })

  it('works both parallel nodes at once', () => {
    const p = buildRun(parallel, 0)
    expect([...stateAt(p, 3).travelling]).toEqual(['a>h', 'a>s'])
    expect([...stateAt(p, 4).working]).toEqual(['h', 's'])
  })
})

describe('splitBranches', () => {
  it('returns the whole path as prefix for a single branch', () => {
    expect(splitBranches(linear)).toEqual({ prefix: [['a'], ['b'], ['c']], branches: [], suffix: [] })
  })

  it('separates shared prefix, per-branch middles and shared suffix', () => {
    expect(splitBranches(forked)).toEqual({
      prefix: [['t'], ['r']],
      branches: [
        { label: 'Left', steps: [['l']] },
        { label: 'Right', steps: [['x'], ['y']] },
      ],
      suffix: [['end']],
    })
  })
})

describe('visibleRows', () => {
  const log = ['r0', 'r1', 'r2', 'r3', 'r4', 'r5']
  it('shows newest first and wraps', () => {
    expect(visibleRows(log, 0, 4)).toEqual(['r0', 'r5', 'r4', 'r3'])
    expect(visibleRows(log, 2, 4)).toEqual(['r2', 'r1', 'r0', 'r5'])
    expect(visibleRows(log, 8, 2)).toEqual(['r2', 'r1'])
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/workflow/run.test.js`
Expected: FAIL — cannot find module `./run`.

- [ ] **Step 3: Implement `src/workflow/run.js`**

```js
// Pure run logic for the agent workflow graph. Components only render what these return.
//
// Timeline, one tick at a time: tick 0 pulses the trigger (step 0). For every later step i,
// tick 2i-1 sends packets along the edges into it, tick 2i shows its nodes working, and the
// nodes are active from tick 2i+1. The run is done at totalTicks(run).

const asStep = (s) => (Array.isArray(s) ? s : [s])

export const edgeKey = (edge) => `${edge.from}>${edge.to}`

export function buildRun(workflow, branchIndex) {
  const branch = workflow.branches[branchIndex]
  const steps = branch.path.map(asStep)
  const edges = []
  for (let i = 1; i < steps.length; i++) {
    for (const from of steps[i - 1]) {
      for (const to of steps[i]) edges.push({ from, to, step: i })
    }
  }
  return { steps, edges, branchLabel: branch.label }
}

export function nextBranchIndex(workflow, current) {
  return (current + 1) % workflow.branches.length
}

export function totalTicks(run) {
  return 2 * (run.steps.length - 1) + 1
}

export function stateAt(run, tick) {
  const active = new Set()
  const working = new Set()
  const travelling = new Set()
  const lit = new Set()

  run.steps.forEach((step, i) => {
    const workTick = i === 0 ? 0 : 2 * i
    for (const id of step) {
      if (tick === workTick) working.add(id)
      if (tick > workTick) active.add(id)
    }
  })
  for (const edge of run.edges) {
    if (tick === 2 * edge.step - 1) travelling.add(edgeKey(edge))
    if (tick >= 2 * edge.step) lit.add(edgeKey(edge))
  }
  return { active, working, travelling, lit, done: tick >= totalTicks(run) }
}

// Splits a workflow's branches into the steps all branches share at the start, the steps
// that differ, and the steps all branches share at the end — the phone layout renders the
// middle part as side-by-side alternatives.
export function splitBranches(workflow) {
  const paths = workflow.branches.map((b) => b.path.map(asStep))
  if (paths.length === 1) return { prefix: paths[0], branches: [], suffix: [] }

  const same = (a, b) => a.join('|') === b.join('|')
  const first = paths[0]
  let p = 0
  while (paths.every((path) => path[p] && same(path[p], first[p]))) p++
  let s = 0
  while (
    paths.every(
      (path) => path.length - 1 - s >= p && same(path[path.length - 1 - s], first[first.length - 1 - s]),
    )
  ) {
    s++
  }
  return {
    prefix: first.slice(0, p),
    branches: workflow.branches.map((b, i) => ({ label: b.label, steps: paths[i].slice(p, paths[i].length - s) })),
    suffix: first.slice(first.length - s),
  }
}

// Newest-first window of `count` rows from a cycling log; `offset` is the newest row index.
export function visibleRows(log, offset, count) {
  const n = log.length
  return Array.from({ length: count }, (_, k) => log[(((offset - k) % n) + n) % n])
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/workflow/run.test.js`
Expected: all pass.

- [ ] **Step 5: Write failing layout tests**

Create `src/workflow/layout.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { VIEW, NODE_SIZE, nodeBox, edgePath, pct } from './layout'

describe('layout', () => {
  it('defines a size for every node type', () => {
    expect(Object.keys(NODE_SIZE).sort()).toEqual(['agent', 'human', 'outcome', 'router', 'trigger'])
    expect(VIEW).toEqual({ w: 760, h: 520 })
  })

  it('centres the box on the node coordinates', () => {
    expect(nodeBox({ type: 'router', x: 380, y: 200 })).toEqual({ x: 320, y: 184, w: 120, h: 32 })
  })

  it('draws an elbow from the bottom of one node to the top of the next', () => {
    const from = { type: 'trigger', x: 380, y: 40 } // bottom edge at 62
    const to = { type: 'agent', x: 200, y: 120 } // top edge at 93
    expect(edgePath(from, to)).toBe('M 380 62 V 77.5 H 200 V 93')
  })

  it('formats percentages of the view', () => {
    expect(pct(380, 760)).toBe('50%')
  })
})
```

- [ ] **Step 6: Run to verify failure, then implement `src/workflow/layout.js`**

Run: `npx vitest run src/workflow/layout.test.js` — expected FAIL (module missing).

```js
// Geometry for the workflow canvas. Node x/y are centre points in a fixed 760 × 520 viewBox;
// the canvas scales to its container, and node buttons are positioned in percentages of it.

export const VIEW = { w: 760, h: 520 }

// [width, height] in viewBox units, per node type.
export const NODE_SIZE = {
  trigger: [190, 44],
  agent: [190, 54],
  router: [120, 32],
  human: [190, 54],
  outcome: [190, 50],
}

export function nodeBox(node) {
  const [w, h] = NODE_SIZE[node.type]
  return { x: node.x - w / 2, y: node.y - h / 2, w, h }
}

export function edgePath(from, to) {
  const y1 = from.y + NODE_SIZE[from.type][1] / 2
  const y2 = to.y - NODE_SIZE[to.type][1] / 2
  const mid = (y1 + y2) / 2
  return `M ${from.x} ${y1} V ${mid} H ${to.x} V ${y2}`
}

export const pct = (value, total) => `${(value / total) * 100}%`
```

Run: `npx vitest run src/workflow/layout.test.js` — expected PASS.

- [ ] **Step 7: Write failing content tests**

Append inside the `describe('site content rules', ...)` block of `src/content/site.test.js`, and add the import line at the top: `import { buildRun } from '../workflow/run'` and `import { VIEW, nodeBox } from '../workflow/layout'`.

```js
  describe('workflows', () => {
    const byId = (wf) => Object.fromEntries(wf.nodes.map((n) => [n.id, n]))
    const flat = (path) => path.flatMap((s) => (Array.isArray(s) ? s : [s]))

    it('has the three illustrative workflows', () => {
      expect(site.workflows.map((w) => w.id)).toEqual(['support', 'inventory', 'factory'])
      for (const wf of site.workflows) expect(wf.illustrative).toBe(true)
    })

    it('only uses known node types and unique ids', () => {
      for (const wf of site.workflows) {
        const ids = wf.nodes.map((n) => n.id)
        expect(new Set(ids).size).toBe(ids.length)
        for (const n of wf.nodes) expect(['trigger', 'agent', 'router', 'human', 'outcome']).toContain(n.type)
      }
    })

    it('connects edges to existing nodes and runs every branch along edges', () => {
      for (const wf of site.workflows) {
        const nodes = byId(wf)
        const edgeSet = new Set(wf.edges.map(([a, b]) => `${a}>${b}`))
        for (const [a, b] of wf.edges) {
          expect(nodes[a], `${wf.id} edge from ${a}`).toBeDefined()
          expect(nodes[b], `${wf.id} edge to ${b}`).toBeDefined()
        }
        wf.branches.forEach((_, i) => {
          for (const e of buildRun(wf, i).edges) expect(edgeSet.has(`${e.from}>${e.to}`), `${wf.id} ${e.from}>${e.to}`).toBe(true)
        })
      }
    })

    it('starts every branch at the single trigger and ends at an outcome', () => {
      for (const wf of site.workflows) {
        const nodes = byId(wf)
        const triggers = wf.nodes.filter((n) => n.type === 'trigger')
        expect(triggers.length).toBe(1)
        for (const b of wf.branches) {
          const ids = flat(b.path)
          expect(ids[0]).toBe(triggers[0].id)
          expect(nodes[ids[ids.length - 1]].type).toBe('outcome')
        }
      }
    })

    it('labels every agent with a placeholder capability', () => {
      expect(site.capabilityLabels).toEqual(['AI model', 'Integration', 'IoT gateway', 'Data store'])
      for (const wf of site.workflows) {
        for (const n of wf.nodes.filter((x) => x.type === 'agent')) expect(site.capabilityLabels).toContain(n.capability)
      }
    })

    it('keeps titles short enough for one line', () => {
      for (const wf of site.workflows) for (const n of wf.nodes) expect(n.title.length, n.title).toBeLessThanOrEqual(26)
    })

    it('keeps every node inside the canvas without overlaps', () => {
      for (const wf of site.workflows) {
        const boxes = wf.nodes.map((n) => ({ id: n.id, ...nodeBox(n) }))
        for (const b of boxes) {
          expect(b.x >= 0 && b.y >= 0 && b.x + b.w <= VIEW.w && b.y + b.h <= VIEW.h, `${wf.id}/${b.id} inside`).toBe(true)
        }
        for (let i = 0; i < boxes.length; i++) {
          for (let j = i + 1; j < boxes.length; j++) {
            const a = boxes[i]
            const c = boxes[j]
            const overlap = a.x < c.x + c.w && c.x < a.x + a.w && a.y < c.y + c.h && c.y < a.y + a.h
            expect(overlap, `${wf.id}: ${a.id} overlaps ${c.id}`).toBe(false)
          }
        }
      }
    })

    it('contains no digits in any workflow text', () => {
      for (const wf of site.workflows) {
        const texts = [wf.label, ...wf.branches.map((b) => b.label), ...wf.nodes.flatMap((n) => [n.title, n.desc, n.capability ?? ''])]
        for (const t of texts) expect(t, `${wf.id}: ${t}`).not.toMatch(/\d/)
      }
    })
  })

  describe('run log', () => {
    it('has six illustrative rows with known statuses and no digits', () => {
      expect(site.runLog.length).toBe(6)
      const workflowIds = site.workflows.map((w) => w.id)
      for (const r of site.runLog) {
        expect(['passed', 'flagged', 'retried']).toContain(r.status)
        expect(workflowIds).toContain(r.workflow)
        expect(r.text).not.toMatch(/\d/)
      }
      expect(new Set(site.runLog.map((r) => r.text)).size).toBe(6)
    })
  })

  it('lists Azure first in the stack strip', () => {
    expect(site.stack.chips[0]).toEqual({ label: 'Azure', primary: true })
    expect(site.stack.chips.map((c) => c.label)).toEqual(['Azure', 'AWS', 'GCP', 'Power Platform', 'Make', 'n8n', 'Retool', 'Bubble'])
  })
```

Run: `npm test` — expected FAIL (`site.workflows` undefined).

- [ ] **Step 8: Add the content to `src/content/site.js`**

Insert directly AFTER the existing `agentScenarios` array (do not remove `agentScenarios` yet; Task 4 does):

```js
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
```

In the existing `sections` export, add a `monitor` entry after `demo`:

```js
  monitor: {
    title: 'Agents are watched, not left alone.',
    intro: 'Every run is checked. Anything unusual goes to a person.',
  },
```

- [ ] **Step 9: Run all tests**

Run: `npm test`
Expected: all pass. If the overlap/inside test fails, fix the coordinates in `site.js` (never loosen the test) and say so in your report.

- [ ] **Step 10: Update `content/TODO.md`**

Add before the final "Once resolved…" paragraph:

```markdown
- [ ] **Workflow capability labels** — agent nodes show generic labels ("AI model",
      "Integration", "IoT gateway", "Data store"). Replace each with the actual Azure
      service the team uses for that step (`capabilityLabels` / `workflows` in site.js).
- [ ] **Azure strip wording** — `stack.line` (Azure-first framing) is PLACEHOLDER pending
      team sign-off.
- [ ] **Monitoring strip copy** — `sections.monitor` and `runLog` are illustrative /
      placeholder.
```

- [ ] **Step 11: Lint, build, commit**

Run: `npm run lint && npm run build && npm test` — all pass.

```bash
git add src/workflow src/content/site.js src/content/site.test.js content/TODO.md
git commit -m "feat: workflow data, layout geometry and pure run logic

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Workflow graph and list components

**Files:**
- Create: `src/components/workflowStyles.js`, `src/components/WorkflowGraph.jsx`, `src/components/WorkflowList.jsx`

**Interfaces:**
- Consumes: `buildRun`, `stateAt`, `edgeKey`, `splitBranches` (Task 2); `VIEW`, `nodeBox`, `edgePath`, `pct` (Task 2); workflow node shape `{ id, type, title, capability?, x, y, desc }`.
- Produces:
  - `nodeStatus(id, run, state) → 'working' | 'active' | 'idle' | 'off'`
  - `nodeClasses(node, status, selected) → string`
  - `typeIcon` map: type → lucide component
  - `<WorkflowGraph workflow run state selectedId onSelect reduced />`
  - `<WorkflowList workflow run state className />`

Icons for node types are imported directly from `lucide-react` in `workflowStyles.js`; `src/components/icons.js` is not touched in this task (Task 4 removes the old `stepIcons`).

- [ ] **Step 1: Create `src/components/workflowStyles.js`**

```js
// Shared node styling for WorkflowGraph and WorkflowList. Off-path nodes dim their chrome
// (dashed border) only — text always keeps full contrast.
import { Bot, CheckCircle2, GitBranch, UserCheck, Zap } from 'lucide-react'

export const typeIcon = {
  trigger: Zap,
  agent: Bot,
  router: GitBranch,
  human: UserCheck,
  outcome: CheckCircle2,
}

export const typeTag = {
  trigger: 'Trigger',
  human: 'Approval',
}

export function nodeStatus(id, run, state) {
  if (state.working.has(id)) return 'working'
  if (state.active.has(id)) return 'active'
  const onPath = run.steps.some((step) => step.includes(id))
  return onPath ? 'idle' : 'off'
}

export function nodeClasses(node, status, selected) {
  const base = 'border bg-surface text-ink transition-colors duration-300'
  const byStatus = {
    working: 'border-accent ring-2 ring-accent/40 motion-safe:animate-pulse',
    active: node.type === 'outcome' ? 'border-accent bg-accent text-paper' : 'border-accent',
    idle: 'border-line',
    off: 'border-dashed border-line',
  }
  const sel = selected ? 'outline outline-2 outline-offset-2 outline-primary' : ''
  return `${base} ${byStatus[status]} ${sel}`
}
```

- [ ] **Step 2: Create `src/components/WorkflowGraph.jsx`**

```jsx
import { useEffect, useRef } from 'react'
import { VIEW, edgePath, nodeBox, pct } from '../workflow/layout'
import { edgeKey } from '../workflow/run'
import { nodeClasses, nodeStatus, typeIcon, typeTag } from './workflowStyles'

const PACKET_MS = 600

// A packet dot travelling one edge. SMIL animations added after page load would start
// relative to the document timeline (and finish instantly), so begin is "indefinite" and
// the animation is started explicitly on mount.
function Packet({ d }) {
  const ref = useRef(null)
  useEffect(() => {
    ref.current?.beginElement?.()
  }, [])
  return (
    <circle r="5" className="fill-accent">
      <animateMotion ref={ref} begin="indefinite" dur={`${PACKET_MS}ms`} fill="freeze" path={d} />
    </circle>
  )
}

export default function WorkflowGraph({ workflow, run, state, selectedId, onSelect, reduced }) {
  const nodes = Object.fromEntries(workflow.nodes.map((n) => [n.id, n]))
  const runEdgeKeys = new Set(run.edges.map(edgeKey))

  return (
    <div className="relative w-full" style={{ aspectRatio: `${VIEW.w} / ${VIEW.h}` }}>
      <svg viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} className="absolute inset-0 h-full w-full" aria-hidden="true">
        <defs>
          <pattern id="wf-dots" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" className="fill-line" />
          </pattern>
        </defs>
        <rect width={VIEW.w} height={VIEW.h} fill="url(#wf-dots)" />
        {workflow.edges.map(([from, to]) => {
          const key = `${from}>${to}`
          const lit = state.lit.has(key)
          const onPath = runEdgeKeys.has(key)
          return (
            <path
              key={key}
              d={edgePath(nodes[from], nodes[to])}
              fill="none"
              strokeWidth="2"
              strokeDasharray={onPath ? undefined : '4 4'}
              className={`transition-colors duration-300 ${lit ? 'stroke-accent' : 'stroke-line'}`}
            />
          )
        })}
        {!reduced &&
          run.edges
            .filter((e) => state.travelling.has(edgeKey(e)))
            .map((e) => <Packet key={`${run.branchLabel}-${edgeKey(e)}`} d={edgePath(nodes[e.from], nodes[e.to])} />)}
      </svg>

      {workflow.nodes.map((node) => {
        const box = nodeBox(node)
        const status = nodeStatus(node.id, run, state)
        const Icon = typeIcon[node.type]
        const isRouter = node.type === 'router'
        return (
          <button
            key={node.id}
            type="button"
            onClick={() => onSelect(node.id)}
            aria-pressed={selectedId === node.id}
            className={`absolute flex items-center gap-2 text-left ${isRouter ? 'justify-center rounded-full border-dashed px-2' : 'rounded-xl px-3'} ${nodeClasses(node, status, selectedId === node.id)}`}
            style={{ left: pct(box.x, VIEW.w), top: pct(box.y, VIEW.h), width: pct(box.w, VIEW.w), height: pct(box.h, VIEW.h) }}
          >
            {typeTag[node.type] && (
              <span className="absolute -top-2.5 left-3 rounded-full bg-primarySoft px-2 text-[10px] font-medium uppercase tracking-wide text-primary">
                {typeTag[node.type]}
              </span>
            )}
            <Icon className={`h-4 w-4 shrink-0 ${status === 'active' && node.type === 'outcome' ? '' : 'text-accent'}`} strokeWidth={1.75} />
            <span className="min-w-0">
              <span className={`block truncate font-medium ${isRouter ? 'text-xs' : 'text-sm'}`}>{node.title}</span>
              {node.capability && (
                <span className="mt-0.5 inline-block rounded border border-dashed border-line px-1.5 text-[11px] text-muted" title="Draft label — final Azure service to be confirmed">
                  {node.capability}
                </span>
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 3: Create `src/components/WorkflowList.jsx`**

```jsx
import { splitBranches } from '../workflow/run'
import { nodeClasses, nodeStatus, typeIcon } from './workflowStyles'

function Item({ node, run, state }) {
  const status = nodeStatus(node.id, run, state)
  const Icon = typeIcon[node.type]
  const outcomeActive = status === 'active' && node.type === 'outcome'
  return (
    <li className={`rounded-xl p-3 ${nodeClasses(node, status, false)}`}>
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 shrink-0 ${outcomeActive ? '' : 'text-accent'}`} strokeWidth={1.75} />
        <span className="text-sm font-medium">{node.title}</span>
        {node.capability && (
          <span className="rounded border border-dashed border-line px-1.5 text-[11px] text-muted">{node.capability}</span>
        )}
      </div>
      <p className={`mt-1 text-sm ${outcomeActive ? '' : 'text-muted'}`}>{node.desc}</p>
    </li>
  )
}

function Steps({ steps, nodes, run, state }) {
  return steps.flatMap((step) => step.map((id) => <Item key={id} node={nodes[id]} run={run} state={state} />))
}

// Phone layout and, on desktop, the screen-reader text alternative of the graph.
export default function WorkflowList({ workflow, run, state, className = '' }) {
  const nodes = Object.fromEntries(workflow.nodes.map((n) => [n.id, n]))
  const { prefix, branches, suffix } = splitBranches(workflow)

  return (
    <div className={className}>
      <ol className="space-y-3 border-l-2 border-line pl-4">
        <Steps steps={prefix} nodes={nodes} run={run} state={state} />
      </ol>
      {branches.length > 0 && (
        <div className="mt-3 border-l-2 border-line pl-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Routes to one of:</p>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {branches.map((b) => {
              const chosen = b.label === run.branchLabel
              return (
                <div key={b.label} className={`rounded-xl border p-2 ${chosen ? 'border-accent' : 'border-dashed border-line'}`}>
                  <p className="mb-2 text-xs font-medium text-ink">
                    {b.label}
                    {chosen && <span className="ml-2 text-muted">(this run)</span>}
                  </p>
                  <ol className="space-y-2">
                    <Steps steps={b.steps} nodes={nodes} run={run} state={state} />
                  </ol>
                </div>
              )
            })}
          </div>
        </div>
      )}
      {suffix.length > 0 && (
        <ol className="mt-3 space-y-3 border-l-2 border-line pl-4">
          <Steps steps={suffix} nodes={nodes} run={run} state={state} />
        </ol>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Lint, build, test, commit**

These components are not mounted yet (Task 4 mounts them); lint and build must pass.

Run: `npm run lint && npm run build && npm test` — all pass.

```bash
git add src/components/workflowStyles.js src/components/WorkflowGraph.jsx src/components/WorkflowList.jsx
git commit -m "feat: workflow graph canvas and list components

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Rewrite AgentDemo around the graph

**Files:**
- Modify: `src/components/AgentDemo.jsx` (full rewrite), `src/content/site.js`, `src/content/site.test.js`, `src/components/icons.js`, `src/index.css`

**Interfaces:**
- Consumes: `workflows`, `sections.demo` (site.js); `buildRun`, `nextBranchIndex`, `totalTicks`, `stateAt` (run.js); `WorkflowGraph`, `WorkflowList`, `typeIcon` (Task 3); `iconMap` (icons.js).
- Produces: `<AgentDemo />` rendering `#demo`; it renders `<RunMonitor reduced inView />` only after Task 5 — in this task leave the marked insertion comment.

- [ ] **Step 1: Replace `src/components/AgentDemo.jsx`**

```jsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { Pause, Play, RotateCcw } from 'lucide-react'
import { sections, workflows } from '../content/site'
import { buildRun, nextBranchIndex, stateAt, totalTicks } from '../workflow/run'
import { iconMap } from './icons'
import WorkflowGraph from './WorkflowGraph'
import WorkflowList from './WorkflowList'
import { typeIcon } from './workflowStyles'

const TICK_MS = 700

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
  )
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!mq) return
    const onChange = (e) => setReduced(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return reduced
}

export default function AgentDemo() {
  const reduced = usePrefersReducedMotion()
  const [active, setActive] = useState(0)
  const [branch, setBranch] = useState(0)
  const [tick, setTick] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [inView, setInView] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const sectionRef = useRef(null)
  const tabRefs = useRef([])

  const workflow = workflows[active]
  const run = useMemo(() => buildRun(workflow, branch), [workflow, branch])
  const total = totalTicks(run)
  // Derived every render, so turning reduced motion on mid-run jumps to the finished path.
  const shownTick = reduced ? total : tick
  const state = useMemo(() => stateAt(run, shownTick), [run, shownTick])

  useEffect(() => {
    const el = sectionRef.current
    if (!el || !('IntersectionObserver' in window)) {
      setInView(true)
      return
    }
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.3 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // One timeout per tick; cleanup clears it whenever the workflow, branch or tick changes.
  useEffect(() => {
    if (reduced || !playing || !inView || tick >= total) return
    const id = setTimeout(() => setTick((t) => t + 1), TICK_MS)
    return () => clearTimeout(id)
  }, [reduced, playing, inView, tick, total])

  function selectTab(i) {
    setActive(i)
    setBranch(0)
    setTick(0)
    setPlaying(true)
    setSelectedId(null)
  }

  function replay() {
    setBranch((b) => nextBranchIndex(workflow, b))
    setTick(0)
    setPlaying(true)
  }

  function onTabKey(e) {
    const n = workflows.length
    let next = null
    if (e.key === 'ArrowRight') next = (active + 1) % n
    if (e.key === 'ArrowLeft') next = (active - 1 + n) % n
    if (e.key === 'Home') next = 0
    if (e.key === 'End') next = n - 1
    if (next === null) return
    e.preventDefault()
    selectTab(next)
    tabRefs.current[next]?.focus()
  }

  const selected = workflow.nodes.find((n) => n.id === selectedId) ?? workflow.nodes[0]
  const SelectedIcon = typeIcon[selected.type]
  const btn =
    'flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink/70 transition hover:border-primary hover:text-primary'

  return (
    <section id="demo" ref={sectionRef} className="mx-auto max-w-6xl px-6 py-20">
      <p className="text-xs font-medium uppercase tracking-wide text-accent">{sections.demo.eyebrow}</p>
      <h2 className="mt-3 text-3xl md:text-4xl">{sections.demo.title}</h2>
      <p className="mt-3 max-w-xl text-muted">{sections.demo.intro}</p>

      <div role="tablist" aria-label="Agent workflows" className="mt-10 flex flex-wrap gap-2" onKeyDown={onTabKey}>
        {workflows.map((w, i) => {
          const Icon = iconMap[w.icon]
          const isSel = i === active
          return (
            <button
              key={w.id}
              ref={(el) => {
                tabRefs.current[i] = el
              }}
              role="tab"
              id={`demo-tab-${w.id}`}
              aria-selected={isSel}
              aria-controls="demo-panel"
              tabIndex={isSel ? 0 : -1}
              onClick={() => selectTab(i)}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                isSel ? 'border-primary bg-primary text-primaryInk' : 'border-line text-ink/70 hover:border-primary hover:text-primary'
              }`}
            >
              <Icon className="h-4 w-4" strokeWidth={1.75} />
              {w.label}
            </button>
          )
        })}
      </div>

      <div
        role="tabpanel"
        id="demo-panel"
        aria-labelledby={`demo-tab-${workflow.id}`}
        className="theme-fade mt-6 rounded-2xl border border-line bg-surface p-6 md:p-8"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="rounded-full border border-dashed border-accent px-3 py-1 text-xs font-medium text-accent">
            Illustrative scenario — not a client case study
          </span>
          {!reduced && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => (state.done ? replay() : setPlaying((p) => !p))}
                aria-label={playing && !state.done ? 'Pause' : 'Play'}
                className={btn}
              >
                {playing && !state.done ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>
              <button type="button" onClick={replay} aria-label="Replay with the next path" className={btn}>
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_16rem]">
          <div>
            <div className="hidden lg:block">
              <WorkflowGraph
                workflow={workflow}
                run={run}
                state={state}
                selectedId={selected.id}
                onSelect={setSelectedId}
                reduced={reduced}
              />
            </div>
            <WorkflowList workflow={workflow} run={run} state={state} className="lg:sr-only" />
            <p className="mt-4 text-sm text-muted" aria-live="polite">
              {state.done ? `Run complete · took the “${run.branchLabel}” path` : `Running · ${run.branchLabel} path`}
            </p>
          </div>

          <aside className="hidden rounded-xl border border-line bg-paper p-4 lg:block" aria-live="polite">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Step details</p>
            <div className="mt-3 flex items-center gap-2">
              <SelectedIcon className="h-4 w-4 text-accent" strokeWidth={1.75} />
              <p className="font-medium">{selected.title}</p>
            </div>
            {selected.capability && (
              <p className="mt-2 inline-block rounded border border-dashed border-line px-1.5 text-[11px] text-muted">
                {selected.capability} · draft label
              </p>
            )}
            <p className="mt-3 text-sm text-muted">{selected.desc}</p>
            <p className="mt-4 text-xs text-muted">Click any step in the workflow to see what it does.</p>
          </aside>
        </div>
        {/* RunMonitor is added here in Task 5 */}
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Remove the old scenario data and helpers**

- `src/content/site.js`: delete the `agentScenarios` export and its comment block.
- `src/content/site.test.js`: delete the two tests `flags every agent scenario as illustrative with exactly five steps` and `keeps agent outcomes free of invented numbers`.
- `src/components/icons.js`: delete `Inbox`, `Brain`, `Plug` (import + map entries), the `stepIcons` export and its comment.
- `src/index.css`: delete the `/* Agent demo step reveal */` comment, the `.demo-step` and `.demo-step-visible` rules, and inside the reduced-motion block the lines `.demo-step { ... }` and `.demo-connector > span { ... }`.

Run: `grep -rn "agentScenarios\|stepIcons\|demo-step\|demo-connector" src` — expected: no output.

- [ ] **Step 3: Lint, build, test**

Run: `npm run lint && npm run build && npm test` — all pass; report the gzip size (≤ 71 kB).

If react-hooks lint flags anything, fix minimally without changing behaviour and explain in the report.

- [ ] **Step 4: Commit**

```bash
git add src/components/AgentDemo.jsx src/content/site.js src/content/site.test.js src/components/icons.js src/index.css
git commit -m "feat: agent demo becomes a live branching workflow graph

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Monitoring strip and Azure strip

**Files:**
- Create: `src/components/RunMonitor.jsx`, `src/components/AzureStrip.jsx`
- Modify: `src/components/AgentDemo.jsx`, `src/App.jsx`, `src/index.css`

**Interfaces:**
- Consumes: `runLog`, `stack`, `sections.monitor` (site.js); `visibleRows` (run.js); lucide `CheckCircle2`, `Flag`, `RotateCw` (direct named imports).
- Produces: `<RunMonitor reduced inView />`, `<AzureStrip />` (`#stack`).

- [ ] **Step 1: Create `src/components/RunMonitor.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { CheckCircle2, Flag, RotateCw } from 'lucide-react'
import { runLog, sections } from '../content/site'
import { visibleRows } from '../workflow/run'

const ROW_MS = 3000
const VISIBLE = 4

// Status is always shown as icon + word, never colour alone.
const STATUS = {
  passed: { Icon: CheckCircle2, word: 'Passed checks' },
  flagged: { Icon: Flag, word: 'Flagged for review' },
  retried: { Icon: RotateCw, word: 'Retried' },
}

export default function RunMonitor({ reduced, inView }) {
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    if (reduced || !inView) return
    const id = setInterval(() => setOffset((o) => o + 1), ROW_MS)
    return () => clearInterval(id)
  }, [reduced, inView])

  const rows = reduced ? runLog : visibleRows(runLog, offset, VISIBLE)

  return (
    <div className="mt-8 border-t border-line pt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">{sections.monitor.title}</h3>
          <p className="mt-1 text-sm text-muted">{sections.monitor.intro}</p>
        </div>
        <span className="rounded-full border border-dashed border-accent px-3 py-1 text-xs font-medium text-accent">
          Illustrative run log
        </span>
      </div>
      <ul className="mt-4 space-y-2" aria-label="Recent agent runs">
        {rows.map((r) => {
          const { Icon, word } = STATUS[r.status]
          return (
            <li key={r.text} className="monitor-row flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-line bg-paper px-3 py-2 text-sm">
              <span className="inline-flex items-center gap-1.5 font-medium text-ink">
                <Icon className="h-4 w-4 text-accent" strokeWidth={1.75} />
                {word}
              </span>
              <span className="text-muted">{r.text}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
```

- [ ] **Step 2: Mount RunMonitor in `AgentDemo.jsx`**

Add `import RunMonitor from './RunMonitor'` and replace the line `{/* RunMonitor is added here in Task 5 */}` with:

```jsx
        <RunMonitor reduced={reduced} inView={inView} />
```

- [ ] **Step 3: Row slide-in CSS in `src/index.css`**

Add before the `@media (prefers-reduced-motion: reduce)` block:

```css
/* Monitoring strip: each newly mounted row slides in */
@keyframes monitor-in {
  from { opacity: 0; transform: translateY(-6px); }
  to { opacity: 1; transform: none; }
}
.monitor-row {
  animation: monitor-in 400ms ease both;
}
```

and inside the reduced-motion block add `.monitor-row { animation: none; }`.

- [ ] **Step 4: Create `src/components/AzureStrip.jsx`**

```jsx
import { stack } from '../content/site'

export default function AzureStrip() {
  return (
    <section id="stack" className="theme-fade border-y border-line bg-surface/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-3 md:max-w-md">
          <p className="text-sm font-medium text-ink">{stack.line}</p>
          {stack.draft && (
            <span className="rounded-full border border-dashed border-accent px-2 py-0.5 text-xs font-medium text-accent">
              Draft copy
            </span>
          )}
        </div>
        <ul className="flex flex-wrap gap-2" aria-label="Platforms we build on">
          {stack.chips.map((c) => (
            <li
              key={c.label}
              className={
                c.primary
                  ? 'rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primaryInk'
                  : 'rounded-full border border-line px-3 py-1 text-xs text-ink/80'
              }
            >
              {c.label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
```

- [ ] **Step 5: Mount AzureStrip in `src/App.jsx`**

Add `import AzureStrip from './components/AzureStrip'` and render `<AzureStrip />` directly after `<Pillars />`.

- [ ] **Step 6: Lint, build, test, commit**

Run: `npm run lint && npm run build && npm test` — all pass; report gzip.

```bash
git add src/components/RunMonitor.jsx src/components/AzureStrip.jsx src/components/AgentDemo.jsx src/App.jsx src/index.css
git commit -m "feat: illustrative run-monitor strip and Built on Azure strip

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Docs and final checks

**Files:**
- Modify: `CLAUDE.md`, `PROMPT_LOG.md`

- [ ] **Step 1: `CLAUDE.md` working conventions**

Replace the bullet starting `- Agent-demo scenarios in \`site.js\` are invented` (and its continuation line) with:

```markdown
- Agent-demo workflows (`workflows` in `site.js`) and the monitoring `runLog` are
  invented and must stay flagged illustrative. Agent capability labels are
  placeholders until the team confirms the real Azure services. No digits in
  workflow or run-log text; node titles ≤ 26 characters; nodes must fit the
  760 × 520 canvas without overlapping (`npm test` enforces all of this).
- Workflow run logic lives in `src/workflow/run.js` (pure, tested); components only
  render its output.
```

Leave every other line unchanged.

- [ ] **Step 2: Hardcoded colour check**

Run: `grep -rnE "#[0-9a-fA-F]{3,6}\b" src/components src/workflow`
Expected: no output.

- [ ] **Step 3: Final verification**

Run: `npm run lint && npm run build && npm test` — all pass. Note the gzip size of the main JS chunk.

- [ ] **Step 4: `PROMPT_LOG.md`**

Append under the "## 2026-10-01 — workflow graph round" section:

```markdown
- Built the workflow graph as hand-drawn SVG + positioned buttons from data in
  `site.js`, with pure run logic in `src/workflow/run.js` (no new dependencies;
  React Flow was rejected because it would exceed the bundle budget). Final bundle:
  <gzip from Step 3> gzip (budget 71 kB). Browser checklist: run by the controller
  after this commit.
```

Replace `<gzip from Step 3>` with the actual figure before committing.

- [ ] **Step 5: Commit**

```bash
git add CLAUDE.md PROMPT_LOG.md
git commit -m "docs: workflow graph conventions and prompt log

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
