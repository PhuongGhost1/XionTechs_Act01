import { cx } from './cx.js'

// <Frame ticks>: a 1 px frame; `ticks` adds four 6 px corner ticks. Corner ticks belong to the
// instrument and the screenshot viewer only (doc 5.4), so leave `ticks` off everywhere else.
const TICKS = [
  '-left-px -top-px border-l border-t',
  '-right-px -top-px border-r border-t',
  '-bottom-px -left-px border-b border-l',
  '-bottom-px -right-px border-b border-r',
]

export function Frame({ ticks = false, as = 'div', className, children, ...rest }) {
  const Tag = as
  return (
    <Tag className={cx('relative border border-hairStrong', className)} {...rest}>
      {ticks &&
        TICKS.map((t) => (
          <span
            key={t}
            aria-hidden="true"
            data-decor=""
            className={cx('pointer-events-none absolute h-[6px] w-[6px] border-ink2', t)}
          />
        ))}
      {children}
    </Tag>
  )
}
