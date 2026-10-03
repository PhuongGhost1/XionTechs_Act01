import { useEffect, useState } from 'react'
import { useActiveStation, useReducedMotion } from '../runtime/hooks.js'
import './frame.css'
import { shouldFire } from './logic.js'

// M05 signal line (doc 7.2): a 1 px yellow line crosses the top of the viewport once, in 700 ms,
// the first time stations 01, 03, 04 and 06 become active, once each per session. It marks the
// moment a chapter begins and nothing else. The element is invisible at rest (motion.css
// .anim-signal-line keeps the final state), so under reduced motion or with MOTION off there is
// nothing to show: the dock's tick for the active station, which is yellow and taller, is the
// state that carries the information there, and no station is marked as "seen" while motion is off.

const KEY = 'xt-signal'

// sessionStorage can be blocked (private window): the in-memory list then still gives "once per
// page load", which is the best that can be promised.
function readSeen() {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter(Number.isInteger) : []
  } catch {
    return []
  }
}

function writeSeen(list) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(list))
  } catch {
    // Not remembered across reloads. Nothing else depends on it.
  }
}

let seenStations = null

export default function SignalLine() {
  const station = useActiveStation()
  const motionOff = useReducedMotion()
  const [runs, setRuns] = useState(0)

  useEffect(() => {
    if (motionOff) return
    seenStations ??= readSeen()
    if (!shouldFire(station.index, seenStations)) return
    seenStations = [...seenStations, station.index]
    writeSeen(seenStations)
    setRuns((n) => n + 1)
  }, [station.index, motionOff])

  return (
    <div
      // A new key restarts the animation for the next station.
      key={runs}
      aria-hidden="true"
      data-decor=""
      data-signal-line=""
      className={`pointer-events-none fixed inset-x-0 top-0 z-50 h-px bg-signal opacity-0 ${runs > 0 ? 'anim-signal-line' : ''}`}
    />
  )
}
