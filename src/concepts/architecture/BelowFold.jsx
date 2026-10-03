import { useEffect } from 'react'
import ArchitectureSection from './architecture/ArchitectureSection.jsx'
import Capabilities from './capabilities/Capabilities.jsx'
import Process from './process/Process.jsx'
import StaffXP from './staffxp/StaffXP.jsx'
import Work from './work/Work.jsx'
import Finale from './finale/Finale.jsx'
import { SECTIONS_READY } from './chrome/useActiveSheet.js'
import { refreshScroll } from './state/scroll.js'

// Sheets 02-07. Announces itself so the header and the rail rebuild their observers, and honours a
// #fragment that pointed at a sheet which was not in the DOM yet.
export default function BelowFold() {
  useEffect(() => {
    window.dispatchEvent(new Event(SECTIONS_READY))
    refreshScroll()
    const id = decodeURIComponent(window.location.hash.slice(1))
    if (id && id !== 'top') document.getElementById(id)?.scrollIntoView({ behavior: 'instant', block: 'start' })
  }, [])

  return (
    <>
      <ArchitectureSection />
      <Capabilities />
      <Process />
      <StaffXP />
      <Work />
      <Finale />
    </>
  )
}
