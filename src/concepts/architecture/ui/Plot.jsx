import { useRef } from 'react'
import { useInView } from '../hooks/hooks.js'

/**
 * A sub-region that plots itself when it enters the viewport, independent of its sheet: use it for the
 * second and third project of a long sheet, or for one band of a list. Same `data-in` contract as `Sheet`.
 */
export default function Plot({ as = 'div', className = '', rootMargin = '0px 0px -12% 0px', children, ...rest }) {
  const Tag = as
  const ref = useRef(null)
  const inView = useInView(ref, { rootMargin })
  return (
    <Tag ref={ref} data-in={inView ? 'true' : 'false'} className={className} {...rest}>
      {children}
    </Tag>
  )
}
