import { cx } from './cx.js'

// <KeyValue label="BUILD" value="a1b2c3d" /> : a mono key and its value on one line, no dot
// leader (SpecRow has those). Goes inside a <dl>. Values are real text, so RAW shows them as is.
export function KeyValue({ label, value, className }) {
  return (
    <div className={cx('flex flex-wrap items-baseline gap-x-3 font-mono text-data', className)}>
      <dt className="text-label uppercase text-ink3">{label}</dt>
      <dd className="m-0 text-ink">{value}</dd>
    </div>
  )
}
