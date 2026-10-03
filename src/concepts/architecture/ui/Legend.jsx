import { legend } from '../content.js'

// The line-type legend, as on a real drawing sheet. It teaches the honesty convention of the page.
export default function Legend({ className = '' }) {
  return (
    <figure className={className} aria-label={legend.title}>
      <figcaption className="bp-mono mb-2 text-bp-mute">{legend.title}</figcaption>
      <ul className="flex flex-wrap gap-x-6 gap-y-2">
        {legend.items.map((item) => (
          <li key={item.kind} className="bp-mono flex items-center gap-2 text-bp-text">
            <svg width="30" height="10" viewBox="0 0 30 10" aria-hidden="true" focusable="false">
              {item.kind === 'solid' && <path d="M0 5H30" className="stroke-bp-line" strokeWidth="1.5" fill="none" />}
              {item.kind === 'dashed' && (
                <path d="M0 5H30" className="stroke-bp-line" strokeWidth="1.5" strokeDasharray="5 4" fill="none" />
              )}
              {item.kind === 'signal' && (
                <>
                  <path d="M1 5H29" className="stroke-bp-signal" strokeWidth="2.5" fill="none" />
                  <path d="M1 1V9M29 1V9" className="stroke-bp-line" strokeWidth="1" fill="none" />
                </>
              )}
            </svg>
            <span>{item.label}</span>
          </li>
        ))}
      </ul>
    </figure>
  )
}
