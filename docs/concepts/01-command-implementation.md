# Concept 01, X / Command: implementation spec

Source brief: `docs/idea/01-X-Command.md` (art direction) and `docs/idea/00-Visual-Experience-System.md`
(shared rules). This file turns them into a build plan, following the brief's own order (§11):
art direction → tokens → typography → component architecture → motion system → build → review.

The page lives at `/concepts/command/` (`concepts/command/index.html`, entry
`src/concepts/command/main.jsx`). It does not touch the main landing page.

## 1. One idea

> **Hero visual signature:** a dynamic X-shaped data core.
> **Page-wide interaction signature:** telemetry and system activation.

The X is not the logo. It is a network: four arms leave a hub, and the same graph
(1) sits in the hero, (2) splits into the four capability modules, (3) lines up as the
six-step pipeline, (4) shrinks to a status chain over the deployments, (5) converges into
the XionTechs logo at the end. One object, one continuous system. Everything else on the
page (grid, labels, counters, signal lines) supports that idea and nothing else.

Success test (brief §12): a visitor reads **AI + engineering + production execution** and the
page feels closer to an engineering control center than an outsourcing site.

## 2. What keeps it from looking generic

Brief §4 and 00 "General Anti-Pattern". Do not use:

- purple or blue-violet gradients, a glowing orb, glass cards, neon, a split SaaS hero;
- three equal rounded cards (modules are rows, deployments are a ledger, signals are a data sheet);
- animation that carries no meaning (every effect answers "what is the system doing?");
- rounded containers. Panels are framed by hairlines and four corner ticks (`cmd-ticks`).

Yellow is a signal: active state, CTA, measurement, transition, final reveal. Never a background flood.
The one place yellow fills a large area is the highlight sweep behind "IT done." in the hero.

## 3. Design tokens

Defined as CSS variables in `command.css`, exposed as Tailwind colours under `cmd-*`.
Never hardcode a hex colour in a component.

| Token | Value | Use |
|---|---|---|
| `cmd-bg` | `#071B34` deep navy | page |
| `cmd-surface` | `#0B2342` navy | panels |
| `cmd-raise` | `#112F56` | hover / raised panel |
| `cmd-line` | `#1F3A5E` | hairlines, grid |
| `cmd-text` | `#FFFFFF` | headings, primary text |
| `cmd-muted` | `#B8C4D4` | body (10.4:1 on bg) |
| `cmd-faint` | `#8094AE` | mono labels, metadata only (5.6:1) |
| `cmd-signal` | `#F5C400` | yellow fills, lines, dots |
| `cmd-signal-fg` | yellow on dark, `#7A5C00` on paper | yellow used as text |
| `cmd-signal-ink` | `#071B34` | text on a yellow fill |
| `cmd-ok` | `#47CD89` | status dot "online" |

`data-band="paper"` re-scopes the same names to a light palette (bg `#F3F5F8`, text navy). The
`signals` section is the only paper band. It is opaque, so it covers the fixed canvas.

Shape: no border-radius (except status dots). Spacing: container `mx-auto max-w-[1280px]
px-5 sm:px-8 lg:px-12`; section padding `py-24 lg:py-32`. Hairline `border-cmd-line`.

## 4. Typography

| Role | Class | Notes |
|---|---|---|
| Hero h1 | `cmd-display` + `text-[clamp(2.75rem,8.4vw,7.75rem)]` | Archivo, width 112, uppercase, tight |
| Section h2 | `cmd-h2` + `text-4xl sm:text-5xl lg:text-6xl` | |
| Item title (h3) | `font-cmd-display text-2xl font-semibold uppercase tracking-tight` | |
| Body | `font-cmd-sans text-base` or `text-lg`, `text-cmd-muted` | Inter |
| System label | `cmd-label` | JetBrains Mono 11 px, uppercase, 0.12em tracking |
| Big number | `font-cmd-display text-6xl font-bold tabular-nums` | counters |

Write copy in sentence/Title Case and let CSS uppercase it (screen readers read normal words).
Buttons and nav use Title Case in source (repo convention). Use `…` and curly quotes; no em dashes in new body copy.
Use uppercase technical labels sparingly (brief §9).

## 5. The data core (scene contract)

**Shared files, owned by the lead, do not edit:** `scene/store.js` (state + environment),
`scene/graph.js` (the X as a graph), `ui.jsx`, `command.css`, `content.js`, `CommandApp.jsx`,
`tailwind.config.js`, `vite.config.js`.

- `scene/store.js`: `sceneState` is a plain mutable object. DOM writes it, the canvas reads it every
  frame. **Per-frame values never go through React state.** `setFlowTarget`, `setPointer`,
  `setActiveSection`, `setPaused`, `subscribe`, `detectQuality`, `readEnvironment`, `anchorProps`.
- **Anchors.** An element with `data-xcore-anchor="<id>"` (use `{...anchorProps('hero')}`) is a
  place the canvas arranges the core around. The scene measures them; sections never import the scene.
  `hero`, `module-1…4`, `process-1…4`, `deploy`, `final`.
- **Section ids (DOM):** `top, modules, process, deployments, signals, contact`, each rendered as
  `<section id="…" data-cmd-section …>`. Sections are transparent (the fixed canvas shows through)
  except `signals`, which is an opaque paper band.
- **Graph.** `buildXGraph()` returns hub + 4 arms (NW, NE, SW, SE = modules 1 to 4) + ring edges, in
  unit space. `projectToBox` fits it into an SVG box. The hero's static fallback and the WebGL scene
  must both be built from it, so they are the same X.
- **Canvas.** One fixed, full-viewport, `pointer-events: none`, `aria-hidden` canvas, `z-index: 0`,
  under `<main>` (`z-10`). `PerspectiveCamera` set so the z = 0 plane is 1 world unit = 1 CSS px,
  origin at the viewport centre, y up; DOM rects convert directly to world positions.
- **Phases** by what is on screen (the section holding the viewport's centre line, blended by
  smoothstep across the gap to the next):
  `0 hero X` → `1 four module clusters (each arm travels to its module anchor)` →
  `2 pipeline (arms merge into four step clusters, packets travel the chain)` →
  `3 compact chain at the deploy anchor, dimmed` → `4 signals (covered by the paper band: stop drawing)` →
  `5 converge into the logo at the final anchor`.
- **Visual language.** Thin additive lines; small node points with soft halos; a few yellow
  packets travelling the edges; orbiting particles; a yellow energy core at the hub that fades as the
  arms leave; one yellow signal. No bloom pass, no post-processing, no glass, no purple.
- **Interaction.** Idle: slow rotation and breathing. Pointer (`quality: 'high'`, fine pointers only):
  the object leans toward the cursor by a few degrees and offsets up to ~18 px. Hover on a
  `flow` CTA: `sceneState.flowTarget` rises, packets and orbits speed up (eased by `stepFlow`). Scroll: the
  phase blend above.
- **Quality.** `high`: ~360 orbit particles, 28 packets, DPR ≤ 2. `low` (phones, touch, weak devices):
  ~140 particles, 12 packets, DPR ≤ 1.25, no pointer follow. `off`: no canvas, no `three` download.
  The canvas stops rendering when the tab is hidden, when `signals` covers the viewport, and while
  `sceneState.paused`. It sets `document.documentElement.dataset.xcore = 'on'` after its first frame and
  removes it on unmount, so `.xcore-fallback` elements fade out.
- **Static fallback.** Everything an anchor box shows without WebGL is a real element inside that box
  with class `xcore-fallback` (an SVG built from `graph.js`, a module visual, a step node, the logo).
  With the canvas off or not yet loaded, the page must look finished (Level 1, 00 "Quality Bar").
- **Logo.** The finale converges into the real logo: sample the opaque pixels of
  `brand.logo.src` (an offscreen canvas) into target points, with yellow pixels staying yellow. If sampling
  fails, converge into the generic X. The logo is only 250 × 46 px: keep it at its natural size on
  screen (it is a placeholder for the official SVG).

## 6. Motion system

Restrained and technical (brief §8). Every effect is one of these; do not add others.

| Id | Effect | Where | Trigger |
|---|---|---|---|
| M1 | Reveal: 14 px rise + fade | any block | once, on entering view (`Reveal`) |
| M2 | Yellow highlight sweep behind a word | hero "IT done." | once, ~500 ms after load |
| M3 | Number counter 0 → value | signals tiles, deployment bar | once, on entering view |
| M4 | Yellow signal line across the viewport | key section activates | each activation (BuildHud) |
| M5 | Scan line + timestamp, ≤ 700 ms | section change | each change (BuildHud) |
| M6 | Local hover: status chip + particle drift | module rows | hover / focus |
| M7 | Data flow: packets, orbits, node drift | canvas, hero SVG packets | continuous, pausable |
| M8 | Grid drift tied to scroll | page | scroll (CSS variable) |
| M9 | Pipeline progress fill + step activation | process | scroll-linked |
| M10 | Region assemble: scan reveal, then hotspots light in turn | deployments viewer | on selecting a record |
| M11 | Finale: GET / IT / DONE steps in, yellow rule draws, logo settles | final | once |

Rules: tokens `--dur-micro` (160 ms), `--dur-base` (420), `--dur-section` (800), ease `--cmd-ease`; no
bounce, no `transition: all`; animate `transform` and `opacity` only; scroll and pointer handlers write CSS
variables or the store, never React state per frame; stop off screen (`useInView`);
**reduced motion shows every final state with no information lost**; any loop longer than 5 s is covered
by the Pause Motion control (BuildHud, `setPaused`); effects never make text hard to read.

## 7. Components and ownership

```
CommandApp.jsx            lead     composition, lazy canvas, quality decision
ui.jsx command.css content.js  scene/store.js scene/graph.js     lead (shared, read-only for others)

Nav.jsx                   frame    fixed header, active section, mobile menu
BuildHud.jsx              frame    section tracking, build counter (vertical, left margin), M4, M5, M8
PauseMotion.jsx           frame    Pause Motion button, rendered in the header (Nav)
FinalCta.jsx (+ .css)     frame    closing statement, M11, logo
Footer.jsx                frame    footer

Hero.jsx (+ .css)         hero     headline, M2, CTAs, telemetry grid
SystemStatusPanel.jsx     hero     the illustrative status panel
XCoreFallback.jsx         hero     static SVG X core (from graph.js), M7 packets in CSS

scene/XCoreCanvas.jsx     scene    React wrapper: mount, resize, cleanup, data-xcore
scene/render.js           scene    three.js scene, particles, packets, frame loop
scene/layout.js (+ test)  scene    pure: anchors → per-phase target positions, blends
scene/phases.js (+ test)  scene    pure: section rects → continuous phase
scene/logoPoints.js       scene    sample the logo into target points (browser)

Modules.jsx ModuleVisual.jsx Process.jsx (+ .css)   modules   sections 02 and 03
Deployments.jsx ProductViewer.jsx Signals.jsx (+ .css)  work   sections 04 and 05
```

A component may add its own `*.css` next to it (plain CSS using the `--c-*` variables) for keyframes. No agent edits another
agent's files or the lead's shared files. If you need new copy or a shared change, define a small
local constant marked `// NEEDS content.js` and say so in your report.

## 8. Section briefs

**Nav** (fixed, 56 px, hairline bottom, solid navy at 92% alpha, no blur). Logo left (`brand.logo`,
explicit width/height). Links in mono uppercase; the active one gets a yellow underline (via
`subscribe`). Right: `System / 2026` with a pulsing dot (lg and up), then the CTA as a square button
with a `→`. Below `lg`: a menu button (`aria-expanded`, `aria-controls`), a full-width panel, Esc closes,
focus returns to the button. A hairline brightens after the first scroll.

**Hero** (`id="top"`, `min-h-[100svh]`). Left (7 of 12 columns): eyebrow; three-line h1 (`hero.headline`;
accessible name `hero.headlineLabel`), yellow sweep behind the accent line; intro; primary CTA with
`flow` and secondary; a row of telemetry labels. Right (5 of 12, 40 to 45 % width): a square box with
`anchorProps('hero')`, the static X core inside it, and `SystemStatusPanel` overlapping its lower right.
Background: `cmd-grid` telemetry grid with tiny coordinate labels in the corners and an occasional yellow
pulse along a grid line (slow, CSS only). `SystemStatusPanel`: corner ticks, "System status", four
rows with a pulsing dot and `Online`, a deployment bar that fills to the value once (M3), a build row,
and the visible `IllustrativeTag`. Tablet: panel moves below the headline. Mobile: panel becomes a 2 × 2 grid of
modules; headline stays large and readable; no horizontal overflow.

**Modules** (`id="modules"`). `SectionHead`, then an `<ol>` of four rows separated by hairlines (not cards).
A row: index and short label, h3 title, description, three points, a status chip (`● Available`, shown
on hover/focus on desktop, always on touch), an optional link, and a right-hand box with
`anchorProps(item.anchor)` holding that module's `ModuleVisual` (class `xcore-fallback`): a small SVG
diagram by `kind` (code: lines compiling; ai: decision nodes; cloud: stacked layers; product: modules
snapping together). Hover/focus runs M6: a few particles drift inside the row.

**Process** (`id="process"`). `SectionHead`, then four steps in one pipeline: horizontal on `lg` and up, a vertical
timeline below. Each step has `anchorProps(step.anchor)` above or beside it holding a small node
(`xcore-fallback`), the index, title and description. A line fills as the section scrolls (M9,
`useScrollProgress` writing `--p`), steps turn yellow as it passes, a packet travels the line. A small
`Step 02 / 04` readout updates. Without motion the line is full and all steps are on.

**Deployments** (`id="deployments"`, headed "Selected work": its status is pending, so it never says "shipped" or "deployed"). `SectionHead` with an `anchorProps('deploy')` box at its right
(`xcore-fallback`: a small chain). Below: a ledger (left, 4 of 12 columns) of the three records, then the viewer
(right, 8 of 12). The viewer is a monitor frame (corner ticks) showing the record's real screenshot with
`width`/`height` set, with its regions outlined in yellow and labelled. Selecting a record plays M10.
Under the frame: the region list (hover, focus or tap highlights the region), then a record sheet:
Sector, Seen in the product (region labels), Stack and Status as `PendingTag` (never "production"), tags
(`tagsDraft` → `DraftMark`). The Agent demo record has no screenshot: it shows an illustrative panel with the
`IllustrativeTag` and a link to `/#ai-agents`. ESS is a wide screen: let it scroll sideways inside the frame on
phones, with `scrollHint`. Not a three-card grid.

**Signals** (`id="signals"`, `data-band="paper"`, opaque). `SectionHead`; a data sheet of four tiles divided by
hairlines: real numbers count up (M3) with their source; `confirm` shows a `To confirm` tag; `placeholder`
tiles show `—` and a `PendingTag`, never a number. Then the capability map: one row per engineering layer
with its technology chips; rows marked `draft` carry `DraftMark`; lines draw in as the rows enter. No testimonials,
no invented metrics, no magnitudes.

**FinalCta** (`id="contact"`). `finale.kicker` as the h2 (the accessible statement is `finale.title`);
`GET / IT / DONE.` set huge as a staircase (each word indented further); an `anchorProps('final')` box
holding the logo (`xcore-fallback`); primary mailto CTA with `flow`, secondary ghost link, `primaryNote`. M11 plays once on
entering view. Reduced motion shows the finished state.

**BuildHud** (the Pause Motion button moved into the header, where it never covers content, and the counter stands on its end in the left margin from lg up). Tracks the active section (the `[data-cmd-section]` holding 45 % of the viewport height) and calls
`setActiveSection`; writes `--cmd-scroll` on `.cmd-root` (rAF-throttled); shows `BUILD 003 · PIPELINE` bottom
in the left margin (`aria-hidden`, mono, a digit roll, large screens only); M4 on modules, process, deployments and contact; M5 on each change (skip the first,
skip when reduced or paused); the Pause Motion button bottom right (`aria-pressed`, 44 px target, calls `setPaused`).

**Footer**. Logo, positioning line, real contact details (`mailto:`, `tel:` links), the two addresses, social
links (new tab, with a visually hidden "opens in a new tab"), copyright, the concept note and a back-to-top link.

## 9. Content honesty (challenge rules)

- No Lorem Ipsum, no invented testimonials or statistics. Real or labelled (CLAUDE.md "Content rules").
- The status panel (98 %, build `#4821`, `Online`) is **illustrative**: it carries a visible label.
- Numbers: only `25+` (LIVE) and `3` offices (LIVE, `To confirm`). Everything else numeric is a placeholder tile.
- StaffXP/ESS: only the team's sanitized screenshots and only UI visible in them is annotated. Stack and status are
  pending. Do not write "production", ".NET", "React" or "MySQL" as facts for a project.
- The Agent demo is an illustrative scenario, not a client project. Never add an invented third case study.
- The reversed logo is a temporary derivative of the supplied PNG.

## 10. Accessibility, performance, responsive

- Semantic landmarks, one `h1`, ordered headings, `aria-labelledby` per section, visible focus (`:focus-visible`
  is set globally), 44 px touch targets, no information carried by colour alone, contrast per §3.
- Decorative layers (`canvas`, grid, scan, HUD) are `aria-hidden`; they never receive pointer events.
- Respect `prefers-reduced-motion` (§6). Provide Pause Motion for loops over 5 s.
- Images: explicit `width` and `height`, `loading="lazy"` below the fold, meaningful `alt`.
- `three` is only imported inside the lazy canvas chunk. Keep this page's first-load JS light; the canvas
  chunk may be larger. Do not import a library for something CSS can do.
- Breakpoints: mobile (375), tablet (768), desktop (1280). No horizontal page scroll at any width. Do not
  shrink desktop diagrams: re-compose them (vertical pipeline, stacked modules, panel as a 2 × 2 grid).
- Vercel guidelines (`.agents/skills/web-design-guidelines`, `vercel-react-best-practices`) are the QA
  pass after the art direction is built, not its source.

## 11. Open items (see content/TODO.md, "Concept 01")

Official reversed logo (SVG), confirmed yellow, StaffXP status and stack, real signal numbers, Lab page,
publish permission for the screenshots, the offices contradiction.
