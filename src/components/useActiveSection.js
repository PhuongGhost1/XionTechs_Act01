import { useSyncExternalStore } from 'react'
import { SECTION_IDS, sceneState, subscribe } from './scene/store'

// The id of the section BuildHud currently reports as active. Re-renders only when it changes.
export function useActiveSection() {
  return useSyncExternalStore(
    subscribe,
    () => sceneState.section,
    () => SECTION_IDS[0],
  )
}
