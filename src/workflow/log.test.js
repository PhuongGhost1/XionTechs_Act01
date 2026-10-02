import { describe, it, expect } from 'vitest'
import { executionLog, fill, statusLine } from './log'
import { buildRun, stateAt, totalTicks } from './run'
import { aiAgents, workflows } from '../content/site'

const { log: LOG, status: STATUS } = aiAgents.run
const byId = (id) => workflows.find((w) => w.id === id)
const support = byId('support')
const texts = (entries) => entries.map((e) => e.text)

describe('fill', () => {
  it('replaces named placeholders and blanks unknown ones', () => {
    expect(fill('{a} and {b}', { a: 'x' })).toBe('x and ')
  })
})

describe('executionLog', () => {
  it('starts with the request, then the agent at work (MOTION §8 example)', () => {
    const run = buildRun(support, 0)
    expect(texts(executionLog(support, run, 0, LOG))).toEqual(['Request received'])
    expect(texts(executionLog(support, run, 2, LOG))).toEqual(['Request received', 'Triage agent working'])
  })

  it('names the chosen path at the routing step and ends waiting for approval', () => {
    const run = buildRun(support, 0)
    const entries = executionLog(support, run, totalTicks(run), LOG)
    expect(entries.find((e) => e.tone === 'decision')).toMatchObject({ text: LOG.decided, detail: 'Refund request' })
    expect(entries.at(-1)).toMatchObject({ tone: 'approval', text: 'Waiting for approval' })
  })

  it('never runs past a pending decision', () => {
    const run = buildRun(support, 0)
    expect(executionLog(support, run, 99, LOG)).toEqual(executionLog(support, run, totalTicks(run), LOG))
  })

  it('records the visitor’s decision and the outcome, keeping earlier keys stable', () => {
    const waitRun = buildRun(support, 0)
    const before = executionLog(support, waitRun, totalTicks(waitRun), LOG)
    const run = buildRun(support, 0, { decision: 'approve' })
    const after = executionLog(support, run, totalTicks(run), LOG)
    expect(after.slice(0, before.length)).toEqual(before)
    expect(texts(after.slice(before.length))).toEqual([LOG.approved, LOG.completed])
    expect(after.at(-1).detail).toBe('Customer answered')
    const rejected = buildRun(support, 0, { decision: 'reject' })
    expect(texts(executionLog(support, rejected, totalTicks(rejected), LOG))).toContain(LOG.rejected)
  })

  it('logs a retry drill as working, the fault, retrying, recovered (MOTION §11)', () => {
    const run = buildRun(support, 0, { drillId: 'timeout' })
    const r = [...run.retries][0]
    const tail = executionLog(support, run, 2 * r + 1, LOG).slice(-4)
    expect(tail.map((e) => [e.tone, e.text])).toEqual([
      ['working', 'Order lookup agent working'],
      ['error', 'Timeout'],
      ['retry', LOG.retrying],
      ['success', LOG.recovered],
    ])
    expect(tail[1].detail).toBe('Order lookup agent')
  })

  it('flags the problem of a drill without a retry, once', () => {
    const run = buildRun(support, 0, { drillId: 'unclear' })
    const entries = executionLog(support, run, totalTicks(run), LOG)
    expect(entries.filter((e) => e.tone === 'problem').map((e) => e.text)).toEqual(['Customer request is unclear'])
    expect(entries.find((e) => e.tone === 'decision')).toBeUndefined()
  })

  it('logs both steps of a parallel step', () => {
    const factory = byId('factory')
    const run = buildRun(factory, 0)
    expect(texts(executionLog(factory, run, 4, LOG)).slice(-2)).toEqual(['Maintenance history agent working', 'Shift roster agent working'])
  })

  it('uses unique keys and no digits in any visible text, for every workflow, drill and decision', () => {
    for (const wf of workflows) {
      const runs = [
        ...wf.branches.map((_, i) => buildRun(wf, i)),
        ...['approve', 'reject'].map((decision) => buildRun(wf, 0, { decision })),
        ...wf.drills.map((d) => buildRun(wf, 0, { drillId: d.id })),
      ]
      for (const run of runs) {
        const entries = executionLog(wf, run, totalTicks(run), LOG)
        expect(new Set(entries.map((e) => e.key)).size).toBe(entries.length)
        for (const e of entries) expect(`${e.text} ${e.detail ?? ''}`, `${wf.id}: ${e.text}`).not.toMatch(/\d/)
      }
    }
  })
})

describe('statusLine', () => {
  const at = (run, t) => statusLine(support, run, stateAt(run, t), STATUS)

  it('says where the run is going, then waits for the visitor', () => {
    const run = buildRun(support, 0)
    expect(at(run, 0)).toBe('Running · Refund request path')
    expect(at(run, totalTicks(run))).toBe(STATUS.waiting)
  })

  it('reports the decision and the outcome when complete', () => {
    const run = buildRun(support, 0, { decision: 'approve' })
    expect(at(run, totalTicks(run))).toBe('Run complete · approved by you · Customer answered')
    const path = buildRun(support, 1)
    expect(at(path, totalTicks(path))).toBe('Run complete · took the “Order status” path')
  })

  it('reads an error, then Retrying…, then recovered, then running again', () => {
    const run = buildRun(support, 0, { drillId: 'timeout' })
    const r = [...run.retries][0]
    expect(at(run, 2 * r - 2)).toBe('Running · Order system timeout')
    expect(at(run, 2 * r - 1)).toBe('Error · Order system timeout')
    expect(at(run, 2 * r)).toBe('Retrying…')
    expect(at(run, 2 * r + 1)).toBe('Recovered · Order lookup agent')
    expect(at(run, 2 * r + 2)).toBe('Running · Order system timeout')
    expect(at(run, totalTicks(run))).toBe('Drill complete · Order system timeout · Customer answered')
  })

  it('names the problem of a drill without a retry once it is reached', () => {
    const run = buildRun(support, 0, { drillId: 'unclear' })
    expect(at(run, 0)).toBe('Running · Customer request is unclear')
    expect(at(run, 2)).toBe('Problem: Customer request is unclear')
  })
})

describe('demo copy', () => {
  it('keeps every demo UI string free of digits', () => {
    const strings = []
    const walk = (v) => (typeof v === 'string' ? strings.push(v) : Object.values(v).forEach(walk))
    walk(aiAgents.run)
    walk({ m: aiAgents.humanMessage })
    for (const s of strings) expect(s, s).not.toMatch(/\d/)
    expect(aiAgents.humanMessage).toBe('Automation with human control.')
  })

  it('gives every retry drill a one-word fault, and no other drill one', () => {
    for (const wf of workflows) {
      for (const d of wf.drills) {
        const retries = buildRun(wf, 0, { drillId: d.id }).retries.size > 0
        if (retries) expect(d.fault, `${wf.id}/${d.id}`).toMatch(/^[A-Z][a-z]+$/)
        else expect(d.fault, `${wf.id}/${d.id}`).toBeUndefined()
      }
    }
  })
})
