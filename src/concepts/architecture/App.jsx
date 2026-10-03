import { Suspense, lazy, useEffect, useState } from 'react'
import Header from './chrome/Header.jsx'
import DatumRail from './chrome/DatumRail.jsx'
import Hero from './hero/Hero.jsx'
import { ui } from './content.js'

// Sheet 01 is the first screen and ships in the main chunk. Sheets 02-07 are one lazy chunk (BelowFold) that
// starts loading when the browser is idle, on the first scroll, or at once for a deep link to a lower sheet.
const BelowFold = lazy(() => import('./BelowFold.jsx'))

const Pending = () => <div aria-hidden="true" style={{ minHeight: '120vh' }} />

function useBelowFoldGate() {
  const [open, setOpen] = useState(() => typeof window !== 'undefined' && window.location.hash.length > 1 && window.location.hash !== '#top')
  useEffect(() => {
    if (open) return undefined
    const go = () => setOpen(true)
    const idle = 'requestIdleCallback' in window ? window.requestIdleCallback(go, { timeout: 1500 }) : window.setTimeout(go, 800)
    window.addEventListener('scroll', go, { once: true, passive: true })
    return () => {
      window.removeEventListener('scroll', go)
      if ('cancelIdleCallback' in window) window.cancelIdleCallback(idle)
      else window.clearTimeout(idle)
    }
  }, [open])
  return open
}

export default function App() {
  const below = useBelowFoldGate()
  return (
    <>
      <a
        href="#main"
        className="bp-mono fixed left-3 top-3 z-[80] -translate-y-20 bg-bp-line px-3 py-2 text-bp-bg focus:translate-y-0"
      >
        {ui.skip}
      </a>
      <Header />
      <DatumRail />
      <main id="main">
        <Hero />
        {below ? (
          <Suspense fallback={<Pending />}>
            <BelowFold />
          </Suspense>
        ) : (
          <Pending />
        )}
      </main>
    </>
  )
}
