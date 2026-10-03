# X / COMMAND v2: Direction and Design Document

Working name: **STANDBY CORE**
Branch: `feat/concept-01-command-v2` · Entry: `concepts/command/index.html` · Code: `src/concepts/command/`
Status: lead-designer decision, ready for work-package split. Written 2026-10-03.
Briefs this answers: `docs/idea/v2/01-X-Command.md`, `docs/idea/v2/00-Visual-Experience-System.md`.

One sentence: **a quiet navy page where one X, drawn from the services XionTechs actually lists, is cut by two hairlines, splits into four modules, runs as a six-step line, steps aside for two real screenshots, and converges into the XionTechs mark, while every dot on screen says whether it is confirmed, pending or illustrative and everything the visitor selects becomes the email they send.**

Reading guide: sections 1 to 14 are in the order the task asked for. Section 11 and 12 are the build contract. Anything in `[brackets]` is a value to verify by measurement, not a claim.

---

## 1. Zero-State audit

I treated the repository as unknown. I listed file and folder **names** only to find anchors; I did not open `src/components/`, `src/App.jsx`, `src/index.css`, `src/content/site.js`, `docs/idea/XionTechs_Landing_Page_*.md`, the v1 briefs `docs/idea/0*.md`, or any other branch. What I did read: the two v2 briefs, the three `project-0n-*.md` write-ups, the three screenshots in `public/work/` and the logo PNG.

### 1.1 What could anchor a designer, and the neutraliser

| Anchor found | Where | Neutraliser |
|---|---|---|
| Old landing page: components, hooks, workflow engine, `App.jsx`, `index.css`, content module | `src/components/`, `src/hooks/`, `src/workflow/`, `src/content/`, `src/App.jsx`, `src/index.css`, root `index.html` | Out of bounds for this concept. ESLint `no-restricted-imports` override for `src/concepts/command/**` forbids any import that resolves outside that folder (npm packages only). It is WP0 deliverable 7. The old page keeps being built at `/` (it is infrastructure and the link target for the agent demo). |
| `CLAUDE.md` describes the old page as law: page rhythm (light hero, dark AI section, light work...), Selected Work as two stories, "no theme picker", serif for h1/h2, Title Case buttons, DraftMark component, 71 kB main budget, `src/concepts` Tailwind exclusion, agent-demo rules | repo root `CLAUDE.md` | Split into two classes. **Binding (challenge rules, kept):** no Lorem Ipsum, no invented testimonials/stats, placeholders labelled, commit as yourself, `PROMPT_LOG.md` kept as we go, `npm test` + `npm run lint` + `npm run build` before commit, Windows shell gotchas (stale ports, worktree junctions). **Descriptive of the old page (treated as unknown, not applied):** everything about section order, rhythm, case-study format, serif/sans rule, Title Case, light/dark alternation, card patterns, bundle budget of the old page. This concept sets its own rules in this document. WP0 replaces the stale "Concept pages" paragraph in `CLAUDE.md` with a pointer to this file. |
| The v1 concept 01 (X / Command) | other branch `feat/concept-01-command`; commit history `7e7190e`...`6f39b7c`; paragraph in `CLAUDE.md` naming `docs/concepts/01-command-implementation.md`, `tailwind.command.config.js`, `command.css` | None of those files exist on this branch (`src/concepts/`, `docs/concepts/` and root `concepts/` were absent before this file). Nobody checks the branch out, cherry-picks from it, or reads its spec. Commit `4a166db` ("start concept 01 v2 from zero") is the clean base. |
| `vite.config.js` already lists `concepts/command/index.html` as a build input | repo root | That file does not exist, so `npm run build` fails today. This is pure infrastructure; WP1 creates the entry first. Tailwind: the main `tailwind.config.js` excludes `src/concepts/**`; this concept gets its own config (section 11). |
| `docs/idea/` v1 briefs, `XionTechs_Landing_Page_Redesign_Plan_v3.md`, `..._3D_Motion_Automation_Plan.md`, `content/TODO.md` | repo docs | Not read, not cited. The `project-0n-*.md` files are cited because the task names them as the statement of what may be claimed. |
| Section vocabulary leak risk (Hero > Services > About > Process > Why Us > Work > Testimonials > FAQ > Contact) | the brief's own Phase 3 warns of it | The IA in section 4 starts from the narrative "a requirement becomes a system" and has no About, Why Us, Testimonials or FAQ at all. |
| `public/og-image.png`, `public/XionTechs-Logo_s.png`, `public/favicon.svg`, `public/sitemap.xml` | public folder | Treated as brand infrastructure, not design. `og-image.png` is from the old page's identity and must be regenerated from this design at the end (open question 14). |
| `.agents/skills/` (Vercel web-design and writing guidelines) | repo | Allowed as the QA layer the brief names ("implementation/UX QA after the visual language is set"), not as art direction. |
| Auto-memory / `.claude/` | untracked `.claude/` (launch config) | Contains no design decisions that I read. Agents on this concept must not load memory entries about the old page; if one appears, it is overridden by this file. |

### 1.2 Kept from the past (the only things)

Logo (250×46 PNG; reversed copy at `public/concepts/command/logo-reversed.png`), brand colours from the brief, the slogan GET IT DONE, the eight confirmed services, the company facts, the real projects and their sanitized screenshots, the honesty rules. Nothing else.

### 1.3 Zero-State self-test used while designing

For every decision I asked "would a designer who has never seen the old page arrive here from the brief and these facts?" The answer is documented where it is non-obvious: the ±32° hairline hero (section 6.1), the page as one graph of confirmed services (section 6), the evidence glyphs (section 5.5), the brief-to-email conversion path (section 4.9), and the missing sections (section 4.10).

---

## 2. Research summary

Twelve primary references, each with what is borrowed. (Method note from the research: values were read from live pages' computed CSS and DOM; motion curves were inferred from CSS, not watched, so easing numbers below are our own choices informed by them.)

| # | Reference | Borrowed |
|---|---|---|
| 1 | **Linear** (linear.app) | Display type at weight 400-510, line-height 1.0, tracking about -2%; the two-tone statement (white claim, muted tail); 1px hairlines at about 8% white instead of cards; "FIG 0.1" figure captions; one easing curve `cubic-bezier(0.32,0.72,0,1)` for the whole page. |
| 2 | **Axiom** | One signal colour reserved for the primary action and the active value; instruments built from the vendor's own nouns (we use real service and product names); fact-headline + two sentences + one framed panel as the section grammar; 500 ms ease-out reveals; panel cropped by the fold. |
| 3 | **Oxide** | Leader line from a mono tag to the object (label, line, thing) so tags and object are one composition; "FIG. 1" caption under the object; weight-400 headline with negative tracking. |
| 4 | **Vercel** | One brand mark as the one hero object, headline hard left, content at the edges, nothing else competing; very tight tracking only at 56 px and above; mono only for machine truth. |
| 5 | **E2B** | Sticky diagram that re-composes per chapter with mono key:value rows; "yellow means live" single-signal discipline; hard step-end caret; spec rows. |
| 6 | **Inngest** | A run shown as steps with status pills in the gutter and one deliberate failure then retry then pass (shake about 3 px, expanding ring); bars use `transform: scaleX` only; reduced-motion block that shows the final state. We apply the failure beat to THE LINE and label it illustrative. |
| 7 | **Anthropic attribution graphs** (transformer-circuits.pub) | Not a force graph: stratified grid, every edge a ghost at about 5% alpha, one lit path in the signal colour; label halo in the background colour so text survives over edges; pruning ("start from the job", fewer nodes). |
| 8 | **Neo4j** | Hub-and-leaf degree discipline (few hubs, many leaves, ghost edges); a flat SVG that is the source of truth and the fallback; canvas boots after first paint and fades in after its first frame; render-size cap; draw and undraw as a pure function of scroll position. |
| 9 | **Modal** | Progressive enhancement structure: SVG glyph version that already looks finished, a `data-webgl-drawn` flag flips when the canvas has painted and fades the SVG out; `motion-reduce` variants everywhere. |
| 10 | **basement.studio** | A HUMAN | MACHINE switch that turns the same facts into a dot-leader mono spec sheet. Becomes our READ | RAW view and the reduced-motion/no-3D floor. |
| 11 | **Shape of Intelligence** | State on `<html>` as the single source of truth (`data-active-chapter`, header mode); an `aria-pressed` Motion on/off control that also stops smooth scroll; `<noscript>` reveal override; mono "NN / NN" counter; label for invented content ("An imagined installation"). |
| 12 | **Mind Robotics** | The sticky-stage skeleton on native scroll: `section` of `400lvh` containing a `sticky top-0 h-lvh` stage, canvas behind at z-index -1, headings as real DOM; short declarative headlines. |

Minor borrowings, not counted above: Cloudflare Radar (one panel anatomy: title, scope, one-sentence definition, then the visual), NASA mission-elapsed-time and day-of-year clock (the `SYS / DOY` indicator), Warp (figure captions and annotation vocabulary), Darkroom (typed, dated ledger; candid copy), Field/Stripe (write usage rules for the mark: when it leads, supports or disappears), Dash0 (pipeline of six nodes with packets and a static PNG fallback), Vercel Status (status strip, noted and not used).

### Clichés ruled out (and where they would have crept in)

- Glowing AI orb, plexus wallpaper, purple/indigo haze, bloom on every edge. The X is 1 px lines, 4 px nodes, one 6 px yellow point, a 0.15-alpha halo at most.
- Sci-fi HUD: reticles, corner brackets on every box, radar sweeps, matrix rain, CRT filter, neon cyan, chamfers. One corner-tick frame style is allowed on the screenshot viewer only.
- Fake live data: "ONLINE", "98%", "99.8%", "BUILD #4821" from the brief's own example, uptime claims, ticking counters, office clocks for unconfirmed offices.
- KPI wall: big numerals counting our own list (rejected by judges 1 and 3 as hollow). There are no large numerals on this page.
- Logo walls, testimonial carousels, avatars (nothing real exists to show).
- Three-up rounded cards, bento grids, pill buttons, glass panels.
- Scroll-jacking, virtual scroll, custom cursor, preloader gating first paint, canvas-only DOM.
- Serif or italic hero type; gradient-clipped headline text; all-caps everywhere; mono below 12 px.
- Yellow as warning colour or flood; yellow next to a status word.
- Rainbow category palettes in the graph: category is encoded by position, shape and label.

---

## 3. The three directions compared, and the decision

| | **A: T+ / Mission Control** | **B: STANDBY (Minimal Control Room)** | **C: NETWORK CORE** |
|---|---|---|---|
| Hero | Six-panel instrument bay inside a fixed frame (top bar, 200 px rail, bottom dock); X core one panel among several, leader lines into a roll call | One giant sentence cut by two ±32° hairlines that cross at a small X core; one yellow button; docked rail | The X's four wedges hold headline, legend, caption and tags; X spans the top two thirds |
| IA | Frame + 6 stations: Boot, Modules, Execution Line, Deployment Ledger, Self-Test, Final Build + Transmit | Standby, Premise, Four Arms, The Line, On File, Readings, Done | One graph, six stations N-00..N-05 (Core, Arms, Run, Records, Ledger, Converge) |
| Signature | System activation: panels power on; page measures itself | Silence and scale; one instrument per screen; yellow square full stop | One graph model drawn in six layouts; honesty drawn as solid / dashed / hatched nodes |
| Case study | Ledger + downlink viewer with ATC tags, RAW sheet | One record per screen: real screenshot + dot-leader spec, two-way hotspots | Subgraph with panel nodes and leader lines beside the screenshot, light "paper" station |
| CTA | Persistent command with Enter keycap, context-aware label, mailto + copy | One mailto, escalating by size; giant contact row at the end | Visitor's node selections become a drafted email (BRIEF) |
| Risk | Over-scoped; dev-tool density; fixed chrome + pins + scissored canvas | Sparse reads empty if proof is thin; READINGS numerals were hollow; scroll length | Two renderers, DOM buttons over moving nodes, four pins, paper tone flip, spaghetti at about 60 nodes |
| Panel scores (3 judges) | 7 / 4 / 6 | 7 / 8 / 7 | 8 / 5 / 8 |

### 3.1 Decision: STANDBY chassis, NETWORK CORE soul, T+ vocabulary

The panel split: two judges want Network Core as the idea; one (feasibility) wants Standby as the base and warns that Network Core's engineering is the most likely thing to ship half-finished. They are not in conflict once idea and build are separated.

**What the page is (idea):** one X data core made from the confirmed services, which is also the map of what is real. Honesty is drawn into it (solid, dashed, hatched). What the visitor selects accumulates into a brief that ends as an email. This is the only concept that is unmistakably XionTechs and this challenge, and it ties interaction, proof and conversion to one object.

**How it is built (chassis):** Standby's discipline. Native scroll, CSS `position: sticky` tracks, one scroll scalar, one lazy vanilla three.js canvas, a finished static SVG page underneath. Two full-stage pins (THE LINE and DONE; see 5.3).

**Taken from each:**
- From B: the ±32° hairline hero; the yellow square full stop; one live thing per screen; the core stepping aside while the real screenshots carry proof; READ | RAW; giant GET IT DONE; the closing contact row.
- From C: nodes are the confirmed services, each with a source; evidence glyphs; the BRIEF that becomes `mailto:`; panel nodes on the screenshots; build-time content test; `NAME_PRODUCTS` flag; static SVG figure for each layout so the SVG and the WebGL core cannot drift.
- From A: the chip vocabulary (LIVE, MEASURED, SAMPLE, DRAFT, PENDING, ILLUSTRATIVE); the word **OFFERED**; limited and full tags on hover; honest dock readout (render, quality, motion); `data-*` state attributes on `<html>`; three quality levels; a provenance ledger that highlights chips of one type; the contextual CTA; the single labelled failure beat.

**Deliberately not taken:** A's rail, command log drawer, palette, clocks, big heatmap, panel bay. B's READINGS numerals, PREMISE as a long pin, "dust accrual" layouts. C's two renderers, DOM buttons on moving nodes, paper "light" station, four pins, node-selecting inside the 3D, compose panel with free graph state.

**Trade-offs accepted:**
1. The graph is no longer the whole page's navigation (C proposed that). The page keeps a plain three-word nav (Services, Work, Contact) because a buyer must find them in a second. The graph is the hero object, the arm selector and the finale; it is not the menu.
2. Node selection happens in DOM (real checkboxes next to the arm instrument), not by clicking WebGL nodes. Less magic, fully accessible, testable.
3. The animated tier uses one renderer (three.js). The "SVG tier" does not morph; each station shows its own static SVG layout with CSS motion. Less to keep pixel-consistent, still a premium page with WebGL off.
4. No paper band. The product screenshots are dark UI; they sit on `--void` inside a hairline frame and read as real. Removing the tone flip removes the worst contrast bug risk.
5. Fewer bold features than A. The page is quieter than a typical "command center", on purpose: it must read to a non-technical buyer and survive thin evidence.

### 3.2 Judge "must fix" items and where they are answered

| Judge item | Answer |
|---|---|
| Graph must not read as generic AI node cloud; legend in the hero | Hubs, services, leaves have different shapes; labels are real service names; legend visible in the hero (4.2); visible node cap per station (6.1); dashed and hatched nodes present in the first screen (6.1) |
| One hero signature, one page signature; cut the rest | Hero: X data core. Page: **build a brief as you read** (selection, activation in yellow, honesty glyphs). No rail, palette, log, clocks (3.1) |
| Role of paper station | Dropped (3.1.4) |
| Hollow stats; ledger framing | No numerals; ledger is "what on this page is real", ordered REAL first, no bar chart (4.7) |
| SVG renderer and static tier first | Build order in 11.6; WP2 ships static SVG figures before three.js |
| Brief builder honest, low friction | mailto + COPY TEXT; works with no WebGL, no motion, no JS-heavy state (4.9) |
| Open facts | Section 14, and `NAME_PRODUCTS` flag, no purple sign-in image, no offices/legal name (4.6, 9, 12) |
| Hotspot re-measure + tests; SVG logo mark | 8.5 and 6.6 |
| Single-source core position | DOM anchors + ResizeObserver, one place (6.4) |
| Deep links and tall tracks | 10.4 |
| Page length | Target at most 11.5 viewports desktop (5.3) |
| WCAG: unlit text, targets, focus | 5.1 and 10.2 |
| Bundle gates and real device | 13.3 |
| Frame the "mostly PENDING" problem | One pending row per record, not four; ledger leads with confirmed (4.6, 4.7) |
| Plain-language "what is XionTechs" | Section 01 PREMISE carries a plain paragraph and the sourced 25+ years sentence (4.3) |

---

## 4. Fresh information architecture

### 4.1 Model

One narrative: **a requirement enters, becomes a system, is shown working, and is sent back as a request.** Seven stations on native scroll. State lives on `<html>`: `data-station` 0..6, `data-active` section id.

```
00 STANDBY   -> 01 PREMISE -> 02 DEPLOY -> 03 LINE -> 04 ON FILE -> 05 LEDGER -> 06 DONE
 hero          the claim      four arms    six steps   two records    what's real   converge + request
 core @ L0     core dimmed    core @ L1    core @ L2   core absent    (no core)     core @ L3 -> L4
```

Frame (persistent, small): header 64 px (48 on mobile) and docked rail 48 px (56 + safe-area on mobile). No side rail.

### 4.2 Station 00: STANDBY (`#standby`, hero)

- **Purpose:** in three seconds: engineering team, four capability areas, here is how to start. Nothing competes.
- **Visitor understands first:** the sentence; second: the X with four labelled arms; third: one yellow button.
- **Content:** label `00 / STANDBY`. H1 `ENGINEERING THAT GETS IT DONE` with a yellow square as full stop (BRIEF). Supporting copy exactly as the brief (BRIEF). CTAs `START A PROJECT →` (to `#contact`) and `EXPLORE OUR WORK ↓` (to `#work`). X core with four tags: `01 CODE` (NW), `02 AI` (NE), `03 CLOUD` (SE), `04 PRODUCT` (SW), a `FIG 01` caption (`FIG 01 · X CORE · NODES ARE THE SERVICES WE LIST · LAYOUT IS ARTWORK`), and a three-glyph legend (4.1 below). No status panel, no ONLINE lights, no percentages. The brief's SYSTEM STATUS idea survives as the dock readout (real values only).
- **Source:** BRIEF (headline, sub, CTAs), FACT (services as nodes), ILLUSTRATIVE (core layout, artwork).
- **Interaction:** boot once (1.1 s, M01). Cursor yaws the core up to 4° (M03). Hover or focus a tag: its leader line draws in yellow, the full tag opens (`MOD 02 / AI SYSTEMS / OFFERED`, three lines), the matching arm brightens. Click a tag: scroll to `#deploy` with that arm active. Hover or focus the primary CTA: packet speed ×2.5 (M04). The only blinking caret on the page sits on the full stop, here only.
- **Hero legend (always visible, bottom-right above the dock, one line):** `● CONFIRMED   ◌ PENDING   ▨ ILLUSTRATIVE` (solid dot, dashed ring, hatched square; see 5.5).

### 4.3 Station 01: PREMISE (`#premise`)

- **Purpose:** state the core message, answer "what is XionTechs" in plain words, and give the one sourced company claim in the right place.
- **Visitor understands:** this is an engineering and AI team; here is what it does in one plain paragraph; the leadership has depth.
- **Content:** label `01 / PREMISE`. Statement (BRIEF §1): **We turn requirements into production systems.** Plain paragraph (DRAFT, built only from the eight confirmed services): *XionTechs is an engineering and AI team. We build custom software, intelligent systems and cloud platforms, co-create products with our clients, and provide staffing services.* Sourced sentence (FACT): *25+ years of leadership experience across our leadership team.* with chip `LIVE · xiontechs.com · captured 2026-09-22`. The chip text must keep "leadership team" so the claim is not read as company age.
- **Layout:** not pinned. Section height about 110 svh, statement left (clamp 28 px to 88 px, sentence case), core parked at the right third, dimmed to 35% (anchor `premise`).
- **Interaction:** each word lights from `--ink-dim` to white by scroll (M06); yellow square full stop appears when the last word is lit. Under reduced motion or RAW all words are lit.

### 4.4 Station 02: DEPLOY, "WHAT WE CAN DEPLOY" (`#deploy`)

- **Purpose:** capability as four modules, the confirmed services only; first low-commitment step toward the CTA.
- **Visitor understands:** the breadth, which named platforms are covered, and that they can pick what they need.
- **Content:** label `02 / WHAT WE CAN DEPLOY`. H2 (DRAFT): **Pick what you need.** muted continuation **We wire the rest.** Four rows, one per module, each a single line of large type with an index (`01`..`04`) and a state word `OFFERED` (BRIEF's "AVAILABLE" is replaced, 5.6). Beside them a sticky instrument (anchor `deploy`, 300 px) with the X in four separated arms; the active arm and hub light yellow. Under the instrument, the active module's services as real checkboxes (`ADD TO BRIEF`), exactly the confirmed names:
  - `01 SOFTWARE ENGINEERING` : Custom App Development; Low-code Solutions (Power Platform, Make, n8n, Retool, Bubble)
  - `02 AI SYSTEMS` : AI-Powered Solutions (intelligent automation, predictive analytics, conversational interfaces, process automation); AI-Driven Analytics
  - `03 CLOUD & PLATFORM` : Cloud Computing (Azure, AWS, GCP: migration, optimisation, integration)
  - `04 PRODUCT DEVELOPMENT` : Product Engineering; Product Co-Creation; Staffing Services
  
  Each module has a one-line DRAFT definition. The grouping of services into modules is DRAFT and flagged in the content module (open question 4). All eight live-site services appear exactly once, each with a `LIVE` source chip in the full tag.
- **Layout:** left rows scroll normally, each about 38 svh apart; the instrument is `position: sticky` (not a full pin). Mobile: instrument 160 px sticky under the header; rows stack.
- **Interaction:** active row = nearest the viewport middle (IntersectionObserver, `rootMargin: -45% 0px -45% 0px`), or the focused or clicked row (rows are `<button aria-current>`). Switching: 160 ms, nothing else moves (M07). Checking a service adds it to the BRIEF store; the header CTA reads `START A PROJECT ( n )`, the dock shows `BRIEF ( n )` (M16). Scroll progress through the first third of the track morphs the core from L0 to L1 (6.2).

### 4.5 Station 03: THE LINE, "FROM REQUEST TO PRODUCTION" (`#line`)

- **Purpose:** show how work moves, as an operational sequence with one gate per step.
- **Visitor understands:** there is a clear sequence from their request to running software, and their own request is the first node.
- **Content:** label `03 / FROM REQUEST TO PRODUCTION`. Six steps, each one word at large size plus one sentence (DRAFT, no digits, no durations, no outcomes):
  1. **REQUEST** A requirement arrives as a sentence, a document or a screen.
  2. **DISCOVERY** We ask until the problem and the constraints are both clear.
  3. **ARCHITECTURE** Services, data and integrations are drawn before anything is built.
  4. **BUILD** Software is built and tested in small, shippable steps.
  5. **DEPLOY** It goes to the cloud it will actually run on.
  6. **SCALE** It keeps running, and it keeps changing with the business.
  
  At step 1 a mono line shows `YOUR BRIEF ( n )` and lists the selected services (empty state: `( nothing selected yet )`). At step 4 the illustrative failure beat runs once (M09): a check outline turns dashed, shakes 3 px, a ring expands, it passes; chip `ILLUSTRATIVE · NOT A CLIENT RUN`. Legend line under the stage: `STEPS: DRAFT · FAILURE BEAT: ILLUSTRATIVE`. The REQUEST/BUILD/TEST/DEPLOY shorthand in the brief is covered: TEST is said inside BUILD.
- **Layout:** pinned stage, track 220 svh (mobile 200 svh): a full-width 1 px line with six stops at the bottom, one giant word above, one sentence. Anchor `line` is a strip above the stops where the four arms collapse into the line.
- **Interaction:** scroll advances the step (dwell plateau per step); a yellow packet moves linearly along the line (the only linear motion on the page). Stops are real `<button aria-current="step">`; activating one scrolls the document to that step's progress, so scroll and focus never disagree. `PAUSE | REPLAY` control sits in the section header and governs the failure beat. Word change is a vertical clip roll (M08). The yellow signal line crosses the top once when the section is first entered (M05).
- **Fallback (reduced motion, RAW, no JS, tier-independent):** no pin; six rows as a plain ordered list; the failure beat is one sentence.

### 4.6 Station 04: ON FILE, "SELECTED DEPLOYMENTS" (`#work`)

- **Purpose:** the main proof. Two real products, shown by their real sanitized screens, plus one clearly labelled illustrative record. No grid, no carousel, no logos.
- **Visitor understands:** these are real interfaces; here is exactly what each screen shows; what the team has not confirmed yet is marked pending, not hidden.
- **Content:** label `04 / SELECTED DEPLOYMENTS`. Opening line (DRAFT): **Two products on file.** muted **Anything not confirmed is marked pending.** Records `DEP-001 STAFFXP`, `DEP-002 ESS`, `DEP-003 AGENT WORKFLOW DEMO`. Full treatment in section 8. End of section: one inline line `Have a system to build? START A PROJECT →`.
- **Layout:** plates in normal flow, about 95 svh each, one live thing each. The core is absent here (DISAPPEAR rule). The ±32° hairlines remain at 8% as the page's constant.
- **Interaction:** on entering a plate, one yellow scan line crosses the screenshot (M10). Spec rows and screenshot regions are linked both ways (M11). Each record has `ADD TO BRIEF` (checkbox, adds "I looked at: StaffXP").

### 4.7 Station 05: LEDGER, "WHAT ON THIS PAGE IS REAL" (`#ledger`)

- **Purpose:** proof without claims. It tells the visitor what to trust, why the glyphs mean something, and what is still open. It replaces testimonials and counters.
- **Visitor understands:** this company shows its evidence status openly.
- **Content:** label `05 / LEDGER`. H2 (DRAFT): **What on this page is real.** A six-row table in the standard panel anatomy, **ordered REAL first**, each row a legend chip + plain sentence + where it appears:
  1. `LIVE` The eight services, the contact details and the 25+ years sentence come from xiontechs.com, captured 2026-09-22.
  2. `REAL` The StaffXP and ESS screens are the team's own, sanitized before publication.
  3. `SAMPLE` Names, staff IDs and numbers inside those screens are sample values.
  4. `ILLUSTRATIVE` The agent workflow demo, the failure beat in THE LINE and the layout of the X are artwork, not client work.
  5. `DRAFT` Module and process wording is written for this page and awaits sign-off (this row is shown only in dev or with `?review`).
  6. `PENDING` Stack, status, client and results for each product; offices; legal name. Not published until the team confirms them.
  
  Plus two sourced lines: `BUILD ( commit short SHA · build date )` (build-injected, real) and the BUILD counter note: *BUILD 00n is which section you are in. It is a UI state, not a claim.* Optional stretch (P2, drop if data missing): `THIS SITE'S REPOSITORY`, a single-row weekly commit strip baked from `git log` at build with the caption "this page, built with AI assistance, real git history"; it never claims to be company delivery history.
- **Interaction:** click a row: every chip of that type on the page gets a 2 px yellow outline for 3 s (M18) and the page scrolls to the first one only if it is off screen (no jump if visible). Values unavailable at build show `N/A`.
- **No CTA in this station** (proof is not interrupted by a sell). No numerals above body size.

### 4.8 Station 06: DONE (`#done` finale, `#contact` composer and footer)

- **Purpose:** the signature ending and the conversion.
- **Content:** pinned finale, track 160 svh. The accumulated network (the same points) scatters across the stage, then converges into the X mark (6.6) while `GET / IT / DONE.` sets in three stair-stepped lines (indent 0, 0.6em, 1.2em; yellow square full stop); label `HAVE A SYSTEM TO BUILD?`, line `LET'S GET IT DONE.` (BRIEF). Below the pin, normal flow, `#contact`:
  - **Composer** (hairline frame): read-only `YOUR BRIEF` preview (selected services and records, or `( nothing selected yet )`), one optional textarea `TELL US ABOUT THE SYSTEM`, buttons `SEND EMAIL →` (a plain `<a href="mailto:contact@xiontechs.com?subject=...&body=...">` rebuilt as the visitor selects) and `COPY TEXT`. Microcopy: *Opens your mail app. Nothing is stored.* and *Mail app did not open? Copy the text instead.*
  - **Endpoints** as spec rows: `EMAIL contact@xiontechs.com`, `PHONE US +1 469 322 9899`, `PHONE VN +84 908 107 552`, `LINKEDIN` and `FACEBOOK` (rows render only when the URL is supplied; they are not invented; open question 13).
  - **Footer:** reversed logo at native 250×46, one line of description, the `BUILD ( sha · date )` stamp, `READ | RAW` toggle. Office cities, street addresses and the legal name are omitted until confirmed (shown only under `?review`).
- **Interaction:** convergence is a pure function of scroll (reversible). When progress passes 0.9 a yellow line sweeps under DONE once (M14). `Enter` in the textarea inserts a newline; the form never posts.
- **Fallback:** static final frame: X mark as SVG, the headline, the composer.

### 4.9 Navigation model and CTA behaviour

**Navigation (header, 64 px, hairline underline, constant height):** logo (reversed PNG, 125 px wide, which is exactly half native so it is crisp at 2x); three words **SERVICES** (`#deploy`), **WORK** (`#work`), **CONTACT** (`#contact`); `SYS / 2026 · DOY nnn` (day-of-year from the visitor's clock, real); `READ | RAW` segmented toggle; `MOTION: ON | OFF` toggle (`aria-pressed`); CTA. The active word gets a 1 px yellow underline from `data-active`. LAB and ABOUT from the brief are dropped (no verified content). No dropdowns. Mobile: logo, `READ | RAW`, a `≡` button opening a full-screen list of the three words at large size and the CTA; Esc closes, focus is trapped while open.

**CTA ladder (one label, one action, escalating by size, never by repetition):**
1. Hero: filled yellow `START A PROJECT →` (48 px high, 0 radius, navy text) and a text link `EXPLORE OUR WORK ↓` that preloads the screenshots on hover. Both are plain anchors (`#contact`, `#work`), working without JS.
2. Header CTA: outlined (1 px yellow, white text) until station 04, then filled yellow; label becomes `START A PROJECT ( n )` when the brief has items. Mobile: a fixed bottom bar (56 px + safe-area) with the same CTA, hidden while the composer is in view.
3. Deploy and On File: `ADD TO BRIEF` checkboxes (soft yes, no form). End of On File: one inline `START A PROJECT →` line.
4. Done: the composer's `SEND EMAIL →` and a hit target-wide contact row, the largest tap target on the page.
- Hover or focus any CTA raises the core's flow uniform ×2.5 (brief: hover CTA, data flow accelerates). Activation of `SEND EMAIL` appends nothing anywhere: no tracking, no cookies, no backend, no consent banner.

### 4.10 Deliberately left out

About, Why Us, Team grid, Testimonials, FAQ, Pricing, Blog/Lab, Contact form with backend, newsletter, logo wall, KPI/stat counters, status panel with ONLINE lights, office clocks and addresses, a DATA arm (the only confirmed data service is AI-Driven Analytics and it sits under AI), a third case study (only two real products exist), command palette, side rail, log drawer, paper/light station, cookie banner (no cookies, no analytics), language switch, search.

---

## 5. Visual system

### 5.1 Tokens

All colours are CSS variables on `:root` as space-separated RGB channels (Tailwind `rgb(var(--x) / <alpha-value>)`), so opacity steps are free and **no hex appears in a component**. three.js reads the same tokens through `getComputedStyle` at init.

| Semantic name | Tailwind key | Hex | Use | Contrast on `--ground` |
|---|---|---|---|---|
| `--void` | `void` | `#050F1F` | Silence bands, screenshot backing, dock | n/a |
| `--ground` | `ground` | `#071B34` | Page | n/a |
| `--panel` | `panel` | `#0B2342` | Active/hover/selected panel only; instrument frame fill | n/a |
| `--panel-hi` | `panelHi` | `#10304F` | Hover fill (use `ink2` text on it, not `ink3`) | n/a |
| `--ink` | `ink` | `#FFFFFF` | Display, active words | 17:1 |
| `--ink-2` | `ink2` | `#B8C4D4` | Body | 9.8:1 |
| `--ink-3` | `ink3` | `#8497B0` | Mono labels, captions, inactive rows | 5.8:1 |
| `--ink-dim` | `inkDim` | `#5A6F8E` | **Unlit large words only** (24 px and up), never small text | 3.4:1 (large-text AA) |
| `--hair` | `hair` | `ink2` at 14% | 1 px structure | n/a |
| `--hair-strong` | `hairStrong` | `ink2` at 30% | Dashed pending outlines, frames | n/a |
| `--ghost` | `ghost` | `ink2` at 10% | Unlit graph edges | n/a |
| `--grid` | `grid` | `ink2` at 6% | Background dot grid | n/a |
| `--signal` | `signal` | `#F5C400` | The only hue | 10.5:1 |
| `--signal-wash` | `signalWash` | `signal` at 10% | Active row band | n/a |
| `--on-signal` | `onSignal` | `#071B34` | Text on yellow fill | 10.5:1 |

Palette tweak inside the brief's family: one added shade, `--void`, so the silence bands have depth. No light/paper band. If review shows `#F5C400` reads orange on navy, the allowed nudge is `#F6CA17`; contrast must stay above 10:1.

**Yellow allow-list (under 3% of any frame):** the full-stop square; the core point and active packets; the active arm and hub; the primary CTA fill (one per viewport); the active nav underline; the signal line (M05) and plate scan (M10); the hotspot box and leader; the dock scrubber marker; focus rings (2 px, offset 3 px; on yellow fills the ring is white); selected-checkbox tick and `ADD TO BRIEF` ring; the final mark point and DONE stop. Never: body text, a status word, a background section, a gradient. Yellow means active, selected or in progress. There is no red or green anywhere; the only second state cue is dashed vs hatched plus a word.

**Easing and duration tokens:** `--ease-brand: cubic-bezier(0.32, 0.72, 0, 1)` (transforms, morphs); `--ease-ui: cubic-bezier(0.2, 0, 0, 1)` (hover, state); `--ease-out: cubic-bezier(0, 0, 0.2, 1)` (opacity reveals); linear (packets, scan); `steps(6)` (counters). `--dur-ui: 160ms`, `--dur-reveal: 500ms`, `--dur-signal: 700ms`, `--dur-scan: 600ms`.

### 5.2 Typography

Three voices with fixed jobs, all Google Fonts that exist, **self-hosted** as variable `woff2` via `@fontsource-variable/geist` and `@fontsource-variable/geist-mono` (OFL; no request to Google, no consent banner needed). Latin subset; `font-display: swap` with a metric-matched fallback (`size-adjust`, `ascent-override`) so the headline does not shift. If either family fails review, the substitutes are **Inter Tight** (display and body) and **JetBrains Mono** (mono).

1. **Geist** (variable 100-900): display, statements, body.
2. **Geist Mono** (variable 100-900): every system label, id, status, stack name, counter, keycap, spec row. Always `font-variant-numeric: tabular-nums`.
3. No third face. The graph, the type scale and the yellow full stop are the display moments.

| Role | Face / weight | Size (fluid) | Line height | Tracking | Case |
|---|---|---|---|---|---|
| Display XL (hero H1) | Geist 500 | `clamp(2.6rem, 13.4vw, 5rem)` below 640 px; `clamp(4.5rem, 10vw, 10.5rem)` from 640 px (144 px at 1440) | 0.90 | -0.055em | UPPERCASE |
| Finale (GET IT DONE.) | Geist 500 | `clamp(3rem, 14vw, 14rem)` | 0.88 | -0.06em | UPPERCASE |
| Statement (PREMISE, section leads) | Geist 450 | `clamp(1.75rem, 6vw, 5.5rem)` | 0.98 | -0.045em | Sentence |
| Heading H2 | Geist 500, white lead + `ink2` continuation | `clamp(2rem, 4.4vw, 4rem)` | 1.0 | -0.04em | Sentence |
| Row words (DEPLOY) | Geist 500 | `clamp(2rem, 6vw, 5.75rem)` | 1.0 | -0.04em | Sentence |
| Step words (LINE) | Geist 500 | `clamp(2.25rem, 11vw, 11rem)` | 0.95 | -0.05em | UPPERCASE |
| Body | Geist 400, `ink2` | 18/27 px (≥1024), 16/24 px below | 1.5 | 0 | Sentence, 44ch max |
| Label | Geist Mono 400, `ink3` | **12 px floor, nothing smaller anywhere** | 1.4 | +0.06em | UPPERCASE, one label per block |
| Status / chip text | Geist Mono 500 | 12 px | 1.4 | +0.06em | UPPERCASE |
| Data / spec value | Geist Mono 400, `ink` | 13 px | 1.5 | 0 | as typed |
| Counter (BUILD, BRIEF) | Geist Mono 500 | 14 px | 1 | +0.04em | UPPERCASE, `steps(6)` flip |

Rules: uppercase appears only in the hero H1, the finale, the six step words and 12 px mono labels; everything a visitor reads in sentences is sentence case. Buttons are mono caps because they are system commands (`START A PROJECT →`). No serif, no italics, no gradient text. Curly quotes and a real ellipsis. No em dashes in new body copy (the brief's own hero sentence is quoted verbatim). **Fit risk:** 11-letter `ENGINEERING` at about 0.6em per glyph needs about 6.6em; at 320 px wide the size is 43 px (13.4vw) so it measures about 283 px against 288 px available. This estimate must be confirmed by the screenshot gate (13.3).

### 5.3 Spacing and grid

- 8 px base. Scale: 4, 8, 12, 16, 24, 32, 48, 64, 96, 160.
- 12-column grid. Margins 40 px (≥1280), 24 px (768 to 1279), 16 px (<768). Gutter 24 px (≥1024), 16 px below. Content max-width 1600 px centred from 1680 px; hairlines and the dot grid stay full-bleed.
- Vertical rhythm between stations: 160 px desktop, 96 px mobile; `--void` bands carry the silence.
- Header 64 px (48 mobile); dock 48 px (56 + safe-area inset mobile). `scroll-margin-top` on every section id equals header height.
- Page length target: at most 11.5 viewports at 1440×900 (about 10,350 px). Tracks: STANDBY 100 svh, PREMISE 110, DEPLOY 150, LINE 220, ON FILE 2 × 95 plus 30, LEDGER 90, DONE 160 plus composer and footer about 100. Phone tracks are about 15% shorter; no pin on landscape phones under 500 px height.

### 5.4 Shape language

- 0 px radius on everything; 2 px on chips and keycaps only. 1 px hairlines instead of cards. No shadows, no blur, no glass, no gradients (the only gradient is a 120 px `--ground` to transparent scrim at the bottom of the dock and behind labels over dense graph areas).
- **One angle:** ±32° (`atan 0.625`, a near-diagonal of the viewport). Used for the hero hairlines, the X arms, leader lines and the plate scan. Nothing else tilts.
- Node shapes: hub = 10 px outlined square; service = 6 px circle; leaf = 3 px dot or 6 px tick; core = 8 px yellow square (diamond in SVG at 45°, same size); record node = 8 px square with a cross tick; packet = 8×2 px dash; orbiter = 2 px dot.
- Instruments (at most one per viewport) get a 1 px frame with four 6 px corner ticks. Nothing else gets corner ticks.
- Background: static 48 px dot grid at 6% with a `+` every fourth cell. Coordinate labels exist only where true: the `A–H × 1–5` sector grid on the screenshot viewer and the three-line hero tags.

### 5.5 Evidence glyphs (the honesty system, drawn consistently)

One definition used by SVG, three.js, chips and the legend:

| State | Glyph | Meaning | Where it appears |
|---|---|---|---|
| **Confirmed** | solid fill, 1 px outline | from the live site, the brief, or visible in a real screenshot | all service, leaf and record nodes; all LIVE chips |
| **Pending** | dashed 1 px outline, hollow, `ink3` text, word `PENDING` | exists but not yet confirmed by the team | status satellites on StaffXP and ESS in the hero core; the single details row in each record |
| **Illustrative** | 45° hatched fill (`1px` lines at 22% alpha every 5 px), word `ILLUSTRATIVE` | not real; artwork or demo | DEP-003 node on the AI arm; the failure beat; FIG captions |
| Method | solid, no source claim | the six process steps (they claim nothing) | LINE stops |

Chips (`<Chip kind=…>`): `LIVE` (solid outline), `REAL`, `SAMPLE` (dashed), `MEASURED`, `BUILD`, `PENDING` (dashed), `ILLUSTRATIVE` (hatched), `DRAFT` (shown only in dev or with `?review`, per the project's draft-marking rule). A chip is always a word, never colour alone.

### 5.6 Status vocabulary

Three words only, in fixed order: **OFFERED**, **ACTIVE**, **PENDING**. `OFFERED` is a statement of what the company offers per its live site, never capacity. The strings `ONLINE`, `AVAILABLE`, `PRODUCTION`, `SUCCESS`, `UPTIME` are forbidden as status values by the content test (12.4).

### 5.7 Iconography

None from an icon library (no `lucide-react` in this page). The visual language is the node set above, arrows drawn as mono `→ ↓` plus a 1 px SVG stem that extends on hover (24 px to 56 px, 160 ms), keycap chips `↵`, and the X mark. The XionTechs X mark is an inline SVG traced from the logo (6.6) and used as favicon and section marker only at small size.

### 5.8 Imagery treatment (real screenshots)

`public/work/staffxp-dashboard.webp` (1869×958) and `public/work/ess-portal.webp` (1867×956), shown **unaltered**: no recolour, no tilt, no mock browser chrome, no shadow, no overlay of fake UI. Frame: 1 px `--hair-strong` on a `--void` backing; explicit `width` and `height`; `loading="lazy"` plus a preload on `EXPLORE OUR WORK` hover; `fetchpriority="low"`; `sizes` equal to the frame width. Both captures are dark UI and sit naturally on navy. Caption in mono: `SANITIZED CAPTURE ( SAMPLE VALUES )`. `public/work/staffxp-sign-in.webp` is **not used**: its right half is purple bokeh and its left half carries a purple gradient headline and a different X mark, which breaks the no-purple rule and risks being mistaken for XionTechs branding. The fact "Sign in with Microsoft" appears as a text row only (with the source `sign-in capture`).

### 5.9 Copy voice

Dry, literal, operational. Verbs over adjectives; nouns are real (service names, product names). Short sentences. No hype words (cutting-edge, seamless, leverage, unlock, revolutionary, world-class, next-gen). No exclamation marks. Label grammar: `ID / NAME ( STATE )`: `MOD 02 / AI SYSTEMS ( OFFERED )`, `DEP-001 / STAFFXP`, `STATUS ( PENDING )`, `BUILD 004`. Spec rows use dot leaders: `STACK ........ PENDING`.

Example microcopy: *Pick what you need. We wire the rest.* · *Anything not confirmed is marked pending.* · *Layout is artwork. Nodes are the services we list.* · *Illustrative run. Not a client project.* · *Sanitized capture. Sample values.* · *Opens your mail app. Nothing is stored.* · *Same page, no 3D.* (RAW toggle title) · *Nothing selected yet.* · *Copied.* · *This is a demo, not delivered work.* Keep `GET IT DONE` as the slogan, always uppercase in display use.

---

## 6. Signature visual: the X data core

### 6.1 The object

One data model, five layouts, one canvas. About **45 semantic nodes** (each backed by a content record with an `evidence` field and a `src` tag) plus **1,200 structural points** (500 on low) that make the arms read as braided strands. Semantic nodes (all derived from the content module, never typed twice):

- 1 core (yellow, 8 px)
- 4 hubs: `CODE`, `AI`, `CLOUD`, `PRODUCT` (the four modules)
- 8 services: Custom App Development, Low-code Solutions, AI-Powered Solutions, AI-Driven Analytics, Cloud Computing, Product Engineering, Product Co-Creation, Staffing Services
- 15 leaves: Power Platform, Make, n8n, Retool, Bubble; intelligent automation, predictive analytics, conversational interfaces, process automation; Azure, AWS, GCP; migration, optimisation, integration
- 3 record nodes: STAFFXP, ESS (confirmed) and AGENT DEMO (hatched, illustrative)
- 2 pending satellites: one status node per real product
- 6 method nodes, present only in the LINE layout: REQUEST, DISCOVERY, ARCHITECTURE, BUILD, DEPLOY, SCALE

Visible-node cap per station (anti-hairball, anti-snowstorm, anti-starburst): hero shows hubs, services and the three record nodes with their satellites (labels on hover or focus only); leaves are 3 px dots; edges are ghosts at 10%; only the active arm's edges are yellow. At most 24 semantic labels are ever visible at once.

Edges: bowed hairline strands (two per arm), member edges hub to service to leaf, record edges to PRODUCT/AI hubs, pending edges dashed. Ghost edges are 10% `ink2`; the lit path is 1 px `signal`. Packets: up to 24 instanced dashes travelling along edges linearly (2.4 s per edge idle). Orbiters: 16 tiny dots on two thin implied ellipses (not drawn) around the core, high tier only. The core carries no bloom: one 6 to 8 px yellow square and a halo sprite at 0.15 alpha maximum.

Hero geometry (1440×900): two hairlines at ±32° through `P = (72vw, 30vh) = (1037, 270)`, edge to edge at 1 px `ghost`; the core is drawn around P at 280 px (arm length R = 140 px; arm tips at `P ± (119, 74)`). Four tags sit at the arm tips: `01 CODE` NW, `02 AI` NE, `03 CLOUD` SE, `04 PRODUCT` SW. Mobile (390×844): `P = (72vw, 22vh) = (281, 186)`, core 160 px, tags inside the SVG.

### 6.2 State machine across the page

`k` is one scalar (0..4) selecting the layout pair; `alpha` fades the whole object. Stations write `--p` (their progress 0..1) and the controller derives `k` and `alpha`. Layout indices: **L0 X**, **L1 ARMS**, **L2 LINE**, **L3 FIELD**, **L4 MARK**.

| Stage | Looks like | Built how | Driven by | DOM targets | Static fallback |
|---|---|---|---|---|---|
| **S0 STANDBY** (L0, alpha 1) | X braid at P: four hubs (square), services (circles), leaves (dots), yellow core, 3 packets, hairlines cross at the core | Hairlines: SVG `<line>` always present. Core: three.js `Points` + `LineSegments` + packet `Points`, all motion in shaders; yaw ±5°, breathing ±1.5% over 8 s | Time (boot, idle), pointer (yaw ≤ 4°, damped), hover CTA (`uFlow` ×2.5), hover/focus tag (arm brightening) | `[data-core-anchor="hero"]`, `.hero-tag[data-module]`, `.cta[data-flow]` | `<CoreFigure layout="x">` inline SVG: strokes, nodes, yellow core, labelled tags; a finished composition |
| **S1 PREMISE** (L0, alpha 0.35) | Same X, parked right third, dim, nearly still | Same canvas; anchor lerp; idle only | Scroll (station) | `[data-core-anchor="premise"]` | Same SVG at 35% opacity |
| **S2 DEPLOY** (L0 to L1, alpha 1) | Four arms separate outward (0.3 R) into four clusters; the active arm and hub turn yellow; its services light | Shader morph `uMix` between `aFrom` and `aTo`; per-point `aDelay` (distance from core) so it ripples outward; uniform `uActive` (0..3) | Scroll first third of the track (k 0 to 1, then plateau); active row/arm from IntersectionObserver or click | `[data-core-anchor="deploy"]` (sticky instrument), `.module-row[data-module]` | `<CoreFigure layout="arms" active="n">` SVG; arm change = 160 ms stroke colour transition |
| **S3 LINE** (L1 to L2) | The four clusters slide into a horizontal line and become the REQUEST stop; six method stops appear; packets run REQUEST to SCALE | Shader morph to L2. **The six stops, line and packet are always DOM/SVG** (that is the information); WebGL only animates the collapse and trace dust along the line | Scroll: k 1 to 2 over first 15% of the track; step `i = floor((p - 0.15) / 0.1333)`, packet linear | `[data-core-anchor="line"]`, `.line-stop[data-step]` | The SVG line with six labelled stops; list on reduced motion |
| **S4 ON FILE** (L2, alpha to 0) | The core fades out. Only the ±32° hairlines at 8% remain. The page's silence | `alpha` scrubbed 1 to 0 over the first 15% of plate 1; k advances invisibly 2 to 3 | Scroll | none | Nothing to show (static page has no core here) |
| **S5 LEDGER** | No 3D | alpha 0, loop stopped | n/a | n/a | n/a |
| **S6 DONE** (L3 to L4, alpha 0 to 1) | The accumulated points reappear spread across the stage along the hairlines (L3 FIELD), hold, then converge into the XionTechs X mark in yellow; `GET / IT / DONE.` sets; the real logo PNG fades in under the mark | Shader morph L3 to L4; target points sampled from `mark.js` polylines (6.6) | Scroll (track 160 svh): alpha 0 to 1 over 0..0.2; hold 0.2..0.4; converge 0.4..0.8; hold 0.8..1. Reversible | `[data-core-anchor="done"]`, `.finale-line`, `.logo-lockup` | `<CoreFigure layout="mark">` final SVG (mark + logo image), headline set statically |

Quality tiers (`<html data-tier>`), selected once and re-evaluated by measured FPS:

| Tier | When | Rendering |
|---|---|---|
| **off** | no WebGL2; software rasteriser (`WEBGL_debug_renderer_info` matches swiftshader/llvmpipe); context lost and not restored; `data-motion=off`; `prefers-reduced-motion`; `saveData`; JS chunk failed; RAW view | No canvas. Every anchor shows its `CoreFigure` SVG. With motion on this is **Level 2**: CSS/SVG motion only (hairline draw, tag and arm transitions, packets via CSS `offset-path`, step rolls). With motion off this is **Level 1**: all final states, no movement. Both are designed, premium and complete. |
| **low** | WebGL2 present and any of: `deviceMemory ≤ 4`, `hardwareConcurrency ≤ 4`, coarse pointer with width < 768, or median frame time over 90 frames above 25 ms | DPR 1, 500 points, 8 packets, no orbiters, no pointer follow, no halo sprite, render pixels capped at 1.5 MP |
| **high** | otherwise | DPR ≤ 1.5, 1,200 points, 24 packets, 16 orbiters, pointer yaw, halo sprite, render pixels capped at 2.4 MP |

FPS governor: one-way in a session with hysteresis. `high` to `low` when median frame time over 90 frames exceeds 25 ms twice in a row; `low` to `off` when it exceeds 30 ms twice; never upgrade; each downgrade writes `data-tier` and updates the dock readout. `webglcontextlost` swaps to `off` immediately; `webglcontextrestored` does not re-enable. Loop pauses on `visibilitychange` and when the canvas anchor is more than one viewport off screen (IntersectionObserver).

### 6.3 How it is built (three.js)

- **One** fixed full-viewport `<canvas aria-hidden="true">`, `pointer-events: none`, `z-index: 0` behind the DOM. Vanilla three.js with deep imports only (`WebGLRenderer`, `Scene`, `PerspectiveCamera`, `BufferGeometry`, `BufferAttribute`, `Points`, `LineSegments`, `ShaderMaterial`, `Color`, `Group`). No R3F (one object does not justify it), no post-processing, no Draco, KTX2, HDRI or textures. three 0.186 is WebGL2-only, which matches the tier rule.
- **Camera trick for 1:1 DOM alignment:** perspective camera with `fov = 20°`, placed at `d = (H / 2) / tan(fov / 2)` so the z=0 plane maps to CSS pixels. The core group's position and scale come from the current anchor rect (6.4). Small z offsets (±0.08 R) on the two diagonals make yaw read as two crossing sheets.
- **Morph in the vertex shader:** `aFrom`, `aTo` (vec3), `aDelay` (float), `aKind`, `aEvidence`; `uMix = ease(frac(k))`. Attribute buffers are swapped only when `floor(k)` changes (typed-array `set`, `needsUpdate = true`); not per frame. Draw calls: **at most 5** (points, lines, packets, orbiters, halo).
- **Packets and orbiters** run entirely in shaders from `uTime` and per-instance `aPhase`, `aEdgeA`, `aEdgeB`. CPU per frame: update about 12 uniforms.
- **Layouts are pure functions, not baked JSON and not force-simulated**: `layoutX`, `layoutArms`, `layoutLine`, `layoutField`, `layoutMark` take the graph and a seeded RNG (`mulberry32`) and return positions. They are deterministic, cheap (a few ms for 1,200 points), and unit-tested (same node ids across layouts, no NaN, bounding box inside the unit box, mark sample count). No `d3-force` dependency.
- **Lazy loading:** first paint = React renders the SVG hero. After first paint and `requestIdleCallback`, `import('./three/createCore')`. When the first WebGL frame is drawn: `<html data-webgl="drawn">`, SVG anchors fade out over 300 ms (`motion-reduce: none`); on context loss the SVG fades back in.
- **Bundle:** WebGL chunk at most 180 kB gzip including the used three.js classes, own code at most 20 kB `[verify with the bundle report; fallback if exceeded: a hand-written WebGL2 renderer of about 8 kB, same shader]`.
- **Pointer and scroll never touch React state per frame.** The scroll controller writes CSS variables and a plain object; the render loop reads it.

### 6.4 Single-sourced core placement

The core's screen position and size come from DOM anchors only: `<CoreAnchor name="hero|premise|deploy|line|done" />` renders `<div data-core-anchor="name">`. A `ResizeObserver` plus `document.fonts.ready` and orientation/`visualViewport` events cache document-relative rects; per frame the controller computes viewport rects by subtracting `scrollY` (no layout reads in the scroll handler). The core's rect is `lerp(anchors[floor k], anchors[ceil k], ease(frac k))`, which makes it travel with the reader between stations and dock onto each anchor. The SVG fallback renders inside the same anchor, so the SVG and WebGL versions can never disagree on position.

### 6.5 Interaction detail

- Hover/focus a hero tag: yellow 1 px leader draws from tag to the arm hub (SVG, 200 ms); limited tag (`02 AI`) expands to full (`MOD 02 / AI SYSTEMS / OFFERED`).
- Idle rotation under 1°/s (±5° over 40 s gives 0.79°/s peak); yaw and breathing stop off screen.
- Hover the primary CTA: `uFlow` 1 to 2.5 over 160 ms; in the SVG tier the packet `animation-duration` halves.
- Selecting a service does not move 3D nodes; it lights its leaf in the arm instrument and adds to the brief (the 3D reflects, the DOM acts).

### 6.6 The converge-into-the-logo ending, with only a 250×46 PNG

The logo exists only as a 250×46 PNG, which cannot be sampled or enlarged without turning soft. Therefore:

1. **The convergence target is the X mark alone**, defined as vector polylines in `core/mark.js` (a few strokes in a 100×100 box, centre-line plus thickness) traced by hand from the logo's yellow swoosh at high zoom. The points sample along these strokes, so the mark is crisp at any size. An interim mark is acceptable until a vector exists, and the traced version must be reviewed against the logo by a human before launch.
2. The wordmark is **not** built from points. The real `logo-reversed.png` fades in beneath the mark at its **native 250×46 size** (`width=250 height=46`, never upscaled), forming the lockup `[X mark] [logo]`. At 70% convergence progress the logo opacity goes 0 to 1 over 300 ms.
3. The yellow points end as the yellow of the mark, then the 8 px core square becomes the full stop of `DONE.` (the page's yellow signal is one object from the first screen to the last).
4. When the larger logo or SVG arrives: replace `mark.js` strokes by tracing the new file, swap the PNG, nothing else changes (open question 1).
5. Static fallback: the same mark as inline SVG with the PNG beneath.

---

## 7. Motion system

### 7.1 Principles

One interaction signature for the page: **activation**. Things are dim and pending until the reader reaches or selects them; yellow marks what is active. Everything animates `transform` and `opacity` only (bars use `scaleX`). Trigger once unless deliberately scroll-linked (and scroll-linked effects are reversible). Every loop stops off screen and when `document.hidden`. No parallax on text, no word-by-word reveals except M06, no custom cursor, no scroll hijack (native scroll, passive listeners), no glitch anywhere (the failure beat uses a dashed outline and a 3 px shake, not an RGB split). One blinking caret on the page (hero full stop) and the composer textarea's native caret.

### 7.2 Effects, numbered

Each lists trigger, duration, easing, properties, reduced-motion behaviour, off-screen behaviour.

- **M01 Boot.** Trigger: first paint of `#standby`, once. 1.1 s total: hairlines draw from P outward (stroke-dashoffset, 700 ms, `--ease-brand`); core scales 0.6 to 1.0 (900 ms); H1 lines rise by `clip-path` (500 ms each, 90 ms stagger); the yellow full stop lands last (scale 0 to 1, 160 ms); dock fades in. Not a gate: text and CTA are readable at first paint. Reduced: final state at once. Off-screen: n/a (once).
- **M02 Core idle.** Trigger: time. Yaw ±5° over 40 s, breathing 1 ±0.015 over 8 s, orbiters. `transform` in shader. Reduced/`motion=off`/tier off: none. Off-screen or hidden: loop stops.
- **M03 Pointer follow.** Trigger: pointer move (fine pointer only). Yaw/pitch ≤ 4°, `x += (target - x) * (1 - exp(-dt * 6))`. Reduced: off. Off-screen: off.
- **M04 Packets.** Trigger: time and `uFlow`. Linear, 2.4 s per edge idle; ×2.5 while hovering or focusing a CTA (160 ms ramp). Reduced: packets static on their edges. Off-screen: stop.
- **M05 Signal line.** Trigger: first activation of stations 01, 03, 04, 06, once each per session. A 1 px `signal` line crosses the viewport top, `scaleX` 0 to 1 then fades, 700 ms, `--ease-brand`. Reduced: the dock tick lights instead. Off-screen: n/a.
- **M06 Premise word lighting.** Trigger: scroll through `#premise` (scroll-linked, reversible). Each word colour `--ink-dim` to `--ink` via a CSS variable per word; full stop appears when the last is lit. Reduced and RAW: all lit. Off-screen: no work.
- **M07 Arm select.** Trigger: row hover, focus, click or scroll proximity. 160 ms `--ease-ui`; arm and hub stroke colour; leader draws 200 ms. Reduced: instant.
- **M08 Step roll and packet.** Trigger: scroll in `#line`. Word change: vertical clip roll 480 ms `--ease-brand`, once per step, reversible; packet position linear and scroll-linked. Reduced: six-row list, no pin.
- **M09 Failure beat (illustrative).** Trigger: first entry to step BUILD, or `REPLAY`. Check outline turns dashed, shakes 3 px (240 ms), a ring scales 0.7 to 1.45 while fading (600 ms), outline goes solid; about 1.4 s total. Always labelled `ILLUSTRATIVE`. Paused by `PAUSE`. Reduced: final text: *A check failed once, was retried and passed. Illustrative.* Off-screen: not started.
- **M10 Plate scan.** Trigger: a plate at 35% visible, once. A 1 px yellow line crosses the screenshot top to bottom (600 ms, linear) with a 12 px mono timestamp (visitor's local time) and two sector labels; the image goes from 12% to 100% opacity behind it. This is the brief's "scan overlay": instrumentation, not a video-game HUD. Reduced: image shown at once. Off-screen: n/a.
- **M11 Hotspot highlight.** Trigger: hover, focus or tap on a spec row or region. 160 ms: a 1 px yellow box on the region, others dim to 35%. Touch: tap a row zooms the window to the region (CSS `transform`, 360 ms). Reduced: no zoom animation (instant).
- **M12 Build counter flip.** Trigger: station change. `BUILD 003` digits flip with `steps(6)` over 240 ms. Reduced: instant.
- **M13 Convergence.** Trigger: scroll in `#done`. As 6.2 S6; `uMix` damped (k about 6), dwell plateaus at 0.2 to 0.4 and 0.8 to 1. Reduced/tier off: static final SVG. Off-screen: loop stops.
- **M14 Finale type.** Trigger: station 06 activates. Three lines clip-rise 500 ms, 90 ms stagger; a yellow underline sweep under `DONE.` once when progress passes 0.9. Reduced: set.
- **M15 CTA arrow.** Trigger: hover/focus. Arrow stem 24 to 56 px, 160 ms `--ease-ui`. Reduced: instant.
- **M16 Brief change.** Trigger: checkbox toggle. Dock and header counters flip (`steps(6)`, 240 ms); a 2 px yellow ring on the toggled control (160 ms). Reduced: instant.
- **M17 Copy feedback.** Trigger: `COPY TEXT`. Label becomes `COPIED` for 1.6 s; announced via `aria-live="polite"`. Reduced: same (not motion).
- **M18 Chip highlight.** Trigger: ledger row click. Matching chips get a 2 px yellow outline for 3 s (160 ms in, 200 ms out). Reduced: outline only, no scroll animation.

Pause control: `MOTION: ON | OFF` (`aria-pressed`) in the header. It sets `data-motion`, stops the WebGL loop, M02-M04, and all ambient motion, and forces Level 1 rendering. It starts **off** when the OS reports `prefers-reduced-motion: reduce`; a visitor can turn it on deliberately. The only loops above five seconds are M02 and M04; both are covered by it.

### 7.3 Library decision

| Need | Tool | Why |
|---|---|---|
| Hover, reveal, power-on, sticky tracks, count flips | **CSS** (variables, `clip-path`, `position: sticky`, `animation-timeline` is not relied on) | Zero bytes, compositor only |
| Hairlines, tags, leader lines, packets in the SVG tier, static figures | **SVG** + CSS (`stroke-dashoffset`, `offset-path`) | Source of truth for every layout; fallback |
| The core: points, lines, packets, morph | **three.js**, vanilla, lazy | Instancing and a vertex-shader morph are the only way to move about 1,200 points smoothly; the brief allows it |
| Scroll scalar | Own code (about 80 lines): one rAF, passive scroll, writes `--p` and a plain object | Native sticky covers pinning, so a scroll library is not needed |
| **GSAP / Framer Motion** | **Not used** | Pinned stages are CSS sticky inside tall tracks; the page has two pins. GSAP ScrollTrigger (about 25 to 40 kB gzip) is the named fallback only if a pinned timeline proves impossible with sticky; any addition must be justified in `PROMPT_LOG.md` |

---

## 8. Case-study treatment: StaffXP and ESS

### 8.1 Principle

A record is **a real screen plus a dot-leader spec sheet**, one record per screen, linked both ways. Only facts visible in the captures or stated by the team are written; everything else is one dashed `PENDING` row (a single row, not four). The brief's example row (`ENTERPRISE WORKFORCE PLATFORM / .NET / React / AI / Cloud / PRODUCTION`) is **not used**: enterprise scale, the stack and production status are unconfirmed. The three `project-0n` write-ups describe other projects (performance management, CRM, AI agent platform) with no screenshots; they supply no claims for this page, and none of their content appears.

### 8.2 Layout (desktop, 1440 wide)

Label `04.1 / DEP-001`. Giant name `STAFFXP` (Geist 500, 16vw, tracking -0.055em) left; descriptor right in mono. Screenshot full content width (about 1360 px, about 697 px tall), 1 px frame, caption beneath. Spec list in two columns below, dot leaders, Geist Mono 13 px. Plate 04.2 mirrors it (screenshot flush right, `ESS` at 22vw). DEP-003 is a dashed-hairline line with no image.

### 8.3 DEP-001 STAFFXP (`staffxp-dashboard.webp`, 1869×958)

Spec rows:
- `PRODUCT ........ StaffXP`
- `IS ............. a staff experience platform for schools` (team fact; open question 5 on wording)
- `CAPTURE SHOWS .. top navigation (Attendance, Notices, Activities, Wellbeing, Extra-curricular, T&L) · four counters (To mark, Classes, Messages, Tasks) · Academic calendar · To do list (opens in Microsoft To Do) · Notices · Quick links (including Employee self-service) · Assignments to mark · AI assistant panel`
- `SIGN-IN ........ Sign in with Microsoft` (from the sign-in capture, text only)
- `DETAILS ........ [ STACK · STATUS · CLIENT ] ( PENDING TEAM CONFIRMATION )`
- `RESULTS ........ NOT PUBLISHED` (shown as a muted dashed line, not a chip row)

Hotspots (percent of image: x, y, w, h), measured against the committed file; tolerance about ±1%, verified by the `?debug=hotspots` overlay and the geometry test (8.5):

| id | region | x | y | w | h |
|---|---|---|---|---|---|
| `nav` | top navigation | 0.0 | 0.0 | 40.2 | 4.9 |
| `counters` | To mark, Classes, Messages, Tasks | 53.5 | 9.9 | 27.1 | 11.0 |
| `calendar` | Academic calendar | 0.7 | 34.4 | 19.1 | 61.1 |
| `todo` | To do list | 21.5 | 34.4 | 38.2 | 32.5 |
| `mstodo` | Open in Microsoft To Do link | 48.7 | 62.2 | 9.8 | 2.6 |
| `notices` | Notices | 21.5 | 69.4 | 38.2 | 30.6 |
| `quicklinks` | Quick links (includes Employee self-service) | 61.4 | 34.4 | 19.1 | 22.4 |
| `marking` | Assignments to mark | 61.4 | 59.3 | 19.1 | 34.2 |
| `assistant` | AI assistant panel (named "Felix" in the capture) | 81.8 | 5.7 | 17.8 | 93.0 |

The assistant panel is named in the capture; the name is not repeated in copy until the team confirms it (open question 6). The dashboard numbers in the capture (3, 0, 0, 4 and 3/4) are sample values and are never quoted.

### 8.4 DEP-002 ESS (`ess-portal.webp`, 1867×956)

Spec rows: `PRODUCT ... ESS` · `IS ... an employee self-service portal` · `CAPTURE SHOWS ... Profile summary · Company directory search · Employment, Skills & performance, Attendance, Rewards & Benefits, Approval delegations, Org chart · Submit request · Time off balances · Payslips · Tasks · Courses · Academy courses` · `DETAILS ... [ STACK · STATUS · CLIENT ] ( PENDING TEAM CONFIRMATION )` · `RESULTS ... NOT PUBLISHED`. The person, staff ID and school in the capture are sample values (caption says so). No link is drawn between StaffXP's "Employee self-service" quick link and ESS: whether they are the same product is unconfirmed.

| id | region | x | y | w | h |
|---|---|---|---|---|---|
| `nav` | top navigation | 0.0 | 0.0 | 100.0 | 5.0 |
| `profile` | Profile summary | 2.5 | 7.4 | 95.2 | 25.2 |
| `directory` | Company directory | 2.5 | 35.1 | 30.9 | 10.9 |
| `menu` | Employment ... Org chart | 2.5 | 47.3 | 30.9 | 47.0 |
| `request` | Submit request | 34.7 | 35.1 | 30.8 | 27.3 |
| `timeoff` | Time off balances | 34.7 | 63.7 | 30.8 | 20.7 |
| `payslips` | Payslips | 34.7 | 85.7 | 30.8 | 8.6 |
| `tasks` | Tasks | 66.8 | 35.1 | 30.9 | 15.5 |
| `courses` | Courses | 66.8 | 51.9 | 30.9 | 15.6 |
| `academy` | Academy courses | 66.8 | 68.7 | 30.9 | 25.5 |

### 8.5 Viewer behaviour

- Each region has a **limited tag** (`UI-03 CALENDAR`) that expands to a **full tag** (three lines: id, label, evidence state `VISIBLE IN CAPTURE`) on hover, focus or tap. Tags are real buttons in the spec list (the accessible equivalent); the boxes over the image are `aria-hidden` and share the data.
- A faint `A–H × 1–5` sector grid with edge ticks overlays the frame (decorative, sourced from the image size; sector labels appear only in the M10 scan).
- Hover or focus a row: a 1 px yellow box on its region, all other regions dim to 35%. Hover a region: its row highlights. Touch: tap a row zooms the window to the region so the text inside is readable.
- **Pending as design:** the `DETAILS ( PENDING )` row is a dashed chip row in the same style as the legend; when the team confirms a value, only that value replaces the chip, with its source. Brief example values never go in.
- **RAW view:** the same facts as a mono dot-leader sheet (the screenshot stays, as a plain framed image).
- **Geometry test:** `hotspots.test.js` asserts: image natural sizes equal the constants (1869×958, 1867×956), every box inside 0 to 100, no negative size, hotspot ids unique, and no two boxes overlap by more than 5% of the smaller except the documented containment (`counters` within the banner is not a box; `profile` contains nothing else).
- **`NAME_PRODUCTS` content flag:** if the team does not grant permission to name StaffXP and ESS, the labels change to "School staff platform" and "Employee self-service portal" and the product names are removed from copy (the captures show the names in their top bars; the team must then decide whether to crop them, open question 7).

### 8.6 DEP-003 AGENT WORKFLOW DEMO

No screenshot. A dashed hairline row: `DEP-003 / AGENT WORKFLOW DEMO / ILLUSTRATIVE`, hatched node, the sentence *Illustrative demo. Not a client project.*, link `OPEN DEMO →` to `/#ai-agents` (preloads the demo chunk on hover). It is the third proof point and never presented as delivered work.

---

## 9. Proof and signals without invented numbers

Proof comes from five kinds of evidence only:

1. **Two real screens** (StaffXP, ESS), the dominant visual, labelled sanitized and sample.
2. **The confirmed service list as the object itself**: eight services, with the named platforms (Power Platform, Make, n8n, Retool, Bubble; Azure, AWS, GCP; the four AI capability names) as leaves with a `LIVE` source in each node's full tag.
3. **One sourced company claim:** *25+ years of leadership experience across our leadership team*, with chip `LIVE · xiontechs.com · captured 2026-09-22` (wording is about the leadership team, not the company).
4. **The Ledger** (4.7): what is real, sample, illustrative, draft, pending, and how the glyphs map.
5. **Honest page instrumentation**, small: dock readout of real render tier, quality and motion; build stamp (short commit SHA and build date, injected at build); visitor-local timestamp in the plate scan; day-of-year in the header. Measured values show `N/A` when unavailable. The optional repository strip (P2) is labelled "this site's repository".

Allowed numbers and their provenance: 25+ (LIVE), the two phone numbers and email (LIVE), commit SHA and date (BUILD), counts in the brief badge (derived), `02` is never used as "projects delivered". **Absent by design:** client names and logos, testimonials, project counts, uptime, percentages, ROI, user counts, delivery times, certifications, stack or production claims for StaffXP and ESS, office locations and legal name until confirmed, `BUILD #4821`, `98%`, `99.8%`, `ONLINE`.

---

## 10. Responsive and accessibility plan

### 10.1 Breakpoints

| Width | Behaviour |
|---|---|
| **320** | Single column, 16 px gutters. H1 43 px (13.4vw); core 140 px; legend wraps to two lines; arm instrument 140 px sticky; screenshot window 100vw × 62vw; no horizontal scroll (verified at 200% text zoom); mobile bottom CTA bar 56 px |
| **390** | As 320. H1 52 px, three lines; core 160 px at `P = (72vw, 22vh)`; tags inside SVG; CTA full-width 52 px high |
| **768** | Hero keeps headline at 11vw bottom-left; supporting copy and CTA move under it; core 200 px at `(74vw, 24vh)`; DEPLOY puts the instrument above rows; plates one column; 24 px margins |
| **1024** | Header gains nav words; hero as desktop but core 240 px; plates keep full-width screenshot, spec in one column |
| **1280** | The designed desktop: hero as 6.1, spec two columns, 40 px margins |
| **1920** | Content max-width 1600 centred; display type capped at its clamp maximum; hairlines and dot grid full-bleed; DPR cap 1.5 on the canvas; core 320 px |

Use `svh` for stage height with `lvh` tracks so mobile toolbars do not jitter. Disable pins on landscape phones under 500 px height (show final states). No hover-only information: every hover affordance has focus and tap equivalents. All interactive targets at least 44×44 CSS px (WCAG 2.2 minimum is 24; we exceed it).

### 10.2 Accessibility plan

- **Structure:** one `<h1>` (hero), one `<h2>` per station, landmarks `<header>`, `<nav aria-label="Primary">`, `<main>`, one `<section aria-labelledby>` per station, `<footer>`. `<html lang="en">`. Skip link first in tab order.
- **State controls** are native elements: `READ | RAW` and `MOTION` are `<button aria-pressed>`; arm rows are `<button aria-current>`; process stops are `<ol>` of `<button aria-current="step">`; brief items are real `<input type="checkbox">` with labels; mobile menu has `aria-expanded`, focus trap, Esc to close.
- **Graph and canvas:** canvas and decorative SVG are `aria-hidden`; every meaningful fact is real DOM text; hotspot boxes are `aria-hidden`, the spec rows are the accessible equivalent with `aria-describedby` for full tags.
- **No JS:** `<noscript>` shows the eight services, email and phones and disables reveal states via `<noscript><style>[data-reveal]{opacity:1!important;transform:none!important}</style></noscript>`; `html` defaults to the static layout and only the JS adds `data-reveal` hiding.
- **Focus:** `:focus-visible` 2 px `signal` outline, offset 3 px; on yellow fills the outline is `ink`. Focus never lands in an invisible element.
- **Live regions:** brief count and `COPIED` use `aria-live="polite"`; the dock readout is not live (avoids chatter).
- **Contrast:** body 9.8:1, labels 5.8:1, yellow 10.5:1, navy on yellow 10.5:1. `--ink-dim` is only used at 24 px and up (premise words). Inactive DEPLOY rows use `--ink-3` (5.8:1), not `--ink-dim`.
- **Motion:** `prefers-reduced-motion` and the toggle produce Level 1 (final states, no motion, no information lost). No flashing above 3 per second. The scan line and caret are the only fast elements.
- **Zoom and reflow:** 200% text zoom and 320 px reflow without horizontal scroll or clipped display type.
- **Keyboard:** no custom global shortcuts (they collide with assistive tech and IME). Everything is Tab, Enter, Space, Esc.
- **Consent and privacy:** no cookies, no analytics, no third-party requests (fonts self-hosted). No banner. `localStorage` only for the RAW/MOTION preference, wrapped in try/catch and optional (`?view=raw` also works). No personal data in URLs; the mailto body is built client-side only.

### 10.3 READ | RAW

`data-view="raw"` re-styles the same DOM through `raw.css`: no canvas mount, pins off, display sizes capped at 28 px, sections as plain mono dot-leader lists, screenshots as framed images. Set by an inline pre-paint script (reads `localStorage`, `?view=raw`) to avoid a flash. It is the accessibility floor and the proof that the page works without the 3D.

### 10.4 Anchors and tall tracks

Each station's id is on its track wrapper with `scroll-margin-top` = header height. A hash landing mid-load waits for `document.fonts.ready` and layout settle, then scrolls once. Scalars are pure functions of scroll position (no stateful transitions), so loading at `#line` or `#done` shows the correct state; restoring scroll position on reload produces the same state. A unit test covers `trackProgress` and `plateau` for arbitrary `scrollY`.

### 10.5 Mobile-specific

Fixed bottom CTA bar with safe-area inset; DEPLOY rows stack with a sticky 160 px instrument; ON FILE spec rows tap-zoom the screenshot region; LINE falls back to the list under 380 px height or landscape; the core uses tier low from the start (coarse pointer under 768 px); all effects reduce to the SVG tier if FPS drops.

---

## 11. Component and file architecture, and work packages

### 11.1 Entry and config

- Entry: `concepts/command/index.html` (already a Rollup input in `vite.config.js`). Contains: meta, `<link rel="preload">` for Geist, the inline pre-paint script (view, motion), `<noscript>` content, `<div id="root">`, `<script type="module" src="/src/concepts/command/main.jsx">`.
- Tailwind: root `tailwind.command.config.js` (content `./concepts/command/index.html`, `./src/concepts/command/**/*.{js,jsx}`; colours as `rgb(var(--x) / <alpha-value>)`), loaded from `src/concepts/command/command.css` via `@config`. The main config keeps excluding `src/concepts/**`.
- `vite.config.js` gains `define` for `__BUILD_SHA__` and `__BUILD_DATE__` (from `git rev-parse --short HEAD`, fallback `dev`).
- Dev dependencies to add: `@fontsource-variable/geist`, `@fontsource-variable/geist-mono`, `puppeteer-core` (QA script only). No GSAP, no Framer Motion, no `lucide-react` use.

### 11.2 Tree

```
concepts/command/index.html
tailwind.command.config.js
scripts/command-qa.mjs                    # screenshot gate + bundle budget (puppeteer-core, headless Edge)
src/concepts/command/
  main.jsx   App.jsx
  command.css                             # @config, imports below
  styles/ tokens.css  base.css  motion.css  raw.css
  content/
    index.js                              # aggregates + validates shape
    brand.js  hero.js  premise.js  modules.js  process.js  records.js
    hotspots.js  ledger.js  contact.js  legend.js  flags.js
    content.test.js                       # sources, digits, forbidden words
  contract/
    attributes.js                         # data-* names + safe setters
    stations.js                           # ids, order, labels, track heights
    anchors.js                            # <CoreAnchor/> + rect registry
    brief.js  brief.test.js               # selection store + mailto builder
  runtime/
    scroll.js  scroll.test.js             # progress, plateau, k/alpha maps, controller
    capability.js  capability.test.js     # tier selection (pure)
    governor.js                           # FPS downgrade (pure core + thin timer)
    hooks.js                              # useInView, useReducedMotion, useActiveStation
  ui/
    Chip.jsx  Label.jsx  Rule.jsx  Button.jsx  FullStop.jsx
    SpecRow.jsx  Frame.jsx  Reveal.jsx  KeyValue.jsx
  frame/
    Header.jsx  Dock.jsx  MobileBar.jsx  SkipLink.jsx
    MotionToggle.jsx  ViewToggle.jsx  SignalLine.jsx
  core/
    graph.js  graph.test.js               # nodes/edges from content
    layouts.js  layouts.test.js  rng.js
    mark.js   mark.test.js                # logo mark polylines + sampler
    CoreFigure.jsx                        # SVG for any layout
    CoreCanvas.jsx                        # lazy mount + tier + painted flag
    three/ createCore.js  shaders.js  buffers.js
  sections/
    Standby/  Premise/  Deploy/  Line/  OnFile/  Ledger/  Done/
```

Tests run under the existing Vitest config (`src/**/*.test.js`, Node environment): all logic modules are pure.

### 11.3 Shared contract (WP0, must exist before anything else)

1. **Tokens:** `tokens.css` with every colour channel, easing and duration in 5.1; `tailwind.command.config.js` mapping them; fonts imported. A story page `?tokens` renders swatches and the type scale for visual review.
2. **Content module:** shape in 12.1; `content/index.js` exports frozen objects; `content.test.js` enforces rules (12.4). Sections import copy from it, never hardcode strings.
3. **State attributes on `<html>`** (single source of truth; written only by `contract/attributes.js`):

| Attribute | Values | Writer |
|---|---|---|
| `data-tier` | `off` `low` `high` | capability + governor |
| `data-motion` | `on` `off` | MotionToggle / media query |
| `data-view` | `read` `raw` | ViewToggle / pre-paint script |
| `data-station` | `0`..`6` | scroll controller |
| `data-active` | section id | scroll controller |
| `data-webgl` | `drawn` (absent otherwise) | CoreCanvas |
| `data-brief` | count | brief store |

4. **Scroll and scene contract (`runtime/scroll.js`, `core/` API):**
```js
// station + progress, written by the controller, read by sections, dock and the scene
registerTrack(id, element, { plateaus })  // -> unsubscribe
getState() // { station, progress: {id: 0..1}, k: 0..4, alpha: 0..1, scrollY, vw, vh }
// anchors
<CoreAnchor name="hero|premise|deploy|line|done" />   // renders [data-core-anchor]
// scene (lazy module)
createCore({ canvas, graph, layouts, tier, tokens }) // -> {
//   setUniforms({ k, alpha, active, flow, pointer }), setAnchorRect(rect),
//   start(), stop(), dispose(), on('painted' | 'lost' | 'slow', fn) }
```
Progress is CSS variables `--p` per track and a plain object; no React state per frame.
5. **Brief store (`contract/brief.js`)**, `useSyncExternalStore`-based, API: `toggleService(id)`, `toggleRecord(id)`, `has(id)`, `count()`, `items()`, `buildMailto({ note })`, `buildText({ note })`. Pure builders are tested: subject `Project enquiry`, body as in 4.8, encoded, capped at about 1,800 characters.
6. **UI primitives** with fixed APIs: `<Chip kind="live|real|sample|measured|build|pending|illustrative|draft" />` (draft renders only in dev or `?review`), `<Label>`, `<SpecRow label value />`, `<Button variant="primary|ghost" arrow />`, `<FullStop />`, `<Frame ticks />`.
7. **Zero-state ESLint guard:** override for `src/concepts/command/**` with `no-restricted-imports` blocking any relative path leaving the folder and `src/components`, `src/hooks`, `src/workflow`, `src/content`.
8. **Entry skeleton:** `concepts/command/index.html`, `main.jsx`, `App.jsx` that renders an empty station list so `npm run build`, `npm run lint`, `npm test` pass on day one.
9. **Housekeeping:** replace the stale "Concept pages" paragraph in `CLAUDE.md` with a pointer to this file; first `PROMPT_LOG.md` entry.

### 11.4 Work packages (parallel after WP0)

Suggested assignment so git history shows all three: **A** = WP0, WP1, WP6; **B** = WP2, WP4; **C** = WP3, WP5. Each package on its own branch `feat/command-v2-wpN`, merged into `feat/concept-01-command-v2`; each person commits as themselves.

**WP0: Contract and infrastructure** (blocking; about a short first pass). Deliverables 1 to 9 above. Done when: `npm run build`, `lint`, `test` pass; token swatch page matches 5.1; content test fails on a seeded violation.

**WP1: Frame, shell, runtime.** Files: `index.html` extras (preload, pre-paint script, noscript), `App.jsx`, `frame/*`, `runtime/*` (scroll controller, capability, governor, hooks), `styles/base.css, motion.css, raw.css`, `ui/*` finish. Responsibilities: Header (nav, DOY, toggles, CTA states), Dock (BUILD counter, scrubber, readout, BRIEF), mobile bar, skip link, RAW view and its stylesheet, motion toggle, tier selection and FPS governor, active-station detection, hash handling. Tests: `scroll.test.js` (progress, plateau, k/alpha maps for each station, arbitrary scrollY), `capability.test.js` (matrix of device flags to tier), governor hysteresis. Done when: all seven station ids scroll-spy correctly at 320 and 1440; `data-*` attributes update; RAW works with no JS errors; no layout reads in the scroll handler.

**WP2: Core (graph, layouts, SVG figure, three.js).** Files: `core/*`. Order of delivery: (1) `graph.js` + `layouts.js` + tests; (2) `CoreFigure.jsx` rendering all five layouts as static SVG (this alone is a shippable page); (3) `mark.js` and the mark SVG; (4) `CoreCanvas.jsx` and `three/*` behind the tier gate. Done when: SVG figures for L0 to L4 look finished with WebGL blocked; WebGL chunk at most 180 kB gzip; same node ids across layouts; first WebGL frame sets `data-webgl="drawn"`; context-loss test (dev tool `loseContext`) falls back cleanly; 60 fps on a mid desktop, at least 40 fps on `low`.

**WP3: Standby, Premise, Deploy** (stations 00 to 02). Files: `sections/Standby`, `Premise`, `Deploy`. Responsibilities: hero composition and hairlines, boot (M01), tags and leader lines, legend, premise word lighting (M06), module rows, sticky instrument, service checkboxes wired to the brief, `OFFERED` states, hover/focus tag expansion. Done when: the hero matches 6.1 at 1440 and 390; no text overflows at 320 and 200% zoom; arm selection works by keyboard; brief count updates header and dock.

**WP4: The Line** (station 03). Files: `sections/Line`. Responsibilities: pinned stage, six steps, step roll, linear packet, failure beat with PAUSE/REPLAY, REQUEST brief line, list fallback. Done when: arbitrary scroll positions yield the right step; focusing a stop scrolls to its progress; reduced motion shows the list; the failure beat is labelled illustrative and contains no digits.

**WP5: On File and Ledger** (stations 04 and 05). Files: `sections/OnFile`, `sections/Ledger`, `content/hotspots.js`, `hotspots.test.js`. Responsibilities: plates, viewer, hotspot linking, scan (M10), sector grid, tap-zoom, `?debug=hotspots`, DEP-003 row, ledger table, chip highlight (M18), build stamp, optional repo strip. Done when: hotspot test passes; overlay shows boxes aligned within ±1% on both files; every pending value is a chip; `NAME_PRODUCTS=false` swaps labels.

**WP6: Done, contact, QA harness** (station 06 and quality gates). Files: `sections/Done`, `scripts/command-qa.mjs`. Responsibilities: finale type (M14), composer, mailto and copy, endpoints and footer, convergence DOM hooks (anchors), static final frame, and the QA script: screenshots at 320, 390, 768, 1024, 1280, 1920 (headless Edge via `puppeteer-core` from PowerShell), horizontal-overflow check, bundle-size report against budgets, content/forbidden-string scan on the built HTML. Done when: SEND EMAIL builds a correct `mailto:`; COPY TEXT works; no horizontal scroll at 320; QA script fails the build on a budget breach.

### 11.5 Ownership rules

- A package edits only its own files. Shared contract changes go through WP0's owner (small PR, announced).
- Nothing imports from outside `src/concepts/command/` except npm packages (lint-enforced).
- Copy lives in `content/`. Colours only via tokens. A new string needs a source tag.
- Every merged package updates `PROMPT_LOG.md` (decisions, and where the AI got it wrong).

### 11.6 Build order (so the page is never blank)

1. WP0. 2. In parallel: WP1 (shell), WP2 step 1 and 2 (graph, layouts, SVG figures), WP3/WP5/WP6 static versions of their sections with real content. 3. Level 1 and Level 2 (static + CSS/SVG motion) complete and reviewed at all widths. 4. RAW view and reduced motion verified. 5. WP4 pinned line. 6. WP2 three.js canvas behind the tier gate. 7. Convergence (WP2 + WP6) **last**. 8. Performance and accessibility pass; Vercel skills as QA.

---

## 12. Content module outline

### 12.1 Source tags and shape

Tags: **FACT** (live xiontechs.com, captured 2026-09-22, or team-stated facts); **BRIEF** (team-authored `docs/idea/v2/01-X-Command.md`, counts as a source); **DRAFT** (written for this page from FACT or BRIEF material, pending sign-off; `draft: true`; marked only in dev or with `?review`; **never used for a fact**); **ILLUSTRATIVE** (not real; always labelled for every visitor); **PLACEHOLDER** (a value not yet known, rendered as a `PENDING` chip). `BUILD` and `MEASURED` are runtime sources, not content.

```js
// every string group has the same wrapper
{ id, text, src: 'FACT'|'BRIEF'|'DRAFT'|'ILLUSTRATIVE'|'PLACEHOLDER', source?: 'live-site 2026-09-22', draft?: true, label?: 'ILLUSTRATIVE' }
// graph node in content
{ id, kind, label, parent, evidence: 'fact'|'pending'|'illustrative'|'method', src, quote? }
```

### 12.2 Groups

| Group | Contents | Tag | Honesty label |
|---|---|---|---|
| `brand` | name XionTechs; slogan GET IT DONE; logo files and sizes | FACT | none |
| `hero` | H1 `ENGINEERING THAT GETS IT DONE.`; supporting sentence; CTA labels; FIG 01 caption; legend labels | BRIEF; caption DRAFT | FIG caption: "layout is artwork" |
| `premise` | statement (BRIEF §1); plain paragraph | BRIEF; paragraph DRAFT (built from eight services) | none |
| `premise.claim` | "25+ years of leadership experience across our leadership team" | FACT | chip `LIVE · captured 2026-09-22` |
| `modules` | 4 modules: id, name, state `OFFERED`, one-line definition | names BRIEF; definitions DRAFT | grouping marked DRAFT |
| `services` | 8 services with parent module, sub-items and platform names | FACT | `LIVE` chip in the full tag |
| `process` | 6 steps (word + one sentence, no digits) | DRAFT | `STEPS: DRAFT` line |
| `process.beat` | failure-beat text and states | ILLUSTRATIVE | chip `ILLUSTRATIVE · NOT A CLIENT RUN` |
| `records` | DEP-001, DEP-002, DEP-003: name, descriptor, capture list, spec rows | name and descriptor FACT (team-stated); capture list FACT (visible in image); DEP-003 ILLUSTRATIVE | `SANITIZED CAPTURE ( SAMPLE VALUES )`; `PENDING` details row; DEP-003 hatched |
| `records.pending` | stack, status, client, results | PLACEHOLDER | dashed `PENDING`, `NOT PUBLISHED` |
| `hotspots` | percent boxes and labels | FACT (visible UI) | none; geometry tested |
| `ledger` | 6 rows (REAL first) | DRAFT (row 5 dev-only) | the row types themselves |
| `contact` | email; two phones; subject and body template; microcopy | FACT; microcopy DRAFT | none |
| `contact.social` | LinkedIn, Facebook URLs | PLACEHOLDER until URLs supplied (rows omitted) | not rendered |
| `contact.offices` | Dallas, Ho Chi Minh City, Da Nang; legal name "XionTech Joint Stock Company" | PLACEHOLDER (unconfirmed) | shown only under `?review`, with `PENDING` |
| `flags` | `NAME_PRODUCTS`, `SHOW_REPO_STRIP`, `SHOW_DRAFT_MARKS` | n/a | n/a |

### 12.3 Strings that must not appear in production copy

`ONLINE`, `AVAILABLE`, `PRODUCTION` (as a status value), `SUCCESS`, `UPTIME`, `99`, `98%`, `#4821`, "projects delivered", Lorem, any testimonial text, any client name, `.NET`, `React` (as a claimed stack of a product), "enterprise" (as an adjective for StaffXP or ESS).

### 12.4 `content.test.js` enforces

- every string and node has a `src`;
- `evidence: 'fact'` never carries `src: 'DRAFT'` or `'PLACEHOLDER'`;
- no digits in `process`, `process.beat` or illustrative text except an allow-list (phone numbers, "25+", dates, the capture date, DEP ids, hotspot numbers);
- no string from 12.3;
- each of the eight confirmed services appears exactly once;
- status values are only `OFFERED`, `ACTIVE`, `PENDING`;
- every `PENDING` value renders as a chip (checked in the component test or snapshot of `SpecRow` props).

---

## 13. Acceptance checklist

### 13.1 Zero-State checklist (v2)

- [ ] **New hero composition:** the headline is cut by two ±32° hairlines crossing at a small X core; no split-hero, no dashboard panel, no orb. Check: screenshot at 1440 and 390 compared against section 6.1.
- [ ] **New IA:** seven stations 00 to 06; no About, Why Us, Testimonials, FAQ, Pricing. Check: section list and the `data-station` map.
- [ ] **New content hierarchy:** the claim and the sourced fact are in PREMISE; services appear as the object (not a grid); proof is two real screens plus the ledger.
- [ ] **New case-study treatment:** screenshot + dot-leader spec + two-way hotspots + one pending row; no card grid, no carousel, no invented stack or status.
- [ ] **New motion language:** activation (dim to yellow), one scalar, 18 numbered effects, no GSAP/Framer, no scroll-jack. Check: motion list vs code.
- [ ] **New 3D strategy:** one lazy canvas, vertex-shader morph of one point pool across five layouts, SVG figure for each layout as fallback. No orb, no post-processing.
- [ ] **New CTA treatment:** selection builds a brief, which becomes a `mailto:`; one label everywhere; no form, no backend.
- [ ] **Recognisable branding:** deep navy, white, yellow signal under 3% of any frame, the X motif as object and final mark, GET IT DONE in the finale, real logo at native size.
- [ ] **Zero-state guard:** no import from outside `src/concepts/command/` except npm packages (lint passes); nothing copied from the old page or the other branch.
- [ ] **The acceptance question:** a designer who never saw the old XionTechs page could plausibly have designed this from the brief.

### 13.2 Functional and honesty

- [ ] All eight confirmed services appear exactly once; the four modules cover them; no DATA arm.
- [ ] Every number, chip and status passes `content.test.js` (12.4); no string from 12.3 in the built HTML (QA scan).
- [ ] Every pending value is a dashed chip; DEP-003 and the failure beat are visibly illustrative; DRAFT marks appear only in dev or `?review`.
- [ ] No purple, no red, no green, no gradient on the page except the 120 px scrim; no `sign-in` screenshot used.
- [ ] Hotspot boxes within ±1% of the committed images; `hotspots.test.js` passes.
- [ ] `mailto:` opens with a correct subject and body for 0, 1 and 5 selections; `COPY TEXT` works; length cap respected.
- [ ] RAW view shows the same facts without 3D and without errors; `?view=raw` works.
- [ ] Deep links `#deploy`, `#line`, `#work`, `#ledger`, `#done`, `#contact` land correctly (also after reload mid-track).

### 13.3 Measurable targets

| Metric | Target |
|---|---|
| Entry JS (React + app + content + SVG figures) | at most 95 kB gzip |
| WebGL chunk (three deep imports + own code) | at most 180 kB gzip; lazy after first paint and idle |
| CSS | at most 14 kB gzip |
| Fonts (Geist + Geist Mono, latin, variable) | at most 120 kB woff2 total; Geist preloaded |
| Images | StaffXP and ESS webp only, about 114 kB total, lazy, explicit width/height |
| Lighthouse mobile (simulated 4G, mid-tier) | Performance at least 90; LCP at most 2.0 s (hero H1 text); CLS at most 0.02; TBT at most 200 ms; INP at most 200 ms |
| Lighthouse desktop | Performance at least 95 |
| Frame rate | median at least 55 fps `high` on a mid desktop; at least 40 fps `low` on a mid Android; at most 5 draw calls |
| Layout at 320, 390, 768, 1024, 1280, 1920 | no horizontal scroll; display type not clipped; verified by `command-qa.mjs` screenshots and reviewed by a human |
| Accessibility | Lighthouse accessibility 100; axe: 0 serious or critical; keyboard path reaches every control in a logical order; focus ring visible on navy and on yellow; 200% text zoom clean; contrast values in 5.1 hold |
| Reduced motion | OS setting yields Level 1 with no information lost (verified manually and by screenshot diff of final states) |
| No JS | `<noscript>` shows services, email, phones; page readable |
| Privacy | zero third-party requests (network panel), zero cookies |
| Page length | at most about 10,350 px at 1440×900 and a comparable number of phone screens |
| Resilience | with WebGL blocked, context lost mid-session, tab hidden and shown, resize and orientation change: no blank state, no error in console |

Tools: `npm test`, `npm run lint`, `npm run build` before every commit (project rule); the QA script; `npx lighthouse` run manually; Vercel web-design guidelines as the review pass after the visual language is set.

---

## 14. Open questions for the team

1. **Logo files:** a larger PNG or, better, an SVG of the full logo and the X mark. Until then the convergence uses a hand-traced mark (6.6) and the PNG at native 250×46. Is the white wordmark copy the official reversed version?
2. **Legal name and registered address:** is "XionTech Joint Stock Company" correct? Which street address (both on file are in Ho Chi Minh City)?
3. **Offices:** which of Dallas, Ho Chi Minh City and Da Nang are real, and may they be named? (Currently omitted.)
4. **Service-to-module grouping:** is Staffing Services right under PRODUCT DEVELOPMENT? Is AI-Driven Analytics right under AI SYSTEMS? Is dropping the DATA arm acceptable? Wording for the four one-line definitions.
5. **StaffXP wording:** "staff experience platform" (team fact) versus "Staff Experience Place - SXP" (sign-in screen). Which is the public name?
6. **The AI assistant panel** is named "Felix" in the capture. May it be named on the page, and is it XionTechs-built (not claimed now)?
7. **Permission to name StaffXP and ESS** (and whether their top-bar names in the captures may stay visible). If no: set `NAME_PRODUCTS = false` and decide on cropping.
8. **Is the "Employee self-service" quick link in StaffXP the ESS product?** Currently no link is drawn.
9. **Production status, stack, client or in-house, and results** for each product (all `PENDING` today; the brief's `PRODUCTION` and `.NET / React` are intentionally absent).
10. **The "25+ years of leadership experience" wording** and its capture date (2026-09-22): re-confirm or recapture from the live site.
11. **Contact path:** is a `mailto:` plus copy acceptable as the only conversion, or should a hosted form service be added later (it would need a privacy note and possibly a consent banner)?
12. **Is `/#ai-agents` on the main page staying live** at the deploy root (it is the DEP-003 link target)? Is the demo allowed to be linked from here?
13. **Social links:** the LinkedIn and Facebook page URLs (rows are hidden until supplied; nothing is invented).
14. **`og-image.png` and favicon:** regenerate from this design? The current files belong to the old page's identity.
15. **Fonts:** is Geist + Geist Mono acceptable, or should the Inter Tight + JetBrains Mono substitute be used?
16. **Repository strip (P2):** is a "this site's repository" weekly commit strip desirable, given a three-person challenge repo (could look thin)? Default: build it behind `SHOW_REPO_STRIP` and decide at review.
17. **Palette tweak:** is the added `--void #050F1F` and the allowance to nudge yellow to `#F6CA17` approved?
18. **Vietnamese or other languages** for launch: out of scope here; confirm.
