# Smart campus — implementation plan

Spec: `docs/superpowers/specs/2026-10-06-smart-campus-design.md`. Executed inline, one commit per task,
`npm test && npm run lint && npm run build` before each commit.

1. **Content.** `src/concepts/command/campusData.js` (buildings, rooms, device kinds, services, layers, day
   phases) and the section copy `campus` in `content.js`. Tests: `campusData.test.js` (ids, references,
   digit-free text, privacy wording).
2. **Pure model.** `campus/model.js` + tests (geometry, overlaps, devices, decor, explode offsets).
3. **Simulation.** `campus/simulate.js` + tests (occupancy curve, readings, status, layers, engagement,
   sun, clock).
4. **Navigation and camera.** Move `camera.js`, `keys.js`, `tier.js` from `flight/` to `campus/`, add free-yaw
   orbit and zoom; `campus/navigation.js` + tests.
5. **Scene.** `campus/campusScene.js` (maquette, explode, layers, pins, cars, sun, picking, labels, sleep)
   and `CampusCanvas.jsx`.
6. **Section UI.** `CampusSection.jsx`, `CampusTwin.jsx`, `CampusPanel.jsx`, `CampusControls.jsx`,
   `CampusSvg.jsx`, `Campus.css`. Wire into `CommandApp.jsx`, section list, the X core cover id, nav and links.
   Remove `flight/`.
7. **Docs.** `CLAUDE.md` concept notes, `content/TODO.md` open items, `PROMPT_LOG.md` entry,
   `docs/concepts/01-command-implementation.md` note.
8. **QA.** Headless Edge screenshots at 1440 and 390 px, 3D and SVG tiers; fix what they show.
