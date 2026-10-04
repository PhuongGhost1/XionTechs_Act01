import { useEffect } from 'react'
import Feature from './feature/Feature.jsx'
import Story from './story/Story.jsx'
import CapabilityIndex from './index/CapabilityIndex.jsx'
import Dispatches from './dispatches/Dispatches.jsx'
import Contributors from './contributors/Contributors.jsx'
import Signoff from './signoff/Signoff.jsx'

// Everything below the manifesto loads as one lazy chunk.
export default function BelowFold() {
  // A `#fragment` that targets a section in this chunk could not be scrolled to at page load.
  useEffect(() => {
    const id = window.location.hash.slice(1)
    if (id) document.getElementById(id)?.scrollIntoView()
  }, [])

  return (
    <>
      <Feature />
      <Story />
      <CapabilityIndex />
      <Dispatches />
      <Contributors />
      <Signoff />
    </>
  )
}
