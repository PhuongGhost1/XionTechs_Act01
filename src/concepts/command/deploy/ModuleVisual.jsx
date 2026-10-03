// Small technical status indicators, one per module (`module.visual`). Schematic only: no numbers, no
// claims. Loops carry `x-loop` (Pause Motion stops them); under reduced motion nothing animates and
// each drawing shows its resting, final state. Animation uses transform and opacity only.
import { useReducedMotion } from '../hooks/index.js'

const CSS = `
@keyframes xd-layer { 0%, 12% { transform: translateY(0); } 25%, 37% { transform: translateY(36px); } 50%, 62% { transform: translateY(72px); } 75%, 100% { transform: translateY(108px); } }
@keyframes xd-packet { 0% { transform: translateX(0); opacity: 0; } 6% { opacity: 1; } 34%, 44% { transform: translateX(126px); opacity: 1; } 80% { transform: translateX(252px); opacity: 1; } 92%, 100% { transform: translateX(252px); opacity: 0; } }
@keyframes xd-human { 0%, 30% { opacity: 0; } 36%, 46% { opacity: 1; } 56%, 100% { opacity: 0; } }
@keyframes xd-bus { 0% { transform: translateX(0); opacity: 0; } 10%, 90% { opacity: 1; } 100% { transform: translateX(224px); opacity: 0; } }
@keyframes xd-rise { 0%, 4% { transform: scaleY(0.001); } 24%, 100% { transform: scaleY(1); } }
.xd-loop-layer { animation: xd-layer 6s var(--x-ease) infinite; }
.xd-loop-packet { animation: xd-packet 5s linear infinite; }
.xd-loop-human { animation: xd-human 5s linear infinite; }
.xd-loop-bus { animation: xd-bus 4s linear infinite; }
.xd-loop-rise { transform-box: fill-box; transform-origin: 50% 100%; animation: xd-rise 6s var(--x-ease) infinite; animation-delay: calc(var(--i) * 0.45s); }
`

const LABELS = {
  stack: 'Schematic of a layered application stack.',
  agent: 'Schematic: a request is decided by an agent, a person approves, then the agent acts.',
  cloud: 'Schematic: three cloud providers joined to your systems by one shared bus.',
  product: 'Schematic: a product built up one increment at a time.',
}

const NODE = 'fill-x-bg stroke-x-faint'
const TEXT = 'x-mono fill-x-mute'

function Stack({ loop }) {
  return (
    <>
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <rect x="64" y={20 + i * 36} width="232" height="24" className="fill-x-bg2 stroke-x-faint" />
          <path d={`M40 ${32 + i * 36}H64`} className="stroke-x-line" />
          <path d={`M296 ${32 + i * 36}H320`} className="stroke-x-line" />
        </g>
      ))}
      <rect
        x="64"
        y="20"
        width="232"
        height="24"
        className={`fill-none stroke-x-signal ${loop ? 'x-loop xd-loop-layer' : ''}`}
      />
    </>
  )
}

function Agent({ loop }) {
  const nodes = [
    { x: 16, y: 40, t: 'Request' },
    { x: 142, y: 40, t: 'Decide' },
    { x: 268, y: 40, t: 'Act' },
  ]
  return (
    <>
      <path d="M92 60H142M218 60H268" className="stroke-x-faint" />
      <path d="M180 80V116" strokeDasharray="3 3" className="stroke-x-faint" />
      {nodes.map((n) => (
        <g key={n.t}>
          <rect x={n.x} y={n.y} width="76" height="40" className={NODE} />
          <text x={n.x + 38} y={n.y + 20} textAnchor="middle" dominantBaseline="middle" className={TEXT}>
            {n.t}
          </text>
        </g>
      ))}
      <rect x="142" y="116" width="76" height="40" strokeDasharray="3 3" className={NODE} />
      <text x="180" y="136" textAnchor="middle" dominantBaseline="middle" className={TEXT}>
        Approval
      </text>
      <rect
        x="142"
        y="116"
        width="76"
        height="40"
        className={`fill-none stroke-x-signal ${loop ? 'x-loop xd-loop-human' : ''}`}
        style={loop ? undefined : { opacity: 1 }}
      />
      <rect
        x="50"
        y="56"
        width="8"
        height="8"
        className={`fill-x-signal stroke-none ${loop ? 'x-loop xd-loop-packet' : ''}`}
        style={loop ? { opacity: 0 } : { transform: 'translateX(252px)' }}
      />
    </>
  )
}

function Cloud({ loop }) {
  const providers = [
    { x: 32, t: 'Azure' },
    { x: 144, t: 'AWS' },
    { x: 256, t: 'GCP' },
  ]
  return (
    <>
      <path d="M24 100H336" className="stroke-x-faint" />
      <path d="M180 100V128" className="stroke-x-faint" />
      {providers.map((p) => (
        <g key={p.t}>
          <path d={`M${p.x + 36} 52V100`} className="stroke-x-faint" />
          <rect x={p.x} y="20" width="72" height="32" className={NODE} />
          <text x={p.x + 36} y="36" textAnchor="middle" dominantBaseline="middle" className={TEXT}>
            {p.t}
          </text>
        </g>
      ))}
      <rect x="116" y="128" width="128" height="32" strokeDasharray="3 3" className={NODE} />
      <text x="180" y="144" textAnchor="middle" dominantBaseline="middle" className={TEXT}>
        Your systems
      </text>
      {[0, 2].map((delay) => (
        <rect
          key={delay}
          x="65"
          y="97"
          width="6"
          height="6"
          className={`fill-x-signal stroke-none ${loop ? 'x-loop xd-loop-bus' : ''}`}
          style={loop ? { opacity: 0, animationDelay: `${delay}s` } : delay === 0 ? { transform: 'translateX(112px)' } : { display: 'none' }}
        />
      ))}
    </>
  )
}

function Product({ loop }) {
  return (
    <>
      <path d="M16 152H344" className="stroke-x-faint" />
      {[0, 1, 2, 3].map((i) => (
        <rect
          key={i}
          x={32 + i * 64}
          y={152 - (i + 1) * 28}
          width="44"
          height={(i + 1) * 28}
          style={{ '--i': i }}
          className={`${i === 3 ? 'fill-x-bg2 stroke-x-signal' : 'fill-x-bg2 stroke-x-faint'} ${loop ? 'x-loop xd-loop-rise' : ''}`}
        />
      ))}
      <rect x="288" y="12" width="44" height="140" strokeDasharray="3 3" className="fill-none stroke-x-faint" />
    </>
  )
}

const DRAW = { stack: Stack, agent: Agent, cloud: Cloud, product: Product }

export default function ModuleVisual({ kind, className = '' }) {
  const reduced = useReducedMotion()
  const Draw = DRAW[kind]
  if (!Draw) return null
  return (
    <>
      <style>{CSS}</style>
      <svg
        role="img"
        aria-label={LABELS[kind]}
        viewBox="0 0 360 176"
        width="360"
        height="176"
        fill="none"
        strokeWidth="1"
        className={`block h-auto w-full ${className}`}
      >
        <Draw loop={!reduced} />
      </svg>
    </>
  )
}
