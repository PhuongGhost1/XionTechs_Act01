import { describe, it, expect } from 'vitest'
import * as site from './site'
import { buildRun } from '../workflow/run'
import { VIEW, nodeBox } from '../workflow/layout'

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

  it('has three pillars and four roadmap stages', () => {
    expect(site.pillars.map((p) => p.id)).toEqual(['agentic', 'platform', 'engineering'])
    expect(site.roadmap.map((r) => r.stage)).toEqual(['Explore', 'Pilot', 'Production', 'Scale'])
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

    it('starts every branch at the single trigger and ends at an outcome', () => {
      for (const wf of site.workflows) {
        const nodes = byId(wf)
        const triggers = wf.nodes.filter((n) => n.type === 'trigger')
        expect(triggers.length).toBe(1)
        for (const b of wf.branches) {
          const ids = flat(b.path)
          expect(ids[0]).toBe(triggers[0].id)
          expect(nodes[ids[ids.length - 1]].type).toBe('outcome')
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

  it('lists Azure first in the stack strip', () => {
    expect(site.stack.chips[0]).toEqual({ label: 'Azure', primary: true })
    expect(site.stack.chips.map((c) => c.label)).toEqual(['Azure', 'AWS', 'GCP', 'Power Platform', 'Make', 'n8n', 'Retool', 'Bubble'])
  })
})
