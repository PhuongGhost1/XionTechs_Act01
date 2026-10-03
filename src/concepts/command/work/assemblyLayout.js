// Geometry of the StaffXP assembly sequence, in SVG user units. Two layouts share one data shape:
// "wide" runs left to right, "tall" runs top to bottom for phones. Pure, so tests can check that
// every element fits the viewBox and no two nodes overlap.

const line = (x1, y1, x2, y2) => (x1 === x2 ? `M${x1} ${y1}V${y2}` : `M${x1} ${y1}H${x2}`)

export function assemblyLayout(mode, count, shot) {
  const ratio = shot.height / shot.width
  if (mode === 'wide') {
    const W = 760
    const H = 300
    const nodeW = 170
    const nodeH = 44
    const gap = 24
    const total = count * nodeH + (count - 1) * gap
    const top = Math.round((H - total) / 2)
    const nodeX = 190
    const spineL = 180
    const spineR = 420
    const nodes = Array.from({ length: count }, (_, i) => {
      const y = top + i * (nodeH + gap)
      const cy = y + nodeH / 2
      return {
        x: nodeX, y, w: nodeW, h: nodeH, cy,
        stubL: line(spineL, cy, nodeX, cy),
        stubR: line(nodeX + nodeW, cy, spineR, cy),
      }
    })
    const first = nodes[0].cy
    const last = nodes[count - 1].cy
    const mid = Math.round((first + last) / 2)
    const imgW = 270
    const imgH = Math.round(imgW * ratio)
    const image = { x: 470, y: Math.round(mid - imgH / 2), w: imgW, h: imgH }
    return {
      mode, W, H, nodes, image,
      req: { x: 40, y: mid },
      reqLabel: { x: 20, y: mid - 20 },
      entry: line(40, mid, spineL, mid),
      packet: { dx: spineL - 40, dy: 0 },
      spineL: line(spineL, first, spineL, last),
      spineR: line(spineR, first, spineR, last),
      out: line(spineR, mid, image.x, mid),
      state: { x: image.x, y: image.y + imgH + 28 },
    }
  }
  const W = 360
  const nodeW = 206
  const nodeH = 40
  const gap = 14
  const nodeX = 24
  const spineL = 10
  const spineR = 250
  const topY = 72
  const nodes = Array.from({ length: count }, (_, i) => {
    const y = topY + i * (nodeH + gap)
    const cy = y + nodeH / 2
    return {
      x: nodeX, y, w: nodeW, h: nodeH, cy,
      stubL: line(spineL, cy, nodeX, cy),
      stubR: line(nodeX + nodeW, cy, spineR, cy),
    }
  })
  const first = nodes[0].cy
  const last = nodes[count - 1].cy
  const imgW = W - 2 * nodeX
  const imgH = Math.round(imgW * ratio)
  const image = { x: nodeX, y: last + nodeH / 2 + 26, w: imgW, h: imgH }
  return {
    mode, W, H: image.y + imgH + 44, nodes, image,
    req: { x: spineL, y: 24 },
    reqLabel: { x: 26, y: 28 },
    entry: line(spineL, 24, spineL, first),
    packet: { dx: 0, dy: first - 24 },
    spineL: line(spineL, first, spineL, last),
    spineR: line(spineR, first, spineR, last),
    out: line(spineR, last, spineR, image.y),
    state: { x: image.x, y: image.y + imgH + 26 },
  }
}
