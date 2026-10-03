import { cta, finale } from '../content.js'
import Button from '../ui/Button.jsx'
import Plot from '../ui/Plot.jsx'

// BRIEF §7, sheet 07: "Good products start with good architecture." and the slogan. "Done." is the single
// yellow word on the sheet's text (yellow on the navy band passes AA; on paper it never would).
const words = finale.slogan.split(' ')
const last = words.pop()
const lead = words.join(' ')

const rise = (ms) => ({ '--d': `${ms}ms` })

export default function Statement() {
  return (
    <Plot className="bp-wrap pt-16 lg:pt-24">
      <h2 id="finale-title" className="bp-display fn-statement text-bp-text">
        {finale.statement.map((line, i) => (
          <span key={line} className="bp-rise block" style={rise(i * 140)}>
            {line}
          </span>
        ))}
      </h2>

      <div className="mt-10 grid items-end gap-10 border-t border-bp-rule pt-8 lg:mt-14 lg:grid-cols-12 lg:gap-8">
        <p className="bp-display bp-rise text-[clamp(3.4rem,11.5vw,10.5rem)] text-bp-text lg:col-span-8" style={rise(380)}>
          {lead} <span className="text-bp-signal">{last}</span>
        </p>
        <div className="bp-rise lg:col-span-4 lg:justify-self-end" style={rise(560)}>
          <Button href={cta.href} className="fn-cta">
            {cta.label}
          </Button>
          <p className="bp-mono mt-8 text-bp-mute">{cta.note}</p>
        </div>
      </div>
    </Plot>
  )
}
