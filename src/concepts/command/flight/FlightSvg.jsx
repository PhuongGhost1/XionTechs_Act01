import { createFlatView, pathOf } from './flat2d'
import { journeyNodeStatus, litFraction, planNodeStatus, restingPose } from './model'

// The flat drawing of the flight plan: the same layout as the 3D plot, from above, drawn once. It is the
// renderer on phones without WebGL, under reduced motion, saveData and low power, after a lost context, and
// the image the 3D plot fades in over. The craft sits at the current waypoint and no retry loop is drawn.
// It is decorative: everything it says is also in the labels and the readout.

const STROKE = {
  off: 'stroke-cmd-line',
  path: 'stroke-cmd-faint',
  working: 'stroke-cmd-signal',
  waiting: 'stroke-cmd-signal',
  active: 'stroke-cmd-signal',
  retried: 'stroke-cmd-signal',
  failing: 'stroke-cmd-danger',
  retrying: 'stroke-cmd-danger',
  recovered: 'stroke-cmd-ok',
}
const FILL = {
  off: 'fill-cmd-line',
  path: 'fill-cmd-faint',
  working: 'fill-cmd-signal',
  waiting: 'fill-cmd-signal',
  active: 'fill-cmd-signal',
  retried: 'fill-cmd-signal',
  failing: 'fill-cmd-danger',
  retrying: 'fill-cmd-danger',
  recovered: 'fill-cmd-ok',
}

function Marker({ node, status, x, y }) {
  const stroke = STROKE[status]
  const common = { fill: 'none', strokeWidth: 1.25, className: stroke }
  const dot = <rect x={x - 2.5} y={y - 2.5} width="5" height="5" className={FILL[status]} />
  switch (node.kind) {
    case 'trigger':
      return (
        <g>
          <path d={`M${x} ${y - 11} L${x + 10} ${y + 8} L${x - 10} ${y + 8} Z`} {...common} />
          {dot}
        </g>
      )
    case 'router':
      return (
        <g>
          <path d={`M${x} ${y - 12} L${x + 12} ${y} L${x} ${y + 12} L${x - 12} ${y} Z`} {...common} />
          <circle cx={x} cy={y} r="17" {...common} strokeDasharray="2 3" />
        </g>
      )
    case 'human':
      return (
        <g>
          <circle cx={x} cy={y} r="12" {...common} />
          <circle cx={x} cy={y} r="8" {...common} />
          {status === 'waiting' && (
            <path
              d={`M${x - 19} ${y - 12} v-7 h7 M${x + 12} ${y - 19} h7 v7 M${x + 19} ${y + 12} v7 h-7 M${x - 12} ${y + 19} h-7 v-7`}
              fill="none"
              strokeWidth="1.5"
              className="stroke-cmd-signal"
            />
          )}
          {dot}
        </g>
      )
    case 'outcome':
      return node.abort ? (
        <g>
          <path d={`M${x + 16} ${y} A16 8 0 1 1 ${x} ${y + 8}`} {...common} strokeDasharray="3 3" />
          {dot}
        </g>
      ) : (
        <g>
          <ellipse cx={x} cy={y} rx="17" ry="8" {...common} />
          {dot}
        </g>
      )
    case 'resource':
      return (
        <g>
          <rect x={x - 8} y={y - 8} width="16" height="16" {...common} />
          {dot}
        </g>
      )
    case 'skill':
      return (
        <g>
          <path d={`M${x} ${y - 10} L${x + 10} ${y} L${x} ${y + 10} L${x - 10} ${y} Z`} {...common} />
          {dot}
        </g>
      )
    case 'compact':
      return (
        <g>
          <circle cx={x} cy={y} r="14" {...common} />
          <circle cx={x} cy={y} r="9" {...common} />
        </g>
      )
    default:
      return (
        <g>
          <circle cx={x} cy={y} r="9" {...common} />
          {dot}
        </g>
      )
  }
}

export default function FlightSvg({ model, run, state, jState, tick, size, animate }) {
  const { project } = createFlatView(model.frame, size)
  const status = (n) => (model.view === 'journey' ? journeyNodeStatus(Number(n.id.slice(5)), jState) : planNodeStatus(n.id, run, state))
  const f = tick
  const pose = restingPose(model, f)
  const at = project(pose.p)
  const ahead = project([pose.p[0] + pose.t[0], pose.p[1] + pose.t[1], pose.p[2] + pose.t[2]])
  const angle = (Math.atan2(ahead.y - at.y, ahead.x - at.x) * 180) / Math.PI + 90

  // Ground frame and grid, as in the 3D plot.
  const [x0, x1] = model.frame.x
  const [z0, z1] = model.frame.z
  const grid = []
  for (let x = Math.ceil(x0); x <= x1; x++) grid.push(pathOf(project, [[x, 0, z0], [x, 0, z1]]))
  for (let z = Math.ceil(z0); z <= z1; z++) grid.push(pathOf(project, [[x0, 0, z], [x1, 0, z]]))
  const frame = `${pathOf(project, [[x0, 0, z0], [x1, 0, z0], [x1, 0, z1], [x0, 0, z1]])} Z`

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={size.w}
      height={size.h}
      viewBox={`0 0 ${size.w} ${size.h}`}
      className="fp-svg pointer-events-none absolute inset-0 block h-full w-full"
    >
      <path d={grid.join(' ')} fill="none" strokeWidth="1" className="stroke-cmd-line" opacity="0.5" />
      <path d={frame} fill="none" strokeWidth="1" className="stroke-cmd-faint" opacity="0.5" />
      {model.edges.map((e) => {
        const failed = state?.errorEdges?.has(e.key)
        const d = pathOf(project, e.poly.pts)
        const lit = litFraction(e, f) >= 1
        return (
          <g key={e.key} fill="none">
            <path
              d={d}
              strokeWidth="1.25"
              strokeDasharray={e.candidate ? '4 4' : undefined}
              className={failed ? 'stroke-cmd-danger' : e.onPath ? 'stroke-cmd-faint' : 'stroke-cmd-line'}
            />
            {lit && <path d={d} strokeWidth="2" className="stroke-cmd-signal" />}
          </g>
        )
      })}
      {model.nodes.map((n) => {
        const p = project(n.pos)
        return <Marker key={n.id} node={n} status={status(n)} x={p.x} y={p.y} />
      })}
      <g
        className={animate ? 'fp-craft2d' : undefined}
        style={{ transform: `translate(${at.x.toFixed(1)}px, ${at.y.toFixed(1)}px) rotate(${angle.toFixed(0)}deg)` }}
      >
        <path d="M0 -10 L5.5 8 L-5.5 8 Z" className="fill-cmd-signal" />
      </g>
    </svg>
  )
}
