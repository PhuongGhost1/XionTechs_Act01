// The eight stations of the page (doc 4.1, 5.3). The order, ids, labels and track heights live
// here and nowhere else. Sections, the dock, the header and the scroll controller read them.
//
//   00 STANDBY   01 PREMISE   02 DEPLOY   03 LINE   04 ON FILE   05 AGENT RUN   06 LEDGER   07 DONE
//
// The id of a station is the id of its track wrapper (section#line, ...). `work` is the id of
// "On File" because the nav word is WORK and the hash is #work.
//
// Track heights are in lvh and mirror the --track-* tokens in styles/tokens.css (stations.test.js
// keeps the two in step). Phone heights are about 15% shorter; LINE is 200 on phones per doc 5.3.
//
// `mode` says how a track's progress is measured (see runtime/scroll.js trackProgress):
//   pin   0 when the track's top reaches the viewport top, 1 when its sticky stage is released
//   span  0 when the track's top reaches the viewport top, 1 one track height later

import { stationLabel } from '../content/index.js'

export const STATIONS = Object.freeze([
  { index: 0, id: 'standby', label: stationLabel('standby'), hash: '#standby', lvh: 100, lvhPhone: 100, pinned: false, mode: 'span', anchor: 'hero' },
  { index: 1, id: 'premise', label: stationLabel('premise'), hash: '#premise', lvh: 110, lvhPhone: 94, pinned: false, mode: 'span', anchor: 'premise' },
  { index: 2, id: 'deploy', label: stationLabel('deploy'), hash: '#deploy', lvh: 150, lvhPhone: 128, pinned: false, mode: 'pin', anchor: 'deploy' },
  { index: 3, id: 'line', label: stationLabel('line'), hash: '#line', lvh: 220, lvhPhone: 200, pinned: true, mode: 'pin', anchor: 'line' },
  { index: 4, id: 'work', label: stationLabel('work'), hash: '#work', lvh: 220, lvhPhone: 187, pinned: false, mode: 'span', anchor: null },
  { index: 5, id: 'agent', label: stationLabel('agent'), hash: '#agent', lvh: 320, lvhPhone: 0, pinned: true, mode: 'pin', anchor: null },
  { index: 6, id: 'ledger', label: stationLabel('ledger'), hash: '#ledger', lvh: 90, lvhPhone: 77, pinned: false, mode: 'span', anchor: null },
  { index: 7, id: 'done', label: stationLabel('done'), hash: '#done', lvh: 160, lvhPhone: 136, pinned: true, mode: 'pin', anchor: 'done' },
])

/** Station ids in page order. */
export const STATION_IDS = Object.freeze(STATIONS.map((s) => s.id))

/** Short counter text for the dock: BUILD 000 .. BUILD 007 (doc 4.7, M12). */
export const buildCounter = (index) => `00${index}`

/** Mobile breakpoint of the frame (header 48, dock 56): below this width the phone values apply. */
export const PHONE_MAX_WIDTH = 767.98

/** Header and dock heights in px, as the tokens set them (doc 5.3). */
export const FRAME = Object.freeze({
  headerDesktop: 64,
  headerPhone: 48,
  dockDesktop: 48,
  dockPhone: 56, // plus the safe-area inset
})

/**
 * Every hash the page answers to. #contact is the composer below the pinned finale: it belongs
 * to station 07 but has no track of its own. Exported in this order.
 */
export const HASH_IDS = Object.freeze(['#standby', '#premise', '#deploy', '#line', '#work', '#agent', '#ledger', '#done', '#contact'])

export const HASH_TO_STATION = Object.freeze({
  '#standby': 0,
  '#premise': 1,
  '#deploy': 2,
  '#line': 3,
  '#work': 4,
  '#agent': 5,
  '#ledger': 6,
  '#done': 7,
  '#contact': 7,
})

/** Station index for a location hash, or -1 when the hash is not one of ours. */
export const stationForHash = (hash) => HASH_TO_STATION[hash] ?? -1

export const stationById = (id) => STATIONS.find((s) => s.id === id) ?? null

/** Track height of a station in lvh, for a phone or a desktop viewport. */
export const trackLvh = (id, phone = false) => {
  const s = stationById(id)
  return s ? (phone ? s.lvhPhone : s.lvh) : 0
}

/** The CoreAnchor name a station parks the core on, or null when the core is absent. */
export const anchorForStation = (index) => STATIONS[index]?.anchor ?? null
