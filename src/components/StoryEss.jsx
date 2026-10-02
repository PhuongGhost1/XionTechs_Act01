import { useState } from 'react'
import { selectedWork } from '../content/site'
import ProductFrame from './ProductFrame'
import { EssPortalOutline } from './WorkOutlines'
import { StoryHeader } from './StoryHeader'

// Story 02: a light, structured treatment. The portal screen carries numbered markers and the
// legend beside it maps each number to the modules in that area. Pointing at a legend item
// highlights its marker.
export default function StoryEss() {
  const story = selectedWork.ess
  const [activeId, setActiveId] = useState(null)

  return (
    <article id={story.id} aria-labelledby={`${story.id}-title`} className="mt-28">
      <StoryHeader index={2} story={story} />

      <div className="mx-auto mt-12 grid max-w-6xl grid-cols-1 gap-10 px-6 lg:grid-cols-[1.65fr_1fr] lg:items-start">
        <div className="rounded-2xl border border-line bg-surface/70 p-3 [background-image:linear-gradient(rgb(var(--line)/0.6)_1px,transparent_1px),linear-gradient(90deg,rgb(var(--line)/0.6)_1px,transparent_1px)] [background-size:24px_24px] sm:p-6">
          <div className="-mx-3 overflow-x-auto px-3 pb-2 sm:mx-0 sm:px-0 sm:pb-0">
            <div className="relative min-w-[560px]">
              <ProductFrame
                screen={story.screen}
                outline={<EssPortalOutline />}
                overlay={
                  <div aria-hidden="true" className="absolute inset-0">
                    {story.areas.map((a, i) => {
                      const on = activeId === a.id
                      return (
                        <span
                          key={a.id}
                          className={`absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums shadow transition-transform duration-200 ${
                            on ? 'scale-125 bg-accent text-surface' : 'bg-primary text-primaryInk'
                          }`}
                          style={{ left: `${a.marker.x}%`, top: `${a.marker.y}%` }}
                        >
                          {i + 1}
                        </span>
                      )
                    })}
                  </div>
                }
              />
            </div>
          </div>
          {!story.screen.src && <p className="mt-4 text-xs text-muted">{selectedWork.pendingNote}</p>}
        </div>

        <ol className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-1" aria-label="Product areas">
          {story.areas.map((a, i) => (
            <li
              key={a.id}
              onPointerEnter={() => setActiveId(a.id)}
              onPointerLeave={() => setActiveId(null)}
              className={`flex gap-4 px-5 py-4 transition-colors ${activeId === a.id ? 'bg-primarySoft' : 'bg-surface'}`}
            >
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold tabular-nums text-primaryInk">
                {i + 1}
              </span>
              <div className="min-w-0">
                <p className="font-medium text-ink">{a.label}</p>
                <p className="mt-1 text-sm text-muted">{a.modules.join(' · ')}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </article>
  )
}
