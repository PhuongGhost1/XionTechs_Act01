# Concept 01, X / Command (v3, zero-state): plan

Branch `feat/concept-01-command-v3`. Source briefs: `docs/idea/01-X-Command.md`,
`docs/idea/00-Visual-Experience-System.md`. This is a from-scratch design. The earlier build on
`feat/concept-01-command` is reference history only; its code was removed from this branch before
design started so that nothing was copied by habit.

## 0. Context audit (brief §17, Phase 0)

| Checked | Result |
|---|---|
| auto-memory, `CLAUDE.local.md`, `AGENTS.md`, `.claude/` | none exist |
| `CLAUDE.md` | its colour, serif and section-rhythm rules belong to the main landing page. Kept: honesty rules (no invented numbers, labelled placeholders), Windows/Vite gotchas, bundle and a11y conventions |
| old concept code and spec | removed from this branch (still in git history). Not read during design |
| kept as infrastructure | Vite multi-page setup, `three`, Tailwind, vitest, logo, the sanitized StaffXP / ESS screenshots, verified facts |

## 1. Research (Phase 1), what changed the design

Design research (Linear, Warp, Vercel/Geist, Grafana, Fly.io, Railway/Resend/Sentry, SpaceX Dragon UI, NASA
Open MCT): real artefacts beat illustration; one signal colour for state change only; mono as a
functional channel only; index rows beat cards; phase-gated disclosure; honest empty states are on-brand.

Technical research (measured with esbuild, gzip): plain `three` with named imports 136 kB gz, R3F adds
about 55 kB for nothing we need, GSAP + ScrollTrigger 46 kB, framer-motion 34-48 kB, zustand/vanilla 0.4 kB,
a custom rAF + CSS-variable scroll hook under 1 kB. Contrast: `#B8C4D4` on `#071B34` is 9.78:1, `#F5C400` on
`#071B34` is 10.51:1, `#8FA3BA` on `#071B34` is 6.68:1. All pass AA.

## 2. Three directions (Phase 2)

| | A. Mission Control | B. Minimal Control Room | C. Network Core |
|---|---|---|---|
| Hero | dense multi-panel wall | giant type, one status line | X core fills the frame, headline overprinted, status rows ARE the four modules |
| IA | everything visible at once | one idea per screen | one continuous system that changes state per phase |
| 3D | decorative backdrop | none | the X is the object; it splits, connects, converges |
| Case study | live dashboard wall | single quote-like record | deployment ledger with expandable records |
| Risk | cosplay HUD, overload, generic SaaS dashboard | loses the X signature and the "wow" | needs discipline so it does not become an orb |

**Chosen: C, with B's restraint and A's density in exactly one place (the deployment ledger).** It is the
only direction in which the page-wide interaction signature (system activation) and the hero signature
(the X) are the same idea, as the 00 brief asks. A fails the "not a generic dashboard" rule, B drops the
object the brief calls unforgettable.

## 3. Information architecture (Phase 3)

Narrative: *boot the system, see what it can do, watch a request become production, inspect real
deployments, read the evidence, close.* Proof is placed after the visitor understands the mechanism, and
the only conventional sections removed are About, Why Choose Us, Testimonials (no real ones exist) and FAQ.

| # | Section id | Title | What it is | Interaction |
|---|---|---|---|---|
| 00 | `boot` | Hero | X core + headline + 4-row status panel | cursor follow, CTA hover accelerates flow, scroll splits the X |
| 01 | `deploy` | What we can deploy | master/detail module rack, 4 bays | hover/focus/click a bay: detail panel, local node pulse |
| 02 | `pipeline` | From request to production | sticky rail, 6 stages, yellow signal marker | scroll-linked; reduced motion shows all stages |
| 03 | `work` | Selected deployments | ledger of records; record opens in place with tabs SUMMARY / SPEC / LOG / SCREEN | StaffXP assembly sequence on first open |
| 04 | `signals` | Engineering signals | spec-sheet band (the only light band), every value carries `SOURCE:` | count-up on real numbers only |
| 05 | `build` | Final build | `GET IT DONE.` + logo convergence + CTA + contact | 2D canvas points converge on the logo |

Navigation (brief §6): `XIONTECHS   WORK  SERVICES  PROCESS  SIGNALS   [ START A PROJECT → ]`, with
`SYSTEM / 2026` and a hairline yellow progress line under the bar. The brief's `LAB` and `ABOUT` have no
real content, so they are not in the nav.

## 4. Visual system

**Tokens** (CSS variables in `src/concepts/command/command.css`, Tailwind names `x-*`; no hex in components):

| Token | Value | Use |
|---|---|---|
| `x-bg` | `#071B34` | page |
| `x-bg2` | `#0B2342` | panels, rows on hover |
| `x-line` | `#24405F` | hairlines, grid (non-text, 1.8:1 is fine for decoration only) |
| `x-text` | `#FFFFFF` | headings |
| `x-mute` | `#B8C4D4` | body (9.78:1) |
| `x-faint` | `#8FA3BA` | mono metadata (6.68:1) |
| `x-signal` | `#F5C400` | active, CTA, measurement, transition |
| `x-ink` | `#071B34` | text on yellow |
| light band | `data-band="paper"`: bg `#F2F4F7`, text `#071B34`, signal becomes a navy-outlined yellow fill, never yellow text |

Shape: no border radius (status dots excepted), hairlines + corner registration ticks, no glow, no
gradients, no glass. Two decorative devices only: registration crosshairs and the status strip.

**Type:** Geist (display and body, tight negative tracking at display sizes) and Geist Mono (IDs, states,
timestamps, stack names only; uppercase 11-12 px, +0.06em). Google Fonts, `display=swap`. Source text is
written in normal case and uppercased by CSS so screen readers read words.

**Layout:** 12-col grid, content max 1320 px, a visible 1 px column grid in the hero only. Section heads are
a code (`01 / DEPLOY`) + one headline, never centred.

## 5. Signature visual and motion

**Hero visual: the X data core** (WebGL, hero only). One object: 4 arms through a hub, thin additive lines,
nodes, instanced orbiting particles (vertex-shader orbits, zero CPU), pooled packets that travel along edges,
a small yellow core sprite. Every few seconds a few cross-links rewire (reconfigures continuously).
Idle breathing and slow rotation; cursor eases the group; CTA hover raises packet speed; scroll drives a single
`split` uniform that pushes the arm tips outward onto the four module positions.

**Page-wide signature: system activation.** One writer (a rAF scroll controller) publishes progress; DOM
reads CSS variables. On entering a section: a yellow line travels across the viewport once, and a 400 ms scan
sweep with `SYS hh:mm:ssZ · SEC 0n` label plays. A fixed `BUILD 00n` counter ticks as sections activate.

**Choreography within the one-WebGL-canvas rule:**
1. Hero to deploy: WebGL `split` (hero is a 170 vh sticky stage), then the same four labels become the bay list.
2. Deploy to pipeline: SVG bus lines (stroke-dashoffset) draw from the bays into the pipeline rail.
3. Pipeline to work: the rail's final node (`DEPLOY`) becomes the ledger's first status chain.
4. Work: StaffXP sequence in SVG: request packet in, architecture nodes appear, services light, screenshot
   assembles, state label. Architecture nodes are generic layers and carry an `Illustrative` chip.
5. End: a 2D canvas (not WebGL) converges about 600 precomputed points onto the logo. Works without WebGL.

**Loading and fallback:** the headline and CTAs are static HTML (LCP). The canvas box shows
`[ BOOTING X-CORE SYSTEM... ]` and then the core. Static SVG X replaces the canvas when: no WebGL, reduced
motion, `saveData`, `hardwareConcurrency <= 4` on touch devices, context lost and not restored, or an FPS probe
under 40 for the first 60 frames. Mobile: DPR cap 1.5, about a third of the particles, no antialias.
A `Pause Motion` button stops the render loop and the CSS loops (WCAG 2.2.2).

## 6. Stack decision

**No new dependencies.** The 00 brief suggests Framer Motion, GSAP, zustand or R3F "where they solve the
problem"; measured, none is needed for this plan:

| Brief suggestion | Decision | Why |
|---|---|---|
| R3F | plain `three`, named imports, one lazy chunk | one confined canvas; saves about 55 kB gz |
| Zustand / Context for DOM-canvas sync | a 20-line vanilla store in `state/store.js` with selector subscriptions, plus CSS variables | same pattern as `zustand/vanilla`; zero bytes; React state only for discrete values |
| GSAP ScrollTrigger | custom `useScrollProgress` (rAF, `--p`) | scrubbing and sticky are plain CSS + one variable; GSAP would be 46 kB for what 1 kB does |
| Framer Motion | CSS transitions, `Reveal` via IntersectionObserver | no layout animations needed |
| SVG morph | transform + `stroke-dashoffset` + `offset-path` | robust, cheap, accessible |

Revisit only if a pinned multi-tween timeline turns out to need GSAP; it can be added lazily then.

## 7. Content and honesty map

- Brief copy (headline, CTAs, the four module names, six process stages, final CTA) is `BRIEF` sourced (team-authored).
- Real facts: StaffXP and ESS descriptions and visible modules (verified in `src/content/site.js` `LIVE`/`PLAN`
  entries and the sanitized screenshots), service tools named on the live site (Azure, AWS, GCP, Power Platform,
  Make, n8n, Retool, Bubble), three offices, contact details.
- The brief's example UI numbers (`98%`, `BUILD #4821`, `99.8%`, `NODE 014`) are not facts. The status panel
  is headed `Illustrative status`; the deployment bar shows module activation progress during boot (functional,
  not a claim); the build number is the real git commit count injected at build time.
- The brief describes StaffXP as an "Enterprise workforce platform" with status `PRODUCTION` and stack
  `.NET / React / AI / Cloud`. None of this is confirmed (`content/TODO.md`). The record uses the verified
  descriptor (staff experience platform for schools); status and stack read `PENDING CONFIRMATION`.
- Agent Demo is the third ledger row, labelled `DEMO / ILLUSTRATIVE`. No invented third case study.
- Signals: stack matrix with `CONFIRMED` / `PENDING` states and `SOURCE:`; offices; leadership years
  (`LIVE`, flagged to verify); real build counter; empty gauge `NO DATA / AWAITING VERIFIED INPUT`.

## 8. Component architecture

```
concepts/command/index.html
src/concepts/command/
  main.jsx  App.jsx            shell, section order, lazy chunk for below-the-fold
  command.css                  tokens, grid, ticks, scan, signal line, reduced-motion rules
  content.js                   every string, each with a source comment
  state/store.js               vanilla store: { progress, section, pointer, flow, paused, quality }
  state/scroll.js              one rAF controller: writes store + CSS variables
  hooks/                       useReducedMotion, useInView, useStore(selector), useMedia
  ui/                          Tick, Label, StatusDot, Button, SectionHead, Reveal, ScanSweep, PauseButton
  hero/                        Hero.jsx StatusPanel.jsx XCore.jsx XCoreFallback.jsx
  scene/                       graph.js flow.js quality.js render.js  (pure + three; tested)
  deploy/                      Deploy.jsx ModuleVisual.jsx
  pipeline/                    Pipeline.jsx progress.js
  work/                        Ledger.jsx Record.jsx Assembly.jsx
  signals/                     Signals.jsx
  finale/                      Finale.jsx converge.js logoPoints.js (precomputed)
  chrome/                      Header.jsx BuildCounter.jsx Footer.jsx
```

Section order, tokens and `content.js` are owned by the lead; section folders are owned by their author.

## 9. Acceptance checklist (Phase 7)

New hero composition, IA, content hierarchy, case-study treatment, motion language, effect strategy, CTA
treatment, recognisable XionTechs branding. WCAG AA contrast, keyboard path through every interaction,
reduced-motion shows final states with no information lost, no horizontal overflow at 360 px, WebGL chunk
lazy and absent when the fallback applies, `npm test`, `npm run lint`, `npm run build` green, screenshots
reviewed at 1440, 1024, 768 and 390 px.
