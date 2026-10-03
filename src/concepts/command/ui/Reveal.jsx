import { useInView, useReducedMotion } from '../runtime/hooks.js'

// <Reveal as="div" delay={90}>: content rises 12 px and fades in once, when it scrolls into view
// (motion.css [data-reveal]). It is visible without JavaScript (no script, no hidden state),
// under reduced motion and with the MOTION toggle off, where it shows its final state at once.
// `delay` is in ms, for staggering.
export function Reveal({ as = 'div', delay = 0, className, style, children, ...rest }) {
  const Tag = as
  const [ref, inView] = useInView({ once: true, rootMargin: '0px 0px -8% 0px' })
  const motionOff = useReducedMotion()
  return (
    <Tag
      ref={ref}
      data-reveal={inView || motionOff ? 'in' : 'out'}
      className={className}
      style={delay ? { ...style, '--delay': `${delay}ms` } : style}
      {...rest}
    >
      {children}
    </Tag>
  )
}
