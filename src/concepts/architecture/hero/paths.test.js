import { describe, expect, it } from 'vitest'
import { LAYER_COUNT, PORT_X, layers } from '../model/layers.js'
import { cameraPose } from './camera.js'
import { connectorPath, flatPath, markerPath, raisedPath, slabPath } from './paths.js'

const pose = cameraPose({ elevation: 35.264, azimuth: 45, gap: 2.2, W: 700, H: 760 })
const { project } = pose
const count = (s, ch) => s.split(ch).length - 1
const numbers = (s) => (s.match(/-?\d+(\.\d+)?/g) || []).map(Number)

describe('hero SVG paths', () => {
  it('draws every layer as finite coordinates', () => {
    for (const layer of layers) {
      for (const d of [flatPath(layer, 0, project), raisedPath(layer, 0, 1, project), slabPath(0, project), markerPath(0, project)]) {
        expect(d.length).toBeGreaterThan(10)
        for (const n of numbers(d)) expect(Number.isFinite(n)).toBe(true)
      }
    }
  })

  it('closes the slab outline and gives each port marker its own closed square', () => {
    expect(slabPath(0, project).endsWith('Z')).toBe(true)
    expect(count(markerPath(0, project), 'Z')).toBe(PORT_X.length)
  })

  it('chains consecutive segments, so rectangles are polylines rather than loose strokes', () => {
    const layer = layers[0]
    const d = flatPath(layer, 0, project)
    const segments = count(d, 'L')
    expect(count(d, 'M')).toBeLessThan(segments)
  })

  it('draws no relief while the drawing is flat, and a lot of it once it has depth', () => {
    for (const layer of layers) {
      expect(raisedPath(layer, 0, 0, project)).toBe('')
      expect(raisedPath(layer, 0, 1, project).length).toBeGreaterThan(50)
    }
  })

  it('lifts the top of an extrusion up the screen as depth grows', () => {
    const layer = layers[1]
    const low = numbers(raisedPath(layer, 0, 0.3, project))
    const high = numbers(raisedPath(layer, 0, 1, project))
    const minY = (ns) => Math.min(...ns.filter((_, i) => i % 2 === 1))
    expect(minY(high)).toBeLessThan(minY(low))
  })

  it('grows the connectors from the upper layer down as connect rises, one per port', () => {
    expect(connectorPath(4.4, 2.2, 0, project)).toBe('')
    expect(connectorPath(4.4, 4.4, 1, project)).toBe('')
    const half = connectorPath(4.4, 2.2, 0.5, project)
    const full = connectorPath(4.4, 2.2, 1, project)
    expect(count(full, 'M')).toBe(PORT_X.length)
    const lastY = (d) => numbers(d).at(-1)
    expect(lastY(full)).toBeGreaterThan(lastY(half))
  })

  it('keeps the model data and the drawing in step: five layers', () => {
    expect(layers).toHaveLength(LAYER_COUNT)
  })
})
