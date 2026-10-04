import Header from './chrome/Header.jsx'
import Footer from './chrome/Footer.jsx'
import Hero from './hero/Hero.jsx'
import Deploy from './deploy/Deploy.jsx'
import Pipeline from './pipeline/Pipeline.jsx'
import Work from './work/Work.jsx'
import Agent from './agent/Agent.jsx'
import Signals from './signals/Signals.jsx'
import Finale from './finale/Finale.jsx'

// Section order is the narrative (docs/concepts/01-command-v2-plan.md §3): boot the system, see what it
// can do, watch a request become production, inspect real deployments, read the evidence, close.
export default function App() {
  return (
    <>
      <a
        href="#main"
        className="x-mono fixed left-3 top-3 z-[60] -translate-y-20 bg-x-signal px-3 py-2 text-x-ink focus:translate-y-0"
      >
        Skip to content
      </a>
      <Header />
      <main id="main">
        <Hero />
        <Deploy />
        <Pipeline />
        <Work />
        <Agent />
        <Signals />
        <Finale />
      </main>
      <Footer />
    </>
  )
}
