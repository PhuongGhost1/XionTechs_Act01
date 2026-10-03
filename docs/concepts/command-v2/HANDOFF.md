# Handoff: Concept 01 v2 (X / COMMAND), state at 2026-10-03

Written so someone can continue on another machine with no memory of the session that built it.
Read this first, then `00-direction.md` (the design, the law) and `01-contract-notes.md` (exact APIs).

## 1. What this is

A fresh redesign ("zero-state") of the XionTechs landing page as a separate page, `/concepts/command/`,
built from the v2 briefs in `docs/idea/v2/`. It is **not** the main page and shares no code with it.
Name of the design: **STANDBY CORE**: a quiet navy page where one X, drawn from the eight confirmed
services, is cut by two hairlines, splits into four modules, runs as a six-step line, steps aside for two
real screenshots, and converges into the XionTechs mark; every node says whether it is confirmed,
pending or illustrative, and what the visitor selects becomes the email they send (`mailto:`).

- Branch: `feat/concept-01-command-v2` (branched from `feat/concept-01-command`, then v1 was removed; v1 stays on its branch as reference only and must NOT be used as a source: zero-state rule).
- Stack: Vite 5, React 18, Tailwind 3 (own config), Vitest, three 0.186 (lazy chunk), Geist fonts self-hosted.
- Rules that bind everything: `CLAUDE.md` section "Concept 01 v2" (zero-state import guard enforced by
  ESLint, tokens only, copy only in `content/` with a `src` tag, `<html>` data-* written only by
  `contract/attributes.js`). The challenge rules (no invented content, labelled placeholders, commit as
  yourself, `PROMPT_LOG.md`) apply.

## 2. Set up on a new machine

```bash
git clone <repo> && cd XionTechs_Act01
git switch feat/concept-01-command-v2
npm install          # three, @fontsource-variable/geist(+mono), puppeteer-core are in package.json
npm run dev          # http://localhost:5173/concepts/command/   (?tokens = token story, ?view=raw = RAW view)
npm run lint && npm test && npm run build     # expected: lint clean, ~745 tests pass, build ok
```

Dev-only switches: `?tier=high|low` mounts the WebGL canvas even when the browser reports a software
renderer (via `core/devMount.js`); `?review` shows DRAFT marks; `?debug=hotspots` overlays the screenshot
regions; `?view=raw`.

### Visual QA (important: it is how most bugs were found)
`scripts/qa/` has headless-Edge helpers (puppeteer-core). They hard-code the Windows path
`C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe`: edit it for macOS/Linux (any Chromium).
On Windows run them from **PowerShell, not Git Bash** (Edge does not launch from Git Bash). Stray Edge
processes can hold the `profile-<tag>` folders: use a new tag or stop those processes.
```
node scripts/qa/shot.mjs 1440 900 mytag [url] [reduced]   # every main > section[id] -> scripts/qa/out/*.png
node scripts/qa/snap.mjs 390 844 mytag "0,1200,#line"       # screenshots at offsets or section ids
node scripts/qa/probe.mjs 1280 800 "#line" "<js>" mytag       # evaluate JS in the page (REDUCED=1 env = reduced motion)
node scripts/qa/interact.mjs 1280 800 mytag                   # older interaction script (v1 selectors, adapt)
node scripts/command-qa.mjs                                   # build + serve + screenshots + budgets + forbidden strings
```
`snap/probe/shot` expect the dev server on port 5173. LOOK at the PNGs: reports of "not verified in a
browser" shipped real bugs on v1.

## 3. What is done (all committed)

18 commits on top of `4a166db` (v1 removed, v2 briefs added):
1. **Design document** `00-direction.md` (research of 12 references, 3 directions compared, decision, IA,
   visual system, X-core state machine, 18 motion effects M01 to M18, case studies, acceptance checklist).
2. **WP0 contract**: tokens/base/motion/raw styles, Tailwind config, content module with source tags and
   honesty tests (`content/content.test.js`), contract (attributes, stations, anchors, brief store + mailto),
   runtime (scroll, capability/tier, governor), UI primitives, zero-state ESLint guard, page entry, stubs.
3. **WP1 frame/runtime**: header, dock with scrubber, mobile bar, signal line, hairlines, RAW view,
   hardened scroll controller, tier selection, ambient (off-screen/hidden) pausing, pause rule.
4. **WP2 core**: graph, layouts (x, arms, line, field, mark), finished SVG figures, hand-traced X mark,
   lazy three.js canvas (one point pool morphed in the vertex shader, <= 5 draw calls), governor hookup.
   `core/preview.html` (dev) shows every layout.
5. **WP3** hero (hairlines at 32 degrees, tags on arm tips, legend), Premise (word lighting), Deploy
   (four modules, sticky instrument, ADD TO BRIEF checkboxes).
6. **WP4** The Line (pinned six-step stage, linear packet, illustrative failure beat, list fallback).
7. **WP5** On File (StaffXP and ESS real screenshots, linked hotspots, plate scan, pending rows, DEP-003
   illustrative) and Ledger (what is real, chip highlight).
8. **WP6** Done (finale GET / IT / DONE, composer with SEND EMAIL and COPY TEXT, footer) and
   `scripts/command-qa.mjs` (budget and forbidden-string gate).

State at the last check: `npm run lint` clean; `npm test` 745 passing; build ok. Entry JS about 45 kB gzip
(+ shared react chunk), WebGL chunk 148 kB gzip (budget 180), fonts 52 kB. Looked at in a browser at 1440x900,
390x844 (and 320 by the packages): all seven stations render and look finished; WebGL canvas not yet
reviewed by a human (the harness browser reports a software renderer, tier "off", so SVG tier is what was seen).

## 4. What is NOT done (do these next, in this order)

### 4.1 Known defects (found by the lead, not yet fixed)
1. **CSS budget**: command CSS is about 14.7 kB gzip against 14 kB. `node scripts/command-qa.mjs` exits 1
   until trimmed (look for unused utilities and arbitrary values, per-placement tag rules in
   `sections/Standby/standby.css`).
2. **Page length**: about 15 viewports at 1440x900 (13,500 px) vs target 11.5. ON FILE is about 3,900 px
   (each plate about 1,900): shrink name block, screenshot width or plate spacing (`sections/OnFile`).
   DEPLOY is about 1,745 px vs 1,350 target.
3. **Footer inside `<main>`**: no contentinfo landmark. Move `<Footer />` (named export of
   `sections/Done/Footer.jsx`) out of `sections/Done/index.jsx` and render it after `</main>` in `App.jsx`.
4. **Premise anchor** (`sections/Premise`): the core is parked at the top of the track, so the dimmed core
   is not on screen at the premise stop. Make that anchor sticky (like the deploy instrument).
5. **Hero tag hover -> core arm**: `sections/Standby` should pass the hovered/focused tag index
   (0 CODE, 1 AI, 2 CLOUD, 3 PRODUCT) as `active` to the hero `<CoreFigure>` (it publishes through
   `core/armState.js` so the canvas lights the same arm).
6. **1024x768**: `.hero-tag__full` overflows by 5 px (page scrollWidth 1029). Also `.line-mover` and the line
   core figure reach beyond the viewport (clipped, harmless today).
7. **Header WORK link** is 32 px wide (44 px target rule). Also the 56 px mobile-bar strip is reserved at the
   very end of the page on phones.
8. **Sticky anchors**: `contract/anchors.js` caches document rects; for `position: sticky` anchors (deploy
   instrument, line, done) the rect drifts. WP2 works around it with live rects (`core/placement.js`); either
   keep that or measure sticky anchors live in `anchors.js`.
9. **Legend line "STEPS: DRAFT · FAILURE BEAT: ILLUSTRATIVE"** in The Line shows to every visitor, which
   conflicts with the rule "DRAFT marks only in dev or `?review`". Decide (doc 4.5 says show it).
10. **200% text zoom** at 320x640: the finale lockup can be clipped; other packages overflow sideways at that zoom.
11. Smaller notes from the packages: hero type deviates from doc 5.2 on purpose (size cap, tracking, to
    avoid ENGINEERING colliding with the 04 PRODUCT tag); finale tracking -0.045em instead of -0.06em;
    hotspot `counters` box height changed 11.0 -> 9.0; limited hotspot tags only from 1024 px; on touch a hero
    tag needs two taps; inactive Deploy panels are `hidden` on wide screens (screen readers).

### 4.2 Review (was running when the session stopped; results were NOT saved)
A 10-lens independent review was started and interrupted. Re-run it after fixing 4.1. Lenses: accessibility
and RAW; correctness (code + tests); performance; content honesty; Vercel web-design guidelines
(`.agents/skills/web-design-guidelines`); Vercel React practices; layout at 320 to 1920 and short/tall
windows; compliance with the design doc (checklist 13.1 to 13.3 and effects M01 to M18); the WebGL core
(use `?tier=high`); zero-state (no copying from the old page or from branch `feat/concept-01-command`).
Method that worked: read-only reviewer per lens (max 8 findings each), then two skeptics per finding
(one tries to refute, one judges impact); fix those confirmed by both.

### 4.3 Housekeeping
- `PROMPT_LOG.md` has no entry for v2 yet. Add one (decisions below, and the AI mistakes).
- `content/TODO.md` still has the "Concept 01" section of v1; update it for v2 (open questions below).
- Never run plain `npm run build` while other tools write `dist/`; use `--outDir` to a scratch folder.
- Commit as yourself in small commits; the challenge scores git history of the three teammates.

### 4.4 Not built on purpose
Repository commit strip (`SHOW_REPO_STRIP=false`), Lab page, About/FAQ/Testimonials (the IA omits them),
a hosted form (only `mailto:` + copy), analytics/cookies.

## 5. Decisions made on the team's behalf (confirm or change)
Fonts Geist + Geist Mono; added `--void #050F1F`; yellow stays `#F5C400`; `NAME_PRODUCTS = true` (names
StaffXP and ESS shown); LinkedIn and Facebook URLs included as FACT from the live site; offices, street
addresses and legal name omitted (shown only under `?review`); module grouping of the eight services as in
doc 4.4 (Staffing under Product Development, AI-Driven Analytics under AI; no DATA arm); DEP-003 links to
`/#ai-agents` of the main page; `staffxp-sign-in.webp` not used (purple, would break the no-purple rule).

## 6. Open questions for the team (full list: `00-direction.md` section 14)
Larger logo or SVG (the logo is a 250x46 PNG; the converge-into-logo ending uses a hand-traced X mark in
`core/mark.js` plus the PNG at native size: replace when a vector exists); legal name and which offices are
real; may the AI assistant "Felix" in the StaffXP capture be named; permission to name StaffXP/ESS; production
status, stack and results (all PENDING); confirm the "25+ years of leadership" wording; is `mailto:` enough as
the only conversion; does `/#ai-agents` stay live on the deployed main page; regenerate `og-image.png` and
favicon from this design.

## 7. Things that bit us (avoid repeating)
- A `loading="lazy"` image inside a box that is clipped/hidden until the image loads never loads. Keep the scan
  tied to the plate's visibility, not the image load.
- A CSS rule that sets the `animation` shorthand beats a less specific `animation-play-state: paused`; the
  pause rule in `styles/motion.css` is deliberately heavy.
- Fixed bars over text, opacity-dimmed text below contrast, long gradients to faded nodes: all found only by
  looking at screenshots.
- Some files use CRLF (`CLAUDE.md`, `PROMPT_LOG.md`, a few agent-written files): a multi-line string replace
  can silently fail; grep after scripted edits.
- Git Bash: backticks inside `node -e "..."` are executed by the shell; write scripts to files instead.
- Tailwind scans every file for the config it is given: keep `src/concepts/**` excluded from the main config.

## 8. How the work was organised (reuse the pattern)
Lead wrote design doc + contract (WP0); then six packages in parallel with strict file ownership (WP1 frame/runtime,
WP2 core, WP3 standby/premise/deploy, WP4 line, WP5 on-file/ledger, WP6 done + QA script), each checking its own
screenshots; then a multi-lens review with skeptic verification. Ownership table and acceptance checklist:
`00-direction.md` sections 11 and 13.
