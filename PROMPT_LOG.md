# Prompt & decision log

Format: date, who, what was asked/decided, and (where relevant) where the AI got it
wrong and how it was caught. Keep entries short; add to this as the project goes, not
just at the end.

## 2026-09-22 — initial scaffold (Bang Do + Claude)
- Prompt: asked Claude to generate an initial React project rebuilding
  xiontechs.com "from scratch", looking/feeling different from the current site,
  starting from a URL + no source access.
- Claude fetched the live site content via a summarizing tool first. That summary
  reported four client testimonials as if they were real people. When asked "where
  did you find that", Claude re-fetched the raw HTML directly and confirmed the
  testimonial block does exist in the markup, but the image filenames
  (`testi_2_1.png`, `testi_2_3.png`) and a title like "CTO of Portfolio" show it's
  unedited WordPress/Elementor theme-demo content, not verified real clients.
  **Lesson: don't trust a single AI-summarized fetch for content that has to be
  "real or clearly placeholder" — verify against raw source before using it.**
- Decision: dropped those names entirely rather than porting them over; testimonials
  section ships empty with a visible "[PLACEHOLDER]" state until the team supplies
  real quotes.
- Decision: stack = Vite + React + Tailwind (team choice, confirmed over Next.js —
  no need for SSR/routing for a single-page site).
- Decision: design direction = clean minimal light (team choice, confirmed over dark
  tech / colorful-energetic options), explicitly to avoid reusing the current site's
  blue/white corporate WordPress theme.
- Real copy (services list, 4-D process, office addresses, phone numbers, nav
  structure) was extracted from the live site and used directly; unverifiable items
  (case study metrics, contact email, social URLs) were left as marked placeholders
  — see `content/TODO.md`.

## 2026-09-22 — full homepage screenshots (Bang Do + Claude)
- User supplied full-page screenshots of the actual rendered xiontechs.com homepage
  (top to footer). These revealed the earlier automated fetch had under-extracted
  significantly — real service descriptions, the "Who We Are" section with bullets
  and a stats badge, a promo banner, a "Why Choose Us" accordion, a CTA/banner
  section, and full FAQ/footer copy were all missing from the first pass.
  **Lesson: a single automated fetch of a JS-heavy WordPress/Elementor site can miss
  or truncate whole sections — real screenshots from the user were the more reliable
  source once available.**
- Confirmed from the screenshots: the homepage does NOT render a testimonials section
  at all, validating the earlier decision to drop the theme-demo testimonial names
  rather than treat them as real.
- Cross-checked the raw HTML again and found the "case study" project cards link to
  `wordpress.themeholy.com/webteck/project-details` — the WordPress theme vendor's own
  demo site. Confirms those three case studies are also unedited template placeholder
  content, not real XionTechs projects. Kept them marked PLACEHOLDER rather than
  treating the titles as verified real work.
- Confirmed real contact email (`contact@xiontechs.com`) and real social URLs
  (facebook.com/xiontechs, linkedin.com/company/xiontechs) from the raw HTML/rendered
  page — these were placeholders in the first pass and are now resolved.
- User provided the real logo file (`XionTechs-Logo_s.png`), now wired into the Nav
  and Footer components in place of the text wordmark.
- Rewrote `src/content/site.js` and added `WhoWeAre.jsx` and `CTA.jsx` components to
  cover the sections the first pass missed. Two items remain genuinely unresolved
  (not visible in any screenshot, since the accordions were collapsed): the body copy
  for 2 of 3 "Why Choose Us" items, and the answers to 2 of 3 FAQ questions — still
  marked PLACEHOLDER pending real copy.

## 2026-09-22 — theme color + icon library (Bang Do + Claude)
- Prompt: switch the main theme color to a blue matching the logo, and add icons with
  hover animation across the site like the current xiontechs.com theme.
- Sampled the dominant color out of `public/XionTechs-Logo_s.png` directly (wrote a
  one-off pixel-counting script) instead of eyeballing a hex value — got `#183860`,
  the exact navy used in the wordmark. Set that as `accent` in `tailwind.config.js`,
  with a darker `navy` for full-bleed dark sections and a light `accentSoft` tint.
  Replaced the earlier green accent everywhere.
- Added `lucide-react` for icons (services, process steps, stats, contact info, FAQ
  accordion, footer socials), with a shared `IconBadge` component providing a
  consistent hover animation (scale + slight rotate + color invert).
- **Mistake caught during verification**: initially wrote `import * as icons from
  'lucide-react'` in three components to look icons up by name dynamically. That
  defeats tree-shaking and pulled the ENTIRE icon library into the bundle — build
  output jumped from ~161KB to 1.2MB. Caught this by checking the `npm run build`
  output size after the change looked suspiciously large, not by assuming it was
  fine. Fixed by adding `src/components/icons.js` with explicit named imports and a
  manual lookup map; bundle dropped back to ~180KB.
  **Lesson: when a UI library needs dynamic icon-by-name lookup, always build an
  explicit map of named imports — never `import *` from a large icon package.**
- **Second mistake caught during verification**: after the dev-server smoke test kept
  showing the old green theme even after editing the Tailwind config, discovered this
  environment has no `lsof`, so the earlier "kill the dev server on this port" bash
  command had been silently failing all along — a stale Vite server from several
  turns back was still serving cached output. Fixed by finding the PID via `netstat`
  and killing it with Windows' `taskkill`, then re-verified with a fresh PID before
  trusting the screenshots.
  **Lesson: on Windows/Git Bash, `lsof` isn't available — use `netstat -ano` +
  `taskkill //F //PID` to free a port, and confirm the PID actually changed before
  trusting a "restarted" dev server's output.**
- lucide-react's current version ships no brand/social glyphs (no `Facebook`,
  `Linkedin` exports) — added a small hand-rolled `SocialIcon` component with simple
  outline marks in the same stroke style rather than pulling in another dependency.

## 2026-09-30 — redesign brainstorm + plan (Phuong Hoang + Claude)
- Brainstormed a bolder landing page for business decision-makers: 3 logo-derived
  themes, a "watch an agent work" section, a scripted chat guide with a swappable
  answer engine, and an Explore→Pilot→Production→Scale roadmap. Spec at
  `docs/superpowers/specs/2026-09-30-landing-redesign-design.md`, plan at
  `docs/superpowers/plans/2026-09-30-landing-redesign.md`.
- Claude proposed "AI Agentic Development" and "Smart Agent Platform (IoT)" pillars
  based on the user's description, then flagged that none of the captured site copy
  mentions them. Decision: ship them as clearly labeled placeholder copy.
- Bundle baseline before redesign: `index-*.js` 179.78 kB / **56.02 kB gzip**.
  Budget for the redesign: ≤ 71 kB gzip.
- Added Vitest (dev only) with a content-guard test that fails on any "lorem" string.
- Pre-existing ESLint configuration (from create-vite template) was failing with 27
  no-unused-vars errors on JSX component identifiers. Fixed by narrowing
  `argsIgnorePattern` to `^_` and keeping `varsIgnorePattern: '^[A-Z_]'` to ignore
  capitalised component/icon imports that are used in JSX but not visible to core ESLint.
- Agent demo: three invented scenarios (support, inventory, smart factory) rendered with
  an always-visible "Illustrative scenario — not a client case study" badge, and a test
  that fails if any outcome line contains a digit, so no invented metric can slip in.
- Chat guide: scripted, labeled "Guided assistant · answers from this site". Answers are
  built from `site.js` exports; `src/chat/answerEngine.js` is the only file to change if
  a real AI backend is added later. Keyword matching is word-bounded at both ends after
  the Task 10 review caught false positives: a test caught "ai" matching inside "email",
  and the review caught prefix-only matches ("air", "democracy").
- Where the plan itself was wrong (caught by per-task code review, fixed before moving on):
  contrast — Aurum gold used as text measured ~2:1 and the Classic Navy gold accent 3.46:1,
  so a foreground-safe `--primary-fg` token (via Tailwind `textColor.primary`) and a
  `--navy-accent` token for dark sections were added (Task 2); roadmap stages faded unlit
  cards to 0.55 opacity, dropping text to ~2.3:1, so the highlight now changes only
  border/background/shadow and the scroll threshold went 0.5 → 0.15 (Task 8); chat keyword
  matching was prefix-only ("air" hit the AI intent, "democracy" the demo intent), so
  matching is now word-bounded at both ends with simple inflections (Task 10); the chat
  panel's focus trap counted the disabled Send button, letting Tab escape while the input
  was empty, and the nudge timer could still fire after the panel had been opened — both
  fixed in `ChatGuide.jsx` (Task 11).
- Final bundle: **64.38 kB gzip** (baseline 56.02 kB + 8.36 kB for redesign). Browser checklist (controller, headless Edge via Playwright against `vite preview`): 74/74 automated checks passed — 3 themes at 1280/390 px, contrast samples, no theme flash, dark-preference default, picker persistence, demo play/switch/keyboard, reduced motion, chat chips/fallback/focus trap/Esc/scroll actions, anchors, one-time nudge. The final whole-branch review then caught cross-component issues the checklist missed (nav covering the mobile chat panel, navyInk/50 below AA in two themes, contact button 1.48:1 in the default theme, unlabeled draft copy in a chat answer) — fixed in the final fix wave. Remaining placeholders listed in `content/TODO.md`.

## 2026-10-01 — workflow graph round (Phuong Hoang + Claude)
- User reviewed sierra.ai and relevanceai.com/agents and observed the leading agent
  sites show agents as live workflow graphs rather than a chatbot. Decision: remove
  the "Ask XionTechs" chat guide entirely (recoverable from git history) and replace
  the linear agent-demo timeline with a branching workflow graph.
- Azure-first focus stated by team member Phuong Hoang on 2026-10-01. The captured
  live-site copy names "Azure, AWS, and GCP", so the Azure-first strip ships as
  PLACEHOLDER and node capability labels stay generic ("AI model", "Integration",
  "IoT gateway", "Data store") until the team confirms the actual Azure services.
- Relevance AI shows pass-rate percentages per node; we deliberately show run
  statuses in words only, because any number on our page would be invented.
- Built the workflow graph as hand-drawn SVG + positioned buttons from data in
  `site.js`, with pure run logic in `src/workflow/run.js` (no new dependencies;
  React Flow was rejected because it would exceed the bundle budget). Final bundle:
  65.60 kB gzip (budget 71 kB). Browser checklist: run by the controller
  after this commit.
- Browser checklist (controller, headless Edge via Playwright against `vite preview`) caught two bugs the per-task and whole-branch reviews missed: the completed outcome node rendered white-on-white (conflicting Tailwind colour classes on one element — the colour maths said it passed, the real browser showed it didn't), and the demo paused while on screen because the in-view threshold was a ratio of a section taller than the viewport. The final review also caught truncated node titles, connectors below 3:1, no Replay under reduced motion, and a run log with no pause. All fixed in the final fix wave; a unit test now guards against conflicting colour classes on workflow nodes.

## 2026-10-01 — "Agent at work" view (Phuong Hoang + Claude)
- User shared Relevance AI's "Cowork & Codex" animation (one agent travelling a stepped path,
  picking up files/skills, context ring compacting) and asked to build the same. Built as a
  second view behind a "Workflow | Agent at work" toggle, one journey per scenario tab, using
  the same tick timer as the graph (continuous animation rejected to avoid a second timing
  system).
- Deliberate differences from the reference: the pill says "XionTechs agent", not a competitor's
  product/model name; the context ring fills visually with no token counts (any number would be
  invented); under reduced motion a readable list replaces the moving window instead of a
  scaled-down path whose labels would be unreadable.
- Reviews caught what the plan got wrong: the first build drew the 'travelled' line straight to the next stop while the agent was still leaving the last one, and the agent cut diagonally across each step instead of following it; the status chip also covered the path risers, the compact row in the phone list announced compaction before it happened, and the context ring's compacting colour was nearly invisible in the Aurum theme. Fixed with a dash-offset travelled line, a split horizontal/vertical pill transition, wider stop spacing and colour changes. Browser checklist (controller, headless Edge): all theme × width and behaviour checks passed before and after the fix wave.

## 2026-10-01 — approver moment + failure drills (Phuong Hoang + Claude)
- Asked for ideas that go beyond what other agent sites already show. Chose "You're the
  approver" (the run stops and waits for the visitor's Approve/Reject — no timer, so the agent
  never decides for them) and "Throw a problem at it" (two predefined drills per scenario:
  retry, ask-first detour, cross-check, or escalation to the human step).
- Built as data-driven paths on the existing pure run logic rather than an event engine, so
  demos are predictable in front of clients.
- Planning corrections: the unclear-request drill skips the router (no room for an upward
  detour), escalation edges got a side-channel `via` so they don't run through the skipped
  card, and decision buttons got explicit, tested coordinates so they never cover a card.
- Bundle ruling: the main chunk reached the 71 kB gzip budget, so the demo section is now
  lazy-loaded in `App.jsx` (with a Suspense fallback that keeps the `#demo` anchor).
- Final review caught what the browser checklist (99/99 passing) missed: hidden-but-focusable duplicate Approve/Reject buttons in the desktop screen-reader list, no error boundary around the newly lazy-loaded demo (a failed chunk would blank the page), a drill menu that could run off a phone screen, and the Retry tag missing under reduced motion. All fixed in the final fix wave.

## 2026-10-02 - project showcase from the idea briefs (Danh Nguyen + Claude)
- Prompt: read the three project briefs in `docs/idea/`, review them, and if they hold up
  implement all three, one branch per project.
- Review outcome: the briefs describe showcase cards for the landing page, not three separate
  apps, and they are careful about claims (no client names, no metrics, `[VERIFY]` markers). The
  gap is that every brief is built around real product screenshots and none were supplied.
  Decision: build each card's visual as a coded UI mock-up with invented sample values, captioned
  "Illustrative UI with sample data - not a product screenshot", and tag the copy "Draft copy".
  Inventing a screenshot-looking image would have broken the "real or clearly labeled" rule.
- Decision: Dynamics 365 is named in the brief but flagged as needing confirmation, so the page
  says "Connected to existing enterprise systems" and the D365 tag from the brief's sketch was
  replaced by "Integration".
- Decision: branches are stacked (`feat/project-01-performance` -> `-02-crm` -> `-03-ai-agent`)
  rather than three siblings, because all three cards share one section component and one content
  array; sibling branches would each re-create that and conflict on merge.
- The new section takes over the `#work` anchor; the "case studies are being prepared" strip stays
  below it, since these cards are capability showcases, not signed-off client case studies.
- Project 01 (Performance Management Platform): goal-setting mock with stage tracker, goal rows
  and approve/reject actions; expandable detail with the four review stages.
- Project 02 (CRM & Customer Operations): customer-record mock with search, status pipeline,
  fields and activity. The brief's AI extension (agent summarising customer context) is marked
  conceptual there, so only its positioning line ("We build the platform - and we can add the
  agent.") is shown; no AI feature is drawn into the CRM mock.
- Project 03 (AI Agent Workflow Automation): the brief asks to keep real project and illustrative
  demo distinct and to use the real screenshot as source of truth. There is no real AI project
  evidence in the repo, so the card carries an explicit "Illustrative concept - not a delivered
  client project" badge, a static node-flow mock (deliberately lighter than the Agent Demo) and
  a "See an agent work" link to `#demo`. A test keeps the badge and link in place.


## 2026-10-02 - redesign plan v3 with the Vercel skills (Danh Nguyen + Claude)
- Prompt: the team installed Vercel's agent skills and wrote
  `docs/idea/XionTechs_Landing_Page_Redesign_Plan_v3.md`; redesign the landing page from it.
- The skills landed in `.agents/skills/` (installed with `npx skills`), which Claude Code does not
  load as skills, so their SKILL.md files were read directly. `web-design-guidelines` and
  `writing-guidelines` only point at rule files on GitHub; those were fetched and applied:
  Title Case buttons/nav, sentence-case headings, `…` and curly quotes, explicit image sizes,
  `prefers-reduced-motion` variants, autoplay motion under five seconds, no em dashes in new body
  copy. `vercel-react-best-practices` gave the hover/focus preload of the lazy demo chunk.
  `vercel-react-view-transitions` was not used: it needs React's `<ViewTransition>`, and the
  project is on React 18.
- Work was split into one commit per plan phase on `feat/redesign-v3`, branched from
  `feat/project-03-ai-agent` so the history shows the three-card attempt the plan replaces.
- **The plan assumed assets the repo does not have**: it says the StaffXP and ESS screenshots
  are "available now", but none were committed. Rather than invent screenshot-looking images,
  each product frame draws a shapes-only layout outline labelled "Screenshot pending privacy
  review" and switches to a real image when `src` is set. Searching the team's client repos for
  screenshots was ruled out: plan §19 says they need sanitizing and permission first.
- **Content governance changed on purpose** (plan §21: no development labels in production):
  copy now carries a source comment (LIVE, PLAN §n, DRAFT, ILLUSTRATIVE/PLACEHOLDER). DRAFT copy
  is marked only in dev and with `?review`; anything not real (demo scenarios, pending
  screenshots) is still labelled for every visitor. CLAUDE.md "Content rules" documents this.
- Where the plan's copy was adjusted: "See an AI agent work through a *real* business workflow"
  lost "real" because the scenarios are illustrative; "not just features" became "not only
  features" (filler word); the em dash in the hero intro became a comma.
- Removed the three-theme picker (plan phase 1). The old Midnight palette lives on as the
  `data-tone="dark"` token scope, so the demo's tested contrast carries into the dark sections.
- Verification: `npm test` (114), lint and build at every commit; main chunk 66.8 kB gzip plus
  the 10.5 kB lazy demo chunk (budget 71 kB). Browser pass at 1280 px and 375 px: no horizontal
  overflow, demo approve flow and Explore Further work, no console errors. Mistakes caught on
  the way: the OG image's logo rendered stretched (flex child) until it got a fixed size; a test
  rewrite briefly left half of an old test behind and wrote a backspace character instead of
  `\b` into a regex; Vite's dev server cached a half-written module and needed a restart.

## 2026-10-02 - 3D / motion redesign (Danh Nguyen + Claude)
- Prompt: a new branch implementing `docs/idea/XionTechs_Landing_Page_3D_Motion_Automation_Plan.md`
  (3D, animation, motion, effects), plus three real screenshots supplied in chat: StaffXP sign-in,
  StaffXP dashboard and the ESS portal. Branch `feat/motion-3d`, stacked on `feat/redesign-v3`.
- **Screenshots were sanitized before anything was committed.** They showed a dev Azure URL and
  the user's browser profile, a teacher's first name, two students' names, class codes, an
  employee's full name and staff ID, the client's school name and the client's course brand. The
  browser chrome was cropped; the personal and client data were replaced with sample values
  ("Alex", "Student A/B", "Grade 4 Math", "Alex Morgan", "10001234", "Sample Academy (Main
  Campus)", "Academy courses"), redrawn in the product's own typeface (IBM Plex Sans, measured
  and fitted per line) so the screens still read as the real product. Done in a throwaway Python
  venv in the session scratchpad; the originals never entered the repo. Test records on the
  dashboard (calendar items, notices) were left as they are and flagged in `content/TODO.md`,
  along with permission to publish the screens and product names.
- Decision: "3D" is shallow CSS 3D (perspective, preserve-3d stages, translateZ layers, pointer
  parallax) plus SVG, with no WebGL and no motion library. The brief prefers CSS/SVG when it is
  equivalent and requires the page to work without 3D; it also keeps the bundle near budget and
  keeps text crisp and accessible.
- Process: the lead built the foundation (content for every section, motion tokens, hooks,
  `Reveal`, real screenshots), then a workflow ran five agents in parallel, each in its own git
  worktree with strict file ownership: hero + header, What We Build, AI demo, Selected Work, and
  the lower page. The lead merged the five branches (no conflicts), then a second workflow
  reviewed the merged range through six lenses (accessibility and reduced motion, correctness,
  performance, plan and content honesty, layout in the browser, tests). Each finding went to
  three independent skeptics told to refute it; 10 of 13 findings survived (two or more of three
  confirmed) and were fixed in one commit.
- Where the AI (or its tooling) got it wrong:
  - The first workflow's worktrees were created from `main` (an old commit), not from the
    feature branch. Caught within minutes from `git worktree list`; the run was stopped, the
    worktrees removed, and the agents' instructions now start with an explicit reset to the base.
  - After merging, `npm run lint` reported 546 errors: ESLint was linting minified `dist/`
    output inside the agents' worktrees. Lint now ignores `.claude` and `.agents`.
  - Merged, the main JS chunk was 77.7 kB gzip, over the 71 kB budget. The lower page now loads
    as one lazy chunk (main 70.1 kB), which needed a way for the nav's active-section observer
    and `#fragment` links to find sections that arrive later.
  - Browser QA found the process timeline's travelling dot widening the page by 540 px at 1280 px
    (its invisible full-track box is moved with a transform). The section now clips it.
  - Review-confirmed defects: reduced motion hid five of six hero hints from sighted users; a
    focused ESS label could be invisible; `/#100%` crashed the lazy half (`decodeURIComponent`);
    the hash scroll fought scroll restoration; a touch unpin left a highlight stuck; the demo's
    scaled back plane caused sideways scrolling at 1024 px; the StaffXP sign-in layer was cut at
    the canvas edge; the log said "Completed" one tick before the graph; one test asserted less
    than its name claimed.
  - The deferred hash scroll first used smooth scrolling (inherited from `scroll-behavior:
    smooth`); in a hidden preview pane it never moved. Deep links now jump, like a normal load.
- Verification: 303 tests, lint and build pass; main JS 70.1 kB gzip, AI demo chunk 13.0 kB,
  lower-page chunk 9.8 kB. Browser checks at 375, 1024 and 1280 px: no horizontal overflow, hero
  loop and pause, approval flow and the advanced unlock, StaffXP tour and ESS annotations, the
  closing "Get IT Done", deep links to first-screen and lazy sections.


## 2026-10-03 - Concept 01, X / Command (Danh Nguyen + Claude)
- Prompt: read the five briefs in `docs/idea/` (00 visual system, 01 Command, 02 Architecture, 03 Edition, 04 Lab), build one concept as a demo, and report missing information. Branch `feat/concept-01-command`, created from `feat/motion-3d` so the earlier concept stays untouched.
- Decisions: Concept 01 first (most detailed brief). It is a separate page, `/concepts/command/` (Vite multi-page), so the main page is not touched. The `CLAUDE.md` rules on `feat/motion-3d` (no WebGL, CSS 3D only) belong to that concept; this one follows the docs, so it uses `three` for the data core, in a lazy chunk that is skipped for reduced motion, no WebGL and data saver. Palette from the brief (deep navy, `#F5C400`); the team said to pick what looks good. Logo: only a 250 x 46 navy PNG exists, so a white-wordmark copy was generated from it (temporary); the team will send a larger one.
- Honesty rules kept: the status panel (98 %, build #4821, Online) is labelled illustrative; StaffXP and ESS use the sanitized screenshots already in `public/work/`, with stack and status shown as "Pending confirmation" (the brief's ".NET / React / Production" is not confirmed); Engineering signals shows only `25+` and `3` offices, and the real counts that do not exist yet are placeholder tiles; the section is "Selected work", not "deployments", while status is pending; unconfirmed technologies show "To confirm" instead of names.
- Process: the lead wrote the spec (`docs/concepts/01-command-implementation.md`), shared tokens, content, the scene contract (`scene/store.js`, `scene/graph.js`) and UI primitives; a workflow then ran five agents in parallel with strict file ownership (WebGL scene, hero, modules and process, deployments and signals, nav / HUD / finale / footer). A second workflow reviewed the result through eight lenses (accessibility, correctness, performance, content honesty, Vercel web guidelines, Vercel React practices, layout at ten viewports, brief compliance); each of 45 findings went to two skeptics: 17 confirmed, 9 split, 19 refuted. Fixed: all 17, plus the split ones about the finale logo and the module diagrams.
- Where the AI (or its tooling) got it wrong:
  - **Shared Tailwind config leaked.** Putting the concept's tokens in `tailwind.config.js` made the main page's CSS grow from 60 to 72 kB (Tailwind scans every `src` file). Caught from the build output; the concept now has `tailwind.command.config.js` (loaded with `@config`) and the main config excludes `src/concepts`.
  - **Blank screenshot frame.** The viewer hid the image with `clip-path` until the image had loaded, but the image was `loading="lazy"`: a browser does not load a lazy image inside a fully clipped box, so each waited on the other. Every agent reported "not verified in a browser"; only a real browser showed it. Fixed with an eager image plus a fallback timer.
  - **Long stray lines in the WebGL scene.** Edges were faded per end, so an edge from a faded-out hub to a node drew as a gradient across the whole page. Fixed with one fade per edge. A multi-line string replace on that file silently failed (CRLF line endings); caught because the screenshot was unchanged. Lesson: after a scripted edit, grep for the new text.
  - Fixed controls sat over page text (the build counter and Pause Motion at the bottom corners), and a 92 percent header let the huge closing type show through. Pause Motion moved into the header, the counter stands in the left margin.
  - Pause Motion missed two loops: a more specific selector (`.step[data-state] .ping`) re-set `animation-play-state` and beat the pause rule. A global `!important` fix was proposed and rejected by a skeptic, who showed it would leave content invisible if paused before scrolling.
  - Smaller: duplicate React keys in the HUD, `fetchPriority` casing in React 18, a lazy chunk that could unmount the whole page if it failed to load, deep links not scrolling on load, an em dash kept on purpose because it is the brief's own copy.
- Tooling notes: the built-in browser pane scaled a 1280 px viewport to a third, so screenshots were unreadable; headless Edge driven by `puppeteer-core` (installed in the scratchpad, not in the repo) was used instead, and it only launches from PowerShell, not Git Bash. Stray Edge processes held the profile folders until stopped by profile path.
- Verification: `npm test` 441 tests, lint and build pass. The concept's first load is about 19 kB gzip of its own JS (React is shared with the main page); the `three` chunk is 140 kB gzip and loads only when the canvas runs. Browser checks at 320, 375, 390, 768, 1280 and 1920 px, with reduced motion, keyboard and the mobile menu: no horizontal overflow and no console errors.
- Not done: the pipeline "zooms into" a project (Process to case study) is only a small chain in the section header; the Lab page is left out; the logo is the placeholder PNG.

## 2026-10-03 - Concept 01 v2, from zero (Danh Nguyen + Claude)
- Prompt: `docs/idea/v2/` adds a Zero-State protocol: build X / COMMAND as a new project, do not reuse the first attempt. New branch `feat/concept-01-command-v2`; the v1 concept code was removed from it (it stays on `feat/concept-01-command`).
- Process (per the protocol): context audit; 8 research agents with real web references; 3 directions developed independently (Mission Control, Minimal Control Room, Network Core); 3 judges with different lenses; a synthesis into `docs/concepts/command-v2/00-direction.md` (decision: STANDBY chassis, NETWORK CORE idea, Mission Control vocabulary). Then WP0 (contract) by one agent and WP1 to WP6 in parallel with file ownership, each required to look at its own screenshots.
- Result: a new IA (seven stations, no About/FAQ/Testimonials), a hero cut by two hairlines at 32 degrees, an X made of the eight confirmed services with evidence glyphs, a brief that becomes a `mailto:`, real screenshots with linked hotspots, a ledger of what is real. 745 tests, lint and build pass.
- AI/tooling notes: the design doc was written without reading the old page (agents were told so); WP packages reported concerns that became the fix list in `docs/concepts/command-v2/HANDOFF.md`; a session interruption stopped the review run, so the review must be repeated. Not done: the fix list and the review (see HANDOFF).
## 2026-10-03 - Concept 01 v2, fix pass and review (Danh Nguyen + Claude)
- Prompt: check where v2 stands, then "keep going until everything is done" after the team confirmed every open decision in the handoff (logo: use the existing PNG).
- Process: baseline first (lint, 745 tests, build all matched the handoff). Three agents in parallel with file ownership (hero and core; ON FILE and DEPLOY; Premise, Line, frame and Done), then two more (CSS budget and 200 percent zoom; the premise core placement in WebGL), each told to look at its own screenshots. Then a five-lens read-only review.
- Fixed: footer is a landmark outside main; the premise anchor is sticky and the core now reaches it in the WebGL tier too (the hero-to-premise leg is driven by standby progress, `HERO_LEG_END` 0.85); sticky anchors are measured live; the "STEPS: DRAFT" legend shows only in dev or `?review` while "FAILURE BEAT: ILLUSTRATIVE" stays for everyone; ON FILE 3,928 to 2,810 px and DEPLOY 1,745 to 1,350 px at 1440x900; 200 percent text zoom no longer overflows at 320; CSS 14.68 to 13.88 kB gzip (own reset instead of Tailwind preflight, tighter Tailwind scan, dead motion rules removed); tests 745 to 772.
- AI mistakes and corrections: the hero hover and the 1024 overflow were listed as open defects but were already working, so the agent only extracted a helper and tests (the handoff list was stale). The first dev server on 5173 belonged to another checkout (Vite silently used 5174), so the QA scripts got a `QA_ORIGIN` variable. The background dev server was stopped by its time limit but the process survived. An agent measured CSS while the others were still editing, so its numbers were compared by swapping only its own files.
- Not done / open: ON FILE is still above its target (a 697 px screenshot plus its spec sheet cannot fit one screen); DEPLOY is about 2,230 px on phones; the premise-to-deploy hand-off moves the core about 6x scroll speed on desktop (continuous, but fast); header MOTION control is cut at 200 percent on 768 and 1024 px.
