import { Chip } from './Chip.jsx'
import { cx } from './cx.js'
import { isPendingValue } from './kinds.js'

// <SpecRow label="STACK" value={...} />: a dot-leader row of a spec sheet (doc 5.9):
//   STACK ........ PENDING
// Goes inside a <dl>. `label` is a string or a content wrapper. `value` is a string, a content
// wrapper, a React node, or the structured pending value { pending: true, label }, which is
// ALWAYS drawn as a dashed PENDING chip (never as plain text). A wrapper with `muted` (RESULTS:
// NOT PUBLISHED) is drawn as a muted dashed line. `stack` puts a long value under its label.

const textOf = (v) => (v !== null && typeof v === 'object' && typeof v.text === 'string' ? v.text : v)

function renderValue(value) {
  if (isPendingValue(value)) return <Chip kind="pending">{value.label}</Chip>
  if (value !== null && typeof value === 'object' && value.muted === true) {
    return <span className="border-b border-dashed border-hairStrong text-ink3">{value.text}</span>
  }
  return textOf(value)
}

export function SpecRow({ label, value, stack = false, className }) {
  return (
    <div className={cx('font-mono text-data', stack ? 'flex flex-col gap-1' : 'flex items-baseline gap-3', className)}>
      <dt className={cx('flex items-baseline gap-3 text-label uppercase text-ink3', !stack && 'min-w-0 flex-1')}>
        <span className="shrink-0">{textOf(label)}</span>
        {!stack && (
          <span aria-hidden="true" data-leader="" className="min-w-4 flex-1 border-b border-dotted border-hairStrong" />
        )}
      </dt>
      <dd className={cx('m-0 text-ink', !stack && 'max-w-[62%] text-right')}>{renderValue(value)}</dd>
    </div>
  )
}
