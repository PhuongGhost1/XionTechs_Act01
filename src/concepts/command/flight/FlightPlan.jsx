import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { RotateCcw } from 'lucide-react'
import { useInView } from '../../../hooks/useInView'
import { useReducedMotion } from '../../../hooks/useReducedMotion'
import { useAgentDemo } from '../../../workflow/useAgentDemo'
import { flightPlan } from '../content'
import { readEnvironment, sceneState, subscribe } from '../scene/store'
import { IllustrativeTag, Reveal } from '../ui'
import { PANEL_ID, tabId } from './controlStyles'
import { DecisionBar, MissionTabs, PauseMotionInline, ViewToggle } from './FlightControls'
import FlightLabels from './FlightLabels'
import FlightReadout from './FlightReadout'
import FlightSvg from './FlightSvg'
import { keyOrbit } from './camera'
import { buildJourneyModel, buildPlanModel } from './model'
import { TIERS, flightTier } from './tier'
import './FlightPlan.css'

// The body of section 05, "Flight plan" (the frame and heading are FlightSection.jsx; this file is the lazy
// chunk behind it). The AI agent demo as a mission-control trajectory plot. The scenarios are the main
// page's illustrative demo, read through useAgentDemo; this section only draws them.
//
// Renderers, by tier (tier.js): the full and lite tiers load a lazy three.js chunk (FlightCanvas) with its
// own small canvas; everything else (reduced motion, saveData, low power, no WebGL, a lost context) keeps
// the flat SVG drawing and never requests that chunk. The HTML labels and the readout are the same in both.
const FlightCanvas = lazy(() => import('./FlightCanvas').catch(() => ({ default: () => null })))

const COMPACT_BELOW = 900 // px of stage width: labels shrink to their flight number (the readout names them)

function useStageSize(ref) {
  const [size, setSize] = useState({ w: 960, h: 560 })
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const measure = () => setSize((s) => (s.w === el.clientWidth && s.h === el.clientHeight ? s : { w: el.clientWidth, h: el.clientHeight }))
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return size
}

export default function FlightPlan() {
  const rootRef = useRef(null)
  const stageRef = useRef(null)
  const replayRef = useRef(null)
  const apiRef = useRef(null)
  const liveRef = useRef(null)
  const labelEls = useRef(new Map())
  const labelRefs = useRef(new Map())

  const reduced = useReducedMotion()
  const paused = useSyncExternalStore(subscribe, () => sceneState.paused, () => false)
  const nearView = useInView(rootRef, { rootMargin: '700px 0px' })
  const inView = useInView(stageRef)
  const demo = useAgentDemo({ reduced, running: inView && !paused })

  // The renderer tier is decided once the page is mounted, and again when the visitor changes the motion setting.
  const [tier, setTier] = useState('svg')
  const [lost, setLost] = useState(false)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    setTier(flightTier(readEnvironment()))
  }, [reduced])
  const canvasOn = tier !== 'svg' && !lost && nearView
  const three = canvasOn && ready
  useEffect(() => {
    if (!canvasOn) setReady(false)
  }, [canvasOn])
  const onReady = useCallback(() => setReady(true), [])
  const onLost = useCallback(() => setLost(true), [])

  const size = useStageSize(stageRef)
  const compact = size.w < COMPACT_BELOW

  const segments = TIERS[tier].segments
  const model = useMemo(
    () => (demo.view === 'workflow' ? buildPlanModel(demo.workflow, demo.run, { segments }) : buildJourneyModel(demo.journey, { segments })),
    [demo.view, demo.workflow, demo.run, demo.journey, segments],
  )

  // The scene reads this every frame; React never re-renders for a frame.
  useLayoutEffect(() => {
    liveRef.current = { model, tick: demo.tick, run: demo.run, state: demo.state, jState: demo.jState, view: demo.view, runId: demo.runId }
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

  const onKeyDown = (e) => {
    if (!three) return
    const k = keyOrbit(e.key)
    if (!k) return
    e.preventDefault()
    if (k.reset) apiRef.current?.resetView()
    else apiRef.current?.nudge(k.dyaw, k.dpitch)
  }

  return (
        <Reveal delay={120}>
          <div ref={rootRef} className="cmd-ticks border border-cmd-line bg-cmd-bg">
            <div className="border-b border-cmd-line">
              <MissionTabs demo={demo} />
            </div>
            <div role="tabpanel" id={PANEL_ID} aria-labelledby={tabId(demo.workflow.id)}>
              <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-cmd-line px-5 py-3">
                <IllustrativeTag>{flightPlan.badge}</IllustrativeTag>
                <ViewToggle demo={demo} />
              </div>

              <div className="relative">
                <div className="flex flex-wrap items-center justify-end gap-2 border-b border-cmd-line px-3 py-2 sm:absolute sm:right-3 sm:top-3 sm:z-10 sm:border-0 sm:p-0">
                  {three && (
                    <button
                      type="button"
                      onClick={() => apiRef.current?.resetView()}
                      className="cmd-label inline-flex min-h-[44px] items-center gap-2 border border-cmd-line bg-cmd-bg/80 px-3 text-cmd-muted transition-colors duration-micro ease-cmd hover:border-cmd-faint hover:text-cmd-text"
                    >
                      <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
                      {flightPlan.resetView}
                    </button>
                  )}
                  <PauseMotionInline paused={paused} />
                </div>
              <div
                ref={stageRef}
                role="group"
                aria-label={flightPlan.stageLabel}
                aria-describedby="fp-hint"
                tabIndex={three ? 0 : undefined}
                data-render={three ? '3d' : '2d'}
                onKeyDown={onKeyDown}
                className={`fp-stage relative overflow-hidden ${demo.view === 'agent' ? 'h-[280px] sm:h-[380px] lg:h-[500px]' : 'h-[420px] sm:h-[520px] lg:h-[700px]'}`}
              >
                <span aria-hidden="true" className="cmd-grid absolute inset-0 opacity-40" />
                <FlightSvg
                  model={model}
                  run={demo.run}
                  state={demo.state}
                  jState={demo.jState}
                  tick={demo.tick}
                  size={size}
                  animate={!reduced && tier === 'svg'}
                />
                {canvasOn && (
                  <Suspense fallback={null}>
                    <FlightCanvas tier={tier} liveRef={liveRef} getLabels={getLabels} apiRef={apiRef} onReady={onReady} onLost={onLost} />
                  </Suspense>
                )}
                <FlightLabels model={model} demo={demo} size={size} three={three} compact={compact} labelRef={labelRef} />
                <p id="fp-hint" className="cmd-label pointer-events-none absolute bottom-3 left-4 right-4 text-cmd-faint">
                  {three ? flightPlan.stageHint : flightPlan.fallbackNote}
                </p>
              </div>
              </div>

              <DecisionBar demo={demo} onDecided={() => replayRef.current?.focus()} />
              <FlightReadout demo={demo} model={model} compact={compact} replayRef={replayRef} />
            </div>
          </div>
        </Reveal>
  )
}
