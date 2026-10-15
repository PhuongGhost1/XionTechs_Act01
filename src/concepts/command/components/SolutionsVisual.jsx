import './SolutionsVisual.css'
import { LAYERS, VIEW, flowLayout, stackLayout } from './SolutionsMotion'

// The small visual on each What We Build band (MOTION §7), picked by `visual.kind`. Decorative:
// the band's copy carries the meaning. `mode` and `hot` come from the section's state machine
// (SolutionsMotion.js); the band remounts this component to replay it. Motion is CSS only
// (SolutionsVisual.css).
export default function SolutionsVisual({ visual, mode, hot }) {
  const Kind = KIND[visual?.kind]
  if (!Kind) return null
  return (
    <div
      aria-hidden="true"
      data-mode={mode}
      data-hot={hot ? 'true' : 'false'}
      className="sv absolute inset-0"
      style={{ '--last': Math.max(1, (visual.steps?.length ?? 2) - 1) }}
    >
      <Kind steps={visual.steps} />
    </div>
  )
}

const svgProps = { viewBox: `0 0 ${VIEW.w} ${VIEW.h}`, className: 'h-full w-full', fill: 'none' }
const label = { fontSize: 11, fontWeight: 500 }

// AI agents: Request → Agent → Decision → Action.
function Flow({ steps }) {
  const { nodes, y, labelY, x0, x1, inlet, branch } = flowLayout(steps)
  return (
    <svg {...svgProps}>
      <line x1={inlet.x1} y1={y} x2={inlet.x2} y2={y} strokeWidth="1.5" strokeDasharray="2 4" strokeLinecap="round" className="stroke-ink/25" />
      <line x1={x0} y1={y} x2={x1} y2={y} strokeWidth="2" className="stroke-ink/15" />
      <line x1={branch.x1} y1={branch.y1} x2={branch.x2} y2={branch.y2} strokeWidth="1.5" strokeDasharray="3 4" className="stroke-ink/20" />
      <circle cx={branch.x2} cy={branch.y2} r="4" strokeWidth="1.5" className="fill-surface stroke-ink/20" />
      <line x1={x0} y1={y} x2={x1} y2={y} strokeWidth="2" className="sv-path sv-flow-line stroke-accent" />
      {nodes.map((n) => (
        <g key={n.label}>
          <FlowNode {...n} />
          <text x={n.x} y={labelY} textAnchor="middle" className="fill-muted" {...label}>
            {n.label}
          </text>
        </g>
      ))}
      <g className="sv-signal sv-flow-signal" style={{ '--sv-dist': `${x1 - x0}px` }}>
        <circle cx={x0} cy={y} r="8" className="fill-accent/20" />
        <circle cx={x0} cy={y} r="4" className="fill-accent" />
      </g>
    </svg>
  )
}

const diamond = (x, y, r) => `${x},${y - r} ${x + r},${y} ${x},${y + r} ${x - r},${y}`

// Node outline by shape: request dot, agent ring, decision diamond, action square.
function Shape({ shape, x, y, className }) {
  if (shape === 'diamond') return <polygon points={diamond(x, y, 10)} strokeWidth="1.5" strokeLinejoin="round" className={className} />
  if (shape === 'square') return <rect x={x - 9} y={y - 9} width="18" height="18" rx="4" strokeWidth="1.5" className={className} />
  return <circle cx={x} cy={y} r={shape === 'core' ? 14.5 : 6} strokeWidth="1.5" className={className} />
}

// Each node is a neutral base plus an accent "lit" layer that turns on as the signal arrives;
// the action's lit layer is a check mark (the completion state).
function FlowNode({ x, y, shape, i }) {
  return (
    <>
      {shape === 'core' ? (
        <>
          <circle cx={x} cy={y} r="18" strokeWidth="1" className="stroke-accent/25" />
          <circle cx={x} cy={y} r="11" className="fill-primary" />
        </>
      ) : (
        <Shape shape={shape} x={x} y={y} className="fill-surface stroke-ink/30" />
      )}
      <g className="sv-flow-node" style={{ '--i': i }}>
        <Shape shape={shape} x={x} y={y} className="stroke-accent" />
        {shape === 'dot' && <circle cx={x} cy={y} r="2.5" className="fill-accent" />}
        {shape === 'diamond' && <polygon points={diamond(x, y, 3.5)} className="fill-accent" />}
        {shape === 'square' && (
          <path d={`M${x - 4} ${y} l3 3 l5 -6`} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="stroke-accent" />
        )}
      </g>
    </>
  )
}

// Business software: abstract product frames, no text and no data.
function Layers() {
  const front = LAYERS.frames.length - 1
  return (
    <div className="perspective-near absolute inset-0">
      <div className="sv-stage preserve-3d absolute inset-0">
        {LAYERS.frames.map((f, i) => (
          <div
            key={f.content}
            className={`sv-frame absolute flex flex-col overflow-hidden rounded-md border border-line bg-surface ${
              i === front ? 'shadow-depth-2' : 'shadow-depth-1'
            }`}
            style={{
              left: `${f.left}%`,
              top: `${f.top}%`,
              width: `${LAYERS.w}%`,
              height: `${LAYERS.h}%`,
              '--i': i,
              '--z': `${f.z}px`,
              '--fx': `${f.from[0]}px`,
              '--fy': `${f.from[1]}px`,
              '--rx': `${f.spread[0]}px`,
              '--ry': `${f.spread[1]}px`,
            }}
          >
            <div className="flex h-[14%] shrink-0 items-center gap-[3px] border-b border-line px-2">
              <span className="h-1 w-1 rounded-full bg-ink/15" />
              <span className="h-1 w-1 rounded-full bg-ink/15" />
              <span className="h-1 w-1 rounded-full bg-ink/15" />
            </div>
            <FrameBody content={f.content} />
            {i === front && <span className="sv-hot-only pointer-events-none absolute inset-0 rounded-md ring-1 ring-inset ring-accent" />}
          </div>
        ))}
      </div>
    </div>
  )
}

const ROWS = ['w-4/5', 'w-3/5', 'w-2/3', 'w-1/2']

function FrameBody({ content }) {
  if (content === 'grid') {
    return (
      <div className="grid flex-1 grid-cols-3 gap-1.5 p-2">
        {[0, 1, 2, 3, 4, 5].map((k) => (
          <span key={k} className="rounded-sm bg-ink/5" />
        ))}
      </div>
    )
  }
  if (content === 'rows') {
    return (
      <div className="flex flex-1 flex-col gap-2 p-2.5">
        {ROWS.map((w, k) => (
          <span key={w} className={`h-[3px] rounded-full ${w} ${k === 1 ? 'bg-primary/30' : 'bg-ink/10'}`} />
        ))}
      </div>
    )
  }
  return (
    <div className="flex min-h-0 flex-1">
      <span className="w-[22%] shrink-0 border-r border-line bg-primarySoft" />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-2">
        <span className="h-[3px] w-1/2 rounded-full bg-ink/20" />
        <div className="grid grid-cols-2 gap-1.5">
          <span className="h-5 rounded-sm border border-line bg-paper" />
          <span className="h-5 rounded-sm border border-line bg-paper" />
        </div>
        <span className="sv-path h-1 w-1/3 rounded-full bg-accent" />
      </div>
    </div>
  )
}

// Engineering teams: Frontend → API → Cloud → Integration, assembled top-down on a spine.
function Stack({ steps }) {
  const { slabs, depth, spine } = stackLayout(steps)
  return (
    <svg {...svgProps}>
      <line x1={spine.x} y1={spine.y1} x2={spine.x} y2={spine.y2} strokeWidth="2" className="stroke-ink/15" />
      <line x1={spine.x} y1={spine.y1} x2={spine.x} y2={spine.y2} strokeWidth="2" className="sv-path sv-stack-spine stroke-accent" />
      {slabs.map((s) => (
        <g key={s.label}>
          <g className="sv-stack-tick" style={{ '--i': s.i }}>
            <line x1={spine.x} y1={s.cy} x2={s.x} y2={s.cy} strokeWidth="1.5" className="stroke-accent/60" />
            <circle cx={spine.x} cy={s.cy} r="3.5" strokeWidth="1.5" className="sv-stack-node fill-surface stroke-accent" />
          </g>
          <g className="sv-stack-slab" style={{ '--i': s.i }}>
            <rect x={s.x} y={s.y + depth} width={s.w} height={s.h} rx="5" className="fill-ink/10" />
            <rect x={s.x} y={s.y} width={s.w} height={s.h} rx="5" strokeWidth="1.25" className="fill-surface stroke-ink/20" />
            <text x={s.x + 12} y={s.cy} dy="0.35em" className="fill-ink" {...label}>
              {s.label}
            </text>
          </g>
        </g>
      ))}
      <g className="sv-signal sv-stack-signal" style={{ '--sv-dist': `${spine.y2 - spine.y1}px` }}>
        <circle cx={spine.x} cy={spine.y1} r="7" className="fill-accent/20" />
        <circle cx={spine.x} cy={spine.y1} r="3.5" className="fill-accent" />
      </g>
    </svg>
  )
}

const KIND = { flow: Flow, layers: Layers, stack: Stack }
