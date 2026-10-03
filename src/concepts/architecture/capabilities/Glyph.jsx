import { createContext, useContext } from 'react'

// The plan-view glyphs of sheet 03: one line drawing per capability layer, in the same language as the hero
// (thin navy strokes, a few yellow markers, one yellow dimension line). No icon library: every shape here is
// drawn by hand on a 240 x 150 sheet. The small version sits in the band; the large version (`large`) is the
// drawing in the open panel, with numbered keynote bubbles that match the list beside it.
// Plotting: the small version uses `.bp-draw` / `.bp-fade` (the band's Plot sets data-in); the large version uses
// `.gl-draw` / `.gl-fade`, which react to the band being open (capabilities.css).

const Large = createContext(false)
const tick = (t) => ({ '--d': `${t * 70}ms` })

function Stroke({ as, t = 0, tone, className = '', ...props }) {
  const Tag = as
  const large = useContext(Large)
  const classes = ['gl', tone ? `gl--${tone}` : '', large ? 'gl-draw' : 'bp-draw', className].filter(Boolean).join(' ')
  return <Tag pathLength="1" className={classes} style={tick(t)} {...props} />
}
const Ln = (props) => <Stroke as="line" {...props} />
const Pa = (props) => <Stroke as="path" {...props} />
const Re = (props) => <Stroke as="rect" {...props} />
const Ci = (props) => <Stroke as="circle" {...props} />

/** Filled shapes (yellow markers, solid arrowheads) fade in instead of drawing on. */
function Fd({ t = 0, children }) {
  const large = useContext(Large)
  return (
    <g className={large ? 'gl-fade' : 'bp-fade'} style={tick(t)}>
      {children}
    </g>
  )
}

/** A yellow dimension line with end ticks, the signature of every drawing in the set. */
function DimX({ x1, x2, y, t = 0 }) {
  return (
    <g>
      <Ln t={t} tone="sig" x1={x1} y1={y} x2={x2} y2={y} />
      <Ln t={t + 1} tone="sig" x1={x1} y1={y - 5} x2={x1} y2={y + 5} />
      <Ln t={t + 1} tone="sig" x1={x2} y1={y - 5} x2={x2} y2={y + 5} />
    </g>
  )
}
function DimY({ x, y1, y2, t = 0 }) {
  return (
    <g>
      <Ln t={t} tone="sig" x1={x} y1={y1} x2={x} y2={y2} />
      <Ln t={t + 1} tone="sig" x1={x - 5} y1={y1} x2={x + 5} y2={y1} />
      <Ln t={t + 1} tone="sig" x1={x - 5} y1={y2} x2={x + 5} y2={y2} />
    </g>
  )
}

/** A numbered keynote bubble with a leader to the part it names. Large drawings only. */
function Note({ n, x, y, to }) {
  const large = useContext(Large)
  if (!large) return null
  return (
    <g className="gl-fade" style={tick(16 + n)}>
      {to ? <line className="gl gl--soft" x1={x} y1={y} x2={to[0]} y2={to[1]} /> : null}
      <circle className="gl gl--bg" cx={x} cy={y} r="8.5" />
      <text className="gl-num" x={x} y={y} textAnchor="middle" dominantBaseline="central">
        {n}
      </text>
    </g>
  )
}

// --------------------------------------------------------------------------------------------- the six glyphs

// A site plan with survey marks and a north arrow: where the work starts.
function Survey() {
  const marks = [
    [62, 60],
    [150, 50],
    [130, 100],
  ]
  return (
    <>
      <Pa t={0} d="M30 40 L140 22 L206 50 L192 112 L72 124 Z" />
      <Pa t={2} tone="soft" d="M43 49 L138 34 L194 57 L183 101 L79 111 Z" />
      <Pa t={3} tone="soft" d="M44 86 C74 70 104 92 134 76 S178 66 196 78" />
      <Pa t={3} tone="soft" d="M52 101 C80 89 108 107 138 93 S172 88 188 95" />
      <Pa t={4} tone="soft" d="M62 60 L150 50 L130 100 Z" />
      {marks.map(([x, y], i) => (
        <g key={i}>
          <Ln t={5 + i} x1={x - 8} y1={y} x2={x + 8} y2={y} />
          <Ln t={5 + i} x1={x} y1={y - 8} x2={x} y2={y + 8} />
          <Fd t={7 + i}>
            <circle className="gl gl--bg gl--fillsig" cx={x} cy={y} r="3.4" />
          </Fd>
        </g>
      ))}
      <Ci t={1} cx="216" cy="26" r="9" />
      <Fd t={8}>
        <path className="gl-solid" d="M216 17 L220 29 L216 26 L212 29 Z" />
      </Fd>
      <Ln t={9} tone="soft" x1="72" y1="124" x2="72" y2="142" />
      <Ln t={9} tone="soft" x1="192" y1="112" x2="192" y2="142" />
      <DimX x1={72} x2={192} y={138} t={10} />
      <Note n={1} x={16} y={66} to={[54, 60]} />
      <Note n={2} x={150} y={11} to={[150, 42]} />
      <Note n={3} x={224} y={96} to={[138, 100]} />
    </>
  )
}

// Stacked interface frames: the product, as the people who use it see it.
function Screens() {
  const frames = [0, 1, 2, 3].map((i) => ({ x: 26 + i * 24, y: 10 + i * 16 }))
  return (
    <>
      {frames.map(({ x, y }, i) => (
        <g key={i}>
          <Re t={i * 2} tone="bg" x={x} y={y} width="112" height="70" />
          <Ln t={i * 2 + 1} x1={x} y1={y + 12} x2={x + 112} y2={y + 12} />
          <Fd t={i * 2 + 1}>
            {[8, 15, 22].map((dx) => (
              <circle key={dx} className="gl" cx={x + dx} cy={y + 6} r="1.6" />
            ))}
          </Fd>
        </g>
      ))}
      {(() => {
        const { x, y } = frames[3]
        return (
          <g>
            <Ln t={9} x1={x + 28} y1={y + 12} x2={x + 28} y2={y + 70} />
            <Re t={9} x={x + 36} y={y + 20} width="48" height="18" />
            <Ln t={10} x1={x + 36} y1={y + 46} x2={x + 98} y2={y + 46} />
            <Ln t={10} x1={x + 36} y1={y + 54} x2={x + 80} y2={y + 54} />
            <Ln t={10} tone="soft" x1={x + 6} y1={y + 22} x2={x + 20} y2={y + 22} />
            <Ln t={10} tone="soft" x1={x + 6} y1={y + 30} x2={x + 20} y2={y + 30} />
            <Ln t={10} tone="soft" x1={x + 6} y1={y + 38} x2={x + 20} y2={y + 38} />
            <Fd t={11}>
              <rect className="gl gl--fillsig" x={x + 88} y={y + 54} width="16" height="9" />
            </Fd>
          </g>
        )
      })()}
      <Ln t={11} tone="soft" x1="98" y1="80" x2="98" y2="146" />
      <Ln t={11} tone="soft" x1="210" y1="128" x2="210" y2="146" />
      <DimX x1={98} x2={210} y={142} t={12} />
      {frames.slice(0, 4).map(({ x, y }, i) => (
        <Note key={i} n={i + 1} x={x + 124} y={y + 5} />
      ))}
    </>
  )
}

// A grid of blocks, one lifted out of its slot: modules that can change independently.
function Modules() {
  const blocks = []
  for (let r = 0; r < 3; r += 1) {
    for (let c = 0; c < 4; c += 1) {
      if (!(c === 3 && r === 1)) blocks.push({ x: 26 + c * 48, y: 32 + r * 38, c, r })
    }
  }
  return (
    <>
      <Re t={0} tone="soft" x="170" y="70" width="40" height="24" />
      <Ln t={1} tone="soft" x1="170" y1="70" x2="180" y2="58" />
      <Ln t={1} tone="soft" x1="210" y1="70" x2="220" y2="58" />
      <Ln t={1} tone="soft" x1="210" y1="94" x2="220" y2="82" />
      {blocks.map(({ x, y, c, r }) => (
        <Re key={`${c}${r}`} t={2 + c + r * 2} x={x} y={y} width="40" height="24" />
      ))}
      <Fd t={12}>
        <rect className="gl gl--fillsig" x="180" y="58" width="40" height="24" />
      </Fd>
      <Ln t={12} tone="soft" x1="26" y1="132" x2="26" y2="146" />
      <Ln t={12} tone="soft" x1="210" y1="132" x2="210" y2="146" />
      <DimX x1={26} x2={210} y={142} t={13} />
      <Note n={1} x={46} y={13} to={[46, 32]} />
      <Note n={2} x={142} y={13} to={[142, 32]} />
      <Note n={3} x={10} y={121} to={[26, 121]} />
      <Note n={4} x={230} y={46} to={[214, 58]} />
    </>
  )
}

// A loop with a node and a decision diamond: an agent that routes work, uses tools and hands off to a person.
function Agent() {
  return (
    <>
      <Pa t={0} d="M76 50 H164 A25 25 0 0 1 164 100 H76 A25 25 0 0 1 76 50 Z" />
      <Ln t={4} x1="120" y1="100" x2="120" y2="122" />
      <Fd t={4}>
        <path className="gl-solid" d="M98 46 L106 50 L98 54 Z" />
        <path className="gl-solid" d="M142 96 L134 100 L142 104 Z" />
      </Fd>
      <Re t={5} tone="bg" x="45" y="70" width="10" height="10" />
      <Pa t={6} tone="bg" d="M120 36 L134 50 L120 64 L106 50 Z" />
      <Ci t={7} tone="bg" cx="189" cy="75" r="7" />
      <Fd t={8}>
        <circle className="gl gl--fillsig" cx="164" cy="50" r="3.6" />
        <rect className="gl gl--fillsig" x="113" y="122" width="14" height="12" />
      </Fd>
      <Ln t={9} tone="soft" x1="22" y1="50" x2="76" y2="50" />
      <Ln t={9} tone="soft" x1="22" y1="100" x2="76" y2="100" />
      <DimY x={22} y1={50} y2={100} t={10} />
      <Note n={1} x={92} y={118} to={[84, 100]} />
      <Note n={2} x={150} y={20} to={[127, 43]} />
      <Note n={3} x={218} y={46} to={[193, 70]} />
      <Note n={4} x={150} y={128} to={[127, 128]} />
    </>
  )
}

// A bus line with taps: one backbone, several systems joined to it.
function Bus() {
  const up = [40, 120, 200]
  const down = [80, 160]
  return (
    <>
      <Re t={0} x="14" y="71" width="212" height="8" />
      {up.map((x, i) => (
        <g key={`u${x}`}>
          <Ln t={2 + i} x1={x} y1="71" x2={x} y2="46" />
          <Re t={3 + i} tone={i === 1 ? undefined : 'bg'} x={x - 16} y="26" width="32" height="20" />
        </g>
      ))}
      {down.map((x, i) => (
        <g key={`d${x}`}>
          <Ln t={3 + i} x1={x} y1="79" x2={x} y2="104" />
          <Re t={4 + i} tone="bg" x={x - 16} y="104" width="32" height="20" />
        </g>
      ))}
      <Fd t={7}>
        <rect className="gl gl--fillsig" x="104" y="26" width="32" height="20" />
        <rect className="gl gl--bg" x="37" y="68" width="6" height="14" />
        <rect className="gl gl--bg" x="77" y="68" width="6" height="14" />
        <rect className="gl gl--fillsig" x="117" y="68" width="6" height="14" />
        <rect className="gl gl--bg" x="157" y="68" width="6" height="14" />
        <rect className="gl gl--bg" x="197" y="68" width="6" height="14" />
      </Fd>
      <Ln t={8} tone="soft" x1="14" y1="79" x2="14" y2="146" />
      <Ln t={8} tone="soft" x1="226" y1="79" x2="226" y2="146" />
      <DimX x1={14} x2={226} y={142} t={9} />
      <Note n={1} x={40} y={9} to={[40, 26]} />
      <Note n={2} x={190} y={96} to={[180, 79]} />
      <Note n={3} x={120} y={9} to={[120, 26]} />
    </>
  )
}

// Cloud nodes connected through a hub: where the system runs.
const CLOUD = 'M14 40 A12 12 0 0 1 12 17 A15 15 0 0 1 40 11 A13 13 0 0 1 58 24 A8.5 8.5 0 0 1 52 40 Z'
function Nodes() {
  const clouds = [
    { x: 22, y: 20 },
    { x: 150, y: 14 },
    { x: 86, y: 84 },
  ]
  const centre = (c) => [c.x + 31, c.y + 24]
  return (
    <>
      <Ln t={0} tone="soft" x1="53" y1="44" x2="181" y2="38" />
      {clouds.map((c, i) => {
        const [cx, cy] = centre(c)
        return <Ln key={i} t={1 + i} x1="117" y1="70" x2={cx} y2={cy} />
      })}
      {clouds.map((c, i) => (
        <g key={i} transform={`translate(${c.x} ${c.y})`}>
          <Pa t={3 + i * 2} tone="bg" d={CLOUD} />
        </g>
      ))}
      <Fd t={9}>
        <circle className="gl gl--fillsig" cx="117" cy="70" r="4.4" />
      </Fd>
      <Ln t={9} tone="soft" x1="22" y1="40" x2="22" y2="146" />
      <Ln t={9} tone="soft" x1="208" y1="34" x2="208" y2="146" />
      <DimX x1={22} x2={208} y={142} t={10} />
      <Note n={1} x={20} y={16} />
      <Note n={2} x={228} y={22} />
      <Note n={3} x={128} y={128} />
    </>
  )
}

const GLYPHS = { survey: Survey, screens: Screens, modules: Modules, agent: Agent, bus: Bus, nodes: Nodes }

/** One glyph by name. `large` adds the keynote bubbles and draws on when its band opens. */
export default function Glyph({ name, large = false, className = '' }) {
  const Shapes = GLYPHS[name]
  if (!Shapes) return null
  return (
    <Large.Provider value={large}>
      <svg viewBox="0 0 240 150" className={`cap-glyph-svg ${className}`} aria-hidden="true" focusable="false">
        <Shapes />
        {large && name === 'survey' ? (
          <text className="gl-num" x="216" y="9" textAnchor="middle" dominantBaseline="central">
            N
          </text>
        ) : null}
      </svg>
    </Large.Provider>
  )
}
