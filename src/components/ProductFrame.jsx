import { selectedWork } from '../content/site'

// A product screen in a browser frame. With a `src` it shows the approved screenshot; without
// one it shows `outline` (a drawing of the layout, no invented data) and says so. `overlay` is
// positioned over the screen area only (used for annotation markers).
export default function ProductFrame({ screen, outline, overlay, priority = false, className = '' }) {
  const pending = !screen.src
  return (
    <figure className={className}>
      <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-2xl shadow-black/25">
        <div aria-hidden="true" className="flex items-center gap-1.5 border-b border-line px-3.5 py-2.5">
          <span className="h-2 w-2 rounded-full bg-line" />
          <span className="h-2 w-2 rounded-full bg-line" />
          <span className="h-2 w-2 rounded-full bg-line" />
          {pending && (
            <span className="ml-auto rounded-full border border-dashed border-muted/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted">
              Outline
            </span>
          )}
        </div>
        <div className="relative">
          {pending ? (
            <div role="img" aria-label={`Layout outline of the ${screen.alt}. ${selectedWork.pendingNote}`} style={{ aspectRatio: `${screen.width} / ${screen.height}` }}>
              {outline}
            </div>
          ) : (
            <img
              src={screen.src}
              alt={screen.alt}
              width={screen.width}
              height={screen.height}
              loading={priority ? 'eager' : 'lazy'}
              decoding="async"
              className="block h-auto w-full"
            />
          )}
          {overlay}
        </div>
      </div>
    </figure>
  )
}
