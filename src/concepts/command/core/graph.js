import { displayName } from '../content/select.js'
import { ARM_ORDER } from './geometry.js'

// The one data model behind every layout (doc 6.1): nodes and edges derived from the content
// module, never typed twice. layouts.js turns it into positions, CoreFigure draws it as SVG, and
// three/ draws the same positions as points.
//
// A node:
//   { id, kind, label, short?, parent, evidence, src, module, arm, depth, order, siblings, layouts, status? }
//   kind      core | hub | service | leaf | record | status | method
//   evidence  fact | pending | illustrative | method  (the glyph: solid, dashed, hatched, plain)
//   module    id of the arm (hub) the node belongs to, or null (core, method steps)
//   arm       0..3 in ARM_ORDER (0 CODE NW, 1 AI NE, 2 CLOUD SE, 3 PRODUCT SW), or -1 for the core
//             and the method steps
//   depth     0 core, 1 hub and method step, 2 service and record, 3 leaf and status
//   order     index among the children of the same parent, siblings how many there are
//   layouts   which layouts show it: ALL, or ['line'] for the six method steps
// An edge: { id, from, to, kind: hub | member | record | pending | method, dashed, arm }
//
// With the shipped content: 1 core, 4 hubs, 8 services, 15 leaves, 3 records, 2 pending
// satellites, 6 method steps = 39 nodes. The 1,200 structural points are layouts.js's business.

export const LAYOUTS = Object.freeze(['x', 'arms', 'line', 'field', 'mark'])
const ALL = LAYOUTS
const LINE_ONLY = Object.freeze(['line'])

/** The most semantic labels ever visible at once (doc 6.1). The figures draw none; DOM tags do. */
export const LABEL_CAP = 24

/** Depth of a node kind in the arm tree. */
const DEPTH = { core: 0, hub: 1, method: 1, service: 2, record: 2, leaf: 3, status: 3 }

const nodeOf = (n, extra) => ({
  id: n.id,
  kind: n.kind,
  label: n.label,
  parent: n.parent ?? null,
  evidence: n.evidence,
  src: n.src,
  module: null,
  arm: -1,
  depth: DEPTH[n.kind],
  order: 0,
  siblings: 1,
  layouts: ALL,
  ...extra,
})

/** @param {import('../content/index.js').content} content */
export function buildGraph(content) {
  const nodes = []
  const edges = []
  const armOfModule = new Map(content.modules.map((m) => [m.id, ARM_ORDER.indexOf(m.short.toLowerCase())]))
  const edge = (from, to, kind, arm, dashed = false) => edges.push({ id: `${from}>${to}`, from, to, kind, dashed, arm })

  nodes.push(nodeOf(content.core))

  for (const m of content.modules) {
    const arm = armOfModule.get(m.id)
    nodes.push(nodeOf(m, { short: m.short, module: m.id, arm, order: arm, siblings: content.modules.length }))
    edge(m.parent, m.id, 'hub', arm)
    m.services.forEach((s, si) => {
      nodes.push(nodeOf(s, { module: m.id, arm, order: si, siblings: m.services.length }))
      edge(m.id, s.id, 'member', arm)
      s.leaves.forEach((leaf, li) => {
        nodes.push(nodeOf(leaf, { module: m.id, arm, order: li, siblings: s.leaves.length }))
        edge(s.id, leaf.id, 'member', arm)
      })
    })
  }

  // Records hang off the hub of their module; the pending satellites hang off the record.
  const recordCount = new Map()
  for (const r of content.records) recordCount.set(r.parent, (recordCount.get(r.parent) ?? 0) + 1)
  const recordSeen = new Map()
  for (const r of content.records) {
    const arm = armOfModule.get(r.parent)
    const order = recordSeen.get(r.parent) ?? 0
    recordSeen.set(r.parent, order + 1)
    // The label honours NAME_PRODUCTS (generic names when product names are not cleared).
    nodes.push(nodeOf(r, { label: displayName(r), module: r.parent, arm, order, siblings: recordCount.get(r.parent) }))
    edge(r.parent, r.id, 'record', arm)
    if (r.satellite) {
      nodes.push(nodeOf(r.satellite, { module: r.parent, arm }))
      edge(r.id, r.satellite.id, 'pending', arm, true)
    }
  }

  content.process.steps.forEach((step, i, all) => {
    nodes.push(nodeOf(step, { layouts: LINE_ONLY, order: i, siblings: all.length }))
    edge(step.parent, step.id, 'method', -1)
  })

  return { nodes, edges, byId: new Map(nodes.map((n) => [n.id, n])) }
}

/** The nodes a layout shows. */
export const nodesFor = (graph, layout) => graph.nodes.filter((n) => n.layouts.includes(layout))

/** The edges whose two ends are both visible in a layout. */
export function edgesFor(graph, layout) {
  const ids = new Set(nodesFor(graph, layout).map((n) => n.id))
  return graph.edges.filter((e) => ids.has(e.from) && ids.has(e.to))
}

/**
 * The nodes a layout draws as shapes with an evidence glyph (doc 6.1, visible-node cap).
 *   x, arms   everything but the method steps: hubs, services, leaves, records and satellites
 *   line      the core (the REQUEST stop) and the six method steps; the rest is dust
 *   field     everything, small
 *   mark      none: the mark is drawn, the nodes are its points
 */
export function shapesFor(graph, layout) {
  switch (layout) {
    case 'x':
    case 'arms':
      return graph.nodes.filter((n) => n.kind !== 'method')
    case 'line':
      return graph.nodes.filter((n) => n.kind === 'core' || n.kind === 'method')
    case 'field':
      return graph.nodes.filter((n) => n.kind !== 'method')
    default:
      return []
  }
}

/**
 * Nodes that may carry a visible label in a layout, most important first, never more than
 * LABEL_CAP: hubs, then services, then records. Leaves and satellites are labelled on hover or
 * focus only. Used by the DOM tags; the SVG figures themselves contain no text.
 */
export function labelCandidates(graph, layout) {
  if (layout !== 'x' && layout !== 'arms') return []
  const rank = { hub: 0, service: 1, record: 2 }
  return graph.nodes
    .filter((n) => n.kind in rank)
    .sort((a, b) => rank[a.kind] - rank[b.kind] || a.arm - b.arm || a.order - b.order)
    .slice(0, LABEL_CAP)
}

/** The nodes of one arm (its hub, services, leaves, records and satellites). */
export const armNodes = (graph, arm) => graph.nodes.filter((n) => n.arm === arm)

/** The children of a node, in content order. */
export const childrenOf = (graph, id) => graph.nodes.filter((n) => n.parent === id)
