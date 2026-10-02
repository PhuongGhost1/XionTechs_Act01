# Content still needed before release

The redesign follows `docs/idea/XionTechs_Landing_Page_Redesign_Plan_v3.md`. Items below
are either placeholders shown with a visible label, or DRAFT copy that production visitors
see unmarked (open any build with `?review` to see the Draft markers). Resolve each one in
`src/content/site.js`, then tick it here.

## Done

- [x] Contact email `contact@xiontechs.com` and social links (from the live site).
- [x] Logo at `public/XionTechs-Logo_s.png`; favicon and OG image now use the logo colours.
- [x] Old placeholder copy removed by the v3 redesign: the "Why Choose Us" values, the old
      FAQ answers, the AI/IoT pillars, the roadmap durations, the CTA band and the three
      theme-demo case studies no longer appear anywhere.

## Evidence: Selected Work (plan §7–9, §19)

- [ ] **StaffXP screenshots**: sanitized dashboard and sign-in screens (no names, staff IDs,
      school or client branding). Export as WebP to `public/work/staffxp-dashboard.webp` and
      `public/work/staffxp-sign-in.webp`, then set `src`, `width` and `height` on
      `selectedWork.staffxp.main` / `.secondary`.
- [ ] **ESS screenshot**: sanitized employee portal as `public/work/ess-portal.webp`; set
      `selectedWork.ess.screen.src` and move each `areas[].marker` onto its module.
- [ ] **Permission to name the products**: confirm "StaffXP" and "ESS" may appear publicly,
      and that both count as XionTechs-engineered work.
- [ ] **Story tags**: confirm the four StaffXP tags with the project owner (plan §7).

## Draft copy to sign off

- [ ] AI Agents callouts (Understand / Decide / Act) in `aiAgents.callouts`.
- [ ] Team section body (`team.body`).
- [ ] FAQ answers (`faq.items`): questions are from the plan, answers are drafted.
- [ ] Engineering strip: confirm `.NET and APIs` and `React` are technologies the company
      wants to market (marked "Confirm" in review mode).
- [ ] Demo run-log heading (`sections.monitor`).

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

## Not on the page (kept out on purpose)

- Testimonials: the live site's markup is unrendered theme-demo content. Add a section only
  with real, approved client quotes.
- Team photos: none until real, approved photos exist (plan §13).
