import { describe, expect, it } from 'vitest'
import { content } from '../content/index.js'
import { LAYOUTS, buildGraph, edgesFor, nodesFor } from './graph.js'

// WP2 owns this file and extends it (layouts, positions). It starts with the properties of the
// derived graph that the other packages rely on.

const graph = buildGraph(content)
const count = (kind) => graph.nodes.filter((n) => n.kind === kind).length

describe('buildGraph', () => {
  it('derives the 39 semantic nodes of doc 6.1 from the content', () => {
    expect(graph.nodes).toHaveLength(39)
    expect(Object.fromEntries(['core', 'hub', 'service', 'leaf', 'record', 'status', 'method'].map((k) => [k, count(k)]))).toEqual({
      core: 1,
      hub: 4,
      service: 8,
      leaf: 15,
      record: 3,
      status: 2,
      method: 6,
    })
  })

  it('has unique ids and a source and evidence on every node', () => {
    expect(new Set(graph.nodes.map((n) => n.id)).size).toBe(graph.nodes.length)
    for (const n of graph.nodes) {
      expect(n.src, n.id).toBeTruthy()
      expect(['fact', 'pending', 'illustrative', 'method'], n.id).toContain(n.evidence)
    }
  })

  it('draws honesty into the nodes: pending satellites, an illustrative demo, solid services', () => {
    expect(graph.byId.get('dep-001.status').evidence).toBe('pending')
    expect(graph.byId.get('dep-003').evidence).toBe('illustrative')
    expect(graph.nodes.filter((n) => n.kind === 'service').every((n) => n.evidence === 'fact')).toBe(true)
  })

  it('connects every edge to existing nodes, and every node but the core to a parent edge', () => {
    for (const e of graph.edges) {
      expect(graph.byId.has(e.from), e.id).toBe(true)
      expect(graph.byId.has(e.to), e.id).toBe(true)
    }
    const targets = new Set(graph.edges.map((e) => e.to))
    for (const n of graph.nodes.filter((x) => x.kind !== 'core')) expect(targets.has(n.id), n.id).toBe(true)
  })

  it('dashes the pending edges and only those', () => {
    expect(graph.edges.filter((e) => e.dashed).map((e) => e.kind)).toEqual(['pending', 'pending'])
  })

  it('shows the method steps only in the line layout', () => {
    expect(LAYOUTS).toEqual(['x', 'arms', 'line', 'field', 'mark'])
    expect(nodesFor(graph, 'x')).toHaveLength(33)
    expect(nodesFor(graph, 'line')).toHaveLength(39)
    expect(edgesFor(graph, 'x').some((e) => e.kind === 'method')).toBe(false)
    expect(edgesFor(graph, 'line').filter((e) => e.kind === 'method')).toHaveLength(6)
  })

  it('names products according to NAME_PRODUCTS', () => {
    expect(graph.byId.get('dep-001').label).toBe('StaffXP')
    expect(graph.byId.get('dep-002').label).toBe('ESS')
  })
})
