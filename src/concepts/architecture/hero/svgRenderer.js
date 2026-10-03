import { LAYER_COUNT, layers } from '../model/layers.js'
import { lerp } from './camera.js'
import { connectorPath, flatPath, markerPath, raisedPath, slabPath } from './paths.js'

// Writes one frame into the hero's SVG. Level 1/2 of the fallback ladder: this is what paints first and what
// stays on phones, under reduced motion, without WebGL and on low-power devices. Only `d` attributes and a few
// positions are written; React does not re-render.

export const TRAIL = 0.9 // length of the signal's tail, in world units

// How strongly a layer's linework shows. The top layer is always fully drawn; the layers beneath it are
// ghosted while the stack is closed (as through tracing paper) and come up as the layers separate.
export const layerInk = (index, lift) => (index === 0 ? 1 : lerp(0.5, 1, lift))

export function svgRenderer(svg) {
  const pick = (sel) => svg.querySelector(sel)
  const parts = Array.from({ length: LAYER_COUNT }, (_, i) => ({
    paper: pick(`[data-layer="${i}"] [data-k="paper"]`),
    slab: pick(`[data-layer="${i}"] [data-k="slab"]`),
    flat: pick(`[data-layer="${i}"] [data-k="flat"]`),
    raised: pick(`[data-layer="${i}"] [data-k="raised"]`),
    marker: pick(`[data-layer="${i}"] [data-k="marker"]`),
  }))
  const conns = Array.from({ length: LAYER_COUNT - 1 }, (_, i) => pick(`[data-k="conn"][data-i="${i}"]`))
  const sig = { trail: pick('[data-k="trail"]'), mark: pick('[data-k="mark"]'), g: pick('[data-k="signal"]') }
  let wasGl = false

  function drawSignal(f) {
    const s = f.signal
    const project = f.cam.project
    const [x, y] = project(s.x, s.y, 0)
    const top = Math.min(s.y + TRAIL, f.ys[0])
    const [tx, ty] = project(s.x, top, 0)
    sig.g.style.opacity = s.alpha.toFixed(3)
    sig.mark.setAttribute('x', (x - 4).toFixed(1))
    sig.mark.setAttribute('y', (y - 4).toFixed(1))
    sig.trail.setAttribute('d', `M${tx.toFixed(1)} ${ty.toFixed(1)}L${x.toFixed(1)} ${y.toFixed(1)}`)
  }

  return {
    render(f) {
      if (f.gl) {
        wasGl = true
        return
      }
      const full = f.dirty || wasGl
      wasGl = false
      if (full) {
        svg.setAttribute('viewBox', `0 0 ${f.W} ${f.H}`)
        const project = f.cam.project
        for (let i = 0; i < LAYER_COUNT; i += 1) {
          const y = f.ys[i]
          const p = parts[i]
          const slab = slabPath(y, project)
          p.paper.setAttribute('d', slab)
          p.slab.setAttribute('d', slab)
          p.flat.setAttribute('d', flatPath(layers[i], y, project))
          p.raised.setAttribute('d', raisedPath(layers[i], y, f.params.depth, project))
          p.marker.setAttribute('d', markerPath(y, project))
          const ink = layerInk(i, f.params.lift).toFixed(3)
          p.flat.style.opacity = ink
          p.raised.style.opacity = ink
          // .bp-fade owns the marker's opacity (it fades in on load), so the ink goes into the paint opacities
          p.marker.style.fillOpacity = ink
          p.marker.style.strokeOpacity = ink
          if (i < LAYER_COUNT - 1) conns[i].setAttribute('d', connectorPath(y, f.ys[i + 1], f.params.connect, project))
        }
      }
      drawSignal(f)
    },
  }
}
