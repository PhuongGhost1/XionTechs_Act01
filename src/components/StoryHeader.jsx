import { Eyebrow, Reveal } from './ui'

// Shared opener for a Selected Work story: number, eyebrow, serif title, description, tags.
// Fades in once as it enters the viewport.
export function StoryHeader({ index, story }) {
  return (
    <Reveal className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
      <div>
        <div className="flex items-baseline gap-4">
          <span className="font-display text-2xl tabular-nums text-muted">{String(index).padStart(2, '0')}</span>
          <Eyebrow>{story.eyebrow}</Eyebrow>
        </div>
        <h3 id={`${story.id}-title`} className="mt-4 font-display text-3xl leading-tight md:text-4xl">
          <span className="sr-only">{story.name}: </span>
          {story.title}
        </h3>
      </div>
      <div className="lg:pt-10">
        <p className="text-pretty text-lg text-muted">{story.desc}</p>
        {story.tags && (
          <ul className="mt-5 flex flex-wrap gap-2" aria-label={`${story.name} capabilities`}>
            {story.tags.map((t) => (
              <li key={t} className="rounded-full border border-line px-3 py-1 text-xs text-ink/80">
                {t}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Reveal>
  )
}
