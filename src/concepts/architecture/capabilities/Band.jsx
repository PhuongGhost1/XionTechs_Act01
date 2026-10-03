import Plot from '../ui/Plot.jsx'
import { Cross } from '../ui/Marks.jsx'
import { DraftMark } from '../ui/SectionHead.jsx'
import Glyph from './Glyph.jsx'
import { copy } from './copy.js'

/**
 * One capability layer as a full-width horizontal band: a hairline above, a huge outlined number, the name and
 * one line, a plan-view glyph and a plus that turns into the brand X when the band opens. The header is the
 * accordion button; the panel under it animates its height (grid rows, 0fr to 1fr) and holds the items as a
 * plain list, the tools named on the live site where there are any, and the larger drawing.
 */
export default function Band({ layer, ids, open, onToggle, code, last }) {
  return (
    <Plot as="li" className="cap-band" data-open={open ? 'true' : 'false'} rootMargin="0px 0px -8% 0px">
      <span aria-hidden="true" className="cap-rule" />
      <span aria-hidden="true" className="cap-sig" />
      {last ? <span aria-hidden="true" className="cap-rule cap-rule--end" /> : null}
      <h3 className="cap-h3">
        <button type="button" id={ids.head} className="cap-head" aria-expanded={open} aria-controls={ids.panel} onClick={onToggle}>
          <span aria-hidden="true" className="cap-num bp-display bp-rise">
            {layer.no}
          </span>
          <span className="cap-text">
            <span className="cap-name bp-h3 bp-rise">{layer.label}</span>
            <span className="cap-desc bp-rise" style={{ '--d': '90ms' }}>
              {layer.desc} <DraftMark on={layer.draft} />
            </span>
          </span>
          <span aria-hidden="true" className="cap-glyph">
            <Glyph name={layer.glyph} />
          </span>
          <span aria-hidden="true" className="cap-tog">
            <i />
            <i />
            <b />
          </span>
        </button>
      </h3>
      <div id={ids.panel} role="region" aria-labelledby={ids.head} className="cap-panel">
        <div className="cap-panel__in">
          <div className="cap-body">
            <div className="cap-lists">
              <p className="bp-mono m-0 text-bp-mute">
                {copy.itemsLabel} <DraftMark on={layer.draftItems} />
              </p>
              <ol className="cap-keys">
                {layer.items.map((item, i) => (
                  <li key={item}>
                    <span aria-hidden="true" className="cap-key bp-mono">
                      {i + 1}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
              {layer.tools ? (
                <div className="cap-tools">
                  <p className="bp-mono m-0 text-bp-mute">{copy.toolsLabel}</p>
                  <ul>
                    {layer.tools.map((tool) => (
                      <li key={tool}>{tool}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
            <figure className="cap-fig">
              <div className="cap-frame">
                <Cross className="cap-cross cap-cross--a" />
                <Cross className="cap-cross cap-cross--b" />
                <Cross className="cap-cross cap-cross--c" />
                <Cross className="cap-cross cap-cross--d" />
                <Glyph name={layer.glyph} large />
              </div>
              <figcaption className="bp-mono">
                {copy.figureLabel} {code} · {layer.label} · {copy.figureNote}
              </figcaption>
            </figure>
          </div>
        </div>
      </div>
    </Plot>
  )
}
