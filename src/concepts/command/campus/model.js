// Pure model of the smart campus: campusData.js turned into world geometry. Building and room boxes, the
// floors and how far they lift when a building is opened, where each device pin sits, the seats, and the
// decor (paths, road, trees, lamps, parking bays). No DOM and no three.js, so it is tested in node
// (model.test.js) and shared by the WebGL scene and the flat SVG plan.
//
// World: x west to east, z north to south, y up. Plot units are metres-ish (campusData.js CAMPUS_FRAME).

import { CAMPUS_FRAME, buildings as BUILDINGS, deviceKinds as KINDS } from '../campusData'

export const EXPLODE_GAP = 3 // extra lift per floor when a building is open
export const ROOF_LIFT = 3.5 // the roof rises this far above the top floor when open
export const ROAD = { x: [-29, 29], z: [12, 15] }
export const GATE_ROAD = { x: [-2, 2], z: [15, 20] }
export const PATHS = [
  { x: [-29, 29], z: [-6.5, -2.5] }, // the plaza between the two rows of buildings
  { x: [-1.5, 1.5], z: [-2.5, 12] }, // from the plaza through the park to the road
  { x: [-23, -19], z: [-2.5, -1] }, // the admin entrance
]
const INDOOR_SEATED = new Set(['classroom', 'lab', 'computer', 'library'])

const span = (a) => a[1] - a[0]
const mid = (a) => (a[0] + a[1]) / 2

// Seeded generator so the decor is the same on every visit (and in the tests).
export function rng(seed) {
  let s = seed >>> 0 || 1
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    return s / 4294967296
  }
}

export const inside = (x, z, box, pad = 0) => x >= box.x[0] - pad && x <= box.x[1] + pad && z >= box.z[0] - pad && z <= box.z[1] + pad

// Device pins: a row under the ceiling along the back of an indoor room, or on poles across an open-air zone.
function placeDevices(room, outdoor) {
  const n = room.devices.length
  return room.devices.map((kind, i) => {
    const fx = (i + 1) / (n + 1)
    const x = room.x[0] + span(room.x) * fx
    const z = outdoor ? mid(room.z) + (i % 2 ? 0.8 : -0.8) : room.z[0] + span(room.z) * (i % 2 ? 0.3 : 0.18)
    const y = outdoor ? 2.4 : room.y[0] + span(room.y) * 0.72
    return { id: `${room.id}:${i}`, kind, roomId: room.id, pos: [x, y, z], shape: KINDS[kind].shape }
  })
}

// Desks in rows facing north (the board), inset from the walls; as many as the room's capacity, at most.
function placeSeats(room) {
  if (!INDOOR_SEATED.has(room.usage) || !room.capacity) return []
  const w = span(room.x) - 2
  const d = span(room.z) - 2.6
  const cols = Math.max(1, Math.round(Math.sqrt((room.capacity * w) / d)))
  const rows = Math.ceil(room.capacity / cols)
  const seats = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols && seats.length < room.capacity; c++) {
      seats.push([room.x[0] + 1 + (w * (c + 0.5)) / cols, room.z[0] + 1.9 + (d * (r + 0.5)) / rows])
    }
  }
  return seats
}

function decor(blocked) {
  const free = (x, z, pad) => !blocked.some((b) => inside(x, z, b, pad))
  const trees = []
  const rand = rng(20261006)
  // Candidates across the whole plot; keep the ones clear of every building, zone, path and the road.
  for (let i = 0; i < 900 && trees.length < 70; i++) {
    const x = CAMPUS_FRAME.x[0] + 1 + rand() * (span(CAMPUS_FRAME.x) - 2)
    const z = CAMPUS_FRAME.z[0] + 1 + rand() * (span(CAMPUS_FRAME.z) - 2)
    const s = 0.75 + rand() * 0.6
    if (!free(x, z, 1.1)) continue
    if (trees.some(([tx, tz]) => Math.hypot(tx - x, tz - z) < 2.4)) continue
    trees.push([x, z, s])
  }
  // A few trees inside the park, where people sit.
  const park = blocked.find((b) => b.id === 'park')
  const parkTrees = [
    [-7, 1.5], [-6, 6], [4.5, 1], [10.5, 6.5], [12, 1.5], [-3.5, 5.5],
  ].filter(([x, z]) => park && inside(x, z, park))
  for (const [x, z] of parkTrees) trees.push([x, z, 1.1])

  const lamps = []
  for (let x = -27; x <= 27; x += 6) lamps.push([x, ROAD.z[0] - 0.6])
  for (let x = -26; x <= 26; x += 8) lamps.push([x, PATHS[0].z[0] - 0.5])

  const bays = []
  const lot = blocked.find((b) => b.id === 'car-park')
  if (lot) {
    const per = Math.floor(span(lot.x) / 1.05)
    for (const z of [lot.z[0] + 2, lot.z[1] - 2]) for (let i = 0; i < per; i++) bays.push([lot.x[0] + 0.6 + i * 1.05, z])
  }
  const benches = [[-12, -3.2], [-6, -5.8], [6, -3.2], [12, -5.8], [-4, 3.5], [6, 6.8]]
  return { trees, lamps, bays, benches, playground: [7, 3.5] }
}

export function buildCampusModel(source = BUILDINGS) {
  const buildings = []
  const rooms = []
  const devices = []
  for (const b of source) {
    const outdoor = b.floors === 0
    const height = b.floors * b.floorHeight
    const roomIds = []
    for (const r of b.rooms) {
      const z = r.z ?? b.z
      const y0 = outdoor ? 0 : r.floor * b.floorHeight
      const y = outdoor ? [0, 0.08] : [y0, y0 + b.floorHeight]
      const room = {
        ...r,
        buildingId: b.id,
        outdoor,
        x: r.x,
        z,
        y,
        center: [mid(r.x), mid(y), mid(z)],
      }
      room.devices = placeDevices(room, outdoor)
      room.seats = placeSeats(room)
      room.kinds = r.devices
      devices.push(...room.devices)
      rooms.push(room)
      roomIds.push(room.id)
    }
    buildings.push({
      id: b.id,
      name: b.name,
      summary: b.summary,
      outdoor,
      floors: b.floors,
      floorHeight: b.floorHeight,
      roof: b.roof,
      x: b.x,
      z: b.z,
      height,
      roomIds,
      center: [mid(b.x), height / 2, mid(b.z)],
    })
  }
  const byId = Object.fromEntries([...buildings, ...rooms].map((o) => [o.id, o]))
  const zones = rooms.filter((r) => r.outdoor).map((r) => ({ id: r.id, x: r.x, z: r.z }))
  const blocked = [
    ...buildings.filter((b) => !b.outdoor).map((b) => ({ id: b.id, x: b.x, z: b.z })),
    ...zones,
    ...PATHS.map((p, i) => ({ id: `path-${i}`, ...p })),
    { id: 'road', ...ROAD },
    { id: 'gate-road', ...GATE_ROAD },
  ]
  const tallest = Math.max(...buildings.map((b) => b.height))
  return {
    frame: { x: CAMPUS_FRAME.x, y: [0, tallest], z: CAMPUS_FRAME.z },
    buildings,
    rooms,
    devices,
    byId,
    blocked,
    decor: decor(blocked),
  }
}

// How far a floor (or the roof, floor === floors) lifts at `open` (0 closed, 1 fully open).
export function floorLift(floor, open, floors) {
  if (floor >= floors) return (floors - 1) * EXPLODE_GAP * open + ROOF_LIFT * open
  return floor * EXPLODE_GAP * open
}

// The rooms of a building, grouped by floor (ground first).
export function roomsByFloor(model, buildingId) {
  const b = model.byId[buildingId]
  const floors = Math.max(1, b.floors)
  const out = Array.from({ length: floors }, () => [])
  for (const id of b.roomIds) out[model.byId[id].floor].push(model.byId[id])
  return out
}

// The service ids a room offers, in the order its devices list them.
export function roomServices(room) {
  return [...new Set(room.kinds.map((k) => KINDS[k].service))]
}

export function buildingServices(model, buildingId) {
  return [...new Set(model.byId[buildingId].roomIds.flatMap((id) => roomServices(model.byId[id])))]
}
