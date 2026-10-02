// Layout outlines drawn in place of product screenshots until approved images are supplied.
// Shapes only: no names, numbers or copy, so nothing here can be mistaken for real data.
// Each outline fills its frame; colours come from the surrounding tone's tokens.

const bar = 'rounded-full bg-ink/10'

export function StaffxpDashboardOutline() {
  return (
    <div className="flex h-full bg-paper">
      <div className="flex w-[18%] flex-col gap-[6%] border-r border-line p-[2.5%]">
        <span className="h-[5%] w-3/4 rounded-md bg-accent/50" />
        {Array.from({ length: 7 }, (_, i) => (
          <span key={i} className={`h-[3%] ${bar} ${i === 1 ? 'w-full bg-accent/30' : 'w-4/5'}`} />
        ))}
      </div>
      <div className="flex flex-1 flex-col gap-[3%] p-[3%]">
        <div className="flex items-center justify-between">
          <span className={`h-3 w-1/3 ${bar}`} />
          <span className="h-6 w-6 rounded-full bg-ink/15" />
        </div>
        <div className="grid flex-1 grid-cols-3 gap-[3%]">
          <div className="col-span-2 rounded-lg border border-line bg-surface p-[4%]">
            <span className={`block h-2.5 w-1/3 ${bar}`} />
            <div className="mt-[6%] space-y-[4%]">
              {[90, 75, 82, 60].map((w) => (
                <span key={w} className={`block h-2 ${bar}`} style={{ width: `${w}%` }} />
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-line bg-surface p-[6%]">
            <span className="mx-auto block aspect-square w-1/2 rounded-full border-[6px] border-accent/40" />
            <span className={`mx-auto mt-[10%] block h-2 w-2/3 ${bar}`} />
          </div>
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-lg border border-line bg-surface p-[6%]">
              <span className={`block h-2 w-1/2 ${bar}`} />
              <span className={`mt-[10%] block h-2 w-4/5 ${bar}`} />
              <span className={`mt-[6%] block h-2 w-3/5 ${bar}`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function StaffxpSignInOutline() {
  return (
    <div className="flex h-full bg-paper">
      <div className="w-1/2 bg-[linear-gradient(135deg,rgb(var(--surface)),rgb(var(--accent)/0.22))]" />
      <div className="flex flex-1 flex-col justify-center gap-[7%] px-[8%]">
        <span className="h-6 w-6 rounded-md bg-accent/50" />
        <span className={`h-2.5 w-2/3 ${bar}`} />
        <span className="h-[11%] rounded-md border border-line bg-surface" />
        <span className="h-[11%] rounded-md border border-line bg-surface" />
        <span className="h-[11%] rounded-md bg-primary/80" />
      </div>
    </div>
  )
}

// Regions line up with the ESS area markers in site.js (% positions).
export function EssPortalOutline() {
  const tile = 'absolute rounded-lg border border-line bg-surface'
  return (
    <div className="relative h-full bg-paper">
      <div className="absolute inset-x-0 top-0 flex h-[10%] items-center justify-between border-b border-line px-[2%]">
        <span className="h-[40%] w-[12%] rounded-md bg-primary/60" />
        <span className="h-[45%] w-[30%] rounded-full border border-line bg-surface" />
        <span className="aspect-square h-[55%] rounded-full bg-ink/15" />
      </div>
      <div className="absolute bottom-0 left-0 top-[10%] flex w-[20%] flex-col gap-[3.2%] border-r border-line p-[2%]">
        {Array.from({ length: 11 }, (_, i) => (
          <span key={i} className={`h-[3.4%] ${bar} ${i === 0 ? 'w-full bg-primary/25' : 'w-4/5'}`} />
        ))}
      </div>
      <div className={`${tile} left-[23%] right-[2%] top-[14%] h-[20%]`}>
        <span className="absolute left-[3%] top-1/2 aspect-square h-[55%] -translate-y-1/2 rounded-full bg-ink/15" />
        <span className={`absolute left-[14%] top-[30%] h-2.5 w-1/4 ${bar}`} />
        <span className={`absolute left-[14%] top-[58%] h-2 w-2/5 ${bar}`} />
      </div>
      <div className={`${tile} left-[23%] top-[38%] h-[26%] w-[24%]`} />
      <div className={`${tile} left-[49%] top-[38%] h-[26%] w-[24%]`} />
      <div className={`${tile} left-[75%] right-[2%] top-[38%] h-[26%]`} />
      <div className={`${tile} left-[23%] top-[66%] bottom-[4%] w-[37%]`}>
        <div className="absolute inset-x-[8%] bottom-[14%] flex h-1/2 items-end gap-[6%]">
          {[55, 80, 45, 90, 70].map((h) => (
            <span key={h} className="flex-1 rounded-t bg-accent/35" style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>
      <div className={`${tile} left-[62%] right-[2%] top-[66%] bottom-[4%]`} />
    </div>
  )
}
