// PORTED from the main page: src/workflow/run.test.js (read 2026-10-04), minus the tests of the
// helpers that were left behind (splitBranches, visibleRows, visibleNodeIds). The tick semantics
// are the main page's, so the assertions are the main page's.
import { describe, expect, it } from 'vitest'
import { agent } from '../../content/agent.js'
import { buildRun, edgeKey, nextBranchIndex, stateAt, totalTicks } from './run.js'

const linear = { branches: [{ label: 'Only', path: ['a', 'b', 'c'] }] }
const forked = {
  branches: [
    { label: 'Left', path: ['t', 'r', 'l', 'end'] },
    { label: 'Right', path: ['t', 'r', 'x', 'y', 'end'] },
  ],
}
const parallel = { branches: [{ label: 'Par', path: ['t', 'a', ['h', 's'], 'k', 'done'] }] }

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
  const run = buildRun(linear, 0) // steps a, b, c: totalTicks 5

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

  it('carries the drill fault word, or null', () => {
    const withFault = { ...decided, drills: decided.drills.map((d) => (d.id === 'retry' ? { ...d, fault: 'Timeout' } : d)) }
    expect(buildRun(withFault, 0, { drillId: 'retry' }).fault).toBe('Timeout')
    expect(buildRun(decided, 0, { drillId: 'detour' }).fault).toBe(null)
    expect(buildRun(decided, 0).fault).toBe(null)
  })
})

describe('failure and recovery', () => {
  // t, a, a (retry), h: the retry step is 2, so a fails at tick 3, retries at 4, recovers at 5.
  const run = buildRun(decided, 0, { drillId: 'retry' })

  it('fails the step and puts the connector into it in error on the tick before the retry', () => {
    const s = stateAt(run, 3)
    expect([...s.failing]).toEqual(['a'])
    expect([...s.errorEdges]).toEqual(['t>a'])
    expect(s.active.has('a')).toBe(false)
    expect(s.working.size).toBe(0)
    expect(s.travelling.size).toBe(0)
  })

  it('sends the signal along the same connector again while the step retries', () => {
    const s = stateAt(run, 4)
    expect([...s.retrying]).toEqual(['a'])
    expect([...s.travelling]).toEqual(['t>a'])
    expect(s.failing.size).toBe(0)
    expect(s.errorEdges.size).toBe(0)
  })

  it('shows a brief recovery while the next signal leaves, then counts the step as retried', () => {
    const s = stateAt(run, 5)
    expect([...s.recovered]).toEqual(['a'])
    expect([...s.travelling]).toEqual(['a>h'])
    expect(s.retried.has('a')).toBe(true)
    const later = stateAt(run, 6)
    expect(later.recovered.size).toBe(0)
    expect(later.retried.has('a')).toBe(true)
    expect(later.waiting).toBe(true)
  })

  it('reports nothing of the kind before the failure or on a run without retries', () => {
    const before = stateAt(run, 2)
    expect(before.failing.size + before.recovered.size + before.retried.size + before.errorEdges.size).toBe(0)
    for (let t = 0; t <= 6; t++) {
      const s = stateAt(buildRun(decided, 0, { drillId: 'detour' }), t)
      expect(s.failing.size + s.recovered.size + s.retried.size + s.errorEdges.size, `tick ${t}`).toBe(0)
    }
  })

  it('finds the connector that first reached a step retried twice', () => {
    const twice = { ...decided, drills: [{ id: 'twice', label: 'Twice', problemNodeId: 'a', path: ['t', 'a', 'a', 'a', 'h'] }] }
    const r = buildRun(twice, 0, { drillId: 'twice' })
    expect([...r.retries]).toEqual([2, 3])
    expect([...stateAt(r, 5).errorEdges]).toEqual(['t>a'])
    expect([...stateAt(r, 6).travelling]).toEqual(['t>a'])
  })
})

describe('the ported scenarios', () => {
  it('every branch, drill and decision of every scenario builds a run that ends', () => {
    for (const wf of agent.workflows) {
      const runs = [
        ...wf.branches.map((_, i) => buildRun(wf, i)),
        ...['approve', 'reject'].map((decision) => buildRun(wf, 0, { decision })),
        ...wf.drills.map((d) => buildRun(wf, 0, { drillId: d.id })),
      ]
      for (const run of runs) {
        const s = stateAt(run, totalTicks(run))
        expect(s.done || s.waiting, `${wf.id} ${run.branchLabel}`).toBe(true)
      }
    }
  })

  it('gives every retry drill a one-word fault, and no other drill one', () => {
    for (const wf of agent.workflows) {
      for (const d of wf.drills) {
        const retries = buildRun(wf, 0, { drillId: d.id }).retries.size > 0
        if (retries) expect(d.fault, `${wf.id}/${d.id}`).toMatch(/^[A-Z][a-z]+$/)
        else expect(d.fault, `${wf.id}/${d.id}`).toBeUndefined()
      }
    }
  })
})
