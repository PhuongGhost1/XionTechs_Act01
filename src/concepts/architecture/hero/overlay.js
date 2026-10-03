import { LAYER_COUNT } from '../model/layers.js'
import { COMPACT_BELOW } from './camera.js'

// Writes one frame into the hero's DOM overlay: layer labels with leader lines, the live camera readout, the
// two dimension lines and the axis triad. Crisp text above whichever renderer is showing. It only writes when
// the frame is dirty (scroll, resize, mode), and only the values that changed, so it costs almost nothing.

const TRIAD = 22 // px length of the triad's unit axis

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v)
const px = (n) => `${n.toFixed(1)}px`

export function overlayRenderer(root) {
  const labels = Array.from({ length: LAYER_COUNT }, (_, i) => root.querySelector(`[data-label="${i}"]`))
  const leaders = Array.from({ length: LAYER_COUNT }, (_, i) => root.querySelector(`[data-leader="${i}"]`))
  const dots = Array.from({ length: LAYER_COUNT }, (_, i) => root.querySelector(`[data-dot="${i}"]`))
  const hud = {
    view: root.querySelector('[data-hud="view"]'),
    elev: root.querySelector('[data-hud="elev"]'),
    az: root.querySelector('[data-hud="az"]'),
  }
  const dimX = root.querySelector('[data-dim="x"]')
  const dimXLabel = dimX.querySelector('.bp-dim__label')
  const dimY = root.querySelector('[data-dim="y"]')
  const ext = {
    xa: root.querySelector('[data-ext="xa"]'),
    xb: root.querySelector('[data-ext="xb"]'),
    ya: root.querySelector('[data-ext="ya"]'),
    yb: root.querySelector('[data-ext="yb"]'),
  }
  const triad = {
    g: root.querySelector('[data-triad]'),
    end: root.querySelector('[data-axis-end]'),
    axes: ['X', 'Y', 'Z'].map((id) => ({
      line: root.querySelector(`[data-axis="${id}"]`),
      text: root.querySelector(`[data-axis-label="${id}"]`),
    })),
  }
  const last = {}
  const setText = (key, el, value) => {
    if (last[key] !== value) {
      last[key] = value
      el.textContent = value
    }
  }
  const line = (el, x1, y1, x2, y2) => {
    el.setAttribute('x1', x1.toFixed(1))
    el.setAttribute('y1', y1.toFixed(1))
    el.setAttribute('x2', x2.toFixed(1))
    el.setAttribute('y2', y2.toFixed(1))
  }

  return {
    render(f) {
      if (!f.dirty) return
      const compact = f.W < COMPACT_BELOW
      root.dataset.compact = compact ? 'true' : 'false'

      setText('view', hud.view, f.view.label)
      setText('elev', hud.elev, `${f.view.elevation.toFixed(1)}°`)
      setText('az', hud.az, `${f.view.azimuth.toFixed(1)}°`)

      // Layer labels and leaders, in a column to the right of the model.
      const a = compact ? 0 : f.params.labels
      for (let i = 0; i < LAYER_COUNT; i += 1) {
        const [ax, ay] = f.anchors[i]
        const ly = f.labelYs[i]
        labels[i].style.opacity = a.toFixed(3)
        labels[i].style.transform = `translate(${px(f.labelX)}, ${px(ly - 9)})`
        leaders[i].style.opacity = a.toFixed(3)
        line(leaders[i], ax + 5, ay, f.labelX - 8, ly)
        dots[i].setAttribute('cx', ax.toFixed(1))
        dots[i].setAttribute('cy', ay.toFixed(1))
        dots[i].style.opacity = a.toFixed(3)
      }

      // Horizontal dimension: the bottom slab's width, measured on the drawing as it is rendered.
      const d = f.dims
      const width = d.x1 - d.x0
      const ty = d.y + 34
      dimX.style.transform = `translate(${px(d.x0)}, ${px(ty - 11)})`
      dimX.style.width = px(width)
      setText('dimx', dimXLabel, `${Math.round(width)} px`)
      line(ext.xa, d.x0, d.y0 + 6, d.x0, ty + 8)
      line(ext.xb, d.x1, d.y1 + 6, d.x1, ty + 8)

      // Vertical dimension: the stack from the top layer to the bottom one, only once it has height.
      const dh = d.bottomY - d.top
      const dx = d.left - 34
      const va = compact ? 0 : clamp01((dh - 50) / 70)
      dimY.style.transform = `translate(${px(dx - 11)}, ${px(d.top)})`
      dimY.style.height = px(Math.max(0, dh))
      dimY.style.opacity = va.toFixed(3)
      line(ext.ya, d.left - 6, d.top, dx + 8, d.top)
      line(ext.yb, d.left - 6, d.bottomY, dx + 8, d.bottomY)
      ext.ya.style.opacity = va.toFixed(3)
      ext.yb.style.opacity = va.toFixed(3)

      // Axis triad: the three world axes seen through the current camera (the live camera, not a picture of it).
      const ox = 250 // beside the readout, so the instruments sit together and the model keeps the corners
      const oy = 44
      triad.g.setAttribute('transform', `translate(${ox.toFixed(1)} ${oy})`)
      triad.end.style.opacity = '0'
      f.triad.forEach((axis, i) => {
        const [vx, vy] = axis.v
        const len = Math.hypot(vx, vy)
        const tip = len < 0.04 ? [0, 0] : [vx * TRIAD, vy * TRIAD]
        line(triad.axes[i].line, 0, 0, tip[0], tip[1])
        const t = triad.axes[i].text
        // A label sits just beyond its axis tip; an axis seen end-on (Y in plan) sits at the origin, offset right.
        const endOn = len < 0.04
        if (endOn) triad.end.style.opacity = '1'
        const lx = endOn ? -15 : tip[0] + (vx / (len || 1)) * 9 - 4
        const ly = endOn ? -7 : tip[1] + (vy / (len || 1)) * 9 + 4
        t.setAttribute('x', lx.toFixed(1))
        t.setAttribute('y', ly.toFixed(1))
      })
    },
  }
}
