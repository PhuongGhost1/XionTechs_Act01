import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { agent } from '../content.js'
import { Chip, Container, Mono, Section, SectionHead } from '../ui/index.jsx'

const Body = lazy(() => import('./AgentBody.jsx'))

// 04 / Watch an agent work. The head renders at once; the canvas stage, the run logic and the
// demo data load as one lazy chunk shortly before the section scrolls into view.
export default function Agent() {
  const ref = useRef(null)
  const [load, setLoad] = useState(false)
  // Fetch the chunk once the browser is idle so it is ready before the visitor scrolls here.
  useEffect(() => {
    const idle = window.requestIdleCallback ?? ((fn) => setTimeout(fn, 2500))
    const id = idle(() => import('./AgentBody.jsx'))
    return () => (window.cancelIdleCallback ?? clearTimeout)(id)
  }, [])
  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') {
      setLoad(true)
      return undefined
    }
    const io = new IntersectionObserver(
      ([it]) => {
        if (it.isIntersecting) {
          setLoad(true)
          io.disconnect()
        }
      },
      { rootMargin: '1200px 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <Section id="agent" className="py-24 lg:py-32">
      <Container>
        <SectionHead code="04" label={agent.label} title={agent.title} intro={agent.intro} />
        <div ref={ref} className="mt-6 flex flex-wrap items-center gap-3">
          <Chip tone="illustrative">{agent.illustrative}</Chip>
          <Mono className="text-x-faint">{agent.legend}</Mono>
        </div>
        {load ? (
          <Suspense fallback={<div className="mt-10 min-h-[640px]" aria-hidden="true" />}>
            <Body />
          </Suspense>
        ) : (
          <div className="mt-10 min-h-[640px]" aria-hidden="true" />
        )}
      </Container>
    </Section>
  )
}
