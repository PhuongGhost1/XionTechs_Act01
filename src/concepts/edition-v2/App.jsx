import { Suspense, lazy } from 'react'
import Header from './chrome/Header.jsx'
import EdgeMarker from './chrome/EdgeMarker.jsx'
import Cover from './cover/Cover.jsx'
import Manifesto from './manifesto/Manifesto.jsx'

const BelowFold = lazy(() => import('./BelowFold.jsx'))

export default function App() {
  return (
    <>
      <div className="pf-grain" aria-hidden="true" />
      <Header />
      <EdgeMarker />
      <main id="main">
        <Cover />
        <Manifesto />
        <Suspense fallback={<div className="min-h-screen" />}>
          <BelowFold />
        </Suspense>
      </main>
    </>
  )
}
