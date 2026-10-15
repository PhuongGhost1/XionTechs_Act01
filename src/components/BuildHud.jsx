import { useEffect, useRef, useState } from 'react'
import { formatSysTime } from './frameFormat'
import { sceneState, setActiveSection, subscribe } from './scene/store'
import { isSignalSection, pickActiveSection, shouldPlayTransient } from './sectionTracking'
import './BuildHud.css'

const SECTION_SELECTOR = '[data-cmd-section]'
const REDUCED = '(prefers-reduced-motion: reduce)'
const SETTLE_MS = 80 // a section edge jittering under the 45 percent line plays once, not twice
const MIN_GAP_MS = 900 // the signal line's length: the next play waits until the last has crossed
const ARM_DELAY_MS = 800 // how long after load before a section change counts as the visitor's

export default function BuildHud() {
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
    </>
  )
}
