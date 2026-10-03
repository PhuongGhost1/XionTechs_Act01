import { useId } from 'react'
import { work } from '../content.js'
import { useMedia } from '../hooks/hooks.js'
import { copy } from './copy.js'
import { DRAW_ORDER, FLOW_IDS, WIDE_QUERY, arrowHead, layouts, nodeLines, nodeOf, polyD, polyLength, trimEnd } from './agentGraph.js'

// The illustrative agent flow, drawn as a block diagram: six nodes, a decision diamond, a human approval
// gate, dashed arrows that draw on, and one yellow signal that travels the path. Everything is dashed on
// purpose (dashed = illustrative, see the legend). Wide (md and up) reads left to right; on a phone the same
// system is redrawn top to bottom, not scaled down.

const { agents } = work
const HEAD = 11 // arrowhead length, user units
const STEP = 330 // ms between steps of the plot-on sequence

const alt = `${copy.agents.altLead} ${agents.flow.join(', ')}. ${agents.architectureNote} ${copy.agents.altTail}`

function Node({ node, label, delay }) {
  const { x, y, w, h, shape } = node
  const cx = x + w / 2
  const cy = y + h / 2
  const lines = nodeLines(label, node)
  const line = 15
  // The gate carries a second line (its name); every other node is centred on its lines.
  const first = shape === 'gate' ? cy - 8 : cy - ((lines.length - 1) * line) / 2
  return (
    <g className="bp-fade" style={{ '--d': `${delay}ms` }}>
      {shape === 'diamond' ? (
        <polygon
          points={`${cx},${y} ${x + w},${cy} ${cx},${y + h} ${x},${cy}`}
          className="bp-dashed fill-bp-bg stroke-bp-line"
          strokeWidth="1.25"
          strokeLinejoin="round"
        />
      ) : (
        <rect x={x} y={y} width={w} height={h} className="bp-dashed fill-bp-bg stroke-bp-line" strokeWidth="1.25" />
      )}
      {shape === 'gate' ? (
        <rect x={x + 5} y={y + 5} width={w - 10} height={h - 10} className="bp-dashed fill-none stroke-bp-line" strokeWidth="1" />
      ) : null}
      {lines.map((t, i) => (
        <text
          key={t}
          x={cx}
          y={first + i * line}
          textAnchor="middle"
          dominantBaseline="central"
          className="bp-h3 wk-flow__title fill-bp-text"
        >
          {t}
        </text>
      ))}
      {shape === 'gate' ? (
        <text x={cx} y={cy + 12} textAnchor="middle" dominantBaseline="central" className="bp-mono wk-flow__mono fill-bp-mute">
          {copy.agents.gate}
        </text>
      ) : null}
    </g>
  )
}

export default function AgentFlow() {
  const wide = useMedia(WIDE_QUERY)
  const layout = wide ? layouts.wide : layouts.tall
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const edgeDelay = (id) => 180 + DRAW_ORDER.edges.indexOf(id) * STEP
  const nodeDelay = (id) => DRAW_ORDER.nodes.indexOf(id) * STEP
  const done = nodeOf(layout, 'done')
  const travel = Math.round((polyLength(layout.signal) / 100) * 10) / 10

  return (
    <svg
      viewBox={`0 0 ${layout.w} ${layout.h}`}
      role="img"
      aria-label={alt}
      className="wk-flow mx-auto block h-auto w-full"
      style={wide ? undefined : { maxWidth: '24rem' }}
      width={layout.w}
      height={layout.h}
    >
      <defs>
        {layout.edges.map((e) => (
          <mask key={e.id} id={`${uid}-${e.id}`} maskUnits="userSpaceOnUse" x="0" y="0" width={layout.w} height={layout.h}>
            <path
              d={polyD(e.points)}
              fill="none"
              stroke="white"
              strokeWidth="10"
              pathLength="1"
              className="bp-draw"
              style={{ '--d': `${edgeDelay(e.id)}ms`, '--bp-draw': '620ms' }}
            />
          </mask>
        ))}
      </defs>

      {layout.edges.map((e) => (
        <g key={e.id}>
          <path
            d={polyD(trimEnd(e.points, HEAD))}
            fill="none"
            className="bp-dashed stroke-bp-line"
            strokeWidth="1.25"
            mask={`url(#${uid}-${e.id})`}
          />
          <path
            d={arrowHead(e.points, HEAD)}
            className="wk-flow__head bp-fade fill-bp-bg stroke-bp-line"
            strokeWidth="1.25"
            style={{ '--d': `${edgeDelay(e.id) + 520}ms` }}
          />
        </g>
      ))}

      {layout.nodes.map((n) => (
        <Node key={n.id} node={n} label={agents.flow[FLOW_IDS.indexOf(n.id)]} delay={nodeDelay(n.id)} />
      ))}

      {layout.labels.map((l) => {
        const edge = layout.edges.find((e) => e.label === l.key)
        return (
          <text
            key={l.key}
            x={l.x}
            y={l.y}
            textAnchor={l.anchor}
            dominantBaseline="central"
            className="bp-mono wk-flow__mono bp-fade fill-bp-mute"
            style={{ '--d': `${edgeDelay(edge.id) + 300}ms` }}
          >
            {copy.agents[l.key]}
          </text>
        )
      })}

      <rect
        x={done.x + done.w - 5}
        y={done.y - 5}
        width="10"
        height="10"
        className="wk-signal-rest fill-bp-signal stroke-bp-line"
        strokeWidth="1"
      />
      <rect
        x="-5"
        y="-5"
        width="10"
        height="10"
        className="wk-signal fill-bp-signal stroke-bp-line"
        strokeWidth="1"
        style={{ offsetPath: `path("${polyD(layout.signal)}")`, '--wk-travel': `${travel}s` }}
      />
    </svg>
  )
}
