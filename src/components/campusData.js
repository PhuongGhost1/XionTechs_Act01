// The smart campus of section 05 (docs/superpowers/specs/2026-10-06-smart-campus-design.md).
// Sources, as in content.js:
//   ILLUSTRATIVE  the campus itself: an example school, not a client site. Always labelled on the page.
//   PLACEHOLDER   the service list: school IoT is a real XionTechs offering, but which services and devices
//                 we deliver is pending team confirmation (content/TODO.md, "Smart school campus").
// Text values stay free of digits (src/concepts/command/campus/campusData.test.js): every number the page
// shows is a simulated reading from campus/simulate.js and carries a "Simulated" tag.
//
// Plot units are metres-ish. x runs west to east, z north to south; the camera looks north from the south.

export const CAMPUS_FRAME = { x: [-30, 30], z: [-20, 20] }

// Service groups, used as the map-style layers. `none` is the plain model.
export const layers = [
  { id: 'none', label: 'Model' },
  { id: 'climate', label: 'Climate' },
  { id: 'air', label: 'Air quality' },
  { id: 'occupancy', label: 'Occupancy' },
  { id: 'energy', label: 'Energy' },
  { id: 'security', label: 'Security' },
  { id: 'analytics', label: 'Analytics' },
]

// PLACEHOLDER: the services XionTechs offers for a school, pending confirmation. `slice: false` services are
// not on the model yet; adding them is content only (a device kind and a room that lists it).
export const services = [
  { id: 'temp-humidity', layer: 'climate', slice: true, name: 'Temperature and humidity', desc: 'Every room reports how warm and how humid it is, so comfort problems show up before anyone complains.' },
  { id: 'smart-ac', layer: 'climate', slice: true, name: 'Smart air conditioning', desc: 'Air conditioning follows the timetable and the people in the room, not a wall switch.' },
  { id: 'air-quality', layer: 'air', slice: true, name: 'Air quality and ventilation', desc: 'CO₂ and fine dust are measured in busy rooms; ventilation boosts when the air gets stale.' },
  { id: 'occupancy', layer: 'occupancy', slice: true, name: 'Room occupancy', desc: 'Presence sensors count people in a room without cameras, for planning, cleaning and energy.' },
  { id: 'lighting', layer: 'energy', slice: true, name: 'Smart lighting', desc: 'Lights dim with daylight, switch off in empty rooms and light the paths after dark.' },
  { id: 'energy-meter', layer: 'energy', slice: true, name: 'Energy metering', desc: 'Each building and its heaviest rooms are metered, so waste has an address.' },
  { id: 'solar', layer: 'energy', slice: true, name: 'Solar generation', desc: 'Rooftop panels report what they produce across the day.' },
  { id: 'cctv', layer: 'security', slice: true, name: 'Camera surveillance', desc: 'Cameras on corridors, gates and grounds feed one wall in the security control room.' },
  { id: 'gate-parking', layer: 'security', slice: true, name: 'Smart gate and parking', desc: 'The gate logs vehicles and the car park knows how many spaces are free.' },
  {
    id: 'engagement',
    layer: 'analytics',
    slice: true,
    name: 'Classroom engagement analytics',
    desc: 'An edge AI box in the room turns the camera view into anonymous, class-level shares: focused, on a phone, heads down, talking. No faces are recognised, no names are stored, and only the shares leave the room.',
  },
  { id: 'server-climate', layer: 'climate', slice: false, name: 'Server room climate', desc: 'Rack temperature and water leak sensing for the server room.' },
  { id: 'gas-smoke', layer: 'air', slice: false, name: 'Gas and smoke detection', desc: 'Early warning in the science lab and the kitchen.' },
  { id: 'fume-hood', layer: 'air', slice: false, name: 'Fume hood monitoring', desc: 'Airflow checks on lab fume hoods.' },
  { id: 'attendance', layer: 'occupancy', slice: false, name: 'Smart attendance', desc: 'Card readers at classroom doors.' },
  { id: 'noise', layer: 'occupancy', slice: false, name: 'Noise level', desc: 'Sound level in the library and classrooms.' },
  { id: 'ups', layer: 'energy', slice: false, name: 'Backup power monitoring', desc: 'UPS health for the server and security rooms.' },
  { id: 'access', layer: 'security', slice: false, name: 'Smart access control', desc: 'Smart locks and door sensors on labs, offices and the server room.' },
  { id: 'irrigation', layer: 'energy', slice: false, name: 'Smart irrigation', desc: 'Soil moisture and weather decide when the grounds are watered.' },
  { id: 'cold-chain', layer: 'climate', slice: false, name: 'Cold chain monitoring', desc: 'Fridge and freezer temperatures in the canteen kitchen.' },
]

// PLACEHOLDER: device kinds, one device profile each. `code` builds the device name with the room's code
// (`CLA-AQ`), `telemetry` lists the time-series keys the device reports, `transport` how it connects.
// `shape` picks the pin drawn in 3D (campus/campusScene.js).
export const deviceKinds = {
  'climate-sensor': { label: 'Climate sensor', code: 'TH', measures: 'Temperature and humidity', service: 'temp-humidity', shape: 'puck', telemetry: ['temperature', 'humidity'], transport: 'MQTT' },
  'ac-unit': { label: 'AC controller', code: 'AC', measures: 'Cooling state and set point', service: 'smart-ac', shape: 'bar', telemetry: ['acMode', 'setPoint'], transport: 'MQTT' },
  'co2-sensor': { label: 'Air quality sensor', code: 'AQ', measures: 'CO₂ and fine dust', service: 'air-quality', shape: 'puck', telemetry: ['co2', 'pm25'], transport: 'MQTT' },
  'presence-sensor': { label: 'Presence sensor', code: 'PIR', measures: 'People in the room, no images', service: 'occupancy', shape: 'dome', telemetry: ['people'], transport: 'MQTT' },
  'light-controller': { label: 'Lighting controller', code: 'LGT', measures: 'Light level and switching', service: 'lighting', shape: 'dome', telemetry: ['lights', 'dimLevel'], transport: 'MQTT' },
  'power-meter': { label: 'Smart power meter', code: 'PM', measures: 'Electrical load', service: 'energy-meter', shape: 'box', telemetry: ['power'], transport: 'MQTT' },
  'solar-inverter': { label: 'Solar inverter', code: 'INV', measures: 'Power from the roof panels', service: 'solar', shape: 'box', telemetry: ['solarPower'], transport: 'MQTT' },
  camera: { label: 'IP camera', code: 'CAM', measures: 'Video to the security room', service: 'cctv', shape: 'cone', telemetry: ['online'], transport: 'RTSP' },
  'gate-barrier': { label: 'Gate barrier and plate reader', code: 'GTE', measures: 'Vehicles in and out', service: 'gate-parking', shape: 'bar', telemetry: ['vehiclesPerHour'], transport: 'MQTT' },
  'parking-sensor': { label: 'Parking bay sensors', code: 'PRK', measures: 'Which spaces are free', service: 'gate-parking', shape: 'puck', telemetry: ['freeSpaces'], transport: 'MQTT' },
  'edge-ai': { label: 'Edge AI box', code: 'EAI', measures: 'Anonymous class-level engagement', service: 'engagement', shape: 'gem', telemetry: ['focused', 'onPhone', 'headsDown', 'talking'], transport: 'MQTT' },
  'street-lamp': { label: 'Smart street lamps', code: 'LMP', measures: 'Dusk switching and dimming', service: 'lighting', shape: 'dome', telemetry: ['lamps'], transport: 'MQTT' },
}

const CLASSROOM = ['climate-sensor', 'ac-unit', 'co2-sensor', 'presence-sensor', 'light-controller', 'camera', 'edge-ai']

// ILLUSTRATIVE: an example campus. A room's `x` (and optional `z`) is its span inside the building; rooms on
// one floor must not overlap. `code` is the room's asset code (device names start with it). `capacity` is the
// number of seats the simulation fills. `short` is the name the
// flat site plan uses where the full name does not fit.
export const buildings = [
  {
    id: 'teaching',
    name: 'Teaching block',
    summary: 'Classrooms and labs on two floors, with solar panels on the roof.',
    x: [-10, 16],
    z: [-17, -8],
    floors: 2,
    floorHeight: 3.4,
    roof: 'solar',
    rooms: [
      {
        id: 'science-lab',
        code: 'LSC',
        name: 'Science lab',
        usage: 'lab',
        floor: 0,
        x: [-10, 3],
        capacity: 24,
        devices: ['climate-sensor', 'ac-unit', 'co2-sensor', 'presence-sensor', 'light-controller', 'camera'],
        automations: ['Air goes stale during a practical → ventilation boosts', 'Lab empties → lights and air conditioning switch off'],
      },
      {
        id: 'computer-lab',
        code: 'LCM',
        name: 'Computer lab',
        usage: 'computer',
        floor: 0,
        x: [3, 16],
        capacity: 30,
        devices: ['climate-sensor', 'ac-unit', 'co2-sensor', 'presence-sensor', 'light-controller', 'power-meter', 'solar-inverter', 'camera'],
        automations: ['Machines left on after hours → flagged to IT', 'Room warms with the machines → cooling steps up', 'Roof panels feed this block first; the meter shows what is left'],
      },
      {
        id: 'classroom-a',
        code: 'CLA',
        name: 'Classroom A',
        usage: 'classroom',
        floor: 1,
        x: [-10, -1],
        capacity: 32,
        devices: CLASSROOM,
        automations: ['CO₂ climbs past the comfort limit → ventilation boosts', 'Engagement drops for a while → a nudge on the teacher’s tablet', 'Class leaves → lights and air conditioning off'],
      },
      {
        id: 'classroom-b',
        code: 'CLB',
        name: 'Classroom B',
        usage: 'classroom',
        floor: 1,
        x: [-1, 8],
        capacity: 32,
        devices: CLASSROOM,
        automations: ['CO₂ climbs past the comfort limit → ventilation boosts', 'Engagement drops for a while → a nudge on the teacher’s tablet', 'Class leaves → lights and air conditioning off'],
      },
      {
        id: 'classroom-c',
        code: 'CLC',
        name: 'Classroom C',
        usage: 'classroom',
        floor: 1,
        x: [8, 16],
        capacity: 28,
        devices: CLASSROOM,
        automations: ['CO₂ climbs past the comfort limit → ventilation boosts', 'Engagement drops for a while → a nudge on the teacher’s tablet', 'Class leaves → lights and air conditioning off'],
      },
    ],
  },
  {
    id: 'library',
    name: 'Library',
    summary: 'One tall reading hall, busiest at lunch.',
    x: [-28, -16],
    z: [-17, -8],
    floors: 1,
    floorHeight: 4.6,
    roof: 'flat',
    rooms: [
      {
        id: 'reading-hall',
        code: 'LIB',
        name: 'Reading hall',
        usage: 'library',
        floor: 0,
        x: [-28, -16],
        capacity: 60,
        devices: ['climate-sensor', 'ac-unit', 'co2-sensor', 'presence-sensor', 'light-controller', 'camera'],
        automations: ['Lunch rush fills the hall → air conditioning and ventilation step up', 'Daylight is strong → lights dim'],
      },
    ],
  },
  {
    id: 'admin',
    name: 'Admin & security',
    summary: 'The security control room, the server room and the principal’s office.',
    x: [-28, -14],
    z: [-1, 8],
    floors: 1,
    floorHeight: 3.4,
    roof: 'flat',
    rooms: [
      {
        id: 'security-room',
        code: 'SEC',
        name: 'Security control room',
        short: 'Security',
        usage: 'security',
        floor: 0,
        x: [-28, -21],
        capacity: 3,
        devices: ['climate-sensor', 'ac-unit', 'light-controller', 'power-meter'],
        automations: ['Every campus camera ends on this wall', 'After hours → the wall switches to night watch'],
        cameraWall: true,
      },
      {
        id: 'server-room',
        code: 'SRV',
        name: 'Server room',
        short: 'Server',
        usage: 'server',
        floor: 0,
        x: [-21, -17.5],
        capacity: 0,
        devices: ['climate-sensor', 'ac-unit', 'power-meter', 'camera'],
        automations: ['Racks run warm → cooling steps up and IT is told'],
      },
      {
        id: 'office',
        code: 'OFC',
        name: 'Principal’s office',
        short: 'Office',
        usage: 'office',
        floor: 0,
        x: [-17.5, -14],
        capacity: 4,
        devices: ['climate-sensor', 'ac-unit', 'presence-sensor', 'light-controller'],
        automations: ['Office empty → air conditioning to eco'],
      },
    ],
  },
  {
    id: 'grounds',
    name: 'Grounds',
    summary: 'Gate, car park, park and sports field: the open-air part of the campus.',
    x: [-10, 29],
    z: [-17, 20],
    floors: 0,
    floorHeight: 0,
    roof: 'none',
    rooms: [
      {
        id: 'gate',
        code: 'GTW',
        name: 'Main gate',
        usage: 'gate',
        floor: 0,
        x: [-4, 4],
        z: [16, 20],
        capacity: 0,
        devices: ['gate-barrier', 'camera'],
        automations: ['Known plate → barrier opens', 'Unknown vehicle → the security room is asked'],
      },
      {
        id: 'car-park',
        code: 'PRK',
        name: 'Car park',
        usage: 'carpark',
        floor: 0,
        x: [16, 29],
        z: [2, 11],
        capacity: 24,
        devices: ['parking-sensor', 'camera', 'street-lamp'],
        automations: ['Car park full → the gate display says so', 'Dusk → lamps on'],
      },
      {
        id: 'park',
        code: 'PLY',
        name: 'Park and playground',
        usage: 'park',
        floor: 0,
        x: [-10, 14],
        z: [-1, 8],
        capacity: 80,
        devices: ['camera', 'street-lamp'],
        automations: ['Dusk → path lamps on, dimmed when nobody is near'],
      },
      {
        id: 'field',
        code: 'FLD',
        name: 'Sports field',
        usage: 'field',
        floor: 0,
        x: [19, 29],
        z: [-17, -1],
        capacity: 40,
        devices: ['camera', 'street-lamp'],
        automations: ['Evening training → floodlights on'],
      },
    ],
  },
]

// PLACEHOLDER: alarm rules, in the shape of a device profile's alarm rules. A rule watches one telemetry key of
// one device kind (optionally only in rooms of one `usage`); the first level whose condition holds sets the
// severity, and the alarm clears once none does. `occupied` only checks while people are in the room, `after`
// only from that time of day (minutes). `action` is what the rule chain does next. Thresholds are numbers, so
// they stay out of the text fields.
export const SEVERITIES = ['CRITICAL', 'MAJOR', 'MINOR', 'WARNING'] // most severe first
export const alarmRules = [
  {
    id: 'high-co2',
    type: 'High CO₂',
    device: 'co2-sensor',
    key: 'co2',
    unit: 'ppm',
    levels: [
      { severity: 'MAJOR', op: '>', value: 1200 },
      { severity: 'WARNING', op: '>', value: 1000 },
    ],
    action: 'Boost ventilation and tell the teacher’s tablet',
  },
  {
    id: 'room-hot',
    type: 'Room running warm',
    device: 'climate-sensor',
    key: 'temperature',
    unit: '°C',
    occupied: true,
    levels: [
      { severity: 'MAJOR', op: '>', value: 29 },
      { severity: 'MINOR', op: '>', value: 28 },
    ],
    action: 'Step up cooling',
  },
  {
    id: 'server-hot',
    type: 'Server room hot',
    device: 'climate-sensor',
    usage: 'server',
    key: 'temperature',
    unit: '°C',
    levels: [{ severity: 'CRITICAL', op: '>', value: 27 }],
    action: 'Page IT on call',
  },
  {
    id: 'engagement-dip',
    type: 'Class engagement dipping',
    device: 'edge-ai',
    key: 'focused',
    unit: '%',
    levels: [{ severity: 'MINOR', op: '<', value: 70 }],
    action: 'Nudge the teacher’s tablet',
  },
  {
    id: 'equipment-on',
    type: 'Equipment left on',
    device: 'power-meter',
    usage: 'computer',
    key: 'power',
    unit: 'kW',
    after: 18 * 60,
    levels: [{ severity: 'MINOR', op: '>', value: 2 }],
    action: 'Ticket to IT to shut the lab down',
  },
  {
    id: 'car-park-full',
    type: 'Car park full',
    device: 'parking-sensor',
    key: 'freeSpaces',
    unit: '',
    levels: [{ severity: 'WARNING', op: '<', value: 1 }],
    action: 'Gate display shows the car park is full',
  },
]

// The school day the scrubber plays, in minutes after midnight. Labels are interface words.
export const DAY = { start: 6 * 60, end: 20 * 60 }
export const dayPhases = [
  { id: 'arrival', label: 'Arrival', at: 6 * 60 + 30 },
  { id: 'lessons', label: 'Lessons', at: 7 * 60 + 30 },
  { id: 'lunch', label: 'Lunch', at: 11 * 60 + 30 },
  { id: 'afternoon', label: 'Afternoon', at: 13 * 60 + 30 },
  { id: 'after', label: 'After hours', at: 17 * 60 },
]
