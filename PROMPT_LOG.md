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

