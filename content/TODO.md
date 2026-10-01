# Content still needed before demo day

Everything below is currently a placeholder in `src/content/site.js`. The challenge
rules require real content or a clearly-marked placeholder — nothing here should ship
to the deployed URL without one of these being resolved.

- [x] ~~Contact email~~ — confirmed real: `contact@xiontechs.com` (from live site
      screenshots).
- [x] ~~Social links~~ — confirmed real: facebook.com/xiontechs, linkedin.com/company/xiontechs.
- [x] ~~Logo~~ — real logo added at `public/XionTechs-Logo_s.png`, wired into Nav/Footer.
- [ ] **Testimonials** — get 2-4 real client quotes (name, role, company, quote text).
      Confirmed via full-page screenshots that the live homepage doesn't actually
      display a testimonials section at all — the markup found during initial HTML
      extraction is unrendered theme-demo leftover. Do not reuse it.
- [ ] **Case studies** — for each of the 3 listed (Cloud Security Service, Data
      Analytics System, IT Solution & Consultancy): real client/project name (or
      anonymized if under NDA), scope, stack used, outcome/metric. Confirmed these
      link to `wordpress.themeholy.com/webteck` (the theme vendor's own demo site) on
      the live page — also unedited placeholder content.
- [ ] **"Why Choose Us" accordion body copy** — only "Client Centricity Focus" was
      expanded in the screenshots; "Integrity & Ethical Standards" and "High Quality
      Delivery" body text wasn't visible. Get the real copy or write new copy the team
      signs off on.
- [ ] **FAQ answers** — only the first question ("How can we help your business?") was
      expanded in the screenshots. The other two answers weren't captured.
- [ ] **Team/about photos** — if the new design should show real team photos instead
      of icons, source them.
- [ ] **Hero headline + subline** — redesign copy in `company.heroHeadline` /
      `heroSubline` is PLACEHOLDER pending team sign-off.
- [ ] **AI Agentic Development pillar** — all copy in `pillars[0]` is PLACEHOLDER.
      Need: what agent work XionTechs actually delivers, 2–4 capability bullets, one
      outcome sentence.
- [ ] **Smart Agent Platform (IoT) pillar** — all copy in `pillars[1]` is PLACEHOLDER.
      Need: what the platform is, protocols/cloud targets, any reference deployment.
- [ ] **Roadmap (Explore → Pilot → Production → Scale)** — framing in `roadmap` is
      PLACEHOLDER; confirm it matches how the team actually engages.
- [ ] **CTA band copy** — `ctaBand` is PLACEHOLDER.

Once resolved, edit the corresponding value in `src/content/site.js` and remove the
`PLACEHOLDER` marker/comment.
