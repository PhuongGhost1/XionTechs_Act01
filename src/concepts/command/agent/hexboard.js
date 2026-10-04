// The hex board: axial cells, pure layout from the demo data. Units are hex radii (pointy-top hexes).
// workflow node x / y live on a 760 x 520 canvas (src/content/site.js); `layoutBoard` maps each node to
// its own cell, nearest to where the flat diagram would have put it. `layoutJourney` places the
// "Agent at work" stops on a ring around the context tray. Nothing here draws.
export const SQ3 = Math.sqrt(3)
export const ROW = 1.5
const NODE_ROW_H = 75 // vertical spacing of the workflow diagram, in its own units

export const cellWorld = (q, r) => ({ x: SQ3 * (q + r / 2), y: ROW * r })
export const cellKey = (q, r) => `${q},${r}`

export function hexCorners(x, y, radius = 1) {
  return Array.from({ length: 6 }, (_, k) => {
    const a = (Math.PI / 180) * (60 * k - 30)
    return { x: x + radius * Math.cos(a), y: y + radius * Math.sin(a) }
  })
}

// Nearest cell centre to a world point (for hover), within `within` radii, or null.
export function nearestCell(cells, x, y, within = 1) {
  let best = null
  let bestD = within
  for (const [id, c] of Object.entries(cells)) {
    const d = Math.hypot(c.x - x, c.y - y)
    if (d <= bestD) {
      best = id
      bestD = d
    }
  }
  return best
}

const boxOf = (pts, pad = 0) => {
  const xs = pts.map((p) => p.x)
  const ys = pts.map((p) => p.y)
  return { x0: Math.min(...xs) - pad, x1: Math.max(...xs) + pad, y0: Math.min(...ys) - pad, y1: Math.max(...ys) + pad }
}

// Tiles covering `box` (world units) as a rectangle of cells.
export function tilesFor(box) {
  const tiles = []
  const r0 = Math.round(box.y0 / ROW)
  const r1 = Math.round(box.y1 / ROW)
  for (let r = r0; r <= r1; r++) {
    const q0 = Math.ceil(box.x0 / SQ3 - r / 2 - 1e-9)
    const q1 = Math.floor(box.x1 / SQ3 - r / 2 + 1e-9)
    for (let q = q0; q <= q1; q++) tiles.push({ q, r, ...cellWorld(q, r) })
  }
  return tiles
}

// Maps workflow nodes to distinct cells. `compact` is the phone layout: fewer, larger columns.
export function layoutBoard(nodes, { compact = false } = {}) {
  const colW = compact ? 150 : 78
  const minY = Math.min(...nodes.map((n) => n.y))
  const taken = new Set()
  const cells = {}
  const order = [...nodes].sort((a, b) => a.y - b.y || a.x - b.x || (a.id < b.id ? -1 : 1))
  for (const n of order) {
    const tx = (n.x / colW) * SQ3
    const ty = ((n.y - minY) / NODE_ROW_H) * ROW
    const r0 = Math.round(ty / ROW)
    let best = null
    for (let r = r0 - 2; r <= r0 + 2; r++) {
      const q0 = Math.round(tx / SQ3 - r / 2)
      for (let q = q0 - 2; q <= q0 + 2; q++) {
        if (taken.has(cellKey(q, r))) continue
        const w = cellWorld(q, r)
        // Rows matter more than columns: the flow reads top to bottom.
        const d = Math.hypot(w.x - tx, (w.y - ty) * 1.6)
        if (!best || d < best.d - 1e-9) best = { q, r, d, ...w }
      }
    }
    taken.add(cellKey(best.q, best.r))
    cells[n.id] = { q: best.q, r: best.r, x: best.x, y: best.y }
  }
  const stations = boxOf(Object.values(cells))
  const tiles = tilesFor({ x0: stations.x0 - 1.1 * SQ3, x1: stations.x1 + 1.1 * SQ3, y0: stations.y0 - ROW, y1: stations.y1 + ROW })
  return { cells, tiles, stations, box: boxOf(tiles) }
}

const DIRS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]]

// Axial cells at hex distance k from (0,0).
export function ring(k) {
  if (k === 0) return [{ q: 0, r: 0 }]
  const out = []
  let q = DIRS[4][0] * k
  let r = DIRS[4][1] * k
  for (let side = 0; side < 6; side++) {
    for (let s = 0; s < k; s++) {
      out.push({ q, r })
      q += DIRS[side][0]
      r += DIRS[side][1]
    }
  }
  return out
}

// Clockwise order on screen (y down) from due west.
const psi = (c) => (((Math.atan2(c.y, c.x) - Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)

// "Agent at work": the context tray sits at the centre, every non-compaction stop takes a cell on the
// outer ring in order (clockwise from west), and the compaction glyph hex touches the tray on the east.
export function layoutJourney(journey) {
  const outer = ring(2).map((c) => ({ ...c, ...cellWorld(c.q, c.r) })).sort((a, b) => psi(a) - psi(b))
  const plain = journey.stops.filter((s) => s.kind !== 'compact').length
  const east = ring(1).map((c) => ({ ...c, ...cellWorld(c.q, c.r) })).sort((a, b) => Math.abs(psi(a) - Math.PI) - Math.abs(psi(b) - Math.PI))[0]
  const stops = []
  let n = 0
  journey.stops.forEach((stop, i) => {
    if (stop.kind === 'compact') {
      stops.push({ i, kind: 'compact', q: east.q, r: east.r, x: east.x, y: east.y })
      return
    }
    const c = outer[Math.floor((n * outer.length) / plain)]
    n++
    stops.push({ i, kind: stop.kind, q: c.q, r: c.r, x: c.x, y: c.y })
  })
  const stationsBox = boxOf([...stops, { x: 0, y: 0 }])
  const tiles = tilesFor({ x0: stationsBox.x0 - 1.2 * SQ3, x1: stationsBox.x1 + 1.2 * SQ3, y0: stationsBox.y0 - ROW, y1: stationsBox.y1 + ROW })
  return { stops, tray: { q: 0, r: 0, x: 0, y: 0 }, tiles, stations: stationsBox, box: boxOf(tiles) }
}
