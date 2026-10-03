import { Bay, Slab } from './Bay.jsx'
import { at, timing } from './timing.js'

/**
 * One level of the section: a button (so hover, focus and a press all do the same) holding the datum on the left,
 * the name and one line of description, and the structural bay. The slab under it and the yellow load-path
 * segment on the rail belong to the same list item, so a row keeps its own height whatever its text does.
 */
export default function LevelRow({ level, row, last, n, hatchId, trace, active, pinned, handlers }) {
  const { onEnter, onLeave, onFocus, onBlur, onToggle } = handlers
  return (
    <li
      className="arch-row"
      data-active={active ? 'true' : 'false'}
      data-lit={trace.lit ? 'true' : 'false'}
      data-pinned={pinned ? 'true' : 'false'}
      style={{ '--td': `${trace.delay}ms` }}
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
    >
      <button type="button" className="arch-hit" aria-pressed={pinned} onFocus={onFocus} onBlur={onBlur} onClick={onToggle}>
        <span className="arch-datum">
          <span aria-hidden="true" className="arch-level-line" style={at(timing.slab(row))} />
          <span aria-hidden="true" className="arch-node" />
          <span aria-hidden="true" className="arch-tri bp-fade" style={at(timing.slab(row) + 300)} />
          <span className="arch-code bp-mono bp-fade" style={at(timing.slab(row) + 300)}>
            {level.code}
          </span>
        </span>
        <span className="arch-text">
          <span className="arch-name bp-h3 bp-rise" style={at(timing.text(row))}>
            {level.label}
          </span>
          <span className="arch-desc bp-rise" style={at(timing.text(row) + 80)}>
            {level.desc}
          </span>
        </span>
        <span className="arch-bay-cell" aria-hidden="true">
          <Bay levelId={level.id} n={n} row={row} />
        </span>
      </button>
      <Slab hatchId={hatchId} row={row} deep={last} />
      <span aria-hidden="true" className="arch-trace" />
    </li>
  )
}
