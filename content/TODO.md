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
- [ ] **Pause Motion**: removed from the homepage nav on 2026-10-15 team review (CLAUDE.md), along with
      other decorative chrome. It was the page's only *global* control for the long-running ambient
      loops (X-Core idle rotation, hero grid pulse, BuildHud's section-change flashes) — WCAG 2.2.2
      asks for one. The campus section still has its own pause button, but nothing covers the rest of
      the page before a visitor scrolls that far. Worth a final decision before hand-in: leave it, or
      reintroduce a lighter-weight pause affordance somewhere.

## X / Command — now the homepage (`feat/promote-command-to-homepage`, 2026-10-13)

Originally a design exploration from `docs/idea/01-X-Command.md` (spec:
`docs/concepts/01-command-implementation.md`), built as a separate page at
`/concepts/command/`. The team decided to ship it as the real homepage; the previous
design (plan v3, the light navy/gold page) is now archived at `/concepts/command/`
instead — same URL slug, swapped content, see `PROMPT_LOG.md` for how and why.
`index.html` (root) now serves Command; `concepts/command/index.html` serves the
archived previous design, `noindex`'d. Items below are release-readiness open items
for the homepage, carried over from when this was still a concept:

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
      use them for now). 2026-10-15: the "Pending confirmation" sheet that used to show stack/status under
      the viewer was removed (team review, not a resolution) — the values are simply not shown anywhere now.
- [x] ~~**Engineering signals**~~: `25+` years of leadership and `3` offices are stated on the live site.
      Projects delivered and Engineers on the team were placeholders; Bang Do confirmed the real counts
      (4 and 25) on 2026-10-15 — `content.js` `signals.metrics`, `source: 'TEAM'`.
- [ ] **Status panel**: the hero panel (98 %, build `#4821`, Online) is still an illustrative interface, not
      live monitoring — nothing about it is real. 2026-10-15: the on-screen "Illustrative" label that used to
      mark this was removed on team review (CLAUDE.md, 2026-10-15 note); flagging this item as still open
      since the simulated panel itself wasn't replaced with anything real, only its disclosure was dropped.
- [x] ~~Lab page~~: skipped for now (no such page exists); the link is left out of the navigation.
- [ ] **Module names**: the brief mixes `AI / Code / Data / Cloud` (scroll sequence) with Software engineering /
      AI systems / Cloud & platform / Product development (modules). The concept uses the second set.

### Smart school campus (Concept 01, section 05)

- [ ] **Service list**: the ten services on the model and the nine more in `campusData.js` (`slice: false`) are
      AI-drafted examples of school IoT. Confirm which XionTechs delivers, then drop the "pending team
      confirmation" badge (`campus.servicesNote` in `content.js`).
- [ ] **Device kinds and automations**: AI-drafted; confirm or replace with the real hardware and rules.
- [ ] **Classroom engagement analytics**: shown as anonymous, class-level shares with no face recognition and
      processing in the room. Confirm that matches the product and check the legal position before publishing
      (Vietnam Decree 13/2023 on personal data, the EU AI Act for any EU client).
- [ ] **Section copy** (`campus` in `content.js`) is DRAFT.
- [x] ~~Platform name~~: decided 2026-10-06, the page never names ThingsBoard (or another platform vendor).
      Its documentation is only the reference for the model's best practices.
- [ ] **Alarm rules** (`alarmRules` in `campusData.js`): thresholds, severities and actions are AI-drafted.
- [ ] Optional next slice: Sports hall and Canteen buildings, the remaining nine services, a real-data feed
      behind `simulate.js`.

## Not on the page (kept out on purpose)

- Testimonials: the live site's markup is unrendered theme-demo content. Add a section only
  with real, approved client quotes.
- Team photos: none until real, approved photos exist (plan §13).
