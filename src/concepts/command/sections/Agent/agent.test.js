import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { agent } from '../../content/agent.js'
import { journeyTicks } from '../../runtime/agent/journey.js'
import { buildRun, totalTicks } from '../../runtime/agent/run.js'
import { journeyRows, workflowRows } from '../../runtime/agent/tape.js'
import { Decide, Live, Tabs, Tools } from './Controls.jsx'
import { Tape } from './Tape.jsx'

// Server-render checks (the test environment has no document): the markup a visitor and a screen
// reader get from the tape and its controls, and the 3D rules of the strip.

const support = agent.workflows[0]
const rowsAt = (decision, tick) => {
  const run = buildRun(support, 0, { decision })
  return workflowRows(support, run, tick ?? totalTicks(run), agent)
}
const tape = (props) =>
  renderToStaticMarkup(
    createElement(Tape, { rows: rowsAt(null), tick: 4, running: false, staticMode: false, stacked: false, raw: false, wide: true, label: 'tape', ...props }),
  )
const text = (html) => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ')
const count = (html, re) => (html.match(re) ?? []).length

describe('Tape markup', () => {
  it('is an ordered list of printed lines, in the order they were printed', () => {
    const html = tape()
    expect(html).toContain('<ol')
    const order = ['New support email', 'Triage agent', 'AI routing', 'Refund request', 'Refund agent', 'Human approves', 'Awaiting approval']
    let at = 0
    for (const word of order) {
      const i = html.indexOf(word, at)
      expect(i, word).toBeGreaterThanOrEqual(at)
      at = i
    }
  })

  it('labels every strip as an illustrative scenario, and the capability tags as pending', () => {
    const html = tape()
    expect(html).toContain(agent.chip.text)
    expect(html).toContain('data-chip="illustrative"')
    expect(html).toContain(agent.tape.tagsPending.text)
    expect(html).toContain('data-chip="pending"')
    // an agent step's capability tag is dashed (pending), a trigger's type tag is solid
    expect(html).toMatch(/border-dashed[^>]*>AI model</)
    expect(html).not.toMatch(/border-dashed[^>]*>Trigger</)
  })

  it('shows AWAITING APPROVAL with a static yellow underline, never a blink', () => {
    const html = tape()
    expect(html).toContain(agent.tape.sign.text)
    expect(html).toContain('bg-signal')
    expect(html).not.toMatch(/blink|caret/i)
  })

  it('has no number on it: no counter, no timing, no count', () => {
    const rows = [
      ...rowsAt('approve'),
      ...rowsAt('reject'),
      ...journeyRows(agent.journeys[0], journeyTicks(agent.journeys[0]), agent),
    ]
    for (const staticMode of [false, true]) {
      expect(text(tape({ rows, staticMode }))).not.toMatch(/\d/)
    }
  })

  it('names XionTechs agent and no other vendor or model', () => {
    const all = JSON.stringify(agent).toLowerCase()
    for (const other of ['claude', 'anthropic', 'openai', 'gpt', 'gemini', 'copilot', 'llama', 'mistral']) expect(all).not.toContain(other)
    const html = tape({ rows: journeyRows(agent.journeys[0], 0, agent) })
    expect(html).toContain('XionTechs agent')
  })

  it('stamps APPROVED, prints the outcome as a tear-off and leaves its slip to fall away', () => {
    const html = tape({ rows: rowsAt('approve') })
    expect(html).toContain(agent.tape.stampApproved.text)
    expect(html).toContain('data-outcome="ok"')
    expect(html).toContain('clip-path:polygon(')
    expect(html).toContain(agent.run.line.approved.text) // the slip
    expect(html).toContain('animation:tp-tear')
  })

  it('tears a rejected run and marks it ABORT', () => {
    const html = tape({ rows: rowsAt('reject') })
    expect(html).toContain(agent.tape.stampRejected.text)
    expect(html).toContain('data-outcome="abort"')
    expect(html).toContain(agent.tape.abort.text)
  })

  it('strikes a failed line and prints the fault and RETRY on the reprint', () => {
    const run = buildRun(support, 0, { drillId: 'support.timeout' })
    const html = tape({ rows: workflowRows(support, run, totalTicks(run), agent) })
    expect(html).toContain('data-struck')
    expect(html).toContain('animation:tp-strike')
    expect(html).toContain('Timeout')
    expect(html).toContain(agent.tape.retry.text)
  })

  it('splits the strip into two columns after the router, with the other branch marked not taken', () => {
    const html = tape({ wide: true })
    expect(html).toContain('grid-template-columns:1fr 1fr')
    expect(html).toContain(agent.tape.notTaken.text)
    // on a narrow strip the second branch is not drawn
    expect(tape({ wide: false })).not.toContain('grid-template-columns:1fr 1fr')
  })

  it('shows what Approve and Reject would do, as text, when the run is static', () => {
    const html = tape({ staticMode: true })
    expect(html).toContain(agent.tape.ifApproved.text)
    expect(html).toContain(support.decision.log.approve.text)
    expect(html).toContain(agent.tape.ifRejected.text)
    expect(html).toContain(support.decision.log.reject.text)
  })

  it('RAW drops the paper and the notch: a plain mono sheet of the same lines', () => {
    const html = tape({ raw: true, staticMode: true, rows: rowsAt('approve') })
    expect(html).not.toMatch(/bg-panel(?!Hi)/)
    expect(html).not.toContain('clip-path:polygon(')
    expect(html).toContain('Customer answered')
  })
})

describe('the 3D rules of the strip', () => {
  const html = tape({ stacked: true, rows: rowsAt('approve') })

  it('has a 1400 px perspective with its origin at 50% 40%, and a gentle tilt of the device', () => {
    expect(html).toContain('perspective:1400px')
    expect(html).toContain('perspective-origin:50% 40%')
    expect(html).toContain('transform:rotateX(6deg)')
  })

  it('keeps preserve-3d on the device and the strip, and opacity, clip-path or overflow on the leaf lines only', () => {
    // The two 3D parents carry no flattening property.
    const device = html.match(/<div class="relative" style="([^"]*preserve-3d[^"]*)"/)[1]
    const strip = html.match(/<ol[^>]*style="([^"]*)"/)[1]
    for (const parent of [device, strip]) {
      expect(parent).toContain('transform-style:preserve-3d')
      expect(parent).not.toMatch(/opacity|clip-path|filter|overflow|mask/)
    }
    // Every row is a leaf: depth (translate3d, rotateX), fade, and only transform and opacity animate.
    expect(count(html, /<li[^>]*translate3d\(0,-?\d+(\.\d+)?px,-?\d+px\) rotateX/g)).toBeGreaterThan(5)
    expect(html).toContain('opacity:')
  })

  it('puts the printer in front of the strip and the tear-off slip in front of the printer', () => {
    expect(html).toContain('transform:translateZ(10px)')
    expect(html).toContain('translate3d(0,0,16px)')
  })

  it('is flat when it is not stacked (phones, tablets, RAW, reduced motion)', () => {
    const flat = tape({ stacked: false })
    expect(flat).not.toContain('perspective')
    expect(flat).not.toContain('preserve-3d')
    expect(flat).not.toContain('translate3d')
  })
})

describe('the controls', () => {
  const run = (over = {}) => ({
    scenario: 0,
    view: 'workflow',
    drillId: null,
    playing: true,
    done: false,
    awaiting: false,
    phase: 'running',
    status: 'Running',
    workflow: support,
    actions: {},
    ...over,
  })

  it('has three scenario tabs in an ARIA tablist, one selected and only that one in the tab order', () => {
    const html = renderToStaticMarkup(createElement(Tabs, { active: 1, onSelect: () => {} }))
    expect(html).toContain('role="tablist"')
    expect(count(html, /role="tab"/g)).toBe(3)
    expect(count(html, /aria-selected="true"/g)).toBe(1)
    expect(count(html, /tabindex="0"/g)).toBe(1)
    expect(html).toMatch(/aria-selected="true"[^>]*>Inventory/)
    for (const w of agent.workflows) expect(html).toContain(w.label.replace('&', '&amp;'))
  })

  it('has Agent at work (aria-pressed), two drills to inject, Pause and Replay', () => {
    const html = renderToStaticMarkup(createElement(Tools, { run: run(), staticMode: false }))
    expect(html).toContain(agent.controls.view.text)
    expect(html).toContain(agent.controls.drills.text)
    for (const d of support.drills) expect(html).toContain(d.label)
    expect(html).toContain(agent.controls.pause.text)
    expect(html).toContain(agent.controls.replay.text)
    expect(count(html, /aria-pressed/g)).toBe(4)
    // no drills in the Agent at work view; no Pause or Replay when the run is static
    expect(renderToStaticMarkup(createElement(Tools, { run: run({ view: 'journey' }), staticMode: false }))).not.toContain(support.drills[0].label)
    expect(renderToStaticMarkup(createElement(Tools, { run: run(), staticMode: true }))).not.toContain(agent.controls.pause.text)
  })

  it('announces the run in one polite live region', () => {
    const html = renderToStaticMarkup(createElement(Live, { run: run({ status: 'Running · Refund request path' }), staticMode: false }))
    expect(html).toContain('aria-live="polite"')
    expect(html).toContain('role="status"')
    expect(html).toContain('Running · Refund request path')
  })

  it('docks Approve and Reject flat, inert and quiet until an approval is awaited', () => {
    const idle = renderToStaticMarkup(createElement(Decide, { run: run(), wide: true, onDecided: () => {} }))
    expect(idle).toContain('inert')
    expect(count(idle, /disabled/g)).toBe(2)
    expect(idle).not.toContain('data-fill="signal"')
    const waiting = renderToStaticMarkup(createElement(Decide, { run: run({ awaiting: true }), wide: true, onDecided: () => {} }))
    expect(waiting).not.toContain('inert')
    expect(waiting).not.toContain('disabled')
    expect(waiting).toContain('data-fill="signal"') // Approve is the yellow control
    expect(waiting).toContain(agent.controls.approve.text)
    expect(waiting).toContain(agent.controls.reject.text)
  })

  it('is a bottom bar on narrow screens, drawn only while an approval is awaited, buttons at least 48 px', () => {
    expect(renderToStaticMarkup(createElement(Decide, { run: run(), wide: false, onDecided: () => {} }))).toBe('')
    const bar = renderToStaticMarkup(createElement(Decide, { run: run({ awaiting: true }), wide: false, onDecided: () => {} }))
    expect(bar).toContain('fixed')
    expect(bar).toContain('bottom-dock')
    expect(count(bar, /min-h-\[48px\]/g)).toBe(2)
  })
})
