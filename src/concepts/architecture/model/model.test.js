import { describe, expect, it } from 'vitest'
import { LAYER_COUNT, PORTS, SLAB, layerY, layers } from './layers.js'
import { layerGeometry } from './geometry.js'
import { iso, layerPaths, stackBounds } from './project.js'
import { GAP_MAX, GAP_MIN, cameraAngles, heroGap, heroParams, viewLabel } from './timeline.js'

describe('hero model', () => {
  it('has the five layers of brief 02 §14, top to bottom', () => {
    expect(layers.map((l) => l.id)).toEqual(['experience', 'services', 'api', 'data', 'infrastructure'])
    expect(LAYER_COUNT).toBe(5)
  })

  it('keeps every drawn point inside the slab', () => {
    const hw = SLAB.w / 2
    const hd = SLAB.d / 2
    for (const layer of layers) {
      const g = layerGeometry(layer)
      expect(g.flat.length).toBeGreaterThan(4)
      for (const [x1, z1, x2, z2] of g.flat) {
        for (const [x, z] of [[x1, z1], [x2, z2]]) {
          expect(Math.abs(x)).toBeLessThanOrEqual(hw + 1e-9)
          expect(Math.abs(z)).toBeLessThanOrEqual(hd + 1e-9)
        }
      }
      for (const [x1, y1, z1, x2, y2, z2] of g.raised) {
        expect(Math.min(y1, y2)).toBeGreaterThanOrEqual(0)
        expect(Math.max(y1, y2)).toBeLessThan(1)
        expect(Math.abs(x1)).toBeLessThanOrEqual(hw)
        expect(Math.abs(x2)).toBeLessThanOrEqual(hw)
        expect(Math.abs(z1)).toBeLessThanOrEqual(hd)
        expect(Math.abs(z2)).toBeLessThanOrEqual(hd)
      }
    }
  })

  it('draws the slab outline first so it plots first', () => {
    const g = layerGeometry(layers[0])
    const xs = g.flat.slice(0, 4).flatMap(([x1, , x2]) => [Math.abs(x1), Math.abs(x2)])
    expect(Math.max(...xs)).toBe(SLAB.w / 2)
  })

  it('puts every shared port inside a solid of its layer (a connector never floats in empty space)', () => {
    for (const layer of layers) {
      const hit = PORTS.map(([px, pz]) =>
        layer.prims.some((p) => {
          if (p.t === 'rect') return Math.abs(px - p.x) <= p.w / 2 && Math.abs(pz - p.z) <= p.d / 2
          if (p.t === 'cyl') return Math.hypot(px - p.x, pz - p.z) <= p.r
          return false
        }),
      )
      expect(hit.every(Boolean), `${layer.id} ports ${hit}`).toBe(true)
    }
  })

  it('stacks layers upward with the top layer highest', () => {
    expect(layerY(0, 2)).toBeGreaterThan(layerY(1, 2))
    expect(layerY(LAYER_COUNT - 1, 2)).toBe(0)
  })
})

describe('axonometric projection', () => {
  it('turns a lift in y into a pure vertical screen translation', () => {
    const [x0, y0] = iso(1, 0, 2)
    const [x1, y1] = iso(1, 3, 2)
    expect(x1).toBeCloseTo(x0)
    expect(y0 - y1).toBeCloseTo(3)
  })

  it('produces path data for every layer, and the flat plan has no relief', () => {
    for (const layer of layers) {
      const flat = layerPaths(layer, { depth: 0 })
      const full = layerPaths(layer, { depth: 1 })
      expect(flat.flat).toBe(full.flat)
      expect(flat.raised).not.toBe(full.raised)
      expect(full.slab.endsWith('Z')).toBe(true)
    }
  })

  it('bounds contain the projected slab corners', () => {
    const b = stackBounds({ gap: GAP_MAX, k: 10 })
    const [sx] = iso(SLAB.w / 2, 0, -SLAB.d / 2, 10)
    expect(sx).toBeLessThan(b.x + b.w)
    expect(b.w).toBeGreaterThan(0)
    expect(b.h).toBeGreaterThan(0)
  })
})

describe('hero timeline', () => {
  it('starts as a closed plan and ends open, tilted and dollied', () => {
    const a = heroParams(0)
    expect(a).toEqual({ connect: 0, lift: 0, depth: 0, tilt: 0, labels: 0, dolly: 0 })
    const b = heroParams(1)
    expect(Object.values(b).every((v) => v === 1)).toBe(true)
  })

  it('never decreases as the visitor scrolls down', () => {
    let prev = heroParams(0)
    for (let p = 0.01; p <= 1; p += 0.01) {
      const cur = heroParams(p)
      for (const k of Object.keys(cur)) expect(cur[k]).toBeGreaterThanOrEqual(prev[k] - 1e-12)
      prev = cur
    }
  })

  it('lifts before it dollies, and shows labels only once the layers are mostly apart', () => {
    const early = heroParams(0.3)
    expect(early.lift).toBeGreaterThan(0.3)
    expect(early.dolly).toBe(0)
    expect(heroParams(0.4).labels).toBe(0)
  })

  it('maps tilt to a real camera: straight down in plan, isometric when open', () => {
    expect(cameraAngles(0).elevation).toBe(90)
    expect(cameraAngles(1).elevation).toBeCloseTo(35.264)
    expect(cameraAngles(1).azimuth).toBe(45)
    expect(viewLabel(0)).toBe('Plan')
    expect(viewLabel(0.5)).toBe('Transition')
    expect(viewLabel(1)).toBe('Axonometric')
  })

  it('keeps layers apart by a small gap even when closed (no z-fighting)', () => {
    expect(heroGap(0)).toBe(GAP_MIN)
    expect(heroGap(1)).toBe(GAP_MAX)
  })
})
