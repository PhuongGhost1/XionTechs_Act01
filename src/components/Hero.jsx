import { MapPin } from 'lucide-react'
import { company } from '../content/site'

function Headline() {
  const { heroHeadline, heroHeadlineAccent } = company
  const idx = heroHeadline.indexOf(heroHeadlineAccent)
  if (idx === -1) return heroHeadline
  return (
    <>
      {heroHeadline.slice(0, idx)}
      <span className="text-accent">{heroHeadlineAccent}</span>
      {heroHeadline.slice(idx + heroHeadlineAccent.length)}
    </>
  )
}

// Nine nodes on two diagonals form an "X", echoing the logo mark. Pure SVG so it re-themes.
const NODES = [
  [20, 20], [60, 60], [100, 100], [140, 140], [180, 180],
  [180, 20], [140, 60], [60, 140], [20, 180],
]

function NodeX() {
  return (
    <svg viewBox="0 0 200 200" className="h-full w-full text-accent" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6">
        <line x1="20" y1="20" x2="180" y2="180" />
        <line x1="180" y1="20" x2="20" y2="180" />
      </g>
      {NODES.map(([x, y], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={i === 2 ? 9 : 5}
          fill="currentColor"
          className="hero-node"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </svg>
  )
}

export default function Hero() {
  return (
    <section id="top" className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-6 pb-20 pt-16 md:pt-24 lg:grid-cols-[3fr_2fr] lg:items-center">
      <div>
        <p className="mb-4 inline-block rounded-full bg-primarySoft px-4 py-1 text-xs font-medium uppercase tracking-wide text-primary">
          {company.tagline}
        </p>

        <h1 className="max-w-3xl text-4xl leading-tight md:text-6xl md:leading-[1.05]">
          <Headline />
        </h1>

        <p className="mt-6 max-w-xl text-lg text-muted">{company.heroSubline}</p>

        <div className="mt-8 flex flex-wrap gap-4">
          <a
            href="#demo"
            className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-primaryInk transition hover:bg-primaryHover"
          >
            See an agent work
          </a>
          <a
            href="#contact"
            className="rounded-full border border-line px-6 py-3 text-sm font-medium transition hover:border-primary hover:text-primary"
          >
            Book a call
          </a>
        </div>

        <p className="mt-10 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
          <MapPin className="h-4 w-4 text-accent" strokeWidth={1.75} />
          {company.offices.map((o, i) => (
            <span key={o}>
              {o}
              {i < company.offices.length - 1 && <span className="ml-3 text-line">·</span>}
            </span>
          ))}
        </p>
      </div>

      <div className="mx-auto aspect-square w-full max-w-xs lg:max-w-sm">
        <NodeX />
      </div>
    </section>
  )
}
