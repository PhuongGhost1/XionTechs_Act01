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

## Concept 01: X / Command (`/concepts/command/`)

A design exploration from `docs/idea/01-X-Command.md`, built as a separate page. Spec:
`docs/concepts/01-command-implementation.md`. Open items before it could replace the main page:

- [ ] **Official logo**: only a 250 × 46 px navy PNG exists so far; a larger one is coming from the team. The
      concept uses a generated white-wordmark copy (`public/concepts/command/logo-reversed.png`, set in
      `content.js` `brand.logo`) at natural size. When the large logo arrives: regenerate the reversed copy
      and update the size.
- [x] ~~Brand yellow~~: team said to pick whatever looks good. The concept uses the brief's `#F5C400`
      (`--c-signal` in `command.css`).
- [x] ~~Stack decision~~: the `CLAUDE.md` rules on `feat/motion-3d` belong to the earlier concept, not this one.
      This concept follows the docs: `three` for the data core (lazy chunk; off for reduced motion, no WebGL,
      data saver).
- [ ] **StaffXP status and stack**: the brief's example says "Production" and ".NET / React / AI / Cloud".
      Neither is confirmed. The concept reuses the real screenshots already in `public/work/` (team said to
      use them for now) and shows stack and status as "Pending confirmation".
- [ ] **Engineering signals**: only `25+` years of leadership and `3` offices (see the offices item above)
      are stated on the live site. Real counts for projects delivered and engineers are placeholders.
- [ ] **Status panel**: the hero panel (98 %, build `#4821`, Online) is an illustrative interface and is labelled.
- [x] ~~Lab page~~: skipped for now (no such page exists); the link is left out of the navigation.
- [ ] **Module names**: the brief mixes `AI / Code / Data / Cloud` (scroll sequence) with Software engineering /
      AI systems / Cloud & platform / Product development (modules). The concept uses the second set.

## Not on the page (kept out on purpose)

- Testimonials: the live site's markup is unrendered theme-demo content. Add a section only
  with real, approved client quotes.
- Team photos: none until real, approved photos exist (plan §13).
