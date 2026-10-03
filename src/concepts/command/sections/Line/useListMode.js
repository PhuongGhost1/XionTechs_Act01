import { useSyncExternalStore } from 'react'
import { ATTR } from '../../contract/attributes.js'
import { useHtmlAttribute, useReducedMotion } from '../../runtime/hooks.js'

// When THE LINE is a plain ordered list instead of a pinned stage (doc 4.5 fallback). The three
// reasons are independent of the WebGL tier on purpose:
//   reduced motion   the MOTION toggle is off, or the OS asks for reduced motion
//   RAW              the READ | RAW view is RAW
//   short landscape  a landscape phone under 500 px high (also under 380 px high in any
//                    orientation) has no room for a pinned stage; base.css un-pins it too
const SHORT_VIEWPORT = '(max-height: 499px) and (orientation: landscape), (max-height: 379px)'

const query = () => (typeof matchMedia === 'function' ? matchMedia(SHORT_VIEWPORT) : null)

function subscribeShort(callback) {
  const mq = query()
  mq?.addEventListener('change', callback)
  return () => mq?.removeEventListener('change', callback)
}

const readShort = () => Boolean(query()?.matches)

export function useListMode() {
  const reduced = useReducedMotion()
  const raw = useHtmlAttribute(ATTR.view) === 'raw'
  const short = useSyncExternalStore(subscribeShort, readShort, () => false)
  return reduced || raw || short
}
