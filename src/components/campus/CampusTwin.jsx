import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { useInView } from '../../hooks/useInView'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { DAY } from '../campusData'
import { campus } from '../content'
import { readEnvironment, sceneState, subscribe } from '../scene/store'
import { getThemeId, subscribe as subscribeTheme } from '../theme'
import { IllustrativeTag, PendingTag, Reveal } from '../ui'
import CampusLabels from './CampusLabels'
import CampusPanel from './CampusPanel'
import CampusSvg from './CampusSvg'
import { Breadcrumb, DayBar, LayerBar, StageButtons } from './CampusControls'
import { keyCommand } from './camera'
import { campusAt } from './live'
import { buildCampusModel } from './model'
import { ROOT, breadcrumb, levelOf, pick, up } from './navigation'
import { campusTier } from './tier'
import './Campus.css'

// The body of section 05, "Smart school campus" (the frame and heading are CampusSection.jsx; this file is the lazy
// chunk behind it). An illustrative school campus as a 3D maquette: buildings open into rooms, rooms show
// their IoT devices and simulated readings, and a day scrubber moves time (docs/superpowers/specs/
// 2026-10-06-smart-campus-design.md).
//
// Renderers, by tier (tier.js): full and lite load a lazy three.js chunk (CampusCanvas); everything else
// (reduced motion, saveData, low power, no WebGL, a lost context) keeps the flat SVG site plan and never
// requests that chunk. The side panel is the same in both and is the keyboard route into every room.
const CampusCanvas = lazy(() => import('./CampusCanvas').catch(() => ({ default: () => null })))

const model = buildCampusModel()
const DAY_SECONDS = 60 // one school day of autoplay
const STEP_MS = 120
const START = 9 * 60 + 40 // a lesson in progress: the first thing a visitor sees is a busy campus

export default function CampusTwin() {
  const rootRef = useRef(null)
  const stageRef = useRef(null)
  const apiRef = useRef(null)
  const liveRef = useRef(null)
  const labelEls = useRef(new Map())
  const labelRefs = useRef(new Map())

  const reduced = useReducedMotion()
  const paused = useSyncExternalStore(subscribe, () => sceneState.paused, () => false)
  // Same colour-caching issue as the X core (readColors() in campusScene.js runs once at
  // creation): key the canvas by theme so switching themes forces a fresh mount.
  const theme = useSyncExternalStore(subscribeTheme, getThemeId, () => 'navy')
  const nearView = useInView(rootRef, { rootMargin: '700px 0px' })
  const inView = useInView(stageRef)

  const [tier, setTier] = useState('svg')
  const [lost, setLost] = useState(false)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    setTier(campusTier(readEnvironment()))
  }, [reduced])
  const canvasOn = tier !== 'svg' && !lost && nearView
  const three = canvasOn && ready
  useEffect(() => {
    if (!canvasOn) setReady(false)
  }, [canvasOn])
  // Also enables labels directly on whichever engine just became ready, not just via the
  // [three]-dependent effect below: a theme switch remounts CampusCanvas (key={theme}, so its
  // colours stay correct — see campusScene.js), creating a brand-new engine instance, but `ready`
  // was already true from the previous one, so `three` never actually changes value and that
  // effect never re-fires for the new instance. Its own labelsOn starts false and stays false —
  // the labels' text is still there (React never stopped rendering it), they just never get
  // positioned or made visible. onReady (the engine's own "first frame drawn" signal) fires fresh
  // for every engine, remount included, so enabling here is correct regardless of why `ready` did
  // or didn't change.
  const onReady = useCallback(() => {
    setReady(true)
    apiRef.current?.setLabelsEnabled(true)
  }, [])
  const onLost = useCallback(() => setLost(true), [])

  const [sel, setSel] = useState(ROOT)
  const [hover, setHover] = useState(null)
  const [layer, setLayer] = useState('none')
  const [time, setTime] = useState(START)
  const [playing, setPlaying] = useState(true)
  const [tab, setTab] = useState('telemetry') // the room panel's tab
  const [acked, setAcked] = useState(() => new Set()) // alarms the visitor acknowledged (this page only)
  const onAck = useCallback((id) => setAcked((s) => new Set(s).add(id)), [])

  // Autoplay the day while the model is on screen, unless the visitor paused it, paused motion, or prefers
  // reduced motion (then the scrubber still works, it just does not move by itself).
  const running = playing && inView && !paused && !reduced
  useEffect(() => {
    if (!running) return undefined
    const perStep = ((DAY.end - DAY.start) / DAY_SECONDS) * (STEP_MS / 1000)
    const id = window.setInterval(() => {
      setTime((t) => (t + perStep >= DAY.end ? DAY.start : t + perStep))
    }, STEP_MS)
    return () => window.clearInterval(id)
  }, [running])

  const minute = Math.round(time)
  const live = useMemo(() => campusAt(model, minute, layer), [minute, layer])

  // The scene reads this every frame; React never re-renders for a frame.
  const version = useRef(0)
  useLayoutEffect(() => {
    version.current++
    liveRef.current = { ...live, sel, hover, layer, reduced, version: version.current }
    apiRef.current?.wake()
  })
  useEffect(() => {
    apiRef.current?.setLabelsEnabled(three)
  }, [three])

  const getLabels = useCallback(() => labelEls.current, [])
  const labelRef = useCallback((id) => {
    let fn = labelRefs.current.get(id)
    if (!fn) {
      fn = (el) => {
        if (el) labelEls.current.set(id, el)
        else labelEls.current.delete(id)
      }
      labelRefs.current.set(id, fn)
    }
    return fn
  }, [])

  // Picking a building or room pauses the day, the same as dragging the scrubber (onTime) already
  // does: autoplay is 60 seconds for a whole school day, so leaving it running while someone is
  // reading one room's telemetry/camera feed means the lamps/readings — and the feed's day/night
  // filter — visibly change out from under them every few seconds. Freeze on whatever moment they
  // clicked in, same precedent as a manual scrub; nothing auto-resumes it.
  const select = useCallback((next, nextTab = 'telemetry') => {
    setSel(next)
    setHover(null)
    setTab(nextTab)
    setPlaying(false)
  }, [])
  const onPick = useCallback((hit) => {
    setSel((s) => pick(model, s, hit))
    setTab('telemetry')
    setPlaying(false)
  }, [])
  const onSceneHover = useCallback((hit) => setHover(hit), [])
  const onTime = (t) => {
    setPlaying(false)
    setTime(t)
  }
  const resetView = () => {
    select(ROOT)
    apiRef.current?.resetView()
  }

  const onKeyDown = (e) => {
    const k = keyCommand(e.key)
    if (!k) return
    if (k.up) {
      if (levelOf(sel) === 'campus') apiRef.current?.resetView()
      else select(up(sel))
      e.preventDefault()
      return
    }
    if (!three) return
    e.preventDefault()
    if (k.zoom) apiRef.current?.zoomBy(k.zoom)
    else apiRef.current?.nudge(k.dyaw, k.dpitch)
  }

  // Camera feeds in the panel draw from the 3D scene while it runs (CampusFeed.jsx).
  const registerFeed = useCallback((deviceId, canvas) => apiRef.current?.registerFeed(deviceId, canvas) ?? (() => {}), [])
  const feeds = useMemo(() => ({ three, register: registerFeed }), [three, registerFeed])

  const crumbs = breadcrumb(model, sel, campus.campusCrumb)

  return (
    <Reveal delay={120}>
      <div ref={rootRef} className="cmd-ticks border border-cmd-line bg-cmd-bg">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-cmd-line px-5 py-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <IllustrativeTag>{campus.badge}</IllustrativeTag>
            <PendingTag>{campus.servicesNote}</PendingTag>
          </div>
          <LayerBar layer={layer} onChange={setLayer} />
        </div>

        <div className="grid lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="relative min-w-0 lg:border-r lg:border-cmd-line">
            <div
              ref={stageRef}
              role="group"
              aria-label={campus.stageLabel}
              aria-describedby="cp-hint"
              tabIndex={0}
              data-render={three ? '3d' : '2d'}
              onKeyDown={onKeyDown}
              className="cp-stage relative h-[480px] overflow-hidden sm:h-[540px] lg:h-[640px]"
            >
              <span aria-hidden="true" className="cmd-grid absolute inset-0 opacity-30" />
              <div className="absolute inset-x-2 bottom-10 top-16">
                <CampusSvg model={model} live={live} sel={sel} hover={hover} layer={layer} onSelect={select} onHover={setHover} />
              </div>
              {canvasOn && (
                <Suspense fallback={null}>
                  <CampusCanvas
                    key={theme}
                    tier={tier}
                    model={model}
                    liveRef={liveRef}
                    getLabels={getLabels}
                    apiRef={apiRef}
                    onReady={onReady}
                    onLost={onLost}
                    onHover={onSceneHover}
                    onPick={onPick}
                  />
                </Suspense>
              )}
              {three && <CampusLabels model={model} sel={sel} hover={hover} live={live} labelRef={labelRef} />}
              <div className="pointer-events-none absolute left-3 right-3 top-3 z-10 flex items-start justify-between gap-2">
                <Breadcrumb crumbs={crumbs} onGo={select} />
                <div className="pointer-events-auto">
                  <StageButtons three={three} paused={paused} onZoom={(f) => apiRef.current?.zoomBy(f)} onReset={resetView} />
                </div>
              </div>
              <p id="cp-hint" className="cmd-label pointer-events-none absolute bottom-3 left-4 right-4 hidden text-cmd-faint sm:block">
                {three ? campus.stageHint : campus.fallbackNote}
              </p>
            </div>
            <DayBar time={time} playing={playing && !reduced} onPlay={setPlaying} onTime={onTime} />
          </div>
          {/* On wide screens the panel scrolls inside the height the stage and the day bar set. */}
          <aside aria-label={campus.label} className="relative border-t border-cmd-line lg:border-t-0">
            <div className="max-h-[720px] overflow-y-auto lg:absolute lg:inset-0 lg:max-h-none">
              <CampusPanel
                model={model}
                live={live}
                sel={sel}
                hover={hover}
                time={minute}
                feeds={feeds}
                tab={tab}
                onTab={setTab}
                acked={acked}
                onAck={onAck}
                onSelect={select}
                onHover={setHover}
              />
            </div>
          </aside>
        </div>
      </div>
    </Reveal>
  )
}
