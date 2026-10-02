import { lazy, Suspense } from 'react'
import Nav from './components/Nav'
import Hero from './components/Hero'
import Solutions from './components/Solutions'
import AiAgents from './components/AiAgents'
import Footer from './components/Footer'
import SectionErrorBoundary from './components/SectionErrorBoundary'

// Selected Work through Contact load as one chunk right after the first screen (BelowFold.jsx).
const BelowFold = lazy(() => import('./components/BelowFold'))

// Section order and light/dark rhythm follow the redesign plan v3 (§1, §17).
export default function App() {
  return (
    <div className="min-h-screen">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primaryInk"
      >
        Skip to content
      </a>
      <Nav />
      <main id="main">
        <Hero />
        <Solutions />
        <AiAgents />
        <SectionErrorBoundary message="This part of the page couldn’t load. Reload the page to try again.">
          <Suspense fallback={<div aria-busy="true" className="min-h-screen" />}>
            <BelowFold />
          </Suspense>
        </SectionErrorBoundary>
      </main>
      <Footer />
    </div>
  )
}
