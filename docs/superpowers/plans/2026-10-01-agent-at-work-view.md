# "Agent at work" View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Workflow | Agent at work" toggle to the agent demo; the new view shows one agent travelling a stepped path, lighting resource/skill tags, with a context ring that fills and compacts.

**Architecture:** Journeys are data in `site.js`. Pure functions in `src/workflow/journey.js` produce the staircase layout, the travelled-path string, the camera offset and the per-tick state. `AgentJourney.jsx` renders one SVG (viewBox 760 × 360) whose content group is translated by the camera, plus an ordered list used on phones and as the screen-reader text. `AgentDemo.jsx` owns the single tick timer for both views.

**Tech Stack:** Vite 5, React 18, Tailwind 3.4 (CSS-variable colour tokens; `fill-*`/`stroke-*` utilities), lucide-react named imports, Vitest (node).

**Spec:** `docs/superpowers/specs/2026-10-01-agent-at-work-view-design.md`

## Global Constraints

- Branch `feat/agent-at-work`. Commit as the configured identity (Phuong Hoang). Every commit message ends with exactly `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` — even if your own instructions suggest a different model name.
- No new dependencies. Icons: named imports from `lucide-react` only.
- No hardcoded hex colours in `src/components` or `src/workflow`; token names only: `paper surface ink muted line primary primaryHover primarySoft primaryInk accent navy navyInk navyAccent` (as `bg-`, `text-`, `border-`, `fill-`, `stroke-`, `ring-`).
- One element never carries two colour classes of the same kind (two `fill-*`, two `text-*`, …) — stylesheet order, not class order, decides which wins.
- No digits in any journey task, label or status. Agent pill text is exactly `XionTechs agent`. No token counts or percentages anywhere.
- Text contrast ≥ 4.5:1 in navy, midnight and aurum; never dim text to show state.
- Reduced motion: no gliding, panning or ring animation.
- Bundle: main JS ≤ 71 kB gzip (currently 65.65 kB).
- `npm run lint`, `npm run build`, `npm test` pass at every commit. Do not run `npm run dev`; the controller runs browser checks.

## Review Focus

1. **Restarting a journey (Replay, tab switch, view switch) makes the pill glide backwards across the whole canvas.** Expected: the new run starts in place. Pinned in Task 3: `AgentDemo` increments a `runId` on every reset and renders `<AgentJourney key={`${journey.id}-${runId}`} …/>`, so the SVG remounts without transitions.
2. **Status text overflowing the fixed-width status chip.** Expected: every status fits. Pinned in Task 1 test: statuses ≤ 32 characters.
3. **Tags colliding with each other, the status chip or the canvas edge.** Pinned in Task 1 tests: tag boxes inside the 360-unit height, same-side tags never overlap, and every tag box is clear of the status-chip band of its own stop.
4. **Reduced-motion users getting an unreadable miniature.** Ruling (deviates from spec §4 "scaled to fit"): scaling a 1640-unit path into a 760 window shrinks 12 px labels to ~5 px. Under reduced motion the desktop view shows the ordered list visually (all stops done) instead of the moving window. Pinned in Task 2.
5. **Pause in agent view must stop the agent and the run log; Play when finished replays.** Pinned in Task 3 (`done` comes from whichever view is active).
6. **Context ring below 3:1 in aurum** (spec §4 said `stroke-primary`, which is gold on white, 2.15:1). Ruling: ring fill is `stroke-ink` normally and `stroke-accent` while compacting; pinned in Task 2 code.

---

## File map

| Path | Responsibility |
|---|---|
| `src/content/site.js` | `agentJourneys` (Task 1) |
| `src/content/site.test.js` | journey content rules (Task 1) |
| `src/workflow/journey.js` (+ test) | `JOURNEY_VIEW`, `TAG_H`, `tagWidth`, `layoutJourney`, `pathUpTo`, `cameraX`, `journeyEvents`, `journeyTicks`, `journeyStateAt` (Task 1) |
| `src/components/AgentJourney.jsx` | SVG window + ordered list (Task 2) |
| `src/components/AgentDemo.jsx` | view toggle, shared timer, controls, status line (Task 3) |
| `CLAUDE.md`, `PROMPT_LOG.md`, `content/TODO.md` | docs (Task 3) |

---

### Task 1: Journey data and pure logic

**Files:**
- Create: `src/workflow/journey.js`, `src/workflow/journey.test.js`
- Modify: `src/content/site.js`, `src/content/site.test.js`

**Interfaces:**
- Produces (`site.js`): `agentJourneys: { id, task, stops: { kind: 'resource'|'skill'|'compact', label?, status }[] }[]`, ids `support`, `inventory`, `factory`.
- Produces (`journey.js`):
  - `JOURNEY_VIEW = { w: 760, h: 360 }`, `TAG_H = 24`, `CHIP = { w: 230, h: 28, dy: 22 }`, `PILL = { w: 150, h: 32 }`
  - `tagWidth(label) → number`
  - `layoutJourney(journey) → { points: {x,y}[], path: string, tags: { stopIndex, x, y, w, side }[], width, height }`
  - `pathUpTo(layout, stopIndex) → string`
  - `cameraX(layout, stopIndex) → number`
  - `journeyEvents(journey) → { stop, phase: 'moving'|'working', drain: boolean }[]`
  - `journeyTicks(journey) → number`
  - `journeyStateAt(journey, tick) → { stopIndex, phase, ringFill, compacting, lit: Set<number>, status, done }`

- [ ] **Step 1: Write failing logic tests**

Create `src/workflow/journey.test.js`:

```js
import { describe, it, expect } from 'vitest'
import {
  JOURNEY_VIEW, TAG_H, CHIP, tagWidth, layoutJourney, pathUpTo, cameraX,
  journeyEvents, journeyTicks, journeyStateAt,
} from './journey'

const j = {
  id: 't',
  task: 'Test task',
  stops: [
    { kind: 'resource', label: 'a/one', status: 'One' },
    { kind: 'skill', label: 'skills/two', status: 'Two' },
    { kind: 'compact', status: 'Compacting context…' },
    { kind: 'resource', label: 'c/three', status: 'Three' },
    { kind: 'resource', label: 'd/four', status: 'Four' },
  ],
}

describe('layoutJourney', () => {
  const L = layoutJourney(j)

  it('places stops left to right on alternating levels', () => {
    expect(L.points.map((p) => p.x)).toEqual([120, 320, 520, 720, 920])
    expect(L.points.map((p) => p.y)).toEqual([140, 220, 140, 220, 140])
    expect(L.width).toBe(1040)
    expect(L.height).toBe(JOURNEY_VIEW.h)
  })

  it('draws an orthogonal path with a lead-in and lead-out', () => {
    expect(L.path).toBe('M 0 140 H 120 H 220 V 220 H 320 H 420 V 140 H 520 H 620 V 220 H 720 H 820 V 140 H 920 H 1040')
  })

  it('gives every non-compact stop a tag, above on the upper level and below on the lower', () => {
    expect(L.tags.map((t) => [t.stopIndex, t.side, t.y])).toEqual([
      [0, 'above', 60], [1, 'below', 300], [3, 'below', 300], [4, 'above', 60],
    ])
    expect(L.tags[0].w).toBe(tagWidth('a/one'))
  })

  it('cuts the travelled path at the requested stop', () => {
    expect(pathUpTo(L, 0)).toBe('M 0 140 H 120')
    expect(pathUpTo(L, 2)).toBe('M 0 140 H 120 H 220 V 220 H 320 H 420 V 140 H 520')
  })

  it('centres the camera on the stop but never scrolls past the canvas', () => {
    expect(cameraX(L, 0)).toBe(0)
    expect(cameraX(L, 2)).toBe(520 - 380)
    expect(cameraX(L, 4)).toBe(1040 - 760)
  })
})

describe('journey timeline', () => {
  it('moves then works at every stop, with an extra draining tick at the compaction', () => {
    expect(journeyEvents(j).map((e) => `${e.stop}${e.phase[0]}${e.drain ? 'd' : ''}`)).toEqual([
      '0m', '0w', '1m', '1w', '2m', '2w', '2wd', '3m', '3w', '4m', '4w',
    ])
    expect(journeyTicks(j)).toBe(11)
  })

  it('reports the current stop, phase and status', () => {
    const s = journeyStateAt(j, 3)
    expect(s.stopIndex).toBe(1)
    expect(s.phase).toBe('working')
    expect(s.status).toBe('Two')
    expect(s.done).toBe(false)
  })

  it('lights visited non-compact stops only', () => {
    expect([...journeyStateAt(j, 2).lit]).toEqual([0])
    expect([...journeyStateAt(j, 3).lit]).toEqual([0, 1])
    expect([...journeyStateAt(j, 8).lit]).toEqual([0, 1, 3])
  })

  it('fills the ring before compaction, flags compaction, drains, then refills', () => {
    const fill = (t) => journeyStateAt(j, t).ringFill
    expect(fill(0)).toBe(0)
    expect(fill(1)).toBeCloseTo(0.425)
    expect(fill(3)).toBeCloseTo(0.85)
    expect(journeyStateAt(j, 5).compacting).toBe(true)
    expect(fill(5)).toBeCloseTo(0.85)
    expect(journeyStateAt(j, 6).compacting).toBe(true)
    expect(fill(6)).toBeCloseTo(0.15)
    expect(journeyStateAt(j, 7).compacting).toBe(false)
    expect(fill(8)).toBeCloseTo(0.5)
    expect(fill(10)).toBeCloseTo(0.85)
  })

  it('is done at journeyTicks and stays done beyond it', () => {
    for (const t of [11, 50]) {
      const s = journeyStateAt(j, t)
      expect(s.done).toBe(true)
      expect(s.stopIndex).toBe(4)
      expect(s.status).toBe('Task complete')
      expect(s.compacting).toBe(false)
      expect([...s.lit]).toEqual([0, 1, 3, 4])
    }
  })

  it('keeps the ring within bounds on every tick', () => {
    for (let t = 0; t <= journeyTicks(j); t++) {
      const f = journeyStateAt(j, t).ringFill
      expect(f >= 0 && f <= 1).toBe(true)
    }
  })

  it('sizes tags from the label length', () => {
    expect(tagWidth('abc')).toBe(3 * 7.2 + 34)
    expect(TAG_H).toBe(24)
    expect(CHIP).toEqual({ w: 230, h: 28, dy: 22 })
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/workflow/journey.test.js`
Expected: FAIL — cannot find module `./journey`.

- [ ] **Step 3: Implement `src/workflow/journey.js`**

```js
// Pure logic for the "Agent at work" view: staircase layout, camera and per-tick state.
// Components only render what these return.

export const JOURNEY_VIEW = { w: 760, h: 360 }
export const TAG_H = 24
export const CHIP = { w: 230, h: 28, dy: 22 } // status chip under the pill; dy = gap below the stop point
export const PILL = { w: 150, h: 32 }

const PAD = 120
const STEP_X = 200
const LEVELS = [140, 220]
const TAG_OFFSET = 80
const CHAR_W = 7.2 // monospace text-xs advance width in viewBox units
const FILL_MAX = 0.85
const FILL_MIN = 0.15

export const tagWidth = (label) => label.length * CHAR_W + 34

export function layoutJourney(journey) {
  const points = journey.stops.map((_, i) => ({ x: PAD + i * STEP_X, y: LEVELS[i % 2] }))
  const last = points[points.length - 1]
  const tags = []
  journey.stops.forEach((stop, i) => {
    if (stop.kind === 'compact') return
    const side = i % 2 === 0 ? 'above' : 'below'
    const y = side === 'above' ? points[i].y - TAG_OFFSET : points[i].y + TAG_OFFSET
    tags.push({ stopIndex: i, x: points[i].x, y, w: tagWidth(stop.label), side })
  })
  const layout = { points, tags, width: last.x + PAD, height: JOURNEY_VIEW.h }
  layout.path = `${pathUpTo(layout, points.length - 1)} H ${layout.width}`
  return layout
}

export function pathUpTo(layout, stopIndex) {
  const { points } = layout
  let d = `M 0 ${points[0].y} H ${points[0].x}`
  for (let i = 1; i <= stopIndex; i++) {
    const a = points[i - 1]
    const b = points[i]
    const mid = (a.x + b.x) / 2
    d += ` H ${mid} V ${b.y} H ${b.x}`
  }
  return d
}

export function cameraX(layout, stopIndex) {
  const target = layout.points[stopIndex].x - JOURNEY_VIEW.w / 2
  return Math.max(0, Math.min(target, layout.width - JOURNEY_VIEW.w))
}

export function journeyEvents(journey) {
  const events = []
  journey.stops.forEach((stop, i) => {
    events.push({ stop: i, phase: 'moving', drain: false })
    events.push({ stop: i, phase: 'working', drain: false })
    if (stop.kind === 'compact') events.push({ stop: i, phase: 'working', drain: true })
  })
  return events
}

export const journeyTicks = (journey) => journeyEvents(journey).length

// Ring level once stop `i` has finished working.
function fillAfter(journey, i) {
  const c = journey.stops.findIndex((s) => s.kind === 'compact')
  if (c === -1) {
    const n = journey.stops.length
    return (FILL_MAX * (i + 1)) / n
  }
  if (i < c) return (FILL_MAX * (i + 1)) / c
  if (i === c) return FILL_MIN
  const after = journey.stops.length - c - 1
  return FILL_MIN + ((FILL_MAX - FILL_MIN) * (i - c)) / after
}

export function journeyStateAt(journey, tick) {
  const events = journeyEvents(journey)
  const lastStop = journey.stops.length - 1
  const lit = new Set()
  const litUpTo = (upTo) => {
    journey.stops.forEach((s, i) => {
      if (i <= upTo && s.kind !== 'compact') lit.add(i)
    })
  }

  if (tick >= events.length) {
    litUpTo(lastStop)
    return {
      stopIndex: lastStop, phase: 'working', ringFill: fillAfter(journey, lastStop),
      compacting: false, lit, status: 'Task complete', done: true,
    }
  }

  const ev = events[tick]
  const stop = journey.stops[ev.stop]
  litUpTo(ev.phase === 'working' ? ev.stop : ev.stop - 1)

  let ringFill = ev.stop === 0 ? 0 : fillAfter(journey, ev.stop - 1)
  if (ev.phase === 'working' && stop.kind !== 'compact') ringFill = fillAfter(journey, ev.stop)
  if (stop.kind === 'compact' && ev.drain) ringFill = FILL_MIN

  return {
    stopIndex: ev.stop,
    phase: ev.phase,
    ringFill,
    compacting: stop.kind === 'compact' && ev.phase === 'working',
    lit,
    status: stop.status,
    done: false,
  }
}
```

Check against the tests by hand before running: tick 1 (`0w`) → fillAfter(0) = 0.85·1/2 = 0.425; tick 5 (`2w`, compact, not drain) → previous fill fillAfter(1) = 0.85, compacting; tick 6 (`2wd`) → 0.15; tick 8 (`3w`) → 0.15 + 0.7·1/2 = 0.5; tick 10 (`4w`) → 0.85.

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/workflow/journey.test.js` — all pass.

- [ ] **Step 5: Write failing content tests**

In `src/content/site.test.js` add the import `import { layoutJourney, TAG_H, CHIP } from '../workflow/journey'` at the top, and append inside the top-level `describe('site content rules', ...)` block (after the `run log` describe):

```js
  describe('agent journeys', () => {
    it('has exactly one journey per workflow, in the same order', () => {
      expect(site.agentJourneys.map((x) => x.id)).toEqual(site.workflows.map((w) => w.id))
    })

    it('has exactly one compact stop, never first or last', () => {
      for (const jr of site.agentJourneys) {
        const idx = jr.stops.map((s, i) => (s.kind === 'compact' ? i : -1)).filter((i) => i >= 0)
        expect(idx.length, jr.id).toBe(1)
        expect(idx[0] > 0 && idx[0] < jr.stops.length - 1, jr.id).toBe(true)
      }
    })

    it('uses known kinds, unique short labels and short statuses', () => {
      for (const jr of site.agentJourneys) {
        const labels = jr.stops.filter((s) => s.kind !== 'compact').map((s) => s.label)
        expect(new Set(labels).size).toBe(labels.length)
        for (const s of jr.stops) {
          expect(['resource', 'skill', 'compact']).toContain(s.kind)
          if (s.kind !== 'compact') expect(s.label.length, s.label).toBeLessThanOrEqual(26)
          expect(s.status.length, s.status).toBeLessThanOrEqual(32)
        }
      }
    })

    it('contains no digits', () => {
      for (const jr of site.agentJourneys) {
        const texts = [jr.task, ...jr.stops.flatMap((s) => [s.label ?? '', s.status])]
        for (const t of texts) expect(t, `${jr.id}: ${t}`).not.toMatch(/\d/)
      }
    })

    it('lays tags out inside the canvas without collisions', () => {
      for (const jr of site.agentJourneys) {
        const L = layoutJourney(jr)
        const boxes = L.tags.map((t) => ({ ...t, x0: t.x - t.w / 2, x1: t.x + t.w / 2, y0: t.y - TAG_H / 2, y1: t.y + TAG_H / 2 }))
        for (const b of boxes) {
          expect(b.y0 >= 0 && b.y1 <= L.height && b.x0 >= 0 && b.x1 <= L.width, `${jr.id} tag ${b.stopIndex} inside`).toBe(true)
          // clear of its own stop's status chip band
          const p = L.points[b.stopIndex]
          const chipTop = p.y + CHIP.dy
          const chipBottom = chipTop + CHIP.h
          expect(b.y1 <= chipTop || b.y0 >= chipBottom, `${jr.id} tag ${b.stopIndex} vs chip`).toBe(true)
        }
        for (let a = 0; a < boxes.length; a++) {
          for (let c = a + 1; c < boxes.length; c++) {
            const A = boxes[a]
            const C = boxes[c]
            const overlap = A.x0 < C.x1 && C.x0 < A.x1 && A.y0 < C.y1 && C.y0 < A.y1
            expect(overlap, `${jr.id}: tags ${A.stopIndex}/${C.stopIndex}`).toBe(false)
          }
        }
      }
    })
  })
```

Run: `npm test` — expected FAIL (`site.agentJourneys` undefined).

- [ ] **Step 6: Add the journeys to `src/content/site.js`**

Insert directly after the `runLog` export:

```js
// ILLUSTRATIVE: invented single-agent journeys for the "Agent at work" view, one per workflow
// tab. Not client claims. No digits anywhere (npm test).
export const agentJourneys = [
  {
    id: 'support',
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
```

- [ ] **Step 7: Run all tests, lint, build; commit**

Run: `npm test && npm run lint && npm run build` — all pass. If the layout-collision test fails, report the exact tag pair and stop (do not loosen the test; the controller decides the layout change).

```bash
git add src/workflow/journey.js src/workflow/journey.test.js src/content/site.js src/content/site.test.js
git commit -m "feat: agent journey data and pure staircase/timeline logic

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: AgentJourney component

**Files:**
- Create: `src/components/AgentJourney.jsx`

**Interfaces:**
- Consumes: `layoutJourney`, `pathUpTo`, `cameraX`, `JOURNEY_VIEW`, `TAG_H`, `CHIP`, `PILL` (Task 1); journey shape (Task 1); state from `journeyStateAt`.
- Produces: `<AgentJourney journey state reduced />` (default export). Desktop: SVG window (`hidden lg:block`, or the list when `reduced`); always renders the ordered list (`lg:sr-only` unless `reduced`).

- [ ] **Step 1: Create `src/components/AgentJourney.jsx`**

```jsx
import { useMemo } from 'react'
import { Bot, FileText, RefreshCw, Sparkles } from 'lucide-react'
import { CHIP, JOURNEY_VIEW, PILL, TAG_H, cameraX, layoutJourney, pathUpTo } from '../workflow/journey'

const MOVE = 'transform 700ms ease'
const kindIcon = { resource: FileText, skill: Sparkles }

function Ring({ fill, compacting }) {
  const r = 8
  const c = 2 * Math.PI * r
  return (
    <g>
      <circle r={r} fill="none" strokeWidth="3" className="stroke-line" />
      <circle
        r={r}
        fill="none"
        strokeWidth="3"
        strokeLinecap="round"
        transform="rotate(-90)"
        className={compacting ? 'stroke-accent' : 'stroke-ink'}
        style={{ strokeDasharray: `${fill * c} ${c}`, transition: 'stroke-dasharray 600ms ease' }}
      />
    </g>
  )
}

function JourneyWindow({ journey, state }) {
  const L = useMemo(() => layoutJourney(journey), [journey])
  const p = L.points[state.stopIndex]
  const cam = cameraX(L, state.stopIndex)

  return (
    <svg viewBox={`0 0 ${JOURNEY_VIEW.w} ${JOURNEY_VIEW.h}`} className="block w-full" aria-hidden="true">
      <defs>
        <pattern id="aj-dots" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" className="fill-line" />
        </pattern>
      </defs>
      <rect width={JOURNEY_VIEW.w} height={JOURNEY_VIEW.h} fill="url(#aj-dots)" />
      <g style={{ transform: `translateX(${-cam}px)`, transition: MOVE }}>
        <path d={L.path} fill="none" strokeWidth="2" className="stroke-muted" />
        <path d={pathUpTo(L, state.stopIndex)} fill="none" strokeWidth="2" className="stroke-accent" />

        {L.tags.map((t) => {
          const stop = journey.stops[t.stopIndex]
          const Icon = kindIcon[stop.kind]
          const lit = state.lit.has(t.stopIndex)
          const current = t.stopIndex === state.stopIndex && !state.done
          const pt = L.points[t.stopIndex]
          const stubTo = t.side === 'above' ? t.y + TAG_H / 2 : t.y - TAG_H / 2
          return (
            <g key={stop.label}>
              <line x1={pt.x} y1={pt.y} x2={pt.x} y2={stubTo} strokeWidth="1.5" className={lit ? 'stroke-accent' : 'stroke-muted'} />
              {current && (
                <rect x={t.x - t.w / 2 - 4} y={t.y - TAG_H / 2 - 4} width={t.w + 8} height={TAG_H + 8} rx="10" fill="none" strokeWidth="2" className="stroke-accent" opacity="0.4" />
              )}
              <rect x={t.x - t.w / 2} y={t.y - TAG_H / 2} width={t.w} height={TAG_H} rx="6" strokeWidth="1" className={`fill-paper ${lit ? 'stroke-accent' : 'stroke-muted'}`} />
              <Icon x={t.x - t.w / 2 + 8} y={t.y - 7} width="14" height="14" strokeWidth={1.75} className={lit ? 'text-accent' : 'text-muted'} />
              <text x={t.x - t.w / 2 + 28} y={t.y + 4} className={`font-mono text-xs ${lit ? 'fill-ink' : 'fill-muted'}`}>
                {stop.label}
              </text>
            </g>
          )
        })}

        <g style={{ transform: `translate(${p.x}px, ${p.y}px)`, transition: MOVE }}>
          <rect x={-PILL.w / 2} y={-PILL.h / 2} width={PILL.w} height={PILL.h} rx={PILL.h / 2} className="fill-ink" />
          <Bot x={-PILL.w / 2 + 12} y={-8} width="16" height="16" strokeWidth={1.75} className="text-paper" />
          <text x={-PILL.w / 2 + 34} y="5" className="fill-paper text-sm font-semibold">XionTechs agent</text>

          <g transform={`translate(${-CHIP.w / 2}, ${CHIP.dy})`}>
            <rect width={CHIP.w} height={CHIP.h} rx={CHIP.h / 2} strokeWidth="1" className="fill-surface stroke-line" />
            <g transform={`translate(16, ${CHIP.h / 2})`}>
              <Ring fill={state.ringFill} compacting={state.compacting} />
            </g>
            <text x="32" y={CHIP.h / 2 + 4} className={`text-xs ${state.compacting ? 'fill-accent' : 'fill-ink'}`}>
              {state.status}
            </text>
          </g>
        </g>
      </g>
    </svg>
  )
}

function JourneyList({ journey, state, className }) {
  return (
    <ol className={`space-y-2 border-l-2 border-line pl-4 ${className}`}>
      {journey.stops.map((s, i) => {
        if (s.kind === 'compact') {
          const reached = state.done || i < state.stopIndex
          return (
            <li key={`compact-${i}`} className="flex items-center gap-2 py-1 text-xs font-medium uppercase tracking-wide text-muted">
              <RefreshCw className="h-3.5 w-3.5 text-accent" strokeWidth={1.75} />
              {reached || i === state.stopIndex ? 'Context compacted — continuing' : 'Context check'}
            </li>
          )
        }
        const Icon = kindIcon[s.kind]
        const current = i === state.stopIndex && !state.done
        const lit = state.lit.has(i)
        return (
          <li
            key={s.label}
            aria-current={current ? 'step' : undefined}
            className={`rounded-lg border px-3 py-2 ${current ? 'border-accent bg-paper' : lit ? 'border-muted bg-paper' : 'border-line bg-paper'}`}
          >
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-accent" strokeWidth={1.75} />
              <span className="font-mono text-xs text-ink">{s.label}</span>
              {lit && !current && <span className="ml-auto text-xs text-muted">done</span>}
            </div>
            <p className="mt-1 text-sm text-muted">{s.status}</p>
          </li>
        )
      })}
    </ol>
  )
}

// "Agent at work" view. AgentDemo owns the timer and passes the derived state.
// Under reduced motion the moving window is replaced by the readable list on every screen
// size (a scaled-to-fit path would shrink labels to an unreadable size).
export default function AgentJourney({ journey, state, reduced }) {
  return (
    <div>
      {!reduced && (
        <div className="hidden overflow-hidden rounded-xl border border-line bg-paper lg:block">
          <JourneyWindow journey={journey} state={state} />
        </div>
      )}
      <JourneyList journey={journey} state={state} className={reduced ? '' : 'lg:sr-only'} />
    </div>
  )
}
```

- [ ] **Step 2: Lint, build, test, commit**

The component is mounted in Task 3; lint and build must pass now.

Run: `npm run lint && npm run build && npm test` — all pass.

```bash
git add src/components/AgentJourney.jsx
git commit -m "feat: Agent at work journey window and list

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Toggle in AgentDemo, docs

**Files:**
- Modify: `src/components/AgentDemo.jsx`, `CLAUDE.md`, `PROMPT_LOG.md`

**Interfaces:**
- Consumes: `agentJourneys` (site.js), `journeyTicks`, `journeyStateAt` (journey.js), `AgentJourney` (Task 2).

- [ ] **Step 1: Imports and state**

In `src/components/AgentDemo.jsx`:
- Change the site import to `import { agentJourneys, sections, workflows } from '../content/site'`.
- Add `import { journeyStateAt, journeyTicks } from '../workflow/journey'` and `import AgentJourney from './AgentJourney'`.
- After `const [selectedId, setSelectedId] = useState(null)` add:

```jsx
  const [view, setView] = useState('workflow')
  const [runId, setRunId] = useState(0)
  const viewRefs = useRef([])
```

- [ ] **Step 2: Derived values**

Replace the block from `const total = totalTicks(run)` through `const state = useMemo(() => stateAt(run, shownTick), [run, shownTick])` with:

```jsx
  const journey = agentJourneys.find((j) => j.id === workflow.id)
  const total = view === 'workflow' ? totalTicks(run) : journeyTicks(journey)
  // Derived every render, so turning reduced motion on mid-run jumps to the finished state.
  const shownTick = reduced ? total : tick
  const state = useMemo(() => stateAt(run, shownTick), [run, shownTick])
  const jState = useMemo(() => journeyStateAt(journey, shownTick), [journey, shownTick])
  const done = view === 'workflow' ? state.done : jState.done
```

- [ ] **Step 3: Handlers**

Replace `selectTab` and `replay` with:

```jsx
  function restart() {
    setTick(0)
    setPlaying(true)
    setRunId((r) => r + 1)
  }

  function selectTab(i) {
    setActive(i)
    setBranch(0)
    setSelectedId(null)
    restart()
  }

  function replay() {
    if (view === 'workflow') setBranch((b) => nextBranchIndex(workflow, b))
    restart()
  }

  function selectView(v) {
    setView(v)
    restart()
  }

  function onViewKey(e) {
    if (!['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(e.key)) return
    e.preventDefault()
    const next = view === 'workflow' ? 'agent' : 'workflow'
    selectView(next)
    viewRefs.current[next === 'workflow' ? 0 : 1]?.focus()
  }
```

- [ ] **Step 4: Controls row**

Replace the whole `{(!reduced || workflow.branches.length > 1) && ( … )}` block (the controls next to the illustrative badge) with:

```jsx
          <div className="flex flex-wrap items-center gap-3">
            <div role="radiogroup" aria-label="Demo view" className="flex rounded-full border border-line p-1" onKeyDown={onViewKey}>
              {[
                ['workflow', 'Workflow'],
                ['agent', 'Agent at work'],
              ].map(([id, label], i) => {
                const on = view === id
                return (
                  <button
                    key={id}
                    ref={(el) => {
                      viewRefs.current[i] = el
                    }}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    tabIndex={on ? 0 : -1}
                    onClick={() => selectView(id)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition ${on ? 'bg-primary text-primaryInk' : 'text-ink/70 hover:text-primary'}`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
            {!reduced && (
              <button
                type="button"
                onClick={() => (done ? replay() : setPlaying((p) => !p))}
                aria-label={playing && !done ? 'Pause animation' : 'Play animation'}
                className={btn}
              >
                {playing && !done ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>
            )}
            {view === 'workflow' && workflow.branches.length > 1 && (
              <button type="button" onClick={replay} aria-label="Replay with the next path" className={btn}>
                <RotateCcw className="h-4 w-4" />
              </button>
            )}
            {view === 'agent' && !reduced && (
              <button type="button" onClick={replay} aria-label="Replay the task" className={btn}>
                <RotateCcw className="h-4 w-4" />
              </button>
            )}
          </div>
```

- [ ] **Step 5: View body**

Replace the content of `<div className="mt-6"> … </div>` (graph, list, status line and aside) with:

```jsx
        <div className="mt-6">
          {view === 'workflow' ? (
            <>
              <div className="hidden lg:block">
                <WorkflowGraph
                  workflow={workflow}
                  run={run}
                  state={state}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  reduced={reduced}
                />
              </div>
              <WorkflowList workflow={workflow} run={run} state={state} className="lg:sr-only" />
              <p className="mt-4 text-sm text-muted" aria-live="polite">
                {state.done ? `Run complete · took the “${run.branchLabel}” path` : `Running · ${run.branchLabel} path`}
              </p>
              <aside className="mt-4 hidden rounded-xl border border-line bg-paper p-4 lg:block" aria-live="polite">
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
            </>
          ) : (
            <>
              <p className="mb-3 text-sm font-medium text-ink">Agent at work · {journey.task}</p>
              <AgentJourney key={`${journey.id}-${runId}`} journey={journey} state={jState} reduced={reduced} />
              <p className="mt-4 text-sm text-muted" aria-live="polite">
                {jState.done ? `Task complete · ${journey.task}` : `Running · ${journey.task}`}
              </p>
            </>
          )}
        </div>
```

Also wrap the existing `<WorkflowGraph … />` usage so it remounts on restart: change its parent `<div className="hidden lg:block">` to `<div key={runId} className="hidden lg:block">` (packets restart cleanly).

- [ ] **Step 6: Verify the timer effect needs no change**

The timer effect depends on `[reduced, playing, inView, tick, total]`; `total` now follows the active view, and every reset path calls `restart()` which sets `tick` to 0 in the same handler. Confirm no other code references the removed `state.done` in controls (`grep -n "state.done" src/components/AgentDemo.jsx` should only show the workflow status line).

- [ ] **Step 7: Docs**

`CLAUDE.md`, under "Working conventions", add after the workflow bullets:

```markdown
- The agent demo has two views: the workflow graph and "Agent at work" (`agentJourneys` in
  `site.js`, pure logic in `src/workflow/journey.js`). Journeys are illustrative; the agent
  pill always reads "XionTechs agent" — never another vendor's product or model name — and no
  token counts or other numbers are shown.
```

`PROMPT_LOG.md`, append at the end:

```markdown
## 2026-10-01 — "Agent at work" view (Phuong Hoang + Claude)
- User shared Relevance AI's "Cowork & Codex" animation (one agent travelling a stepped path,
  picking up files/skills, context ring compacting) and asked to build the same. Built as a
  second view behind a "Workflow | Agent at work" toggle, one journey per scenario tab, using
  the same tick timer as the graph (continuous animation rejected to avoid a second timing
  system).
- Deliberate differences from the reference: the pill says "XionTechs agent", not a competitor's
  product/model name; the context ring fills visually with no token counts (any number would be
  invented); under reduced motion a readable list replaces the moving window instead of a
  scaled-down path whose labels would be unreadable.
```

- [ ] **Step 8: Verify and commit**

Run: `npm run lint && npm run build && npm test` — all pass; report gzip (≤ 71 kB).
Run: `grep -rnE "#[0-9a-fA-F]{3,6}\b" src/components src/workflow` — expect no output.

```bash
git add src/components/AgentDemo.jsx CLAUDE.md PROMPT_LOG.md
git commit -m "feat: Workflow | Agent at work toggle in the agent demo

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
