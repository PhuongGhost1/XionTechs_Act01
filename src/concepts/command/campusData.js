// The smart campus of section 05 (docs/superpowers/specs/2026-10-06-smart-campus-design.md).
// Sources, as in content.js:
//   ILLUSTRATIVE  the campus itself: an example school, not a client site. Always labelled on the page.
//   PLACEHOLDER   the service list: school IoT is a real XionTechs offering, but which services and devices
//                 we deliver is pending team confirmation (content/TODO.md, "Smart campus").
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

// PLACEHOLDER: device kinds. `shape` picks the pin drawn in 3D (campus/campusScene.js).
export const deviceKinds = {
  'climate-sensor': { label: 'Climate sensor', measures: 'Temperature and humidity', service: 'temp-humidity', shape: 'puck' },
  'ac-unit': { label: 'AC controller', measures: 'Cooling state and set point', service: 'smart-ac', shape: 'bar' },
  'co2-sensor': { label: 'Air quality sensor', measures: 'CO₂ and fine dust', service: 'air-quality', shape: 'puck' },
  'presence-sensor': { label: 'Presence sensor', measures: 'People in the room, no images', service: 'occupancy', shape: 'dome' },
  'light-controller': { label: 'Lighting controller', measures: 'Light level and switching', service: 'lighting', shape: 'dome' },
  'power-meter': { label: 'Smart power meter', measures: 'Electrical load', service: 'energy-meter', shape: 'box' },
  'solar-inverter': { label: 'Solar inverter', measures: 'Power from the roof panels', service: 'solar', shape: 'box' },
  camera: { label: 'IP camera', measures: 'Video to the security room', service: 'cctv', shape: 'cone' },
  'gate-barrier': { label: 'Gate barrier and plate reader', measures: 'Vehicles in and out', service: 'gate-parking', shape: 'bar' },
  'parking-sensor': { label: 'Parking bay sensors', measures: 'Which spaces are free', service: 'gate-parking', shape: 'puck' },
  'edge-ai': { label: 'Edge AI box', measures: 'Anonymous class-level engagement', service: 'engagement', shape: 'gem' },
  'street-lamp': { label: 'Smart street lamps', measures: 'Dusk switching and dimming', service: 'lighting', shape: 'dome' },
}

const CLASSROOM = ['climate-sensor', 'ac-unit', 'co2-sensor', 'presence-sensor', 'light-controller', 'camera', 'edge-ai']

// ILLUSTRATIVE: an example campus. A room's `x` (and optional `z`) is its span inside the building; rooms on
// one floor must not overlap. `capacity` is the number of seats the simulation fills. `short` is the name the
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

// The school day the scrubber plays, in minutes after midnight. Labels are interface words.
export const DAY = { start: 6 * 60, end: 20 * 60 }
export const dayPhases = [
  { id: 'arrival', label: 'Arrival', at: 6 * 60 + 30 },
  { id: 'lessons', label: 'Lessons', at: 7 * 60 + 30 },
  { id: 'lunch', label: 'Lunch', at: 11 * 60 + 30 },
  { id: 'afternoon', label: 'Afternoon', at: 13 * 60 + 30 },
  { id: 'after', label: 'After hours', at: 17 * 60 },
]
