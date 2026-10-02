import Nav from './components/Nav'
import Hero from './components/Hero'
import Solutions from './components/Solutions'
import AiAgents from './components/AiAgents'
import SelectedWork from './components/SelectedWork'
import EngineeringStrip from './components/EngineeringStrip'
import HowWeWork from './components/HowWeWork'
import WhyUs from './components/WhyUs'
import FAQ from './components/FAQ'
import Contact from './components/Contact'
import Footer from './components/Footer'

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
        <SelectedWork />
        <EngineeringStrip />
        <HowWeWork />
        <WhyUs />
        <FAQ />
        <Contact />
      </main>
      <Footer />
    </div>
  )
}
