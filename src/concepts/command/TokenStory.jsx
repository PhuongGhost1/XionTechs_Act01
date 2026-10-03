import { useEffect, useState } from 'react'
import { Button } from './ui/Button.jsx'
import { Chip } from './ui/Chip.jsx'
import { EvidenceDot } from './ui/Evidence.jsx'
import { Frame } from './ui/Frame.jsx'
import { FullStop } from './ui/FullStop.jsx'
import { Label } from './ui/Label.jsx'
import { Rule } from './ui/Rule.jsx'
import { SpecRow } from './ui/SpecRow.jsx'
import { CHIP_KINDS } from './ui/kinds.js'

// Token story (?tokens): a review page for WP0's tokens, owned by WP0 and kept small. It renders
// the swatches of doc 5.1, the type scale of doc 5.2 and every UI primitive, so a reviewer can
// compare them with the design document at a glance. It is developer documentation, not site
// copy, so its labels live here and not in content/. Class names are written out in full so
// Tailwind sees them. Channel values are read from the live CSS variables, not retyped.

const SWATCHES = [
  { token: 'void', cls: 'bg-void', use: 'Silence bands, screenshot backing, dock' },
  { token: 'ground', cls: 'bg-ground', use: 'Page' },
  { token: 'panel', cls: 'bg-panel', use: 'Active, hover or selected panel only' },
  { token: 'panel-hi', cls: 'bg-panelHi', use: 'Hover fill (ink-2 text on it)' },
  { token: 'ink', cls: 'bg-ink', use: 'Display, active words (17:1)' },
  { token: 'ink-2', cls: 'bg-ink2', use: 'Body (9.8:1)' },
  { token: 'ink-3', cls: 'bg-ink3', use: 'Mono labels, captions (5.8:1)' },
  { token: 'ink-dim', cls: 'bg-inkDim', use: 'Unlit LARGE words only, 24 px and up (3.4:1)' },
  { token: 'hair', cls: 'bg-hair', use: '1 px structure (ink-2 at 14%)' },
  { token: 'hair-strong', cls: 'bg-hairStrong', use: 'Dashed outlines, frames (30%)' },
  { token: 'ghost', cls: 'bg-ghost', use: 'Unlit graph edges (10%)' },
  { token: 'grid', cls: 'bg-grid', use: 'Dot grid (6%)' },
  { token: 'signal', cls: 'bg-signal', use: 'The only hue (10.5:1)' },
  { token: 'signal-wash', cls: 'bg-signalWash', use: 'Active row band (10%)' },
  { token: 'on-signal', cls: 'bg-onSignal', use: 'Text on yellow (10.5:1)' },
]

const TYPE = [
  { role: 'Display XL, hero h1', cls: 'font-display text-display-xl font-medium uppercase', sample: 'Engineering that gets it done' },
  { role: 'Finale', cls: 'font-display text-finale font-medium uppercase', sample: 'Get it done' },
  { role: 'Statement', cls: 'font-display text-statement', sample: 'We turn requirements into production systems.' },
  { role: 'Heading h2', cls: 'font-display text-h2 font-medium', sample: 'Pick what you need.' },
  { role: 'Row words', cls: 'font-display text-row font-medium', sample: 'Software engineering' },
  { role: 'Step words', cls: 'font-display text-step font-medium uppercase', sample: 'Architecture' },
  { role: 'Body', cls: 'font-body text-body text-ink2', sample: 'XionTechs is an engineering and AI team that builds custom software.' },
  { role: 'Label (12 px floor)', cls: 'font-mono text-label uppercase text-ink3', sample: '02 / What we can deploy' },
  { role: 'Data, spec value', cls: 'font-mono text-data text-ink', sample: 'contact@xiontechs.com' },
  { role: 'Counter', cls: 'font-mono text-counter font-medium uppercase text-ink', sample: 'Build 003' },
]

function Section({ title, children }) {
  return (
    <section className="flex flex-col gap-6 py-12">
      <Label>{title}</Label>
      <Rule />
      {children}
    </section>
  )
}

export default function TokenStory() {
  const [channels, setChannels] = useState({})

  useEffect(() => {
    const style = getComputedStyle(document.documentElement)
    setChannels(Object.fromEntries(SWATCHES.map((s) => [s.token, style.getPropertyValue(`--${s.token}`).trim()])))
  }, [])

  return (
    <main className="mx-auto max-w-content px-[var(--margin-x)] py-12">
      <h1 className="font-display text-h2 font-medium text-ink">
        Tokens
        <FullStop />
      </h1>
      <p className="mt-3 max-w-measure text-ink2">Concept 01 v2 tokens, type scale and primitives. Compare with 00-direction.md, sections 5 and 11.</p>

      <Section title="Colour (doc 5.1)">
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SWATCHES.map((s) => (
            <li key={s.token} className="flex items-center gap-4">
              <span className={`h-14 w-14 shrink-0 border border-hairStrong ${s.cls}`} />
              <span className="flex min-w-0 flex-col">
                <span className="font-mono text-data text-ink">--{s.token}</span>
                <span className="font-mono text-label text-ink3">{channels[s.token] ?? '...'}</span>
                <span className="text-sm text-ink2">{s.use}</span>
              </span>
            </li>
          ))}
        </ul>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="bg-dots h-32 border border-hair" />
          <div className="hatch h-32 border border-hairStrong" />
          <div className="dash h-32" />
        </div>
        <Label>Dot grid, illustrative hatch, dashed outline</Label>
      </Section>

      <Section title="Type scale (doc 5.2)">
        <div className="flex flex-col gap-10">
          {TYPE.map((t) => (
            <div key={t.role} className="flex flex-col gap-2">
              <Label>{t.role}</Label>
              <p className={t.cls}>{t.sample}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Primitives (doc 11.3 item 6)">
        <div className="flex flex-wrap gap-2">
          {CHIP_KINDS.map((k) => (
            <Chip key={k} kind={k} review />
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-6 font-mono text-label uppercase text-ink2">
          <span className="inline-flex items-center gap-2">
            <EvidenceDot kind="confirmed" /> Confirmed
          </span>
          <span className="inline-flex items-center gap-2">
            <EvidenceDot kind="pending" /> Pending
          </span>
          <span className="inline-flex items-center gap-2">
            <EvidenceDot kind="illustrative" /> Illustrative
          </span>
        </div>
        <div className="flex flex-wrap gap-4">
          <Button href="#contact" arrow="right" flow>
            Start a project
          </Button>
          <Button variant="ghost" href="#work" arrow="down">
            Explore our work
          </Button>
        </div>
        <Frame ticks className="max-w-xl p-6">
          <dl className="flex flex-col gap-2">
            <SpecRow label="Product" value="Sample" />
            <SpecRow label="Details" value={{ pending: true, label: 'Stack, status, client (pending)' }} />
          </dl>
        </Frame>
      </Section>
    </main>
  )
}
