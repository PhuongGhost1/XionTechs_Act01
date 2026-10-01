import { lazy, Suspense } from 'react'
import Nav from './components/Nav'
import Hero from './components/Hero'
import Pillars from './components/Pillars'
import AzureStrip from './components/AzureStrip'
import WhyUs from './components/WhyUs'
import Roadmap from './components/Roadmap'
import CaseStudies from './components/CaseStudies'
import FAQ from './components/FAQ'
import Contact from './components/Contact'
import Footer from './components/Footer'

const AgentDemo = lazy(() => import('./components/AgentDemo'))

// Testimonials.jsx is intentionally not rendered: the `testimonials` array is empty until
// the team supplies real client quotes (see content/TODO.md).
export default function App() {
  return (
    <div className="min-h-screen">
      <Nav />
      <main>
        <Hero />
        <Pillars />
        <AzureStrip />
        <Suspense fallback={<section id="demo" aria-busy="true" className="mx-auto min-h-[60vh] max-w-6xl px-6 py-20" />}>
          <AgentDemo />
        </Suspense>
        <WhyUs />
        <Roadmap />
        <CaseStudies />
        <FAQ />
        <Contact />
      </main>
      <Footer />
    </div>
  )
}
