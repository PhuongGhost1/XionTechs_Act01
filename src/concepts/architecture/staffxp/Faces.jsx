import { useId } from 'react'
import { staffxp } from '../content.js'
import { copy } from './copy.js'
import { layerCode, shotOf, statusLabel } from './faces.js'

// The faces of the model's planes. Real screenshots where the product shows something (sanitized, with explicit
// size and alt text); drawings everywhere else. Drawings use the 800 x 410 sheet of the screenshots' aspect so
// every plane has the same footprint. Solid linework = seen in the product, dashed = not visible there.

export function ScreenFace({ layer, eager = false }) {
  const shot = shotOf(layer)
  if (!shot) return null
  return (
    <img
      className="sx-img"
      src={shot.src}
      alt={shot.alt}
      width={shot.width}
      height={shot.height}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      draggable={false}
    />
  )
}

/** Title strip shared by the drawn faces: drawing code and name left, line-type status right. */
function Strip({ layer, index }) {
  const solid = layer.confirmed
  const status = statusLabel(layer)
  const markX = 764 - status.length * 8.2 - 22 // mono 12px with tracking, about 8.2 units a character
  return (
    <g>
      <text x="36" y="48" className="sx-t-mono sx-t-ink">
        {layerCode(index)}
        <tspan dx="14">{layer.label}</tspan>
      </text>
      <rect x={markX} y="38" width="10" height="10" className={`sx-stroke-ink ${solid ? 'sx-fill-signal' : 'sx-dash'}`} fill={solid ? undefined : 'none'} />
      <text x="764" y="48" textAnchor="end" className="sx-t-mono sx-t-mute">
        {status}
      </text>
      <path d="M36 68H764" className="sx-stroke-ink sx-hair" />
    </g>
  )
}

/** Operational data: the modules the product navigation names, drawn as solid bays (they are visible in the screenshot). */
export function DataFace({ layer, index }) {
  const mods = layer.modules || []
  const cols = 3
  const rows = Math.max(1, Math.ceil(mods.length / cols))
  const gx = 20
  const gy = 20
  const left = 36
  const top = 92
  const w = (728 - gx * (cols - 1)) / cols
  const h = (284 - gy * (rows - 1)) / rows
  return (
    <svg className="sx-svg" viewBox="0 0 800 410" role="img" aria-label={`${layer.label}: ${mods.join(', ')}`} focusable="false">
      <Strip layer={layer} index={index} />
      {mods.map((name, i) => {
        const x = left + (i % cols) * (w + gx)
        const y = top + Math.floor(i / cols) * (h + gy)
        return (
          <g key={name}>
            <rect x={x} y={y} width={w} height={h} className="sx-stroke-ink sx-bay" fill="none" />
            <path d={`M${x} ${y + 46}H${x + w}`} className="sx-stroke-ink sx-hair" />
            <text x={x + 16} y={y + 30} className="sx-t-bay sx-t-ink">
              {name}
            </text>
            {[0, 1, 2].map((r) => (
              <g key={r} className="sx-rec">
                <rect x={x + 16} y={y + 66 + r * 20} width="6" height="6" className="sx-stroke-ink" fill="none" />
                <path d={`M${x + 32} ${y + 69 + r * 20}H${x + w - 16 - (r === 1 ? 46 : r === 2 ? 90 : 0)}`} className="sx-stroke-ink sx-hair" />
              </g>
            ))}
          </g>
        )
      })}
    </svg>
  )
}

/** Services and API, infrastructure: nothing in the product shows them, so the plane is a dashed placeholder. */
export function HiddenFace({ layer, index }) {
  const id = useId().replace(/:/g, '')
  const flip = index % 2 === 0 ? 45 : -45
  return (
    <svg className="sx-svg" viewBox="0 0 800 410" role="img" aria-label={`${layer.label}: ${copy.hiddenCaption}`} focusable="false">
      <defs>
        <pattern id={`h-${id}`} width="14" height="14" patternUnits="userSpaceOnUse" patternTransform={`rotate(${flip})`}>
          <path d="M0 0V14" className="sx-stroke-ink sx-hatch" />
        </pattern>
      </defs>
      <Strip layer={layer} index={index} />
      <rect x="36" y="92" width="728" height="284" fill={`url(#h-${id})`} />
      <rect x="36" y="92" width="728" height="284" className="sx-stroke-ink sx-dash" fill="none" />
      <g>
        <rect x="190" y="166" width="420" height="136" className="sx-plate sx-stroke-ink sx-dash" />
        <text x="400" y="226" textAnchor="middle" className="sx-t-name sx-t-ink">
          {layer.label}
        </text>
        <text x="400" y="262" textAnchor="middle" className="sx-t-mono sx-t-mute">
          {layer.seen.replace(/\.$/, '')}
        </text>
      </g>
    </svg>
  )
}

/** One face, chosen by what the product shows at that layer. */
export function Face({ layer, index, eager }) {
  if (layer.face) return <ScreenFace layer={layer} eager={eager} />
  if (layer.modules && layer.modules.length > 0) return <DataFace layer={layer} index={index} />
  return <HiddenFace layer={layer} index={index} />
}

/** Numbered boxes measured on the dashboard image (% of its width and height). */
export function Pins({ hot, onHot }) {
  return (
    <div className="sx-pins" data-hot={hot || undefined}>
      {staffxp.hotspots.map((h, i) => (
        <div
          key={h.id}
          className="sx-pin"
          data-on={hot === h.id ? 'true' : undefined}
          style={{ left: `${h.box.x}%`, top: `${h.box.y}%`, width: `${h.box.w}%`, height: `${h.box.h}%` }}
          onPointerEnter={() => onHot && onHot(h.id)}
          onPointerLeave={() => onHot && onHot(null)}
        >
          <span className="sx-pin__n" aria-hidden="true">
            {i + 1}
          </span>
        </div>
      ))}
    </div>
  )
}

/** "On this screen": the real text behind the numbered boxes. */
export function HotspotList({ hot, onHot, className = '' }) {
  const id = useId()
  return (
    <section aria-labelledby={id} className={className}>
      <h3 id={id} className="bp-mono mb-2 text-bp-mute">
        {staffxp.hotspotsTitle}
      </h3>
      <ol className="sx-list">
        {staffxp.hotspots.map((h, i) => (
          <li
            key={h.id}
            data-on={hot === h.id ? 'true' : undefined}
            onPointerEnter={() => onHot && onHot(h.id)}
            onPointerLeave={() => onHot && onHot(null)}
          >
            <span className="sx-list__n bp-mono" aria-hidden="true">
              {i + 1}
            </span>
            <span>{h.label}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}
