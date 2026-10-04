// PORTED from the main page: src/workflow/log.test.js (read 2026-10-04): fill() and statusLine().
// The executionLog tests stayed behind with the function.
import { describe, expect, it } from 'vitest'
import { agent } from '../../content/agent.js'
import { fill, statusLine } from './log.js'
import { buildRun, stateAt, totalTicks } from './run.js'

const LINE = agent.run.line
const support = agent.workflows.find((w) => w.id === 'support')

describe('fill', () => {
  it('replaces named placeholders and blanks unknown ones', () => {
    expect(fill('{a} and {b}', { a: 'x' })).toBe('x and ')
  })
})

describe('statusLine', () => {
  const at = (run, t) => statusLine(support, run, stateAt(run, t), LINE)

  it('says where the run is going, then waits for the visitor', () => {
    const run = buildRun(support, 0)
    expect(at(run, 0)).toBe('Running · Refund request path')
    expect(at(run, totalTicks(run))).toBe(LINE.waiting.text)
  })

  it('reports the decision and the outcome when complete', () => {
    const run = buildRun(support, 0, { decision: 'approve' })
    expect(at(run, totalTicks(run))).toBe('Run complete · approved by you · Customer answered')
    const path = buildRun(support, 1)
    expect(at(path, totalTicks(path))).toBe('Run complete · took the “Order status” path')
  })

  it('reads an error, then Retrying…, then recovered, then running again', () => {
    const run = buildRun(support, 0, { drillId: 'support.timeout' })
    const r = [...run.retries][0]
    expect(at(run, 2 * r - 2)).toBe('Running · Order system timeout')
    expect(at(run, 2 * r - 1)).toBe('Error · Order system timeout')
    expect(at(run, 2 * r)).toBe('Retrying…')
    expect(at(run, 2 * r + 1)).toBe('Recovered · Order lookup agent')
    expect(at(run, 2 * r + 2)).toBe('Running · Order system timeout')
    expect(at(run, totalTicks(run))).toBe('Drill complete · Order system timeout · Customer answered')
  })

  it('names the problem of a drill without a retry once it is reached', () => {
    const run = buildRun(support, 0, { drillId: 'support.unclear' })
    expect(at(run, 0)).toBe('Running · Customer request is unclear')
    expect(at(run, 2)).toBe('Problem: Customer request is unclear')
  })
})
