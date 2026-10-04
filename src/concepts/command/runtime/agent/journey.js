// PORTED from the main page: src/workflow/journey.js (read 2026-10-04). Copied and adapted.
// Kept: the timeline of the "Agent at work" view (journeyEvents / journeyTicks) and the state at a
// tick (journeyStateAt), with the same tick semantics: per stop one `moving` tick and one
// `working` tick, plus one extra draining tick at the compaction stop. Left behind: the staircase
// layout, the camera and the context ring of the main page's SVG; on the tape the compaction stop
// folds three printed lines into one (tape.js). A stop's words live in `doing` here (the content
// validator reserves the key `status`).

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
    return { stopIndex: lastStop, phase: 'working', compacting: false, lit, doing: null, done: true }
  }

  const ev = events[tick]
  const stop = journey.stops[ev.stop]
  litUpTo(ev.phase === 'working' ? ev.stop : ev.stop - 1)

  return {
    stopIndex: ev.stop,
    phase: ev.phase,
    compacting: stop.kind === 'compact' && ev.phase === 'working',
    lit,
    doing: ev.phase === 'moving' && ev.stop > 0 ? journey.stops[ev.stop - 1].doing : stop.doing,
    done: false,
  }
}
