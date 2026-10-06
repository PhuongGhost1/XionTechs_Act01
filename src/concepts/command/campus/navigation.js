// Where the visitor is in the campus: Campus → Building → Room. Pure, tested in node (navigation.test.js).
// The selection is a plain { buildingId, roomId } object; React keeps it in state and the scene reads it.

import { floorLift } from './model'

export const ROOT = Object.freeze({ buildingId: null, roomId: null })

export const levelOf = (sel) => (sel.roomId ? 'room' : sel.buildingId ? 'building' : 'campus')

export function selectBuilding(sel, id) {
  if (!id) return ROOT
  return sel.buildingId === id && !sel.roomId ? sel : { buildingId: id, roomId: null }
}

export function selectRoom(model, id) {
  const room = model.byId[id]
  if (!room?.buildingId) return ROOT
  return { buildingId: room.buildingId, roomId: id }
}

// Escape / Back: one level up.
export function up(sel) {
  if (sel.roomId) return { buildingId: sel.buildingId, roomId: null }
  return ROOT
}

// A click on the model: a room opens only inside the building that is already open; elsewhere the click
// opens that room's building. Empty ground goes up one level.
export function pick(model, sel, hit) {
  if (!hit) return up(sel)
  if (hit.roomId) {
    const room = model.byId[hit.roomId]
    if (sel.buildingId === room.buildingId) return selectRoom(model, hit.roomId)
    return selectBuilding(sel, room.buildingId)
  }
  if (hit.buildingId) return selectBuilding(sel, hit.buildingId)
  return sel
}

export function breadcrumb(model, sel, rootLabel) {
  const out = [{ label: rootLabel, sel: ROOT }]
  if (sel.buildingId) out.push({ label: model.byId[sel.buildingId].name, sel: { buildingId: sel.buildingId, roomId: null } })
  if (sel.roomId) out.push({ label: model.byId[sel.roomId].name, sel })
  return out
}

// The box the camera frames for a selection, with an open building's floors already lifted.
export function focusBox(model, sel) {
  if (sel.roomId) {
    const r = model.byId[sel.roomId]
    const b = model.byId[r.buildingId]
    const lift = b.outdoor ? 0 : floorLift(r.floor, 1, b.floors)
    return { x: r.x, y: [r.y[0] + lift, (r.outdoor ? 3 : r.y[1]) + lift], z: r.z }
  }
  if (sel.buildingId) {
    const b = model.byId[sel.buildingId]
    if (b.outdoor) {
      const rooms = b.roomIds.map((id) => model.byId[id])
      return {
        x: [Math.min(...rooms.map((r) => r.x[0])), Math.max(...rooms.map((r) => r.x[1]))],
        y: [0, 3],
        z: [Math.min(...rooms.map((r) => r.z[0])), Math.max(...rooms.map((r) => r.z[1]))],
      }
    }
    return { x: b.x, y: [0, b.height + floorLift(b.floors - 1, 1, b.floors)], z: b.z }
  }
  return { x: model.frame.x, y: [0, model.frame.y[1]], z: model.frame.z }
}
