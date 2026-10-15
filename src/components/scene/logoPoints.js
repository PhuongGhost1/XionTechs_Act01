// Samples the logo into target points for the finale (docs/concepts/01-command-implementation.md
// §5, "Logo"). The page's particles converge onto the opaque pixels of the real logo image.
//
// Unit space of the result: the image is 1 wide and centred on the origin, y points up, the aspect
// is preserved, so a point's pixel position is x * logoWidthPx. `yellow` marks the signal-colour
// pixels (the red channel dominates) so the finale keeps them yellow.

const ALPHA_MIN = 110 // anti-aliased fringe below this is left out so the letters stay crisp

// Picks about `maxPoints` pixels from a w x h mask (1 = opaque, 0 = empty), evenly spread: the
// image is cut into square cells, the cell size is searched so that the number of non-empty cells
// is as large as possible without exceeding `maxPoints`, and each non-empty cell contributes the
// opaque pixel nearest to the mean of its opaque pixels. Even spacing is what keeps thin letters
// readable with a few hundred dots. Returns pixel indices (y * w + x). Pure.
export function pickPoints(mask, w, h, maxPoints) {
  const opaque = []
  for (let i = 0; i < w * h; i++) if (mask[i]) opaque.push(i)
  if (opaque.length === 0 || !(maxPoints > 0)) return []
  if (opaque.length <= maxPoints) return opaque

  const cellsOf = (size) => {
    const cols = Math.ceil(w / size)
    const cells = new Map()
    for (const i of opaque) {
      const key = Math.floor(((i / w) | 0) / size) * cols + Math.floor((i % w) / size)
      let cell = cells.get(key)
      if (!cell) cells.set(key, (cell = { sx: 0, sy: 0, n: 0, members: [] }))
      cell.sx += i % w
      cell.sy += (i / w) | 0
      cell.n++
      cell.members.push(i)
    }
    return cells
  }

  // The count only ever shrinks as the cells grow: bisect for the smallest size that fits.
  let lo = 1
  let hi = Math.max(w, h)
  for (let step = 0; step < 14 && hi - lo > 0.05; step++) {
    const mid = (lo + hi) / 2
    if (cellsOf(mid).size > maxPoints) lo = mid
    else hi = mid
  }

  const picked = []
  for (const cell of cellsOf(hi).values()) {
    const mx = cell.sx / cell.n
    const my = cell.sy / cell.n
    let best = cell.members[0]
    let bestD = Infinity
    for (const i of cell.members) {
      const d = ((i % w) - mx) ** 2 + (((i / w) | 0) - my) ** 2
      if (d < bestD) {
        bestD = d
        best = i
      }
    }
    picked.push(best)
  }
  return picked
}

// Loads `src`, reads its pixels through an offscreen canvas and returns [{ x, y, yellow }] in unit
// space. Resolves to [] on any failure (image error, tainted canvas, no 2D context), so the caller
// can fall back to the generic X.
export function sampleLogoPoints(src, { maxPoints = 400 } = {}) {
  return new Promise((resolve) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onerror = () => resolve([])
    image.onload = () => {
      try {
        const w = image.naturalWidth
        const h = image.naturalHeight
        if (!w || !h) return resolve([])
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (!ctx) return resolve([])
        ctx.drawImage(image, 0, 0)
        const data = ctx.getImageData(0, 0, w, h).data // throws on a tainted canvas
        const mask = new Uint8Array(w * h)
        for (let i = 0; i < w * h; i++) mask[i] = data[i * 4 + 3] >= ALPHA_MIN ? 1 : 0
        resolve(
          pickPoints(mask, w, h, maxPoints).map((i) => {
            const r = data[i * 4]
            const b = data[i * 4 + 2]
            return {
              x: ((i % w) + 0.5 - w / 2) / w,
              y: (h / 2 - ((i / w) | 0) - 0.5) / w,
              yellow: r > 150 && r - b > 70,
            }
          }),
        )
      } catch {
        resolve([])
      }
    }
    image.src = src
  })
}
