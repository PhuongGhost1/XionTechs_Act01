import { stack } from '../content/site'

export default function AzureStrip() {
  return (
    <section id="stack" className="border-y border-line bg-surface/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-3 md:max-w-md">
          <p className="text-sm font-medium text-ink">{stack.line}</p>
          {stack.draft && (
            <span className="rounded-full border border-dashed border-accent px-2 py-0.5 text-xs font-medium text-accent">
              Draft copy
            </span>
          )}
        </div>
        <ul className="flex flex-wrap gap-2" aria-label="Platforms we build on">
          {stack.chips.map((c) => (
            <li
              key={c.label}
              className={
                c.primary
                  ? 'rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primaryInk'
                  : 'rounded-full border border-line px-3 py-1 text-xs text-ink/80'
              }
            >
              {c.label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
