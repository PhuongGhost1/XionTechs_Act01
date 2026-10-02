import { useCallback, useEffect, useRef, useState } from 'react'
import { BrainCircuit, Check, CircleCheck, Database, GitBranch, Inbox, Pause, Play, UserRound } from 'lucide-react'
import { hero } from '../content/site'
import { useInView } from '../hooks/useInView'
import { usePointer } from '../hooks/usePointer'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { useScrollProgress } from '../hooks/useScrollProgress'
import {
  W,
  H,
  NODES,
  EDGES,
  STEPS,
  FINAL_STEP,
  nodeState,
  arrivesBySignal,
  edgeState,
  focusAt,
  flattenAt,
  nodePoint,
  edgePath,
  nearestNode,
} from './HeroSystemLayout'
import './HeroSystem.css'

// The hero's connected system (MOTION §5): request → AI agent → decision → business system (with
// the human judgment branch) → done, as a shallow CSS 3D scene. Geometry and the loop timeline
// live in HeroSystemLayout.js; motion and states are CSS (HeroSystem.css). React state is one
// step counter and a pause flag; pointer, proximity and scroll write to the DOM directly.

const ICONS = { request: Inbox, agent: BrainCircuit, decision: GitBranch, system: Database, human: UserRound, done: CircleCheck }
const ARRIVE_MS = 460 // a node lights once the signal travelling to it has arrived

// Without preserve-3d the same system renders flat, with the same content (MOTION §24).
const SUPPORTS_3D =
  typeof CSS !== 'undefined' && typeof CSS.supports === 'function' && CSS.supports('transform-style', 'preserve-3d')

const pct = (v, total) => `${(v / total) * 100}%`
const fixed = (v) => v.toFixed(3)
const [AGENT_X, AGENT_Y] = nodePoint('agent', 0)

export default function HeroSystem() {
  const rootRef = useRef(null)
  const viewRef = useRef(null)
  const stageRef = useRef(null)
  const flatRef = useRef(0)
  const nearRef = useRef(null)

  const reduced = useReducedMotion()
  const inView = useInView(rootRef, { threshold: 0.25 })
  const [step, setStep] = useState(0)
  const [paused, setPaused] = useState(false)
  const playing = !reduced && !paused && inView
  const shown = reduced ? FINAL_STEP : step

  // The automation loop: one step value, advanced only while on screen and not paused.
  useEffect(() => {
    if (!playing) return
    const id = setTimeout(() => setStep((s) => (s + 1) % STEPS.length), STEPS[step].ms)
    return () => clearTimeout(id)
  }, [playing, step])

  // Scrolling away settles the system into a straight workflow: --flat drives the CSS, and the
  // connector curves are redrawn to follow the nodes.
  const applyFlat = useCallback((flat) => {
    const stage = stageRef.current
    if (!stage) return
    flatRef.current = flat
    stage.style.setProperty('--flat', fixed(flat))
    const paths = Object.fromEntries(EDGES.map((e) => [e.id, edgePath(e, flat)]))
    stage.querySelectorAll('path[data-edge]').forEach((p) => p.setAttribute('d', paths[p.dataset.edge]))
    const orbit = stage.querySelector('[data-orbit]')
    if (orbit) {
      const [x, y] = nodePoint('agent', flat)
      orbit.setAttribute('cx', x.toFixed(1))
      orbit.setAttribute('cy', y.toFixed(1))
      orbit.setAttribute('opacity', fixed(1 - flat))
    }
  }, [])

  const onScroll = useCallback(
    (p) => {
      const flat = flattenAt(p)
      const delta = Math.abs(flat - flatRef.current)
      if (delta > 0.001 || (delta > 0 && (flat === 0 || flat === 1))) applyFlat(flat)
    },
    [applyFlat],
  )
  useScrollProgress(rootRef, onScroll, { enabled: !reduced })
  useEffect(() => {
    if (reduced) applyFlat(0)
  }, [reduced, applyFlat])

  // Pointer parallax and proximity: the stage tilts a few degrees and the nearest node lifts and,
  // after a short delay, shows its hint (CSS). usePointer reports exactly (0, 0) on leave.
  const onPointer = useCallback((x, y) => {
    const stage = stageRef.current
    if (!stage) return
    stage.style.setProperty('--px', fixed(x))
    stage.style.setProperty('--py', fixed(y))
    const near = x === 0 && y === 0 ? null : nearestNode(x, y, flatRef.current)
    if (near === nearRef.current) return
    nearRef.current = near
    stage.querySelectorAll('[data-node]').forEach((el) => {
      if (el.dataset.node === near) el.dataset.near = 'true'
      else delete el.dataset.near
    })
  }, [])
  const pointerOn = SUPPORTS_3D && !reduced
  usePointer(viewRef, onPointer, { enabled: pointerOn })
  useEffect(() => {
    if (!pointerOn) onPointer(0, 0)
  }, [pointerOn, onPointer])

  const focus = focusAt(shown)
  const caption = focus && hero.system.find((n) => n.id === focus)

  return (
    <figure
      ref={rootRef}
      className="hs relative mx-auto w-full max-w-[21rem] sm:max-w-sm lg:max-w-[28rem]"
      data-mode={SUPPORTS_3D ? '3d' : 'flat'}
      data-motion={reduced ? 'reduce' : 'full'}
      data-playing={playing ? 'true' : 'false'}
    >
      <figcaption className="sr-only">{hero.systemLabel}</figcaption>
      <ol className="sr-only">
        {hero.system.map((n) => (
          <li key={n.id}>
            {n.label}: {n.hint}
          </li>
        ))}
      </ol>

      <div ref={viewRef} aria-hidden="true" className="hs-view relative aspect-square w-full select-none">
        <div className="hs-camera absolute inset-0">
          <div ref={stageRef} className="hs-stage absolute inset-0">
            <div className="hs-grid" />
            <svg viewBox={`0 0 ${W} ${H}`} className="hs-wires absolute inset-0 h-full w-full overflow-visible">
              <circle data-orbit="" cx={AGENT_X} cy={AGENT_Y} r="70" className="hs-orbit" />
              {EDGES.map((e) => {
                const d = edgePath(e, 0)
                return (
                  <g key={e.id} className={e.judgment ? 'hs-edge is-judgment' : 'hs-edge'} data-state={edgeState(e, shown)}>
                    <path data-edge={e.id} d={d} className="hs-wire" />
                    <g data-tone="dark">
                      <path data-edge={e.id} d={d} className="hs-lit" pathLength={e.judgment ? undefined : 100} />
                      <path data-edge={e.id} d={d} className="hs-pulse" pathLength={100} />
                    </g>
                  </g>
                )
              })}
            </svg>
            {hero.system.map((n, i) => (
              <SystemNode key={n.id} node={n} index={i} step={shown} />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex min-h-10 items-start justify-between gap-4">
        {/* The current step's hint, for sighted visitors; the list above carries all of them. */}
        <p aria-hidden="true" className="min-w-0 text-sm leading-5 text-muted">
          {caption && (
            <span key={shown} className="hs-caption block">
              <span className="font-medium text-ink">{caption.label}</span> · {caption.hint}
            </span>
          )}
        </p>
        {!reduced && (
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            aria-label={paused ? hero.motion.play : hero.motion.pause}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ink/20 bg-surface text-ink transition-colors duration-micro hover:border-primary hover:text-primary"
          >
            {paused ? <Play aria-hidden="true" className="h-4 w-4" /> : <Pause aria-hidden="true" className="h-4 w-4" />}
          </button>
        )}
      </div>
    </figure>
  )
}

const ICON_SIZE = 'h-3.5 w-3.5 sm:h-4 sm:w-4'

function SystemNode({ node, index, step }) {
  const { id, label, hint, core } = node
  const { pose, line, depth, tip } = NODES[id]
  const Icon = ICONS[id]
  const size = core
    ? 'gap-1.5 px-3 py-2 font-semibold sm:gap-2 sm:px-4 sm:py-2.5'
    : 'gap-1.5 px-2.5 py-1.5 font-medium sm:gap-2 sm:px-3.5 sm:py-2'
  const tone = core ? 'border-primary bg-primary text-primaryInk' : 'border-line bg-surface text-ink'
  const shadow = depth >= 0.7 ? 'shadow-depth-2' : 'shadow-depth-1'

  return (
    <div className="hs-wrap" style={{ '--fx': pct(line[0] - pose[0], W), '--fy': pct(line[1] - pose[1], H) }}>
      <div
        data-node={id}
        data-state={nodeState(id, step)}
        className={id === 'human' ? 'hs-node is-judgment' : 'hs-node'}
        style={{
          left: pct(pose[0], W),
          top: pct(pose[1], H),
          '--depth': depth,
          '--i': index,
          '--arrive': arrivesBySignal(id, step) ? `${ARRIVE_MS}ms` : '0ms',
        }}
      >
        <div className="hs-body">
          <span data-tone="dark" className="hs-ring" />
          <span className="hs-depth absolute inset-0 rounded-full shadow-depth-3" />
          <span
            className={`hs-pill relative flex items-center whitespace-nowrap rounded-full border text-xs sm:text-sm ${size} ${tone} ${shadow}`}
          >
            <span data-tone={core ? 'dark' : undefined} className="hs-icon flex">
              <Icon strokeWidth={1.75} className={ICON_SIZE} />
            </span>
            {label}
            {id === 'done' && (
              // The brand gold is the dark palette's primary; data-tone borrows it for the face.
              <span
                data-tone="dark"
                className={`hs-done-face absolute -inset-px flex items-center justify-center rounded-full bg-primary text-primaryInk ${size}`}
              >
                <Check strokeWidth={2.5} className={ICON_SIZE} />
                {label}
              </span>
            )}
          </span>
        </div>
        <span
          data-side={tip.side}
          data-align={tip.align}
          className="hs-tip whitespace-nowrap rounded-md bg-ink px-2.5 py-1.5 text-xs font-medium text-paper shadow-depth-2"
        >
          {hint}
        </span>
      </div>
    </div>
  )
}
