import Nav from './components/Nav'
import Hero from './components/Hero'
import Pillars from './components/Pillars'
import AgentDemo from './components/AgentDemo'
import WhyUs from './components/WhyUs'
import Roadmap from './components/Roadmap'
import CaseStudies from './components/CaseStudies'
import Testimonials from './components/Testimonials'
import FAQ from './components/FAQ'
import Contact from './components/Contact'
import Footer from './components/Footer'

export default function App() {
  return (
    <div className="min-h-screen">
      <Nav />
      <main>
        <Hero />
        <Pillars />
        <AgentDemo />
        <WhyUs />
        <Roadmap />
        <CaseStudies />
        <Testimonials />
        <FAQ />
        <Contact />
      </main>
      <Footer />
    </div>
  )
}
