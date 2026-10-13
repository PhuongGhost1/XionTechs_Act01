import { describe, expect, it } from 'vitest'
import { EXPLODE_GAP, ROAD, buildCampusModel, buildingServices, floorLift, inside, rng, roomServices, roomsByFloor } from './model'

const model = buildCampusModel()
const overlap = (a, b) => a.x[0] < b.x[1] && b.x[0] < a.x[1] && a.z[0] < b.z[1] && b.z[0] < a.z[1]
const within = (inner, outer) => inner.x[0] >= outer.x[0] && inner.x[1] <= outer.x[1] && inner.z[0] >= outer.z[0] && inner.z[1] <= outer.z[1]

describe('buildCampusModel', () => {
  it('keeps every building and room inside the plot', () => {
    for (const o of [...model.buildings, ...model.rooms]) expect(within(o, model.frame), o.id).toBe(true)
  })
  it('keeps indoor buildings, open-air zones and the road apart', () => {
    const solid = [
      ...model.buildings.filter((b) => !b.outdoor),
      ...model.rooms.filter((r) => r.outdoor),
      { id: 'road', ...ROAD },
    ]
    for (let i = 0; i < solid.length; i++) for (let j = i + 1; j < solid.length; j++) {
      expect(overlap(solid[i], solid[j]), `${solid[i].id} / ${solid[j].id}`).toBe(false)
    }
  })
  it('keeps indoor rooms inside their building, and rooms on one floor apart', () => {
    for (const b of model.buildings.filter((x) => !x.outdoor)) {
      const floors = roomsByFloor(model, b.id)
      for (const floor of floors) {
        for (const r of floor) expect(within(r, b), r.id).toBe(true)
        for (let i = 0; i < floor.length; i++) for (let j = i + 1; j < floor.length; j++) expect(overlap(floor[i], floor[j])).toBe(false)
      }
    }
  })
  it('stacks floors: a room spans its own storey', () => {
    const a = model.byId['classroom-a']
    const b = model.byId.teaching
    expect(a.y).toEqual([b.floorHeight, 2 * b.floorHeight])
    expect(model.byId['science-lab'].y[0]).toBe(0)
    expect(model.frame.y[1]).toBe(b.height)
  })
  it('puts every device pin inside its room', () => {
    for (const r of model.rooms) {
      expect(r.devices).toHaveLength(r.kinds.length)
      for (const d of r.devices) {
        expect(inside(d.pos[0], d.pos[2], r), d.id).toBe(true)
        if (!r.outdoor) expect(d.pos[1] > r.y[0] && d.pos[1] < r.y[1]).toBe(true)
      }
    }
    expect(new Set(model.devices.map((d) => d.id)).size).toBe(model.devices.length)
  })
  it('seats at most the capacity, inside the room, only where people sit', () => {
    for (const r of model.rooms) {
      expect(r.seats.length).toBeLessThanOrEqual(r.capacity)
      for (const [x, z] of r.seats) expect(inside(x, z, r), r.id).toBe(true)
    }
    expect(model.byId['classroom-a'].seats).toHaveLength(model.byId['classroom-a'].capacity)
    expect(model.byId['server-room'].seats).toHaveLength(0)
    expect(model.byId.park.seats).toHaveLength(0)
  })
})

describe('decor', () => {
  it('is the same on every build', () => {
    expect(buildCampusModel().decor).toEqual(model.decor)
    const a = rng(7)
    const b = rng(7)
    expect([a(), a(), a()]).toEqual([b(), b(), b()])
  })
  it('never plants a tree in a building, a zone, a path or the road', () => {
    const { trees } = model.decor
    expect(trees.length).toBeGreaterThan(20)
    const park = model.byId.park
    for (const [x, z] of trees) {
      const hit = model.blocked.find((b) => inside(x, z, b) && b.id !== 'park')
      expect(hit?.id, `${x.toFixed(1)}, ${z.toFixed(1)}`).toBeUndefined()
      if (inside(x, z, park)) expect(model.blocked.some((b) => b.id.startsWith('path') && inside(x, z, b))).toBe(false)
    }
  })
  it('has a parking bay for every car-park space', () => {
    const lot = model.byId['car-park']
    expect(model.decor.bays).toHaveLength(lot.capacity)
    for (const [x, z] of model.decor.bays) expect(inside(x, z, lot)).toBe(true)
  })
})

describe('floorLift', () => {
  it('lifts nothing when closed and each floor one gap more when open', () => {
    expect(floorLift(1, 0, 2)).toBe(0)
    expect(floorLift(0, 1, 2)).toBe(0)
    expect(floorLift(1, 1, 2)).toBe(EXPLODE_GAP)
    expect(floorLift(1, 0.5, 2)).toBe(EXPLODE_GAP / 2)
  })
  it('lifts the roof above the top floor', () => {
    expect(floorLift(2, 1, 2)).toBeGreaterThan(floorLift(1, 1, 2))
    expect(floorLift(1, 1, 1)).toBeGreaterThan(0)
  })
})

describe('services', () => {
  it('lists a classroom’s services once each, engagement included', () => {
    const s = roomServices(model.byId['classroom-b'])
    expect(new Set(s).size).toBe(s.length)
    expect(s).toContain('engagement')
    expect(s).toContain('air-quality')
  })
  it('collects a building’s services across its rooms', () => {
    expect(buildingServices(model, 'teaching')).toContain('solar')
    expect(buildingServices(model, 'grounds')).toContain('gate-parking')
  })
})
