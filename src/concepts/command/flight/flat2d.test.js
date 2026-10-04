import { describe, expect, it } from 'vitest'
import { agentJourneys, workflows } from '../../../content/site'
import { buildRun } from '../../../workflow/run'
import { createFlatView, pathOf } from './flat2d'
import { buildJourneyModel, buildPlanModel } from './model'

describe('flat view', () => {
  const size = { w: 800, h: 500 }
  it('keeps every node inside the stage, for every workflow and the journeys', () => {
    const models = [
      ...workflows.map((wf) => buildPlanModel(wf, buildRun(wf, 0))),
      ...agentJourneys.map((j) => buildJourneyModel(j)),
    ]
    for (const m of models) {
      const { project } = createFlatView(m.frame, size)
      for (const n of m.nodes) {
        const p = project(n.pos)
        expect(p.x).toBeGreaterThan(0)
        expect(p.x).toBeLessThan(size.w)
        expect(p.y).toBeGreaterThan(0)
        expect(p.y).toBeLessThan(size.h)
      }
    }
  })
  it('goes down the stage from the trigger to the outcomes, like the flat workflow', () => {
    const wf = workflows[0]
    const m = buildPlanModel(wf, buildRun(wf, 0))
    const { project } = createFlatView(m.frame, size)
    expect(project(m.byId.email.pos).y).toBeLessThan(project(m.byId.triage.pos).y)
    expect(project(m.byId.triage.pos).y).toBeLessThan(project(m.byId.done.pos).y)
  })
  it('fits a narrow phone stage without distortion', () => {
    const wf = workflows[1]
    const m = buildPlanModel(wf, buildRun(wf, 0))
    const { project, scale } = createFlatView(m.frame, { w: 340, h: 420 })
    const a = project([0, 0, 0])
    const b = project([1, 0, 0])
    expect(b.x - a.x).toBeCloseTo(scale)
    expect(scale).toBeGreaterThan(5)
  })
  it('writes path data', () => {
    expect(pathOf((p) => ({ x: p[0], y: p[2] }), [[0, 0, 0], [1, 0, 2]])).toBe('M0.0 0.0 L1.0 2.0')
  })
})
