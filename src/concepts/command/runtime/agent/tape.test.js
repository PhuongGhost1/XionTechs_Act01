import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { agent } from '../../content/agent.js'
import { journeyTicks } from './journey.js'
import { buildRun, nextBranchIndex, totalTicks } from './run.js'
import { DEPTH, ROW_H, depthAt, journeyRows, splitColumn, stackLayout, workflowRows } from './tape.js'

const wf = (id) => agent.workflows.find((w) => w.id === id)
const support = wf('support')
const factory = wf('factory')
const texts = (rows) => rows.flatMap((r) => (r.cells ?? []).map((c) => c.text))
const keys = (rows) => rows.map((r) => r.key)

describe('workflowRows', () => {
  it('prints the trigger first, one line per step, and stops at the approval with the sign box', () => {
    const run = buildRun(support, 0)
    expect(keys(workflowRows(support, run, 0, agent))).toEqual(['n.email'])
    const waiting = workflowRows(support, run, totalTicks(run), agent)
    expect(texts(waiting)).toEqual(['New support email', 'Triage agent', 'AI routing', 'Refund request', 'Order status', 'Refund agent', 'Human approves'])
    expect(waiting.at(-1).kind).toBe('sign')
    expect(waiting.at(-1).decision).toBe(null)
    expect(waiting.some((r) => r.kind === 'stub')).toBe(false)
  })

  it('keeps every earlier row (same keys, same order) as the run moves on', () => {
    const run = buildRun(support, 0, { decision: 'approve' })
    let before = []
    for (let t = 0; t <= totalTicks(run); t += 1) {
      const now = keys(workflowRows(support, run, t, agent))
      expect(now.slice(0, before.length), `tick ${t}`).toEqual(before)
      before = now
    }
  })

  it('splits the strip after a router: a perforation, then the taken branch and the other one, not taken', () => {
    const run = buildRun(support, 0)
    const rows = workflowRows(support, run, totalTicks(run), agent)
    const perf = rows.findIndex((r) => r.kind === 'perf')
    expect(rows[perf - 1].cells[0].type).toBe('router')
    const head = rows[perf + 1]
    expect(head.kind).toBe('head')
    expect(head.cells.map((c) => [c.col, c.text])).toEqual([[0, 'Refund request'], [1, 'Order status']])
    expect(head.cells[1].tag.text).toBe(agent.tape.notTaken.text)
    // The refund branch is column 0, the status branch column 1.
    expect(rows.find((r) => r.key === 'n.refund').cells[0].col).toBe(0)
    const status = buildRun(support, 1)
    const sRows = workflowRows(support, status, totalTicks(status), agent)
    expect(sRows.find((r) => r.key === 'n.lookup').cells[0].col).toBe(1)
    expect(sRows.find((r) => r.key === 'n.reply').split).toBe(true)
  })

  it('prints the outcome across the full width, with its tear-off stub, once the run is done', () => {
    const run = buildRun(support, 0, { decision: 'approve' })
    const rows = workflowRows(support, run, totalTicks(run), agent)
    const out = rows.find((r) => r.outcome)
    expect(out.cells[0]).toMatchObject({ text: 'Customer answered', col: 'all' })
    expect(out.abort).toBe(false)
    expect(rows.at(-1).kind).toBe('stub')
    expect(rows.find((r) => r.kind === 'sign').decision).toBe('approve')
  })

  it('marks a rejected outcome as aborted, and no other', () => {
    const run = buildRun(support, 0, { decision: 'reject' })
    const rows = workflowRows(support, run, totalTicks(run), agent)
    expect(rows.find((r) => r.outcome)).toMatchObject({ abort: true })
    expect(rows.find((r) => r.outcome).cells[0].text).toBe('Sent back with a note')
    const plain = buildRun(support, 1)
    expect(workflowRows(support, plain, totalTicks(plain), agent).find((r) => r.outcome).abort).toBe(false)
  })

  it('strikes the failed line and reprints it below with the fault, on a retry drill', () => {
    const run = buildRun(support, 0, { drillId: 'support.timeout' })
    const r = [...run.retries][0]
    const before = workflowRows(support, run, 2 * r - 2, agent)
    expect(before.find((x) => x.key === 'n.lookup').struck).toBeUndefined()
    const failing = workflowRows(support, run, 2 * r - 1, agent)
    expect(failing.find((x) => x.key === 'n.lookup').struck).toBe(true)
    expect(failing.some((x) => x.retry)).toBe(false)
    const retrying = workflowRows(support, run, 2 * r, agent)
    const reprint = retrying.find((x) => x.retry)
    expect(retrying.indexOf(reprint)).toBe(retrying.findIndex((x) => x.key === 'n.lookup') + 1)
    expect(reprint.cells[0]).toMatchObject({ text: 'Order lookup agent', fault: 'Timeout', prefix: agent.tape.retry.text })
    expect(reprint.recovered).toBeUndefined()
    expect(workflowRows(support, run, 2 * r + 1, agent).find((x) => x.retry).recovered).toBe(true)
  })

  it('flags the problem of a drill without a retry, once, and prints a parallel step as two cells of one row', () => {
    const run = buildRun(support, 0, { drillId: 'support.unclear' })
    const rows = workflowRows(support, run, totalTicks(run), agent)
    expect(rows.filter((r) => r.kind === 'note')).toHaveLength(1)
    expect(rows.find((r) => r.kind === 'note').cells[0].text).toBe('Customer request is unclear')
    expect(rows.some((r) => r.kind === 'perf')).toBe(false)
    const par = buildRun(factory, 0)
    const fRows = workflowRows(factory, par, totalTicks(par), agent)
    const both = fRows.find((r) => r.key === 'n.history+roster')
    expect(both.cells.map((c) => [c.col, c.text])).toEqual([[0, 'Maintenance history agent'], [1, 'Shift roster agent']])
    expect(both.split).toBe(true)
    expect(fRows.some((r) => r.kind === 'perf')).toBe(false)
  })

  it('tags agent steps with a pending capability and every other step with its type word', () => {
    const run = buildRun(support, 0)
    const rows = workflowRows(support, run, totalTicks(run), agent)
    const tag = (key) => rows.find((r) => r.key === key).cells[0].tag
    expect(tag('n.triage')).toEqual({ text: 'AI model', pending: true })
    expect(tag('n.email')).toEqual({ text: 'Trigger', pending: false })
    expect(tag('n.approve')).toEqual({ text: 'Human', pending: false })
  })

  it('prints no digit on any row of any run of any scenario', () => {
    for (const w of agent.workflows) {
      const runs = [
        ...w.branches.map((_, i) => buildRun(w, i)),
        ...['approve', 'reject'].map((decision) => buildRun(w, 0, { decision })),
        ...w.drills.map((d) => buildRun(w, 0, { drillId: d.id })),
      ]
      for (const run of runs) {
        const rows = workflowRows(w, run, totalTicks(run), agent)
        expect(new Set(keys(rows)).size, `${w.id} keys`).toBe(rows.length)
        for (const row of rows) for (const c of row.cells ?? []) expect(JSON.stringify([c.text, c.prefix, c.fault, c.tag]), `${w.id} ${c.text}`).not.toMatch(/\d/)
        const sign = rows.find((r) => r.kind === 'sign')
        if (sign) expect(JSON.stringify([sign.verb, sign.approveTo, sign.rejectTo, sign.results])).not.toMatch(/\d/)
      }
    }
  })

  it('cycles through the branches the way the main page does', () => {
    expect(splitColumn(support, buildRun(support, 0))).toBe(0)
    expect(splitColumn(support, buildRun(support, nextBranchIndex(support, 0)))).toBe(1)
    expect(splitColumn(factory, buildRun(factory, 0))).toBe(-1)
    expect(splitColumn(wf('inventory'), buildRun(wf('inventory'), 1))).toBe(1)
  })
})

describe('journeyRows', () => {
  const journey = agent.journeys[0]
  const total = journeyTicks(journey)

  it('starts with the agent and its task, then one line per stop, with a prefix per kind', () => {
    const rows = journeyRows(journey, total, agent)
    expect(rows[0].cells[0]).toMatchObject({ text: 'XionTechs agent', tag: { text: journey.text } })
    const stops = rows.filter((r) => r.key.startsWith('j.') && /^j\.\d+$/.test(r.key))
    expect(stops.map((r) => r.cells[0].prefix)).toEqual(
      journey.stops.filter((s) => s.kind !== 'compact').map((s) => agent.prefixes[s.kind].text),
    )
    expect(rows.at(-2).outcome).toBe(true)
    expect(rows.at(-1).kind).toBe('stub')
  })

  it('folds the three lines before the compaction into one folded line that stays', () => {
    const c = journey.stops.findIndex((s) => s.kind === 'compact')
    const before = journeyRows(journey, 2 * c, agent) // the moving tick of the compaction stop
    expect(before.filter((r) => r.folded)).toHaveLength(0)
    const after = journeyRows(journey, 2 * c + 1, agent)
    const folded = after.filter((r) => r.folded)
    expect(folded.map((r) => r.cells[0].text)).toEqual(journey.stops.slice(c - 3, c).map((s) => s.text))
    const fold = after.find((r) => r.kind === 'fold')
    expect(fold.labels).toEqual(journey.stops.slice(c - 3, c).map((s) => s.text))
    expect(fold.cells[0].prefix).toBe(agent.prefixes.compact.text)
    expect(journeyRows(journey, total, agent).some((r) => r.kind === 'fold')).toBe(true)
  })

  it('prints nothing on a moving tick, and keeps its keys while the run moves on', () => {
    expect(journeyRows(journey, 0, agent)).toHaveLength(1)
    let prior = []
    for (let t = 0; t <= total; t += 1) {
      const now = keys(journeyRows(journey, t, agent))
      expect(now.slice(0, prior.length), `tick ${t}`).toEqual(prior)
      prior = now
    }
  })

  it('prints no digit', () => {
    for (const j of agent.journeys) {
      for (const row of journeyRows(j, journeyTicks(j), agent)) for (const c of row.cells ?? []) expect(JSON.stringify([c.text, c.prefix, c.tag]), c.text).not.toMatch(/\d/)
    }
  })
})

describe('depth', () => {
  it('puts the newest row at the slot and sends older rows back, tilted and fainter', () => {
    const rows = [{ kind: 'line' }, { kind: 'line' }, { kind: 'line' }]
    const [oldest, middle, newest] = stackLayout(rows)
    expect(newest).toMatchObject({ y: 0, z: 0, rx: 0, o: 1 })
    expect(middle.y).toBe(ROW_H.line)
    expect(oldest.y).toBe(2 * ROW_H.line)
    expect(oldest.z).toBeLessThan(middle.z)
    expect(oldest.rx).toBeGreaterThan(middle.rx)
    expect(oldest.o).toBeLessThan(middle.o)
  })

  it('hides a folded row (no height) and a stub does not move the row above it', () => {
    const [folded, , outcome, stub] = stackLayout([{ kind: 'line', folded: true }, { kind: 'fold' }, { kind: 'line' }, { kind: 'stub' }])
    expect(folded.h).toBe(0)
    expect(outcome.y).toBe(0)
    expect(stub.y).toBe(0)
  })

  it('fades to the floor at the farthest visible row, then to nothing', () => {
    expect(depthAt(DEPTH.visible).o).toBeCloseTo(DEPTH.floor, 3)
    expect(depthAt(DEPTH.visible + 1).o).toBe(0)
    expect(depthAt(0).o).toBe(1)
    let last = 2
    for (let y = 0; y <= DEPTH.visible; y += 10) {
      const { o } = depthAt(y)
      expect(o).toBeLessThanOrEqual(last)
      last = o
    }
  })

  it('keeps every visible row of faded ink above the AA contrast floor, computed from the tokens', () => {
    const css = readFileSync(new URL('../../styles/tokens.css', import.meta.url), 'utf8')
    const token = (name) => css.match(new RegExp(`--${name}: (\\d+) (\\d+) (\\d+);`)).slice(1, 4).map(Number)
    const lin = (c) => {
      const s = c / 255
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
    }
    const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
    const ratio = (a, b) => {
      const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x)
      return (hi + 0.05) / (lo + 0.05)
    }
    const mix = (fg, bg, o) => fg.map((v, i) => v * o + bg[i] * (1 - o))
    const ground = token('ground')
    const paper = token('panel')
    // Text of a row at opacity o, over the page; its paper is faded the same way.
    for (let y = 0; y <= DEPTH.visible; y += 30) {
      const { o } = depthAt(y)
      expect(ratio(mix(token('ink-2'), ground, o), mix(paper, ground, o)), `y ${y}`).toBeGreaterThanOrEqual(4.5)
    }
  })
})
