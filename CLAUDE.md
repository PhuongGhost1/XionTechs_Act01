# XionTechs landing page rebuild — agent context

## What this is
Rebuild of https://xiontechs.com/ for the internal AI build challenge. Team of 3,
git history must show all three contributing, AI must do substantial work.

## Challenge rules that constrain every change
- No Lorem Ipsum, no invented testimonials/stats. Anything not verified real must be
  wrapped and clearly labeled as a placeholder (see `src/content/site.js` and
  `content/TODO.md`), never presented as if real.
- Start clean — do not reuse the current site's theme/visual identity. This rebuild
  has three logo-derived themes — Classic Navy (default light), Midnight (dark),
  Aurum (warm light) — driven by CSS variables in `src/index.css` and a registry in
  `src/theme/themes.js`. Never hardcode a hex colour in a component; use the Tailwind
  token names (`paper surface ink muted line primary primaryHover primarySoft primaryInk
  accent navy navyInk navyAccent`). `text-primary` resolves to a foreground-safe colour
  (`--primary-fg`); inside `bg-navy` sections use `text-navyAccent` for accent text.
- Deliverables required at hand-in: public deploy URL, this git repo with full
  history, this file (context sharing), and `PROMPT_LOG.md` (prompts/decisions,
  including where the AI got it wrong).

## Stack
Vite + React + Tailwind CSS. No backend, no CMS — content lives in
`src/content/site.js` as plain JS objects so it's easy to diff and easy for
non-engineers on the team to edit.

## Content rules
All copy in `src/content/site.js` is either:
1. Sourced from the live xiontechs.com site (captured 2026-09-22), or
2. Explicitly marked `PLACEHOLDER` in a comment and/or in the value itself.

Never delete a `PLACEHOLDER` marker without replacing it with verified real content.
If you add a new section, follow the same pattern.

## Known placeholders still open (see `content/TODO.md` for the live list)
- Real client testimonials (the original site's testimonials are unedited
  WordPress theme-demo content, not real clients — do not port them over)
- Case study details (metrics, client names)
- Hero copy, both AI pillars, roadmap framing, CTA band (all redesign copy pending sign-off)

## Environment gotchas
- This runs on Windows Git Bash — `lsof` is not available. To free port 5173 (or kill
  a stray dev server), use `netstat -ano | grep ":5173" | grep LISTENING` to find the
  PID, then `taskkill //F //PID <pid>`. A `lsof -ti:PORT | xargs kill` one-liner will
  silently no-op here and leave a stale server running.
- If a dynamic icon-by-name lookup is ever needed again, keep using an explicit
  `iconMap` of named imports (see `src/components/icons.js`) — `import * as icons
  from 'lucide-react'` pulls the whole library into the bundle (1MB+).
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
