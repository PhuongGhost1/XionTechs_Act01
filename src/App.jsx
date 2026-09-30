import Nav from './components/Nav'
import Hero from './components/Hero'
import Pillars from './components/Pillars'
import WhoWeAre from './components/WhoWeAre'
import About from './components/About'
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
        <WhoWeAre />
        <About />
        <CaseStudies />
        <Testimonials />
        <FAQ />
        <Contact />
      </main>
      <Footer />
    </div>
  )
}
