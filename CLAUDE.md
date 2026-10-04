# XionTechs landing page rebuild — agent context

## What this is
Rebuild of https://xiontechs.com/ for the internal AI build challenge. Team of 3,
git history must show all three contributing, AI must do substantial work.

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
- Design explorations from `docs/idea/0n-*.md` live as separate Vite pages, so the main page is untouched. Concept 01 (X / Command, v3 zero-state rebuild on `feat/concept-01-command-v3`): plan in `docs/concepts/01-command-v3-plan.md` (the earlier build lives only in git history of `feat/concept-01-command`; do not copy from it), code in `src/concepts/command/` (folders per section, shared `ui/`, `state/`, `hooks/`, all copy in `content.js` with source tags), its own Tailwind config `tailwind.command.config.js` (loaded by `command.css` with `@config`; the main config excludes `src/concepts`). Concept tokens are `x-*`; WebGL only in the hero (`scene/`), the finale is a 2D canvas fed by `finale/logoPoints.js` (regenerate with `node scripts/make-logo-points.mjs` when the logo changes); `__BUILD_NUMBER__` is the git commit count injected by `vite.config.js`. Section 04 `agent` ("Watch an agent work", lazy chunk) is the main page's illustrative agent demo as an arm on a hex board: own isometric projection on a canvas 2D (`agent/iso.js`, `hexboard.js`, `ik.js`, pure poses in `plan.js` / `journeyPlan.js`, renderer `draw.js`, labels are HTML billboards placed by `labels.js`), driven by `src/workflow/useAgentDemo.js` (data and run logic imported, never copied); keep the "Illustrative scenario" chip, dashed capability tags and no digits in `content.js` `agent`. Open items: `content/TODO.md`, "Concept 01".
- The motion rule above (CSS 3D and SVG only, no WebGL) applies to the main page. A concept page may use `three`, but only in a lazy chunk, with a static fallback for reduced motion and no WebGL, and the same honesty rules (illustrative and pending values are labelled).
- QA: the built-in browser pane scales a 1280 px viewport too small to read; use headless Edge with `puppeteer-core` from PowerShell (Git Bash cannot launch it) and look at the screenshots.
