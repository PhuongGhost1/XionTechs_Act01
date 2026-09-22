import { Phone } from 'lucide-react'
import { cta, contact } from '../content/site'

export default function CTA() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <p className="text-center text-xs font-medium uppercase tracking-wide text-accent">
        {cta.eyebrow}
      </p>
      <h2 className="mx-auto mt-3 max-w-2xl text-center text-3xl md:text-4xl">{cta.title}</h2>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-6">
        <a
          href="#contact"
          className="rounded-full bg-accent px-6 py-3 text-sm font-medium text-paper transition hover:bg-accentHover"
        >
          Contact Us
        </a>
        <a
          href={`tel:${contact.phones[0].replace(/\s+/g, '')}`}
          className="group flex items-center gap-2 text-sm text-ink/70 hover:text-accent"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accentSoft text-accent transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110">
            <Phone className="h-4 w-4" strokeWidth={1.75} />
          </span>
          {contact.phones[0]} — for any question
        </a>
      </div>

      <div className="mt-12 rounded-2xl bg-accent px-8 py-10 text-center">
        <p className="font-display text-2xl text-paper md:text-3xl">{cta.banner}</p>
      </div>
    </section>
  )
}
