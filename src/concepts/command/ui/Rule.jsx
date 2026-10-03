import { cx } from './cx.js'

// <Rule /> is a 1 px hairline instead of a card (doc 5.4). `dashed` is the pending look,
// `strong` the frame weight, `vertical` a column divider inside a flex row.
export function Rule({ dashed = false, strong = false, vertical = false, className }) {
  const tone = strong ? 'border-hairStrong' : 'border-hair'
  return (
    <hr
      className={cx(
        'm-0 border-0',
        vertical ? 'w-0 self-stretch border-l' : 'h-0 w-full border-t',
        dashed && 'border-dashed',
        tone,
        className,
      )}
    />
  )
}
