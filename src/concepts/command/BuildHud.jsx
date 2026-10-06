import { useEffect, useRef, useState } from 'react'
import { sections } from './content'
import { formatSysTime } from './frameFormat'
import { sceneState, setActiveSection, subscribe } from './scene/store'
import { isSignalSection, pickActiveSection, readout, shouldPlayTransient } from './sectionTracking'
import { useActiveSection } from './useActiveSection'
import './BuildHud.css'

const SECTION_SELECTOR = '[data-cmd-section]'
const REDUCED = '(prefers-reduced-motion: reduce)'
const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
const SETTLE_MS = 80 // a section edge jittering under the 45 percent line plays once, not twice
const MIN_GAP_MS = 900 // the signal line's length: the next play waits until the last has crossed
const ARM_DELAY_MS = 800 // how long after load before a section change counts as the visitor's

// NEEDS content.js: the readout's word.
const BUILD_WORD = 'Build'

// An odometer: every digit is a strip of 0 to 9 that slides to the value, so 002 to 003 rolls.
function Odometer({ value }) {
  return (
    <span className="cmd-hud__odo">
      {[...value].map((ch, i) => (
        <span key={i} className="cmd-hud__digit" style={{ '--d': Number(ch) }}>
          <span className="cmd-hud__strip">
            {DIGITS.map((n) => (
              <span key={n}>{n}</span>
            ))}
          </span>
        </span>
      ))}
    </span>
  )
}

export default function BuildHud() {
  const section = useActiveSection()
  const [signalKey, setSignalKey] = useState(0) // > 0 while the M4 line is on screen
  const [scan, setScan] = useState(null) // { key, stamp } while the M5 scan is on screen
  const scanKey = useRef(0)
  const armed = useRef(false) // false while the page is loading, so loading it plays nothing

  // M4 and M5: play when the active section changes. A smooth scroll from a nav link crosses
  // several sections in a second; spacing the plays out collapses those into the first and the last.
  useEffect(() => {
    let prev = sceneState.section
    let timer = 0
    let lastPlay = -Infinity
    const play = () => {
      if (!shouldPlayTransient({ reduced: window.matchMedia(REDUCED).matches, paused: sceneState.paused })) return
      lastPlay = performance.now()
      if (isSignalSection(sceneState.section)) setSignalKey((k) => k + 1) // a new key restarts the line
      setScan({ key: ++scanKey.current, stamp: formatSysTime(new Date()) })
    }
    const off = subscribe((id) => {
      if (id === prev) return // setPaused notifies listeners too
      prev = id
      if (!armed.current) return
      window.clearTimeout(timer)
      timer = window.setTimeout(play, SETTLE_MS + Math.max(0, MIN_GAP_MS - (performance.now() - lastPlay)))
    })
    return () => {
      off()
      window.clearTimeout(timer)
    }
  }, [])

  // Section tracking and --cmd-scroll share one rAF-throttled, passive scroll/resize handler.
  useEffect(() => {
    const reduced = window.matchMedia(REDUCED)
    const sectionEls = Array.from(document.querySelectorAll(SECTION_SELECTOR)) // all six exist from the first render
    let frame = 0
    let lastY = -1

    const measure = () => {
      frame = 0
      // Reads first, writes after, so the frame forces one layout and not two.
      const tops = sectionEls.map((el) => ({ id: el.id, top: el.getBoundingClientRect().top }))
      const y = Math.round(window.scrollY)
      const id = pickActiveSection(tops, window.innerHeight)
      if (id) setActiveSection(id)
      // M8: the grid drifts with scroll (decoration, so reduced motion keeps it still). The variable is set on
      // the grids themselves: set on <html> it would make every element recompute its style on every frame.
      if (y !== lastY) {
        lastY = y
        const value = reduced.matches ? '0' : String(y)
        for (const grid of document.querySelectorAll('.cmd-grid')) grid.style.setProperty('--cmd-scroll', value)
      }
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure)
    }

    // Landing on the page (a #hash, or a restored scroll position) settles over the first moments:
    // those section changes are the page loading, not the visitor moving, so they play nothing.
    armed.current = false
    measure()
    const arm = window.setTimeout(() => {
      armed.current = true
    }, ARM_DELAY_MS)

    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule, { passive: true })
    // Images and fonts settling move sections without any scroll, so watch the page height too.
    const main = document.getElementById('main')
    const ro = typeof ResizeObserver === 'undefined' || !main ? null : new ResizeObserver(schedule)
    ro?.observe(main)

    return () => {
      window.clearTimeout(arm)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      ro?.disconnect()
      if (frame) cancelAnimationFrame(frame)
      for (const grid of document.querySelectorAll('.cmd-grid')) grid.style.removeProperty('--cmd-scroll')
    }
  }, [])

  const info = readout(sections, section)

  return (
    <>
      {/* M4: the yellow signal line. Re-keyed per activation; removed when it has crossed. */}
      {signalKey > 0 && <div key={`signal-${signalKey}`} aria-hidden="true" className="cmd-hud__signal" onAnimationEnd={() => setSignalKey(0)} />}

      {/* M5: scan line with a system timestamp, at most 700 ms. */}
      {scan && (
        <div key={`scan-${scan.key}`} aria-hidden="true" className="cmd-hud__scan" onAnimationEnd={() => setScan(null)}>
          <span className="cmd-hud__stamp cmd-label">{scan.stamp}</span>
        </div>
      )}

      {/* Build counter: a vertical label in the left margin, so it never sits over the text. Large screens only. */}
      <div
        aria-hidden="true"
        className="cmd-hud__readout cmd-label pointer-events-none fixed bottom-28 left-9 z-40 hidden items-center gap-2 border border-cmd-line bg-cmd-bg px-2.5 py-1 text-cmd-text lg:flex"
      >
        <span className="text-cmd-faint">{BUILD_WORD}</span>
        <Odometer value={info.build} />
        <span className="text-cmd-faint">/ {info.total}</span>
        <span className="h-3 w-px bg-cmd-line" />
        <span key={info.label} className="cmd-hud__label text-cmd-signal-fg">
          {info.label}
        </span>
      </div>

    </>
  )
}
