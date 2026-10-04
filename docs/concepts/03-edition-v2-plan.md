# Concept 03 v2, X / Edition ("The Proof"): plan

Branch `feat/concept-03-edition-v2`, created from `feat/concept-03-edition` at `5a81f0a` (committed state only; it carries
the Vite multi-page setup, the sanitized screenshots, `three` and the verified facts in `src/content/site.js`). Source
briefs: `docs/idea/03-X-Edition.md` and `docs/idea/00-Visual-Experience-System.md` (§17 zero-state). This is a from-scratch
design and a **standalone** build: the other Edition build (v1) is not a source, not a baseline and is never merged or
compared. Status of this document: **planning is finished, nothing is implemented.** Implementation starts from §12.

Disclosure (read this before trusting "from scratch"). Before the team chose "standalone", the first ~5 KB of the v1
plan (`docs/concepts/03-edition-plan.md` in the main checkout, uncommitted) were read once: it names a three-way choice
(cover / broadsheet / specimen), a masthead-and-contents magazine metaphor, Bodoni Moda + Instrument Sans + JetBrains
Mono, and a section list that puts the contents index before the feature. v2 therefore deliberately uses a different
metaphor (a proof under edit, not an issue), different type, different section order (proof first, index after) and a
different page signature. During setup the concept 02 plan, its `index.html` and its Tailwind wiring were read for page
mechanics only, plus the concept 01 / 02 entries of `PROMPT_LOG.md`. No palette role, component, IA or motion from
either concept is a source. Also glimpsed: the head of `src/workflow/journey.js` (main-page code, irrelevant here).

## 0. Context audit (brief 00 §17)

| Checked | Result |
|---|---|
| auto-memory | one note about concept 01 v2 (standalone-build pattern). Followed as a pattern only |
| `CLAUDE.md` | main-page colour / serif / rhythm rules and the concept 01 / 02 notes belong to those pages. Kept: honesty rules, Windows / Vite gotchas, a11y conventions, the concept-page mechanics (own Tailwind config, `/concepts/<name>/`) |
| `src/components`, `src/concepts/*`, `src/workflow` | no component or section code reused. "Would I create this if the repo were empty?" asked of each shared piece; only infrastructure survived |
| kept as infrastructure | Vite multi-page entry, Tailwind 3, vitest, ESLint, `public/XionTechs-Logo_s.png` and `public/concepts/architecture/logo-reversed.png` (copy it), `public/work/*.webp` (sanitized), verified data in `src/content/site.js` (imported, never copied) |

## 1. Research, what changed the design

- Editorial web in 2026 (design write-ups, e.g. the "Onward" magazine concept on Contra; font-pairing guides): type is
  the main visual tool, high-contrast display serif plus a plain sans for text, asymmetric broken grids, generous measure
  and leading. Decision: keep all of it, but spend the page's *one idea* elsewhere (below), so the page is not just
  "serif on cream".
- The engineering parallel: publishing has a *review step* (galley proof, copy-editor's marks, sign-off) and so does
  engineering (diff, review, merge). A studio of engineers that publishes would show the pass, not hide it. Decision:
  the page-wide signature is a **copy-edit pass** (§5). It carries the brief's marker idea (yellow highlighter), the
  brief's "typography reveal", and the closing "GET IT DONE" as the sign-off.
- Scroll motion: `animation-timeline: scroll()/view()` is widely shipped but the sources found disagree about Firefox
  and Interop status, so it is **not relied on**. Plan: IntersectionObserver for once-only triggers and one rAF scroll
  hook writing CSS variables (no React state per frame), which the other concept pages already proved small (<1 kB).
  Image reveals use `clip-path: inset()` (animatable, GPU friendly); recolour uses stacked layers and opacity, not a
  `filter` animation.
- Type: Newsreader (variable, optical size 6-72, weights 200-800, true italic; a news serif, so the display cut stays
  sturdy at poster size), Schibsted Grotesk (a grotesque made for a media company; neutral, readable), DM Mono
  (metadata). None is used by another concept or by the main page. Risk: Newsreader's display cut is gentler than a
  fashion Didone; mitigated by weight 700-800, uppercase, tight leading and scale contrast. Fallback stacks are set
  in the Tailwind config.
- Pitfalls named in the brief and kept as hard "do not" rules: SaaS hero, three-card grids, glass, gradients, stock
  imagery, UI chrome, the same pattern in every section, fade-up everywhere.

## 2. Three directions

| | A. The Long Read | B. The Light Table | C. The Proof |
|---|---|---|---|
| Idea | the page is one long article: single column, marginalia, pull quotes | the page is a photo editor's contact sheet: frames, selects, grease-pencil circles | the page is a galley proof under edit: copy-editor's marks resolve into the final copy; sign-off is the CTA |
| Hero | large headline over an article standfirst | a sheet of frames with one enlarged | giant five-line headline with one live correction, a developing image plate, crop marks |
| Signature | pull-quote scale jumps | circling / selecting frames | the pass: strike, insert, highlight, approve |
| Fit with brief | strong for Engineering Stories, weak for hero and "visual" | needs a lot of photography; we have three real screenshots and no portraits | maps brief §14 almost 1:1 (reveal, rules, marker, metadata, image slowly reveals) |
| Risk | reads as a blog; little spectacle | forced filler imagery breaks the honesty rule | gimmick if marks are decoration only; must stay readable and never imply a claim |

**Chosen: C**, with A's single reading column inside the feature and B's crop / frame treatment for screenshots. It gives
the hero signature (the corrected headline over a developing plate) and the page signature (every section is *passed*
once, then stays clean) one idea, as brief 00 asks. The risk is handled by rules in §5 and §9.

## 3. Information architecture (written fresh)

Narrative: *who we are, what we believe, proof first, more proof, what else we cover, how we think, who is behind it,
sign-off.* Visitors judge engineers by shipped work, so the capabilities index comes **after** the proof, as "what else
this team can do". Left out on purpose: testimonials (none are real), FAQ, why-us pillars, a separate process section.

| No | id | Running head | Band | What it is |
|---|---|---|---|---|
| 01 | `top` | Cover | paper | five-line headline, edition metadata, developing image plate, crop marks |
| 02 | `manifesto` | Manifesto | paper | "Software should move business." as huge broken lines, highlighter per line |
| 03 | `feature` | Feature | navy | StaffXP, pinned title, three chapters with the real screens and highlighter regions |
| 04 | `story` | Story | paper | ESS, shorter, the wide real screen panned sideways; agent steps as an Illustrative sidebar |
| 05 | `index` | Index | paper-2 | the five capabilities as a typeset index, each expands in place, no cards |
| 06 | `dispatches` | Dispatches | paper | three short engineering points of view, DRAFT wording, no invented fact |
| 07 | `about` | Contributors | paper-2 | roles as a huge typographic list, two verified facts, no portraits |
| 08 | `contact` | Sign-off | navy | "Have an idea? Let's build it. GET IT DONE." plus the colophon (contact, offices, social) |

**Navigation (brief §6):** `XIONTECHS / 01   WORK   SERVICES   STORIES   ABOUT   CONTACT`; WORK = `#feature`, SERVICES =
`#index`, STORIES = `#dispatches`, ABOUT = `#about`, CONTACT = `#contact`. Header is a hairline strip, not a bar of
buttons. Mobile: a `Contents` button opens a full-screen numbered list (focus-trapped, Escape closes). **Edge marker**
(≥1280 px): a vertical `EDITION 01 · 2026` label with the current section's folio and a hairline progress rule.
**CTA treatment:** square-cornered navy button, label in caps, yellow rule extends under it on hover / focus; on navy
bands a yellow-filled button with navy text.

## 4. Visual system

Tokens are CSS variables (RGB channels) in `edition.css`, Tailwind names `pf-*`; `data-band="navy"` and `"alt"`
re-scope the same names. No hex in components. Contrast computed for this plan (WCAG, ratio : 1):

| Token | Paper | Navy band | Use / contrast |
|---|---|---|---|
| `pf-bg` | `#F7F6F1` | `#08234A` | page |
| `pf-bg2` | `#EFEEE6` | `#0C2D5C` | alt bands, hover rows (re-test text pairs on these) |
| `pf-text` | `#08234A` | `#F7F6F1` | headings and body. navy on paper 14.38, paper on navy 14.38 |
| `pf-ink` | `#101820` | `#F7F6F1` | long body copy on paper, 16.54 |
| `pf-mute` | `#4A5666` | `#B6C2D4` | secondary text. 6.90 on paper, 8.64 on navy |
| `pf-rule` | `#8993A0` | `#8993A0` | hairlines, crop marks, decoration only (2.88 on paper, **never text**; 5.00 on navy) |
| `pf-mark` | `#F4C400` | `#F4C400` | highlighter fill, index chips, arrows, CTA fill. **Never text on paper (1.52).** As text on navy only (9.44) |
| `pf-on-mark` | `#08234A` | `#08234A` | text on a yellow fill, 9.44 |

Yellow rules: it is the editor's highlighter and the sign-off, used for (1) a highlighter swipe behind a phrase,
(2) an index chip, (3) an arrow, (4) the active nav underline, (5) the CTA fill, (6) the final rule. At most one
highlighter swipe per viewport-height of scroll. No yellow section background. Shape: square corners, hairlines,
registration crop marks on plates, no shadows, no glow, no gradients, no glass. Paper grain is one inline SVG noise at
a few percent.

**Type scale** (CSS `clamp`, desktop max / 360 px min): cover headline 168 / 52 px (Newsreader 800, uppercase, leading
0.88, opsz auto); h2 96 / 36; feature numerals 280 / 120 (Newsreader 300 italic, outlined or filled); h3 32 / 24;
standfirst 24 / 19 (Newsreader 400); body 18 / 17 (Schibsted Grotesk 400, 62-70 ch measure, leading 1.55); labels and
captions 12-13 px DM Mono, caps, tracking 0.08em (never below 11 px). Serif is display and standfirst only; UI text is
sans. Source copy is written in normal case; caps come from CSS so screen readers read words.

**Image treatment** (brief §14, three formats only):
1. *Plate* (hero): the real StaffXP dashboard, grayscale + navy multiply, with a second full-colour layer that fades in
   with scroll progress ("develops"). Crop marks (hairline L-corners) at the four corners; this is also the page's
   quiet X motif (the four marks point at an implied X).
2. *Crop* (feature, story): `clip-path: inset()` windows onto the real screens; the window animates to full frame on
   entry; hover / focus on a region draws a yellow highlighter box (regions come from `selectedWork.*.hotspots/areas`).
3. *Figure caption*: every image has `Fig. NN · Subject · Sample data` in mono plus any honesty label.
No stock photography, no portraits, no generated "photos". Abstract art drawn by code is allowed and must be labelled
`Illustrative` in its caption. The 3D X sculpture is **not built** (optional in the brief; no WebGL in this concept).

## 5. Signature visual and motion

**Hero signature, the corrected cover.** The five lines read `THE / ENGINEERS / BEHIND / DIGITAL / PRODUCTS.` On load
the line `ENGINEERS` is shown in draft state: the word `PEOPLE` is struck through in navy and `ENGINEERS` is inserted
above it with a caret. Sequence (≈2.4 s, once): words enter from different directions behind `clip-path` line masks;
hairline rules draw; the strike draws through `PEOPLE`, `ENGINEERS` settles and a yellow highlighter sweeps under it;
metadata (`XIONTECHS / EDITION 01`, `AI · ENGINEERING · PRODUCT · CLOUD`, `2026`) fades in; the image plate reveals with
a slow inset clip and begins to "develop". `PEOPLE` is the only struck word in the hero and is not a claim.

**Page signature, the pass.** Every section headline carries an optional edit in `content.js`
(`{ strike: 'word', insert: 'word' }`). Each section starts in `data-pass="draft"` and moves to `"clean"` exactly once
when ≥55% of its heading is in view: strike draws (scaleX, 280 ms), the insert rises, the highlighter sweeps
(`background-size` 0 to 100%, 520 ms), the oversized folio number in the margin swaps `01 → 02 → …`. The state never
reverts on scroll back. State machine is a pure module `pass/states.js` (tested). The struck words are limited to a
short list in `content.js` and must be neutral wordplay (never a claim about the company, a number or a client).
**Sign-off:** the final section's headline lines assemble into `GET IT DONE.`, a navy stamp-style rule draws and the
yellow rule extends under the phrase. This is the brief's optional "wow moment".

**Feature (StaffXP).** Navy band. Sticky left column with the oversized `01`, the title and the chapter index; right
column scrolls three chapters: `The problem`, `The system`, `The result` (brief labels). Chapter bodies per §8. Active
chapter is tracked by IntersectionObserver (no scroll-jacking); the plate on the right swaps crop / highlighted regions
per chapter. Below 1024 px: no sticky, chapters stack with their own crop. Hover / focus a region label draws its
highlighter box on the screen.

**Story (ESS).** A sticky viewport with a translated track pans the wide real screen horizontally while six numbered
areas are listed beside it (`overflow-x: clip` on the viewport, never `hidden`). Below 1024 px: a native horizontally
scrollable frame with the hint `selectedWork.ess.scrollHint` and the areas as a list. Sidebar `An agent at work,
Illustrative`: the six `hero.system` labels typeset as a sequence; no workflow engine, no numbers.

**Index.** Five rows; each is a `button` (`aria-expanded`) with a yellow chip number, title, and a one-line
descriptor; expanding grows the row in place and draws a rule. Hover and focus behave the same.

**Dispatches.** Desktop: a horizontal strip (sticky viewport, translated track) of three typeset articles; mobile:
stacked. Each carries kicker, headline, standfirst, two short paragraphs, all `DRAFT`.

**Contributors.** Four roles (`ENGINEERS`, `DESIGNERS`, `PRODUCT`, `AI`) set at poster size; hovering / focusing one
shifts the others to mute and shows the verified fact line next to it only where a fact exists (see §8).

**Editorial cursor (tier 2, optional).** On the two feature plates only, `(hover: hover) and (pointer: fine)`, an
additive label `VIEW` / `OPEN` follows the pointer; the native cursor stays, it is hidden for keyboard use and
reduced motion.

**Not built, on purpose.** Camera-flash transition (brief: optional, "do not overuse"; also a flash-safety risk, WCAG
2.3.1); 3D sculpture; any audio; scroll-jacking; a page-length canvas.

**Fallback ladder (brief 00 levels).** Level 0: type is the content, so the cover headline is plain text from first
paint; the plate sits in a `pf-bg2` box of fixed aspect ratio with a mono caption `[ plate loading ]`; no-JS shows
`<noscript>` copy with the contact email. Level 1 (reduced motion or no JS): every section in `clean` state, highlighters
static, plates at full colour, no sticky stages, nothing hidden. Level 2: the pass, reveals, crop animations. Level 3:
sticky feature / story / dispatches, editorial cursor. A `Pause Motion` button (header) sets `data-motion="paused"` on
`<html>`; it stops loops and sticky choreography. No loop longer than five seconds without it.

## 6. Stack decision

No new dependencies and no WebGL, so no `three` chunk for this page. CSS for hover, transforms, masks and reveals;
IntersectionObserver for once-only triggers; one rAF scroll hook writing CSS custom properties; plain `position:
sticky`. Framer Motion and GSAP from the brief's menu are not needed (no layout animation, no pinned timelines beyond
sticky). Bundle budget: concept entry (cover + chrome) ≤ 30 kB gzip, everything below the cover in one lazy chunk.
Fonts: one Google Fonts request (`display=swap`), `font-optical-sizing: auto`.

## 7. Component architecture

```
concepts/edition-v2/index.html            tailwind.edition-v2.config.js
public/concepts/edition-v2/               (logo-reversed.png)
src/concepts/edition-v2/
  main.jsx App.jsx BelowFold.jsx edition.css content.js content.test.js
  pass/        states.js states.test.js usePass.js             pure state machine + hook
  hooks/       useInView useReducedMotion useScrollProgress useMedia
  state/       motion.js                                       pause store -> data-motion on <html>
  ui/          Strike Insert Highlight Folio Figure CropMarks Rule Chip Button DraftMark Reveal
  chrome/      Header ContentsMenu EdgeMarker Colophon
  cover/       Cover Plate
  manifesto/   feature/   story/   index/   dispatches/   contributors/   signoff/
```
Names: `pf-*` tokens, `pf-` CSS classes, route `/concepts/edition-v2/`. Add `edition-v2` to `vite.config.js`
`rollupOptions.input`. The main `tailwind.config.js` already excludes `src/concepts/**`, so nothing to add there.
`index.html` carries
`<meta name="robots" content="noindex">` like the other concepts.

## 8. Content and honesty map

- Brief copy (headline, metadata, manifesto, capability titles, nav, CTA lines, role names) is `BRIEF`.
- Real facts are imported from `src/content/site.js`, never copied: StaffXP and ESS descriptors, `hotspots`, `areas`,
  screenshot `src`/`alt`/dimensions, `hero.system` labels, `solutions` and `engineering` descriptors for the index,
  `team.facts` (25+ years of leadership experience, 3 offices), `contact`, `company.logo`.
- **StaffXP chapters.** `The problem`: DRAFT paraphrase of the verified descriptor (activities, notices, wellbeing,
  tasks and operational information spread across tools; no claim about how bad it was). `The system`: the visible
  regions, labelled exactly as `hotspots` do. `The result`: the full real screen plus a dashed chip
  `Outcome: pending confirmation`. No metrics, no client name, no technology claim (`React`, `.NET`, `MySQL`, `AI
  services` from the brief are **not confirmed** and must not appear on a StaffXP plate; `content.test.js` fails if they
  do).
- **ESS.** Verified descriptor and the six `areas`; same dashed chip for outcome.
- **Index descriptors.** Product engineering: product engineering, custom application development. AI systems: agents
  that understand requests, decide, use tools, hand off exceptions. Cloud: Azure, AWS, GCP, cloud and APIs. Platform:
  enterprise platforms, CRM and operations, internal tools, workflow systems. Team augmentation: dedicated
  engineering capacity. Wording from `solutions` / `engineering` (LIVE / PLAN), unchanged where possible.
- **Dispatches (DRAFT wording, flagged).** Built only from existing material: (1) AI where it helps, agents stop at the
  steps you mark for approval (FAQ, whyUs); (2) integration first, connect new systems to what the business already
  uses (whyUs, FAQ); (3) start with one workflow or one increment, then grow (team body, FAQ). No dates, bylines,
  reading times, issue numbers or article counts. `DraftMark` shows in dev and with `?review`, per `CLAUDE.md`.
- **Contributors.** Roles from the brief; the only facts are `team.facts`. No portraits, no names, no quotes. Real
  photography is an open item for the team (`content/TODO.md`).
- `EDITION 01`, `2026` and `Fig. NN` are page furniture. Any number on the page is either imported, a folio, or
  measured from the page. `REV` may show the real commit count (`__BUILD_NUMBER__`).
- Every illustrative or pending value is labelled in text on the page, with a dashed outline as a second signal
  (never colour or line style alone).

## 9. Accessibility and quality rules

WCAG AA for every token pair (a vitest test computes them, including `pf-bg2` and the navy band). One `h1` (cover), one
`h2` per section, `h3` below. `<del aria-hidden="true">` for struck words and a real `<ins>` for the inserted word, so
screen readers read only the final copy. Every interaction is a `button` with `aria-expanded` / `aria-pressed`; hover is
never the only path; visible focus ring (2 px navy on paper, 2 px yellow on navy); targets ≥ 24 px. Decorative SVG
`aria-hidden`; each screenshot has the `alt` from `site.js`. Skip link. Reduced motion shows the final state with no
information lost. Mobile: no horizontal overflow at 360 px; the cover headline must not break mid-word at 360 px (test
`ENGINEERS` width at the minimum `clamp` size). Explicit `width`/`height` on every image (no CLS). Vercel
`web-design-guidelines` run as a QA layer *after* the build, never as the art direction.

## 10. Section contract (for anyone adding or changing a section)

- **Ownership.** The lead owns `content.js`, `edition.css`, `ui/`, `pass/`, `hooks/`, `state/`, `chrome/`, `App.jsx`,
  `BelowFold.jsx`. A section folder is owned by its author; extra strings go in `<folder>/copy.js` with a source tag
  per value; extra CSS in `<folder>/*.css` as plain CSS (no `@tailwind`).
- **Shape.** One default-exported component per section, no props, rendering `<section id data-band aria-labelledby>`
  with a `Folio` and an `h2` that uses the pass primitives. Do not import from `src/components`, `src/workflow` or other
  `src/concepts/*`.
- **Layout.** 12-column asymmetric grid, hairlines, square corners. Do not repeat the previous section's composition.
- **Colour.** Tokens only (`text-pf-*`, `bg-pf-*`, `border-pf-*`). Yellow is never text on paper.
- **Motion.** Trigger once, stop off screen, final state under reduced motion, no `setState` per frame.
- **Honesty.** No invented numbers, clients, quotes, bylines, outcomes. DRAFT is for wording, never for a fact.
- **Tests.** Pure logic in `.js` with a vitest `*.test.js` beside it.

## 11. Acceptance checklist

New hero, nav, IA, content hierarchy, case-study treatment, motion language, effect strategy and CTA treatment (brief
00 "definition of done"), recognisable XionTechs branding (logo, navy, yellow, X, GET IT DONE). Plus: AA contrast
test green; keyboard path through nav, contents menu, chapters, index, dispatches, contributors; reduced motion shows
final states; no `three` request on this page; no horizontal overflow at 360 / 390 / 768 / 1024 / 1440; screenshots
reviewed at those widths; axe-core 0 violations; `npm test`, `npm run lint`, `npm run build` green; the main page's CSS
size unchanged (concept Tailwind config does not leak).

## 12. Implementation order (for the next model)

Work in this order. Each step ends with `npm test` + `npm run lint` passing; commit per step, as the configured git
user (see `CLAUDE.md` "Working conventions"), conventional messages like `feat(edition-v2): ...`.

1. **Scaffold.** `concepts/edition-v2/index.html` (fonts link: Newsreader `ital,opsz,wght@0,6..72,200..800;1,6..72,200..800`,
   Schibsted Grotesk `wght@400..800`, DM Mono `400;500`; verify the CSS2 URL returns 200 and the axes exist, adjust if
   not), `main.jsx`, `edition.css` with tokens and `@config`, `tailwind.edition-v2.config.js`, `vite.config.js` input,
   `public/concepts/edition-v2/logo-reversed.png`, `<noscript>`.
2. **Lead pieces.** `content.js` with source tags, `pass/states.js` + test, hooks, `state/motion.js`, `ui/*`,
   `chrome/*`, token AA test, `content.test.js` honesty guard.
3. **Cover.** headline sequence, plate with develop, crop marks, metadata, Level 0 states.
4. **Manifesto**, then **Feature (StaffXP)**, **Story (ESS)**.
5. **Index**, **Dispatches**, **Contributors**, **Sign-off + colophon**. Steps 4 and 5 may run as parallel agents on
   disjoint folders; agree the `Folio`/`Strike`/`Highlight` API first (step 2).
6. **QA.** headless Edge from PowerShell with `puppeteer-core` at the five widths, screenshots reviewed, axe-core,
   reduced-motion run, network log (no `three`), overflow script that scrolls the whole page first. Then Vercel
   `web-design-guidelines` review.
7. **Docs.** Add a "Concept 03 v2" bullet to the concept-pages section of `CLAUDE.md`, a "Concept 03 v2" section to
   `content/TODO.md` (portraits, real engineering stories, outcome metrics, publish permission), `PROMPT_LOG.md`
   entry with where the AI got it wrong, and an "As built" section here recording every deviation from this plan.

Environment reminders: Windows Git Bash has no `lsof` (use `netstat -ano | grep ":5173" | grep LISTENING` then
`taskkill //F //PID <pid>`); stop old dev servers before starting one (stale ports 5174+ serve old CSS); if Vite reports
a missing export after a big rewrite, restart it; headless Edge must be launched from PowerShell, not Git Bash.

## 13. Decisions taken and open questions

Taken (2026-10-04, Danh): base is `feat/concept-03-edition`; v2 is standalone and designed from zero; the workflow
stops after this plan is committed so implementation can run on a different model. Defaults assumed, change if wrong:
local commits only, no push (same as the other concepts); imagery is typography + the real sanitized screenshots +
code-drawn abstract art labelled Illustrative; Dispatches stay on the page as DRAFT wording.

Open for the team: (1) is "People" allowed to stay typographic until real photos are approved? (2) may the StaffXP
chapter text name the project as "Education / staff experience" (already on the live-sourced descriptor)? (3) keep the
`PEOPLE → ENGINEERS` correction in the cover, or would the team rather not show an edit on the very first screen?

## 14. As built: where the build differs from the plan

- **Struck words leave by default.** With display leading at 0.9 there is no room above a word inside a multi-line
  headline, so the proofreader's note collided with the line above. After the strike the old word now fades out; it
  stays as a small note only where the layout has free space above it (`keep` in `content.js`: the cover on every
  width, the manifesto from 1024 px).
- **No `<ins>`.** The final word is a plain `span`, the struck word a `del aria-hidden`. Screen readers read only the
  final copy without an "insertion" announcement.
- **Dispatches are three broadsheet columns**, not a horizontal strip. Three short pieces fit one desktop viewport, so
  a second pinned horizontal run (ESS already has one) added nothing. The lead column is wider and starts higher.
- **Feature figures do not swap.** Each StaffXP chapter carries its own figure and the pinned column only tracks the
  active chapter; the same markup serves mobile.
- **ESS pan** uses a container-query unit (`100cqw - 100%`) so the track ends flush at any size; the pinned run needs
  1024 x 640, otherwise the screen sits in a hand-scrolled frame with the hint.
- **Editorial cursor (tier 2) not built.** Edge marker shows from 1560 px (below that it would sit on the content).
- **Pause Motion** has no loop to stop (the page has none); it ends transitions and switches the pinned run and the
  plate to their final states, like reduced motion. On phones the button reads "Pause" (full name kept for assistive
  tech).
- **Files.** Hooks live in one `hooks/index.js`; primitives in `ui/primitives.jsx`; the contents menu is a
  `<dialog>` inside `chrome/Header.jsx`; the colophon is the footer of `signoff/Signoff.jsx`; scroll progress is a
  pure function in `pass/states.js`.
- **Measured.** Entry JS 6.7 kB gzip, lazy sections 4.8 kB, CSS 6.5 kB; no `three` request; the main page's CSS is
  unchanged (57.50 kB).
