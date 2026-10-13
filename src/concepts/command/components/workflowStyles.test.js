import { describe, it, expect } from 'vitest'
import { chipTone, glowTone, nodeChip, nodeClasses, nodeStatus, typeIcon } from './workflowStyles'
import { aiAgents, workflows } from '../../../content/site'
import { buildRun, stateAt, totalTicks } from '../../../workflow/run'

const COLOURS = 'paper|surface|ink|muted|line|primary|primaryHover|primarySoft|primaryInk|accent|danger|success'
const count = (classes, prefix) =>
  classes.split(/\s+/).filter((c) => new RegExp(`^${prefix}-(${COLOURS})(/[0-9]+)?$`).test(c)).length

const STATUSES = ['failing', 'recovered', 'waiting', 'working', 'active', 'idle', 'off']

describe('nodeClasses', () => {
  for (const type of Object.keys(typeIcon)) {
    for (const status of STATUSES) {
      for (const selected of [false, true]) {
        for (const dim of [false, true]) {
          it(`${type}/${status}/selected=${selected}/dim=${dim} has one bg, text and border colour`, () => {
            const c = nodeClasses({ type }, status, selected, dim)
            expect(count(c, 'bg')).toBe(1)
            expect(count(c, 'text')).toBe(1)
            expect(count(c, 'border')).toBe(1)
          })
        }
      }
    }
  }

  it('dims only the border, never the text colour', () => {
    expect(nodeClasses({ type: 'agent' }, 'idle', false, true)).toContain('border-line')
    expect(nodeClasses({ type: 'agent' }, 'idle', false, true)).toContain('text-ink')
  })

  it('marks a failing step with a dashed danger border and a recovered one with success', () => {
    expect(nodeClasses({ type: 'agent' }, 'failing', false)).toMatch(/border-danger.*border-dashed/)
    expect(nodeClasses({ type: 'agent' }, 'recovered', false)).toContain('border-success')
  })
})

const timeoutWf = workflows.find((w) => w.drills?.some((d) => d.id === 'timeout'))
const node = (id) => timeoutWf.nodes.find((n) => n.id === id)

describe('nodeStatus and glowTone', () => {
  const run = buildRun(timeoutWf, 0, { drillId: 'timeout' })
  const r = [...run.retries][0]

  it('walks the retried step through working, failing, working again, recovered, active', () => {
    expect(nodeStatus('lookup', run, stateAt(run, 2 * r - 2))).toBe('working')
    expect(nodeStatus('lookup', run, stateAt(run, 2 * r - 1))).toBe('failing')
    expect(nodeStatus('lookup', run, stateAt(run, 2 * r))).toBe('working')
    expect(nodeStatus('lookup', run, stateAt(run, 2 * r + 1))).toBe('recovered')
    expect(nodeStatus('lookup', run, stateAt(run, 2 * r + 2))).toBe('active')
  })

  it('reports the waiting step and steps that are off this run', () => {
    const wait = buildRun(timeoutWf, 0)
    const s = stateAt(wait, totalTicks(wait))
    expect(nodeStatus(timeoutWf.decision.nodeId, wait, s)).toBe('waiting')
    expect(nodeStatus('lookup', wait, s)).toBe('off')
  })

  it('glows by status and not at all when idle', () => {
    expect(glowTone('waiting')).toBe('focus')
    expect(glowTone('failing')).toBe('danger')
    expect(glowTone('recovered')).toBe('success')
    expect(glowTone('idle')).toBeUndefined()
  })
})

describe('nodeChip', () => {
  const words = aiAgents.run.chip
  const run = buildRun(timeoutWf, 0, { drillId: 'timeout' })
  const r = [...run.retries][0]

  it('shows the drill fault word as a danger chip while the step fails', () => {
    const chip = nodeChip(node('lookup'), run, stateAt(run, 2 * r - 1))
    expect(chip.word).toBe('Timeout')
    expect(chip.tone).toBe('danger')
  })

  it('says Retrying during the retry tick, then Recovered, then Retried', () => {
    expect(nodeChip(node('lookup'), run, stateAt(run, 2 * r)).word).toBe(words.retrying)
    expect(nodeChip(node('lookup'), run, stateAt(run, 2 * r + 1))).toMatchObject({ word: words.recovered, tone: 'success' })
    expect(nodeChip(node('lookup'), run, stateAt(run, 2 * r + 2)).word).toBe(words.retried)
  })

  it('says Retried for the retried node once the run is done (and so under reduced motion)', () => {
    expect(nodeChip(node('lookup'), run, stateAt(run, totalTicks(run))).word).toBe(words.retried)
  })

  it('does not show a generic Problem chip on a retry drill', () => {
    expect(nodeChip(node('lookup'), run, stateAt(run, 2 * r - 2)).word).toBe(words.working)
  })

  it('shows Problem on the problem step of a drill without a retry', () => {
    const unclear = buildRun(timeoutWf, 0, { drillId: 'unclear' })
    expect(nodeChip(node('triage'), unclear, stateAt(unclear, totalTicks(unclear))).word).toBe(words.problem)
  })

  it('marks the waiting step, a deciding router and a reached outcome', () => {
    const wait = buildRun(timeoutWf, 0)
    expect(nodeChip(node(timeoutWf.decision.nodeId), wait, stateAt(wait, totalTicks(wait))).word).toBe(words.waiting)
    expect(nodeChip(node('route'), wait, stateAt(wait, 4)).word).toBe(words.deciding)
    const ok = buildRun(timeoutWf, 0, { decision: 'approve' })
    expect(nodeChip(node('done'), ok, stateAt(ok, totalTicks(ok))).word).toBe(words.done)
  })

  it('has no chip for a trigger or an untouched step', () => {
    const s = stateAt(run, 0)
    expect(nodeChip(node('email'), run, s)).toBeNull()
    expect(nodeChip(node('reply'), run, s)).toBeNull()
  })

  it('maps every tone to a border and an icon colour', () => {
    for (const tone of ['accent', 'danger', 'success']) {
      expect(chipTone[tone].border).toBe(`border-${tone}`)
      expect(chipTone[tone].icon).toBe(`text-${tone}`)
    }
  })
})
