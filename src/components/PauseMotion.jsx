import { useSyncExternalStore } from 'react'
import { Pause, Play } from 'lucide-react'
import { sceneState, setPaused, subscribe } from './scene/store'

// Pause Motion (WCAG 2.2.2): stops the data core and every ambient loop. It lives in the header so it
// is the first control a keyboard visitor meets after the links, and never sits over page content.
// NEEDS content.js: its labels. The name changes with the state, so there is no aria-pressed.
const PAUSE_LABEL = 'Pause Motion'
const PLAY_LABEL = 'Play Motion'

const getPaused = () => sceneState.paused

export default function PauseMotion({ className = '' }) {
  const paused = useSyncExternalStore(subscribe, getPaused, () => false)
  return (
    <button
      type="button"
      data-paused={paused}
      onClick={() => setPaused(!paused)}
      className={`cmd-pause cmd-label flex h-11 min-w-11 items-center justify-center gap-2 border border-transparent px-2.5 text-cmd-muted transition-colors duration-micro ease-cmd hover:border-cmd-line hover:text-cmd-text data-[paused=true]:text-cmd-signal-fg lg:h-10 ${className}`}
    >
      {paused ? <Play aria-hidden="true" className="h-3.5 w-3.5" /> : <Pause aria-hidden="true" className="h-3.5 w-3.5" />}
      <span className="sr-only xl:not-sr-only">{paused ? PLAY_LABEL : PAUSE_LABEL}</span>
    </button>
  )
}
