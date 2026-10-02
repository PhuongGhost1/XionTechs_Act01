import { FolderOpen } from 'lucide-react'
import { caseStudiesNote } from '../content/site'

export default function CaseStudies() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-12">
      <div className="flex flex-col items-start gap-4 rounded-2xl border border-dashed border-line bg-surface/60 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primarySoft text-primary">
            <FolderOpen className="h-4 w-4" strokeWidth={1.75} />
          </span>
          <p className="text-sm text-muted">{caseStudiesNote}</p>
        </div>
        <a
          href="#contact"
          className="shrink-0 rounded-full border border-line px-5 py-2 text-sm font-medium transition hover:border-primary hover:text-primary"
        >
          Book a call
        </a>
      </div>
    </section>
  )
}
