import { lazy, Suspense, useEffect, useState } from 'react'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import Nav from './Nav'
import BuildHud from './BuildHud'
import Hero from './Hero'
import Modules from './Modules'
import Process from './Process'
import Deployments from './Deployments'
import Signals from './Signals'
import FinalCta from './FinalCta'
import Footer from './Footer'
import { detectQuality, readEnvironment, sceneState } from './scene/store'

// The WebGL data core is an enhancement: it loads after the first screen has painted, only when
// the device and the visitor's motion settings allow it. Every section carries its own static
// visual, so the page looks finished without it (docs/concepts/01-command-implementation.md §5).
// If the chunk cannot load (offline, a blocked request), the canvas is simply absent. Without the catch a
// rejected import would unmount the whole page.
const XCoreCanvas = lazy(() => import('./scene/XCoreCanvas').catch(() => ({ default: () => null })))

export default function CommandApp() {
  const reducedMotion = useReducedMotion()
  const [quality, setQuality] = useState('pending')

  // Decide once the first screen exists, and again if the visitor changes their motion setting.
  useEffect(() => {
    const decide = () => {
      const next = detectQuality(readEnvironment())
      sceneState.quality = next
      setQuality(next)
    }
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(decide, { timeout: 1200 })
      return () => window.cancelIdleCallback(id)
    }
    const id = window.setTimeout(decide, 400)
    return () => window.clearTimeout(id)
  }, [reducedMotion])

  // The page is drawn by script, after the browser has already tried to scroll to a #fragment and found
  // nothing there: do it once the sections exist. Reloads and back/forward keep their own scroll position.
  useEffect(() => {
    const type = performance.getEntriesByType?.('navigation')[0]?.type
    if (type === 'reload' || type === 'back_forward') return
    let id = window.location.hash.slice(1)
    try {
      id = decodeURIComponent(id)
    } catch {
      // a malformed escape such as "#100%": use it as written
    }
    if (id) document.getElementById(id)?.scrollIntoView({ block: 'start', behavior: 'instant' })
  }, [])

  const showCore = quality === 'high' || quality === 'low'

  return (
    <div className="cmd-root relative isolate min-h-screen bg-cmd-bg text-cmd-text">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:bg-cmd-signal focus:px-4 focus:py-2 focus:font-cmd-mono focus:text-xs focus:uppercase focus:tracking-widest focus:text-cmd-signal-ink"
      >
        Skip to content
      </a>
      <Nav />
      {showCore && (
        <Suspense fallback={null}>
          <XCoreCanvas quality={quality} />
        </Suspense>
      )}
      <BuildHud />
      {/* Sections are transparent (the fixed canvas shows through) except `signals`, the one
          opaque paper band, which covers it. */}
      <main id="main" className="relative z-10">
        <Hero />
        <Modules />
        <Process />
        <Deployments />
        <Signals />
        <FinalCta />
      </main>
      <Footer />
    </div>
  )
}
