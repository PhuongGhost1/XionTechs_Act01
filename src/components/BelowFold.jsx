import { useEffect } from 'react'
import Contact from './Contact'
import EngineeringStrip from './EngineeringStrip'
import FAQ from './FAQ'
import HowWeWork from './HowWeWork'
import SelectedWork from './SelectedWork'
import { SECTIONS_READY } from './sectionsReady'
import WhyUs from './WhyUs'

// Everything below the AI Agents section, in its own chunk so the first screen loads less
// JavaScript (bundle budget). The chunk starts loading as soon as the page renders.
export default function BelowFold() {
  useEffect(() => {
    window.dispatchEvent(new Event(SECTIONS_READY))
    // A link straight to one of these sections arrives before they exist; scroll once they do.
    const id = decodeURIComponent(window.location.hash.slice(1))
    const target = id && document.getElementById(id)
    if (target) target.scrollIntoView({ block: 'start' })
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
