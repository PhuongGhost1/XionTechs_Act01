import { describe, expect, it } from 'vitest'
import { agentJourneys, workflows } from '../../../content/site'
import { buildRun, stateAt, totalTicks } from '../../../workflow/run'
import { journeyStateAt, journeyTicks } from '../../../workflow/journey'
import { len3, pointAt, polyline, quadratic } from './curves'
import {
  JOURNEY_FRAME, ORBIT, PLAN_FRAME, advanceCraft, buildJourneyModel, buildPlanModel, craftPose, focusNodeId,
  journeyNodeStatus, litFraction, nodeLevels, orbitPoint, planNodeStatus, pursuitTarget,
} from './model'

const near = (a, b, eps = 1e-6) => expect(len3([a[0] - b[0], a[1] - b[1], a[2] - b[2]])).toBeLessThan(eps)

describe('curves', () => {
  it('walks a polyline at constant speed by arc length', () => {
    const line = polyline([[0, 0, 0], [1, 0, 0], [1, 0, 3]]) // length 4
    near(pointAt(line, 0.25).p, [1, 0, 0])
    near(pointAt(line, 0.625).p, [1, 0, 1.5])
    near(pointAt(line, 1).p, [1, 0, 3])
  })
  it('samples a quadratic from end to end', () => {
    const q = quadratic([0, 0, 0], [1, 2, 0], [2, 0, 0], 16)
    expect(q.pts).toHaveLength(17)
    near(q.pts[0], [0, 0, 0])
    near(q.pts[16], [2, 0, 0])
    expect(q.total).toBeGreaterThan(2)
  })
})

describe('plan model', () => {
  it('lifts every node above the one before it, so the trajectory climbs', () => {
    for (const wf of workflows) {
      const levels = nodeLevels(wf)
      const solid = wf.edges.filter(([a, b]) => !wf.nodes.find((n) => n.id === a).drillOnly && !wf.nodes.find((n) => n.id === b).drillOnly)
      for (const [a, b] of solid) expect(levels[b]).toBeGreaterThan(levels[a])
    }
  })

  it('keeps every node and curve inside the plot frame, for every workflow, branch and drill', () => {
    for (const wf of workflows) {
      const runs = [
        ...wf.branches.map((_, i) => buildRun(wf, i)),
        ...wf.drills.map((d) => buildRun(wf, 0, { drillId: d.id })),
      ]
      for (const run of runs) {
        const m = buildPlanModel(wf, run)
        for (const n of m.nodes) {
          expect(n.x).toBeGreaterThan(PLAN_FRAME.x[0])
          expect(n.x).toBeLessThan(PLAN_FRAME.x[1])
          expect(n.z).toBeGreaterThan(PLAN_FRAME.z[0])
          expect(n.z).toBeLessThan(PLAN_FRAME.z[1])
          expect(n.y).toBeLessThanOrEqual(PLAN_FRAME.y[1])
        }
        for (const e of m.edges) for (const p of e.poly.pts) p.forEach((v) => expect(Number.isFinite(v)).toBe(true))
      }
    }
  })

  it('keeps node positions the same whether or not a drill brings in a drill-only node', () => {
    const wf = workflows[0]
    const plain = buildPlanModel(wf, buildRun(wf, 0)).byId
    const drilled = buildPlanModel(wf, buildRun(wf, 0, { drillId: 'unclear' })).byId
    for (const id of Object.keys(plain)) near(plain[id].pos, drilled[id].pos)
    expect(drilled.clarify).toBeTruthy()
    expect(plain.clarify).toBeUndefined()
  })

  it('marks the decision node, the rejected outcome and the router candidates', () => {
    const wf = workflows[0]
    const m = buildPlanModel(wf, buildRun(wf, 0))
    expect(m.byId.approve.decision).toBe(true)
    expect(m.byId.sentBack.abort).toBe(true)
    expect(m.byId.done.abort).toBe(false)
    expect(m.edges.filter((e) => e.from === 'route').every((e) => e.candidate)).toBe(true)
    expect(m.edges.filter((e) => e.from === 'approve').every((e) => e.candidate)).toBe(true)
    expect(m.edges.find((e) => e.key === 'email>triage').candidate).toBe(false)
  })

  it('numbers the nodes in flight order, without repeats', () => {
    const wf = workflows[1]
    const m = buildPlanModel(wf, buildRun(wf, 0))
    const nums = m.nodes.map((n) => n.num)
    expect(new Set(nums).size).toBe(nums.length)
    expect(m.byId.check.num).toBe('01')
  })

  it('flies one contiguous leg per step, and a retry loops back to the waypoint before it', () => {
    const wf = workflows[0]
    const run = buildRun(wf, 0, { drillId: 'timeout' }) // lookup repeats
    const m = buildPlanModel(wf, run)
    const retry = m.legs.find((l) => l.kind === 'retry')
    expect(retry.to).toBe('lookup')
    expect(m.retryArcs).toHaveLength(1)
    expect(m.retryArcs[0].predId).toBe('route')
    // the loop and the legs around it leave no gap in time
    const sorted = [...m.legs].sort((a, b) => a.t0 - b.t0)
    for (let i = 1; i < sorted.length; i++) expect(sorted[i].t0).toBeGreaterThanOrEqual(sorted[i - 1].t1)
    expect(retry.t1 - retry.t0).toBe(1)
    // it starts and ends at the retried node
    near(retry.poly.pts[0], m.byId.lookup.pos)
    near(retry.poly.pts.at(-1), m.byId.lookup.pos)
  })

  it('puts the craft on the node at every working tick and mid-way on the leg in between', () => {
    const wf = workflows[0]
    const run = buildRun(wf, 0)
    const m = buildPlanModel(wf, run)
    near(craftPose(m.legs, m.start, 0).p, m.byId.email.pos)
    run.steps.forEach((step, i) => near(craftPose(m.legs, m.start, 2 * i).p, m.byId[step[0]].pos))
    const mid = craftPose(m.legs, m.start, 2 * 2 - 0.5)
    expect(mid.moving).toBe(true)
    const a = m.byId.triage.pos
    const b = m.byId.route.pos
    expect(len3([mid.p[0] - a[0], mid.p[1] - a[1], mid.p[2] - a[2]])).toBeGreaterThan(0.1)
    expect(len3([mid.p[0] - b[0], mid.p[1] - b[1], mid.p[2] - b[2]])).toBeGreaterThan(0.1)
  })

  it('holds the craft at the gate while the run waits for the visitor', () => {
    const wf = workflows[0]
    const run = buildRun(wf, 0)
    const m = buildPlanModel(wf, run)
    const wait = totalTicks(run)
    near(craftPose(m.legs, m.start, wait + 5).p, m.byId.approve.pos)
    expect(stateAt(run, wait).waiting).toBe(true)
    expect(planNodeStatus('approve', run, stateAt(run, wait))).toBe('waiting')
    expect(focusNodeId(m, run, wait, null)).toBe('approve')
  })

  it('moves at constant speed within a leg', () => {
    const wf = workflows[2]
    const run = buildRun(wf, 0)
    const m = buildPlanModel(wf, run)
    const leg = m.legs[0]
    const step = (f) => craftPose(m.legs, m.start, f).p
    const d1 = len3(step(leg.t0 + 0.5).map((v, i) => v - step(leg.t0 + 0.25)[i]))
    const d2 = len3(step(leg.t0 + 0.75).map((v, i) => v - step(leg.t0 + 0.5)[i]))
    expect(Math.abs(d1 - d2)).toBeLessThan(leg.poly.total * 0.03)
  })

  it('reports node status from the run state', () => {
    const wf = workflows[0]
    const run = buildRun(wf, 0, { drillId: 'timeout' })
    expect(planNodeStatus('refund', run, stateAt(run, 0))).toBe('off')
    expect(planNodeStatus('lookup', run, stateAt(run, 0))).toBe('path')
    expect(planNodeStatus('email', run, stateAt(run, 0))).toBe('working')
    const failing = 2 * 4 - 1 // the repeated lookup is step 4
    expect(planNodeStatus('lookup', run, stateAt(run, failing))).toBe('failing')
    expect(planNodeStatus('lookup', run, stateAt(run, failing + 1))).toBe('retrying')
    expect(planNodeStatus('lookup', run, stateAt(run, failing + 2))).toBe('recovered')
    expect(planNodeStatus('lookup', run, stateAt(run, failing + 3))).toBe('retried')
  })

  it('shows the lit part of an edge as the craft flies it', () => {
    const e = { t0: 3, t1: 4 }
    expect(litFraction(e, 2)).toBe(0)
    expect(litFraction(e, 3.5)).toBe(0.5)
    expect(litFraction(e, 9)).toBe(1)
    expect(litFraction({ t0: null, t1: null }, 9)).toBe(0)
  })
})

describe('craft clock', () => {
  const wf = workflows[0]
  const run = buildRun(wf, 0)
  const m = buildPlanModel(wf, run)

  it('heads for the end of the leg that starts at this tick', () => {
    expect(pursuitTarget(m.legs, 1)).toBe(2)
    expect(pursuitTarget(m.legs, 2)).toBe(2)
    expect(pursuitTarget(m.legs, 3)).toBe(4)
  })
  it('arrives as the next tick starts, and never overruns', () => {
    let f = 1
    for (let i = 0; i < 100; i++) f = advanceCraft(f, 1, m.legs, 10, 700)
    expect(f).toBe(2)
    expect(advanceCraft(2, 2, m.legs, 5000, 700)).toBe(2)
  })
  it('does not start a leg before its tick', () => {
    expect(advanceCraft(2, 2, m.legs, 300, 700)).toBe(2)
    expect(advanceCraft(2, 3, m.legs, 350, 700)).toBeCloseTo(3.5)
  })
  it('snaps when time runs backwards or jumps far', () => {
    expect(advanceCraft(9, 0, m.legs, 16)).toBe(0)
    expect(advanceCraft(0, 7, m.legs, 16)).toBe(8)
  })
})

describe('journey model', () => {
  it('has one stop per journey stop and one leg per moving tick', () => {
    for (const j of agentJourneys) {
      const m = buildJourneyModel(j)
      expect(m.nodes).toHaveLength(j.stops.length)
      expect(m.legs).toHaveLength(j.stops.length)
      expect(m.nodes.filter((n) => n.kind === 'compact')).toHaveLength(1)
      for (const n of m.nodes) {
        expect(Math.abs(n.x)).toBeLessThan(JOURNEY_FRAME.x[1])
        expect(Math.abs(n.z)).toBeLessThan(JOURNEY_FRAME.z[1])
      }
    }
  })
  it('climbs at every stop, with the craft on the stop while it works', () => {
    const j = agentJourneys[0]
    const m = buildJourneyModel(j)
    for (let i = 1; i < m.nodes.length; i++) expect(m.nodes[i].y).toBeGreaterThan(m.nodes[i - 1].y)
    const end = journeyTicks(j)
    near(craftPose(m.legs, m.start, end).p, m.nodes.at(-1).pos)
    expect(focusNodeId(m, null, 3, journeyStateAt(j, 3))).toBe(`stop-${journeyStateAt(j, 3).stopIndex}`)
  })
  it('reads stop status from the journey state', () => {
    const j = agentJourneys[0]
    const done = journeyStateAt(j, journeyTicks(j))
    expect(journeyNodeStatus(0, done)).toBe('active')
    expect(journeyNodeStatus(4, done)).toBe('active') // the compaction stop, passed
    const start = journeyStateAt(j, 1) // first stop working
    expect(journeyNodeStatus(0, start)).toBe('working')
    expect(journeyNodeStatus(5, start)).toBe('path')
  })
})

describe('orbit', () => {
  it('rides a closed ellipse around the outcome', () => {
    const c = [1, 2, 3]
    near(orbitPoint(c, 0), orbitPoint(c, Math.PI * 2))
    const p = orbitPoint(c, 0)
    expect(Math.abs(p[0] - c[0])).toBeCloseTo(ORBIT.a)
    expect(len3(orbitPoint(c, 1.3).map((v, i) => v - c[i]))).toBeLessThanOrEqual(ORBIT.a + 1e-9)
  })
})
