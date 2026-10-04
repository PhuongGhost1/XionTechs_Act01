import { useEffect, useRef } from 'react'
import { ATTR } from '../../contract/attributes.js'
import { agent } from '../../content/agent.js'
import { content } from '../../content/index.js'
import { validateContent } from '../../content/validate.js'
import { STATIONS } from '../../contract/stations.js'
import { watchPinFit } from '../../runtime/fit.js'
import { useHtmlAttribute, useInView, useReducedMotion, useTrack } from '../../runtime/hooks.js'
import { Chip } from '../../ui/Chip.jsx'
import { Label } from '../../ui/Label.jsx'
import { cx } from '../../ui/cx.js'
import { Decide, Live, Tabs, Tools } from './Controls.jsx'
import { Tape } from './Tape.jsx'
import { useAgentRun } from './useAgentRun.js'
import { useMediaQuery } from './useMediaQuery.js'
import './agent.css'

// Station 05 AGENT RUN: the illustrative AI agent demo as a printer tape (docs/concepts/command-v2/
// 02-agent-demo-notes.md). The run is a strip of paper that feeds up out of a printer slot, one
// printed line per tick, in the quiet language of the page: it is the READ | RAW sheet made into a
// device. The run logic is ported from the main page's agent demo (runtime/agent/); everything the
// tape shows is illustrative and says so, on screen, for every visitor.
//
// Layout. From 1024 px wide it is a pinned stage (about 320 lvh of track, the Line's sticky
// skeleton): the panel on the left five columns, the printer on the right seven. Below that, in RAW
// and under reduced motion there is no pin: the tape is a plain flow of lines and, below 1024 px, the
// Approve / Reject pair is a bottom bar shown only while an approval is awaited. The run is time
// driven (useAgentRun): it starts while the stage is on screen and waits while it is not. Scrolling
// does not scrub it.
//
// The grid items are siblings (not a panel and a scene) so the order below 1024 px can be: title,
// tabs, the tape, then the tools and the status; from 1024 px the tape takes the right columns. The
// placement is inline style decided by `wide`, so the stylesheet carries only the keyframes.

const LEFT = { gridColumn: '1 / span 5' }

// This group of copy loads with the section (it is not in the entry bundle), so it is held to the
// rules of doc 12.4 here, in dev, exactly as content/index.js holds the rest.
if (import.meta.env?.DEV) {
  const problems = validateContent({ ...content, agent })
  if (problems.length) throw new Error(['content/agent.js breaks the honesty rules:', ...problems].join(String.fromCharCode(10) + '  '))
}

export default function Agent() {
  const ref = useTrack('agent')
  const stageRef = useRef(null)
  const raw = useHtmlAttribute(ATTR.view) === 'raw'
  const reduced = useReducedMotion()
  const staticMode = raw || reduced
  const wide = useMediaQuery('(min-width: 1024px)')
  const room = useMediaQuery('(min-width: 30rem)') // room for the strip to split into two columns
  const pinned = wide && !staticMode
  const stacked = pinned // the three-dimensional strip lives on the pinned stage only
  const [viewRef, onScreen] = useInView({ rootMargin: '-15% 0px -15% 0px' })
  const run = useAgentRun({ staticMode, onScreen })

  // A stage that does not hold its content (200 percent text, a short window) is released: the track
  // flows at its natural height and nothing is clipped (base.css [data-unpinned]).
  useEffect(() => {
    if (!pinned || !ref.current || !stageRef.current) return undefined
    return watchPinFit(ref.current, stageRef.current, '.ag-grid > :not(.ag-scene)')
  }, [pinned, ref])

  const focusStatus = () => requestAnimationFrame(() => document.getElementById('ag-status')?.focus())
  const running = run.playing && !run.done && !run.awaiting && !staticMode
  const activeTab = agent.workflows[run.scenario]

  const grid = {
    gridTemplateColumns: wide ? 'repeat(12, minmax(0, 1fr))' : undefined,
    gridTemplateRows: wide ? 'repeat(4, auto) minmax(0, 1fr) auto' : undefined,
    columnGap: wide ? 'var(--gutter)' : undefined,
    alignContent: wide ? 'start' : undefined,
    height: pinned ? '100%' : undefined,
    paddingBlock: pinned ? 20 : 'calc(var(--station-gap) / 2)',
    paddingBottom: pinned ? undefined : 'calc(var(--station-gap) / 2 + var(--bar-h))',
  }

  return (
    <section
      id="agent"
      ref={ref}
      data-track={pinned ? 'agent' : undefined}
      aria-labelledby="agent-title"
      className={cx('ag', pinned && 'track track--pin')}
    >
      <div ref={stageRef} className={pinned ? 'stage' : undefined} data-paused={run.playing ? undefined : ''}>
        <div ref={viewRef} className="ag-grid column grid gap-4" style={grid}>
          <header className="flex flex-col gap-3" style={wide ? LEFT : undefined}>
            <Label>{STATIONS[5].label}</Label>
            <h2
              id="agent-title"
              className="font-display font-medium text-ink"
              style={raw ? undefined : { fontSize: 'clamp(1.75rem, 2.4vw, 2.5rem)', lineHeight: 1.04, letterSpacing: '-0.035em' }}
            >
              {agent.heading.text} <span className="text-ink2">{agent.headingMuted.text}</span>
            </h2>
            <Chip kind="illustrative" className="self-start">
              {agent.chip.text}
            </Chip>
            <p className="max-w-measure text-ink2">{agent.intro.text}</p>
          </header>

          <Tabs active={run.scenario} onSelect={run.actions.selectScenario} style={wide ? LEFT : undefined} />

          <div
            id="ag-tape"
            role="tabpanel"
            aria-labelledby={`ag-tab-${activeTab.id}`}
            className="ag-scene flex min-w-0 justify-center"
            style={wide ? { gridColumn: '6 / span 7', gridRow: '1 / -1', alignItems: 'center' } : undefined}
          >
            <Tape rows={run.rows} tick={run.tick} running={running} staticMode={staticMode} stacked={stacked} raw={raw} wide={room} label={agent.a11y.tape.text} />
          </div>

          <Tools run={run} staticMode={staticMode} style={wide ? LEFT : undefined} />
          <Live run={run} staticMode={staticMode} style={wide ? LEFT : undefined} />
          {run.view === 'workflow' && !staticMode && (
            <Decide run={run} wide={wide} onDecided={focusStatus} style={wide ? { ...LEFT, gridRow: 6, alignSelf: 'end' } : undefined} />
          )}
        </div>
      </div>
    </section>
  )
}
