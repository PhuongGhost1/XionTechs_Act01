// The campus at one moment: every room's simulated state, reduced to what the scene, the site plan and the
// list need. Pure (live.test.js); React computes it when the time or the layer changes and hands it to the
// scene through a ref, so the scene never runs the simulation per frame.

import { alarmsAt } from './alarms'
import { lampsOn, layerValue, occupancy, roomState, roomStatus, sunAt } from './simulate'

export function campusAt(model, t, layer) {
  const states = {}
  let attention = 0
  for (const r of model.rooms) {
    const s = roomState(r, t)
    const st = roomStatus(r, t, s)
    if (st.status === 'attention') attention++
    states[r.id] = { people: s.people, occ: s.occ, lights: s.lights, status: st.status, severity: st.severity, reasons: st.reasons, layer: layerValue(layer, r, t, s) }
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
    alarms: alarmsAt(model, t),
  }
}

// Every campus camera with its number on the wall ("01", "02", ...), in model order. The numbers are interface
// labels, not measurements.
export function cameraList(model) {
  return model.devices
    .filter((d) => d.kind === 'camera')
    .map((d, i) => ({ deviceId: d.id, roomId: d.roomId, no: String(i + 1).padStart(2, '0') }))
}

// Attention rooms of a building, for the list and the labels.
export function buildingAttention(model, live, buildingId) {
  return model.byId[buildingId].roomIds.filter((id) => live.states[id]?.status === 'attention').length
}
