# Smart campus: a 3D/4D school IoT twin for Concept 01 — design

Date: 2026-10-06 · Branch: `feat/concept-01-campus` (from `feat/concept-01-command`) · Status: approved in chat
(Phuong asked to build first and review the running result instead of a separate spec review).

## 1. Intent

The flight plan (section 05 of `/concepts/command/`) shows an agent flying a mission. It says nothing about
IoT, which is a real XionTechs offering. Replace it with a **3D model of a school campus** that visitors
(prospective clients and vendors) can explore: several buildings, each with rooms that do different jobs, each
room showing the IoT services installed in it. A day scrubber adds time (the "4D"): occupancy, readings, light
and traffic follow a school day.

Out of scope: Approve/Reject or any agent decision flow; live device data; a CMS.

## 2. Decisions taken in the brainstorm

| Topic | Decision |
|---|---|
| Placement | Replaces section 05 (flight plan) on Concept 01. New section id `campus`. The "See an Agent Work" links go back to the main page demo (`/#ai-agents`). |
| Rendering | Everything procedural in three.js (no model files). Flat-shaded "architect's maquette" on the page's navy tokens, gold for hover/selection/attention. |
| Scope (slice B) | 4 buildings (Teaching block, Admin & security, Library, Grounds), 13 rooms/zones, 10 services. Data model holds all 19 services so later growth is content only. |
| Engagement analytics | Anonymous and class-level only: share of the class focused / on a phone / heads down / talking. No faces, no names, no per-seat state. Seats in 3D show occupancy only. |
| Honesty | Whole section carries an always-visible badge "Illustrative campus · simulated readings". Service list is pending team confirmation (content/TODO.md). Every reading widget carries a "Simulated" tag. Content text stays digit-free; numbers come only from `simulate.js`. |

## 3. Campus content (`src/concepts/command/campusData.js`)

Plot units are metres-ish; x runs west→east, z north→south; the camera looks north from the south.
Frame x ∈ [-30, 30], z ∈ [-20, 20].

| Building | Box (x, z) | Floors | Rooms / zones (usage) |
|---|---|---|---|
| Teaching block | x -10..16, z -17..-8 | 2 | Ground: Science lab (lab), Computer lab (computer). Upper: Classroom A, B, C (classroom). Solar roof. |
| Library | x -28..-16, z -17..-8 | 1 (tall) | Reading hall (library) |
| Admin & security | x -28..-14, z -1..8 | 1 | Security control room (security), Server room (server), Principal's office (office) |
| Grounds | open air | 0 | Main gate (gate), Car park (carpark), Park (park), Sports field (field) |

Decor (not clickable): loop road along the south edge, central path and plaza, trees (deterministic
placement), benches, playground frame, street lamps, sports-field markings, parked and moving cars.

**Services in the slice** (id · layer): temp-humidity · climate; smart-ac · climate; air-quality · air;
occupancy · occupancy; lighting · energy; energy-meter · energy; solar · energy; cctv · security;
gate-parking · security; engagement · analytics. The other nine (server climate, gas & smoke, fume hood,
attendance, noise, UPS, access control, irrigation, cold chain) are listed in the data with `slice: false`.

**Devices** are kinds (`climate-sensor`, `ac-unit`, `co2-sensor`, `presence-sensor`, `light-controller`,
`power-meter`, `solar-inverter`, `camera`, `gate-barrier`, `parking-sensor`, `edge-ai`, `street-lamp`), each with
a label, what it measures and the service it serves. A room lists device kinds; the model places them.

## 4. Interaction

- **Levels:** Campus → Building → Room. Hover a building: gold outline + label. Click: camera flies in, the
  roof lifts, floors separate, rooms turn translucent and device pins appear, other buildings fade. Click a
  room: it is framed and the side panel shows it. Escape goes up one level; Reset View returns to Campus.
  A breadcrumb shows the path.
- **Side panel:** at Campus level, the building list with their services; at Building level, its rooms;
  at Room level, devices (what each measures), simulated readings, automations, services, and for
  classrooms the anonymous engagement bar. The list is keyboard and screen-reader reachable and mirrors
  the 3D view (hovering an entry highlights it in 3D).
- **Layers:** None · Climate · Air quality · Occupancy · Energy · Security · Analytics. A layer tints every
  room by its value (from the line colour toward gold) and dims rooms the layer does not cover.
- **Status:** a room whose readings cross a threshold is `attention` (gold tint, marker in the list).
- **Day scrubber (4D):** 06:00–20:00, play/pause, phase chips (Arrival, Lessons, Lunch, Afternoon, After hours).
  Plays a day in about 60 s while the section is in view; dragging the scrubber pauses it. Time changes
  the sun direction, window glow, parked cars, moving traffic, seat occupancy and every reading. Clock
  times are interface labels, not metrics.
- **Camera:** drag or arrow keys orbit (yaw free, pitch clamped), +/- buttons zoom (no wheel capture),
  Pause Motion stops autoplay and ambient motion. Touch scrolls the page; taps select.

## 5. Architecture

All new code in `src/concepts/command/campus/`. The flight plan folder is removed (git keeps it).

| Unit | Kind | Responsibility |
|---|---|---|
| `campusData.js` (in `command/`) | content | Buildings, rooms, device kinds, services, layers, day phases. Source comments. |
| `model.js` | pure, tested | Data → world geometry: building and room boxes, floor heights, device positions, decor (trees, lamps, seats, car slots, road path), explode offsets. |
| `simulate.js` | pure, tested | `occupancy(usage, t)`, `readings(room, t)`, `roomStatus`, `layerValue(layer, room, t)`, `engagement(t)`, `sunAt(t)`, `phaseAt(t)`, `clock(t)`. Deterministic, no randomness. |
| `navigation.js` | pure, tested | Selection reducer (selectBuilding, selectRoom, up, reset), breadcrumb, camera focus box for a selection. |
| `camera.js`, `tier.js`, `keys.js` | pure, tested | Moved from `flight/` and adapted (free yaw, zoom factor). |
| `campusScene.js` | three.js | Builds the maquette from the model, reads live state each frame (selection, hover, layer, time), raycasts hover/click, projects HTML labels, sleeps when idle/off screen. Only module importing `three`; lazy chunk. |
| `CampusCanvas.jsx` | React | Mounts the scene (lazy). |
| `CampusSvg.jsx` | React | Flat site plan fallback (svg tier): same rooms, clickable, tinted by layer; multi-floor buildings show the selected floor. |
| `CampusTwin.jsx` | React | Section body (lazy): state, controls, stage, labels, panel, scrubber. |
| `CampusPanel.jsx`, `CampusControls.jsx` | React | Side panel; layer bar, scrubber, view buttons. |
| `CampusSection.jsx` | React | Frame and heading in the main chunk; lazy-loads `CampusTwin`. |

Renderer tiers stay as in the flight plan: `full` / `lite` WebGL in a lazy chunk; `svg` for reduced motion,
no WebGL, data saver and low-power devices. A lost WebGL context falls back to the SVG.

## 6. Error handling

Lazy chunk failure shows a one-line message instead of unmounting the page (same as the flight plan).
WebGL creation failure or context loss → SVG. The scene ignores picks while dragging (> 5 px).

## 7. Testing

Vitest (node): model geometry (rooms inside their building, no overlaps, devices inside rooms, everything
inside the frame, deterministic decor), simulation (ranges, occupancy follows the day, engagement shares sum
to one and only exist during lessons, attention thresholds, determinism), navigation reducer and breadcrumb,
camera maths, tier rules, and content rules (unique ids, every device kind and service known, content text
digit-free, engagement copy says anonymous and makes no face-recognition claim). `npm run lint` and
`npm run build`; visual QA with headless Edge screenshots.
