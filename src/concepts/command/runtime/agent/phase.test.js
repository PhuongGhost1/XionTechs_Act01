// PORTED from the main page: src/workflow/phase.test.js (read 2026-10-04): the run phase and the
// tick length. The depth and connector tests belong to the main page's graph and stayed there.
import { describe, expect, it } from 'vitest'
import { agent } from '../../content/agent.js'
import { TICK_MS, runPhase, tickMs } from './phase.js'
import { buildRun, stateAt, totalTicks } from './run.js'

const support = agent.workflows.find((w) => w.id === 'support')

describe('runPhase', () => {
  it('runs, decides at the router, then waits for the visitor', () => {
    const run = buildRun(support, 0)
    expect(runPhase(support, stateAt(run, 0))).toBe('running')
    expect(runPhase(support, stateAt(run, 4))).toBe('decision') // AI routing works at tick 4
    expect(runPhase(support, stateAt(run, totalTicks(run)))).toBe('approval')
  })

  it('completes after the decision', () => {
    const run = buildRun(support, 0, { decision: 'reject' })
    expect(runPhase(support, stateAt(run, totalTicks(run)))).toBe('completed')
  })

  it('goes error, retrying, recovered, running on a retry drill', () => {
    const run = buildRun(support, 0, { drillId: 'support.timeout' })
    const r = [...run.retries][0]
    expect([2 * r - 1, 2 * r, 2 * r + 1, 2 * r + 2].map((t) => runPhase(support, stateAt(run, t)))).toEqual([
      'error',
      'retrying',
      'recovered',
      'running',
    ])
  })
})

describe('tickMs', () => {
  it('holds the failure tick longer than the others', () => {
    expect(tickMs('running')).toBe(TICK_MS)
    expect(tickMs(null)).toBe(TICK_MS)
    expect(tickMs('error')).toBeGreaterThan(TICK_MS)
  })
})
