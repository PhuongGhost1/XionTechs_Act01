# Content still needed before release

The redesign follows `docs/idea/XionTechs_Landing_Page_Redesign_Plan_v3.md` and the 3D / motion
brief `docs/idea/XionTechs_Landing_Page_3D_Motion_Automation_Plan.md`. Items below
are either placeholders shown with a visible label, or DRAFT copy that production visitors
see unmarked (open any build with `?review` to see the Draft markers). Resolve each one in
`src/content/site.js`, then tick it here.

## Done

- [x] Contact email `contact@xiontechs.com` and social links (from the live site).
- [x] Logo at `public/XionTechs-Logo_s.png`; favicon and OG image now use the logo colours.
- [x] Old placeholder copy removed by the v3 redesign: the "Why Choose Us" values, the old
      FAQ answers, the AI/IoT pillars, the roadmap durations, the CTA band and the three
      theme-demo case studies no longer appear anywhere.

## Evidence: Selected Work (plan §7–9, MOTION §13–15, §30)

- [x] StaffXP dashboard, StaffXP sign-in and ESS portal screenshots added to `public/work/`
      (2026-10-02), sanitized before commit: browser chrome cropped; teacher, student and
      employee names, the staff ID, class codes and the client's school and course-brand names
      replaced with sample values. Originals were never committed.
- [ ] **Permission to publish**: confirm the project owners allow these sanitized screens, the
      product names "StaffXP" and "ESS", and the visible product copy on the StaffXP sign-in.
- [ ] **Test data on the StaffXP dashboard**: calendar items ("Test performance…", "HIDE AND SEEK
      PART 2") and notices ("Test", "test x") are the dev environment's test records. Consider a
      screenshot of a seeded demo account instead.
- [ ] **Story tags**: confirm the four StaffXP tags with the project owner (plan §7).

## Draft copy to sign off

- [ ] AI Agents callouts (Understand / Decide / Act) in `aiAgents.callouts`.
- [ ] Team section body (`team.body`).
- [ ] FAQ answers (`faq.items`): questions are from the plan, answers are drafted.
- [ ] Engineering strip: confirm `.NET and APIs` and `React` are technologies the company
      wants to market (marked "Confirm" in review mode).
- [ ] Demo run-log heading (`sections.monitor`).
- [ ] Hero: node hints for "Request" and "Done", and the pause control labels (`hero.motion`).
- [ ] Agent demo UI words (`aiAgents.run`: phase chips, status lines, execution-log entries) and
      the drill fault words "Timeout" / "Offline" (`workflows[].drills[].fault`).
- [ ] Selected Work list headings: "On this screen", "Modules on this screen", and the hint
      "Scroll sideways to see the whole screen." (`selectedWork.staffxp` / `.ess`).
- [ ] Final CTA: accessible name of the completion steps (`finalCta.completionLabel`).

## Release checklist (plan §21)

- [ ] Company legal name: live site says "XionTech Joint Stock Company" (no "s").
- [ ] Office locations: the stat says Dallas, Ho Chi Minh City and Da Nang, but both street
      addresses are in Ho Chi Minh City. Confirm the offices and add the missing addresses.
- [ ] Leadership claim "25+ years of leadership experience" (live-site stat).
- [ ] Contact phone numbers.
- [ ] Production URL: `index.html` (canonical, OG, JSON-LD), `public/robots.txt` and
      `public/sitemap.xml` assume `https://xiontechs.com/`.
- [ ] Booking flow: "Talk to Us" opens an email. Add a booking URL only if one exists.
- [ ] Workflow capability labels in the demo ("AI model", "Integration", …) stay generic
      until the team confirms the real services per step.

## Concept 01 v2: X / COMMAND (`/concepts/command/`, branch `feat/concept-01-command-v2`)

A zero-state redesign built from `docs/idea/v2/`, as a separate page. Design and contract:
`docs/concepts/command-v2/` (state and history: `HANDOFF.md`). Decisions below were confirmed by the team on 2026-10-03.

- [ ] **Official logo**: only the 250 x 46 px PNG exists (no larger or vector version). The page uses it at native
      size (`public/concepts/command/logo-reversed.png`) plus a hand-traced X mark in `core/mark.js` for the
      converge ending. Replace with a vector if one ever arrives.
- [x] ~~Fonts, `--void`, yellow `#F5C400`, module grouping of the eight services, DEP-003 link to `/#ai-agents`,
      `mailto:` as the only conversion, StaffXP and ESS shown by name, LinkedIn/Facebook as FACT, no purple
      sign-in capture~~: confirmed (HANDOFF section 5).
- [ ] **Production status, stack and results** of StaffXP and ESS: shown as PENDING until the team confirms them.
- [ ] **Legal name and which offices are real**: omitted from the page, shown only under `?review`.
- [ ] **AI assistant "Felix"** visible in the StaffXP capture: confirm it may be named.
- [ ] **"25+ years of leadership"** wording: kept from the live site, confirm.
- [ ] **`/#ai-agents` on the deployed main page**: DEP-003 links there; confirm it stays live.
- [ ] **`og-image.png` and favicon**: regenerate from this design.
- [ ] **Case study metrics and client details**: none are invented; rows stay PENDING.

## Not on the page (kept out on purpose)

- Testimonials: the live site's markup is unrendered theme-demo content. Add a section only
  with real, approved client quotes.
- Team photos: none until real, approved photos exist (plan §13).
