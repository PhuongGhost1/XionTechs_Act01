import { processContent } from './process.js'
import { brief, draft } from './wrap.js'

// The visible label of each of the seven stations ("02 / WHAT WE CAN DEPLOY"): the small mono line
// above every section, the dock readout and the dock scrubber. contract/stations.js takes them
// from here, so there is ONE copy of each and every one carries its source (validate.js sees them).
//
//   BRIEF   names the brief itself uses: WHAT WE CAN DEPLOY, FROM REQUEST TO PRODUCTION (this one is
//           process.heading, not typed twice) and SELECTED DEPLOYMENTS
//   DRAFT   names written for this page: STANDBY, PREMISE, LEDGER, DONE
//
// "SELECTED DEPLOYMENTS" is the brief's own name for the station, over records whose status, stack
// and client are still PENDING: an open honesty question for the team (content/TODO.md).
// `station` is the id used by contract/stations.js; the order here is the station order.

const entry = (index, station, name, wrap) => ({ ...wrap(`station.${station}`, `${index} / ${name}`), station })

export const stationLabels = [
  entry('00', 'standby', 'STANDBY', draft),
  entry('01', 'premise', 'PREMISE', draft),
  entry('02', 'deploy', 'WHAT WE CAN DEPLOY', brief),
  entry('03', 'line', processContent.heading.text, brief),
  entry('04', 'work', 'SELECTED DEPLOYMENTS', brief),
  entry('05', 'ledger', 'LEDGER', draft),
  entry('06', 'done', 'DONE', draft),
]

/** The label text of a station id ('deploy' -> '02 / WHAT WE CAN DEPLOY'), or '' for an unknown id. */
export const stationLabel = (id) => stationLabels.find((l) => l.station === id)?.text ?? ''
