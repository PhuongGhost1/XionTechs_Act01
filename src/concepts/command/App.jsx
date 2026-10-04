import { Component, lazy, Suspense, useEffect, useState } from 'react'
import { ATTR } from './contract/attributes.js'
import Dock from './frame/Dock.jsx'
import Hairlines from './frame/Hairlines.jsx'
import Header from './frame/Header.jsx'
import MobileBar from './frame/MobileBar.jsx'
import SignalLine from './frame/SignalLine.jsx'
import SkipLink from './frame/SkipLink.jsx'
import { startAmbient } from './runtime/ambient.js'
import { startFlowWatcher } from './runtime/flow.js'
import { useHtmlAttribute } from './runtime/hooks.js'
import { startScroll } from './runtime/scroll.js'
import { markChunkFailed, startTier } from './runtime/tier.js'
import Deploy from './sections/Deploy/index.jsx'
import Done from './sections/Done/index.jsx'
import { Footer } from './sections/Done/Footer.jsx'
import Ledger from './sections/Ledger/index.jsx'
import Line from './sections/Line/index.jsx'
import OnFile from './sections/OnFile/index.jsx'
import Premise from './sections/Premise/index.jsx'
import Standby from './sections/Standby/index.jsx'

// Composition root of Concept 01 v2. Everything visual lives in frame/ and sections/; this file
// only wires the page: the eight stations in order inside <main>, the fixed frame around them,
// and the runtime (scroll controller, flow watcher, ambient pauser, tier control).
//
// Tier (doc 6.2) is decided by runtime/tier.js and read back here from <html data-tier>, the
// single source of truth: the capability probe, the MOTION toggle, RAW, the OS reduced-motion
// setting and the FPS governor (which the canvas starts and which can only lower the tier) all
// end up in that one attribute. The lazy canvas mounts only when it is not "off", after first
// paint and an idle moment, and unmounts the moment it becomes "off" (RAW, MOTION off, a lost
// context, a governor drop). If its chunk fails to load the page stays on the SVG tier.
//
// The lazy chunks stay out of the entry bundle: the canvas (WP2 grows it to the three.js scene,
// at most 180 kB gzip), the token story (?tokens, a review page owned by WP0) and the AGENT RUN
// station (the printer tape and its ported run logic: 02-agent-demo-notes.md). The station loads once
// the browser is idle after first paint; until then a placeholder of the same id and height holds its
// place in the page, so anchors and the scroll length do not move when it arrives.

const loadAgent = () => import('./sections/Agent/index.jsx')
const Agent = lazy(loadAgent)
const CoreCanvas = lazy(() => import('./core/CoreCanvas.jsx'))
const TokenStory = lazy(() => import('./TokenStory.jsx'))

// A failed chunk (offline, a stale deploy) must not blank the page: remember it and render nothing.
class CanvasBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch() {
    markChunkFailed()
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}

/** Calls `fn` once the browser is idle (or after 200 ms where it has no idle callback). */
function whenIdle(fn) {
  if (typeof window.requestIdleCallback === 'function') {
    const id = window.requestIdleCallback(fn, { timeout: 2000 })
    return () => window.cancelIdleCallback(id)
  }
  const id = window.setTimeout(fn, 200)
  return () => window.clearTimeout(id)
}

/** Holds the place of #agent until its chunk arrives (same id, same pinned height on wide screens). */
function AgentPlaceholder() {
  return <section id="agent" aria-hidden="true" className="track" style={{ minHeight: 'var(--track-agent)' }} />
}

function Page() {
  const tier = useHtmlAttribute(ATTR.tier)
  const [idle, setIdle] = useState(false)

  // The runtime lives as long as the page. Each start is idempotent and StrictMode safe.
  useEffect(() => {
    const stops = [startScroll(), startFlowWatcher(), startAmbient(), startTier()]
    const cancelIdle = whenIdle(() => {
      setIdle(true)
      loadAgent()
    })
    return () => {
      cancelIdle()
      stops.forEach((stop) => stop())
    }
  }, [])

  const showCanvas = idle && (tier === 'low' || tier === 'high')

  return (
    <>
      <SkipLink />
      <Header />
      <SignalLine />
      {/* The one background: a static dot grid, full bleed (doc 5.4), and the constant hairline pair. */}
      <div aria-hidden="true" data-decor="" className="bg-dots pointer-events-none fixed inset-0" />
      <Hairlines />
      <main id="main" tabIndex={-1} className="relative pt-header outline-none">
        <Standby />
        <Premise />
        <Deploy />
        <Line />
        <OnFile />
        <Suspense fallback={<AgentPlaceholder />}>
          <Agent />
        </Suspense>
        <Ledger />
        <Done />
      </main>
      {/* Outside <main> so it is the page's contentinfo landmark. It carries the end-of-page room
          for the fixed dock itself (and the phone bar hides while it is on screen), so nothing is
          reserved after it. */}
      <Footer />
      <MobileBar />
      <Dock />
      {showCanvas && (
        <CanvasBoundary>
          <Suspense fallback={null}>
            <CoreCanvas tier={tier} />
          </Suspense>
        </CanvasBoundary>
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
