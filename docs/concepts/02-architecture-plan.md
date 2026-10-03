# Concept 02, X / Architecture: plan

Branch `feat/concept-02-architecture`, created from `feat/concept-01-command-v3` (it carries the Vite multi-page
setup, `three`, the sanitized screenshots and the verified facts). Source briefs: `docs/idea/02-X-Architecture.md`,
`docs/idea/00-Visual-Experience-System.md` (the newer copy with Level 0, the a11y rule and the §17 zero-state
protocol was synced into `docs/idea/`). This is a from-scratch design. Disclosure: during setup the concept 01
page-entry files (`index.html`, the Tailwind `@config` wiring, `main.jsx`), its plan and the top of its token CSS
were read once to learn the page mechanics; none of its palette, type, IA, components or motion is a source here.
Those come from brief 02 and the research below.

## 0. Context audit (brief §17, Phase 0)

| Checked | Result |
|---|---|
| auto-memory, `CLAUDE.local.md`, `AGENTS.md` | none exist |
| `CLAUDE.md` | colour/serif/section-rhythm rules belong to the main page, the concept 01 notes belong to Command. Kept: honesty rules, Windows/Vite gotchas, a11y conventions, the concept-page mechanics (own Tailwind config, `/concepts/<name>/`) |
| `src/components`, `src/concepts/command`, `docs/concepts/01-*` | no component or section code read or reused (see the disclosure above for what was read). "Would I create this component if the repo were empty?" was asked of every shared piece; only infrastructure survived |
| kept as infrastructure | Vite multi-page entry, `three`, Tailwind, vitest, the logo PNG (and its reversed copy), the sanitized `public/work/*.webp`, verified data in `src/content/site.js` (imported, never copied) |

## 1. Research (Phase 1), what changed the design

- Drawing conventions (ISO/ANSI sheet practice): the title block sits bottom right; **dashed lines mean hidden or
  proposed elements**; dimension lines are thin, continuous and offset from the outline. Decision: the page is a
  *drawing set*, the footer is a title block, and **dashed linework is the page-wide honesty device**: solid navy =
  confirmed, dashed = illustrative or pending confirmation, yellow = measurement and the single live signal.
- Architecture-studio web practice: editorial type, big image per project, restrained scroll reveals. Decision:
  one large sheet per project, no card grids, motion limited to drawing-on, lifting and tilting.
- Type: Archivo is a variable grotesque with a width axis (`wdth` 62-125) built for headlines; one family gives
  condensed display and normal-width body. Paired with IBM Plex Mono for coordinates and labels.
- three.js transparency: no universal solution for overlapping alpha planes; the dependable recipe is
  `depthWrite: false` plus explicit `renderOrder`. Decision: five parallel, evenly spaced tracing-paper planes,
  sorted by hand every frame; no intersecting transparent geometry.
- Measured in concept 01 (same repo, same toolchain): plain `three` about 136 kB gzip lazy, R3F +55 kB, GSAP +46 kB,
  custom rAF scroll hook under 1 kB. Same conclusion here: no new dependencies.

## 2. Three directions (Phase 2)

| | A. Drawing Set | B. Site Model | C. Specification |
|---|---|---|---|
| Idea | the page is a set of numbered sheets; each section is a drawing that plots itself | one 3D building the camera flies through for the whole page | typographic spec document, hairlines and small diagrams |
| Hero | 2D plan that lifts into an exploded axonometric model | the building fills the viewport | giant headline, one diagram |
| 3D | confined to the hero; CSS 3D for the StaffXP model | global canvas | none |
| Risk | too many drawings = busy; must stay calm | a page-length WebGL canvas (brief 00 forbids it), mobile jank | loses the "blueprint becomes 3D" signature |

**Chosen: A**, with C's typographic restraint and B's single model kept inside the hero. It makes the hero
signature (blueprint to exploded model) and the page signature (blueprint assembly: every section plots itself)
one idea, as brief 00 asks.

## 3. Information architecture (Phase 3)

Narrative: *what we are, the principle, what we cover, how it is made, proof drawn open, more proof, close.*
Proof comes after the mechanism. Left out: services cards, why-us, FAQ, team, testimonials (none are real).

| Sheet | id | Title | Interaction |
|---|---|---|---|
| 01 | `top` | Hero | 2D plan draws on load, scroll lifts it into the exploded model, camera tilts and dollies through |
| 02 | `architecture` | The architecture | building *section*: six levels (business to infrastructure), hover/focus a level to trace a yellow load path |
| 03 | `capabilities` | Capability layers | six horizontal bands, each expands (architecture expanding/collapsing) |
| 04 | `process` | Process | sticky drawing that goes from empty nodes to a scaled, locked structure; six stages |
| 05 | `staffxp` | StaffXP, opened | CSS 3D exploded stack opens, can be hovered/clicked, reassembles into the real screenshot |
| 06 | `work` | Selected work | one large sheet per project: problem, architecture, technology, outcome, diagram |
| 07 | `about` / `contact` | Final statement + title block | layers compress into the X mark; footer is the drawing title block |

Navigation: `XIONTECHS  CAPABILITIES  PROCESS  WORK  ABOUT  CONTACT` with `SYS.01 / ARCH.004 / BUILD.2026` metadata
and a vertical **datum rail** (section ticks and a yellow marker) on wide screens. Mobile: the same list as a
"sheet index" panel. CTA treatment: square-cornered navy button; hover extends a yellow dimension line.

## 4. Visual system

Tokens are CSS variables (RGB channels) in `architecture.css`, Tailwind names `bp-*`; `data-band="navy"` re-scopes
the same names for the dark sheets. No hex in components.

| Token | Paper | Navy band | Use |
|---|---|---|---|
| `bp-bg` | `#F7F6F1` | `#08234A` | page |
| `bp-bg2` | `#EFEEE6` | `#0C2D5C` | alternate sheets, hover rows |
| `bp-rule` | `#D9DEE5` | `#2C4A75` | hairlines, grid (decoration only) |
| `bp-text` | `#101820` | `#F7F6F1` | headings, body |
| `bp-mute` | `#475467` | `#B6C2D4` | secondary text (AA checked by test) |
| `bp-line` | `#08234A` | `#F7F6F1` | linework |
| `bp-signal` | `#F4C400` | `#F4C400` | measurement, active, CTA mark, final reveal. Never text on paper |
| `bp-on-signal` | `#08234A` | `#08234A` | text on a yellow fill |

Shape: square corners, hairlines, registration crosses on sheet corners, no glow, no gradients, no glass. Paper
grain is one inline SVG noise at a few percent. **Type:** Archivo (display 75% width, 800, uppercase, tight; body
normal width) and IBM Plex Mono (coordinates, sheet codes, line-type legend). Source text is written in normal case
and uppercased by CSS so screen readers read words.

**Line types (the legend on the page):** solid navy = confirmed or structural; dashed = illustrative, pending or
hidden; yellow = dimension, active path, live signal.

## 5. Signature visual and motion

**Hero model.** Five tracing-paper planes (Experience, Services, API, Data, Infrastructure), each a translucent
matte sheet with thin navy linework and small extrusions; one yellow signal travels the vertical connectors. The
model data (`model/layers.js`) is pure 2D plan geometry plus heights, projected by `model/project.js` into the SVG
fallback and built into three.js lines, so both renderers draw the same building. Timeline (`model/timeline.js`,
pure, tested), scroll `p` over a sticky stage: lines draw on at load; `lift` opens the gap; `depth` extrudes;
`tilt` rotates the camera from plan to axonometric (a live `VIEW` readout shows the real angle); `dolly` moves the
camera through the planes at the end. WebGL is hero-only and lazy.

**Page signature: blueprint assembly.** Every sheet plots itself once on entering (stroke-dashoffset, a yellow
dimension line extends, labels fade in). Dimension labels are either symbolic or the *measured* pixel length of
the drawn line, never an invented number.

**Process sheet.** One SVG drawing whose `data-stage` goes DISCOVER (empty dashed nodes, survey marks) to ARCHITECT
(nodes connect) to ENGINEER (slabs lift, boxes extrude) to INTEGRATE (external systems join with yellow
connectors) to DEPLOY (bounding frame closes and locks) to SCALE (extra modules extend). Mobile and reduced
motion: six stacked drawings, one per stage.

**StaffXP model.** CSS 3D (`preserve-3d`), no WebGL: five planes whose faces are real. Experience = the
dashboard screenshot, Identity = the sign-in screenshot, Services/API and Infrastructure = dashed placeholder
drawings, Data = the modules visible in the product navigation. Scroll: closed stack, opens, hold (hover/click a
layer in the model or the index list), reassembles so the dashboard faces the viewer with its real regions
annotated.

**Finale.** About 90 short segments converge from the five slab outlines onto the X mark (2 strokes), then
`ARCHITECT / ENGINEER / DEPLOY / XIONTECHS`. One path attribute written per frame, no canvas.

**Fallback ladder (brief 00 levels).** Level 0: `[ PLOTTING DRAWING A-001... ]` text in the model box. Level 1/2:
the SVG axonometric drawing (draw-on, CSS lift). Level 3: WebGL replaces it when WebGL exists, width >= 768, no
reduced motion, no `saveData`, and an FPS probe passes. A `Pause Motion` button stops the render loop and CSS loops.

## 6. Stack decision

No new dependencies. Plain `three` (lazy, hero only), CSS 3D for StaffXP, SVG for everything drawn, one rAF scroll
hook writing CSS variables (no React state per frame), `Reveal`/draw-on through IntersectionObserver.
Framer Motion and GSAP from the brief's menu are not needed (layout animation and pinned timelines are plain CSS
plus `position: sticky`).

## 7. Content and honesty map

- Brief copy (headline, supporting line, six levels, six layers, six stages, final statement, nav) is `BRIEF`.
- Real facts come from `src/content/site.js` (`LIVE`/`PLAN`): StaffXP and ESS descriptors, visible modules and
  regions, tools named on the live site (Azure, AWS, GCP, Power Platform, Make, n8n, Retool, Bubble), offices,
  contact. Imported, not copied.
- The brief's StaffXP hover values (React, .NET, MySQL, AI services) and its MOBILE/ADMIN/CRM/HR nodes are **not
  confirmed**. The StaffXP layers are built from what the screenshots show; technology reads `Pending confirmation`
  as a dashed chip. The generic hero model is labelled `Reference architecture, illustrative`.
- Selected-work fields: Problem and Architecture use the verified descriptors; Technology and Outcome stay dashed
  placeholders. No metrics. The agent sheet is `Illustrative`, not a client project.
- Dimension numbers are measured from the rendered drawing. `REV` is the real git commit count (`__BUILD_NUMBER__`).

## 8. Component architecture

```
concepts/architecture/index.html           tailwind.architecture.config.js
src/concepts/architecture/
  main.jsx App.jsx architecture.css content.js
  model/      layers.js project.js timeline.js          pure, tested; shared by SVG and three
  hooks/      useInView useReducedMotion useScrollProgress useMedia
  state/      motion.js                                  pause store -> data-motion on <html>
  ui/         Sheet Dimension Draw Reveal Button Chips Legend Mono
  chrome/     Header DatumRail TitleBlock
  hero/       Hero HeroDrawing HeroScene scene/*         SVG first, lazy WebGL on top
  architecture/ Capabilities/ process/ staffxp/ work/ finale/
```

Section order, tokens, primitives, model and `content.js` are owned by the lead; section folders by their author.

## 9. Acceptance checklist (Phase 7)

New hero composition, nav, IA, content hierarchy, case-study treatment, motion language, effect strategy, CTA
treatment, recognisable XionTechs branding. WCAG AA for every token pair (tested), keyboard path through every
interaction, reduced motion shows final states with no information lost, no horizontal overflow at 360 px, the
`three` chunk absent when the fallback applies, `npm test`, `npm run lint`, `npm run build` green, screenshots
reviewed at 1440, 1024, 768 and 390 px.

## 10. Section contract (for anyone adding or changing a sheet)

- **Ownership.** The lead owns `content.js`, `architecture.css`, `ui/`, `model/`, `hooks/`, `state/`, `chrome/`,
  `App.jsx`, `BelowFold.jsx`. A section folder is owned by its author. Extra strings go in `<folder>/copy.js`
  with a source tag per value; extra CSS (keyframes, 3D) goes in `<folder>/*.css` as plain CSS (no `@tailwind`).
- **Shape.** One default-exported component per sheet, no props: `<Sheet id band labelledBy>` containing
  `<SheetHeader id>` and `<SectionHead>`. One `h1` on the page (hero), one `h2` per sheet, `h3` below.
  Do not import from `src/components`, `src/workflow` or `src/concepts/command`.
- **Layout.** `bp-wrap` and a 12-column grid, asymmetric, hairlines (`border-bp-rule`), square corners, no cards
  with shadows, no glow, no gradients, no glass. The sheet is a drawing, not a UI kit.
- **Colour.** Tokens only: `text-bp-*`, `bg-bp-*`, `border-bp-*`, `stroke-bp-*`, `fill-bp-*`, or
  `rgb(var(--bp-x))`. Canvas and WebGL read the variables with `getComputedStyle`. Yellow is never text on
  paper. Muted text is `text-bp-mute`.
- **Line types.** Solid = confirmed or structural. Dashed (`.bp-dashed`, `strokeDasharray`) = illustrative,
  pending or hidden, always with a text label or `Chip` as well (never colour or line style alone).
- **Plotting.** On entering the viewport a sheet's drawing plots itself: `.bp-draw` on SVG shapes (set
  `pathLength="1"` and `style={{ '--d': '240ms' }}`), `.bp-fade` for dashed shapes, `.bp-rise` for text, and
  `Dimension` for yellow measurements. They react to `data-in="true"` on `Sheet` or `Plot`.
- **Scroll-linked motion.** `useScrollProgress(ref, { mode, onProgress })` writes `--p` and calls back outside
  React. Never `setState` per frame. A sticky stage is a tall container with a `position: sticky` child. Below
  1024 px and under reduced motion there is no sticky stage: show the final state or stacked drawings.
- **Reduced motion.** `useReducedMotion()`; every effect shows its final state and no information is lost.
  Loops longer than five seconds use `.bp-loop` or subscribe to `state/motion.js` (Pause Motion).
- **Accessibility.** Interactions are `button`s with `aria-expanded` / `aria-pressed`; hover is never the only
  path (focus does the same); visible focus; targets at least 24 px; text from `content.js`; decorative SVG is
  `aria-hidden`, meaningful drawings get a text equivalent.
- **Honesty.** No invented numbers, clients, quotes or outcomes. DRAFT is for wording, never for a fact.
  Technology and outcome that nobody confirmed read `Pending confirmation` in a dashed chip. Numbers on a drawing
  are measured from the drawing.
- **Mobile.** At 767 px and below the diagram is redrawn as a vertical system, not scaled down. No horizontal
  overflow at 360 px. Annotations stay readable (11 px mono minimum).
- **Tests.** Pure logic lives in `.js` modules with a vitest `*.test.js` beside them.

## 11. As built: where the build differs from the plan

- **Hero camera.** The hero does not draw its SVG through `model/project.js`. One shared perspective camera
  (`hero/camera.js`, 22 degree FOV) feeds the SVG, the labels and the three scene, so the SVG shows the same
  plan-to-axonometric tilt as WebGL and the crossfade is seamless (a diff overlay at p = 0, 0.5, 1 showed almost no
  difference). `project.js` is still used by the process sheet and the finale.
- **Lines.** The scene uses three's fat lines (`LineSegments2`) and reveals them with `instanceCount`, not
  `setDrawRange`. The `three` chunk is shared with Concept 01 (about 131 kB gzip); the hero's own scene code is about
  8 kB gzip; the hero in the main chunk about 9 kB.
- **Quality gate.** Headless SwiftShader fails the 40 fps probe by design, so `?hero=webgl` skips the probe and
  `?hero=svg` forces the fallback (both for QA). WebGL needs width >= 1024 here, not 768: between 768 and 1023 the
  SVG drawing is used.
- **Plotting.** The "nearest ancestor" rule for `data-in` is implemented with an inherited custom property `--in`
  (see `architecture.css`), found by the work and architecture agents. Section CSS that still keys on
  `[data-in='true']` matches any ancestor, so those sheets pass `data-in="false"` to `Sheet` and gate on their own
  observers.
- **StaffXP.** Live mode needs a viewport of at least 1024 x 740; shorter or narrower gets the static view (annotated
  screenshot, a small static stack, the layers as a list). The heading sits above the sticky run. Planes are
  mouse-only; keyboard users get the same hover and select through the layer buttons. The closed state shows the
  real dashboard with four hairline sheets behind it, not an empty outline.
- **Process.** The pin is 560vh; only the integer stage reaches React state.
- **Finale.** 100 segments converge from the five slab outlines onto the two X strokes; `X_STROKES` in
  `finale/converge.js` duplicates the stroke geometry of `ui/Marks.jsx` `XMark`.
