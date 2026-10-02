import { Search } from 'lucide-react'

// Illustrative mock-up of a customer record screen. Every value comes from `projects[].mock` in
// site.js (invented sample data); the frame around it carries the "not a product screenshot" note.
export default function MockCrm({ project }) {
  const { mock, stages } = project
  const current = stages.indexOf(mock.status)
  return (
    <div className="space-y-4 p-4 text-xs sm:p-5">
      <div className="flex items-center gap-2 rounded-full border border-line bg-paper px-3 py-2 text-muted">
        <Search className="h-3.5 w-3.5" strokeWidth={1.75} />
        {mock.search}
      </div>

      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink">{mock.record}</p>
          <p className="mt-0.5 text-muted">{mock.recordMeta}</p>
        </div>
        <span className="shrink-0 rounded-full bg-primary px-2.5 py-1 font-medium text-primaryInk">{mock.status}</span>
      </div>

      <ol className="grid grid-cols-4 gap-2">
        {stages.map((s, i) => (
          <li key={s}>
            <span className={`block h-1 rounded-full ${i <= current ? 'bg-accent' : 'bg-line'}`} />
            <span className={`mt-1.5 block leading-tight ${i === current ? 'font-medium text-ink' : 'text-muted'}`}>{s}</span>
          </li>
        ))}
      </ol>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[2fr_3fr]">
        <dl className="space-y-2 rounded-xl border border-line bg-paper p-3">
          {mock.fields.map((f) => (
            <div key={f.label}>
              <dt className="text-muted">{f.label}</dt>
              <dd className="font-medium text-ink">{f.value}</dd>
            </div>
          ))}
        </dl>
        <div className="rounded-xl border border-line bg-paper p-3">
          <p className="font-medium text-ink">{mock.activityTitle}</p>
          <ul className="mt-2 space-y-2">
            {mock.activity.map((a) => (
              <li key={a} className="flex gap-2 text-muted">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                {a}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        {mock.actions.map((a, i) => (
          <span
            key={a}
            className={`rounded-full px-3.5 py-1.5 font-medium ${
              i === mock.actions.length - 1 ? 'bg-primary text-primaryInk' : 'border border-line text-ink'
            }`}
          >
            {a}
          </span>
        ))}
      </div>
    </div>
  )
}
