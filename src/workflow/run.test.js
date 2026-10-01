import { describe, it, expect } from 'vitest'
import { buildRun, nextBranchIndex, totalTicks, stateAt, edgeKey, splitBranches, visibleRows, visibleNodeIds } from './run'

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
