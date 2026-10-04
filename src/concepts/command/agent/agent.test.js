import { describe, expect, it } from 'vitest'
import { agentJourneys, workflows } from '../../../content/site.js'
import { buildRun, totalTicks } from '../../../workflow/run.js'
import { journeyTicks } from '../../../workflow/journey.js'
import { clampYaw, dampYaw, fitProjection, makeProjection } from './iso.js'
import { solveArm } from './ik.js'
import { cellKey, hexCorners, layoutBoard, layoutJourney, nearestCell, ring } from './hexboard.js'
import { assignArms, buildScene, poseAt, sceneBounds, stationStatus, tokenTrail } from './plan.js'
import { buildJourneyScene, journeyLog, journeyPoseAt, stackAfter } from './journeyPlan.js'
import { transfer } from './motion.js'
import { placeLabels } from './labels.js'
import { agent, nav, sections } from '../content.js'
import { cellAt, cellState, currentCell, journeyCells, nextCellIndex, workflowCells } from './timeline.js'

const finite = (v) => Object.values(v).every((n) => Number.isFinite(n))

describe('iso projection', () => {
  it('round-trips project and unproject at any yaw, pitch and height', () => {
    for (const yaw of [-25, 0, 35, 95]) {
      const p = makeProjection({ yaw, pitch: 55, scale: 31, cx: 400, cy: 250, origin: { x: 3, y: 2 } })
      for (const [x, y, z] of [[0, 0, 0], [5.5, -3, 0], [-2, 7, 1.7]]) {
        const s = p.project(x, y, z)
        const w = p.unproject(s.x, s.y, z)
        expect(w.x).toBeCloseTo(x, 9)
        expect(w.y).toBeCloseTo(y, 9)
      }
    }
  })
  it('raises z up the screen and sorts nearer points deeper', () => {
    const p = makeProjection({ yaw: 35, pitch: 55 })
    expect(p.project(0, 0, 2).y).toBeLessThan(p.project(0, 0, 0).y)
    expect(p.project(0, 0, 2).d).toBeGreaterThan(p.project(0, 0, 0).d)
  })
  it('fits every point inside the canvas at the resting yaw and both extremes', () => {
    const scene = buildScene(workflows[2], buildRun(workflows[2], 0, {}))
    const pts = sceneBounds(scene)
    const fit = fitProjection(pts, 900, 560, { yaw: 35, pad: 16 })
    for (const dy of [-60, 0, 60]) {
      const p = makeProjection({ yaw: 35 + dy, pitch: 55, scale: fit.scale, cx: fit.cx, cy: fit.cy, origin: fit.origin })
      for (const q of pts) {
        const s = p.project(q.x, q.y, q.z)
        expect(s.x).toBeGreaterThanOrEqual(-0.5)
        expect(s.x).toBeLessThanOrEqual(900.5)
      }
    }
  })
  it('clamps the drag and damps toward the target', () => {
    expect(clampYaw(200, 35)).toBe(95)
    expect(clampYaw(-90, 35)).toBe(-25)
    let y = 0
    for (let i = 0; i < 80; i++) y = dampYaw(y, 40)
    expect(y).toBe(40)
  })
})

describe('two-link IK', () => {
  const base = { x: 0, y: 0 }
  it('hits reachable targets with both links at their lengths', () => {
    const r = solveArm(base, { x: 6, y: 3 }, 5, 5, -1)
    expect(r.clamped).toBe(false)
    expect(Math.hypot(r.elbow.x, r.elbow.y)).toBeCloseTo(5, 9)
    expect(Math.hypot(r.wrist.x - r.elbow.x, r.wrist.y - r.elbow.y)).toBeCloseTo(5, 9)
    expect(r.wrist.x).toBeCloseTo(6, 9)
  })
  it('clamps targets beyond reach or on the base, without NaN', () => {
    for (const t of [{ x: 100, y: 0 }, { x: 0, y: 0 }, { x: -1e-12, y: 0 }, { x: 0.2, y: 0.1 }]) {
      const r = solveArm(base, t, 5, 5, 1)
      expect(finite(r.elbow) && finite(r.wrist)).toBe(true)
      expect(Math.hypot(r.wrist.x, r.wrist.y)).toBeLessThanOrEqual(10)
    }
    expect(solveArm(base, { x: 100, y: 0 }, 5, 5).clamped).toBe(true)
  })
  it('never flips the elbow side while the target sweeps around', () => {
    let prev = null
    for (let a = 0; a <= Math.PI; a += 0.05) {
      const r = solveArm(base, { x: 7 * Math.cos(a), y: 7 * Math.sin(a) }, 5, 5, -1)
      const cross = r.wrist.x * r.elbow.y - r.wrist.y * r.elbow.x // sign = which side the elbow is on
      if (prev !== null) expect(Math.sign(cross)).toBe(prev)
      prev = Math.sign(cross)
    }
  })
})

describe('hex layout', () => {
  it('puts every node of every workflow on its own cell', () => {
    for (const compact of [false, true]) {
      for (const wf of workflows) {
        const { cells, tiles } = layoutBoard(wf.nodes, { compact })
        const keys = Object.values(cells).map((c) => cellKey(c.q, c.r))
        expect(new Set(keys).size).toBe(wf.nodes.length)
        const tileKeys = new Set(tiles.map((t) => cellKey(t.q, t.r)))
        for (const k of keys) expect(tileKeys.has(k)).toBe(true)
      }
    }
  })
  it('keeps the flow top to bottom (rows follow the diagram rows)', () => {
    for (const wf of workflows) {
      const { cells } = layoutBoard(wf.nodes)
      const first = wf.nodes[0]
      for (const n of wf.nodes) if (n.y > first.y + 150) expect(cells[n.id].r).toBeGreaterThan(cells[first.id].r)
    }
  })
  it('has a compact board that is narrower than the full one', () => {
    const w = (b) => b.box.x1 - b.box.x0
    for (const wf of workflows) expect(w(layoutBoard(wf.nodes, { compact: true }))).toBeLessThan(w(layoutBoard(wf.nodes)))
  })
  it('finds the cell under a point', () => {
    const { cells } = layoutBoard(workflows[0].nodes)
    const c = cells.triage
    expect(nearestCell(cells, c.x + 0.2, c.y - 0.1)).toBe('triage')
    expect(nearestCell(cells, c.x + 50, c.y)).toBeNull()
  })
  it('draws hexes with six corners at the radius', () => {
    const c = hexCorners(2, 3, 1)
    expect(c).toHaveLength(6)
    for (const p of c) expect(Math.hypot(p.x - 2, p.y - 3)).toBeCloseTo(1, 9)
  })
  it('gives every journey stop its own cell around the tray', () => {
    expect(ring(2)).toHaveLength(12)
    for (const j of agentJourneys) {
      const { stops } = layoutJourney(j)
      expect(stops).toHaveLength(j.stops.length)
      const keys = stops.map((s) => cellKey(s.q, s.r))
      expect(new Set([...keys, '0,0']).size).toBe(stops.length + 1)
    }
  })
})

describe('workflow plan', () => {
  const sceneOf = (wf, opts = {}, branch = 0) => buildScene(wf, buildRun(wf, branch, opts))

  it('assigns parallel steps to two arms, left to arm A', () => {
    const wf = workflows[2]
    const run = buildRun(wf, 0, {})
    const a = assignArms(run.steps, wf.nodes)
    const par = a.find((s) => s.length === 2)
    expect(par.map((e) => e.arm)).toEqual(['A', 'B'])
    expect(par[0].id).toBe('history')
    expect(par[1].id).toBe('roster')
    expect(buildScene(wf, run).arms).toHaveLength(2)
    expect(sceneOf(workflows[0]).arms).toHaveLength(1)
  })

  it('is smooth, deterministic and finite at every tick for every scenario, drill and decision', () => {
    for (const wf of workflows) {
      const variants = [
        { opts: {}, branch: 0 },
        ...(wf.branches.length > 1 ? [{ opts: {}, branch: 1 }] : []),
        { opts: { drillId: wf.drills[0].id }, branch: 0 },
        { opts: { drillId: wf.drills[1].id }, branch: 0 },
        { opts: { decision: 'approve' }, branch: 0 },
        { opts: { decision: 'reject' }, branch: 0 },
      ]
      for (const v of variants) {
        const run = buildRun(wf, v.branch, v.opts)
        const scene = buildScene(wf, run)
        const total = totalTicks(run)
        let prev = null
        for (let t = 0; t <= total + 1; t++) {
          for (let k = 0; k <= 20; k++) {
            const u = k / 20
            const pose = poseAt(scene, t, u)
            expect(poseAt(scene, t, u)).toEqual(pose)
            for (const a of pose.arms) {
              expect(finite(a.elbow) && finite(a.wrist) && Number.isFinite(a.z)).toBe(true)
              expect(Math.hypot(a.elbow.x - a.base.x, a.elbow.y - a.base.y)).toBeCloseTo(scene.arms[0].l1, 6)
            }
            for (const tk of pose.tokens) expect(finite({ x: tk.x, y: tk.y, z: tk.z })).toBe(true)
            // continuity: the gripper never jumps far between two samples of the same run
            const g = pose.arms[0].wrist
            const z = pose.arms[0].z
            if (prev) expect(Math.hypot(g.x - prev.x, g.y - prev.y) + Math.abs(z - prev.z)).toBeLessThan(2.6)
            prev = { ...g, z }
          }
        }
      }
    }
  })

  it('holds the token over the human hex, and ends with the token in the bay', () => {
    const wf = workflows[0]
    const wait = sceneOf(wf)
    const w = wait.run.steps.findIndex((s) => s[0] === 'approve')
    const held = poseAt(wait, 2 * w, 1)
    expect(held.arms[0].holding).toBe(true)
    expect(held.gate.waiting).toBe(true)
    expect(held.gate.lift).toBe(0)
    const approved = sceneOf(wf, { decision: 'approve' })
    const end = poseAt(approved, approved.total, 1)
    const n = approved.nodes.done
    expect(end.tokens[0]).toMatchObject({ x: n.x, y: n.y })
    expect(end.arms[0].holding).toBe(false)
    expect(end.bays.done).toBe(1)
    expect(poseAt(approved, 2 * w, 0.5).gate.lift).toBeGreaterThan(0)
    expect(poseAt(approved, approved.total, 1).gate.lift).toBe(1)
    const rejected = sceneOf(wf, { decision: 'reject' })
    expect(poseAt(rejected, rejected.total, 1).gate.lift).toBe(0)
    expect(poseAt(rejected, rejected.total, 1).bays.sentBack).toBe(1)
  })

  it('drops the token on the failing tick of a retry drill and re-grabs it', () => {
    const scene = sceneOf(workflows[0], { drillId: 'timeout' })
    const r = [...scene.run.retries][0]
    const n = scene.nodes.lookup
    const fail = poseAt(scene, 2 * r - 1, 1)
    expect(fail.arms[0].holding).toBe(false)
    expect(Math.hypot(fail.tokens[0].x - n.x, fail.tokens[0].y - n.y)).toBeGreaterThan(0.3)
    expect(poseAt(scene, 2 * r, 1).arms[0].holding).toBe(true)
    expect(poseAt(scene, 2 * r, 1).tokens[0]).toMatchObject({ x: n.x, y: n.y })
  })

  it('merges the second arm token at the join after a parallel step', () => {
    const scene = sceneOf(workflows[2])
    const p = scene.run.steps.findIndex((s) => s.length === 2)
    expect(poseAt(scene, 2 * p, 1).tokens.map((t) => t.id)).toEqual(['main', 'copy'])
    const merged = poseAt(scene, 2 * (p + 1), 1)
    expect(merged.tokens.find((t) => t.id === 'copy').alpha).toBeLessThan(0.01)
  })

  it('grows the trail with the run and ends on the last station', () => {
    const scene = sceneOf(workflows[1], {}, 1)
    let len = 0
    for (let t = 0; t <= scene.total; t++) {
      const tr = tokenTrail(scene, t)
      expect(tr.length).toBeGreaterThanOrEqual(len)
      len = tr.length
    }
    expect(tokenTrail(scene, scene.total).at(-1).id).toBe('skip')
  })

  it('hides drill-only nodes unless the run passes through them', () => {
    const plain = sceneOf(workflows[0])
    expect(stationStatus(plain, 0).status.clarify).toBe('hidden')
    const drill = sceneOf(workflows[0], { drillId: 'unclear' })
    expect(stationStatus(drill, 0).status.clarify).toBe('future')
    expect(stationStatus(plain, 0).status.sentBack).toBe('off')
  })

  it('keeps the transfer profile on its endpoints', () => {
    const a = { x: 0, y: 0, z: 0.3 }
    const b = { x: 6, y: 2, z: 1.1 }
    expect(transfer(a, b, 0)).toMatchObject(a)
    expect(transfer(a, b, 1)).toMatchObject(b)
    expect(transfer(a, b, 0.5).z).toBeGreaterThan(1.5)
  })
})

describe('journey plan', () => {
  it('stacks tokens and fuses them at compaction', () => {
    for (const j of agentJourneys) {
      const c = j.stops.findIndex((s) => s.kind === 'compact')
      expect(stackAfter(j, c - 1)).toBe(c)
      expect(stackAfter(j, c)).toBe(1)
      expect(stackAfter(j, j.stops.length - 1)).toBe(1 + j.stops.length - c - 1)
    }
  })

  it('is finite and continuous over the whole journey', () => {
    for (const j of agentJourneys) {
      const scene = buildJourneyScene(j)
      expect(scene.total).toBe(journeyTicks(j))
      let prev = null
      for (let t = 0; t <= scene.total; t++) {
        for (let k = 0; k <= 20; k++) {
          const pose = journeyPoseAt(scene, t, k / 20)
          expect(journeyPoseAt(scene, t, k / 20)).toEqual(pose)
          const a = pose.arms[0]
          expect(finite(a.elbow) && finite(a.wrist) && Number.isFinite(a.z)).toBe(true)
          if (prev) expect(Math.hypot(a.wrist.x - prev.x, a.wrist.y - prev.y) + Math.abs(a.z - prev.z)).toBeLessThan(3.2)
          prev = { ...a.wrist, z: a.z }
        }
      }
    }
  })

  it('drops the stack height at the compaction stop and logs the stops worked', () => {
    const j = agentJourneys[0]
    const scene = buildJourneyScene(j)
    const t = scene.events.findIndex((e) => e.stop === scene.compactIndex && e.phase === 'working' && !e.drain)
    const before = journeyPoseAt(scene, t, 0.1).stacks[0]
    const after = journeyPoseAt(scene, t, 1).stacks[0]
    expect(before.n * before.f).toBeGreaterThan(after.n * after.f + 0.5)
    expect(journeyLog(scene, scene.total)).toHaveLength(j.stops.length)
    expect(journeyLog(scene, 0)).toHaveLength(0)
  })
})

describe('timeline strip', () => {
  it('has one cell per step and lands scrubbing on the work tick, the last on the final tick', () => {
    const wf = workflows[0]
    const run = buildRun(wf, 0, { decision: 'approve' })
    const total = totalTicks(run)
    const cells = workflowCells(wf, run, total)
    expect(cells).toHaveLength(run.steps.length)
    expect(cells[0].tick).toBe(0)
    expect(cells[2].tick).toBe(4)
    expect(cells.at(-1).tick).toBe(total)
    expect(cells.every((c) => c.name.length > 0)).toBe(true)
  })
  it('tracks the current cell through travel and work ticks', () => {
    const wf = workflows[1]
    const run = buildRun(wf, 0, {})
    const cells = workflowCells(wf, run, totalTicks(run))
    const seen = []
    for (let t = 0; t <= totalTicks(run); t++) seen.push(currentCell('workflow', cells, t))
    expect(seen[0]).toBe(0)
    expect(seen.at(-1)).toBe(cells.length - 1)
    expect(seen).toEqual([...seen].sort((a, b) => a - b))
  })
  it('gives each journey stop a cell on its working tick', () => {
    const j = agentJourneys[1]
    const cells = journeyCells(j)
    expect(cells).toHaveLength(j.stops.length)
    expect(cells.every((c, i) => i === 0 || c.tick > cells[i - 1].tick)).toBe(true)
    expect(currentCell('journey', cells, cells[3].tick)).toBe(3)
  })
  it('maps keys and pointer positions to cells', () => {
    expect(nextCellIndex('ArrowRight', 1, 5)).toBe(2)
    expect(nextCellIndex('ArrowLeft', 0, 5)).toBe(0)
    expect(nextCellIndex('End', 1, 5)).toBe(4)
    expect(nextCellIndex('x', 1, 5)).toBeNull()
    expect(cellAt(0, 500, 5)).toBe(0)
    expect(cellAt(499, 500, 5)).toBe(4)
    expect(cellAt(900, 500, 5)).toBe(4)
    expect(cellState(1, 2, false)).toBe('done')
    expect(cellState(2, 2, false)).toBe('current')
    expect(cellState(2, 2, true)).toBe('done')
    expect(cellState(3, 2, false)).toBe('future')
  })
})

describe('label placement', () => {
  it('never lets two labels overlap and keeps them inside the canvas', () => {
    const items = Array.from({ length: 6 }, (_, i) => ({ id: 'l' + i, x: 300 + (i % 2) * 20, y: 100 + i * 24, prefer: 'r', priority: i % 3, size: { w: 120, h: 40 } }))
    const spots = placeLabels(items, { hw: 30, width: 700, height: 500 })
    const rects = items.map((it) => {
      const sp = spots[it.id]
      const x0 = sp.side === 'r' ? it.x + 38 : it.x - 38 - 120
      return { x0, x1: x0 + 120, y0: it.y + sp.dy - 20, y1: it.y + sp.dy + 20 }
    })
    for (let i = 0; i < rects.length; i++) {
      expect(rects[i].x0).toBeGreaterThanOrEqual(0)
      expect(rects[i].x1).toBeLessThanOrEqual(700)
      for (let j = i + 1; j < rects.length; j++) {
        const a = rects[i]
        const b = rects[j]
        expect(a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0).toBe(false)
      }
    }
  })
})

describe('page integration and copy rules', () => {
  const strings = (v) => (typeof v === 'string' ? [v] : typeof v === 'function' ? [v('x', { approve: 'a', reject: 'r' })] : v && typeof v === 'object' ? Object.values(v).flatMap(strings) : [])
  it('keeps the station codes sequential and the nav pointing at real sections', () => {
    expect(sections.map((s) => s.code)).toEqual(sections.map((_, i) => String(i).padStart(2, '0')))
    expect(sections.map((s) => s.id)).toContain('agent')
    for (const item of nav.items) expect(sections.some((s) => s.id === item.id)).toBe(true)
  })
  it('has no digits in the demo copy and keeps the illustrative label', () => {
    for (const s of strings(agent)) expect(s).not.toMatch(/[0-9]/)
    expect(agent.illustrative).toMatch(/illustrative/i)
    expect(agent.pendingCapability).toMatch(/pending/i)
  })
})
