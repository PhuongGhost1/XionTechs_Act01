import { describe, it, expect } from 'vitest'
import { nodeClasses, runTag, typeIcon } from './workflowStyles'
import { workflows } from '../content/site'
import { buildRun, stateAt, totalTicks } from '../workflow/run'

const COLOURS = 'paper|surface|ink|muted|line|primary|primaryHover|primarySoft|primaryInk|accent|navy|navyInk|navyAccent'
const count = (classes, prefix) =>
  classes.split(/\s+/).filter((c) => new RegExp(`^${prefix}-(${COLOURS})(/[0-9]+)?$`).test(c)).length

describe('nodeClasses', () => {
  for (const type of Object.keys(typeIcon)) {
    for (const status of ['working', 'active', 'idle', 'off']) {
      for (const selected of [false, true]) {
        it(`${type}/${status}/selected=${selected} has one bg, text and border colour`, () => {
          const c = nodeClasses({ type }, status, selected)
          expect(count(c, 'bg')).toBe(1)
          expect(count(c, 'text')).toBe(1)
          expect(count(c, 'border')).toBe(1)
        })
      }
    }
  }
})

describe('runTag', () => {
  const wf = workflows.find((w) => w.drills?.some((d) => d.id === 'timeout'))
  const run = buildRun(wf, 0, { drillId: 'timeout' })
  const retryStep = [...run.retries][0]

  it('says Retrying during the retry tick', () => {
    const state = stateAt(run, 2 * retryStep)
    expect(runTag('lookup', run, state, false).word).toBe('Retrying')
  })

  it('says Retried for the retried node once the run is done', () => {
    const state = stateAt(run, totalTicks(run))
    expect(runTag('lookup', run, state, false).word).toBe('Retried')
  })

  it('says Retried under reduced motion', () => {
    const state = stateAt(run, totalTicks(run))
    expect(runTag('lookup', run, state, true).word).toBe('Retried')
  })

  it('has no tag for a node without retry or problem', () => {
    const state = stateAt(run, totalTicks(run))
    expect(runTag('email', run, state, true)).toBeNull()
  })
})
