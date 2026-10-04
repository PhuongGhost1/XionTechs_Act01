import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { agent } from '../content.js'
import { Chip, Mono } from '../ui/index.jsx'
import { runPhase, tickMs, TICK_MS } from '../../../workflow/phase.js'
import { clampYaw, dampYaw, fitProjection, makeProjection } from './iso.js'
import { SQ3, nearestCell } from './hexboard.js'
import { buildScene, poseAt, sceneBounds, stationStatus, tokenTrail } from './plan.js'
import { buildJourneyScene, journeyPoseAt, journeyStatus, journeyTrail } from './journeyPlan.js'
import { drawFrame, readColors } from './draw.js'
import { placeLabels } from './labels.js'

const PITCH = 55
const YAW_STEP = 8

// The board: a canvas drawn by draw.js, HTML labels positioned from the same projection each frame, and
// a drag surface. React renders per tick; per frame only the canvas and the label transforms change.
export default function Stage({ demo, reduced, running, compact, lean = false }) {
  const wrap = useRef(null)
  const canvas = useRef(null)
  const labelEls = useRef(new Map())
  const [noCanvas, setNoCanvas] = useState(false)
  const baseYaw = compact ? 18 : 28

  const { view, workflow, journey, run, tick, state: runState } = demo
  const scene = useMemo(
    () => (view === 'workflow' ? buildScene(workflow, run, { compact }) : buildJourneyScene(journey)),
    [view, workflow, journey, run, compact],
  )
  const dur = view === 'workflow' ? tickMs(runPhase(workflow, runState)) : TICK_MS
  const advancing = demo.playing && running && !reduced

  // Everything the frame loop reads lives in one mutable object, never in React state.
  const S = useRef(null)
  if (!S.current) {
    S.current = { yaw: 28, target: 28, drag: null, elapsed: 0, last: 0, raf: 0, hover: null, w: 0, h: 0, dpr: 1, fit: null, bounds: null, sizes: new Map(), meta: new Map(), colors: null, ctx: null, prev: null, scene: null, tick: 0, dur: TICK_MS, adv: false, reduced: false, base: 28, compact: false }
  }
  const s = S.current

  const render = useCallback(
    (u) => {
      const sc = s.scene
      const cv = canvas.current
      if (!sc || !cv || !s.w || !s.h) return
      if (!s.ctx) {
        s.ctx = cv.getContext('2d')
        if (!s.ctx) {
          setNoCanvas(true)
          return
        }
      }
      if (!s.colors) s.colors = readColors(cv)
      if (!s.bounds || s.bounds.scene !== sc) s.bounds = { scene: sc, pts: sceneBounds(sc) }
      // The camera refits at every yaw, so turning the board never clips it.
      s.fit = fitProjection(s.bounds.pts, s.w, s.h, { yaw: s.yaw, pitch: PITCH, pad: s.compact ? 10 : Math.round(s.h * 0.08), padX: s.compact ? 10 : Math.round(s.w * 0.08), swing: 0 })
      const proj = makeProjection({ yaw: s.yaw, pitch: PITCH, scale: s.fit.scale, cx: s.fit.cx, cy: s.fit.cy, origin: s.fit.origin })
      const t = s.tick
      const wf = sc.kind === 'workflow'
      const pose = wf ? poseAt(sc, t, u) : journeyPoseAt(sc, t, u)
      const st = wf ? stationStatus(sc, t) : journeyStatus(sc, t)
      const trail = wf ? tokenTrail(sc, t) : journeyTrail(sc, t)
      drawFrame(s.ctx, s.w, s.h, s.dpr, {
        scene: sc, pose, proj, c: s.colors, trail, statusMap: st.status, state: wf ? st.state : { lit: new Set() }, hover: s.hover,
      })
      // labels: one transform each, from the same projection
      const hw = Math.round(0.95 * s.fit.scale * (SQ3 / 1.6))
      const items = []
      for (const [id, el] of labelEls.current) {
        const p = wf ? sc.nodes[id] : id === 'tray' ? sc.tray : sc.stops.find((x) => x.id === id)
        if (!p || !el) continue
        const a = proj.project(p.x, p.y, p.top)
        el.style.transform = 'translate3d(' + a.x.toFixed(1) + 'px, ' + a.y.toFixed(1) + 'px, 0)'
        el.style.setProperty('--hw', hw + 'px')
        items.push({ id, x: a.x, y: a.y, prefer: a.x > s.w * 0.62 ? 'l' : 'r', priority: s.meta.get(id) ?? 1, size: s.sizes.get(id) ?? { w: 120, h: 40 } })
      }
      const spots = placeLabels(items, { hw, width: s.w, height: s.h })
      for (const [id, el] of labelEls.current) {
        const sp = spots[id]
        if (!sp) continue
        el.dataset.side = sp.side
        el.style.setProperty('--dy', sp.dy + 'px')
      }
    },
    [s],
  )

  const frame = useCallback(
    (now) => {
      s.raf = 0
      const dt = s.last ? Math.min(64, now - s.last) : 16
      s.last = now
      if (s.adv) s.elapsed = Math.min(s.dur, s.elapsed + dt)
      s.yaw = dampYaw(s.yaw, s.target, s.reduced ? 1 : s.drag ? 0.35 : 0.2)
      render(s.dur ? s.elapsed / s.dur : 1)
      if ((s.adv && s.elapsed < s.dur) || s.yaw !== s.target) s.raf = requestAnimationFrame(frame)
      else s.last = 0
    },
    [s, render],
  )
  const kick = useCallback(() => {
    if (!s.raf) s.raf = requestAnimationFrame(frame)
  }, [s, frame])

  // Sync what React knows (the tick, the scene, whether time moves) into the loop.
  useLayoutEffect(() => {
    const prev = s.prev
    const decision = run.decision ?? null
    let elapsed
    if (reduced) elapsed = dur
    else if (!prev || prev.runId !== demo.runId || prev.view !== view) elapsed = 0
    else if (tick === prev.tick + 1 || (tick === prev.tick && decision !== prev.decision)) elapsed = 0
    else if (tick === prev.tick) elapsed = s.elapsed
    else elapsed = dur // scrubbed: show the settled state
    s.elapsed = Math.min(elapsed, dur)
    s.dur = dur
    s.tick = tick
    s.scene = scene
    s.adv = advancing
    s.reduced = reduced
    s.compact = compact
    if (s.base !== baseYaw) {
      s.base = baseYaw
      s.target = baseYaw
      s.yaw = baseYaw
    }
    s.prev = { runId: demo.runId, view, tick, decision }
    kick()
  }, [s, scene, tick, dur, advancing, reduced, compact, view, demo.runId, run.decision, baseYaw, kick])

  // Size the backing store (DPR capped at 2) and redraw on resize.
  useEffect(() => {
    const cv = canvas.current
    if (!cv) return undefined
    const fit = () => {
      s.dpr = Math.min(window.devicePixelRatio || 1, 2)
      s.w = cv.clientWidth
      s.h = cv.clientHeight
      cv.width = Math.round(s.w * s.dpr)
      cv.height = Math.round(s.h * s.dpr)
      kick()
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(cv)
    return () => {
      ro.disconnect()
      cancelAnimationFrame(s.raf)
      s.raf = 0
    }
  }, [s, kick])

  const turn = (dy) => {
    s.target = clampYaw(s.target + dy, s.base)
    kick()
  }
  const reset = () => {
    s.target = s.base
    kick()
  }
  const onPointerDown = (e) => {
    if (compact || e.button !== 0) return
    s.drag = { x: e.clientX, yaw: s.target }
    wrap.current.setPointerCapture?.(e.pointerId)
  }
  const onPointerMove = (e) => {
    if (s.drag) {
      s.target = clampYaw(s.drag.yaw + (e.clientX - s.drag.x) * 0.3, s.base)
      kick()
      return
    }
    if (compact || !s.fit || !s.scene) return
    const r = canvas.current.getBoundingClientRect()
    const proj = makeProjection({ yaw: s.yaw, pitch: PITCH, scale: s.fit.scale, cx: s.fit.cx, cy: s.fit.cy, origin: s.fit.origin })
    const w = proj.unproject(e.clientX - r.left, e.clientY - r.top, 0.5)
    const cells = s.scene.kind === 'workflow' ? s.scene.nodes : Object.fromEntries([...s.scene.stops, s.scene.tray].map((x) => [x.id, x]))
    const id = nearestCell(cells, w.x, w.y, 0.95)
    if (id !== s.hover) {
      s.hover = id
      kick()
    }
  }
  const endDrag = () => {
    s.drag = null
    kick()
  }
  const onKeyDown = (e) => {
    if (compact) return
    if (e.key === 'ArrowLeft') turn(-YAW_STEP)
    else if (e.key === 'ArrowRight') turn(YAW_STEP)
    else return
    e.preventDefault()
  }

  const labels = useMemo(() => buildLabels(demo, scene, compact, lean), [demo, scene, compact, lean])
  const setLabel = (id) => (el) => {
    if (el) labelEls.current.set(id, el)
    else labelEls.current.delete(id)
  }
  // Labels appear after a render: measure them, then place them right away.
  useLayoutEffect(() => {
    s.sizes.clear()
    s.meta.clear()
    for (const l of labels) {
      const el = labelEls.current.get(l.id)
      const box = el?.firstElementChild
      if (box) s.sizes.set(l.id, { w: box.offsetWidth, h: box.offsetHeight })
      s.meta.set(l.id, l.priority)
    }
    kick()
  }, [s, labels, kick])

  const text = agent.stage
  return (
    <div
      ref={wrap}
      role="group"
      aria-label={text.group}
      tabIndex={compact ? -1 : 0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerLeave={() => {
        if (s.hover) {
          s.hover = null
          kick()
        }
      }}
      onKeyDown={onKeyDown}
      className={`x-ticks relative w-full select-none overflow-hidden border border-x-line ${
        compact ? 'h-[min(118vw,520px)]' : 'h-[clamp(480px,54vw,680px)] cursor-grab active:cursor-grabbing'
      }`}
      style={{ touchAction: 'pan-y' }}
    >
      <canvas ref={canvas} role="img" aria-label={view === 'workflow' ? text.labelPlan : text.labelWork} className="absolute inset-0 h-full w-full" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        {labels.map((l) => (
          <div key={l.id} ref={setLabel(l.id)} className="x-bb" data-side="r">
            <div className={`w-max ${compact ? 'max-w-[9.5rem]' : 'max-w-[11.5rem]'} border bg-x-bg px-2 py-1.5 ${l.box}`}>
              <p className={`text-[0.8125rem] font-medium leading-tight ${l.tone}`}>{l.title}</p>
              {(l.capability || l.word) && (
                <p className="mt-1 flex flex-wrap items-center gap-1">
                  {l.capability && <Chip tone="pending" className="!px-1 !py-0 text-[0.625rem]">{l.capability}</Chip>}
                  {l.word && (
                    <Mono className={`border px-1 py-0 text-[0.625rem] ${l.wordTone}`}>{l.word}</Mono>
                  )}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
      {noCanvas && (
        <p className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-x-mute">{text.noCanvas}</p>
      )}
      <Mono className="pointer-events-none absolute left-3 top-3 text-x-faint" aria-hidden="true">
        {compact ? agent.legend : `${text.drag} / ${agent.legend}`}
      </Mono>
      {!compact && (
        <div className="absolute bottom-3 right-3 flex gap-2" onPointerDown={(e) => e.stopPropagation()}>
          <StageButton onClick={() => turn(-YAW_STEP * 2)} label={text.left}>
            ‹
          </StageButton>
          <StageButton onClick={() => turn(YAW_STEP * 2)} label={text.right}>
            ›
          </StageButton>
          <button
            type="button"
            onClick={reset}
            className="x-mono min-h-11 border border-x-faint bg-x-bg px-3 text-x-mute transition-colors duration-200 ease-x hover:border-x-text hover:text-x-text"
          >
            {text.reset}
          </button>
        </div>
      )}
    </div>
  )
}

function StageButton({ onClick, label, children }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="x-mono min-h-11 min-w-11 border border-x-faint bg-x-bg text-base text-x-mute transition-colors duration-200 ease-x hover:border-x-text hover:text-x-text"
    >
      <span aria-hidden="true">{children}</span>
    </button>
  )
}

// The labels shown over the board at this tick. Phones show only the station being worked; narrower
// screens drop the labels of stations this run does not use.
function buildLabels(demo, scene, compact, lean) {
  const chip = demo.copy.chip
  if (scene.kind === 'journey') {
    const st = journeyStatus(scene, demo.tick).status
    const out = scene.stops.map((p) => ({
      id: p.id,
      title: p.label ?? agent.stage.compaction,
      status: st[p.id],
      kind: p.kind,
    }))
    out.push({ id: 'tray', title: agent.stage.context, status: 'active', kind: 'tray' })
    return out
      .filter((l) => !compact || l.status === 'working' || l.kind === 'tray')
      .map((l) => ({
        ...l,
        capability: null,
        priority: l.status === 'working' ? 3 : l.kind === 'tray' ? 2 : 1,
        word: l.status === 'working' ? chip.working : null,
        wordTone: 'border-x-text text-x-text',
        box: l.status === 'working' ? 'border-x-text' : l.status === 'future' ? 'border-dashed border-x-faint' : 'border-x-line',
        tone: l.status === 'future' ? 'text-x-mute' : 'text-x-text',
      }))
  }
  const { status, state } = stationStatus(scene, demo.tick)
  const list = []
  for (const n of Object.values(scene.nodes)) {
    const s = status[n.id]
    if (s === 'hidden') continue
    const active = s === 'working' || s === 'waiting' || s === 'failing'
    if (compact && !active) continue
    if (lean && s === 'off') continue
    let word = null
    if (state.failing.has(n.id)) word = scene.run.fault ?? chip.problem
    else if (state.retrying.has(n.id)) word = chip.retrying
    else if (state.recovered.has(n.id)) word = chip.recovered
    else if (s === 'waiting') word = chip.waiting
    else if (s === 'working') word = n.type === 'router' ? chip.deciding : chip.working
    else if (n.type === 'outcome' && s === 'active') word = chip.done
    list.push({
      id: n.id,
      title: n.title,
      priority: active ? 3 : s === 'off' ? 0 : 1,
      capability: n.type === 'agent' && s !== 'off' ? n.capability : null,
      word,
      wordTone: s === 'failing' ? 'border-dashed border-x-text text-x-text' : 'border-x-text text-x-text',
      box: s === 'off' ? 'border-dashed border-x-line' : active ? (s === 'waiting' ? 'border-x-signal' : 'border-x-text') : s === 'future' ? 'border-x-line' : 'border-x-line',
      tone: s === 'off' ? 'text-x-faint' : s === 'future' ? 'text-x-mute' : 'text-x-text',
    })
  }
  return list
}
