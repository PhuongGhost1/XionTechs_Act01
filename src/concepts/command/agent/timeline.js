// Pure helpers for the timeline strip (the scrubber) and the text alternative of the board.
import { journeyEvents } from '../../../workflow/journey.js'

// One cell per workflow step. Its tick is where scrubbing to it lands: the step's work tick, and the very
// last cell lands on the run's final tick (the resting state).
export function workflowCells(workflow, run, total) {
  const title = Object.fromEntries(workflow.nodes.map((n) => [n.id, n.title]))
  const last = run.steps.length - 1
  return run.steps.map((step, i) => ({
    name: step.map((id) => title[id]).join(' and '),
    tick: i === last ? total : i === 0 ? 0 : 2 * i,
  }))
}

// One cell per stop of the single-agent journey, landing on the tick where that stop is worked.
export function journeyCells(journey) {
  const events = journeyEvents(journey)
  const stopName = (s) => s.label ?? 'Compaction'
  return journey.stops.map((s, i) => ({
    name: stopName(s),
    tick: events.findIndex((e) => e.stop === i && e.phase === 'working'),
  }))
}

// Index of the cell the run is in at `tick`.
export function currentCell(kind, cells, tick) {
  if (kind === 'journey') {
    let cur = 0
    cells.forEach((c, i) => {
      if (tick >= c.tick - 1) cur = i // the moving tick belongs to the stop it travels to
    })
    return cur
  }
  const last = cells.length - 1
  return Math.min(tick === 0 ? 0 : Math.ceil(tick / 2), last)
}

export function cellState(i, current, done) {
  if (i < current || (done && i === current)) return 'done'
  return i === current ? 'current' : 'future'
}

// Keyboard model of the slider: next index for a key, or null.
export function nextCellIndex(key, index, count) {
  switch (key) {
    case 'ArrowRight':
    case 'ArrowUp':
      return Math.min(count - 1, index + 1)
    case 'ArrowLeft':
    case 'ArrowDown':
      return Math.max(0, index - 1)
    case 'Home':
      return 0
    case 'End':
      return count - 1
    default:
      return null
  }
}

// Index under a pointer at `x` inside a strip of `width` px.
export const cellAt = (x, width, count) => Math.max(0, Math.min(count - 1, Math.floor((x / Math.max(1, width)) * count)))
