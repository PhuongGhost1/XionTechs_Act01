// Pure model of the flight plan: where every workflow node and journey stop sits in the 3D plot, the
// curves between them, the legs the craft flies and where the craft is at a given tick. No DOM and no
// three.js, so it is tested in node (model.test.js) and shared by the WebGL scene and the SVG fallback.
//
// The data is the main page's illustrative demo (src/content/site.js workflows and agentJourneys, run
// logic in src/workflow/*); nothing is copied. Plot units: 1 unit = 1 / PX canvas pixels of the 760 x 520
// workflow canvas; x runs left to right, z from the far edge (the trigger) toward the viewer, and the
// altitude y rises with the node's step level so the trajectory climbs.

import { journeyEvents } from '../../../workflow/journey'
import { edgeKey, visibleNodeIds } from '../../../workflow/run'
import { TICK_MS } from '../../../workflow/phase'
import { concat, endOf, len3, norm3, pointAt, polyline, quadratic, sub3, tangentAtEnd, tangentAtStart } from './curves'

export const PX = 0.034 // plot units per canvas px, across
export const PZ = 0.034 // and for depth: the plot keeps the canvas's proportions
export const ALT_STEP = 0.6
export const CANVAS = { w: 760, h: 520 } // the workflow coordinates in site.js

export const PLAN_FRAME = { x: [-11, 11], y: [0, 3.9], z: [-8.1, 8.3] }
export const JOURNEY_FRAME = { x: [-10, 10], y: [0, 3.1], z: [-3.5, 3.5] }

const ground = (n) => ({ x: (n.x - CANVAS.w / 2) * PX, z: (n.y - CANVAS.h / 2) * PZ })

// Step level of every node: the longest chain of edges that leads to it, ignoring drill-only nodes.
// A drill-only node sits half a level above its first predecessor, so it never moves the others when
// a drill brings it onto the run.
export function nodeLevels(workflow) {
  const drillOnly = new Set(workflow.nodes.filter((n) => n.drillOnly).map((n) => n.id))
  const level = Object.fromEntries(workflow.nodes.map((n) => [n.id, 0]))
  const solid = workflow.edges.filter(([a, b]) => !drillOnly.has(a) && !drillOnly.has(b))
  for (let pass = 0; pass < workflow.nodes.length; pass++) {
    let changed = false
    for (const [a, b] of solid) {
      if (level[b] < level[a] + 1) {
        level[b] = level[a] + 1
        changed = true
      }
    }
    if (!changed) break
  }
  for (const id of drillOnly) {
    const preds = workflow.edges.filter(([, b]) => b === id).map(([a]) => a)
    level[id] = Math.max(0, ...preds.map((p) => level[p])) + 0.5
  }
  return level
}

// Arc between two points: a ballistic lift in the middle, and a `via` x (workflow canvas px) that
// bends the arc out to a side channel so it clears the node between.
function edgeCurve(a, b, viaX, n) {
  const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]
  const c = [mid[0], mid[1] + 0.16 * len3(sub3(b, a)) + 0.1, mid[2]]
  if (viaX != null) c[0] = 2 * ((viaX - CANVAS.w / 2) * PX) - (a[0] + b[0]) / 2
  return quadratic(a, c, b, n)
}

// The correction arc of a retry: node back to the waypoint before it, bulging sideways.
function retryArc(from, to, n) {
  const d = sub3(to, from)
  const side = norm3([-d[2], 0, d[0]], [1, 0, 0])
  const sign = side[0] >= 0 ? 1 : -1
  const k = 0.45 * len3(d) + 0.5
  const mid = [(from[0] + to[0]) / 2 + side[0] * sign * k, (from[1] + to[1]) / 2 + 0.7, (from[2] + to[2]) / 2 + side[2] * sign * k]
  return quadratic(from, mid, to, n)
}

// Unit direction of travel through a node (incoming and outgoing curves averaged); rings face along it.
function tangentsFor(nodes, edges) {
  const sum = Object.fromEntries(nodes.map((n) => [n.id, [0, 0, 0]]))
  for (const e of edges) {
    const t0 = tangentAtStart(e.poly)
    const t1 = tangentAtEnd(e.poly)
    for (let i = 0; i < 3; i++) {
      sum[e.from][i] += t0[i]
      sum[e.to][i] += t1[i]
    }
  }
  for (const n of nodes) n.tangent = norm3(sum[n.id])
}

const primary = (step) => (Array.isArray(step) ? step[0] : step)

function numberNodes(nodes) {
  const order = [...nodes].sort((a, b) => a.level - b.level || a.x - b.x)
  order.forEach((n, i) => {
    n.num = String(i + 1).padStart(2, '0')
  })
}

// Points the camera must keep in frame: the ground rectangle, every node and the air above it.
function fitPoints(frame, nodes) {
  const [x0, x1] = frame.x
  const [z0, z1] = frame.z
  return [[x0, 0, z0], [x1, 0, z0], [x1, 0, z1], [x0, 0, z1], ...nodes.map((n) => n.pos), ...nodes.map((n) => [n.x, n.y + 0.7, n.z])]
}

// The plan view for one workflow and run. `segments` is the sampling of every curve (fewer on phones).
export function buildPlanModel(workflow, run, { segments = 24 } = {}) {
  const visible = visibleNodeIds(workflow, run)
  const levels = nodeLevels(workflow)
  const rejectIds = new Set(workflow.decision?.reject ?? [])
  const decisionId = workflow.decision?.nodeId
  const nodes = workflow.nodes
    .filter((n) => visible.has(n.id))
    .map((n) => {
      const g = ground(n)
      const y = levels[n.id] * ALT_STEP
      return {
        id: n.id, kind: n.type, title: n.title, capability: n.capability ?? null,
        level: levels[n.id], x: g.x, y, z: g.z, pos: [g.x, y, g.z],
        abort: n.type === 'outcome' && rejectIds.has(n.id), decision: n.id === decisionId,
      }
    })
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]))
  const runEdges = new Map(run.edges.map((e) => [edgeKey(e), e]))
  const edges = workflow.edges
    .filter(([a, b]) => byId[a] && byId[b])
    .map(([from, to, opt]) => {
      const key = `${from}>${to}`
      const re = runEdges.get(key)
      return {
        key, from, to, poly: edgeCurve(byId[from].pos, byId[to].pos, opt?.via ?? null, segments),
        candidate: byId[from].kind === 'router' || from === decisionId,
        onPath: Boolean(re), t0: re ? 2 * re.step - 1 : null, t1: re ? 2 * re.step : null,
      }
    })
  tangentsFor(nodes, edges)
  numberNodes(nodes)

  // Legs: one per step into a new node; a retry step becomes a loop back to the previous waypoint.
  const legs = []
  const retryArcs = []
  const edgeByKey = Object.fromEntries(edges.map((e) => [e.key, e]))
  const entryPoly = (from, to) => {
    const direct = edgeByKey[`${from}>${to}`]
    return direct ? direct.poly : edgeCurve(byId[from].pos, byId[to].pos, null, segments)
  }
  run.steps.forEach((step, i) => {
    if (i === 0) return
    const to = primary(step)
    if (run.retries.has(i)) {
      let entry = i - 1
      while (entry > 0 && run.retries.has(entry)) entry--
      const prevStep = run.steps[entry - 1]
      const from = (Array.isArray(prevStep) ? prevStep : [prevStep]).find((id) => edgeByKey[`${id}>${to}`]) ?? primary(prevStep)
      const arc = retryArc(byId[to].pos, byId[from].pos, Math.max(8, segments >> 1))
      retryArcs.push({ r: i, nodeId: to, predId: from, poly: arc })
      legs.push({ t0: 2 * i, t1: 2 * i + 1, poly: concat([arc, entryPoly(from, to)]), kind: 'retry', to })
      return
    }
    const prev = run.steps[i - 1]
    const candidates = Array.isArray(prev) ? prev : [prev]
    const from = candidates.find((id) => edgeByKey[`${id}>${to}`]) ?? candidates[0]
    legs.push({ t0: 2 * i - 1, t1: 2 * i, poly: entryPoly(from, to), kind: 'edge', edgeKey: `${from}>${to}`, to })
  })

  return {
    view: 'plan', frame: PLAN_FRAME, fit: fitPoints(PLAN_FRAME, nodes), nodes, byId, edges, legs, retryArcs,
    start: byId[primary(run.steps[0])].pos, maxLevel: Math.max(...nodes.map((n) => n.level)),
  }
}

// The Agent at work view: stops on a stepped path that climbs a little at every stop.
export function buildJourneyModel(journey, { segments = 24 } = {}) {
  void segments
  const n = journey.stops.length
  const span = 15
  const nodes = journey.stops.map((stop, i) => {
    const x = -span / 2 + (span * i) / Math.max(1, n - 1)
    const y = 0.4 + i * 0.28
    const z = i % 2 === 0 ? -1.5 : 1.5
    return {
      id: `stop-${i}`, kind: stop.kind, title: stop.kind === 'compact' ? null : stop.label, status: stop.status,
      level: i, x, y, z, pos: [x, y, z], num: String(i + 1).padStart(2, '0'), abort: false, decision: false, tangent: [1, 0, 0],
    }
  })
  const lead = [-9.6, 0.1, nodes[0].z]
  const hops = nodes.map((node, i) => {
    const a = i === 0 ? lead : nodes[i - 1].pos
    const b = node.pos
    if (i === 0) return polyline([a, b])
    const mx = (a[0] + b[0]) / 2
    const at = (t) => a[1] + (b[1] - a[1]) * t
    return polyline([a, [mx, at(0.3), a[2]], [mx, at(0.7), b[2]], b])
  })
  const events = journeyEvents(journey)
  const legs = []
  const edges = hops.map((poly, i) => {
    const e = events.findIndex((ev) => ev.stop === i && ev.phase === 'moving')
    legs.push({ t0: e, t1: e + 1, poly, kind: 'edge', edgeKey: `hop-${i}`, to: `stop-${i}` })
    return { key: `hop-${i}`, from: i === 0 ? null : `stop-${i - 1}`, to: `stop-${i}`, poly, candidate: false, onPath: true, t0: e, t1: e + 1 }
  })
  return {
    view: 'journey', frame: JOURNEY_FRAME, fit: fitPoints(JOURNEY_FRAME, nodes), nodes, byId: Object.fromEntries(nodes.map((nd) => [nd.id, nd])),
    edges, legs, retryArcs: [], start: lead, maxLevel: n - 1,
  }
}

// How a node looks at this moment. Shared by the 3D markers, the SVG markers and the HTML labels, so the
// three always agree. 'off' is not on this run; 'path' is on it but not reached yet.
export function planNodeStatus(id, run, state) {
  if (!run.steps.some((s) => s.includes(id))) return 'off'
  if (run.waitStep != null && state.waiting && run.steps[run.waitStep].includes(id)) return 'waiting'
  if (state.failing.has(id)) return 'failing'
  if (state.retrying.has(id)) return 'retrying'
  if (state.working.has(id)) return 'working'
  if (state.recovered.has(id)) return 'recovered'
  if (state.active.has(id)) return state.retried.has(id) ? 'retried' : 'active'
  return 'path'
}

export function journeyNodeStatus(index, jState) {
  const working = !jState.done && index === jState.stopIndex && jState.phase === 'working'
  if (working) return 'working'
  if (jState.lit.has(index)) return 'active'
  // The compaction stop is never "lit"; it is passed once the agent has moved on or the task is done.
  if (index < jState.stopIndex || (jState.done && index <= jState.stopIndex)) return 'active'
  return 'path'
}

// The node the camera should frame: the one the craft is heading to or sitting at.
export function focusNodeId(model, run, tick, jState) {
  if (model.view === 'journey') return `stop-${jState.stopIndex}`
  const i = Math.min(run.steps.length - 1, Math.max(0, Math.floor((tick + 1) / 2)))
  return primary(run.steps[i])
}

// Craft position along the legs at the continuous time `f` (in ticks). Between legs it holds at the
// end of the last leg flown. Constant speed: the leg is walked by arc length.
export function craftPose(legs, start, f) {
  let p = start
  let t = [0, 0, 1]
  let index = -1
  for (let i = 0; i < legs.length; i++) {
    const leg = legs[i]
    if (f >= leg.t1) {
      p = endOf(leg.poly)
      t = tangentAtEnd(leg.poly)
      index = i
      continue
    }
    if (f > leg.t0) {
      const at = pointAt(leg.poly, (f - leg.t0) / (leg.t1 - leg.t0))
      return { p: at.p, t: at.t, legIndex: i, moving: true }
    }
    break
  }
  return { p, t, legIndex: index, moving: false }
}

// The time the craft is flying toward: the end of the leg that starts at this tick, else the tick itself.
export function pursuitTarget(legs, tick) {
  const leg = legs.find((l) => tick >= l.t0 && tick < l.t1)
  return leg ? leg.t1 : tick
}

// One frame of the craft's clock. It never runs ahead of the leg the demo is on, never lags by more than
// a leg, and snaps on a restart (time goes backwards) or a jump (reduced motion shows the finished run).
export function advanceCraft(f, tick, legs, dtMs, tickMs = TICK_MS) {
  const target = pursuitTarget(legs, tick)
  if (f > target + 1e-9 || target - f > 2.5) return target
  const from = Math.max(f, Math.min(tick, target))
  return Math.min(target, from + dtMs / tickMs)
}

// Where the craft rests at a tick, for the static drawing: every leg that has finished.
export const restingPose = (model, tick) => craftPose(model.legs, model.start, tick)

// Share of an edge the craft has flown at time `f`: the lit part of the trajectory.
export function litFraction(edge, f) {
  if (edge.t0 == null) return 0
  return Math.min(1, Math.max(0, (f - edge.t0) / (edge.t1 - edge.t0)))
}

// The orbit-insertion ellipse drawn at a successful outcome, and the path the craft rides once it is
// there. It lies roughly flat and is tilted a little toward the viewer so it reads as an ellipse.
export const ORBIT = { a: 0.78, b: 0.36, tilt: 0.28 }

export function orbitPoint(center, theta, { a, b, tilt } = ORBIT) {
  const x = a * Math.cos(theta)
  const z = b * Math.sin(theta)
  return [center[0] + x, center[1] - z * Math.sin(tilt), center[2] + z * Math.cos(tilt)]
}
