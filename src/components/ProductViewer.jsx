import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { MoveHorizontal } from 'lucide-react'
import { useReducedMotion } from '../hooks/useReducedMotion'
import {
  activeRegion,
  boxStyle,
  chipSide,
  focusInit,
  focusReducer,
  pad2,
  regionHandlers,
  scrollTargetLeft,
} from './regions'
import { buildXGraph, projectToBox } from './scene/graph'
import { SignalButton } from './ui'
import { useOverflowX } from './useOverflowX'
import './Deployments.css'

// A record with no screenshot (currently just the campus demo card — it links to a live 3D
// section further down this same page rather than showing a static image of it) falls back to
// the same X the page is built around, drawn from the shared graph (scene/graph.js), behind the
// label and the link.
const FALLBACK_GRAPH = buildXGraph({ perArm: 5, ringEvery: 2 })
const FALLBACK_POINTS = projectToBox(FALLBACK_GRAPH, 240, 240, 14)

function FallbackX() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 240 240"
      fill="none"
      className="absolute right-6 top-1/2 hidden aspect-square h-[80%] -translate-y-1/2 sm:block"
    >
      {FALLBACK_GRAPH.edges.map(([a, b, kind]) => (
        <line
          key={`${a}-${b}`}
          x1={FALLBACK_POINTS[a].x}
          y1={FALLBACK_POINTS[a].y}
          x2={FALLBACK_POINTS[b].x}
          y2={FALLBACK_POINTS[b].y}
          strokeWidth="1"
          className={kind === 'ring' ? 'stroke-cmd-line' : 'stroke-cmd-faint/60'}
        />
      ))}
      {FALLBACK_GRAPH.nodes.map((n) => (
        <circle
          key={n.id}
          cx={FALLBACK_POINTS[n.id].x}
          cy={FALLBACK_POINTS[n.id].y}
          r={n.kind === 'hub' ? 4 : n.kind === 'tip' ? 3 : 1.8}
          className={n.kind === 'hub' ? 'fill-cmd-signal' : 'fill-cmd-faint'}
        />
      ))}
      <circle cx="120" cy="120" r="10" strokeWidth="1" className="stroke-cmd-signal/40" />
    </svg>
  )
}

function FallbackPanel({ record }) {
  return (
    <div className="relative flex min-h-[17rem] items-center overflow-hidden px-6 py-8 sm:px-10 md:aspect-[1869/958]">
      <span aria-hidden="true" className="cmd-grid absolute inset-0" />
      <FallbackX />
      <div className="relative max-w-[24rem] md:max-w-[46%]">
        <p className="text-lg text-cmd-text">{record.summary}</p>
        <div className="mt-6">
          <SignalButton href={record.link.href}>{record.link.label}</SignalButton>
        </div>
      </div>
    </div>
  )
}

// The deployment viewer: a monitor frame showing the record's real screenshot, the regions of the
// product outlined over it, and the region list under it. Mount it with
// `key={record.id}` so selecting a record replays M10 (docs/concepts/01-command-implementation.md §6):
// a scan reveals the screen, then the regions light in turn and settle to a quiet outline.
// `play` is true once the section is on screen; the scan also waits for the image to load.
export default function ProductViewer({ record, play }) {
  const regions = record.regions ?? []
  const [state, dispatch] = useReducer(focusReducer, focusInit)
  const active = activeRegion(state)
  const [loaded, setLoaded] = useState(!record.screen)
  const scrollerRef = useRef(null)
  const overflowing = useOverflowX(scrollerRef)
  const reduced = useReducedMotion()

  // Never leave the frame blank: if the screenshot is slow, play the scan anyway after a moment.
  useEffect(() => {
    if (!play || loaded) return
    const timer = window.setTimeout(() => setLoaded(true), 2500)
    return () => window.clearTimeout(timer)
  }, [play, loaded])

  // An image that finished before React attached its load listener (cache hit) would never report.
  const imgRef = useCallback((img) => {
    if (img?.complete) setLoaded(true)
  }, [])

  // ESS is wider than a phone: bring a region into view when it is picked from the list.
  const reveal = useCallback(
    (id) => {
      const scroller = scrollerRef.current
      const box = scroller?.querySelector(`[data-region="${id}"]`)
      if (!box) return
      const left = scrollTargetLeft({
        boxLeft: box.offsetLeft,
        boxWidth: box.offsetWidth,
        viewWidth: scroller.clientWidth,
        scrollLeft: scroller.scrollLeft,
        contentWidth: scroller.scrollWidth,
      })
      if (left != null) scroller.scrollTo({ left, behavior: reduced ? 'auto' : 'smooth' })
    },
    [reduced],
  )

  const activeIndex = regions.findIndex((r) => r.id === active)
  const current = activeIndex >= 0 ? regions[activeIndex] : null
  const { screen } = record

  return (
    <div>
      <div className="cmd-ticks border border-cmd-line bg-cmd-surface">
        <div className="flex items-center justify-between gap-4 border-b border-cmd-line px-4 py-2.5">
          <p className="cmd-label flex shrink-0 items-center gap-2 text-cmd-muted">
            <span aria-hidden="true" className="h-1.5 w-1.5 bg-cmd-signal" />
            {record.code}
          </p>
          {/* A readout of the lit region. The list below carries the same information for assistive tech. */}
          <p aria-hidden="true" className="cmd-label min-w-0 truncate text-right text-cmd-faint">
            {current ? (
              <>
                <span className="text-cmd-signal-fg">{pad2(activeIndex + 1)}</span> / {pad2(regions.length)} · {current.label}
              </>
            ) : regions.length > 0 ? (
              <>
                {record.regionsTitle} · {pad2(regions.length)}
              </>
            ) : (
              record.kind
            )}
          </p>
        </div>

        {/* Keyboard access to the scroll box only while it really scrolls (ESS on a narrow screen). */}
        <div
          ref={scrollerRef}
          className="overflow-x-auto"
          {...(overflowing && record.scrollHint ? { tabIndex: 0, role: 'region', 'aria-label': record.scrollHint } : null)}
        >
          <div
            data-play={play && loaded ? 'true' : 'false'}
            data-focus={active ? 'true' : 'false'}
            className={`dv-view relative overflow-hidden ${record.scrollHint ? 'min-w-[36rem]' : ''}`}
          >
            <div className="dv-shot">
              {screen ? (
                <img
                  ref={imgRef}
                  src={screen.src}
                  alt={screen.alt}
                  width={screen.width}
                  height={screen.height}
                  /* Not lazy: the frame stays clipped until the scan plays, and a browser will not load a lazy
                     image that sits inside a fully clipped box, so the two would wait on each other. */
                  loading="eager"
                  fetchpriority="low"
                  decoding="async"
                  onLoad={() => setLoaded(true)}
                  onError={() => setLoaded(true)}
                  className="block h-auto w-full"
                />
              ) : (
                <FallbackPanel record={record} />
              )}
            </div>
            {regions.map((region, ri) =>
              region.boxes.map((box, bi) => {
                const on = active === region.id
                return (
                  <span
                    key={`${region.id}-${bi}`}
                    data-region={bi === 0 ? region.id : undefined}
                    data-active={on ? 'true' : undefined}
                    aria-hidden="true"
                    className="dv-box"
                    style={{ ...boxStyle(box), '--i': ri }}
                    {...regionHandlers(dispatch, region.id, reveal)}
                  >
                    <span className="dv-wash" />
                    <span className="dv-edge" />
                    <span data-side={chipSide(box)} className="dv-chip font-cmd-mono">
                      <span className="tabular-nums">{pad2(ri + 1)}</span>
                      {bi === 0 && <span className="dv-chip__label">{region.label}</span>}
                    </span>
                  </span>
                )
              }),
            )}
            <span aria-hidden="true" className="dv-scan" />
          </div>
        </div>

        {overflowing && record.scrollHint && (
          <p aria-hidden="true" className="cmd-label flex items-center gap-2 border-t border-cmd-line px-4 py-2.5 text-cmd-faint">
            <MoveHorizontal className="h-3.5 w-3.5 shrink-0" />
            {record.scrollHint}
          </p>
        )}
      </div>

      {regions.length > 0 && (
        <div className="mt-8">
          <h3 id={`${record.id}-regions`} className="cmd-label flex items-center gap-3 text-cmd-muted">
            <span className="text-cmd-signal-fg">{pad2(regions.length)}</span>
            <span aria-hidden="true" className="h-px w-8 bg-cmd-line" />
            <span>{record.regionsTitle}</span>
          </h3>
          <ul aria-labelledby={`${record.id}-regions`} className="mt-4 grid border-b border-cmd-line sm:grid-cols-2 sm:gap-x-8">
            {regions.map((region, i) => {
              const on = active === region.id
              return (
                <li key={region.id} className="border-t border-cmd-line">
                  <button
                    type="button"
                    aria-pressed={state.pinned === region.id}
                    data-on={on ? 'true' : 'false'}
                    {...regionHandlers(dispatch, region.id, reveal)}
                    className="dv-pick group flex min-h-[44px] w-full items-start gap-4 px-4 py-3 text-left focus-visible:[outline-offset:-2px]"
                  >
                    <span className="cmd-label w-6 shrink-0 pt-[3px] tabular-nums text-cmd-faint group-data-[on=true]:text-cmd-signal-fg">
                      {pad2(i + 1)}
                    </span>
                    <span className="text-sm leading-snug text-cmd-muted group-data-[on=true]:text-cmd-text">{region.label}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
