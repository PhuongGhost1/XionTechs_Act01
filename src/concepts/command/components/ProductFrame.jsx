import { selectedWork } from '../../../content/site'

// A real product screen, shown at its true aspect ratio and in its own colours (MOTION §14, §30).
// `device` (StaffXP): a bezel with a lit top edge that shifts a few px with the pointer (reads the
// --px variable set by the showcase), a slim browser bar and a deep shadow. `flat` (ESS): a thin
// border only, so annotations can meet the screen's edge. `overlay` sits over the screen area only.
// Without an approved `src` the frame shows a neutral placeholder that says the screen is pending,
// and no overlay, so nothing is ever drawn over a screen that is not there.
export default function ProductFrame({ screen, variant = 'device', overlay, className = '' }) {
  const pending = !screen.src
  const device = variant === 'device'
  return (
    <figure className={className}>
      <div
        className={
          device
            ? 'relative rounded-2xl bg-surface bg-gradient-to-b from-ink/10 to-transparent p-1.5 shadow-depth-3 shadow-black/60 ring-1 ring-ink/10'
            : 'relative'
        }
      >
        {device && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-[14%] -top-px h-px bg-gradient-to-r from-transparent via-ink/60 to-transparent motion-safe:transition-transform motion-safe:duration-base motion-safe:ease-brand"
            style={{ transform: 'translate3d(calc(var(--px, 0) * 28px), 0, 0)' }}
          />
        )}
        <div className={`overflow-hidden ${device ? 'rounded-[0.65rem] ring-1 ring-ink/10' : 'rounded-lg shadow-depth-2 ring-1 ring-ink/15'}`}>
          {device && (
            <div aria-hidden="true" className="flex items-center gap-1.5 bg-paper px-3 py-2">
              <span className="h-1.5 w-1.5 rounded-full bg-ink/25" />
              <span className="h-1.5 w-1.5 rounded-full bg-ink/25" />
              <span className="h-1.5 w-1.5 rounded-full bg-ink/25" />
            </div>
          )}
          <div className="relative">
            {pending ? (
              <div
                role="img"
                aria-label={`${screen.alt} ${selectedWork.pendingNote}`}
                className="flex items-center justify-center bg-paper p-6 text-center text-xs text-muted"
                style={{ aspectRatio: `${screen.width} / ${screen.height}` }}
              >
                {selectedWork.pendingNote}
              </div>
            ) : (
              <img
                src={screen.src}
                alt={screen.alt}
                width={screen.width}
                height={screen.height}
                loading="lazy"
                decoding="async"
                className="block h-auto w-full"
              />
            )}
            {!pending && overlay}
          </div>
        </div>
      </div>
    </figure>
  )
}
