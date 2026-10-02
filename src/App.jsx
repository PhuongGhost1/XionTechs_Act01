import Nav from './components/Nav'
import Hero from './components/Hero'
import Solutions from './components/Solutions'
import AzureStrip from './components/AzureStrip'
import WhyUs from './components/WhyUs'
import Roadmap from './components/Roadmap'
import SelectedWork from './components/SelectedWork'
import FAQ from './components/FAQ'
import Contact from './components/Contact'
import Footer from './components/Footer'
import AiAgents from './components/AiAgents'

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
        <AiAgents />
        <SelectedWork />
        <AzureStrip />
        <Roadmap />
        <WhyUs />
        <FAQ />
        <Contact />
      </main>
      <Footer />
    </div>
  )
}
