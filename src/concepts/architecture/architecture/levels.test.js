import { describe, expect, it } from 'vitest'
import { architecture } from '../content.js'
import { BAY_RULES, cellCount, cellTypes, columnLabel, columnStops, pathSummary, tracePlan } from './levels.js'

describe('bays', () => {
  it('has a rule for every level in the content', () => {
    for (const level of architecture.levels) expect(BAY_RULES[level.id], level.id).toBeTypeOf('function')
  })

  it('draws the requested number of cells and only known cell types', () => {
    for (const level of architecture.levels) {
      for (const n of [2, 3, 4, 5, 6, 7]) {
        const cells = cellTypes(level.id, n)
        expect(cells).toHaveLength(n)
        for (const c of cells) expect('otxjs').toContain(c)
      }
    }
  })

  it('always keeps at least one brace in the business bay, at the far end', () => {
    for (const n of [2, 3, 7]) expect(cellTypes('business', n).at(-1)).toBe('x')
  })

  it('places n + 1 columns from the left edge to the right wall', () => {
    const stops = columnStops(4)
    expect(stops).toEqual([0, 25, 50, 75, 100])
  })

  it('labels columns A, B, C and so on', () => {
    expect([0, 1, 7].map(columnLabel)).toEqual(['A', 'B', 'H'])
  })

  it('uses more cells on wider screens', () => {
    expect([390, 500, 640, 768, 1024, 1440].map(cellCount)).toEqual([2, 3, 4, 5, 6, 7])
  })
})

describe('load path', () => {
  it('lights every row from the top down to the active one', () => {
    const plan = tracePlan(2, 6)
    expect(plan.map((r) => r.lit)).toEqual([true, true, true, false, false, false])
  })

  it('lights nothing when no level is chosen', () => {
    expect(tracePlan(null, 6).every((r) => !r.lit)).toBe(true)
  })

  it('staggers lit rows downward and retracts the rest bottom to top', () => {
    const plan = tracePlan(3, 6)
    expect(plan[0].delay).toBeLessThan(plan[3].delay)
    expect(plan[5].delay).toBeLessThan(plan[4].delay)
  })

  it('summarises the path from Business to the chosen level', () => {
    const s = pathSummary(architecture.levels, 2)
    expect(s.names).toBe('Business to Application')
    expect(s.codes).toBe('L06 to L04')
    expect(s.levels).toBe(3)
    expect(pathSummary(architecture.levels, null)).toBeNull()
  })
})
