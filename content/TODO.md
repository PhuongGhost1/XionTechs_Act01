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
`docs/concepts/01-command-v3-plan.md` (v3, rebuilt from zero). Open items before it could replace the main page:

- [ ] **Official logo**: only a 250 × 46 px navy PNG exists so far; a larger one is coming from the team. The
      concept uses a generated white-wordmark copy (`public/concepts/command/logo-reversed.png`, set in
      `content.js` `brand.logo`) at natural size. When the large logo arrives: regenerate the reversed copy
      and update the size.
- [x] ~~Brand yellow~~: team said to pick whatever looks good. The concept uses the brief's `#F5C400`
      (`--x-signal` in `command.css`).
- [x] ~~Stack decision~~: the `CLAUDE.md` rules on `feat/motion-3d` belong to the earlier concept, not this one.
      This concept follows the docs: `three` for the data core (lazy chunk; off for reduced motion, no WebGL,
      data saver).
- [ ] **StaffXP status and stack**: the brief's example says "Production" and ".NET / React / AI / Cloud".
      Neither is confirmed. The concept reuses the real screenshots already in `public/work/` (team said to
      use them for now) and shows stack and status as "Pending confirmation".
- [ ] **Engineering signals**: only `25+` years of leadership and `3` offices (see the offices item above) are stated on the live
      site, and both are shown with `Source: Live site, to verify`. The stack matrix marks React and .NET as Pending.
      Delivery metrics (projects, engineers, uptime) stay an honest empty gauge until verified input exists.
- [x] ~~Status panel~~: headed "Illustrative"; the brief's 98 % and build `#4821` were dropped. The activation bar counts modules
      coming online during boot and the build number is the real git commit count.
- [x] ~~Lab page~~: skipped for now (no such page exists); the link is left out of the navigation.
- [x] ~~Module names~~: the four modules (Software engineering, AI systems, Cloud & platform, Product development) are the
      status rows, the X arms (Code, AI, Cloud, Product) and the bays. The brief's "Data" arm has no matching service.
- [ ] **Case study descriptor**: the brief calls StaffXP an "enterprise workforce platform"; the record uses the verified
      "staff experience platform" (education). Confirm which wording the team wants.

## Concept 02: X / Architecture (`/concepts/architecture/`)

A design exploration from `docs/idea/02-X-Architecture.md`, built as a separate page. Spec:
`docs/concepts/02-architecture-plan.md`. Line-type rule on the page: solid = confirmed, dashed = illustrative or pending.
Open items before it could replace the main page:

- [ ] **Official logo**: same as Concept 01. Only a 250 × 46 px navy PNG exists; the navy sheets use a generated
      white-wordmark copy (`public/concepts/architecture/logo-reversed.png`). The X mark drawn in the finale and the hero
      is built from two strokes (`ui/Marks.jsx`), not traced from the logo. Replace both when a vector logo arrives.
- [x] ~~Palette~~: the brief's tones are used as written (`#F7F6F1`, `#08234A`, `#F4C400`, `#D9DEE5`, `#101820`). Every
      text pair is checked by `model/tokens.test.js`; yellow is never text on paper (1.5:1).
- [ ] **StaffXP technology**: the brief's hover values (React, .NET, MySQL, AI services) and its MOBILE / ADMIN / CRM / HR
      nodes are not confirmed. Sheet 05 builds its five layers only from what the screenshots show and reads
      `Pending confirmation` for technology. `content.test.js` fails if those names appear in the StaffXP copy.
- [ ] **StaffXP dashboard screenshot** still shows the dev environment's test records (see Evidence above).
- [ ] **Selected work**: Problem and Architecture use the verified descriptors, Technology and Outcome are dashed
      placeholders. Real outcomes, metrics and technology per project are needed before they can replace the placeholders.
- [ ] **Agent sheet** (A-006.2) is an illustrative scenario, not a client project; capability labels stay generic.
- [ ] **Draft wording**: the level descriptions (sheet 02), capability layer sentences marked draft, the process lede and
      the Architect / Deploy sentences, the work lede, and the hero layer descriptions (`draft: true` in `content.js`).
      Shown with a "Draft" marker only in `npm run dev` and with `?review`. Section-local UI wording is draft too
      (the `copy.js` files in `architecture/`, `capabilities/`, `process/`, `staffxp/`, `work/`, `finale/`: for example
      "Key", "Includes", "Section A-A", "Press a level to hold its load path."). Wording only, no facts.
- [ ] **Metadata labels** `SYS.01 / ARCH.004 / BUILD.2026` come from the brief as decoration; `REV` is the real commit count.
      Decide whether to keep them in a production page.
- [ ] **Nav**: About and Contact both lead to sheet 07 (About text and the title block); there is no separate About page.
- [ ] **Fonts**: Archivo (variable width axis) and IBM Plex Mono load from Google Fonts like the other concepts. Self-host before launch.

## Not on the page (kept out on purpose)

- Testimonials: the live site's markup is unrendered theme-demo content. Add a section only
  with real, approved client quotes.
- Team photos: none until real, approved photos exist (plan §13).

## Concept 03 v2 (X / Edition "The Proof", `/concepts/edition-v2/`)

- [ ] **Cover correction**: keep `People → Engineers` as the first thing a visitor sees, or open on the clean headline?
- [ ] **Struck words** (`STRIKES` in `src/concepts/edition-v2/content.js`): team sign-off on the seven words.
- [ ] **Outcome and technology** for StaffXP and ESS: shown as dashed "pending confirmation" chips; no metrics yet.
- [ ] **StaffXP "The problem"** paragraph and the Cloud index descriptor are DRAFT wording.
- [ ] **Dispatches**: three DRAFT points of view assembled from main-page copy. Replace with real engineering
      stories (author, date) when they exist, or keep them unsigned.
- [ ] **Contributors**: no line for Designers (nothing verified to say) and no portraits. Needs real photography
      and permission before any name or face appears.
- [ ] **Not checked**: Safari and Firefox (container-query units in the ESS pan, `<dialog>` contents menu), a real
      phone, a screen-reader pass.
