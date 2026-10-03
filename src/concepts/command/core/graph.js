import { displayName } from '../content/select.js'

// STUB (WP2 replaces the drawing): a working minimal graph. Keep the exported names.
//
// buildGraph(content) turns the content module into the one data model behind every layout
// (doc 6.1): nodes and edges, derived, never typed twice. A node:
//   { id, kind, label, short?, parent, evidence, src, module, layouts, status? }
//   kind      core | hub | service | leaf | record | status | method
//   evidence  fact | pending | illustrative | method  (the glyph: solid, dashed, hatched, plain)
//   module    id of the arm (hub) the node belongs to, or null (core, method steps)
//   layouts   which layouts show it: ALL, or ['line'] for the six method steps
// An edge: { id, from, to, kind: hub | member | record | pending | method, dashed }
//
// With the shipped content: 1 core, 4 hubs, 8 services, 15 leaves, 3 records, 2 pending
// satellites, 6 method steps = 39 nodes. The 1,200 structural points are WP2's own business.

export const LAYOUTS = Object.freeze(['x', 'arms', 'line', 'field', 'mark'])
const ALL = LAYOUTS
const LINE_ONLY = Object.freeze(['line'])

const nodeOf = (n, extra) => ({
  id: n.id,
  kind: n.kind,
  label: n.label,
  parent: n.parent ?? null,
  evidence: n.evidence,
  src: n.src,
  module: null,
  layouts: ALL,
  ...extra,
})

/** @param {import('../content/index.js').content} content */
export function buildGraph(content) {
  const nodes = []
  const edges = []
  const edge = (from, to, kind, dashed = false) => edges.push({ id: `${from}>${to}`, from, to, kind, dashed })

  nodes.push(nodeOf(content.core))

  for (const m of content.modules) {
    nodes.push(nodeOf(m, { short: m.short, module: m.id }))
    edge(m.parent, m.id, 'hub')
    for (const s of m.services) {
      nodes.push(nodeOf(s, { module: m.id }))
      edge(m.id, s.id, 'member')
      for (const leaf of s.leaves) {
        nodes.push(nodeOf(leaf, { module: m.id }))
        edge(s.id, leaf.id, 'member')
      }
    }
  }

  for (const r of content.records) {
    // The label honours NAME_PRODUCTS (generic names when product names are not cleared).
    nodes.push(nodeOf(r, { label: displayName(r), module: r.parent }))
    edge(r.parent, r.id, 'record')
    if (r.satellite) {
      nodes.push(nodeOf(r.satellite, { module: r.parent }))
      edge(r.id, r.satellite.id, 'pending', true)
    }
  }

  for (const step of content.process.steps) {
    nodes.push(nodeOf(step, { layouts: LINE_ONLY }))
    edge(step.parent, step.id, 'method')
  }

  return { nodes, edges, byId: new Map(nodes.map((n) => [n.id, n])) }
}

/** The nodes a layout shows. */
export const nodesFor = (graph, layout) => graph.nodes.filter((n) => n.layouts.includes(layout))

/** The edges whose two ends are both visible in a layout. */
export function edgesFor(graph, layout) {
  const ids = new Set(nodesFor(graph, layout).map((n) => n.id))
  return graph.edges.filter((e) => ids.has(e.from) && ids.has(e.to))
}
