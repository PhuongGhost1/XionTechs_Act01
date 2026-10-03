import { cx } from './cx.js'

// <Button variant="primary|ghost" arrow="right|down" href flow>: a system command (doc 4.9, M15).
// 48 px high, 0 radius, mono caps. Renders <a> when `href` is given, otherwise <button type=button>.
//   primary  yellow fill, navy text. One per viewport.
//   ghost    1 px outline, white text.
//   arrow    a drawn arrow whose stem extends on hover and focus (160 ms, transform only).
//   flow     adds data-flow: hovering or focusing it raises the core's data flow (runtime/flow.js).
// The label is the child; arrows are drawn, never typed (the font has no arrow glyphs in range).

function Arrow({ direction }) {
  const head = (
    <svg
      aria-hidden="true"
      viewBox="0 0 6 10"
      className={cx(
        'absolute h-[10px] w-[6px]',
        direction === 'down' ? 'bottom-0 left-1/2 -translate-x-1/2 rotate-90' : 'right-0 top-0',
      )}
    >
      <path d="M1 1L5 5L1 9" fill="none" stroke="currentColor" strokeWidth="1" />
    </svg>
  )
  if (direction === 'down') {
    return (
      <span aria-hidden="true" className="relative block h-[22px] w-[10px] shrink-0">
        <span className="absolute left-1/2 top-0 h-full w-px origin-top -translate-x-1/2 scale-y-[0.6] bg-current transition-transform duration-ui ease-ui group-hover:scale-y-100 group-focus-visible:scale-y-100 motion-off:transition-none" />
        {head}
      </span>
    )
  }
  return (
    <span aria-hidden="true" className="relative block h-[10px] w-14 shrink-0">
      <span className="absolute right-[1px] top-1/2 h-px w-full origin-right -translate-y-1/2 scale-x-[0.43] bg-current transition-transform duration-ui ease-ui group-hover:scale-x-100 group-focus-visible:scale-x-100 motion-off:transition-none" />
      {head}
    </span>
  )
}

const LOOK = {
  primary: 'bg-signal text-onSignal',
  ghost: 'border border-hairStrong text-ink hover:bg-panel focus-visible:bg-panel',
}

export function Button({ variant = 'primary', arrow, href, flow = false, className, children, ...rest }) {
  const Tag = href ? 'a' : 'button'
  const tagProps = href ? { href } : { type: 'button' }
  return (
    <Tag
      {...tagProps}
      data-fill={variant === 'primary' ? 'signal' : undefined}
      data-flow={flow ? '' : undefined}
      className={cx(
        'group inline-flex h-12 items-center gap-3 rounded-none px-6 font-mono text-label font-medium uppercase',
        'transition-colors duration-ui ease-ui motion-off:transition-none',
        LOOK[variant] ?? LOOK.primary,
        className,
      )}
      {...rest}
    >
      <span>{children}</span>
      {arrow && <Arrow direction={arrow === 'down' ? 'down' : 'right'} />}
    </Tag>
  )
}
