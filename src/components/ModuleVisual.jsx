import { useRef } from 'react'
import { useInView } from '../hooks/useInView'

// The small technical diagram each module row carries (docs/concepts/01-command-implementation.md §8).
// Drawn in hairlines with one yellow accent. It is the static fallback inside the module's anchor box,
// so it fades out when the WebGL cluster is drawing there (.xcore-fallback). Styles and the looping
// micro-motion live in Modules.css; every loop is dropped under reduced motion, which leaves the
// finished diagram. All coordinates share one 200 x 120 viewBox.

// Lines of source, compiled into a block. The cursor blinks at the line being typed; a scan crosses the
// lines, a packet runs down the funnel, and the block's top face lights.
function Code() {
  return (
    <>
      <g className="mv-l mv-tokens">
        <line x1="14" y1="24" x2="62" y2="24" />
        <line x1="24" y1="38" x2="84" y2="38" />
        <line x1="24" y1="52" x2="52" y2="52" />
        <line x1="34" y1="66" x2="78" y2="66" />
        <line x1="24" y1="80" x2="68" y2="80" />
        <line x1="14" y1="94" x2="40" y2="94" />
      </g>
      <rect className="mv-fy mv-cursor" x="56" y="47.5" width="4" height="9" />
      <line className="mv-y mv-scan" x1="8" y1="0" x2="90" y2="0" />
      <g className="mv-d">
        <line x1="94" y1="30" x2="136" y2="52" />
        <line x1="94" y1="60" x2="136" y2="60" />
        <line x1="94" y1="90" x2="136" y2="68" />
      </g>
      <path className="mv-fy mv-face" d="M158 34 L180 47 L158 60 L136 47 Z" />
      <path className="mv-l" d="M158 34 L180 47 V73 L158 86 L136 73 V47 Z M136 47 L158 60 L180 47 M158 60 V86" />
      <path className="mv-y" d="M158 34 L180 47 L158 60 L136 47 Z" />
      <rect className="mv-fy mv-packet-x" x="94" y="58.5" width="6" height="3" />
    </>
  )
}

// A small decision graph. One path is highlighted from the request to the outcome, and a packet takes it.
function Ai() {
  return (
    <>
      <g className="mv-d">
        <path d="M22 60 L66 26 M22 60 L66 60 M22 60 L66 94" />
        <path d="M66 26 L118 38 M66 60 L118 38 M66 60 L118 82 M66 94 L118 82" />
        <path d="M118 38 L176 60 M118 82 L176 60" />
      </g>
      <polyline className="mv-y" points="22,60 66,60 118,38 176,60" />
      <g className="mv-l mv-bg">
        <rect x="19" y="57" width="6" height="6" />
        <path d="M66 21 L71 26 L66 31 L61 26 Z M66 89 L71 94 L66 99 L61 94 Z M118 77 L123 82 L118 87 L113 82 Z" />
      </g>
      <g className="mv-y mv-bg">
        <path d="M66 55 L71 60 L66 65 L61 60 Z M118 33 L123 38 L118 43 L113 38 Z" />
        <rect x="172" y="56" width="8" height="8" />
      </g>
      <rect className="mv-ring" x="172" y="56" width="8" height="8" />
      <rect className="mv-fy mv-packet-ai" x="20" y="58" width="4" height="4" />
    </>
  )
}

// Stacked layers joined by connection nodes. A packet climbs the axis and the top layer lights as it arrives.
function Cloud() {
  return (
    <>
      <g className="mv-d">
        <path d="M50 28 V92 M150 28 V92" strokeDasharray="2 3" />
      </g>
      <path className="mv-l mv-bg" d="M100 80 L150 92 L100 104 L50 92 Z" />
      <path className="mv-l mv-bg" d="M100 48 L150 60 L100 72 L50 60 Z" />
      <path className="mv-y mv-bg" d="M100 16 L150 28 L100 40 L50 28 Z" />
      <path className="mv-fy mv-face mv-face-cloud" d="M100 16 L150 28 L100 40 L50 28 Z" />
      <path className="mv-d" d="M100 28 V92" strokeDasharray="1 3" />
      <g className="mv-l mv-bg">
        <rect x="98" y="26" width="4" height="4" />
        <rect x="98" y="58" width="4" height="4" />
        <rect x="98" y="90" width="4" height="4" />
      </g>
      <g className="mv-ff">
        <rect x="48.5" y="26.5" width="3" height="3" />
        <rect x="148.5" y="26.5" width="3" height="3" />
        <rect x="48.5" y="58.5" width="3" height="3" />
        <rect x="148.5" y="58.5" width="3" height="3" />
        <rect x="48.5" y="90.5" width="3" height="3" />
        <rect x="148.5" y="90.5" width="3" height="3" />
      </g>
      <rect className="mv-fy mv-packet-cloud" x="98" y="90" width="4" height="4" />
    </>
  )
}

// Four modules snapping into one product. Each block starts a little apart and closes onto its slot;
// the last, yellow one closes with a flash along the joints.
const BLOCKS = [
  { x: 58, y: 30, sx: -9, sy: -7, delay: 0, port: [92, 52] },
  { x: 100, y: 30, sx: 9, sy: -7, delay: 0.15, port: [102, 52] },
  { x: 58, y: 60, sx: -9, sy: 7, delay: 0.3, port: [92, 62] },
  { x: 100, y: 60, sx: 9, sy: 7, delay: 0.45, port: [102, 62], accent: true },
]

function Product() {
  return (
    <>
      <rect className="mv-ghost" x="58" y="30" width="84" height="60" />
      {BLOCKS.map((b) => (
        <g
          key={`${b.x}-${b.y}`}
          className="mv-block"
          style={{ '--sx': `${b.sx}px`, '--sy': `${b.sy}px`, '--sd': `${b.delay}s` }}
        >
          <rect className={b.accent ? 'mv-y mv-bg' : 'mv-l mv-bg'} x={b.x} y={b.y} width="42" height="30" />
          <rect className={b.accent ? 'mv-fy' : 'mv-port'} x={b.port[0]} y={b.port[1]} width="6" height="6" />
        </g>
      ))}
      <path className="mv-y mv-joint" d="M100 30 V90 M58 60 H142" />
    </>
  )
}

const VISUALS = { code: Code, ai: Ai, cloud: Cloud, product: Product }

export default function ModuleVisual({ kind }) {
  const ref = useRef(null)
  // Loops only run while the diagram is on screen (docs §6).
  const live = useInView(ref)
  const Visual = VISUALS[kind]
  if (!Visual) return null
  return (
    <svg
      ref={ref}
      data-live={live ? 'true' : 'false'}
      data-kind={kind}
      className="mv xcore-fallback block h-full w-full"
      viewBox="0 0 200 120"
      width="200"
      height="120"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <Visual />
    </svg>
  )
}
