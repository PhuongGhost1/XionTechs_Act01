import { useEffect } from 'react'
import Contact from './Contact'
import EngineeringStrip from './EngineeringStrip'
import FAQ from './FAQ'
import HowWeWork from './HowWeWork'
import SelectedWork from './SelectedWork'
import { SECTIONS_READY, takePendingHashTarget } from './sectionsReady'
import WhyUs from './WhyUs'

// Everything below the AI Agents section, in its own chunk so the first screen loads less
// JavaScript (bundle budget). The chunk starts loading as soon as the page renders.
export default function BelowFold() {
  useEffect(() => {
    window.dispatchEvent(new Event(SECTIONS_READY))
    // A link straight to one of these sections arrives before they exist; scroll once they do.
    // Only for the target the browser could not reach on load (see pendingHashTarget).
    const target = takePendingHashTarget()
    if (target) target.scrollIntoView({ block: 'start', behavior: 'instant' }) // a jump, like a normal page load
  }, [])

  return (
    <>
      <SelectedWork />
      <EngineeringStrip />
      <HowWeWork />
      <WhyUs />
      <FAQ />
      <Contact />
    </>
  )
}
