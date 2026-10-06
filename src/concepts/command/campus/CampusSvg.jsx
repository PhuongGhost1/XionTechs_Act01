import { campus } from '../content'
import { GATE_ROAD, PATHS, ROAD } from './model'

// The flat site plan: the svg tier (reduced motion, no WebGL, data saver, low-power devices) and the image the
// 3D model fades in over. Same campus, same picking and layer tints. A building with two floors is drawn as two
// strips, the upper floor to the north, so every room is visible at once. The panel stays the keyboard route.

const rect = (r, z = r.z) => ({ x: r.x[0], y: z[0], width: r.x[1] - r.x[0], height: z[1] - z[0] })

// The z span a room takes in the plan: its floor's strip of the building.
function planZ(model, room) {
  const b = model.byId[room.buildingId]
  if (b.outdoor || b.floors < 2) return room.z
  const depth = (b.z[1] - b.z[0]) / b.floors
  const strip = b.floors - 1 - room.floor
  return [b.z[0] + strip * depth, b.z[0] + (strip + 1) * depth]
}

function fillFor(layer, st) {
  if (layer === 'none') return undefined
  if (st.layer == null) return { fill: 'rgb(var(--c-surface))' }
  return { fill: `color-mix(in srgb, rgb(var(--c-signal)) ${Math.round(st.layer * 100)}%, rgb(var(--c-raise)))` }
}

export default function CampusSvg({ model, live, sel, hover, layer, onSelect, onHover }) {
  const { frame } = model
  const vb = `${frame.x[0] - 1} ${frame.z[0] - 1} ${frame.x[1] - frame.x[0] + 2} ${frame.z[1] - frame.z[0] + 2}`
  const bays = model.decor.bays.slice(0, live.parked)
  return (
    <svg viewBox={vb} preserveAspectRatio="xMidYMid meet" className="cp-svg h-full w-full" role="img" aria-label={campus.fallbackNote}>
      <rect {...rect({ x: frame.x, z: frame.z })} className="cp-svg-lawn" />
      {PATHS.map((p, i) => (
        <rect key={i} {...rect(p)} className="cp-svg-paved" />
      ))}
      <rect {...rect(ROAD)} className="cp-svg-road" />
      <rect {...rect(GATE_ROAD)} className="cp-svg-road" />
      {model.decor.trees.map(([x, z, s], i) => (
        <circle key={i} cx={x} cy={z} r={0.75 * s} className="cp-svg-tree" />
      ))}
      {model.rooms.map((r) => {
        const st = live.states[r.id]
        const z = planZ(model, r)
        const on = sel.roomId === r.id || hover?.roomId === r.id || (hover?.buildingId === r.buildingId && !hover.roomId)
        return (
          <g key={r.id} className="cp-svg-room" data-on={on ? 'true' : 'false'} data-status={st.status} data-severity={st.severity ?? undefined} data-outdoor={r.outdoor ? 'true' : 'false'}>
            <rect
              {...rect(r, z)}
              style={fillFor(layer, st)}
              onClick={() => onSelect({ buildingId: r.buildingId, roomId: r.id })}
              onPointerEnter={() => onHover({ buildingId: r.buildingId, roomId: r.id })}
              onPointerLeave={() => onHover(null)}
            />
            <text x={(r.x[0] + r.x[1]) / 2} y={(z[0] + z[1]) / 2} textAnchor="middle" dominantBaseline="middle" className="cp-svg-text">
              {r.name.length * 0.52 <= r.x[1] - r.x[0] - 0.6 ? r.name : (r.short ?? r.name)}
            </text>
          </g>
        )
      })}
      {bays.map(([x, zz], i) => (
        <rect key={i} x={x - 0.4} y={zz - 0.85} width={0.8} height={1.7} className="cp-svg-car" />
      ))}
      {model.buildings
        .filter((b) => !b.outdoor)
        .map((b) => (
          <g key={b.id}>
            <rect {...rect(b)} className="cp-svg-outline" />
            <text x={b.x[0]} y={b.z[0] - 0.6} className="cp-svg-title">
              {b.name}
            </text>
            {b.floors > 1 &&
              campus.floorNames.slice(0, b.floors).map((name, f) => {
                const depth = (b.z[1] - b.z[0]) / b.floors
                return (
                  <text key={name} x={b.x[0] - 0.4} y={b.z[0] + (b.floors - 1 - f + 0.5) * depth} textAnchor="end" dominantBaseline="middle" className="cp-svg-floor">
                    {name}
                  </text>
                )
              })}
          </g>
        ))}
    </svg>
  )
}
