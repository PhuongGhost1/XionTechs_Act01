import { sheets, ui } from '../content.js'
import { useActiveSheet } from './useActiveSheet.js'

// A vertical datum scale on the right edge: one tick per sheet, a yellow marker on the current one. It is
// the page-wide position cue (the scroll "elevation"), wide screens only, and always on its own paper chip
// so it stays legible on the navy sheets.
export default function DatumRail() {
  const active = useActiveSheet()
  return (
    <nav aria-label={ui.railLabel} className="fixed right-2 top-1/2 z-40 hidden -translate-y-1/2 xl:block">
      <ul className="flex flex-col border border-bp-rule bg-bp-bg px-1 py-1.5">
        {sheets.map((s) => {
          const current = s.id === active
          return (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                aria-label={`${ui.sheet} ${s.no}, ${s.title}`}
                aria-current={current ? 'location' : undefined}
                className="group relative flex h-6 w-8 items-center justify-end pr-1"
              >
                <span className="bp-mono pointer-events-none absolute right-8 whitespace-nowrap border border-bp-rule bg-bp-bg px-2 py-1 text-bp-text opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
                  {s.no} {s.title}
                </span>
                <span
                  aria-hidden="true"
                  className={`block transition-all duration-300 ease-bp ${current ? 'h-[3px] w-5 bg-bp-signal outline outline-1 outline-bp-line' : 'h-px w-3 bg-bp-line'}`}
                />
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
