// The campus at one moment: every room's simulated state, reduced to what the scene, the site plan and the
// list need. Pure (live.test.js); React computes it when the time or the layer changes and hands it to the
// scene through a ref, so the scene never runs the simulation per frame.

import { lampsOn, layerValue, occupancy, roomState, roomStatus, sunAt } from './simulate'

export function campusAt(model, t, layer) {
  const states = {}
  let attention = 0
  for (const r of model.rooms) {
    const s = roomState(r, t)
    const st = roomStatus(r, t, s)
    if (st.status === 'attention') attention++
    states[r.id] = { people: s.people, occ: s.occ, lights: s.lights, status: st.status, reasons: st.reasons, layer: layerValue(layer, r, t, s) }
  }
  const lot = model.rooms.find((r) => r.usage === 'carpark')
  const cameraRooms = model.rooms.filter((r) => r.kinds.includes('camera')).map((r) => r.id)
  return {
    states,
    attention,
    parked: lot ? states[lot.id].people : 0,
    traffic: occupancy('gate', t),
    lamps: lampsOn(t),
    sun: sunAt(t),
    cameraRooms,
    cameraCount: cameraRooms.length,
  }
}

// Attention rooms of a building, for the list and the labels.
export function buildingAttention(model, live, buildingId) {
  return model.byId[buildingId].roomIds.filter((id) => live.states[id]?.status === 'attention').length
}
