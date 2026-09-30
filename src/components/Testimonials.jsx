import { testimonials } from '../content/site'

export default function Testimonials() {
  return (
    <section id="testimonials" className="border-t border-line bg-white/60">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-3xl md:text-4xl">What clients say</h2>

        {testimonials.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-line bg-paper p-10 text-center">
            <p className="text-sm font-medium text-ink/70">
              [PLACEHOLDER — real client testimonials pending]
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm text-ink/50">
              We&rsquo;d rather show nothing than invent a quote. Add real testimonials to{' '}
              <code className="rounded bg-primarySoft px-1.5 py-0.5">src/content/site.js</code>{' '}
              once the team has them.
            </p>
          </div>
        ) : (
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {testimonials.map((t) => (
              <blockquote key={t.name} className="rounded-2xl border border-line p-6">
                <p className="text-ink/80">&ldquo;{t.quote}&rdquo;</p>
                <footer className="mt-4 text-sm text-ink/50">
                  {t.name} — {t.role}
                </footer>
              </blockquote>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
