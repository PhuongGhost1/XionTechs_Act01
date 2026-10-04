// "Mission plan": the workflow run as an arm moving one token across the hex board. Pure and
// deterministic: `poseAt(scene, tick, u)` is the whole machine state at run tick `tick`, `u` (0..1) of the
// way through that tick. Ticks follow src/workflow/run.js (tick 2i-1 travel into step i, tick 2i work).
import { stateAt, totalTicks, visibleNodeIds } from '../../../workflow/run.js'
import { layoutBoard } from './hexboard.js'
import { solveArm } from './ik.js'
import { clamp01, ease, easeIO, lerp, mix, seg, transfer } from './motion.js'

export const TOP = { trigger: 0.2, agent: 0.95, router: 0.4, human: 0.7, outcome: 0.18 }
export const LINK_Z = { one: 2.3, two: 2.75 } // the two links ride at different heights so they can cross
export const SLAB = 0.22 // token thickness
const RETRY_OFFSET = { x: 0.62, y: 0.28 }
const JOIN_OFFSET = 0.62

export const workZ = (type, top) => (type === 'human' ? top + 1.45 : top + SLAB)
export const hoverZ = (top) => top + 1.7

// ---- arms -------------------------------------------------------------------------------------------------
// Two fixed bases outside the left and right edges of the board; both links are as long as it takes to
// reach the farthest station from either base. Arm B exists only when some step runs in parallel.
export function armGeometry(layout, points, withB) {
  const { box, stations } = layout
  const midY = (stations.y0 + stations.y1) / 2
  const A = { id: 'A', base: { x: box.x0 - 0.7, y: midY }, side: -1 }
  const B = { id: 'B', base: { x: box.x1 + 0.7, y: midY }, side: -1 }
  const far = (b) => Math.max(...points.map((c) => Math.hypot(c.x - b.x, c.y - b.y)), 1)
  const total = Math.max(far(A.base), withB ? far(B.base) : 0) * 1.04
  for (const a of [A, B]) {
    a.total = total
    a.l1 = total * 0.5
    a.l2 = total * 0.5
  }
  return withB ? [A, B] : [A]
}

export const armSolve = (arm, p) => solveArm(arm.base, p, arm.l1, arm.l2, arm.side)

// ---- the scene --------------------------------------------------------------------------------------------
// Which arm serves which node of a step: one node goes to arm A; two (parallel) split left / right.
export function assignArms(steps, nodes) {
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]))
  return steps.map((step) => {
    if (step.length === 1) return [{ id: step[0], arm: 'A' }]
    const sorted = [...step].sort((a, b) => byId[a].x - byId[b].x)
    return sorted.map((id, k) => ({ id, arm: k === 0 ? 'A' : 'B' }))
  })
}

export function buildScene(workflow, run, { compact = false } = {}) {
  const layout = layoutBoard(workflow.nodes, { compact })
  const visible = visibleNodeIds(workflow, run)
  const onRun = new Set(run.steps.flat())
  const nodes = {}
  for (const n of workflow.nodes) {
    const c = layout.cells[n.id]
    nodes[n.id] = {
      id: n.id, type: n.type, title: n.title, capability: n.capability ?? null,
      x: c.x, y: c.y, q: c.q, r: c.r, top: TOP[n.type], onRun: onRun.has(n.id), visible: visible.has(n.id),
    }
  }
  const assign = assignArms(run.steps, workflow.nodes)
  const withB = assign.some((s) => s.length > 1)
  const arms = armGeometry(layout, Object.values(nodes), withB)
  const homes = {}
  const trigger = nodes[run.steps[0][0]]
  homes.A = { x: trigger.x, y: trigger.y, z: hoverZ(trigger.top) }
  if (withB) {
    const b = arms[1]
    const dx = (layout.stations.x0 + layout.stations.x1) / 2 - b.base.x
    const dy = (layout.stations.y0 + layout.stations.y1) / 2 - b.base.y
    const len = Math.hypot(dx, dy) || 1
    homes.B = { x: b.base.x + (dx / len) * b.total * 0.45, y: b.base.y + (dy / len) * b.total * 0.45, z: 2.0 }
  }
  return {
    kind: 'workflow', workflow, run, layout, nodes, assign, arms, homes, withB,
    humanId: workflow.decision?.nodeId ?? null,
    total: totalTicks(run),
    box: layout.box,
  }
}

// Station that arm `a` works at in step i (null when it does not serve that step).
function spotOf(scene, a, i) {
  const s = scene.assign[i]?.find((e) => e.arm === a)
  if (s) return { ...scene.nodes[s.id] }
  // Arm B joins arm A's node right after a parallel step: same hex, shifted a little.
  if (a === 'B' && i > 0 && scene.assign[i - 1]?.some((e) => e.arm === 'B') && scene.assign[i]?.length === 1) {
    const n = scene.nodes[scene.assign[i][0].id]
    return { ...n, x: n.x + JOIN_OFFSET, join: true }
  }
  return null
}

const gripAt = (spot, hover = false) => ({ x: spot.x, y: spot.y, z: hover ? hoverZ(spot.top) : workZ(spot.type, spot.top) })

// Gripper tip (x, y, z) and whether it holds the token, for one arm at tick / u.
function gripperAt(scene, a, tick, u) {
  const { run } = scene
  const home = scene.homes[a]
  const last = run.steps.length - 1
  const i = tick === 0 ? 0 : Math.ceil(tick / 2)
  const travel = tick % 2 === 1
  const cur = spotOf(scene, a, i)
  const prev = i > 0 ? spotOf(scene, a, i - 1) : null

  if (tick === 0) {
    if (a !== 'A' || !cur) return { ...home, holding: false }
    return { ...transfer(home, gripAt(cur), u), holding: u > 0.9 }
  }

  // Past the last step: the arm lifts off the bay and parks above it.
  if (i > last) {
    if (a !== 'A' || !prev) return { ...home, holding: false }
    const p = gripAt(prev)
    return { ...mix(p, { x: p.x, y: p.y, z: hoverZ(prev.top) }, ease(u)), holding: false }
  }

  // A retry (the same node again): the arm fumbles the token on the failing tick and re-grabs it.
  if (run.retries.has(i) && cur && a === 'A') {
    const low = gripAt(cur)
    const off = { x: cur.x + RETRY_OFFSET.x, y: cur.y + RETRY_OFFSET.y }
    const restZ = cur.top + SLAB
    if (travel) {
      // failing: lift a little, let go at u = 0.3, hover
      const z = u < 0.3 ? lerp(low.z, low.z + 0.55, ease(u / 0.3)) : lerp(low.z + 0.55, low.z + 1.1, ease(seg(u, 0.3, 1)))
      return { x: cur.x, y: cur.y, z, holding: u < 0.3 }
    }
    // retrying: over the fallen token, down, grab at 0.5, up, back over the hex, down
    const hi = low.z + 1.1
    let p
    if (u < 0.3) p = mix({ x: cur.x, y: cur.y, z: hi }, { ...off, z: hi }, easeIO(u / 0.3))
    else if (u < 0.5) p = { x: off.x, y: off.y, z: lerp(hi, restZ, ease(seg(u, 0.3, 0.5))) }
    else if (u < 0.7) p = { x: off.x, y: off.y, z: lerp(restZ, hi - 0.2, ease(seg(u, 0.5, 0.7))) }
    else if (u < 0.9) p = mix({ ...off, z: hi - 0.2 }, { x: cur.x, y: cur.y, z: hi - 0.2 }, easeIO(seg(u, 0.7, 0.9)))
    else p = { x: cur.x, y: cur.y, z: lerp(hi - 0.2, low.z, ease(seg(u, 0.9, 1))) }
    return { ...p, holding: u >= 0.5 }
  }

  if (travel) {
    if (cur) return { ...transfer(prev ? gripAt(prev) : home, gripAt(cur), u), holding: true }
    return { ...home, holding: false }
  }

  // work tick
  if (!cur) return { ...home, holding: false }
  const g = gripAt(cur)
  if (cur.join) {
    // arm B joined: its copy merges into the main token, then it retracts home
    if (u < 0.45) return { ...g, holding: true }
    return { ...transfer(g, home, seg(u, 0.45, 1)), holding: false }
  }
  if (i === last && run.waitStep === null && cur.type === 'outcome') return { ...g, holding: u < 0.7 }
  return { ...g, holding: true }
}

// ---- pose ---------------------------------------------------------------------------------------------
export function poseAt(scene, rawTick, rawU = 1) {
  const { run, nodes } = scene
  const tick = Math.max(0, Math.min(rawTick, scene.total + 1))
  const u = clamp01(rawU)
  const last = run.steps.length - 1
  const i = tick === 0 ? 0 : Math.ceil(tick / 2)
  const work = tick % 2 === 0
  const grips = {}
  const armPoses = scene.arms.map((arm) => {
    const g = gripperAt(scene, arm.id, tick, u)
    grips[arm.id] = g
    const sol = armSolve(arm, g)
    return { id: arm.id, base: arm.base, elbow: sol.elbow, wrist: sol.wrist, z: g.z, holding: g.holding, clamped: sol.clamped }
  })

  // The main token: carried while arm A holds it, otherwise resting where it was left.
  const gA = grips.A
  const at = (k) => nodes[run.steps[Math.min(k, last)][0]]
  let main
  if (gA.holding) {
    main = { x: gA.x, y: gA.y, z: gA.z - SLAB, scale: 1 }
  } else if (tick === 0) {
    const n = at(0)
    main = { x: n.x, y: n.y, z: n.top, scale: ease(seg(u, 0.1, 0.55)) }
  } else {
    const n = at(i)
    if (run.retries.has(i) && !work) {
      // failing tick: the token slips off the gripper after u = 0.3 and lands beside the hex
      const t = seg(u, 0.3, 0.6)
      main = {
        x: lerp(n.x, n.x + RETRY_OFFSET.x, ease(t)), y: lerp(n.y, n.y + RETRY_OFFSET.y, ease(t)),
        z: lerp(n.top + 0.55, n.top, t * t), scale: 1,
      }
    } else if (run.retries.has(i)) {
      main = { x: n.x + RETRY_OFFSET.x, y: n.y + RETRY_OFFSET.y, z: n.top, scale: 1 }
    } else {
      main = { x: n.x, y: n.y, z: n.top, scale: 1 }
    }
  }
  const tokens = [{ id: 'main', kind: 'main', alpha: 1, ...main }]

  // The copy token arm B carries through a parallel step; it merges into the main one at the join.
  if (scene.withB) {
    const gB = grips.B
    const inPar = scene.assign[i]?.length > 1
    const afterPar = i > 0 && scene.assign[i - 1]?.length > 1 && scene.assign[i]?.length === 1
    const copy = { id: 'copy', kind: 'copy', x: gB.x, y: gB.y, z: gB.z - SLAB, scale: 1, alpha: 1 }
    if (inPar) tokens.push({ ...copy, alpha: work ? 1 : ease(seg(u, 0, 0.3)) })
    else if (afterPar && !work) tokens.push(copy)
    else if (afterPar && work) {
      const m = ease(seg(u, 0, 0.45))
      tokens.push({ ...copy, x: lerp(gB.x, main.x, m), y: lerp(gB.y, main.y, m), z: lerp(copy.z, main.z, m), alpha: 1 - m })
    }
  }

  // Working rings (not at the human hex, not at a router, which turns instead).
  const rings = []
  if (tick === 0) {
    const n = at(0)
    rings.push({ x: n.x, y: n.y, z: n.top, t: seg(u, 0.5, 1) })
  } else if (work && i <= last && !(run.waitStep !== null && tick >= 2 * run.waitStep && i === run.waitStep)) {
    for (const e of scene.assign[i] ?? []) {
      const n = nodes[e.id]
      if (n.type === 'human' || n.type === 'router') continue
      rings.push({ x: n.x, y: n.y, z: n.top, t: seg(u, 0.2, 1) })
    }
  }

  // Router arrows turn to the chosen branch on the router's work tick.
  const routers = {}
  run.steps.forEach((step, k) => {
    for (const id of step) {
      if (nodes[id].type !== 'router') continue
      const n = nodes[id]
      const next = run.steps[k + 1]?.[0]
      const back = run.steps[k - 1]?.[0]
      const to = next ? Math.atan2(nodes[next].y - n.y, nodes[next].x - n.x) : Math.PI / 2
      const from = back ? Math.atan2(n.y - nodes[back].y, n.x - nodes[back].x) : -Math.PI / 2
      const d = Math.atan2(Math.sin(to - from), Math.cos(to - from))
      const w = 2 * k
      routers[id] = tick < w ? from : tick === w ? from + d * easeIO(seg(u, 0.1, 0.9)) : from + d
    }
  })

  // The gate over the human hex stays locked until the visitor approves.
  let gate = null
  if (scene.humanId && nodes[scene.humanId].onRun) {
    const w = run.steps.findIndex((s) => s[0] === scene.humanId)
    let lift = 0
    if (run.decision === 'approve') lift = tick < 2 * w ? 0 : tick === 2 * w ? ease(u) : 1
    gate = { id: scene.humanId, lift, waiting: run.waitStep !== null && tick >= 2 * w, rejected: run.decision === 'reject' && tick >= 2 * w }
  }

  // Bays hatch in once the token is set down.
  const bays = {}
  for (const n of Object.values(nodes)) {
    if (n.type !== 'outcome') continue
    const k = run.steps.findIndex((s) => s.includes(n.id))
    bays[n.id] = k < 0 || tick < 2 * k ? 0 : tick === 2 * k ? ease(seg(u, 0.45, 1)) : 1
  }

  return { tick, u, arms: armPoses, tokens, rings, routers, gate, bays }
}

// Polyline through the stations arm A's token has reached by `tick`, for the hairline trail.
export function tokenTrail(scene, tick) {
  const pts = []
  const { run, nodes } = scene
  run.steps.forEach((step, k) => {
    if (k > 0 && tick < 2 * k) return
    const id = step.length === 1 ? step[0] : scene.assign[k].find((e) => e.arm === 'A').id
    const n = nodes[id]
    if (pts.length && pts[pts.length - 1].id === id) return // a retry: same hex
    pts.push({ id, x: n.x, y: n.y, z: n.top })
  })
  return pts
}

// Status of each station for styling: hidden, off (not on this run), future, working, active, failing, waiting.
export function stationStatus(scene, tick) {
  const st = stateAt(scene.run, tick)
  const status = {}
  for (const n of Object.values(scene.nodes)) {
    if (!n.visible) status[n.id] = 'hidden'
    else if (!n.onRun) status[n.id] = 'off'
    else if (st.failing.has(n.id)) status[n.id] = 'failing'
    else if (st.waiting && n.id === scene.humanId) status[n.id] = 'waiting'
    else if (st.working.has(n.id)) status[n.id] = 'working'
    else if (st.active.has(n.id)) status[n.id] = 'active'
    else status[n.id] = 'future'
  }
  return { status, state: st }
}

// 3-D points the projection must keep inside the canvas: board corners and the arm bases at link height.
export function sceneBounds(scene) {
  // The stations (not the padding tiles) and the arm bases, at link height: this is what must fit.
  const st = scene.layout.stations
  const pts = []
  for (const x of [st.x0 - 1, st.x1 + 1]) for (const y of [st.y0 - 1, st.y1 + 1]) pts.push({ x, y, z: 0 }, { x, y, z: 3.2 })
  for (const a of scene.arms) pts.push({ ...a.base, z: 3.2 }, { ...a.base, z: 0 })
  return pts
}
