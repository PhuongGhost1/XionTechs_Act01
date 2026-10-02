import { describe, it, expect } from 'vitest'
import * as site from './site'
import { buildRun } from '../workflow/run'
import { VIEW, nodeBox, decisionBox } from '../workflow/layout'
import { layoutJourney, TAG_H, CHIP } from '../workflow/journey'

// Collect every string value in the exported content, however deeply nested.
function collectStrings(value, out = []) {
  if (typeof value === 'string') out.push(value)
  else if (Array.isArray(value)) value.forEach((v) => collectStrings(v, out))
  else if (value && typeof value === 'object') Object.values(value).forEach((v) => collectStrings(v, out))
  return out
}

describe('site content rules', () => {
  it('contains no lorem ipsum', () => {
    const offenders = collectStrings(site).filter((s) => /lorem/i.test(s))
    expect(offenders).toEqual([])
  })

  it('has the three capability bands from the plan', () => {
    expect(site.solutions.bands.map((b) => b.id)).toEqual(['agents', 'software', 'teams'])
    for (const b of site.solutions.bands) expect(b.examples.length, b.id).toBeGreaterThan(0)
  })

  it('draws the five-step hero system', () => {
    expect(site.hero.system).toEqual(['Request', 'AI', 'Business logic', 'Existing systems', 'Human'])
    expect(site.hero.headline).toContain(site.hero.headlineAccent)
  })

  it('links the nav to in-page anchors only, once each', () => {
    const hrefs = site.nav.map((n) => n.href)
    expect(new Set(hrefs).size).toBe(hrefs.length)
    for (const h of [...hrefs, site.navCta.href]) expect(h.startsWith('#'), h).toBe(true)
  })

  it('walks through the four plan steps without promising durations', () => {
    expect(site.howWeWork.steps.map((s) => s.id)).toEqual(['discover', 'build', 'integrate', 'scale'])
    const timing = /\b(hours?|days?|weeks?|weekly|months?|monthly|quarter(ly)?|years?)\b/i
    expect(collectStrings(site.howWeWork).filter((s) => timing.test(s))).toEqual([])
  })

  describe('workflows', () => {
    const byId = (wf) => Object.fromEntries(wf.nodes.map((n) => [n.id, n]))
    const flat = (path) => path.flatMap((s) => (Array.isArray(s) ? s : [s]))

    it('has the three illustrative workflows', () => {
      expect(site.workflows.map((w) => w.id)).toEqual(['support', 'inventory', 'factory'])
      for (const wf of site.workflows) expect(wf.illustrative).toBe(true)
    })

    it('only uses known node types and unique ids', () => {
      for (const wf of site.workflows) {
        const ids = wf.nodes.map((n) => n.id)
        expect(new Set(ids).size).toBe(ids.length)
        for (const n of wf.nodes) expect(['trigger', 'agent', 'router', 'human', 'outcome']).toContain(n.type)
      }
    })

    it('connects edges to existing nodes and runs every branch along edges', () => {
      for (const wf of site.workflows) {
        const nodes = byId(wf)
        const edgeSet = new Set(wf.edges.map(([a, b]) => `${a}>${b}`))
        for (const [a, b] of wf.edges) {
          expect(nodes[a], `${wf.id} edge from ${a}`).toBeDefined()
          expect(nodes[b], `${wf.id} edge to ${b}`).toBeDefined()
        }
        wf.branches.forEach((_, i) => {
          for (const e of buildRun(wf, i).edges) expect(edgeSet.has(`${e.from}>${e.to}`), `${wf.id} ${e.from}>${e.to}`).toBe(true)
        })
      }
    })

    it('starts every branch at the single trigger and ends at an outcome or the decision node', () => {
      for (const wf of site.workflows) {
        const nodes = byId(wf)
        const triggers = wf.nodes.filter((n) => n.type === 'trigger')
        expect(triggers.length).toBe(1)
        for (const b of wf.branches) {
          const ids = flat(b.path)
          expect(ids[0]).toBe(triggers[0].id)
          const end = ids[ids.length - 1]
          expect(nodes[end].type === 'outcome' || end === wf.decision.nodeId, `${wf.id}: ${b.label}`).toBe(true)
        }
      }
    })

    it('labels every agent with a placeholder capability', () => {
      expect(site.capabilityLabels).toEqual(['AI model', 'Integration', 'IoT gateway', 'Data store'])
      for (const wf of site.workflows) {
        for (const n of wf.nodes.filter((x) => x.type === 'agent')) expect(site.capabilityLabels).toContain(n.capability)
      }
    })

    it('keeps titles short enough for one line', () => {
      for (const wf of site.workflows) for (const n of wf.nodes) expect(n.title.length, n.title).toBeLessThanOrEqual(26)
    })

    it('keeps every node inside the canvas without overlaps', () => {
      for (const wf of site.workflows) {
        const boxes = wf.nodes.map((n) => ({ id: n.id, ...nodeBox(n) }))
        for (const b of boxes) {
          expect(b.x >= 0 && b.y >= 0 && b.x + b.w <= VIEW.w && b.y + b.h <= VIEW.h, `${wf.id}/${b.id} inside`).toBe(true)
        }
        for (let i = 0; i < boxes.length; i++) {
          for (let j = i + 1; j < boxes.length; j++) {
            const a = boxes[i]
            const c = boxes[j]
            const overlap = a.x < c.x + c.w && c.x < a.x + a.w && a.y < c.y + c.h && c.y < a.y + a.h
            expect(overlap, `${wf.id}: ${a.id} overlaps ${c.id}`).toBe(false)
          }
        }
      }
    })

    it('contains no digits in any workflow text', () => {
      for (const wf of site.workflows) {
        const texts = [wf.label, ...wf.branches.map((b) => b.label), ...wf.nodes.flatMap((n) => [n.title, n.desc, n.capability ?? ''])]
        for (const t of texts) expect(t, `${wf.id}: ${t}`).not.toMatch(/\d/)
      }
    })

    it('has exactly one approval step that waits for a decision, reached by branch zero', () => {
      for (const wf of site.workflows) {
        const nodes = byId(wf)
        const waits = wf.nodes.filter((n) => n.waitsForDecision)
        expect(waits.map((n) => n.id), wf.id).toEqual([wf.decision.nodeId])
        expect(waits[0].type).toBe('human')
        expect(flat(wf.branches[0].path).at(-1)).toBe(wf.decision.nodeId)
        for (const choice of ['approve', 'reject']) {
          const cont = wf.decision[choice]
          expect(nodes[cont.at(-1)].type, `${wf.id} ${choice}`).toBe('outcome')
          const run = buildRun(wf, 0, { decision: choice })
          const edgeSet = new Set(wf.edges.map(([a, b]) => `${a}>${b}`))
          for (const e of run.edges) expect(edgeSet.has(`${e.from}>${e.to}`), `${wf.id} ${choice} ${e.from}>${e.to}`).toBe(true)
        }
        expect(wf.decision.verb.length).toBeGreaterThan(0)
      }
    })

    it('has exactly two drills that follow edges and name a problem step on their path', () => {
      for (const wf of site.workflows) {
        const nodes = byId(wf)
        expect(wf.drills.length, wf.id).toBe(2)
        const edgeSet = new Set(wf.edges.map(([a, b]) => `${a}>${b}`))
        for (const d of wf.drills) {
          const ids = flat(d.path)
          expect(ids).toContain(d.problemNodeId)
          const run = buildRun(wf, 0, { drillId: d.id })
          for (const e of run.edges) expect(edgeSet.has(`${e.from}>${e.to}`), `${wf.id}/${d.id} ${e.from}>${e.to}`).toBe(true)
          const end = ids.at(-1)
          expect(nodes[end].type === 'outcome' || end === wf.decision.nodeId, `${wf.id}/${d.id} end`).toBe(true)
          expect(['passed', 'flagged', 'retried']).toContain(d.log.status)
        }
      }
    })

    it('keeps drill-only steps off every normal branch', () => {
      for (const wf of site.workflows) {
        const drillOnly = wf.nodes.filter((n) => n.drillOnly).map((n) => n.id)
        for (const b of wf.branches) for (const id of flat(b.path)) expect(drillOnly, `${wf.id}: ${id}`).not.toContain(id)
      }
    })

    it('places the decision buttons inside the canvas without covering a card', () => {
      for (const wf of site.workflows) {
        const d = decisionBox(wf.decision)
        expect(d.x >= 0 && d.y >= 0 && d.x + d.w <= VIEW.w && d.y + d.h <= VIEW.h, wf.id).toBe(true)
        for (const n of wf.nodes) {
          const b = nodeBox(n)
          const overlap = d.x < b.x + b.w && b.x < d.x + d.w && d.y < b.y + b.h && b.y < d.y + d.h
          expect(overlap, `${wf.id}: buttons over ${n.id}`).toBe(false)
        }
      }
    })

    it('contains no digits in decision and drill text', () => {
      for (const wf of site.workflows) {
        const texts = [wf.decision.verb, wf.decision.log.approve, wf.decision.log.reject, ...wf.drills.flatMap((d) => [d.label, d.hint, d.log.text])]
        for (const t of texts) expect(t, `${wf.id}: ${t}`).not.toMatch(/\d/)
      }
    })
  })

  describe('run log', () => {
    it('has six illustrative rows with known statuses and no digits', () => {
      expect(site.runLog.length).toBe(6)
      const workflowIds = site.workflows.map((w) => w.id)
      for (const r of site.runLog) {
        expect(['passed', 'flagged', 'retried']).toContain(r.status)
        expect(workflowIds).toContain(r.workflow)
        expect(r.text).not.toMatch(/\d/)
      }
      expect(new Set(site.runLog.map((r) => r.text)).size).toBe(6)
    })
  })

  describe('agent journeys', () => {
    it('has exactly one journey per workflow, in the same order', () => {
      expect(site.agentJourneys.map((x) => x.id)).toEqual(site.workflows.map((w) => w.id))
    })

    it('flags every journey as illustrative', () => {
      for (const jr of site.agentJourneys) expect(jr.illustrative, jr.id).toBe(true)
    })

    it('has exactly one compact stop, never first or last', () => {
      for (const jr of site.agentJourneys) {
        const idx = jr.stops.map((s, i) => (s.kind === 'compact' ? i : -1)).filter((i) => i >= 0)
        expect(idx.length, jr.id).toBe(1)
        expect(idx[0] > 0 && idx[0] < jr.stops.length - 1, jr.id).toBe(true)
      }
    })

    it('uses known kinds, unique short labels and short statuses', () => {
      for (const jr of site.agentJourneys) {
        const labels = jr.stops.filter((s) => s.kind !== 'compact').map((s) => s.label)
        expect(new Set(labels).size).toBe(labels.length)
        for (const s of jr.stops) {
          expect(['resource', 'skill', 'compact']).toContain(s.kind)
          if (s.kind !== 'compact') expect(s.label.length, s.label).toBeLessThanOrEqual(26)
          expect(s.status.length, s.status).toBeLessThanOrEqual(32)
        }
      }
    })

    it('contains no digits', () => {
      for (const jr of site.agentJourneys) {
        const texts = [jr.task, ...jr.stops.flatMap((s) => [s.label ?? '', s.status])]
        for (const t of texts) expect(t, `${jr.id}: ${t}`).not.toMatch(/\d/)
      }
    })

    it('lays tags out inside the canvas without collisions', () => {
      for (const jr of site.agentJourneys) {
        const L = layoutJourney(jr)
        const boxes = L.tags.map((t) => ({ ...t, x0: t.x - t.w / 2, x1: t.x + t.w / 2, y0: t.y - TAG_H / 2, y1: t.y + TAG_H / 2 }))
        for (const b of boxes) {
          expect(b.y0 >= 0 && b.y1 <= L.height && b.x0 >= 0 && b.x1 <= L.width, `${jr.id} tag ${b.stopIndex} inside`).toBe(true)
          // clear of its own stop's status chip band
          const p = L.points[b.stopIndex]
          const chipTop = p.y + CHIP.dy
          const chipBottom = chipTop + CHIP.h
          expect(b.y1 <= chipTop || b.y0 >= chipBottom, `${jr.id} tag ${b.stopIndex} vs chip`).toBe(true)
        }
        for (let a = 0; a < boxes.length; a++) {
          for (let c = a + 1; c < boxes.length; c++) {
            const A = boxes[a]
            const C = boxes[c]
            const overlap = A.x0 < C.x1 && C.x0 < A.x1 && A.y0 < C.y1 && C.y0 < A.y1
            expect(overlap, `${jr.id}: tags ${A.stopIndex}/${C.stopIndex}`).toBe(false)
          }
        }
      }
    })
  })

  describe('selected work', () => {
    const work = site.selectedWork
    const screens = [work.staffxp.main, work.staffxp.secondary, work.ess.screen]

    it('shows no numbers, so no invented metric can slip in', () => {
      expect(collectStrings(work).filter((s) => /\d/.test(s))).toEqual([])
    })

    it('gives every screen alt text and its intrinsic size', () => {
      for (const sc of screens) {
        expect(sc.alt).toBeTruthy()
        expect(sc.width).toBeGreaterThan(0)
        expect(sc.height).toBeGreaterThan(0)
        if (sc.src) expect(sc.src.startsWith('/work/'), sc.src).toBe(true)
      }
    })

    it('annotates ESS areas with modules and on-screen markers', () => {
      const ids = work.ess.areas.map((a) => a.id)
      expect(new Set(ids).size).toBe(ids.length)
      for (const a of work.ess.areas) {
        expect(a.modules.length, a.id).toBeGreaterThan(0)
        for (const v of [a.marker.x, a.marker.y]) expect(v >= 0 && v <= 100, a.id).toBe(true)
      }
    })

    it('has two product stories and the demo as the third proof, marked illustrative', () => {
      expect(work.proofs.map((p) => p.id)).toEqual(['staffxp', 'ess', 'agents'])
      expect(work.proofs[2].note).toMatch(/illustrative/i)
      for (const p of work.proofs) expect(p.href.startsWith('#'), p.id).toBe(true)
    })
  })

  it('asks the six buyer questions from the plan, each answered', () => {
    expect(site.faq.items).toHaveLength(6)
    for (const f of site.faq.items) expect(f.a.length, f.q).toBeGreaterThan(40)
  })

  it('keeps four evidence-oriented reasons and no booking promise in the CTA', () => {
    expect(site.whyUs.pillars).toHaveLength(4)
    expect(collectStrings(site.finalCta).filter((s) => /book/i.test(s))).toEqual([])
  })

  it('lists technology categories once each, tools only where named', () => {
    const labels = site.engineering.categories.map((c) => c.label)
    expect(new Set(labels).size).toBe(labels.length)
    const cloud = site.engineering.categories.find((c) => c.label === 'Cloud')
    expect(cloud.items).toBe('Azure, AWS, GCP')
  })
})
