import { lazy, Suspense, useEffect, useState } from 'react'
import { ATTR, setTier } from './contract/attributes.js'
import Dock from './frame/Dock.jsx'
import Header from './frame/Header.jsx'
import MobileBar from './frame/MobileBar.jsx'
import SignalLine from './frame/SignalLine.jsx'
import SkipLink from './frame/SkipLink.jsx'
import { detectTier, readEnvironment } from './runtime/capability.js'
import { startFlowWatcher } from './runtime/flow.js'
import { useHtmlAttribute, useReducedMotion } from './runtime/hooks.js'
import { startScroll } from './runtime/scroll.js'
import Deploy from './sections/Deploy/index.jsx'
import Done from './sections/Done/index.jsx'
import Ledger from './sections/Ledger/index.jsx'
import Line from './sections/Line/index.jsx'
import OnFile from './sections/OnFile/index.jsx'
import Premise from './sections/Premise/index.jsx'
import Standby from './sections/Standby/index.jsx'

// Composition root of Concept 01 v2. Everything visual lives in frame/ and sections/; this file
// only wires the page: the seven stations in order inside <main>, the fixed frame around them,
// the scroll controller, the flow watcher, the capability tier and the lazy WebGL canvas.
//
// Both lazy chunks stay out of the entry bundle: the canvas (WP2 grows it to the three.js scene,
// at most 180 kB gzip) and the token story (?tokens, a review page owned by WP0).

const CoreCanvas = lazy(() => import('./core/CoreCanvas.jsx'))
const TokenStory = lazy(() => import('./TokenStory.jsx'))

function Page() {
  const [tier, setTierState] = useState('off')
  const [canvasReady, setCanvasReady] = useState(false)
  // The tier depends on these two, so a toggle re-evaluates it.
  const view = useHtmlAttribute(ATTR.view)
  const motionOff = useReducedMotion()

  // One scroll controller and one flow watcher for the page's lifetime.
  useEffect(() => {
    const stopScroll = startScroll()
    const stopFlow = startFlowWatcher()
    return () => {
      stopScroll()
      stopFlow()
    }
  }, [])

  // Pick the tier from the real device, write data-tier, and re-pick when the view or motion changes.
  useEffect(() => {
    const next = detectTier(readEnvironment())
    setTier(next)
    setTierState(next)
  }, [view, motionOff])

  // The canvas boots after first paint and idle (doc 6.3), and only when a tier allows it.
  useEffect(() => {
    if (tier === 'off') {
      setCanvasReady(false)
      return undefined
    }
    const idle = window.requestIdleCallback ?? ((fn) => window.setTimeout(fn, 200))
    const cancel = window.cancelIdleCallback ?? window.clearTimeout
    const handle = idle(() => setCanvasReady(true))
    return () => cancel(handle)
  }, [tier])

  return (
    <>
      <SkipLink />
      <Header />
      <SignalLine />
      {/* The one background: a static dot grid, full bleed (doc 5.4). */}
      <div aria-hidden="true" data-decor="" className="bg-dots pointer-events-none fixed inset-0" />
      <main id="main" tabIndex={-1} className="relative pb-dock pt-header outline-none">
        <Standby />
        <Premise />
        <Deploy />
        <Line />
        <OnFile />
        <Ledger />
        <Done />
      </main>
      <MobileBar />
      <Dock />
      {canvasReady && tier !== 'off' && (
        <Suspense fallback={null}>
          <CoreCanvas tier={tier} />
        </Suspense>
      )}
    </>
  )
}

export default function App() {
  if (typeof location !== 'undefined' && new URLSearchParams(location.search).has('tokens')) {
    return (
      <Suspense fallback={null}>
        <TokenStory />
      </Suspense>
    )
  }
  return <Page />
}
