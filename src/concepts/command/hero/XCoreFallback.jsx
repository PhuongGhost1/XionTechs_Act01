// Static SVG version of the X data core. Used when WebGL is unavailable, motion is reduced, the data
// saver is on, the device is weak, or the WebGL scene failed. It is built from the same graph and the
// same camera as the WebGL scene, so the arm labels line up and the picture is recognisably the same
// object. Colour comes only from the x-* Tailwind tokens. The pulses use `x-loop`, so Pause Motion and
// reduced motion stop them.
import { modules } from '../content.js'
import { ARM_IDS, ARM_LABEL_SIDE, DEFAULT_ASPECT, armTipPositions, buildGraph, projectToNormalised } from '../scene/graph.js'

const W = 1000
const H = W / DEFAULT_ASPECT
const graph = buildGraph()

const at = (n) => {
  const p = projectToNormalised(graph.positions[n * 3], graph.positions[n * 3 + 1], DEFAULT_ASPECT)
  return { x: p.x * W, y: p.y * H }
}
const nodePts = Array.from({ length: graph.nodeCount }, (_, n) => at(n))
const edgePts = (e) => [nodePts[graph.edgeA[e]], nodePts[graph.edgeB[e]]]

// Cross-links drawn as dashed lines that breathe; the WebGL scene rewires these continuously.
const LINKS = [2, 5, 8, 11, 12, 13].map((k) => graph.staticEdgeCount + k)
// Fixed packets on arms: [edge, fraction along it].
const PACKETS = [
  [1, 0.45],
  [6, 0.6],
  [8, 0.35],
  [15, 0.55],
  [16, 0.5],
  [3, 0.2],
  [11, 0.7],
]
const packetAt = ([e, u]) => {
  const [a, b] = edgePts(e)
  return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u }
}

const hub = nodePts[0]

// Square marker on the arm tip and a mono label outside it. `style` positions the anchor (left/top in
// percent, or a transform); the same element is used over the canvas.
export function ArmLabel({ arm, side, rootRef, style, className = '' }) {
  return (
    <div ref={rootRef} aria-hidden="true" className={`pointer-events-none absolute ${className}`} style={style}>
      <span className="absolute block size-[9px] -translate-x-1/2 -translate-y-1/2 border border-x-faint bg-x-bg" />
      <span
        className={`x-mono absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-x-mute ${side === 'top' ? 'bottom-3' : 'top-3'}`}
      >
        {arm}
      </span>
    </div>
  )
}

export default function XCoreFallback({ className = '' }) {
  const tips = armTipPositions(0, DEFAULT_ASPECT)
  return (
    <div className={`absolute inset-0 grid place-items-center [container-type:size] ${className}`}>
      <div className="relative w-full" style={{ width: 'min(100cqw, 125cqh)', aspectRatio: `${W} / ${H}` }}>
        <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 size-full" aria-hidden="true" focusable="false">
          {/* hub rings: one dashed, one breathing */}
          <circle cx={hub.x} cy={hub.y} r="66" fill="none" className="stroke-x-faint/30" strokeDasharray="2 6" vectorEffect="non-scaling-stroke" />
          <circle
            cx={hub.x}
            cy={hub.y}
            r="30"
            fill="none"
            className="x-loop animate-[x-pulse_5s_ease-in-out_infinite] stroke-x-signal/45"
            vectorEffect="non-scaling-stroke"
          />

          {/* edges: arms and corner links, then the cross-links */}
          {Array.from({ length: graph.staticEdgeCount }, (_, e) => {
            const [a, b] = edgePts(e)
            return (
              <line
                key={e}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                className={e < 16 ? 'stroke-x-faint/65' : 'stroke-x-faint/40'}
                vectorEffect="non-scaling-stroke"
              />
            )
          })}
          {LINKS.map((e, i) => {
            const [a, b] = edgePts(e)
            return (
              <line
                key={e}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                className="x-loop animate-[x-pulse_6s_ease-in-out_infinite] stroke-x-faint/45"
                style={{ animationDelay: `${-i * 1.1}s` }}
                strokeDasharray="3 5"
                vectorEffect="non-scaling-stroke"
              />
            )
          })}

          {/* nodes with one orbiting particle each */}
          {nodePts.slice(1).map((p, i) => {
            const n = i + 1
            const tip = graph.nodeLevel[n] === 3
            const ang = n * 2.399
            return (
              <g key={n}>
                <circle cx={p.x + Math.cos(ang) * 17} cy={p.y + Math.sin(ang) * 17} r="2" className="fill-x-mute/55" />
                <circle cx={p.x} cy={p.y} r={tip ? 5 : 3.6} className={tip ? 'fill-x-text' : 'fill-x-mute'} />
              </g>
            )
          })}

          {/* packets and the core */}
          {PACKETS.map((pk, i) => {
            const p = packetAt(pk)
            return (
              <g key={i} className="x-loop animate-[x-pulse_4s_ease-in-out_infinite]" style={{ animationDelay: `${-i * 0.7}s` }}>
                <circle cx={p.x} cy={p.y} r="9" className="fill-x-signal/20" />
                <circle cx={p.x} cy={p.y} r="3.4" className="fill-x-signal" />
              </g>
            )
          })}
          <circle cx={hub.x} cy={hub.y} r="22" className="fill-x-signal/10" />
          <circle cx={hub.x} cy={hub.y} r="9" className="fill-x-signal" />
          <circle cx={hub.x} cy={hub.y} r="3" className="fill-x-text/70" />
        </svg>

        {tips.map((t, i) => (
          <ArmLabel
            key={ARM_IDS[i]}
            arm={modules[i].arm}
            side={ARM_LABEL_SIDE[i]}
            style={{ left: `${t.x * 100}%`, top: `${t.y * 100}%` }}
          />
        ))}
      </div>
    </div>
  )
}
