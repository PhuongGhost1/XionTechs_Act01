import { cx } from './cx.js'

// <FullStop /> is the yellow square that ends a headline (doc 4.2). It scales with the type
// around it (em units). `caret` makes it blink: only the hero's full stop may do that.
export function FullStop({ caret = false, className }) {
  return (
    <span
      aria-hidden="true"
      data-fullstop=""
      className={cx('inline-block bg-signal', caret && 'anim-caret', className)}
      style={{ width: '0.16em', height: '0.16em', marginInlineStart: '0.05em' }}
    />
  )
}
