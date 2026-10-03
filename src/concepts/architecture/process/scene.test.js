import { describe, expect, it } from 'vitest'
import { process as content } from '../content.js'
import { copy } from './copy.js'
import { GAPS, GAP_OPEN, SIZES, STAGE_COUNT, allItems, buildScene } from './scene.js'

const sizes = Object.keys(SIZES)

describe('process scene', () => {
  it('has the six stages of the brief and a gap schedule for each', () => {
    expect(STAGE_COUNT).toBe(content.stages.length)
    expect(GAPS).toHaveLength(STAGE_COUNT)
    // flat, tight stack, open, open, locked, locked
    expect(GAPS[2]).toBe(GAP_OPEN)
    expect(GAPS[4]).toBeLessThan(GAPS[3])
    expect(GAPS[0]).toBeLessThan(GAPS[1])
  })

  for (const size of sizes) {
    describe(`size ${size}`, () => {
      const scene = buildScene(size)
      const items = allItems(scene)

      it('is cumulative: every item has a valid stage window', () => {
        for (const it of items) {
          expect(Number.isInteger(it.from), JSON.stringify(it).slice(0, 80)).toBe(true)
          expect(it.from).toBeGreaterThanOrEqual(0)
          expect(it.from).toBeLessThan(STAGE_COUNT)
          if (it.until != null) expect(it.until).toBeGreaterThanOrEqual(it.from)
          if (it.rest != null) {
            expect(it.rest).toBeGreaterThanOrEqual(0)
            expect(it.rest).toBeLessThanOrEqual(1)
          }
        }
      })

      it('adds something at every stage', () => {
        for (let s = 0; s < STAGE_COUNT; s++) {
          expect(items.filter((it) => it.from === s).length, `stage ${s}`).toBeGreaterThan(3)
        }
      })

      it('starts with six empty dashed nodes (Discover)', () => {
        const nodes = items.filter((it) => it.t === 'path' && it.c === 'dash' && it.until === 0)
        expect(nodes).toHaveLength(6)
        // ...which become solid at Architect
        const solid = items.filter((it) => it.t === 'path' && it.c === 'ln' && it.from === 1 && it.draw)
        expect(solid.length).toBeGreaterThanOrEqual(6)
      })

      it('draws one symbolic yellow dimension per stage, labelled with the stage word from content', () => {
        expect(scene.dims.map((d) => d.label)).toEqual(content.stages.map((s) => s.dim))
        expect(scene.dims.map((d) => d.stage)).toEqual([0, 1, 2, 3, 4, 5])
        for (const stage of [0, 1, 2, 3, 4, 5]) {
          const lines = items.filter((it) => it.t === 'path' && it.c === 'sig' && it.from === stage)
          expect(lines.length, `stage ${stage}`).toBeGreaterThan(0)
        }
      })

      it('has four slabs that lift (Engineer) and boxes that extrude with them', () => {
        expect(scene.slabs).toHaveLength(4)
        const rises = items.filter((it) => it.t === 'rise' && it.from === 2)
        expect(rises.length).toBeGreaterThan(20)
        for (const r of rises) expect(r.h).toBeGreaterThan(0)
      })

      it('brings external systems in at Integrate and extends the structure at Scale', () => {
        const groups = items.filter((it) => it.t === 'g')
        expect(groups).toHaveLength(1)
        expect(groups[0].from).toBe(3)
        expect(groups[0].children.filter((c) => c.t === 'rise')).toHaveLength(copy.externals.length)
        expect(items.filter((it) => it.t === 'rise' && it.from === 5).length).toBeGreaterThanOrEqual(8)
      })

      it('closes a frame at Deploy', () => {
        expect(items.filter((it) => it.c === 'frame' && it.from === 4).length).toBe(12)
        expect(items.filter((it) => it.c === 'mark' && it.from === 4).length).toBeGreaterThanOrEqual(8)
      })

      it('keeps the drawing inside its view box, labels included', () => {
        const { viewBox } = scene
        expect(viewBox.w).toBeGreaterThan(200)
        expect(viewBox.h).toBeGreaterThan(200)
        const near = (x, y, lift = 0) => {
          expect(x).toBeGreaterThanOrEqual(viewBox.x)
          expect(x).toBeLessThanOrEqual(viewBox.x + viewBox.w)
          expect(y - lift).toBeGreaterThanOrEqual(viewBox.y)
          expect(y).toBeLessThanOrEqual(viewBox.y + viewBox.h)
        }
        scene.slabs.forEach((list, i) => {
          const lift = (3 - i) * GAP_OPEN * scene.K
          for (const it of list) {
            if (it.t !== 'path') continue
            const n = it.d.match(/-?\d+(?:\.\d+)?/g).map(Number)
            for (let k = 0; k + 1 < n.length; k += 2) near(n[k], n[k + 1], lift)
          }
        })
        for (const it of [...scene.ground, ...scene.top]) {
          if (it.t !== 'path') continue
          const n = it.d.match(/-?\d+(?:\.\d+)?/g).map(Number)
          for (let k = 0; k + 1 < n.length; k += 2) near(n[k], n[k + 1])
        }
      })

      it('writes only known words on the drawing, and no digits', () => {
        const allowed = new Set([
          ...content.stages.map((s) => s.dim),
          ...copy.layers,
          ...copy.externals,
          ...copy.axes.columns,
          ...copy.axes.rows,
          copy.api,
          copy.north,
          copy.locked,
          copy.newModules,
          copy.note.open,
          copy.note.fixed,
        ])
        for (const it of items.filter((x) => x.t === 'text')) {
          const line = it.lines.join(' ')
          expect(allowed.has(line), line).toBe(true)
          if (!copy.axes.rows.includes(line)) expect(/[0-9]/.test(line), line).toBe(false)
        }
      })

      it('crops each stage to what it shows', () => {
        expect(scene.viewBoxes).toHaveLength(STAGE_COUNT)
        for (const vb of scene.viewBoxes) {
          expect(vb.w).toBeLessThanOrEqual(scene.viewBox.w)
          expect(vb.h).toBeLessThanOrEqual(scene.viewBox.h)
        }
      })
    })
  }

  it('keeps the stacked drawing narrow enough for 11 px labels in a 350 px column', () => {
    const sm = buildScene('sm')
    for (const vb of sm.viewBoxes) {
      expect(vb.w, JSON.stringify(vb)).toBeLessThanOrEqual(Math.floor((sm.fs * 350) / 11))
      expect(vb.w).toBeGreaterThanOrEqual(340)
    }
    expect(sm.viewBox.w).toBeLessThan(buildScene('lg').viewBox.w)
  })

  it('draws no compact-only omissions: the large drawing carries the extra labels', () => {
    const count = (size) => allItems(buildScene(size)).filter((it) => it.t === 'text').length
    expect(count('lg')).toBeGreaterThan(count('sm'))
  })
})
