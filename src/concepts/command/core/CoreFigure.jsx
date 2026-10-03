import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { content } from '../content/index.js'
import { useInView } from '../runtime/hooks.js'
import { cx } from '../ui/cx.js'
import { setArm } from './armState.js'
import { buildGraph } from './graph.js'
import {
  LINE_STOPS,
  LINE_X0,
  LINE_X1,
  LINE_Y,
  buildPool,
  edgePolyline,
  layoutFor,
  linePlan,
  markToUnit,
  poolPositions,
} from './layouts.js'
import { markOutlines, polygonPath } from './mark.js'
import './core.css'

// Dev only: lets ?tier=high mount the canvas in a harness browser that reports a software rasteriser.
if (import.meta.env.DEV) import('./devMount.js')

// The static SVG of the X core for each layout (doc 6.2): the finished page underneath the WebGL
// canvas, and the whole picture when WebGL is off. It sits INSIDE a <CoreAnchor>, which gives it
// its size; it fills the anchor and scales with it. Every position comes from layouts.js, the same
// numbers the canvas morphs between, so the two renderers cannot disagree.
//
//   layout  'x' | 'arms' | 'line' | 'field' | 'mark'   (L0 .. L4)
//   active  0..3 lights one arm: 0 CODE (NW), 1 AI (NE), 2 CLOUD (SE), 3 PRODUCT (SW); omit for none
//
// The figure contains no text: labels are DOM (the hero tags, the module rows), so nothing here can
// fall below 12 px. It is aria-hidden; the facts it draws are all real text elsewhere.
//
// Shapes (doc 5.4, 5.5), sizes in CSS px at the hero's design size (a 280 px core):
//   hub 10 px outlined square, service 6 px solid circle, leaf 3 px dot, record 8 px square with a
//   cross tick, pending status a dashed hollow ring, illustrative a hatched square, core 8 px
//   yellow diamond. Edges are 1 px hairlines (non-scaling), ghost at 10 %; only the lit arm is yellow.

const graph = buildGraph(content)
const POOL = buildPool(graph, 800, 'figure') // structural points as dots: the braid
const BOX = 320 // the square viewBox
const DESIGN = 280 / BOX // px per unit at the hero's design size

// Packets (M04): a dash riding an edge, drawn by CSS offset-path, still when motion is off.
const PACKET_LEN = 9
const PACKET_H = 2.2

const hubOf = (arm) => graph.nodes.find((n) => n.kind === 'hub' && n.arm === arm)

// -- small helpers -----------------------------------------------------------------------------

const pathOf = (poly, sx, sy) => {
  let d = ''
  for (let i = 0; i < poly.length; i += 3) d += `${i ? 'L' : 'M'}${(poly[i] * sx).toFixed(1)} ${(poly[i + 1] * sy).toFixed(1)}`
  return d
}

/** A zero-length round-capped segment per point: one <path> draws any number of dots. */
const dotsPath = (points, sx, sy) => {
  let d = ''
  for (const [x, y] of points) d += `M${(x * sx).toFixed(1)} ${(y * sy).toFixed(1)}h0.01`
  return d
}

const NS = { vectorEffect: 'non-scaling-stroke', fill: 'none' }

// -- geometry cache: the figure is static, so compute each layout once --------------------------

const cache = {}

function figure(layoutName) {
  if (cache[layoutName]) return cache[layoutName]
  const layout = layoutFor(layoutName, graph)
  const pts = poolPositions(layout, graph, POOL)
  const dots = { byArm: [[], [], [], []], free: [] }
  for (let i = POOL.nodeCount; i < POOL.n; i += 1) {
    const p = [pts[i * 3], pts[i * 3 + 1]]
    const a = POOL.arm[i]
    ;(a >= 0 ? dots.byArm[a] : dots.free).push(p)
  }
  const strokes = linePlan(graph).map(({ edge, side }) => ({ edge, side, poly: edgePolyline(layout, graph, edge, side, 28) }))
  return (cache[layoutName] = { layout, dots, strokes })
}

// -- the measured size, for the layouts that stretch (line, field) ------------------------------

// useLayoutEffect warns when rendered to a string (the section tests); the figure is client-only in practice.
const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

function useBox(ref, enabled, fallback) {
  const [size, setSize] = useState(fallback)
  useIsoLayoutEffect(() => {
    const el = ref.current
    if (!enabled || !el || typeof ResizeObserver === 'undefined') return undefined
    const read = () => {
      const r = el.getBoundingClientRect()
      if (r.width > 1 && r.height > 1) setSize((s) => (Math.abs(s.w - r.width) < 0.5 && Math.abs(s.h - r.height) < 0.5 ? s : { w: r.width, h: r.height }))
    }
    read()
    const ro = new ResizeObserver(read)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref, enabled])
  return size
}

// -- node shapes ---------------------------------------------------------------------------------

function Node({ node, x, y, unit, on, hatch }) {
  const t = 'transition-colors duration-ui ease-ui'
  const k = unit // px to viewBox units
  switch (node.kind) {
    case 'core': {
      const s = 8 * k
      return <rect x={x - s / 2} y={y - s / 2} width={s} height={s} transform={`rotate(45 ${x} ${y})`} className="fill-signal" />
    }
    case 'hub': {
      const s = 10 * k
      return (
        <rect
          x={x - s / 2}
          y={y - s / 2}
          width={s}
          height={s}
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
          className={cx(t, on ? 'fill-signal stroke-signal' : 'fill-ground stroke-ink2')}
        />
      )
    }
    case 'service':
      return <circle cx={x} cy={y} r={3 * k} className={cx(t, on ? 'fill-signal' : 'fill-ink2')} />
    case 'leaf':
      return <circle cx={x} cy={y} r={1.6 * k} className={cx(t, on ? 'fill-ink' : 'fill-ink3')} />
    case 'record': {
      const s = 8 * k
      const illustrative = node.evidence === 'illustrative'
      return (
        <g>
          <rect
            x={x - s / 2}
            y={y - s / 2}
            width={s}
            height={s}
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
            fill={illustrative ? `url(#${hatch})` : undefined}
            className={cx(t, illustrative ? '' : 'fill-ground', on ? 'stroke-signal' : 'stroke-ink2')}
          />
          {/* The cross tick of a record node (doc 5.4): a confirmed record only. */}
          {!illustrative && (
            <path
              d={`M${x - s * 0.22} ${y}H${x + s * 0.22}M${x} ${y - s * 0.22}V${y + s * 0.22}`}
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
              className={cx(t, on ? 'stroke-signal' : 'stroke-ink2')}
              fill="none"
            />
          )}
        </g>
      )
    }
    case 'status':
      // Pending: hollow, dashed, never filled (doc 5.5).
      return (
        <circle
          cx={x}
          cy={y}
          r={3 * k}
          strokeWidth="1"
          strokeDasharray="2 2"
          vectorEffect="non-scaling-stroke"
          className={cx(t, 'fill-none', on ? 'stroke-signal' : 'stroke-ink3')}
        />
      )
    case 'method': {
      const s = 8 * k
      return <rect x={x - s / 2} y={y - s / 2} width={s} height={s} strokeWidth="1" vectorEffect="non-scaling-stroke" className="fill-ground stroke-ink2" />
    }
    default:
      return null
  }
}

function Packet({ d, delay = 0, dur }) {
  return (
    <rect
      x={-PACKET_LEN / 2}
      y={-PACKET_H / 2}
      width={PACKET_LEN}
      height={PACKET_H}
      className="anim-packet fill-signal"
      style={{ '--path': `path('${d}')`, animationDelay: `${delay}ms`, ...(dur ? { animationDuration: `calc(${dur}ms / var(--flow, 1))` } : null) }}
    />
  )
}

// -- layouts: X and ARMS ----------------------------------------------------------------------

function Arms({ name, active, hatch }) {
  const { layout, dots, strokes } = figure(name)
  const k = 1 / DESIGN
  const lit = (arm) => active === arm
  const nodes = graph.nodes.filter((n) => n.kind !== 'method' && n.kind !== 'core')
  const core = layout.pos.core

  // One packet per hero arm in the X; in the arms layout only the lit arm carries them.
  const packetArms = name === 'x' ? [0, 1, 3] : active >= 0 ? [active, active] : [0, 1, 2, 3]
  const packetSide = [-1, 1]

  return (
    <>
      {[0, 1, 2, 3].map((arm) => {
        const on = lit(arm)
        return (
          <g key={arm} data-arm={arm}>
            {strokes
              .filter((s) => s.edge.arm === arm)
              .map(({ edge, side, poly }) => {
                const strand = edge.kind === 'hub'
                const dashed = edge.dashed
                return (
                  <path
                    key={`${edge.id}:${side}`}
                    d={pathOf(poly, BOX, BOX)}
                    strokeWidth="1"
                    strokeDasharray={dashed ? '3 3' : undefined}
                    {...NS}
                    className={cx(
                      'transition-colors duration-ui ease-ui',
                      on ? (strand ? 'stroke-signal' : 'stroke-signal/60') : strand ? 'stroke-hairStrong' : dashed ? 'stroke-hairStrong' : 'stroke-ghost',
                    )}
                  />
                )
              })}
            <path
              d={dotsPath(dots.byArm[arm], BOX, BOX)}
              strokeWidth="1.5"
              strokeLinecap="round"
              {...NS}
              className={cx('transition-colors duration-ui ease-ui', on ? 'stroke-signal/80' : 'stroke-ink3/55')}
            />
            {nodes
              .filter((n) => n.arm === arm)
              .map((n) => (
                <Node key={n.id} node={n} x={layout.pos[n.id][0] * BOX} y={layout.pos[n.id][1] * BOX} unit={k} on={on && n.kind !== 'record' && n.kind !== 'status'} hatch={hatch} />
              ))}
          </g>
        )
      })}
      {packetArms.map((arm, i) => {
        const hub = hubOf(arm)
        const edge = graph.edges.find((e) => e.to === hub.id)
        const poly = edgePolyline(layout, graph, edge, packetSide[i % 2], 16)
        // Run core -> hub along the braid; stagger so the dashes are never in step.
        return <Packet key={`${arm}:${i}`} d={pathOf(poly, BOX, BOX)} delay={-i * 800} />
      })}
      <Node node={graph.byId.get('core')} x={core[0] * BOX} y={core[1] * BOX} unit={k} />
    </>
  )
}

// -- layout: LINE -----------------------------------------------------------------------------

function LineArt({ w, h }) {
  const { layout, dots } = figure('line')
  const y = LINE_Y * h
  const x0 = LINE_X0 * w
  const x1 = LINE_X1 * w
  const ticks = []
  const count = 30
  for (let i = 0; i <= count; i += 1) {
    const x = x0 + ((x1 - x0) * i) / count
    const major = i % 5 === 0
    ticks.push(`M${x.toFixed(1)} ${y + 8}v${major ? 8 : 4}`)
  }
  const dust = graph.nodes.filter((n) => n.kind !== 'method' && n.kind !== 'core')
  const free = [...dots.free, ...dots.byArm.flat()]
  return (
    <>
      <path d={`M${x0} ${y}H${x1}`} strokeWidth="1" {...NS} className="stroke-hairStrong" />
      <path d={ticks.join('')} strokeWidth="1" {...NS} className="stroke-ink3/45" />
      {/* The four clusters have collapsed: trace dust along the line, thickest near REQUEST. */}
      <path d={dotsPath(free, w, h)} strokeWidth="1.5" strokeLinecap="round" {...NS} className="stroke-ink3/45" />
      {dust.map((n) => (
        <circle
          key={n.id}
          cx={layout.pos[n.id][0] * w}
          cy={layout.pos[n.id][1] * h}
          r={n.kind === 'service' ? 2.2 : 1.5}
          className={n.kind === 'service' ? 'fill-ink2/70' : 'fill-ink3/70'}
        />
      ))}
      {LINE_STOPS.slice(1).map((sx, i) => (
        <Node key={i} node={{ kind: 'method' }} x={sx * w} y={y} unit={1} />
      ))}
      <Node node={graph.byId.get('core')} x={LINE_STOPS[0] * w} y={y} unit={1.1} />
      <Packet d={`M${x0} ${y}H${x1}`} dur={4800} />
    </>
  )
}

// -- layout: FIELD ------------------------------------------------------------------------------

function FieldArt({ w, h, hatch }) {
  const { layout, dots } = figure('field')
  const all = [...dots.free, ...dots.byArm.flat()]
  const nodes = graph.nodes.filter((n) => n.kind !== 'method' && n.kind !== 'core')
  return (
    <>
      {/* The page's two diagonals: the points gather along them before they converge. */}
      <path d={`M0 0L${w} ${h}M0 ${h}L${w} 0`} strokeWidth="1" {...NS} className="stroke-ghost" />
      <path d={dotsPath(all, w, h)} strokeWidth="1.5" strokeLinecap="round" {...NS} className="stroke-ink3/50" />
      {nodes.map((n) => (
        <Node key={n.id} node={n} x={layout.pos[n.id][0] * w} y={layout.pos[n.id][1] * h} unit={0.9} hatch={hatch} />
      ))}
      <Node node={graph.byId.get('core')} x={layout.pos.core[0] * w} y={layout.pos.core[1] * h} unit={1.1} />
    </>
  )
}

// -- layout: MARK -----------------------------------------------------------------------------

function MarkArt() {
  // Mark box 0..100 to the 320 box, 90 % wide and centred (layouts.js markToUnit).
  const [ox, oy] = markToUnit(0, 0)
  const scale = (BOX * 0.9) / 100
  return (
    <g transform={`translate(${(ox * BOX).toFixed(2)} ${(oy * BOX).toFixed(2)}) scale(${scale})`}>
      {markOutlines().map((o) => (
        <path key={o.id} d={polygonPath(o.polygon)} className={o.tone === 'signal' ? 'fill-signal' : 'fill-ink'} />
      ))}
    </g>
  )
}

// ---------------------------------------------------------------------------------------------

export function CoreFigure({ layout = 'x', active, className }) {
  const hatch = `core-hatch-${useId().replace(/:/g, '')}`
  const stretch = layout === 'line' || layout === 'field'
  const svgRef = useRef(null)
  const { w, h } = useBox(svgRef, stretch, { w: 640, h: 160 })
  // Ambient loops stop off screen (doc 7.1); motion.css pauses anything under [data-paused].
  const [viewRef, inView] = useInView({ rootMargin: '120px' })
  const setRefs = (el) => {
    svgRef.current = el
    viewRef.current = el
  }

  // Hand the lit arm to the WebGL core, which cannot see props: keyed by the anchor we sit in.
  useEffect(() => {
    if (active === undefined) return undefined
    const name = svgRef.current?.closest('[data-core-anchor]')?.getAttribute('data-core-anchor') ?? layout
    setArm(name, active)
    return () => setArm(name, -1)
  }, [active, layout])

  const vb = stretch ? `0 0 ${w.toFixed(1)} ${h.toFixed(1)}` : `0 0 ${BOX} ${BOX}`
  const lit = useMemo(() => (Number.isInteger(active) && active >= 0 && active <= 3 ? active : -1), [active])

  return (
    <svg
      ref={setRefs}
      viewBox={vb}
      aria-hidden="true"
      focusable="false"
      data-layout={layout}
      data-paused={inView ? undefined : ''}
      className={cx('core-figure block h-full w-full overflow-visible', className)}
    >
      <defs>
        {/* Illustrative: 45 degree hatch, 1 px lines every 5 px (doc 5.5). */}
        <pattern id={hatch} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="5" strokeWidth="1" className="stroke-ink2/60" />
        </pattern>
      </defs>
      {(layout === 'x' || layout === 'arms') && <Arms name={layout} active={lit} hatch={hatch} />}
      {layout === 'line' && <LineArt w={w} h={h} />}
      {layout === 'field' && <FieldArt w={w} h={h} hatch={hatch} />}
      {layout === 'mark' && <MarkArt />}
    </svg>
  )
}
