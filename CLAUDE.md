# XionTechs landing page rebuild — agent context

## What this is
Rebuild of https://xiontechs.com/ for the internal AI build challenge. Team of 3,
git history must show all three contributing, AI must do substantial work.

**2026-10-13 (`feat/promote-command-to-homepage`):** the X / Command design (originally
a concept at `/concepts/command/`, see "X / Command — now the homepage" in
`content/TODO.md`) is now the live homepage. The previous design described throughout
most of this file — plan v3, the light navy/gold page, Agent Demo, smart campus is
unchanged in content but has moved to `/concepts/command/` (same URL slug, swapped
content — see `PROMPT_LOG.md`). Concretely: `src/App.jsx`, `src/main.jsx`,
`src/index.css` and `src/components/` are now Command's; the previous design's
equivalents live at `src/concepts/command/App.jsx`, `main.jsx`, `index.css` and
`components/`. `tailwind.config.js` now styles the archived page at
`/concepts/command/`; `tailwind.command.config.js` now styles the homepage. Shared
infrastructure (`src/hooks/`, `src/content/site.js`, `src/workflow/`) did not move —
both designs still reach it via relative imports, just at different depths than
before. The rest of this file's "Page rhythm", "Working conventions" and "Motion"
sections describe the design now archived at `/concepts/command/`, not the homepage,
until they are rewritten for Command.

**2026-10-13, same branch:** the homepage has a 4-theme selector (2 dark, 2 light —
`THEMES` in `src/components/theme.js`; `ThemeSwitcher.jsx` in the header). Every color
is a `--c-*` custom property in `src/index.css`, switched by `<html data-theme="...">`;
never hardcode a color in a Command component, use the `cmd-*` Tailwind names so new UI
picks up all four themes automatically. The one exception: `scene/render.js` (X-Core)
and `campus/campusScene.js` (the 3D twin) read those tokens once via `getComputedStyle`
at WebGL scene creation and bake them into materials — any new WebGL/canvas drawing
needs the same `key={theme}`-forces-remount treatment already on `<XCoreCanvas>` and
`<CampusCanvas>`, or it will go stale on a theme switch.

## Challenge rules that constrain every change
- No Lorem Ipsum, no invented testimonials/stats. Anything not verified real must be
  wrapped and clearly labeled as a placeholder (see `src/content/site.js` and
  `content/TODO.md`), never presented as if real.
- Start clean — do not reuse the current site's theme/visual identity. The design follows
  `docs/idea/XionTechs_Landing_Page_Redesign_Plan_v3.md` (the team's brief): one brand
  palette from the logo (navy `#183860`, gold `#e5a52a`, warm white), no theme picker.
  Colours are CSS variables in `src/index.css`; a `data-tone="dark"` attribute on a
  section re-scopes the same tokens to the dark palette, so components inside need no
  colour changes. Never hardcode a hex colour in a component; use the Tailwind token names
  (`paper surface ink muted line primary primaryHover primarySoft primaryInk accent`).
  `text-primary` resolves to a foreground-safe colour (`--primary-fg`).
- Page rhythm (plan §17): light hero and solutions, dark AI Agents, light Selected Work
  (StaffXP on a dark canvas, ESS light), engineering strip, light How We Work, dark Why
  XionTechs, light FAQ, dark closing CTA and footer. Serif (`font-display`) only for h1/h2
  and strategic headlines; UI and card text stay sans.
- Deliverables required at hand-in: public deploy URL, this git repo with full
  history, this file (context sharing), and `PROMPT_LOG.md` (prompts/decisions,
  including where the AI got it wrong).

## Stack
Vite + React + Tailwind CSS. No backend, no CMS — content lives in
`src/content/site.js` as plain JS objects so it's easy to diff and easy for
non-engineers on the team to edit.

## Content rules
Every value in `src/content/site.js` carries its source in a comment:
1. `LIVE`: the live xiontechs.com site (captured 2026-09-22).
2. `PLAN §n`: the team's redesign brief in `docs/idea/` (team-authored, so it counts as a
   source, not as AI invention).
3. `DRAFT`: written for the redesign from LIVE/PLAN material, pending sign-off. Flag the
   object `draft: true`; `DraftMark` (`src/components/ui.jsx`) shows a "Draft" marker in
   `npm run dev` and on any build opened with `?review`. Plan §21 asks for no development
   labels in production, so production visitors see draft copy unmarked; never use DRAFT
   for a fact (a number, a client, an outcome, a capability nobody confirmed).
4. `ILLUSTRATIVE` / `PLACEHOLDER`: not real. Always labelled on the page for every visitor
   (the demo badge, "Screenshot pending privacy review", "Illustrative" proof chip).

Never delete a `PLACEHOLDER`/`ILLUSTRATIVE` label without replacing it with verified real
content. If you add a new section, follow the same pattern.

## Known placeholders still open (see `content/TODO.md` for the live list)
- Real client testimonials (the original site's testimonials are unedited
  WordPress theme-demo content, not real clients — do not port them over)
- Case study details (metrics, client names)
- StaffXP and ESS screenshots (sanitized, approved) and permission to name both products
- DRAFT copy: AI callouts, team body, FAQ answers; `.NET` / `React` in the engineering strip

## Environment gotchas
- Parallel agents in git worktrees (`.claude/worktrees/`): a worktree can start from an older
  commit, so reset it to the intended base first. If you link `node_modules` into a worktree
  as a junction, remove the junction (`cmd //c rmdir <worktree>\node_modules`) before
  `git worktree remove`, or the real `node_modules` can be deleted. Remove merged worktrees:
  their `dist/` folders otherwise show up in lint.
- This runs on Windows Git Bash — `lsof` is not available. To free port 5173 (or kill
  a stray dev server), use `netstat -ano | grep ":5173" | grep LISTENING` to find the
  PID, then `taskkill //F //PID <pid>`. A `lsof -ti:PORT | xargs kill` one-liner will
  silently no-op here and leave a stale server running.
- If a dynamic icon-by-name lookup is ever needed again, keep using an explicit
  `iconMap` of named imports (see `src/components/icons.js`) — `import * as icons
  from 'lucide-react'` pulls the whole library into the bundle (1MB+).
- If Vite's dev server keeps reporting a missing export after a file was rewritten in one
  go, the module graph cached the half-written file: restart `npm run dev`.
- Always stop a running `npm run dev` (Ctrl+C) before starting another — if the
  default port 5173 is taken, Vite silently starts on 5174/5175/etc. instead of
  failing, so stale servers pile up on incrementing ports and keep serving old CSS/JS
  after you've edited files (this happened once: a stale server on 5174 was still
  serving the pre-navy-theme green build). Check `netstat -ano | grep LISTENING` for
  ports 5173+ if a running site ever looks out of date.

## Working conventions
- Keep components in `src/components/`, one section per file, composed in `src/App.jsx`.
- Prefer editing `src/content/site.js` over hardcoding copy inside components.
- Commit as yourself (not as "Claude" or a shared bot account) — the challenge scores
  on git history showing all three teammates actually working.
- Log meaningful prompts/decisions (including AI mistakes and corrections) in
  `PROMPT_LOG.md` as you go, not retroactively at the end.
- Agent-demo workflows (`workflows` in `site.js`) and the monitoring `runLog` are
  invented and must stay flagged illustrative. Agent capability labels are
  placeholders until the team confirms the real Azure services. No digits in
  workflow or run-log text; node titles ≤ 26 characters; nodes must fit the
  760 × 520 canvas without overlapping (`npm test` enforces all of this).
- Workflow run logic lives in `src/workflow/run.js` (pure, tested); components only
  render its output.
- The agent demo has two views: the workflow graph and "Agent at work" (`agentJourneys` in
  `site.js`, pure logic in `src/workflow/journey.js`). Journeys are illustrative; the agent
  pill always reads "XionTechs agent" — never another vendor's product or model name — and no
  token counts or other numbers are shown.
- Run `npm test` alongside `npm run lint` and `npm run build` before committing.
- Each workflow has one `decision` (the step that waits for the visitor's Approve/Reject) and
  two `drills` (predefined problems). Paths through the decision node end at it; outcomes come
  from `decision.approve` / `decision.reject`. A repeated step in a path is a retry. Edges may
  carry `{ via: x }` to route around a skipped card. All of it is illustrative and tested in
  `src/content/site.test.js`.
- The Agent Demo opens in its basic state (one scenario, workflow view, play/pause, the
  approval moment, a small execution log); scenarios, Agent at work, drills, path replay and
  the run log sit behind "Explore What Happens Next", which appears only after the visitor's
  first decision or a finished run (MOTION §10). Don't move advanced controls back into the
  default view. Run phases live in `src/workflow/phase.js`, status and log words in
  `src/workflow/log.js` (both pure and tested); a retry drill needs a one-word `fault`.
- Selected Work (`selectedWork` in `site.js`) tells two real product stories, StaffXP and ESS,
  with the Agent Demo as the third proof point. Never add an invented third case study.
  The screenshots in `public/work/` are the team's, sanitized before commit (see PROMPT_LOG,
  2026-10-02 - 3D / motion redesign). Any new screenshot must be sanitized the same way first:
  crop browser chrome; replace people's names, IDs, class codes and client/school names with
  sample values; never commit the original. StaffXP `hotspots` and ESS `regions`/`marker` are %
  boxes measured on those images (geometry tested in `StoryMotion.test.js`, files in
  `site.test.js`). `ProductFrame` with `src: null` shows a neutral pending placeholder.
- Motion (MOTION brief): CSS 3D and SVG only, no WebGL and no motion library. 3D depth stays in
  the hero and the AI section (small depth in StaffXP and the closing CTA). Use the tokens in
  `src/index.css` (`--dur-*`, `--ease-brand`, `--ease-spring`, `danger`/`success` colours,
  `shadow-depth-*`, `perspective-*`, `preserve-3d`), the hooks in `src/hooks/` (`useInView`,
  `useReducedMotion`, `useScrollProgress`, `usePointer`; scroll/pointer callbacks write CSS
  variables, never React state per frame) and `Reveal` from `ui.jsx`. Every effect must be one
  of MOTION §31 A-J, trigger once unless deliberately scroll-linked, stop off screen, and show
  its final state under reduced motion with no information lost. Loops longer than five
  seconds need a pause control. Section motion logic lives in pure, tested modules
  (`HeroSystemLayout.js`, `SolutionsMotion.js`, `StoryMotion.js`, `ProcessProgress.js`).
- Bundle: the main JS chunk budget is 71 kB gzip. Selected Work through Contact load as one
  lazy chunk (`BelowFold.jsx`); it fires `SECTIONS_READY` so the nav rebuilds its active-section
  observer, and `sectionsReady.js` handles a `#fragment` that targets a section not yet loaded.
  New below-the-fold sections go inside `BelowFold`.
- Links that lead to the demo call `loadAgentDemo` on hover/focus so the lazy chunk preloads.
- The team installed Vercel's agent skills in `.agents/skills/`. `web-design-guidelines` and
  `writing-guidelines` fetch their rules from GitHub; new UI and copy follow them (Title Case
  buttons and nav, sentence-case headings, `…` and curly quotes, no `transition: all`,
  reduced-motion variants, explicit image sizes, no em dashes in new body copy).


## Concept pages (`/concepts/<name>/`)
- Design explorations from `docs/idea/0n-*.md` live as separate Vite pages, so the main page is untouched.
  As of `feat/promote-command-to-homepage` (2026-10-13), `/concepts/command/` holds the *previous* main
  design (plan v3, archived, `noindex`'d) rather than the X / Command concept — Command was promoted to the
  homepage instead. Its code lives at `src/concepts/command/` (own `App.jsx`, `main.jsx`, `index.css`,
  `components/`); its Tailwind config is now `tailwind.config.js` (the file name is a holdover from when it
  styled the main page — still correct, just not renamed). Open items: `content/TODO.md`, "X / Command — now
  the homepage".
- The motion rule above (CSS 3D and SVG only, no WebGL) applies to the main page. A concept page may use `three`, but only in a lazy chunk, with a static fallback for reduced motion and no WebGL, and the same honesty rules (illustrative and pending values are labelled).
- Concept 01 section 05 is the **smart campus**. As of `feat/promote-command-to-homepage`
  (2026-10-13) it lives at `src/components/campus/` (Command's own, not the concept's — it moved
  with the rest of Command's source when Command became the homepage). It replaced the flight
  plan, and — since 2026-10-13 — the Selected Work "Smart school campus" card (`src/components/content.js`
  `deployments.records`, id `campus`) also points to it directly (`href: '#campus'`, a same-page
  anchor), not to a standalone Agent Demo section: that section only still exists on the archived
  page at `/concepts/command/`. Content in `src/components/campusData.js`: the campus is
  ILLUSTRATIVE, the service list PLACEHOLDER until the team confirms it, and both badges stay visible. Content
  text has no digits; every number comes from `campus/simulate.js` (pure, deterministic) and sits under a
  "Simulated" tag. Classroom engagement analytics is anonymous and class-level only: shares of the class, no
  per-seat or per-student state, no faces or names, abstract camera-wall feeds (tests in
  `campus/campusData.test.js` and `campus/simulate.test.js`). Adding a service or room is content only: a device
  kind in `deviceKinds`, a room that lists it, `slice: true` on the service. `three` is only imported by
  `campus/campusScene.js` (lazy chunk); the SVG site plan is the fallback. Camera "feeds" (room panel, security
  room wall) are renders of the 3D model from each camera pin (`registerFeed`), styled as CCTV and tagged
  "Simulated feed"; never use stock or generated footage of people, children above all.
- The campus applies IoT platform best practices taken from the ThingsBoard documentation: assets with codes,
  devices named `<room code>-<profile code>` with telemetry keys, alarm rules with severities in `campusData.js`
  `alarmRules`, alarms replayed by `campus/alarms.js` (pure), rule chains in the room panel. ThingsBoard is a
  reference only: the team decided (2026-10-06) never to name it, or any other platform vendor, on the page
  (`campusData.test.js` enforces it for the campus copy). Keep the generic vocabulary.
- QA: the built-in browser pane scales a 1280 px viewport too small to read; use headless Edge with `puppeteer-core` from PowerShell (Git Bash cannot launch it) and look at the screenshots.
  Take them with `page.screenshot({ captureBeyondViewport: false })`: an element screenshot, or a clip, resizes
  the page, SwiftShader then loses the WebGL context and the 3D sections fall back to their flat drawing.
