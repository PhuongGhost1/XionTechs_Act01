// Illustrative mock-up of a goal-setting screen. Every value comes from `projects[].mock` in
// site.js (invented sample data); the frame around it carries the "not a product screenshot" note.
const statusClass = {
  Approved: 'bg-primary text-primaryInk',
  Submitted: 'border border-line text-ink/80',
  'Needs revision': 'border border-dashed border-accent text-accent',
}

export default function MockPerformance({ project }) {
  const { mock, stages } = project
  return (
    <div className="space-y-4 p-4 text-xs sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink">{mock.heading}</p>
          <p className="mt-0.5 text-muted">{mock.context}</p>
        </div>
        <span className="shrink-0 rounded-full bg-primarySoft px-2.5 py-1 font-medium text-primary">{mock.view}</span>
      </div>

      <ol className="grid grid-cols-4 gap-2">
        {stages.map((s, i) => (
          <li key={s}>
            <span className={`block h-1 rounded-full ${i <= mock.currentStage ? 'bg-accent' : 'bg-line'}`} />
            <span className={`mt-1.5 block leading-tight ${i === mock.currentStage ? 'font-medium text-ink' : 'text-muted'}`}>{s}</span>
          </li>
        ))}
      </ol>

      <ul className="divide-y divide-line rounded-xl border border-line bg-paper">
        {mock.goals.map((g) => (
          <li key={g.title} className="flex items-center justify-between gap-3 px-3 py-2.5">
            <div className="min-w-0">
              <p className="truncate font-medium text-ink">{g.title}</p>
              <p className="mt-0.5 text-muted">{g.kind}</p>
            </div>
            <span className={`shrink-0 rounded-full px-2.5 py-1 font-medium ${statusClass[g.status] ?? 'border border-line text-ink/80'}`}>
              {g.status}
            </span>
          </li>
        ))}
      </ul>

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
