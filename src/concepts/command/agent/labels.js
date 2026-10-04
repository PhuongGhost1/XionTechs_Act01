// Label placement for the billboards over the board. Pure: given each label's anchor (screen px), size
// and priority, pick a side and a small vertical nudge so labels never sit on top of each other.
export function placeLabels(items, { hw = 40, gap = 8, width, height }) {
  const placed = []
  const out = {}
  const overlap = (a, b) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0
  const sorted = [...items].sort((a, b) => b.priority - a.priority || a.y - b.y || (a.id < b.id ? -1 : 1))
  for (const it of sorted) {
    const { w, h } = it.size
    const rect = (side, dy) => {
      const x0 = side === 'r' ? it.x + hw + gap : it.x - hw - gap - w
      return { x0, x1: x0 + w, y0: it.y + dy - h / 2, y1: it.y + dy + h / 2 }
    }
    const order = it.prefer === 'l' ? ['l', 'r'] : ['r', 'l']
    let best = null
    for (const dy of [0, h * 0.8, -h * 0.8, h * 1.6, -h * 1.6]) {
      for (const side of order) {
        const r = rect(side, dy)
        if (r.x0 < 2 || r.x1 > width - 2 || r.y0 < 2 || r.y1 > height - 2) continue
        if (placed.some((p) => overlap(p, r))) continue
        best = { side, dy, r }
        break
      }
      if (best) break
    }
    if (!best) best = { side: order[0], dy: 0, r: rect(order[0], 0) }
    placed.push(best.r)
    out[it.id] = { side: best.side, dy: best.dy }
  }
  return out
}
