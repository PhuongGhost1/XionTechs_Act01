import { describe, expect, it } from 'vitest'
import { PORT_X, SLAB, layers } from '../../model/layers.js'
import { cachedGeometry } from '../../model/geometry.js'
import { connectorSegments, flatSegments, layerData, markerEdges, markerTriangles, raisedSegments } from './build.js'

describe('hero scene vertex data', () => {
  it('has one segment of six floats per model segment, for every layer', () => {
    for (const layer of layers) {
      const g = cachedGeometry(layer)
      expect(flatSegments(layer)).toHaveLength(g.flat.length * 6)
      expect(raisedSegments(layer)).toHaveLength(g.raised.length * 6)
    }
    expect(layerData).toHaveLength(layers.length)
  })

  it('starts every layer with the slab outline, so it plots first', () => {
    for (const layer of layers) {
      const flat = flatSegments(layer)
      for (let s = 0; s < 4; s += 1) {
        for (const k of [0, 3]) {
          expect(Math.abs(flat[s * 6 + k])).toBeLessThanOrEqual(SLAB.w / 2)
          expect(flat[s * 6 + 1]).toBe(0)
        }
      }
      // the outline touches the slab edge
      expect(Math.max(...Array.from({ length: 4 }, (_, s) => Math.abs(flat[s * 6])))).toBe(SLAB.w / 2)
    }
  })

  it('keeps flat linework on the plane and the extrusions above it', () => {
    for (const layer of layers) {
      const flat = flatSegments(layer)
      for (let i = 1; i < flat.length; i += 3) expect(flat[i]).toBe(0)
      const raised = raisedSegments(layer)
      for (let i = 1; i < raised.length; i += 3) {
        expect(raised[i]).toBeGreaterThanOrEqual(0)
        expect(raised[i]).toBeLessThan(1)
      }
    }
  })

  it('builds four marker squares: two triangles and four edges each', () => {
    expect(markerTriangles()).toHaveLength(PORT_X.length * 2 * 3 * 3)
    expect(markerEdges()).toHaveLength(PORT_X.length * 4 * 6)
  })

  it('builds one connector per port, hanging one unit below its start', () => {
    const c = connectorSegments()
    expect(c).toHaveLength(PORT_X.length * 6)
    for (let s = 0; s < PORT_X.length; s += 1) {
      expect(c[s * 6]).toBeCloseTo(PORT_X[s], 5)
      expect(c[s * 6 + 1]).toBe(0)
      expect(c[s * 6 + 4]).toBe(-1)
    }
  })
})
