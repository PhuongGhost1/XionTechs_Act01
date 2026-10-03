import { work } from '../content.js'
import { Sheet, SheetHeader } from '../ui/Sheet.jsx'
import SectionHead from '../ui/SectionHead.jsx'
import Legend from '../ui/Legend.jsx'
import Chip from '../ui/Chip.jsx'
import Ess from './Ess.jsx'
import Agents from './Agents.jsx'
import { copy } from './copy.js'
import './work.css'

function Arrow({ dir }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      aria-hidden="true"
      focusable="false"
      className={`wk-index__arrow wk-index__arrow--${dir} mt-1 text-bp-line`}
    >
      <path d={dir === 'up' ? 'M7 13V2M2 6.5 7 1.5l5 5' : 'M7 1v11M2 7.5l5 5 5-5'} fill="none" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  )
}

// The drawing list of the set: three entries, each a sheet code, a name and a link. StaffXP is drawn open on
// the sheet above, so its entry points back up.
function Index() {
  return (
    <nav aria-label={copy.indexLabel} className="mt-14">
      <p className="bp-mono mb-3 text-bp-mute">{copy.indexTitle}</p>
      <ol className="grid border-t border-bp-line md:grid-cols-3">
        {work.index.map((item) => (
          <li key={item.id} className="border-b border-bp-rule md:border-b-0 md:border-r md:last:border-r-0">
            <a href={item.href} className="wk-index__link md:px-5 md:first:pl-0">
              <span className="bp-mono w-[4.25rem] shrink-0 text-bp-mute">{item.code}</span>
              <span className="min-w-0 flex-1">
                <span className="bp-h3 block text-[1.5rem] text-bp-text">{item.name}</span>
                {item.id === 'agents' ? (
                  <Chip kind="illustrative" className="mt-2">
                    {item.note}
                  </Chip>
                ) : (
                  <span className="bp-mono mt-1 block text-bp-mute">{item.note}</span>
                )}
              </span>
              <Arrow dir={item.id === 'staffxp' ? 'up' : 'down'} />
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}

// Sheet 06, "Selected work": the set index, then one large sheet per project. The two project sheets plot
// themselves (they are `Plot`s), so the Sheet's own "in view" flag is pinned off: otherwise it would draw
// the second project before anyone scrolled to it.
export default function Work() {
  return (
    <Sheet id="work" labelledBy="work-title" className="py-20 sm:py-28" data-in="false">
      <div className="bp-wrap">
        <SheetHeader id="work" />
        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-16">
          <SectionHead id="work" kicker={work.kicker} title={work.title} lede={work.lede} draft={work.draft} />
          <Legend className="max-w-[19rem]" />
        </div>
        <Index />
        <div className="mt-16 grid gap-16 sm:mt-20 sm:gap-24">
          <Ess />
          <Agents />
        </div>
      </div>
    </Sheet>
  )
}
