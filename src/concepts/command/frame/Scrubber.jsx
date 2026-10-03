import { useEffect, useId, useRef, useState } from 'react'
import { frame } from '../content/index.js'
import { STATIONS } from '../contract/stations.js'
import { useActiveStation } from '../runtime/hooks.js'
import {
  getState,
  getTickFractions,
  scrollToPage,
  scrollToStation,
  stepStation,
  subscribeFrame,
  subscribeLayout,
} from '../runtime/scroll.js'
import { cx } from '../ui/cx.js'
import './frame.css'

// The dock's page scrubber (doc 4.9): a real control, not a progress bar. It is a slider whose
// seven values are the stations. Drag or tap it to scroll the page to that point; focus it and use
// the arrow keys (or PageUp / PageDown) to step between sections, Home and End for the ends.
// The thumb and the filled part of the rail follow the page by transform only, written from the
// scroll controller's frame callback, so scrolling never re-renders React. The ticks are the real
// station starts, measured by the controller (they move when the layout does).
//
// The yellow tick is the station you are in; it is also taller, so the state is not colour alone.

const samePositions = (a, b) => a.length === b.length && a.every((v, i) => v === b[i])
const round = (v) => (v === null ? null : Math.round(v * 1000) / 1000)

export default function Scrubber({ className }) {
  const station = useActiveStation()
  const hintId = useId()
  const rootRef = useRef(null)
  const thumbRef = useRef(null)
  const fillRef = useRef(null)
  const widthRef = useRef(0)
  const dragging = useRef(false)
  const [ticks, setTicks] = useState(() => STATIONS.map(() => null))

  // Tick positions follow the layout (resize, fonts, a section changing height).
  useEffect(() => {
    const read = () => setTicks((prev) => {
      const next = getTickFractions().map(round)
      return samePositions(prev, next) ? prev : next
    })
    read()
    return subscribeLayout(read)
  }, [])

  // The thumb: transform only, no React state, one callback per scroll frame.
  useEffect(() => {
    const root = rootRef.current
    if (!root) return undefined
    const place = (st) => {
      const w = widthRef.current
      if (thumbRef.current) thumbRef.current.style.transform = `translateX(${(st.page * (w - 2)).toFixed(1)}px)`
      if (fillRef.current) fillRef.current.style.transform = `scaleX(${st.page.toFixed(4)})`
    }
    // The observer reports the new width itself, so no layout read is needed after the first one.
    const measure = (width) => {
      widthRef.current = width
      place(getState())
    }
    measure(root.clientWidth)
    const ro =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(([entry]) => measure(entry.contentRect.width))
    ro?.observe(root)
    const off = subscribeFrame(place)
    return () => {
      ro?.disconnect()
      off()
    }
  }, [])

  const fractionAt = (clientX) => {
    const r = rootRef.current.getBoundingClientRect()
    return r.width > 0 ? (clientX - r.left) / r.width : 0
  }

  const onPointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return
    dragging.current = true
    e.currentTarget.setPointerCapture?.(e.pointerId)
    scrollToPage(fractionAt(e.clientX))
  }
  const onPointerMove = (e) => {
    if (dragging.current) scrollToPage(fractionAt(e.clientX))
  }
  const onPointerEnd = (e) => {
    dragging.current = false
    e.currentTarget.releasePointerCapture?.(e.pointerId)
  }

  const onKeyDown = (e) => {
    const current = getState().station
    let target = null
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'PageDown') target = stepStation(current, 1)
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown' || e.key === 'PageUp') target = stepStation(current, -1)
    else if (e.key === 'Home') target = 0
    else if (e.key === 'End') target = STATIONS.length - 1
    if (target === null) return
    e.preventDefault()
    scrollToStation(target)
  }

  return (
    <div className={cx('flex h-11 items-stretch', className)}>
      <div
        ref={rootRef}
        role="slider"
        tabIndex={0}
        aria-label={frame.scrub.label.text}
        aria-orientation="horizontal"
        aria-valuemin={0}
        aria-valuemax={STATIONS.length - 1}
        aria-valuenow={station.index}
        aria-valuetext={station.label}
        aria-describedby={hintId}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onKeyDown={onKeyDown}
        className="scrubber min-w-0 flex-1"
      >
        <span className="scrubber__rail" aria-hidden="true" />
        <span ref={fillRef} className="scrubber__fill" aria-hidden="true" />
        {ticks.map((fraction, i) =>
          fraction === null ? null : (
            <span
              key={STATIONS[i].id}
              aria-hidden="true"
              data-active={i === station.index ? 'true' : undefined}
              className="scrubber__tick"
              style={{ left: `calc(${fraction * 100}% - ${fraction}px)` }}
            />
          ),
        )}
        <span ref={thumbRef} className="scrubber__thumb" aria-hidden="true" />
      </div>
      <span id={hintId} className="sr-only">
        {frame.scrub.hint.text}
      </span>
    </div>
  )
}
