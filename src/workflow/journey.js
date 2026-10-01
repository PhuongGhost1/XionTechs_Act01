// Pure logic for the "Agent at work" view: staircase layout, camera and per-tick state.
// Components only render what these return.

export const JOURNEY_VIEW = { w: 760, h: 360 }
export const TAG_H = 24
export const CHIP = { w: 230, h: 28, dy: 22 } // status chip under the pill; dy = gap below the stop point
export const PILL = { w: 150, h: 32 }

const PAD = 120
const STEP_X = 200
const LEVELS = [140, 220]
const TAG_OFFSET = 80
const CHAR_W = 7.2 // monospace text-xs advance width in viewBox units
const FILL_MAX = 0.85
const FILL_MIN = 0.15

export const tagWidth = (label) => label.length * CHAR_W + 34

export function layoutJourney(journey) {
  const points = journey.stops.map((_, i) => ({ x: PAD + i * STEP_X, y: LEVELS[i % 2] }))
  const last = points[points.length - 1]
  const tags = []
  journey.stops.forEach((stop, i) => {
    if (stop.kind === 'compact') return
    const side = i % 2 === 0 ? 'above' : 'below'
    const y = side === 'above' ? points[i].y - TAG_OFFSET : points[i].y + TAG_OFFSET
    tags.push({ stopIndex: i, x: points[i].x, y, w: tagWidth(stop.label), side })
  })
  const layout = { points, tags, width: last.x + PAD, height: JOURNEY_VIEW.h }
  layout.path = `${pathUpTo(layout, points.length - 1)} H ${layout.width}`
  return layout
}

export function pathUpTo(layout, stopIndex) {
  const { points } = layout
  let d = `M 0 ${points[0].y} H ${points[0].x}`
  for (let i = 1; i <= stopIndex; i++) {
    const a = points[i - 1]
    const b = points[i]
    const mid = (a.x + b.x) / 2
    d += ` H ${mid} V ${b.y} H ${b.x}`
  }
  return d
}

export function cameraX(layout, stopIndex) {
  const target = layout.points[stopIndex].x - JOURNEY_VIEW.w / 2
  return Math.max(0, Math.min(target, layout.width - JOURNEY_VIEW.w))
}

export function journeyEvents(journey) {
  const events = []
  journey.stops.forEach((stop, i) => {
    events.push({ stop: i, phase: 'moving', drain: false })
    events.push({ stop: i, phase: 'working', drain: false })
    if (stop.kind === 'compact') events.push({ stop: i, phase: 'working', drain: true })
  })
  return events
}

export const journeyTicks = (journey) => journeyEvents(journey).length

// Ring level once stop `i` has finished working.
function fillAfter(journey, i) {
  const c = journey.stops.findIndex((s) => s.kind === 'compact')
  if (c === -1) {
    const n = journey.stops.length
    return (FILL_MAX * (i + 1)) / n
  }
  if (i < c) return (FILL_MAX * (i + 1)) / c
  if (i === c) return FILL_MIN
  const after = journey.stops.length - c - 1
  return FILL_MIN + ((FILL_MAX - FILL_MIN) * (i - c)) / after
}

export function journeyStateAt(journey, tick) {
  const events = journeyEvents(journey)
  const lastStop = journey.stops.length - 1
  const lit = new Set()
  const litUpTo = (upTo) => {
    journey.stops.forEach((s, i) => {
      if (i <= upTo && s.kind !== 'compact') lit.add(i)
    })
  }

  if (tick >= events.length) {
    litUpTo(lastStop)
    return {
      stopIndex: lastStop, phase: 'working', ringFill: fillAfter(journey, lastStop),
      compacting: false, lit, status: 'Task complete', done: true,
    }
  }

  const ev = events[tick]
  const stop = journey.stops[ev.stop]
  litUpTo(ev.phase === 'working' ? ev.stop : ev.stop - 1)

  let ringFill = ev.stop === 0 ? 0 : fillAfter(journey, ev.stop - 1)
  if (ev.phase === 'working' && stop.kind !== 'compact') ringFill = fillAfter(journey, ev.stop)
  if (stop.kind === 'compact' && ev.drain) ringFill = FILL_MIN

  return {
    stopIndex: ev.stop,
    phase: ev.phase,
    ringFill,
    compacting: stop.kind === 'compact' && ev.phase === 'working',
    lit,
    status: stop.status,
    done: false,
  }
}
