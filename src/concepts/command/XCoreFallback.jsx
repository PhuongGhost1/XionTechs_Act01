import { useRef } from 'react'
import { useInView } from '../../hooks/useInView'
import { armNodeIds, buildXGraph, projectToBox } from './scene/graph'
import './XCoreFallback.css'

// The static X data core: the same graph the WebGL canvas draws (scene/graph.js), as inline SVG.
// It is the whole picture when the canvas is off or still loading, and fades out once the canvas
// is drawing (`.xcore-fallback`, command.css). Decorative, so the section text carries the meaning.

const SIZE = 480
// The canvas fits the X to 90 % of its box (scene/layout.js, placeX), so tips sit 5 % from each edge.
const PAD = SIZE * 0.05
const MID = SIZE / 2

const graph = buildXGraph()
const pts = projectToBox(graph, SIZE, SIZE, PAD)
const round = (n) => Math.round(n * 10) / 10

// A depth cue from the node's z (about ±0.3): nearer nodes are a little brighter and larger.
const depth = (id) => (graph.nodes[id].z + 0.3) / 0.6
const brightness = (id) => round(0.55 + 0.45 * Math.min(1, Math.max(0, depth(id))))

// Hub, then the arm's nodes out to its tip, as an SVG path. `inward` runs tip to hub.
function armPath(arm, inward) {
  const ids = [0, ...armNodeIds(graph, arm)]
  if (inward) ids.reverse()
  return ids.map((id, i) => `${i ? 'L' : 'M'}${round(pts[id].x)} ${round(pts[id].y)}`).join('')
}

// Three data packets, one per arm (the south-east arm is left free: the status panel sits over it
// on wide screens). `rest` is where each one is parked, in path percent, when motion is off.
const PACKETS = [
  { arm: 0, inward: true, dur: '6.4s', delay: '1.4s', rest: -34 },
  { arm: 1, inward: false, dur: '7.6s', delay: '3.2s', rest: -58 },
  { arm: 2, inward: false, dur: '5.8s', delay: '5s', rest: -44 },
].map((p) => ({ ...p, d: armPath(p.arm, p.inward) }))

// Orbit radii sit between the nested square rings; each orbiter carries one particle.
const ORBIT_OUTER = 180
const ORBIT_INNER = 108
const ORBITERS = [
  { r: ORBIT_OUTER, angle: 28, dur: '150s', reverse: false },
  { r: ORBIT_OUTER, angle: 205, dur: '150s', reverse: false },
  { r: ORBIT_OUTER, angle: 318, dur: '150s', reverse: false },
  { r: ORBIT_INNER, angle: 96, dur: '96s', reverse: true },
  { r: ORBIT_INNER, angle: 262, dur: '96s', reverse: true },
]

export default function XCoreFallback({ className = '' }) {
  const ref = useRef(null)
  // Loops stop while the core is off screen (they also stop under Pause Motion, see the CSS).
  const live = useInView(ref)
  const hub = pts[0]

  return (
    <svg
      ref={ref}
      data-live={live ? 'true' : 'false'}
      className={`xcore-fallback xc ${className}`}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      aria-hidden="true"
      focusable="false"
    >
      <path className="xc-reticle" d={`M${PAD} ${MID}H${SIZE - PAD}M${MID} ${PAD}V${SIZE - PAD}`} />
      <circle className="xc-orbit" cx={hub.x} cy={hub.y} r={ORBIT_OUTER} />
      <circle className="xc-orbit xc-orbit--inner" cx={hub.x} cy={hub.y} r={ORBIT_INNER} />

      {graph.edges.map(([a, b, kind], i) => {
        const level = Math.max(graph.nodes[a].level, graph.nodes[b].level)
        // Arms fade a little toward their tips, so the eye lands on the hub first.
        const opacity = kind === 'ring' ? 0.3 : round(0.7 - 0.35 * (level / graph.perArm))
        return (
          <line
            key={i}
            className={kind === 'ring' ? 'xc-edge xc-edge--ring' : 'xc-edge'}
            x1={round(pts[a].x)}
            y1={round(pts[a].y)}
            x2={round(pts[b].x)}
            y2={round(pts[b].y)}
            strokeOpacity={opacity}
          />
        )
      })}

      {graph.nodes.map((n) => {
        if (n.kind === 'hub') return null
        const p = pts[n.id]
        const joint = n.kind === 'node' && n.level % 3 === 0 // where the ring edges attach
        const ringed = n.kind === 'tip' || joint
        const r = n.kind === 'tip' ? 4.4 : joint ? 3 : round(1.4 + 0.6 * depth(n.id))
        const cls = n.kind === 'tip' ? 'xc-node xc-node--tip' : joint ? 'xc-node xc-node--joint' : 'xc-node'
        // Ringed nodes keep an opaque centre (it hides the edge running through them); only their stroke dims.
        const dim = ringed ? { strokeOpacity: brightness(n.id) } : { opacity: brightness(n.id) }
        return (
          <g key={n.id}>
            {n.kind === 'tip' && <circle className="xc-tip-ring" cx={round(p.x)} cy={round(p.y)} r="9.5" />}
            <circle className={cls} cx={round(p.x)} cy={round(p.y)} r={r} {...dim} />
          </g>
        )
      })}

      {PACKETS.map((p) => (
        <path
          key={p.arm}
          className="xc-packet"
          d={p.d}
          pathLength="100"
          style={{ '--dur': p.dur, '--delay': p.delay, '--rest': p.rest }}
        />
      ))}

      {ORBITERS.map((o, i) => (
        <g
          key={i}
          className={o.reverse ? 'xc-orbiter xc-orbiter--reverse' : 'xc-orbiter'}
          style={{ '--angle': `${o.angle}deg`, '--dur': o.dur }}
        >
          <circle className="xc-particle" cx={hub.x + o.r} cy={hub.y} r="1.8" />
        </g>
      ))}

      <circle className="xc-hub-pulse" cx={hub.x} cy={hub.y} r="9" />
      <circle className="xc-hub-ring" cx={hub.x} cy={hub.y} r="9" />
      <circle className="xc-hub" cx={hub.x} cy={hub.y} r="3.8" />
    </svg>
  )
}
