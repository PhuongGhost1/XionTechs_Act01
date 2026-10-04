// The printer tape (station 05): a pure model that turns the ported run logic (run.js, journey.js)
// into the rows of a paper strip, and the strip into depth. No DOM, no React: the components only
// render what these return, and the tests walk every scenario, drill and decision.
//
// A row is one printed line (or a ruled mark between lines). Rows are keyed by what they are, so a
// row that is already on the strip keeps its key while the run moves on, and only the newest row
// mounts (and prints). The rows are recomputed from the tick every time: a retry strikes an earlier
// row, a decision turns the sign box into a stamp, a compaction folds three rows away, all as a
// function of (run, tick), so pausing, replaying and jumping to the final state agree.
//
// Row shapes:
//   { key, kind: 'line',  cells: [cell], split, struck?, outcome?, abort?, retry?, recovered?, folded? }
//   { key, kind: 'perf' }                     the perforation row after a router
//   { key, kind: 'head',  cells: [cell, cell] } the two branch heads (taken, not taken)
//   { key, kind: 'note',  cells: [cell] }       a drill's problem, flagged once
//   { key, kind: 'sign',  verb, decision, results, approveTo, rejectTo } the approval wait, then the stamp
//   { key, kind: 'stub',  decision }          the slip that tears off the outcome (decoration)
//   { key, kind: 'fold',  cells: [cell], labels } a compaction: three lines folded into one
// A cell is { id, col: 0 | 1 | 'all', type, text, prefix?, fault?, tag?: { text, pending?, plain? } }.
// Nothing here prints a number: a line has no counter, the order is the paper.

import { journeyEvents } from './journey.js'
import { stateAt, totalTicks } from './run.js'

/** Row heights in px on the pinned, stacked tape. The flowing tape sizes itself. */
export const ROW_H = Object.freeze({ line: 48, retry: 62, perf: 22, head: 30, note: 30, sign: 124, fold: 40, stub: 0 })

const byId = (workflow) => Object.fromEntries(workflow.nodes.map((n) => [n.id, n]))

/**
 * Which branch column the strip splits into after a router: the branch whose path holds the node
 * the run goes to next. -1 when the run never passes a router, or the scenario has one branch.
 */
export function splitColumn(workflow, run) {
  if (workflow.branches.length < 2) return -1
  const nodes = byId(workflow)
  const routerStep = run.steps.findIndex((s) => s.some((id) => nodes[id].type === 'router'))
  if (routerStep < 0 || !run.steps[routerStep + 1]) return -1
  const next = run.steps[routerStep + 1][0]
  const col = workflow.branches.findIndex((b) => b.path.flat().includes(next))
  return Math.min(1, Math.max(0, col))
}

/** The right-hand tag of a step: its capability (a placeholder, always pending) or its type word. */
const tagFor = (node, agent) =>
  node.type === 'agent'
    ? { text: agent.capabilities[node.cap]?.text ?? '', pending: true }
    : { text: agent.types[node.type]?.text ?? '', pending: false }

/**
 * The rows of a workflow run at `tick`. `agent` is content.agent. A run that waits for the visitor
 * ends with the sign row; a finished run ends with the outcome row and its tear-off stub.
 */
export function workflowRows(workflow, run, tick, agent) {
  const nodes = byId(workflow)
  const end = Math.min(tick, totalTicks(run))
  const col = splitColumn(workflow, run)
  const rows = []
  let routerAt = -1
  let afterRouter = false
  let problemFlagged = false

  const cell = (id, extra) => {
    const node = nodes[id]
    return {
      id,
      type: node.type,
      col: afterRouter && node.type !== 'outcome' ? col : 'all',
      text: node.text,
      tag: tagFor(node, agent),
      ...extra,
    }
  }

  for (let t = 0; t <= end; t += 1) {
    if (t % 2 === 0) {
      const step = run.steps[t / 2]
      if (!step) continue
      if (run.retries.has(t / 2)) {
        // The step prints again below the struck line, with the one-word fault.
        const c = cell(step[0], { prefix: agent.tape.retry.text })
        if (run.fault) c.fault = run.fault
        rows.push({ key: `retry.${step[0]}.${t / 2}`, kind: 'line', cells: [c], split: c.col !== 'all', retry: true })
        continue
      }
      const cells = step.map((id, i) => cell(id, step.length > 1 ? { col: i } : undefined))
      const row = { key: `n.${step.join('+')}`, kind: 'line', cells, split: cells.some((c) => c.col !== 'all') }
      const outcomeId = step.find((id) => nodes[id].type === 'outcome')
      if (outcomeId) {
        row.outcome = true
        row.abort = run.decision === 'reject' && (workflow.decision?.reject ?? []).includes(outcomeId)
      }
      rows.push(row)
      for (const id of step) {
        if (nodes[id].type === 'router' && col >= 0) {
          routerAt = t / 2
          afterRouter = true
        }
        if (run.drillId && run.problemNodeId === id && run.retries.size === 0 && !problemFlagged) {
          problemFlagged = true
          const drill = workflow.drills.find((d) => d.id === run.drillId)
          rows.push({
            key: `note.${id}`,
            kind: 'note',
            cells: [{ id, col: 'all', type: 'note', text: drill.label, prefix: agent.tape.problem.text }],
          })
        }
        if (id === workflow.decision?.nodeId) {
          const { decision } = workflow
          rows.push({
            key: 'sign',
            kind: 'sign',
            verb: decision.text,
            decision: run.decision,
            results: decision.log,
            approveTo: decision.approve.map((x) => nodes[x].text),
            rejectTo: decision.reject.map((x) => nodes[x].text),
          })
        }
      }
    } else {
      const next = (t + 1) / 2
      const prev = (t - 1) / 2
      if (prev === routerAt) {
        // The router printed on the previous tick: a perforation, then the two heads, split the strip.
        const taken = workflow.branches[col]
        const other = workflow.branches[1 - col]
        rows.push({ key: 'perf', kind: 'perf' })
        rows.push({
          key: 'head',
          kind: 'head',
          cells: [
            { id: taken.id, col, type: 'head', text: taken.label },
            { id: other.id, col: 1 - col, type: 'head', text: other.label, tag: { text: agent.tape.notTaken.text }, dim: true },
          ].sort((a, b) => a.col - b.col),
        })
      }
      if (run.retries.has(next)) {
        // The line that failed is struck through; the retry prints on the next tick.
        const original = rows.find((r) => r.key === `n.${run.steps[next][0]}`)
        if (original) original.struck = true
      }
      if (run.retries.has(prev)) {
        const retried = rows.find((r) => r.retry && r.cells[0].id === run.steps[prev][0])
        if (retried) retried.recovered = true
      }
    }
  }
  if (stateAt(run, end).done) rows.push({ key: 'stub', kind: 'stub', decision: run.decision })
  return rows
}

/**
 * The rows of the "Agent at work" view at `tick`: one column, one line per stop, a compaction stop
 * folds the three lines before it into one folded line (which stays). The first line is the agent
 * and its task; the last, once the task is done, is the outcome with its tear-off stub.
 */
export function journeyRows(journey, tick, agent) {
  const events = journeyEvents(journey)
  const rows = [
    {
      key: 'j.head',
      kind: 'line',
      split: false,
      cells: [{ id: 'agent', col: 'all', type: 'trigger', text: agent.agentName.text, tag: { text: journey.text, plain: true } }],
    },
  ]
  for (let e = 0; e <= tick && e < events.length; e += 1) {
    const ev = events[e]
    if (ev.phase !== 'working' || ev.drain) continue
    const stop = journey.stops[ev.stop]
    if (stop.kind === 'compact') {
      const folded = []
      for (let i = ev.stop - 1; i >= 0 && folded.length < 3; i -= 1) {
        const row = rows.find((r) => r.key === `j.${i}`)
        if (row && !row.folded) {
          row.folded = true
          folded.unshift(journey.stops[i].text)
        }
      }
      rows.push({
        key: `j.fold.${ev.stop}`,
        kind: 'fold',
        labels: folded,
        cells: [{ id: stop.id, col: 'all', type: 'compact', prefix: agent.prefixes.compact.text, text: folded.join(' + '), tag: { text: agent.tape.folded.text, plain: true } }],
      })
    } else {
      rows.push({
        key: `j.${ev.stop}`,
        kind: 'line',
        split: false,
        cells: [{ id: stop.id, col: 'all', type: stop.kind, prefix: agent.prefixes[stop.kind].text, text: stop.text, tag: { text: stop.doing, plain: true } }],
      })
    }
  }
  if (tick >= events.length) {
    rows.push({
      key: 'j.done',
      kind: 'line',
      split: false,
      outcome: true,
      cells: [{ id: 'done', col: 'all', type: 'outcome', text: agent.tape.complete.text, tag: { text: journey.text, plain: true } }],
    })
    rows.push({ key: 'stub', kind: 'stub', decision: null })
  }
  return rows
}

// -- depth ------------------------------------------------------------------------------------------

/**
 * How the strip recedes. A row's distance `y` is the height of everything printed after it (how far
 * it has risen from the slot). The newest row sits at the slot; older rows drift back in z, tilt
 * away and fade. `floor` is the opacity at the farthest visible row: the ink of a faded row is
 * ink-2, and ink-2 at this opacity on the paper still clears 4.5:1 (tape.test.js computes it from
 * the tokens), so a row that is still readable is readable, and the rest is gone (opacity 0).
 */
export const DEPTH = Object.freeze({ visible: 408, floor: 0.7, zPerPx: 0.4, rxPerPx: 0.03, rxMax: 12 })

export function depthAt(y) {
  const f = Math.min(1, y / DEPTH.visible)
  return {
    z: -Math.round(y * DEPTH.zPerPx) || 0,
    rx: Math.round(Math.min(y * DEPTH.rxPerPx, DEPTH.rxMax) * 100) / 100,
    o: y > DEPTH.visible ? 0 : Math.round((1 - (1 - DEPTH.floor) * f) * 1000) / 1000,
  }
}

/** Rows with their stacking: { row, h, y, z, rx, o }, in the order of the rows (oldest first). */
export function stackLayout(rows) {
  const out = new Array(rows.length)
  let y = 0
  for (let i = rows.length - 1; i >= 0; i -= 1) {
    const row = rows[i]
    const h = row.folded ? 0 : (row.retry ? ROW_H.retry : (ROW_H[row.kind] ?? ROW_H.line))
    out[i] = { row, h, y, ...depthAt(y) }
    y += h
  }
  return out
}
