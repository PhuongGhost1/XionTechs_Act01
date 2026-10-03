// Boots the shared runtime once: reduced-motion preference, the data-motion attribute on <html>,
// pointer tracking and the scroll controller.
import { live, motionMode, store } from './store.js'
import { startScrollController } from './scroll.js'

export function startRuntime() {
  const root = document.documentElement
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
  const apply = () => {
    root.dataset.motion = motionMode(store.get())
  }
  const setReduced = () => store.set({ reducedMotion: mq.matches })
  setReduced()
  apply()
  mq.addEventListener('change', setReduced)
  const offMotion = store.subscribe(motionMode, apply)

  const onPointer = (e) => {
    live.pointerX = (e.clientX / window.innerWidth) * 2 - 1
    live.pointerY = (e.clientY / window.innerHeight) * 2 - 1
  }
  window.addEventListener('pointermove', onPointer, { passive: true })

  const stopScroll = startScrollController()
  return () => {
    mq.removeEventListener('change', setReduced)
    window.removeEventListener('pointermove', onPointer)
    offMotion()
    stopScroll()
  }
}
