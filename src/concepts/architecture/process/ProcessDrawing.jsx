import { memo, useId, useMemo, useState } from 'react'
import { GAPS, GAP_OPEN, getScene } from './scene.js'
import { figureLabel } from './copy.js'

// The process drawing (sheet 04): pure SVG, rendered from process/scene.js. Which stage it shows is one CSS
// variable on the root (`--st`); every item carries the stage it first appears at, and process.css turns the
// difference into opacity, stroke-dashoffset and transforms, so changing `stage` animates the whole drawing
// with no per-frame React work. `frozen` is the stacked (mobile, reduced motion) version: it shows its own
// stage and plots that stage's additions once its parent `Plot` / `Sheet` sets data-in="true".

const DELAY_SCALE = 0.6 // the scene's delays are written as a timeline; this is how fast it is played

const style = (it) => {
  const s = { '--from': it.from }
  if (it.until != null) s['--until'] = it.until
  if (it.rest != null) s['--rest'] = it.rest
  if (it.alpha != null) s['--alpha'] = it.alpha
  if (it.delay) s['--d'] = `${Math.round(it.delay * DELAY_SCALE)}ms`
  return s
}

function Item({ it, fs }) {
  switch (it.t) {
    case 'path':
      return it.draw ? (
        <path d={it.d} pathLength="1" className={`pd-e pd-draw pd-s pd-s--${it.c}`} style={style(it)} />
      ) : (
        <path d={it.d} className={`pd-e pd-s pd-s--${it.c}`} style={style(it)} />
      )
    case 'rise':
      return <path d={it.d} className={`pd-e pd-rise pd-s pd-s--${it.c}`} style={{ ...style(it), '--h': it.h }} />
    case 'grow':
      return <path d={it.d} className="pd-e pd-grow pd-s" style={{ ...style(it), transformOrigin: `${it.ox}px ${it.oy}px` }} />
    case 'pillar':
      return <path d={it.d} className="pd-e pd-pillar pd-s pd-s--hair" style={{ ...style(it), transformOrigin: `${it.ox}px ${it.oy}px` }} />
    case 'circle':
      return <circle cx={it.x} cy={it.y} r={it.r} className="pd-e pd-bubble" style={style(it)} />
    case 'g':
      return (
        <g className="pd-e pd-arrive" style={{ ...style(it), '--ax': it.ax, '--ay': it.ay }}>
          {it.children.map((c, i) => (
            <Item key={i} it={c} fs={fs} />
          ))}
        </g>
      )
    case 'text': {
      const label = it.lines.map((l) => l.toUpperCase())
      const body = (x, y) => (
        <text x={x} y={y} textAnchor={it.anchor} className={`pd-t pd-t--${it.c}`}>
          {label.map((l, i) => (
            <tspan key={i} x={x} dy={i ? fs * 1.25 : 0}>
              {l}
            </tspan>
          ))}
        </text>
      )
      if (it.rot || it.bg) {
        // Rotated labels turn about their own centre; a label with paper behind it hides what it crosses.
        const rotated = Boolean(it.rot)
        const rh = fs + 8
        const ry = rotated ? -rh / 2 : -fs * 0.86 - 4
        const rx = it.anchor === 'end' ? -it.w + 3 : it.anchor === 'middle' ? -it.w / 2 : -3
        return (
          <g className="pd-e" style={style(it)} transform={`translate(${it.x} ${it.y}) rotate(${it.rot})`}>
            {it.bg ? <rect x={rx} y={ry} width={it.w} height={rh} className="pd-bg" /> : null}
            {body(0, rotated ? fs * 0.34 : 0)}
          </g>
        )
      }
      return (
        <g className="pd-e" style={style(it)}>
          {body(it.x, it.y)}
        </g>
      )
    }
    default:
      return null
  }
}

const Layer = memo(function Layer({ items, fs }) {
  return items.map((it, i) => <Item key={i} it={it} fs={fs} />)
})

/**
 * stage     0..5 (-1 draws nothing: the sheet before it has entered the viewport)
 * size      'lg' | 'md' | 'sm': the scene is drawn at a scale where its labels are 11 px or more
 * frozen    the stacked version: shows `stage`, plotting its additions on entry
 */
export default function ProcessDrawing({ stage, size = 'lg', frozen = false, className = '', label }) {
  const scene = getScene(size)
  const titleId = useId()
  const [track, setTrack] = useState({ stage, dir: 'fwd' })
  if (track.stage !== stage) setTrack({ stage, dir: stage >= track.stage ? 'fwd' : 'back' })

  const body = useMemo(
    () => (
      <>
        <g className="pd-ground">
          <Layer items={scene.ground} fs={scene.fs} />
        </g>
        {scene.slabs
          .map((items, i) => ({ items, i }))
          .reverse() // the lowest slab first, so each higher one is drawn over it
          .map(({ items, i }) => (
            <g key={i} className="pd-slab" style={{ '--n': scene.slabs.length - 1 - i }}>
              <Layer items={items} fs={scene.fs} />
            </g>
          ))}
        <g className="pd-top">
          <Layer items={scene.top} fs={scene.fs} />
        </g>
      </>
    ),
    [scene],
  )

  const now = GAPS[Math.max(0, stage)] ?? 0
  const prev = GAPS[Math.max(0, stage - 1)] ?? 0
  const { x, y, w, h } = frozen ? scene.viewBoxes[Math.max(0, stage)] : scene.viewBox
  return (
    <svg
      viewBox={`${x} ${y} ${w} ${h}`}
      width={w}
      height={h}
      role="img"
      aria-labelledby={titleId}
      focusable="false"
      className={`pd ${className}`}
      data-frozen={frozen ? '' : undefined}
      data-dir={track.dir}
      style={{
        '--stage': stage,
        '--K': scene.K,
        '--gap-now': now,
        '--gap-prev': prev,
        '--gr-now': (now / GAP_OPEN).toFixed(4),
        '--gr-prev': (prev / GAP_OPEN).toFixed(4),
        fontSize: scene.fs,
        maxWidth: frozen ? w : undefined,
      }}
    >
      <title id={titleId}>{label ?? figureLabel(Math.max(0, stage))}</title>
      {body}
    </svg>
  )
}
