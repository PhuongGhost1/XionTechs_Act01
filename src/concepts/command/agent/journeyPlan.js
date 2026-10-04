// "Agent at work": one arm gathers context tokens from the stops around a context tray. Resource stops
// are hexes, skill stops are notched hexes, and the compaction stop is a glyph hex where the arm presses
// the stacked tokens into one. Pure, same contract as plan.js: `journeyPoseAt(scene, tick, u)`.
import { journeyEvents, journeyStateAt } from '../../../workflow/journey.js'
import { layoutJourney } from './hexboard.js'
import { SLAB, armGeometry, armSolve, hoverZ } from './plan.js'
import { clamp01, ease, easeIO, lerp, seg, transfer } from './motion.js'

export const JTOP = { resource: 0.45, skill: 0.45, compact: 0.6, tray: 0.16 }

export function buildJourneyScene(journey) {
  const layout = layoutJourney(journey)
  const stops = layout.stops.map((s) => ({
    ...s, id: `stop-${s.i}`, top: JTOP[s.kind], label: journey.stops[s.i].label ?? null, status: journey.stops[s.i].status,
  }))
  const tray = { id: 'tray', x: 0, y: 0, top: JTOP.tray }
  const arms = armGeometry(layout, [...stops, tray], false)
  const events = journeyEvents(journey)
  return {
    kind: 'journey', journey, layout, stops, tray, arms, events, total: events.length, box: layout.box, withB: false,
    home: { x: 0, y: 0, z: hoverZ(tray.top) + 0.4 },
    compactIndex: journey.stops.findIndex((s) => s.kind === 'compact'),
  }
}

// Tokens on the tray once stop i has finished (a compaction leaves one).
export function stackAfter(journey, i) {
  let n = 0
  for (let k = 0; k <= i; k++) n = journey.stops[k].kind === 'compact' ? 1 : n + 1
  return n
}

const trayZ = (scene, n) => scene.tray.top + n * SLAB // gripper tip resting on a stack of n slabs

export function journeyPoseAt(scene, rawTick, rawU = 1) {
  const { stops, tray, events, journey } = scene
  const tick = Math.max(0, Math.min(rawTick, scene.total))
  const u = clamp01(rawU)
  const ev = events[tick]
  const lastStop = stops.length - 1
  const out = { tick, u, tokens: [], chips: [], stacks: [], rings: [], bays: {}, routers: {}, gate: null }

  const finish = (g, holding) => {
    const sol = armSolve(scene.arms[0], g)
    out.arms = [{ id: 'A', base: scene.arms[0].base, elbow: sol.elbow, wrist: sol.wrist, z: g.z, holding, clamped: sol.clamped }]
    if (holding) out.tokens.push({ id: 'main', kind: 'main', x: g.x, y: g.y, z: g.z - SLAB, scale: 1, alpha: 1 })
    return out
  }

  if (!ev) {
    // finished: parked above the tray, context stacked
    out.stacks.push({ x: tray.x, y: tray.y, base: tray.top, n: stackAfter(journey, lastStop), f: 1 })
    return finish({ x: tray.x, y: tray.y, z: scene.home.z + 0.3 }, false)
  }

  const stop = stops[ev.stop]
  const compact = stop.kind === 'compact'
  const before = ev.stop === 0 ? 0 : stackAfter(journey, ev.stop - 1)
  const after = stackAfter(journey, ev.stop)
  const low = { x: stop.x, y: stop.y, z: stop.top + SLAB }

  // chips waiting on the stops still to be visited
  stops.forEach((s) => {
    if (s.kind === 'compact') return
    const waiting = s.i > ev.stop || (s.i === ev.stop && (ev.phase === 'moving' || u < 0.18))
    if (waiting) out.chips.push({ x: s.x, y: s.y, z: s.top, i: s.i })
  })

  if (ev.phase === 'moving') {
    const from = ev.stop === 0 ? scene.home : { x: tray.x, y: tray.y, z: trayZ(scene, before) }
    const to = compact ? { x: stop.x, y: stop.y, z: stop.top + before * SLAB + 0.7 } : low
    out.stacks.push({ x: tray.x, y: tray.y, base: tray.top, n: before, f: 1 })
    return finish(transfer(from, to, u), false)
  }

  if (!compact) {
    // grab at 0.18, lift, carry to the tray, set the token on the stack
    const lift = ease(seg(u, 0.18, 0.4))
    const m = easeIO(seg(u, 0.4, 0.85))
    const down = ease(seg(u, 0.85, 1))
    const carry = 1.9
    const z = u < 0.4 ? lerp(low.z, carry, lift) : lerp(carry, trayZ(scene, before + 1), down)
    const g = { x: lerp(low.x, tray.x, m), y: lerp(low.y, tray.y, m), z }
    const placed = u >= 0.97
    out.stacks.push({ x: tray.x, y: tray.y, base: tray.top, n: before + (placed ? 1 : 0), f: 1 })
    return finish(placed ? { ...g, z: trayZ(scene, after) } : g, u >= 0.18 && !placed)
  }

  if (!ev.drain) {
    // compaction: the stack slides to the glyph hex and the gripper presses it down to one slab
    const slide = easeIO(seg(u, 0, 0.45))
    const press = ease(seg(u, 0.5, 1))
    const f = lerp(1, 1 / Math.max(before, 1), press)
    out.stacks.push({ x: lerp(tray.x, stop.x, slide), y: lerp(tray.y, stop.y, slide), base: lerp(tray.top, stop.top, slide), n: before, f })
    out.rings.push({ x: stop.x, y: stop.y, z: stop.top, t: seg(u, 0.5, 1) })
    const top = stop.top + before * SLAB * f
    const z = u < 0.5 ? stop.top + before * SLAB + 0.7 : lerp(stop.top + before * SLAB + 0.7, top + 0.02, press)
    return finish({ x: stop.x, y: stop.y, z }, false)
  }

  // drain: lift the fused token and carry it back to the tray
  const lift = ease(seg(u, 0.2, 0.42))
  const m = easeIO(seg(u, 0.42, 0.85))
  const down = ease(seg(u, 0.85, 1))
  const fusedLow = { x: stop.x, y: stop.y, z: stop.top + SLAB }
  const z = u < 0.42 ? lerp(fusedLow.z, 1.9, lift) : lerp(1.9, trayZ(scene, 1), down)
  const g = { x: lerp(fusedLow.x, tray.x, m), y: lerp(fusedLow.y, tray.y, m), z }
  const placed = u >= 0.97
  const grabbed = u >= 0.2
  if (!grabbed) out.stacks.push({ x: stop.x, y: stop.y, base: stop.top, n: Math.max(before, 1), f: 1 / Math.max(before, 1) })
  else if (placed) out.stacks.push({ x: tray.x, y: tray.y, base: tray.top, n: 1, f: 1 })
  return finish(placed ? { ...g, z: trayZ(scene, after) } : g, grabbed && !placed)
}

// Stops the arm has worked so far (their spokes are drawn as the trail).
export function journeyTrail(scene, tick) {
  const pts = []
  scene.events.forEach((ev, t) => {
    if (ev.phase === 'working' && !ev.drain && t <= tick && scene.stops[ev.stop].kind !== 'compact') {
      const s = scene.stops[ev.stop]
      pts.push({ id: s.id, x: s.x, y: s.y, z: s.top })
    }
  })
  return pts
}

export function journeyStatus(scene, tick) {
  const st = journeyStateAt(scene.journey, tick)
  const status = {}
  scene.stops.forEach((s) => {
    if (s.kind === 'compact') {
      const drainT = scene.events.findIndex((e) => e.stop === s.i && e.drain)
      status[s.id] = st.compacting && st.stopIndex === s.i ? 'working' : tick > drainT ? 'active' : 'future'
      return
    }
    if (!st.done && s.i === st.stopIndex) status[s.id] = st.phase === 'working' ? 'working' : 'future'
    else status[s.id] = st.lit.has(s.i) ? 'active' : 'future'
  })
  status[scene.tray.id] = 'active'
  return { status, state: st }
}

// One row per stop worked, oldest first, for the textual log in this view.
export function journeyLog(scene, tick) {
  const rows = []
  scene.events.forEach((ev, t) => {
    if (t > tick || ev.phase !== 'working' || ev.drain) return
    rows.push({ key: `j${t}`, text: scene.stops[ev.stop].status, kind: scene.stops[ev.stop].kind })
  })
  return rows
}
