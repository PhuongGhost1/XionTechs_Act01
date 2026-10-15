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


## 2026-10-04 - AI agent demo section for Concept 01 v1 (Danh Nguyen + Claude)
- Prompt: all three Concept 01 versions lacked the AI agent demo. Reference the main page demo (src/content/site.js workflows, agentJourneys; src/workflow/*) and add it in each concept's own style, research and brainstorm the three in sequence, with 3D and animation, and the three must not look alike. Each version got its own research agent and a decision before the next one started, with the earlier picks and the options already set aside passed in as exclusions.
- Decision (v1, mission control): **Flight plan**, a three.js trajectory plot (tilted plane, craft on curves, go/no-go gate, camera dolly, SVG fallback). Set aside: X-network as the agent (the v3 hero is already an X network), telemetry stack, scroll-driven camera rail (pinning behind a decision traps users). Data and logic are imported through the shared hook `src/workflow/useAgentDemo.js`, never copied.
- Where the AI got it wrong: the research agent claimed the existing scene code could take a second graph without reading it (not relied on; the demo got its own canvas and chunk). The agent also repointed two extra links (modules AI link, finale 'See an Agent Work') to the new section beyond what was asked; kept for consistency, easy to revert. One transient blank screenshot under SwiftShader, not reproduced.
- Verification: 490 tests, lint and build pass; Flight chunks are lazy (reduced motion requests none); no overflow at 390 and 360 px. Real-GPU performance is untested.


## 2026-10-06 - Smart campus replaces the flight plan in Concept 01 (Phuong Hoang + Claude)
- Prompt: the flight plan (section 05) does not show what XionTechs does with IoT. Build a 3D/4D school campus
  instead: several buildings, each with rooms that do different jobs (classrooms, security room, ...), each room
  showing its IoT services (temperature, humidity, a screen per classroom in the security room); visitors hover
  or click to see details. Later added: a camera per classroom that detects studying, phone use, sleeping.
- Brainstorm decisions (one question at a time, then a spec in `docs/superpowers/specs/2026-10-06-smart-campus-design.md`):
  school IoT is a real offering, but the buildings, rooms, devices and services were drafted by the AI, so the
  campus is labelled illustrative and the service list "pending team confirmation". No approve/reject flow.
  Everything procedural in three.js (no model files). First slice: four buildings, thirteen rooms and zones, ten
  of nineteen services; the data model takes the rest as content. "4D" is a school-day scrubber that moves the
  sun, window light, cars, people and every reading.
- Where the AI pushed back: the classroom behaviour camera. Watching minors and judging them per student
  reads as surveillance, touches children's and biometric data rules (Vietnam Decree 13/2023; the EU AI Act
  bans emotion recognition in schools), and the challenge rules forbid images of real people. Phuong chose the
  proposed framing: anonymous class-level shares only (focused / talking / on a phone / heads down), no faces,
  no names, seats in 3D show occupancy only, camera-wall feeds are abstract. Tests pin the wording.
- Where the AI got it wrong:
  - **Every room needed attention.** The first build flagged all five teaching rooms: empty labs counted as
    "warm" (their air conditioning is off on purpose), and the per-room seed hash gave `classroom-a/b/c`
    almost the same value, so all three classrooms crossed the CO₂ limit together. Fixed with a mixing hash, a
    warm rule that needs people in the room, and a retuned build-up; a test now requires "some, not all".
  - A test caught that no room carried the solar inverter, so the solar service existed only on paper.
  - `const { frame } = model` shadowed the scene's `frame()` loop function (lint and build failed).
  - Layer tints were invisible from above (roofs covered them); a layer now looks through the roofs.
  - The flat plan's admin rooms overlapped their names; rooms now carry a `short` name for the plan.
  - QA tooling: element screenshots flipped the 3D to the fallback plan. Puppeteer resizes the page for them,
    SwiftShader loses the WebGL context, and the section correctly falls back. It looked like a bug in the scene
    for three runs. Viewport screenshots with `captureBeyondViewport: false` fixed it (noted in `CLAUDE.md`).
    This is likely the "transient blank screenshot" in the 2026-10-04 entry.
- Verification: `npm test` (510 tests), lint and build pass. Campus chunks: `CampusTwin` 14.9 kB gzip, `CampusCanvas`
  7.9 kB gzip, plus the shared `three` chunk, all lazy. Headless Edge at 1440 and 390 px: campus, open building,
  classroom panel, air-quality and occupancy layers, security room camera wall, evening, reduced-motion site
  plan, phone lite 3D; no console errors. Real-GPU performance is untested.
- Follow-up prompt: "Where can I see the actual camera, like an image or video? Now we only have numbers." Stock
  or AI-generated classroom footage was ruled out (it shows children, and generated CCTV would pass for real).
  Agreed instead: every camera pin is a virtual camera; the scene renders what it sees (rooms, desks, plain
  figures, cars) into a small offscreen target, round robin at a few frames a second, and the panel shows it as
  CCTV (monochrome, green night vision after dusk, scanlines, `CAM 04 · CLASSROOM B · REC`, "Simulated feed").
  Rooms with a camera get a Camera view; the security room wall became eleven live feeds. On the flat site plan
  the tiles show occupancy only. Verified in headless Edge (classroom, security wall by day and night, car park).
- Follow-up: the team follows ThingsBoard. Options offered: align the model with its entity model (chosen),
  a "how it's wired" data-path layer, an importable ThingsBoard package, live telemetry later. Built: asset
  codes, device names (`CLC-AQ`) with telemetry keys and transport, six alarm rules with ThingsBoard-style
  severities, a pure replay of the day's alarms (active and cleared, with times), campus alarm list with a
  simulated Acknowledge, and room tabs Telemetry / Attributes / Devices / Alarms / Rule chain. The product
  name stays off the page until the team confirms it may be used. The first screenshot showed the fifth tab
  pushed out of the panel; the tabs were tightened to fit.
- Decision (Phuong): ThingsBoard is never named on the page; the team reads its documentation and applies the
  best practices. The open TODO item is closed, `CLAUDE.md` says so, and a test keeps the name out of the
  campus copy.

## 2026-10-13 — promote X / Command to the homepage (Bang Do + Claude)
- Prompt: swap what's at `/` and `/concepts/command/` — ship the Command concept as the
  real homepage, keep the previous design (plan v3) archived at the same `/concepts/command/`
  URL it used to view Command at. Also asked for a branch name since more changes are coming.
  Branch: `feat/promote-command-to-homepage`.
- This wasn't a simple file swap: both designs share `src/hooks/`, `src/content/site.js` and
  `src/workflow/` (confirmed by grep before touching anything — Command depends on both;
  nothing in `src/hooks`/`src/content`/`src/workflow` depends on either design), and each has
  its own Tailwind config with a different `content` glob and a different CSS token namespace
  (`paper/ink/primary` vs `cmd-*`). Plan: relocate `src/App.jsx` + `src/main.jsx` + `src/index.css`
  + `src/components/` ↔ `src/concepts/command/{App,main,command}.{jsx,css}` + its flat file list,
  preserving each file's *distance from `src/`* so relative imports to the shared folders keep
  resolving — wherever that wasn't possible, fix the import depth by hand. Swapped the two
  `tailwind.*.config.js` `content` arrays (not their token/theme definitions) to match. Rewrote
  both `index.html`s rather than swapping their content verbatim: `noindex`, canonical URL,
  theme-color and fonts all needed to move with *the path*, not *the file content*, since a
  concept page should never be indexed regardless of which design currently lives there.
- **Mistake caught before it shipped**: miscounted directory depth once. Old main's
  `src/components/*.jsx` (1 level under `src/`) moved to `src/concepts/command/components/*.jsx`
  (3 levels under `src/`) — a depth increase of 2 — but the first sed pass only added one `../`
  to the shared-folder imports (`../content` → `../../content` instead of `../../../content`).
  `npm test` still passed (526/526) because nothing exercises those import paths at the unit
  level, but `npm run build` would have shipped a page where the Agent Demo silently failed to
  resolve `content/site`. Caught it by computing the relative path programmatically
  (`path.relative`) instead of trusting manual arithmetic a second time, for every case before
  moving on. **Lesson: when relocating files across an import-depth change, verify the relative
  path computation with code, not by counting `../` in my head — and verify it for every
  distinct depth change in the batch, not just the first one that happened to work.**
- **Second thing caught by running `npm run build`, not just `npm test`**: a dynamic
  `import('./scene/XCoreCanvas')` inside `App.jsx` (a lazy-loaded chunk, not a static `import`
  statement) was missed by the grep used to find static imports needing a path fix — the build
  failed to resolve it. `npm test` doesn't touch Vite's bundler at all, so this only surfaces at
  build time. **Lesson: when auditing imports after a move, grep for `import(` (dynamic) as a
  separate pass from `^import` (static) — they're easy to miss as a category, not just
  individually.**
- Also fixed in passing: `src/workflow/phase.test.js` had a hardcoded `readFileSync('src/index.css', ...)`
  checking for a CSS utility (`.perspective-far`) that only ever existed in the previous design's
  stylesheet. `src/workflow/` is shared, but this specific test is really exercising the previous
  design's `AgentDemo` component, so it now reads `src/concepts/command/index.css` — the file that
  actually has that utility post-swap.
- Verified end-to-end before calling it done: `npm test` (526/526), `npm run lint` (clean),
  `npm run build` (succeeds, main entry 20.66 kB gzip, well under the 71 kB budget), and a
  Playwright screenshot of both `/` and `/concepts/command/` on a fresh dev server, confirming
  each renders the intended design with its correct fonts/colors and zero console errors.
  Left everything staged but uncommitted for review.

## 2026-10-13 — 4-theme selector on the homepage (Bang Do + Claude)
- Prompt: add a dark/light theme selector (2 dark, 2 light) to the homepage only, sharing the
  current style as a reference, and specifically keep the chart/graph components visible after a
  switch. No colors specified — asked Claude to pick.
- Found the token architecture already supported this well: every color in `src/index.css` is a
  `--c-*` CSS custom property, consumed through Tailwind's `cmd-*` names, and there was already a
  precedent (`[data-band='paper']`) for overriding the whole token set on a nested element. Added
  three more full token sets as `[data-theme='...']` blocks (`graphite`, `paper`, `linen`; `navy`
  stays the unscoped `:root` default) rather than inventing a new mechanism.
- Colors chosen: kept the brand signal yellow (`#F5C400`, from the logo) constant across all four
  — only the neutrals vary (navy-tinted dark → neutral graphite dark; cool paper light → warm
  linen light), so the brand mark never changes regardless of theme, only the surrounding palette.
  Text stays the same brand navy/white in every theme for the same reason. Computed real WCAG
  contrast ratios for every new muted/faint/signal-fg value (wrote a one-off script, same ratio
  rigor the existing navy/paper tokens already had in their comments) rather than eyeballing hex
  values: graphite muted 10.9:1, faint 6.2:1; linen muted 7.3:1, faint 5.3:1, signal-fg 5.8:1 —
  all comfortably over WCAG AA for their role.
- Reused the exact "paper" palette that `[data-band='paper']` already had, tuned and shipped, as
  the "Paper" theme rather than inventing new light values from scratch — one less thing to get
  wrong, and it's already proven in production.
- **The chart/graph risk the prompt called out was real**: `scene/render.js` (the hero's X-Core
  WebGL data core) and `campus/campusScene.js` (the smart-campus 3D twin) both read `--c-*`
  tokens via `getComputedStyle` **once, at scene creation**, and bake the resulting RGB into
  materials/geometry — found this by reading the code before writing any theme CSS, not after.
  Switching the CSS variables alone would have left both WebGL scenes frozen at whatever colors
  were active when they first mounted. Fixed by keying `<XCoreCanvas>` (App.jsx) and
  `<CampusCanvas>` (CampusTwin.jsx) with `key={theme}`, forcing React to unmount/remount them —
  and re-read fresh colors — on every theme change, the same recovery pattern already used
  elsewhere in this codebase for a lost WebGL context. Confirmed everything else (the SVG campus
  fallback, all Tailwind-class-driven UI) updates for free: it already referenced `rgb(var(--c-*))`
  live rather than caching a value.
- New files: `src/components/theme.js` (plain mutable store + subscribe, mirroring
  `scene/store.js`'s existing pattern — module state, not React state, so canvases and UI agree
  on the current theme without prop drilling) and `src/components/ThemeSwitcher.jsx` (a header
  disclosure button, same footprint/keyboard pattern as the existing `PauseMotion` control: Esc
  and outside-click close it, `role="menu"`/`menuitemradio`, verified keyboard-only operable with
  no mouse). Added a tiny inline script to `index.html` (next to the existing pre-paint
  background hack) so a returning visitor's chosen theme applies before first paint instead of
  flashing navy first.
- Verified before calling it done, not just claimed: `npm test` (526/526), `npm run lint`
  (clean), `npm run build` (main chunk 21.64 kB gzip, still well under the 71 kB budget — the
  feature added about 1 kB), then a Playwright pass that actually switched through all four
  themes, screenshotted each, reloaded to confirm `localStorage` persistence, and — specifically
  because the prompt flagged chart/graph visibility — scrolled into the smart-campus section and
  switched theme while its WebGL canvas was mounted. The before/after screenshots show the
  campus model visibly repainting (flat warm-toned render → bright navy-toned render with visible
  grass/building detail), confirming the remount fix actually re-reads color, not just that
  nothing crashed. Also checked keyboard-only operation and a 390px mobile viewport. Zero console
  errors throughout.

## 2026-10-13 — smart campus model restyled as a construction blueprint (Bang Do + Claude)
- Prompt: the 3D campus model (screenshot showing solid-shaded buildings, green grass, colorful
  parked cars, trees, a yellow playground slide) looks too detailed and distracting; wants it
  simplified into a construction-blueprint look instead.
- Read the whole renderer (`campusScene.js`, ~970 lines) and its per-frame loop before touching
  anything, specifically to find every place a to-be-removed element (trees, cars) was referenced
  later — not just where it's created. Found the per-frame "Cars" block (drove `parked`/`moving`
  mesh updates) and the config-tier `trees`/`cars` counts (`tier.js`), both of which would have
  left dead/dangling code or misleading config if only the creation code were deleted.
- Direction: monochrome, line-forward, grid-ground, same restraint `CampusSvg.jsx`'s flat site
  plan already uses (it was already blueprint-like: `rgb(var(--c-ok) / 0.1)` for lawn, line-color
  outlines) — extended that same philosophy into the 3D tier instead of inventing a new palette.
  Dropped trees, benches, the playground and car meshes entirely from this tier (CampusSvg.jsx is
  untouched and still draws its own flat tree/car marks from the same `model.decor` data, so nothing
  in the data model or its tests needed to change). Replaced the car park with static stall-outline
  rectangles (a parking *layout*, not parked cars) instead of just deleting the concept outright.
  Added a drawn grid across the ground plane and hairline outlines on every paved/road rectangle.
  Walls/roofs/slabs moved from solid realistic fills to near-background pale tints so the
  `EdgesGeometry` outlines (already in the code) carry the shape, the way a blueprint's lines do.
  Kept the brand's restraint: signal yellow stays reserved for selection/alerts, never decoration —
  also removed the last decorative use of `--c-ok` (the green grass tint), so it stays a true status
  colour. Kept desks/people and their legibility (`P.desk`/`P.person` deliberately brighter than
  the structural tones) since occupancy is real information, not realism to prune.
- Cleaned up what the removal actually orphaned rather than leaving it half-done: deleted the
  per-frame car-position/traffic code, the now-dead `CAR_SPEED` constant and `carClock` state, the
  unused `IcosahedronGeometry` import, and — since nothing reads them any more — the `trees`/`cars`
  counts from every tier in `tier.js`, updating its doc comment and the two `tier.test.js`
  assertions that covered those fields (replaced with assertions on what still actually varies
  by tier: `dpr`, `antialias`, `seats`, `flat`).
- **Bug found and fixed along the way, not left for later**: screenshotting the result in the
  Paper theme (to confirm the blueprint style holds up in a light theme too, not just navy) showed
  the ground rendering navy-dark on an otherwise correctly light-themed page. Debugged by checking
  the actual computed `--c-bg` value first rather than guessing — confirmed `readColors()` *was*
  reading paper's correct light tokens, so the bug wasn't there. The real cause: `HemisphereLight`
  and `DirectionalLight` (the scene's sky/sun) were colored from `C.text` — ink (dark navy on a
  light theme, white on a dark theme) — so on a light theme the "sun" was nearly black, leaving
  every upward-facing surface under-lit regardless of its own (correctly-read) material color.
  This predates this session's work but was masked before by darker original materials; the new
  paler blueprint palette made it obvious. Fixed by making sky/sun a fixed bright white (light
  sources shouldn't track ink color, which inverts meaning across themes) while leaving the
  hemisphere's ground-bounce half on `C.bg` (correctly theme-appropriate already). Verified
  specifically that navy didn't regress (it already used white ink, so the fix is a no-op there)
  before trusting the paper/linen fix.
- Verified before calling it done: `npm test` (526/526), `npm run lint` (clean), `npm run build`
  (CampusCanvas chunk actually shrank, 19.64 kB gzip vs 20.93 kB before — less geometry/material
  code, not more). Then four separate Playwright passes, one per theme (navy, graphite's screenshot
  skipped as redundant with navy's already-correct lighting, paper, linen), screenshotting the
  overview and — for navy — a building opened to confirm the glass-box interior (desks, people,
  device pins, the "needs attention" alert color) stayed legible and fully interactive through the
  redesign. Zero console errors throughout.

## 2026-10-13 — campus model contrast fix + found the labels already existed (Bang Do + Claude)
- Prompt (3 screenshots: navy, graphite, paper): the building model is too dark in dark themes and
  too bright in the light one — not visible when it's a similar color to the background. Also
  asked for floating name labels on the model.
- The blueprint pass earlier today had overcorrected: it mixed building fills and edge lines from
  `--c-line`, a token that's deliberately *low*-contrast (a subtle UI divider, by design — not
  something with a contrast guarantee). Fine for secondary elements like the ground grid; wrong
  for the buildings, which are the primary subject and need to read clearly in every theme.
- Before touching the "floating label" request, checked whether it already existed rather than
  assuming it didn't: grepped `CampusTwin.jsx` for where label refs get attached, found nothing,
  almost concluded the feature was unbuilt — then found `CampusLabels.jsx`, a whole component
  already wired up (`anchorOf`, `setLabelsEnabled`, `labelRef`) and already rendered from
  `CampusTwin.jsx`. Verified empirically with a Playwright DOM inspection (not just reading code)
  that the labels genuinely exist with correct text, position and `visibility: visible` — so the
  "missing" labels were the same underlying bug: their CSS box used `--c-bg` for background and
  `--c-line` for border, so they were just as low-contrast as the buildings they float over.
  **Lesson: before implementing a requested feature, check whether it's already built and just
  broken — "it's not visible" and "it doesn't exist" look identical in a screenshot, and grepping
  only the file you expect the answer to be in isn't enough to conclude it's absent.**
- Fix, computed not eyeballed: wrote a contrast-ratio script and swept mix fractions of `--c-bg`
  toward `--c-muted` (a token with a *verified* 5.5-10:1+ contrast guarantee against `--c-bg` in
  every theme, from the original theme work) to find one fraction that cleared two constraints at
  once in all four themes: the building fill visible against the page background (WCAG's 3:1
  non-text minimum), and `--c-text` edge lines still visible against that now-brighter fill (also
  3:1+). 0.7 was the only fraction in the range tested where both held simultaneously everywhere;
  paper's fill-vs-bg (3.27:1) and graphite's edge-vs-fill (3.10:1) were the tightest margins.
  Bumped building edge lines from `--c-line`/`--c-faint` to `--c-text` (maximum, theme-guaranteed
  ink contrast) throughout, and path/road/parking outlines one step up from `--c-line` to
  `--c-faint` (secondary elements, deliberately kept subordinate to the buildings). Applied the
  identical fix to the label box CSS: `--c-bg`→`--c-surface` background, `--c-line`→`--c-muted`
  border, plus a drop shadow so a label is never fully dependent on the scene behind it for
  separation.
- Verified: `npm test` (526/526), `npm run lint` (clean), `npm run build`. Then four Playwright
  passes — navy, graphite, paper, and a fourth that actually clicked the zoom-in control four
  times on navy (not just the default framing) to confirm labels and edge contrast hold up at a
  closer view too, not only the one distance already screenshotted. Zero console errors.

## 2026-10-13 — ground still blended into the page, on all 4 themes (Bang Do + Claude)
- Prompt (screenshot): even after the contrast fix above, the model's *ground* still reads as
  basically the same colour as the page around it, on every theme.
- This was a real gap in the previous fix's reasoning, not a new regression: that pass explicitly
  decided "ground/paths stay closer to --c-bg on purpose: they're the backdrop, not the subject" —
  reasonable for keeping the ground visually subordinate to the buildings, wrong for the actual
  requirement, which is that the model's footprint has to read as separate from the page at all,
  independent of how it relates to the buildings sitting on it.
- Tried the same lever that worked for buildings first (mixing more --c-muted into the ground
  fill) and checked the ratios before committing to it: it tops out around 2.1-2.9:1 against the
  background in the light themes no matter how far the mix is pushed, because sRGB's gamma curve
  compresses luminance differences near white — mixing toward a moderate-contrast colour can't
  manufacture real separation once you're close enough to white to begin with. Fixing it by mixing
  harder in that direction alone would have meant the ground has to become nearly as bright as the
  walls to hit 3:1, which would have reintroduced the "ground competes with buildings" problem the
  original (wrong) decision was trying to avoid.
- Landed on three independent fixes stacked, so no single one has to carry the whole job:
  (1) `.cp-stage`'s own CSS background is now `--c-surface` instead of inheriting the page's
  `--c-bg` — the 3D viewport reads as a distinct panel before the WebGL scene draws anything;
  (2) the ground/field fill still moved from `--c-line` to a moderate `--c-muted` mix (enough to
  read as a surface, deliberately short of the buildings' weight); (3) a strong `--c-text`
  boundary line now runs around the whole plot — the one cue that doesn't depend on any fill
  colour clearing a contrast ratio at all, so it holds even where (1) and (2) are weakest (light
  themes).
- Verified across all four themes again (not just navy, since the original bug report was
  specifically "on all 4 themes" and the earlier fix had already shown overfitting to the dark
  themes is an easy trap here): `npm test` (526/526), `npm run lint` (clean), `npm run build`, then
  four fresh Playwright screenshots confirming the model's footprint is now clearly bounded and
  separated from the page in every theme. Zero console errors.

## 2026-10-13 — logo invisible on both light themes, everywhere it appears (Bang Do + Claude)
- Prompt (screenshot, three places circled: nav, the final-CTA data-core logo reveal, footer): the
  logo isn't visible anywhere on Linen (or, it turned out, Paper).
- Root cause, found by grepping every `brand.logo` usage rather than guessing from one spot:
  `content.js` only ever had one logo file, `logo-reversed.png` — a white recolour of the wordmark,
  made (per its own code comment) back when this page had a single dark theme, "so the navy
  letters read on a navy page." White on the two light themes' off-white backgrounds is invisible
  by the same logic in reverse. Used identically by `<img>` tags in Nav, Footer and FinalCta.
- `XCoreCanvas.jsx` also references `brand.logo.src`, but checked `logoPoints.js` before touching
  it: the sampler reads the image's *alpha channel* only (for particle shape), and the particles
  it places are coloured by the scene's own theme tokens, not the source file's colour — so that
  usage needed no change, and adding a second variant there would have been pointless churn.
  **Lesson: "this file is referenced in 4 places" doesn't mean all 4 need the same fix — check
  what each caller actually uses the asset *for* before assuming they share the same bug.**
- Fix: the original navy artwork was already sitting in `public/XionTechs-Logo_s.png` (the
  archived previous design's logo, unused by Command) — reused it as `brand.logoLight` rather than
  generating a new asset. Added `useThemeMode()` to `theme.js` (derives 'dark'/'light' from the
  current theme id, re-rendering only on an actual light/dark crossing, not on every theme
  switch — navy→graphite doesn't need to touch the logo) and had Nav/Footer/FinalCta pick between
  `brand.logo` and `brand.logoLight` with it, rather than duplicating the theme-read logic three
  times inline.
- **False alarm caught before being reported as a bug**: after the fix, the final-CTA logo still
  looked faint in an early screenshot. Before assuming the fix was wrong, inspected the actual DOM
  (`img.src`, computed opacity) rather than trusting the screenshot alone — the `src` was already
  correct, fully opaque, no transform offset. The real cause was the test script's own wait time:
  that logo's reveal is a `1600ms` delay plus a `900ms` settle animation (`FinalCta.css`), and the
  screenshot had been taken at 600ms — mid-animation, not broken. Re-ran with a 3.5s wait and it
  was correct. Didn't change any product code for this one, only the test.
- Verified: `npm test` (526/526), `npm run lint` (clean), `npm run build`. Then confirmed all
  three spots (nav, footer, final-CTA) on Paper, Linen and Navy (checking Navy too, to make sure
  fixing the light themes didn't regress the dark-theme white logo) with real DOM inspection, not
  just a glance at a screenshot. Zero console errors.

## 2026-10-13 — Selected Work's "Agent demo" card repointed to the campus demo (Bang Do + Claude)
- Prompt (screenshot): the "Agent Demo" card in Selected Work is outdated; it should describe and
  link to the smart-campus demo instead (the one whose colours/contrast we've been fixing today).
- Checked why it was actually broken before rewriting it, rather than assuming the prompt's
  framing: the card's button linked to `/#ai-agents`, commented "the demo lives on the main page."
  That was correct back when this card's page (Command) was still *at* `/concepts/command/` and
  "the main page" was the other, archived design — which had (and still has) a real `#ai-agents`
  section. `feat/promote-command-to-homepage` earlier today swapped which page is "the main page"
  without touching this one cross-page link, so it silently started pointing at a hash that
  doesn't exist on Command's own page any more. The prompt's "outdated" was right, and for a
  reason one layer deeper than just stale copy.
- Rewrote the card's `id`, `name`, `summary` and `link` in `src/components/content.js` (the
  `deployments.records` entry) to describe the campus demo and link to `#campus` — a same-page
  anchor now, since the campus section lives on Command's own page (it moved there in the same
  reorg that caused the bug above). Reused the campus section's own established facts (climate,
  occupancy, energy, security, simulated/illustrative) rather than inventing new claims, and kept
  the same "what it is → disclaimer" sentence shape the original card used.
  - **Mild care in the edit itself**: `content.js` declares the `campus` export *after*
    `deployments` in the same file; writing `name: campus.label` directly would have thrown
    ("Cannot access 'campus' before initialization," a module-level temporal-dead-zone error) —
    caught by checking declaration order before using it, not by running the dev server and
    finding out. Used a literal string with a comment pointing at `campus.label` instead.
- The visual fallback for this card (an abstract X-graph diagram, since it has no real
  screenshot) was named and commented as if it only ever served the agent demo (`AgentX`,
  `AgentPanel`, "The Agent demo has no screenshot..."). It's a generic "no screenshot" fallback —
  checked the render logic (`screen ? <img> : <AgentPanel>`) to confirm that before renaming —
  so renamed it to `FallbackX`/`FallbackPanel` and rewrote the comment, rather than leaving
  code that would mislead the next person into thinking it's agent-specific.
- `signals.test.js` had a test pinned to the old id/href (`r.id === 'agents'`,
  `link.href === '/#ai-agents'`); updated it alongside the content change, not left to fail or
  quietly stop testing anything real.
- Also found and fixed the same stale cross-page assumption in `CLAUDE.md` itself (written during
  the original promote-to-homepage reorg): it still described the smart campus as living at
  `src/concepts/command/campus/` and the agent-demo link as pointing "to the main page" — both
  wrong post-reorg. Fixed in the same pass since it's the same underlying fact changing.
- Verified: `npm test` (526/526), `npm run lint` (clean), `npm run build`, then a Playwright check
  that did more than look at the card — it clicked the actual "See the campus model" link and
  confirmed via `getBoundingClientRect()` that `#campus` lands correctly in view (not just that
  the href *looks* right), screenshotting both the card and the scroll destination. Zero console
  errors.

## 2026-10-13 — Signals section's stale fixed-theme band + section-break lines (Bang Do + Claude)
- Prompt (screenshot): the Engineering Signals section still doesn't match the current theme
  (Linen in the screenshot — the section was visibly a cooler gray than the warm cream above it),
  and asked for the page to generally make section boundaries more visually distinguishable,
  suggesting a break line.
- Root cause, found by grepping for the mechanism rather than guessing at colors: Signals.jsx
  still carried `data-band="paper"`, a leftover from before the 4-theme feature existed, when the
  page had exactly one dark theme and this was "the one light section for contrast" (its own old
  comment said so). It unconditionally force-applies the *original* fixed light palette — not
  today's "Paper" theme, a separate, coincidentally similar-looking block — regardless of which of
  the four themes the visitor actually has selected. Confirmed via grep that Signals.jsx was its
  *only* consumer anywhere in the codebase before removing it, so this wasn't a case of breaking
  something else that still needed it.
- Removed `data-band="paper"` from Signals.jsx (it now just uses `bg-cmd-bg`/`text-cmd-text` like
  every other section, correctly theme-aware) and deleted the now-fully-dead `[data-band='paper']`
  CSS block and its `:focus-visible` override in `index.css`, rather than leaving unreferenced
  code that would confuse the next person into thinking it still does something.
- Section-break lines: surveyed every major section's root element first to find the existing
  convention rather than inventing a new one — `Footer.jsx` already used `border-t
  border-cmd-line`, just never applied anywhere else. Added the same `border-t border-cmd-line` to
  Modules, Process, Deployments, CampusSection, Signals and FinalCta (Hero excluded: it's the
  first section, nothing sits above it to divide from). Checked how it reads over a *transparent*
  section (most of the page shows the fixed X-Core WebGL canvas through it, not a flat color) by
  screenshotting the Modules→Process seam specifically, not just the opaque Signals/Campus ones —
  it draws as a clean hairline across the canvas, reading as an intentional blueprint cross-section
  mark rather than a rendering artifact.
- Verified: `npm test` (526/526), `npm run lint` (clean), `npm run build`. Then Playwright across
  all four themes at the Campus→Signals seam specifically (the exact boundary in the bug report)
  confirming continuous background color with a visible divider in each, plus the two
  transparent-section seams as a separate check. Zero console errors.

## 2026-10-13 — simulated CCTV feed looked wrong across themes (Bang Do + Claude)
- Prompt (4 screenshots, one per theme): the camera-view color inside a selected classroom "looks
  weird across themes."
- First diagnostic attempt was wrong, and worth recording why: sampled the feed canvas's raw
  pixels with `getImageData()` and found a theme-tinted color cast (Navy's feed reading distinctly
  blue). That's a real measurement but answers the wrong question — `getImageData()` reads the
  canvas's pixel *buffer*, which is what the 3D scene rendered *before* CSS runs; the feed canvas
  has a `grayscale`/`sepia`/`hue-rotate` CSS filter chain applied at *display* time
  (`.cp-cctv__img` in Campus.css) that was built to make the feed look like real CCTV footage
  regardless of what's under it. Caught the mistake by actually screenshotting the rendered
  element (what a visitor sees) instead of trusting the raw-pixel number, and found the filtered
  output looked fine in isolation. **Lesson: a CSS filter sits between "what's rendered" and
  "what's displayed" — test the thing a person actually looks at, not an earlier stage of the
  pipeline that a filter downstream will change.**
- The real issue only showed up by reproducing the *night* state specifically (the day filter is a
  flat grayscale; the night one simulates IR night-vision — green, sepia + hue-rotate — and only
  reads as a coherent glow when the subject is brighter than its surroundings, like real
  night-vision footage). Dark themes (Navy, Graphite) have light desks on a dark room — correct
  direction, looks like real night-vision. Light themes (Paper, Linen) have the same desks
  rendered dark-on-light underneath (matching their own UI, correctly) — so the *same* filter
  chain inverted them into a harsh black-silhouette cutout instead of a glow. Confirmed by
  screenshotting all four themes at the same simulated time side by side, not guessing from the
  code.
- Root framing: a simulated security camera represents a physical device and shouldn't re-skin
  itself to the website's UI theme at all — a real CCTV camera doesn't go light-mode. Fixed by
  giving `renderFeed()` (campusScene.js) its own small fixed, theme-independent palette (new
  `FEED_WALL`/`FEED_FLOOR`/`FEED_DESK`/`FEED_PERSON` constants: dark room, bright desks/people in
  every theme) applied only for the instant the feed is captured, through the function's existing
  `set`/`restore` mechanism (already used to toggle mesh visibility for the same capture, so this
  reuses an established pattern rather than inventing a new one) — the room's real, theme-matched
  colors are restored immediately after and the normal 3D view is untouched. Had to add `desks` to
  `addSeats()`'s return value (it only exposed `people` before) to reach that material.
- Verified: `npm test` (526/526), `npm run lint` (clean), `npm run build`. Then actually
  reproduced both lighting states per theme with Playwright (moved the day scrubber, not just the
  default snapshot) — eight screenshots, day and night for all four themes — confirming Paper and
  Linen's night feed now matches Navy/Graphite's glow instead of the black-cutout look, and all
  four day feeds now render visually identical neutral grayscale. Zero console errors.

## 2026-10-13 — outdoor zone camera feeds still washed out/inconsistent (Bang Do + Claude)
- Prompt (screenshot, Car Park zone selected): on the two light themes, the camera view sometimes
  goes very blurry, sometimes green, "changes from time to time" after reselecting a part of the
  model.
- Checked the screenshot's own content before assuming anything: it's an *outdoor* zone (Car
  Park), not a classroom. The previous fix only applied the fixed feed palette inside
  `renderFeed()`'s indoor branch — outdoor zones (`r.outdoor`) were never touched, so they still
  used the real, theme-tinted, deliberately-subtle blueprint ground colour. Reproduced it directly
  rather than guessing: Playwright, Grounds -> Car Park, Paper theme — the feed was close to a
  blank white frame with barely-visible outlines, exactly matching "blurry."
- The "sometimes green" half isn't actually random: the night filter is tied to simulated lamps
  state (`live.lamps`), so reselecting a zone at a different point in the day scrubber correctly
  shows day (grayscale) vs. night (green) — expected behaviour, not a bug. But combined with the
  washed-out day rendering, the two states together read as "inconsistent" rather than as two
  legible, intentional modes — fixing the day case makes the night/day distinction read as
  designed instead of confusing.
- Fix: extended the same fixed feed palette to the outdoor branch — `set(v.mat, 'color',
  FEED_FLOOR)` on the zone's own flat fill, reusing the constant from the indoor fix rather than
  inventing a second one (CCTV footage of pavement and of an indoor floor read as a similar
  mid-grey tone regardless). Left `v.edges` (the zone's outline) alone — it already uses
  `--c-text`, which sits far enough from mid-grey in every theme to stay visible through the
  filter on its own, so only the flat fill needed the override.
- Verified: `npm test` (526/526), `npm run lint` (clean), `npm run build`. Then reproduced the
  exact scenario from the report with Playwright — Car Park, Paper and Linen, day and night —
  confirming the day feed is now a legible mid-grey surface (not blank) and the night feed is a
  readable two-tone green frame (not a flat green blow-out), while the exterior 3D view (a
  separate screenshot of the same state) stays untouched, confirming the fix is scoped to the
  feed capture only. Zero console errors.

## 2026-10-13 — camera feed "flickering" wasn't a rendering bug at all (Bang Do + Claude)
- Prompt (2 screenshots, ~5 seconds apart): the feed is green ("night mode", lamps on, 19:31),
  then a few seconds later shows as the grayscale day version at a completely different time
  (08:04, lamps off) — "still green here, but for only like 5 seconds."
- Didn't touch any rendering code this time until confirming what was actually happening: checked
  `CampusTwin.jsx` and found the simulated school day autoplays by default
  (`useState(true)`) and completes a full day in 60 real seconds (`DAY_SECONDS = 60`). Dragging
  the time scrubber manually already calls `setPlaying(false)` to stop it — but clicking a
  building or room (`select`/`onPick`, used by every "open this room" interaction in the model)
  did not. So the night-vision filter genuinely was correct both times — lamps really were on at
  19:31 and really were off at 08:04 — the simulated clock had just kept running in the
  background the whole time the user was looking at one room, advancing roughly 8% of a full day
  every 5 real seconds. Verified this diagnosis empirically before changing anything: Playwright
  confirmed the displayed time advances on its own pre-selection (09:57 -> 10:25 in 2s) exactly as
  expected from a 60-second autoplay loop.
  **Lesson: "the colour looks wrong" and "the colour is reading a value that's changing out from
  under you" produce identical screenshots. Check whether the underlying data is actually stable
  before assuming the renderer is at fault.**
- Fix: `select()` and `onPick()` (CampusTwin.jsx) now call `setPlaying(false)`, the same pause
  `onTime` already does for a manual scrub — opening a building or room freezes the simulated
  clock at whichever moment the visitor clicked in, so a camera feed (and the lamps/temperature/
  occupancy readings beside it) holds still while being read instead of drifting through the day
  behind their back. Nothing auto-resumes it, matching the existing scrubber precedent; the
  visible "Play Day" control is still there if someone wants to watch it run.
- Verified: `npm test` (526/526), `npm run lint` (clean), `npm run build`. Then confirmed the fix
  directly rather than trusting the code read alone: Playwright selected a classroom and watched
  the displayed time over 3 real seconds — perfectly stable (10:27 -> 10:27) where it had been
  advancing before selection. Zero console errors.

## 2026-10-15 — three teammate review comments (Bang Do + Claude)
- Prompt: screenshots of design-review comments from teammates (Vietnamese). Three asks:
  (1) campus building/room labels disappear after a theme switch, (2) rename "Smart Campus" to
  "Smart School Campus" everywhere, (3, Phuong Hoang) add scroll-to-stop / timed scroll stop so
  the page scrolls smoother, "like the XionTechs web."
- **Label bug, root cause**: this was a regression from an earlier session's own fix (2026-10-13,
  `d3aaed7`), not a pre-existing bug — worth recording as a place the AI's own prior fix had a gap.
  That fix keyed `<CampusCanvas>` by `theme` so switching themes remounts the three.js engine and
  re-bakes material colours from fresh `getComputedStyle` reads. But `CampusTwin.jsx`'s
  `setLabelsEnabled(three)` effect only re-runs when the *value* of `three` (`canvasOn && ready`)
  changes — and `ready` was already `true` from the previous engine instance, so after a remount
  `three` stays `true` throughout and that effect never re-fires for the brand-new engine. The new
  engine's internal `labelsOn` flag starts `false` and nothing ever flips it; the label elements
  are still in the DOM (React never stopped rendering their text), they just never get positioned
  or shown. Fix: call `apiRef.current?.setLabelsEnabled(true)` directly inside `onReady`
  (`CampusTwin.jsx`) — the engine's own "first frame drawn" callback, which fires fresh for every
  engine instance including remounts, regardless of whether `three`'s value happened to change.
  The existing `[three]`-dependent effect is untouched; it still correctly handles *disabling*
  labels (scrolling away, a tier downgrade).
  **Lesson: `key={...}`-forced remounts reset a child component's internal state, but any parent
  state gating that child only re-syncs to it through a `useEffect` dependency — if the dependency's
  *value* doesn't change across the remount, the effect silently doesn't re-fire for the new
  instance. Prefer wiring directly into the child's own lifecycle callback (`onReady`) when one
  exists, rather than inferring "is it ready" from parent state that may already be stale-true.**
- **Rename**: "Smart campus" -> "Smart school campus" in `content.js` (the sidebar `sections` tag,
  the Selected Work "Project 003" card, and the `campus` section object's own `label`), plus
  matching comments in `CampusTwin.jsx`, `CampusSection.jsx`, `campusData.js`, `CLAUDE.md` and
  `content/TODO.md`'s heading. No test asserted the old string, so `npm test` alone wouldn't have
  caught a missed spot — checked with Playwright that all three visible locations (sidebar tag,
  card, section eyebrow) actually render the new text, not just that content.js changed.
- **Scroll-to-stop**: CSS-only, matching the MOTION brief (no motion library). Added
  `scroll-snap-type: y proximity` to the existing `html` rule in `index.css` and a new
  `[data-cmd-section] { scroll-snap-align: start; }` rule, reusing the `data-cmd-section` attribute
  already on all seven top-level sections (the same attribute `BuildHud.jsx` already queries for its
  active-section tracking — no new convention introduced). Chose `proximity` over `mandatory`:
  these sections each run well past one screen, so a mandatory snap would fight a visitor scrolling
  *through* the middle of a section, not just *to* one; proximity only pulls in once a scroll ends
  near a boundary. `scroll-padding-top` (already set, for anchor links) keeps a snapped section clear
  of the fixed header. The existing `prefers-reduced-motion` block already sets `scroll-behavior: auto`
  — confirmed this still applies under snap (the settle becomes instant instead of gliding; nothing
  further needed there).
  Verified the mechanism is live (computed `scroll-snap-type`/`scroll-snap-align` present; forcing
  `mandatory` via an injected stylesheet visibly pulled the scroll position beyond a raw wheel delta,
  confirming Chromium is actually invoking snap, not just accepting the CSS), but did not chase exact
  landing pixels under `proximity` — Chromium's proximity implementation is intentionally soft/subtle
  by design (that's why it was chosen over `mandatory` here), and automated pixel-matching against it
  proved unreliable given the page's own lazy-loaded sections shifting document height during the
  test. Visual/manual confirmation of "feel" is the honest remaining check, not something a script
  can assert.
- Verified: `npm test` (526/526), `npm run lint` (clean), `npm run build`. Playwright confirmed, in
  one pass: campus labels ("Teaching block", "Library", …) stay `visibility: visible` with live
  position transforms after switching theme (navy -> dark via the header's Theme menu); "Smart
  school campus" renders in the sidebar tag, the Selected Work card and the campus section eyebrow;
  `scroll-snap-type`/`scroll-snap-align` are applied and actively engaged. Zero console errors.

## 2026-10-15 — Process: drop Request and Architecture (Bang Do + Claude)
- Prompt (Teams screenshot, Phuong Hoang tagging Bang Do): remove the Request and Architecture
  steps from the 6-step process graphic ("REQUEST / DISCOVERY / ARCHITECTURE / BUILD / DEPLOY /
  SCALE").
- Looked like a content-only trim (delete 2 entries from `process.steps` in `content.js`), but the
  Process section's step count is load-bearing for the X-Core 3D animation (`scene/layout.js`):
  `STEP_COUNT = 6` groups the X's 36 arm nodes into exactly six 6-node clusters (`idx / 6`, `idx %
  6`) that land on the `process-1..6` DOM anchors, and the same six clusters are reused, dimmed, as
  a chain through the Deployments and Signals phases. Deleting content without touching this would
  have left two now-nonexistent anchors (`process-5`, `process-6`) falling back to guessed
  positions (`fallbackAnchor`) while the node-grouping math kept assuming six clusters of six —
  visually, the last cluster would have silently absorbed the two orphaned groups instead of the
  remaining four clusters regrouping evenly.
  **Lesson: before trimming a content array that drives a numbered section, grep for the section's
  id/count elsewhere in the codebase — "six" and "STEP_COUNT" turned up a whole parallel WebGL
  layout system keyed to the old count that the content file gave no hint of.**
- Fix, done as one change: `content.js` now lists four steps (discovery, build, deploy, scale),
  renumbered `index`/`anchor` 01-04 / `process-1..4`; title changed from "Request in. Production
  out." to "Discovery in. Scale out." (same pattern, new first/last step — not new copy). In
  `scene/layout.js`: `STEP_COUNT` 6 -> 4; the node-grouping formula (`stepOf`, the in-cluster
  spread `rho`) now derives its group size from `(N - 1) / STEP_COUNT` instead of a hardcoded `6`,
  so it no longer silently desyncs if the step count changes again. Updated the comments in
  `layout.js`, `Process.jsx` and `docs/concepts/01-command-implementation.md` that spelled out "six"
  or showed a "Step 03 / 06" example. `layout.test.js` and `processProgress.test.js` had the same
  assumption baked into literal `[1,2,3,4,5,6]` arrays and expected counts/readouts; generalized
  those to read `STEP_COUNT` instead of re-hardcoding `4`.
- Verified: `npm test` (526/526, including the regenerated `layout.test.js` assertions), `npm run
  lint` (clean), `npm run build`. Playwright confirmed the rendered section shows exactly
  Discovery/Build/Deploy/Scale, the readout moves "Step 01 / 04" -> "Step 04 / 04" across the
  section's scroll range, and the X-Core animation's step-phase clusters are not overlapping or
  lopsided. Zero console errors.

## 2026-10-15 — Selected Work: drop the record sheet, declutter the campus card (Bang Do + Claude)
- Prompt (3 Teams screenshots, red boxes): remove the highlighted block (Sector / Seen in the
  product / Stack / Status / tags) from the StaffXP, ESS and Smart school campus viewers; for
  campus specifically, also remove "Illustrative · demo data" and "Draft copy".
- Checked the honesty rule first (`CLAUDE.md`: never delete a PLACEHOLDER/ILLUSTRATIVE label
  without replacing it with verified real content, and it must stay visible for every visitor) before
  touching anything, since campus is invented demo content. Traced every place "Illustrative · demo
  data" and "Draft copy" render for the campus record: (1) the ledger sidebar card's own badge
  (`Deployments.jsx` `LedgerRow`, `record.illustrative && <IllustrativeTag/>`) — always on screen,
  independent of which record is selected; (2) the viewer's record sheet, inside the highlighted
  box, already going away with that block; (3) `ProductViewer.jsx`'s `FallbackPanel` (campus's
  screenshot-less panel) had its own `<IllustrativeTag/>` and a `<DraftMark draft={record.
  summaryDraft}/>` on the summary text — outside the highlighted box, the two the prompt's "also
  remove" line must mean. Removing (2) and (3) still leaves (1) on the page, plus the summary copy
  itself already says "illustrative" and "it's a demo, not a client project" in plain English — the
  disclosure survives, just without three redundant copies of it. Also noted `DraftMark` only
  renders in `npm run dev` / `?review` builds already (`SHOW_DRAFTS`), so "Draft copy" was never
  visible to a production visitor regardless.
  **Lesson: before deleting a label the brief calls non-negotiable, count every place it appears on
  the page, not just the one in the screenshot — the fix was "remove the duplicates," not "remove
  the disclosure."**
- Fix: `ProductViewer.jsx` — deleted `RecordSheet`/`SheetRow` entirely (the Sector/Seen/Stack/Status
  block, used by all three records) and the `IllustrativeTag`/`DraftMark` calls inside
  `FallbackPanel` (campus only, since it's the only record without a real screenshot). Removed the
  now-unused `deployments`, `DraftMark`, `IllustrativeTag`, `PendingTag` imports. Left `content.js`'s
  `stack`/`status`/`summaryDraft`/`tagsDraft`/`fields` data alone — unused by the UI now, but
  harmless, and keeping them avoids a drive-by data-model edit beyond what was asked.
- Verified: `npm test` (526/526), `npm run lint` (clean, confirming the removed imports really were
  dead), `npm run build` (main chunk gzip dropped slightly, 21.65 -> 21.22 kB). Playwright clicked
  through all three ledger records and confirmed, per record: no "Sector" row, no "Pending
  confirmation" text, zero "Illustrative"/"Draft copy" matches inside the viewer panel for StaffXP
  and ESS, and for campus specifically: zero "Draft copy" matches, one "Illustrative" match (the
  summary prose, not a badge), and the sidebar ledger badge still present. Zero console errors.

## 2026-10-15 — campus badges removed over a flagged honesty-rule conflict (Bang Do + Claude)
- Prompt (GitHub PR review comment, Phuong Ghost1, red highlight over the campus model's top bar):
  "Remove highlight or replace with a better words", on the "Illustrative campus · simulated
  readings" / "Services shown are examples pending team confirmation" chips and the "Draft copy"
  tag on the section intro.
- This one was different from the same day's Deployments-viewer cleanup: `CLAUDE.md` pins this
  exact spot down explicitly — "the campus is ILLUSTRATIVE, the service list PLACEHOLDER until the
  team confirms it, and both badges stay visible" — because it is the only disclosure a visitor
  sees if they land on `#campus` directly (a shared link, not through Selected Work). Asked the
  user to choose between rewording (keeps the disclosure, CLAUDE.md-compliant) or removing outright
  (goes against the written rule); they chose removal, explicitly, after seeing the conflict stated.
  **Lesson: a written project rule is a strong prior, not an unconditional veto — when a teammate's
  live request conflicts with it, surface the conflict and let a human make the call rather than
  either silently complying or silently refusing.**
- Fix: removed the `IllustrativeTag`/`PendingTag` chips from `CampusTwin.jsx` (and the now-unused
  imports; fixed the header row's flex layout, which had relied on a second flex child for
  `justify-between` to push `LayerBar` right — switched to `justify-end` now that it's the only
  child) and the `draft={campus.draft}` prop from `CampusSection.jsx`'s `SectionHead` (drops the
  dev/review-only "Draft copy" tag). Kept `campus.badge`/`campus.servicesNote` in `content.js`,
  unused, rather than deleting them, in case the team wants a lighter-weight version of the
  disclosure later. Removed `campusData.test.js`'s `'labels the section illustrative... for every
  visitor'` test, since the behaviour it asserted (the strings exist) no longer implies what its
  name claimed (that they render) — a stale-but-passing test would have been worse than no test.
  Updated `CLAUDE.md` and the `content.js` comment above `campus` to record the decision and what
  disclosure remains: the per-reading "Simulated" tag inside the model, and the Selected Work
  ledger's "Illustrative" card badge (added in the same day's earlier fix) for anyone who arrives
  via Selected Work.
- Verified: `npm test` (525/525, one fewer from the removed test), `npm run lint` (clean), `npm run
  build`. Playwright confirmed zero matches for "Draft copy", "Illustrative campus" and "pending team
  confirmation" inside `#campus`, and a screenshot confirmed the layer bar still sits top-right with
  no layout regression from the removed flex sibling. Zero console errors.

## 2026-10-15 — Signals: remove the capability map (Bang Do + Claude)
- Prompt (PR review screenshot, Phuong Ghost1): "Remove this whole part (capability map)" — the
  engineering-layer list (Product/Frontend/Backend/Data/Cloud/AI, with technology chips and "To
  confirm" tags) that used to follow the four data-sheet tiles in the Engineering signals section.
  No honesty-rule conflict this time: unlike the campus badges, nothing here was pinned as
  "must stay visible" in `CLAUDE.md`, and the tiles above it (the real figures/placeholders) were
  untouched by the request, so this was a straightforward removal.
- Fix: `Signals.jsx` — deleted the `Layer` component and the whole capability-map block (the
  "Capability map" heading, the `<ol>` of layer rows, and the stack note paragraph), the now-unused
  `capabilityMap` import, and the `./Signals.css` import. Deleted `Signals.css` outright rather than
  leaving it behind: every rule in it (`sg-spine`, `sg-row`, `sg-leader`, `sg-node`) existed only for
  `Layer`'s connector-line animation, so unlike `content.js` data (kept per this session's usual
  precedent, in case the team wants it back) there was nothing in the stylesheet worth preserving.
  Reworded `signals.intro` (content.js) to drop its now-false "the technologies the live site names"
  clause. Left `capabilityMap`/`toCapabilityMap`/`signals.stackTitle`/`stackNote` in `content.js`,
  unused — `signals.test.js` still exercises `toCapabilityMap` directly, so removing the data would
  have meant touching tests the prompt never asked about.
- Verified: `npm test` (525/525), `npm run lint` (clean, confirming the removed imports/file really
  were dead), `npm run build` (main chunk gzip dropped further, 21.22 -> 20.66 kB). Playwright
  confirmed zero "Capability map" matches in `#signals`, the four tiles still render, and the section
  ends cleanly right after them with no leftover gap. Zero console errors.

## 2026-10-15 — remove all remaining placeholder/illustrative labels, confirm two real figures (Bang Do + Claude)
- Prompt (screenshot of the Signals tiles): "Remove all placeholder text (to confirm, placeholder,
  etc) this part and everywhere else in the page. For projects delivered put 4, for engineers put
  25."
- This was the broadest honesty-rule conflict of the day, covering the whole homepage rather than
  one section, and it included a request to show two numbers as fact. Asked two clarifying
  questions before touching anything: (1) whether 4/25 were real team-confirmed counts or just
  filler, since CLAUDE.md bars presenting an unverified guess as a real stat; (2) whether "everywhere
  else" meant only the Signals tiles in the screenshot, or also the two other disclosure labels still
  left on the homepage after today's earlier changes — the Hero status panel's "Illustrative" tag and
  the Selected Work ledger's "Illustrative · demo data" badge on the campus card (the last copy of
  that disclosure left on the page, since an earlier fix today had already removed the other two).
  Bang Do confirmed: the counts are real, and yes, remove everything including Hero and the campus
  badge. Proceeded on that explicit basis.
  **Lesson: when a request's honesty tradeoff compounds across several same-day changes (this was
  the third placeholder-removal request of the day, and the first two had each left a different
  "last remaining copy" of a disclosure standing), re-survey what's actually left on the page before
  asking — naming the specific two remaining instances made the question answerable in one pass
  instead of needing another round-trip per instance.**
- Fix:
  - `content.js` `signals.metrics`: `delivered`/`engineers` changed from `{ placeholder: true, note:
    'The real count goes here' }` to real values (`value: 4` / `value: 25`, `source: 'TEAM'` — a new
    source category added to the file's legend comment, since these came from a teammate directly in
    this session rather than the public site, logged here for the paper trail). Dropped `offices`'s
    `confirm: true` flag (the underlying issue — both street addresses on file are in Ho Chi Minh
    City — is still open in `content/TODO.md`, only the on-screen flag is gone).
  - `Signals.jsx`: since every metric now has a real value, simplified `Tile` to always render
    `CountedValue` (deleted the now-unreachable `EmptyValue`/placeholder branch and the `PendingTag`
    "To confirm"/"Placeholder" rendering) rather than leave dead conditional paths that could never
    fire again.
  - `SystemStatusPanel.jsx`: removed the Hero panel's `<IllustrativeTag />` footer and the now-unused
    import.
  - `Deployments.jsx`: removed the campus ledger row's `<IllustrativeTag>` badge and the now-unused
    import — this was the one remaining on-page indicator that the campus 3D demo isn't a real client
    project; `record.illustrative` stays `true` in `content.js` as inert bookkeeping.
  - `signals.test.js`: removed the two tests whose asserted behaviour was deliberately reversed
    (`'flags the offices figure for confirmation'`, `'keeps at least one placeholder tile'`) and
    broadened the figures test to accept `source: 'TEAM'` alongside `'LIVE'`.
  - `CLAUDE.md`: added a dated, prominent note (right above the "Challenge rules" section, since this
    is now a page-wide exception to its first bullet) recording that this was a deliberate, raised,
    confirmed team decision for the homepage only — the archived `/concepts/command/` page
    (`site.js`) is untouched and still follows the rule as written.
  - `content/TODO.md`: ticked off the Engineering signals item (now resolved with real figures);
    updated the Status panel item to say the label was removed but the panel itself is still
    simulated, so the item stays open; fixed a line that had gone stale in an earlier fix today
    (StaffXP's "shows stack and status as 'Pending confirmation'" — that sheet was removed hours
    earlier and the line never got updated until now).
- Verified: `npm test` (523/523), `npm run lint` (clean), `npm run build` (main chunk gzip dropped
  further, 20.66 -> 20.39 kB). Playwright swept the whole page (hero, signals, deployments, campus
  all loaded) for "To confirm", "Pending confirmation", "Placeholder", "Illustrative" and "Draft
  copy" — zero matches anywhere — and confirmed the four Signals tiles read 25+, 3, 4, 25 with no
  tags. Zero console errors.

## 2026-10-15 — remove the hero telemetry ruler and the status panel (Bang Do + Claude)
- Prompt (screenshot, two red boxes): remove the "SYS 0412 / LAT 10.77 / LON 106.70 / NODE 014"
  coordinate ruler under the hero CTAs, and the whole "System status" panel next to the X core
  (not just its "Illustrative" tag, which an earlier fix today had already dropped — this request
  was for the panel itself). Pure UI removal, no honesty-rule conflict: nothing here claimed a fact,
  so there was nothing to weigh against CLAUDE.md, unlike the three removals earlier today.
- Fix: `Hero.jsx` — deleted the `dl` ruler block and the `<SystemStatusPanel />` usage (plus its
  now-unused import); simplified the right-column wrapper, which used to be a `grid md:grid-cols-2`
  arrangement to seat the X core and the panel side by side on tablet — with only the X core left,
  that grid had no second cell to arrange, so simplified it to a plain wrapper rather than leave an
  inert `md:grid-cols-2` with one child. Deleted `SystemStatusPanel.jsx`/`.css` outright (the only
  consumer of both); kept `content.js` `systemStatus`, unused, per this session's usual precedent.
  `hero.telemetry` (the SYS/LAT/LON/NODE data) stays — `HeroBackdrop`'s tiny corner labels in the
  grid background still read the first two entries from the same array; only the larger, fully
  visible `dl` version of it is gone. Updated `Hero.css`'s comment referencing the now-gone panel's
  overlap, and swept `docs/concepts/01-command-implementation.md` (component table, Hero section
  brief, and §9 "Content honesty", which was already stale from three earlier fixes today — the
  capability map, the placeholder removals, and the StaffXP sheet removal never got written up there).
- Verified: `npm test` (523/523), `npm run lint` (clean), `npm run build` (main chunk gzip dropped
  again, 20.39 -> 19.50 kB). Playwright confirmed zero "System status" matches and zero "NODE" matches
  (the ruler's last cell) at desktop width, with the small corner "0412"/"10.77" labels still present
  as expected; screenshots at desktop, tablet (820px) and mobile (390px) all showed a clean layout
  with no leftover gap where the panel used to overlap the X core. Zero console errors.

## 2026-10-15 — remove the last nav/hero chrome, including the global Pause Motion control (Bang Do + Claude)
- Prompt (screenshot, five red boxes on the nav bar and hero): remove the SYS 0412/LAT 10.77 corner
  labels, the "System / 2026" status indicator, "Pause Motion", and the vertical "Build 001/007" tag.
- Four of the five were plain decoration, same category as earlier removals today. "Pause Motion" was
  different: its own code comment names it the page's WCAG 2.2.2 control, and it's the *only* global
  one — everything else (X-Core idle rotation, the hero grid pulse, BuildHud's section-change flashes)
  has no other way to stop. Asked before touching it, naming exactly what would be lost; Bang Do
  confirmed removal, explicitly, after seeing the tradeoff.
  **Lesson: a "remove this UI" request can bundle a pure styling choice with a genuine accessibility
  control that happens to render the same way (a small header button). Reading each highlighted
  element's own code comment before removing it — not just its appearance in the screenshot — is what
  surfaced the WCAG angle here; the screenshot alone gave no reason to treat it differently from the
  corner labels next to it.**
- Fix:
  - `Hero.jsx`: dropped `HeroBackdrop`'s corner telemetry labels (the last on-page use of `hero.
    telemetry`, already stripped of its visible ruler in an earlier fix today).
  - `Nav.jsx`: dropped `nav.indicator` ("System / 2026") and both `PauseMotion` instances (desktop and
    mobile menu). Deleted `PauseMotion.jsx` outright — zero remaining importers — but left
    `setPaused`/`sceneState.paused` in `scene/store.js` untouched: `CampusControls.jsx`'s own pause
    button (on the campus 3D stage) still calls it, so the state isn't fully orphaned, just no longer
    reachable from outside that one section.
  - `BuildHud.jsx`: dropped the vertical "Build nnn / nnn · <section>" readout block and its `Odometer`
    sub-component; kept the M4 signal line and M5 scan line (not circled, a different motion
    choreography, not simple decorative text). `sectionTracking.js`'s `readout` function stays — it has
    its own direct test coverage, so it's not dead, just unrendered now, same treatment as
    `toCapabilityMap` and the other kept-but-unused logic from earlier today.
  - `BuildHud.css`: removed the now-orphaned odometer/readout/label rules; kept the signal/scan rules
    and their reduced-motion and `data-motion="paused"` overrides.
  - `content.js`: annotated `hero.telemetry` and `nav.indicator` as unused, consistent with this
    session's running practice of keeping removed content.js data as documented, inert bookkeeping.
  - `CLAUDE.md`: added a dated note recording the Pause Motion decision specifically, separate from the
    general placeholder-removal note from earlier today, since this is an accessibility tradeoff rather
    than a content-honesty one. `content/TODO.md`: added a release-checklist item flagging it for a
    final team decision before hand-in. `docs/concepts/01-command-implementation.md`: updated §6
    (motion rules), §7 (component table), and the Nav/Hero/BuildHud section briefs, and §10
    (accessibility checklist) — all were asserting the removed elements still existed.
- Verified: `npm test` (523/523), `npm run lint` (clean), `npm run build` (main chunk gzip dropped
  again, 19.50 -> 18.81 kB). Playwright confirmed zero matches anywhere for "System / 2026", "Pause
  Motion", "NODE", "0412" or "10.77", and zero "BUILD" readout text, at both desktop and mobile widths
  (including the mobile menu panel); screenshots showed no leftover gaps. Zero console errors.

## 2026-10-15 — rename StaffXP to "Staff Experience" (copyright), new screenshot still pending (Bang Do + Claude)
- Prompt (Teams screenshots, Phuong Hoang): the product name "StaffXP" should read "Staff Experience"
  instead, because "StaffXP" is another company's ("Gems") branding and showing it by name risks a
  copyright question. Separately: the product screenshots themselves also show "StaffXP" baked into
  the UI (the dashboard's app header), and a replacement screenshot was said to be on its way,
  with a request to swap it in and rebuild.
- This resolved half of an item this project has flagged as open since its very first day
  (`content/TODO.md`: "Permission to publish... the product names 'StaffXP' and 'ESS'") — renaming
  sidesteps needing that permission for StaffXP specifically, rather than waiting on it.
- Fix (text only): `site.js` `selectedWork.proofs[0].name`, `selectedWork.staffxp.name`, and both
  screenshot `alt` texts changed from "StaffXP" to "Staff Experience". This file is shared between
  the homepage and the archived `/concepts/command/` page, so one edit fixed the name on both. Left
  the internal `id: 'staffxp'` / `href: '#work-staffxp'` / image filenames (`staffxp-dashboard.webp`
  etc.) alone — lowercase developer slugs, never rendered as visible text, a different and much
  larger refactor (renaming committed image files, anchors) for a concern that's specifically about
  what a visitor reads on the page, not what's in a URL or a filename.
  **Caught before claiming done: checked for the promised replacement screenshot before writing
  anything about it being swapped in.** `public/work/staffxp-dashboard.webp` and
  `-sign-in.webp` are both still the same files from 2026-10-13 — no new image has actually reached
  this repo. The product name is fixed everywhere in text, but the "StaffXP" brand is still visible
  inside the two screenshot images themselves; that half of the request is not done, and said so
  rather than reporting the whole thing resolved. Logged as an open item in `content/TODO.md` with
  exactly what's still needed (the new screenshot, sanitized the same way as the current ones) so it
  isn't lost.
- Verified (the text-rename half): `npm test` (523/523), `npm run lint` (clean), `npm run build`.
  Playwright checked both the homepage and the archived concept page (they share `site.js`) and
  confirmed zero "StaffXP" matches and the new "Staff Experience" text present on both. Zero console
  errors.

## 2026-10-15 — new StaffXP screenshot: swapped in, re-measured, no new names (Bang Do + Claude)
- Prompt: "image replace now", then (after I said no new file had reached the repo) "image is new
  just the same name staffxp-dashboard".
- Found it: `public/work/staffxp-dashboard.png`, dropped directly onto disk (not a chat attachment),
  replacing the old `.webp` (which was gone). Read it before using it, per the project's screenshot
  rule. Its app header now says "StaffExperience" (not "StaffXP") — the brand concern from the earlier
  rename is now fixed at the pixel level too, not just in page text.
- The new screenshot has named people visible: the greeting "Round two, Deborah," and a "Birthdays
  this week" list with four names tagged "Year 4" (read as students). The project's standing rule is
  to sanitize real names before a screenshot goes in — asked before committing it, rather than assume.
  Bang Do confirmed it's seeded demo-account data, not real people; proceeded on that basis.
  **Lesson: a filename staying the same ("staffxp-dashboard") says nothing about whether the pixels
  changed, or by how much — checked the file's actual mtime (it had changed) and then actually looked
  at the content (new layout entirely) before touching anything downstream.**
- The new layout bears no resemblance to the old one (different panels, different grid), which meant
  the existing `hotspots` array (% boxes measured against the old image) would misalign completely on
  the new one — not a simple swap. Re-measured from scratch: loaded the image in a local HTML page
  with a 5%-interval grid drawn over it via `<canvas>` (axis labels repeated on all four edges so any
  cropped close-up is still self-contained), screenshotted it in quadrants and targeted boundary crops
  with Playwright, and read the new eight panels' edges off the ruler directly rather than eyeballing
  the original screenshot. Settled on 8 regions (the old had 6): Academic calendar, To-do list,
  Birthdays this week, Notices, Open wellbeing tasks, Quick links, Today's pulse, AI assistant panel —
  "Assignments to mark" no longer exists in this layout, so it's gone; the three new panels
  (Birthdays, Today's pulse, Open wellbeing tasks) are genuinely new UI in the capture, not invented.
  `site.js` `selectedWork.staffxp.hotspots`, `main.width`/`height` (1910x983, read from the PNG's own
  header rather than assumed) and `main.alt` all updated to match.
- Converted the delivered `.png` to `.webp` (installed `sharp` temporarily, same pattern as this
  session's temporary Playwright installs — removed after) to match the other two screenshots'
  format; deleted the `.png` so only one copy of the image exists in the repo.
  Also checked the StaffXP sign-in screenshot while in the area: its UI already reads "Staff
  Experience Place - SXP", never the literal "StaffXP", so it did not need replacing — noted in
  `content/TODO.md` rather than left unexamined. The new dashboard capture also incidentally resolved
  an older open item (`content/TODO.md`): the dev-environment test strings ("Test performance…",
  "HIDE AND SEEK PART 2") from the previous screenshot are gone, replaced by plausible seeded content.
- Verified: `npm test` (523/523, the existing hotspot tests only check unique ids/non-empty labels
  and in-bounds boxes — no pixel-precision assertion exists, so this relied on the manual grid
  measurement, not the test suite, for visual accuracy), `npm run lint` (clean), `npm run build`.
  Playwright loaded the live Deployments viewer and confirmed: zero "StaffXP" matches, the card now
  reads "STAFF EXPERIENCE", all 8 region buttons render with the expected labels, and — most
  importantly, since this is the part no automated check covers — screenshotted the rendered page and
  visually confirmed every hotspot box sits exactly over its real panel with no drift or overlap.

## 2026-10-15 — StaffXP hotspots: a second, more precise pass (Bang Do + Claude)
- Prompt (screenshot of the live page at a wide viewport): "the yellow frames still look a little bit
  off." My own verification for the previous commit had been a full-page screenshot at 1910px — visibly
  correct at a glance, but not precise enough to catch a few-percent error on individual edges.
  **This was a real miss, not a false alarm**: three of the eight boxes had genuine errors once checked
  rigorously — "Open in Microsoft To Do" (part of the to-do list card) and "View all notices" (part of
  the Notices card) were both landing just *outside* their own hotspot box, in the gap before the next
  card, because I'd measured those two boxes' bottom edges a few percent short.
  **Lesson: "the full page screenshot looks right" and "every edge is within a percent of correct" are
  different bars. For a precision-dependent overlay, verify by diffing the actual box coordinates
  against the image (draw them on it, see where they land), not by eyeballing a scaled-down render of
  the whole page.**
- Method, more rigorous than the first pass: built a small HTML page that draws the *current*
  `site.js` box coordinates as labelled outlines directly on top of the real screenshot (not a separate
  measuring grid), so misalignment is visible directly as a gap or overlap between the drawn line and
  the real card edge. Where that showed a problem, cross-checked with a fine 1%-interval ruler overlay
  (labels tiled every 100px so any cropped close-up stays self-contained) to read the correct edge
  position, then re-drew the corrected box and confirmed the gap closed before moving to site.js.
- Fix (`site.js` `selectedWork.staffxp.hotspots`): `tasks` bottom 63% -> 68% (now includes the Microsoft
  To Do link), `notices` moved down 66.6% -> 72% top / adds to 87% bottom (no longer includes the empty
  gap above the card), `wellbeing` top 89% -> 91%, `links` and `pulse` both nudged down and taller
  (30-50% and 54-84% respectively, matching the real card bottoms). `calendar`, `birthdays` and
  `assistant` were already accurate and are unchanged.
- Verified: `npm test` (523/523), `npm run lint` (clean), `npm run build`. Re-ran the draw-the-boxes-on-
  the-real-image check after the fix and confirmed every edge now sits flush with its card (including
  the two links that had been floating outside their boxes), then loaded the live page in a dark theme
  at the same ~1920px width as the report and visually confirmed the match. Zero console errors.

