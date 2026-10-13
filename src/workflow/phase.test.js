import { readFileSync } from 'node:fs'
import { describe, it, expect } from 'vitest'
import { DEPTH, PERSPECTIVE, TICK_MS, WIRE_Z, edgeStatus, nodeDepth, runPhase, tickMs, wireScale } from './phase'
import { buildRun, stateAt, totalTicks } from './run'
import { workflows } from '../content/site'

const support = workflows.find((w) => w.id === 'support')

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

  it('goes error → retrying → recovered → running on a retry drill', () => {
    const run = buildRun(support, 0, { drillId: 'timeout' })
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

describe('nodeDepth', () => {
  it('brings the worked step forward and sends off-run steps back', () => {
    expect(nodeDepth('working', 'running')).toBe('front')
    expect(nodeDepth('failing', 'error')).toBe('front')
    expect(nodeDepth('recovered', 'recovered')).toBe('front')
    expect(nodeDepth('active', 'running')).toBe('base')
    expect(nodeDepth('idle', 'running')).toBe('base')
    expect(nodeDepth('off', 'running')).toBe('back')
  })

  it('puts the waiting step in focus and everything else behind it during approval', () => {
    expect(nodeDepth('waiting', 'approval')).toBe('focus')
    for (const s of ['active', 'idle', 'off']) expect(nodeDepth(s, 'approval')).toBe('back')
  })

  it('orders the planes back to front: connectors, receding nodes, base, front, focus', () => {
    expect(WIRE_Z).toBeLessThan(DEPTH.back)
    expect(DEPTH.back).toBeLessThan(DEPTH.base)
    expect(DEPTH.base).toBe(0)
    expect(DEPTH.front).toBeLessThan(DEPTH.focus)
    // Shallow: nothing moves more than about forty-five px in depth.
    for (const v of Object.values(DEPTH)) expect(Math.abs(v)).toBeLessThanOrEqual(48)
  })
})

describe('wireScale', () => {
  it('scales the connector plane so it projects to the same size as the node plane', () => {
    const projected = (z) => PERSPECTIVE / (PERSPECTIVE - z)
    expect(wireScale() * projected(WIRE_Z)).toBeCloseTo(1, 10)
  })

  it('matches the perspective-far utility in index.css', () => {
    // src/workflow/ is shared; the consumer of this utility (AgentDemo) lives at this path
    // since feat/promote-command-to-homepage made Command the homepage.
    const css = readFileSync('src/concepts/command/index.css', 'utf8')
    expect(css).toMatch(new RegExp(`\\.perspective-far\\s*\\{\\s*perspective:\\s*${PERSPECTIVE}px`))
  })
})

describe('edgeStatus', () => {
  it('shows the connector into a failing step in error, then traced again on the retry', () => {
    const run = buildRun(support, 0, { drillId: 'timeout' })
    const r = [...run.retries][0]
    expect(edgeStatus('route>lookup', stateAt(run, 2 * r - 1), true)).toBe('error')
    expect(edgeStatus('route>lookup', stateAt(run, 2 * r), true)).toBe('on')
  })

  it('traces an edge while its signal travels and once it is lit', () => {
    const run = buildRun(support, 0)
    expect(edgeStatus('email>triage', stateAt(run, 0), true)).toBe('path')
    expect(edgeStatus('email>triage', stateAt(run, 1), true)).toBe('on')
    expect(edgeStatus('email>triage', stateAt(run, 2), true)).toBe('on')
    expect(edgeStatus('route>lookup', stateAt(run, 2), false)).toBe('off')
  })
})
