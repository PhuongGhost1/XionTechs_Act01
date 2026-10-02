import { lazy, Suspense } from 'react'
import Nav from './components/Nav'
import Hero from './components/Hero'
import Solutions from './components/Solutions'
import AzureStrip from './components/AzureStrip'
import WhyUs from './components/WhyUs'
import Roadmap from './components/Roadmap'
import Projects from './components/Projects'
import CaseStudies from './components/CaseStudies'
import FAQ from './components/FAQ'
import Contact from './components/Contact'
import Footer from './components/Footer'
import SectionErrorBoundary from './components/SectionErrorBoundary'
import { loadAgentDemo } from './components/agentDemoLoader'

const AgentDemo = lazy(loadAgentDemo)

// Testimonials.jsx is intentionally not rendered: the `testimonials` array is empty until
// the team supplies real client quotes (see content/TODO.md).
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
        <AzureStrip />
        <SectionErrorBoundary>
          <Suspense fallback={<section id="demo" aria-busy="true" className="mx-auto min-h-[60vh] max-w-6xl px-6 py-20" />}>
            <AgentDemo />
          </Suspense>
        </SectionErrorBoundary>
        <WhyUs />
        <Roadmap />
        <Projects />
        <CaseStudies />
        <FAQ />
        <Contact />
      </main>
      <Footer />
    </div>
  )
}
