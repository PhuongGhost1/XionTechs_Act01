import { agent } from '../../content/agent.js'
import { DEPTH, ROW_H, stackLayout } from '../../runtime/agent/tape.js'
import { Chip } from '../../ui/Chip.jsx'
import { cx } from '../../ui/cx.js'

// The printer and its tape (station 05). Presentational: rows come from runtime/agent/tape.js, the
// stacking from stackLayout(), the motion is CSS keyframes (agent.css), only transform, opacity and
// clip-path. The depth of the strip is inline style, decided by `stacked`, so the CSS file carries no
// mode that exists in one layout only (it is also what keeps the stylesheet inside its budget).
//
//   stage     the perspective (stacked): 1400 px, origin 50% 40%
//   device    preserve-3d, tilted a few degrees; holds the strip and the housing
//   strip     <ol>, one <li> per printed row, newest at the slot. Each row is a flat leaf plane that
//             carries its own depth (translateZ, rotateX, opacity); opacity and clip-path are never
//             put on a parent of 3D children
//   housing   the printer: roller hairlines, the yellow print head (the one live element), the
//             honesty labels. It sits in front of the strip, so a new row rises out from behind it
//
// Not stacked (phones, tablets, RAW, reduced motion): the strip is a plain flow of lines, perspective
// flattened, nothing hidden by depth. RAW also drops the paper (`raw`): a plain mono dot-leader sheet.

const t = agent.tape

// The zigzag notch of a tear-off, along the lower edge of the outcome row.
const NOTCH =
  'polygon(0 0,100% 0,100% calc(100% - 7px),93.75% 100%,87.5% calc(100% - 7px),81.25% 100%,75% calc(100% - 7px),68.75% 100%,62.5% calc(100% - 7px),56.25% 100%,50% calc(100% - 7px),43.75% 100%,37.5% calc(100% - 7px),31.25% 100%,25% calc(100% - 7px),18.75% 100%,12.5% calc(100% - 7px),6.25% 100%,0 calc(100% - 7px))'

const MONO_ROW = 'font-mono text-data'

// One-off layout is inline style rather than a utility: a utility used once costs a rule in the
// stylesheet, which has no room (see agent.css).
const PLAIN_TAG = { border: 0, padding: 0, textAlign: 'right', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }
const BOX = { padding: '12px 14px' }

// The printed-line motions. The keyframes are in agent.css; they are written inline so that the
// stylesheet is only keyframes. motion.css switches every animation off (MOTION off, reduced motion).
const ANIM = {
  row: 'tp-in 520ms var(--ease-brand) both',
  ink: 'tp-ink 460ms var(--ease-out) 120ms both',
  strike: 'tp-strike 240ms var(--ease-brand) both',
  stamp: 'tp-stamp 180ms var(--ease-brand) both',
  tear: 'tp-tear 1500ms var(--ease-brand) both',
  sweep: 'tp-sweep 640ms linear', // no fill: the head rests at the left when the printer stops
}

function Cell({ cell, abort, newest, wide, split, struck }) {
  const { tag } = cell
  const tagBase = 'shrink-0 border border-ink3 px-2 text-label font-medium uppercase'
  return (
    <div
      data-type={cell.type}
      style={split && wide ? { gridColumn: cell.col + 1, padding: cell.col ? '0 0 0 10px' : '0 10px 0 0' } : undefined}
      className={cx('relative min-w-0', MONO_ROW, newest ? 'text-ink' : 'text-ink2', cell.dim && !wide && 'hidden')}
    >
      {/* A retry says RETRY and its one-word fault on a line of its own, above the line it prints again. */}
      {cell.fault && (
        <span style={{ marginBottom: 4 }} className="flex items-center gap-2">
          <span className="text-label font-medium uppercase">{cell.prefix}</span>
          <span className={tagBase}>{cell.fault}</span>
        </span>
      )}
      <span className="flex items-baseline gap-2">
        {!cell.fault && cell.prefix && <span className="shrink-0 text-label font-medium uppercase">{cell.prefix}</span>}
        <span className={cx('min-w-0', cell.type === 'head' && 'font-medium')}>{cell.text}</span>
        <span aria-hidden="true" style={{ minWidth: 12, marginBottom: 4, alignSelf: 'flex-end' }} className="flex-1 border-b border-dotted border-hairStrong" />
        {abort && <span style={{ transform: 'rotate(-3deg)' }} className="shrink-0 border border-ink px-2 text-label font-medium uppercase text-ink">{t.abort.text}</span>}
        {tag?.text && (
          <span
            title={tag.pending ? agent.capabilityNote.text : undefined}
            style={tag.plain ? PLAIN_TAG : undefined}
            className={cx(tagBase, tag.pending && 'border-dashed')}
          >
            {tag.text}
          </span>
        )}
      </span>
      {/* A failed line is struck through (its own cell only), and prints again below. */}
      {struck && <span aria-hidden="true" style={{ transformOrigin: 'left center', animation: ANIM.strike }} className="absolute inset-x-0 top-1/2 h-px bg-ink" />}
    </div>
  )
}

function Sign({ row, staticMode }) {
  const verb = 'mt-1 font-mono text-data text-ink2'
  const box = 'h-full w-full border border-dashed border-hairStrong'
  const word = 'font-mono text-label font-medium uppercase text-ink'
  if (staticMode) {
    // Reduced motion and RAW: the buttons are replaced by what each would do.
    const result = (label, text, to) => (
      <div className={cx('mt-2 flex flex-wrap items-baseline gap-2', MONO_ROW, 'text-ink2')}>
        <dt className="text-label uppercase text-ink">{label}</dt>
        <dd className="m-0">{text}</dd>
        <dd className="m-0 border border-ink3 px-2 text-label font-medium uppercase">{to}</dd>
      </div>
    )
    return (
      <div className={box} style={BOX}>
        <p className={word}>{t.sign.text}</p>
        <dl>
          {result(t.ifApproved.text, row.results.approve.text, row.approveTo.join(', '))}
          {result(t.ifRejected.text, row.results.reject.text, row.rejectTo.join(', '))}
        </dl>
      </div>
    )
  }
  if (row.decision) {
    return (
      <div className={box} style={{ ...BOX, perspective: 480 }}>
        {/* Keyed on the decision so the stamp presses once, when the visitor decides. */}
        <p
          key={row.decision}
          style={{ padding: '4px 12px', fontSize: '0.875rem', fontWeight: 500, letterSpacing: '0.14em', transform: 'rotate(-2deg)', animation: ANIM.stamp }}
          className="inline-block border border-ink font-mono uppercase text-ink"
        >
          {row.decision === 'approve' ? t.stampApproved.text : t.stampRejected.text}
        </p>
        <p className={verb}>{row.results[row.decision].text}</p>
      </div>
    )
  }
  return (
    <div className={box} style={BOX}>
      <p className={word}>{t.sign.text}</p>
      {/* The static yellow underline: yellow means live, and nothing blinks. */}
      <span aria-hidden="true" style={{ width: '17ch', height: 2 }} className="mt-1 block max-w-full bg-signal" />
      <p className={verb}>{row.verb}</p>
      <p className={verb}>{t.signHint.text}</p>
    </div>
  )
}

function stubWords(decision) {
  if (decision === 'approve') return agent.run.line.approved.text
  if (decision === 'reject') return agent.run.line.rejected.text
  return t.complete.text
}

/** The inline style of a row: its place on the stacked strip, or a minimum height in the flow. */
function rowStyle({ row, y, z, rx, o, h }, stacked, raw) {
  const clipPath = row.outcome && !raw ? NOTCH : undefined
  if (!stacked) {
    if (row.folded) return { display: 'none' }
    // The tear-off slip hangs over the printer's top edge: it needs to be above it.
    if (row.kind === 'stub') return { zIndex: 1, animation: 'none' }
    return { minHeight: ['line', 'perf', 'fold'].includes(row.kind) ? h : undefined, clipPath, animation: ANIM.row }
  }
  const base = { position: 'absolute', insetInline: 0, bottom: 0, height: h, animation: ANIM.row, overflow: row.kind === 'sign' ? undefined : 'hidden', '--y': `${y}px` }
  if (row.kind === 'stub') return { ...base, height: 0, overflow: undefined, transform: 'translate3d(0,0,16px)', animation: 'none' }
  return {
    ...base,
    transform: `translate3d(0,${-y}px,${z}px) rotateX(${row.folded ? -90 : rx}deg)`,
    transformOrigin: row.folded ? '50% 0' : undefined,
    opacity: row.folded ? 0 : o,
    pointerEvents: row.folded ? 'none' : undefined,
    transition: `transform ${row.folded ? 360 : 520}ms var(--ease-brand), opacity 360ms var(--ease-out)`,
    clipPath,
  }
}

function Row({ item, newest, stacked, raw, wide, staticMode }) {
  const { row } = item
  const style = rowStyle(item, stacked, raw)
  const flags = {
    'data-kind': row.kind,
    'data-struck': row.struck ? '' : undefined,
    'data-folded': row.folded ? '' : undefined,
    'data-outcome': row.outcome ? (row.abort ? 'abort' : 'ok') : undefined,
  }
  const paper = raw ? '' : 'bg-panel'
  if (row.kind === 'stub') {
    return (
      <li className="relative" aria-hidden="true" style={style} {...flags}>
        <span
          style={{ insetInline: 12, top: -4, height: 36, padding: '0 12px', opacity: 0, transform: 'translateY(80px) rotate(5deg)', animation: ANIM.tear }}
          className="absolute flex items-center border-t border-dashed border-hairStrong bg-panelHi font-mono text-label text-ink2"
        >
          {stubWords(row.decision)}
        </span>
      </li>
    )
  }
  if (row.kind === 'perf') {
    return (
      <li className={cx('relative', paper)} aria-hidden="true" style={style} {...flags}>
        <span className="absolute inset-x-0 top-1/2 border-t border-dashed border-hairStrong" />
      </li>
    )
  }
  const split = row.split || row.kind === 'head'
  const pad = 'px-4'
  return (
    <li aria-hidden={row.folded ? 'true' : undefined} className={cx('relative flex items-center', paper, !raw && pad)} style={{ ...style, borderInline: raw ? undefined : '1px solid var(--c-hair-strong)', paddingBlock: row.kind === 'head' || row.kind === 'note' ? 4 : 6, paddingBottom: row.outcome && !raw ? 14 : undefined }} {...flags}>
      {row.kind === 'sign' ? (
        <Sign row={row} staticMode={staticMode} />
      ) : (
        <div className="relative w-full" style={{ animation: ANIM.ink, ...(split && wide ? { display: 'grid', gridTemplateColumns: '1fr 1fr' } : null) }}>
          {split && wide && <span aria-hidden="true" style={{ top: -8, bottom: -8, left: '50%' }} className="absolute border-l border-dashed border-hair" />}
          {row.cells.map((cell) => (
            <Cell key={cell.id} cell={cell} abort={row.abort} newest={newest} wide={wide} split={split} struck={row.struck} />
          ))}
        </div>
      )}
    </li>
  )
}

export function Tape({ rows, tick, running, staticMode, stacked, raw, wide, label }) {
  const items = stackLayout(rows)
  const newest = rows.filter((r) => r.kind !== 'stub').at(-1)?.key
  return (
    <div className="w-full" style={{ maxWidth: raw ? undefined : '36rem', ...(stacked ? { perspective: 1400, perspectiveOrigin: '50% 40%' } : null) }}>
      <div className="relative" style={stacked ? { transformStyle: 'preserve-3d', transform: 'rotateX(6deg)', transformOrigin: '50% 100%' } : undefined}>
        <ol aria-label={label} className="relative" style={stacked ? { height: DEPTH.visible + ROW_H.line, transformStyle: 'preserve-3d' } : undefined}>
          {stacked && (
            <li aria-hidden="true" data-decor="" className="absolute" style={{ inset: '0 -4px' }}>
              {/* The paper path: two dashed guides the strip runs between, from the slot up to where it fades. */}
              <span style={{ top: 0, bottom: 0 }} className="absolute left-0 border-l border-dashed border-hair" />
              <span style={{ top: 0, bottom: 0 }} className="absolute right-0 border-l border-dashed border-hair" />
            </li>
          )}
          {items.map((item) => (
            <Row key={item.row.key} item={item} newest={item.row.key === newest} stacked={stacked} raw={raw} wide={wide} staticMode={staticMode} />
          ))}
        </ol>
        <div
          className={cx('relative grid gap-2', raw ? 'pt-2' : 'border border-hairStrong bg-void')}
          style={{ ...(raw ? null : { margin: '0 -8px', padding: '26px 24px 14px' }), ...(stacked ? { transform: 'translateZ(10px)' } : null) }}
        >
          <span aria-hidden="true" data-decor="" style={{ insetInline: 8, height: 18, containerType: 'inline-size' }} className="absolute top-0 border border-hairStrong">
            <span className="absolute inset-x-0 top-1/2 border-t border-dotted border-hairStrong" />
            {/* Keyed on the tick: one sweep per printed line, and it rests at the left when the printer stops. */}
            <span key={tick} style={{ left: 2, top: '50%', marginTop: -3, width: 6, height: 6, animation: running ? ANIM.sweep : undefined }} className="absolute bg-signal" />
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <p style={{ marginRight: 'auto' }} className="font-mono text-label uppercase text-ink3">{t.printer.text}</p>
            <Chip kind="pending">{t.tagsPending.text}</Chip>
            <Chip kind="illustrative">{agent.chip.text}</Chip>
          </div>
        </div>
      </div>
    </div>
  )
}
