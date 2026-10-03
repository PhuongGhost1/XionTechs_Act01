import { cx } from './cx.js'

// <Label>text</Label>: mono 12 px caps in ink-3, one label per block. `as` picks the element
// (p by default; use span inline, dt or legend where the markup asks for it).
export function Label({ as = 'p', className, children, ...rest }) {
  const Tag = as
  return (
    <Tag className={cx('font-mono text-label font-normal uppercase text-ink3', className)} {...rest}>
      {children}
    </Tag>
  )
}
