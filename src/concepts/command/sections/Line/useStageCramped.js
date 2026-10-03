import { useEffect, useLayoutEffect, useState } from 'react'
import { process as line } from '../../content/index.js'
import { anyOverlap, fitKey, overflowsBox, watchLayout } from '../../runtime/fit.js'

// Does the pinned stage of THE LINE hold its content? With enlarged text (200 percent on a phone)
// the giant word is wider than the column, the six stop labels run into each other and the
// sentence is taller than the stage; the stage clips (overflow: clip), so words are cut or overlap.
// In that case the section shows its plain list instead (the same fallback as reduced motion,
// RAW and landscape phones: doc 4.5), which reflows with any text size.
//
// The pure decisions are in runtime/fit.js (overflowsBox, anyOverlap). This file only gathers
// the rectangles. A layout effect, so a stage that does not fit is never painted.

const LONGEST_LABEL = line.steps.reduce((a, s) => (s.label.length > a.length ? s.label : a), '')

/** True when the stage mounted in `section` clips or overlaps its content. */
export function stageIsCramped(section) {
  const stage = section.querySelector('.line-stage')
  if (!stage) return false
  const box = stage.getBoundingClientRect()
  const rects = (selector) => [...stage.querySelectorAll(selector)].map((el) => el.getBoundingClientRect())

  // Taller or wider than the stage.
  if (overflowsBox(box, rects('h2, .line-word, p, button, [data-stop-label]'))) return true

  // The stop labels must not run into each other.
  if (anyOverlap(rects('[data-stop-label]'))) return true

  // The giant word must not climb over the section label (a short window: line.css also caps the
  // word by the window height, this is the net under it).
  const word = stage.querySelector('.line-word')
  const label = stage.querySelector('h2')
  if (label && word && anyOverlap([label.getBoundingClientRect(), word.getBoundingClientRect()])) return true

  // The longest step word must fit its line (the one on screen may be a short one).
  if (word) {
    const probe = document.createElement('span')
    probe.textContent = LONGEST_LABEL
    probe.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;grid-area:auto'
    word.appendChild(probe)
    const needed = probe.getBoundingClientRect().width
    probe.remove()
    if (needed > word.clientWidth + 1) return true
  }
  return false
}

const useBeforePaint = typeof window === 'undefined' ? useEffect : useLayoutEffect

/**
 * `active` is true while the section would show the pinned stage. Returns true when it should show
 * the list instead. Once cramped the stage is gone and cannot be measured, so the question is asked
 * again only when the window or the text size changed (fitKey).
 */
export function useStageCramped(sectionRef, active, step) {
  const [cramped, setCramped] = useState(false)

  useBeforePaint(() => {
    const section = sectionRef.current
    if (!active || !section) {
      setCramped(false)
      return undefined
    }
    if (cramped) {
      const key = fitKey()
      const retry = () => {
        if (fitKey() !== key) setCramped(false)
      }
      window.addEventListener('resize', retry)
      window.addEventListener('orientationchange', retry)
      return () => {
        window.removeEventListener('resize', retry)
        window.removeEventListener('orientationchange', retry)
      }
    }
    return watchLayout(() => {
      if (stageIsCramped(section)) setCramped(true)
    })
  }, [sectionRef, active, cramped, step])

  return active && cramped
}
