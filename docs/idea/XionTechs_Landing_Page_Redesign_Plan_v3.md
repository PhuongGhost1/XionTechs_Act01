# XionTechs Landing Page — UX/UI Redesign Plan v3

## 0. Executive direction

### Brand
- Company: XionTechs
- Slogan: Get IT Done
- Business model: software outsourcing / engineering partner
- Strategic focus: AI agents + software engineering
- Company stage: startup, approximately 2 years old
- Do not position XionTechs as an AI-only product company.

### Core positioning

> XionTechs builds AI-enabled software and provides the engineering capability to get real business work done.

The landing page should make three ideas clear:

1. XionTechs can build AI agents and automation.
2. XionTechs can build serious business / enterprise software.
3. XionTechs can provide engineering capacity for custom software delivery.

### Critical change from the previous direction

Do NOT force three "projects" into three visually identical case-study cards.

The provided screenshots only establish two real product/application stories:
- StaffXP / school staff experience platform
- ESS System / employee self-service / enterprise HR experience

The third proof point should be the AI Agent capability, using the existing interactive Agent Demo as the primary illustrative experience.

Do not invent a third real client project just to fill a 3-card layout.

---

# 1. Design principle

## Current problem

The current landing page has a strong visual system but several sections repeat the same pattern:
- eyebrow
- serif heading
- text
- bordered card
- screenshot/mock browser
- Draft copy badge

The new design should be more editorial and narrative.

## New narrative

Hero
→ What XionTechs does
→ AI capability
→ Real software we've engineered
→ How we work
→ Why XionTechs
→ Engineering / delivery capability
→ FAQ
→ Contact

The page should alternate visual rhythms:
- open editorial section
- dark technology section
- interactive AI experience
- full-bleed product showcase
- collage / layered screens
- process timeline
- proof / capabilities
- conversion CTA

Avoid stacking many bordered cards one after another.

---

# 2. Navigation

Keep the navigation simple.

### Desktop
Logo | Solutions | AI Agents | Selected Work | How We Work | Why Us | FAQ | Talk to us

### Recommendation
Use anchor navigation.

Do not expose "Agent Demo" as though it is a product page. It is a capability demonstration.

Possible labels:
- AI Agents
- Selected Work
- How We Work
- Why XionTechs
- FAQ

### CTA
Primary:
> Talk to us →

Secondary only where context requires it:
> See an agent work →

The CTA should not use `mailto:` while being labelled "Book a call" unless a real booking flow exists.

---

# 3. Hero

## Objective

Answer in 5 seconds:
- who XionTechs is
- what they build
- why AI is relevant
- that software engineering is still a core capability

## Recommended copy direction

Eyebrow:
> GET IT DONE

Headline:
> AI agents and software engineering for the work that matters.

Alternative:
> We build AI agents and software that get real work done.

Supporting copy:
> XionTechs helps businesses turn ideas, workflows, and operational problems into production-ready software — from AI agents to complete engineering teams.

CTA:
> See what we build

Secondary:
> Talk to us

## Visual

Replace the current static gold X graphic with an intelligent "connected system" visual.

Use a small abstract system:
Request
→ AI
→ Business Logic
→ Existing Systems
→ Human

The visual should subtly animate.

Do not make the hero look like a SaaS dashboard.

---

# 4. Solutions section

## Objective

Replace the current "three equal service cards" feeling.

Heading:
> One engineering partner. From AI to software.

Use three horizontal capability bands rather than equal-height cards.

### A. AI Agents
Short copy:
> Agents that understand requests, make decisions, use tools, and hand off exceptions.

Examples:
- Workflow automation
- AI routing / decisions
- Tool integration
- Human-in-the-loop

### B. Business Software
Short copy:
> Business applications designed around the way teams actually work.

Examples:
- Enterprise platforms
- CRM / operations
- Internal tools
- Workflow systems

### C. Engineering Teams
Short copy:
> Product, backend, frontend, cloud, and integration engineers when you need to build.

Examples:
- Product engineering
- Custom application development
- Cloud / APIs
- Dedicated engineering capacity

Use one small visual cue for each instead of a large card body.

---

# 5. AI Agents showcase

## Role

This is the flagship differentiator.

The existing Agent Demo is already the strongest interactive asset on the page.

## Important UX change

Do NOT show all controls immediately.

Default view:
- one scenario
- simple workflow
- play / pause
- clear agent activity
- one human approval moment

Advanced controls:
- Throw a problem at it
- Retry
- Escalate
- Run log
- Agent at work

These can be revealed after the user understands the basic flow.

## Section structure

Eyebrow:
> AI AGENTS

Heading:
> See an AI agent work through a real business workflow.

Copy:
> From incoming requests to decisions, system actions, and human approval — see how an agent can move work forward while your team handles the exceptions.

Then:
[interactive Agent Demo]

Then three capability callouts:
- Understand
- Decide
- Act

## Important labeling

The current demo is illustrative, not a client case study.

Keep:
> Illustrative scenario — not a client case study

Do not imply the support workflow is a production client implementation.

---

# 6. Selected Work — major redesign

## Objective

This section is where the provided real screenshots should be used.

### Do NOT create three identical project cards.

Use a magazine/editorial portfolio section.

Heading:
> Software we've engineered.

Supporting copy:
> Selected product experiences from the kinds of systems we build. Client identities and sensitive information are omitted where required.

---

# 7. Selected Work / Story 01 — StaffXP

## Evidence available

The provided screenshots show:
1. StaffXP sign-in / landing experience
2. StaffXP authenticated dashboard

These two screenshots should be treated as ONE project story, not two projects.

## Visual identity

This project should use a dark product-showcase treatment because the actual product UI is dark.

Make it visually distinct from the XionTechs light editorial site.

### Layout

Large full-width product canvas.

Top:
> EDUCATION / STAFF EXPERIENCE

Heading:
> A connected workspace for school staff.

Then large screenshot:
- use the StaffXP dashboard as the hero product image

The sign-in screen appears as an offset secondary panel.

Example:

             StaffXP dashboard
      ┌─────────────────────────────┐
      │                             │
      │                             │
      │                             │
      └─────────────────────────────┘

             ┌──────────────┐
             │ sign-in      │
             │ experience   │
             └──────────────┘

This is a layered product story, not a standard card.

## Supporting copy

Do not invent business outcomes.

Use capability-focused wording:
> A connected staff workspace bringing everyday activities, notices, wellbeing, tasks, and operational information into one experience.

Possible tags:
- Staff experience
- Business workflow
- Role-based platform
- Integrated operations

Only keep terminology that is approved by the project owner.

## Interaction

On scroll:
- main dashboard gently scales into view
- secondary sign-in panel slides from behind
- selected UI regions receive subtle highlights

Do not animate every element.

---

# 8. Selected Work / Story 02 — ESS

## Evidence available

The provided screenshot shows an employee self-service / ESS experience:
- profile
- employment
- skills & performance
- attendance
- rewards & benefits
- approval delegations
- org chart
- requests
- time off
- payslips
- courses / learning

This should become a separate project story.

## Visual identity

Use a clean enterprise/system visual treatment.

Unlike StaffXP:
- lighter framing
- structured grid
- information architecture emphasis
- role-based navigation
- enterprise workflow annotations

## Layout

Instead of a single screenshot floating beside text, use the screenshot as the foundation of an annotated product map.

Example:

                 ESS platform
┌───────────────────────────────────────────────┐
│ profile        │ requests │ tasks             │
│                │          │                   │
│ self service   │ time off │ learning          │
│                │          │                   │
└───────────────────────────────────────────────┘

Annotations:
- Employee profile
- Self-service requests
- Workforce information
- Skills & performance
- Time and attendance
- Learning

Only annotate modules actually visible in the screenshot.

## Suggested copy

Eyebrow:
> ENTERPRISE / ESS

Headline:
> Self-service software around the employee.

Supporting copy:
> A connected employee experience that brings everyday HR actions, workforce information, requests, and self-service workflows into one place.

Avoid unsupported claims about scale, user count, implementation time, or business results.

---

# 9. What about the third project?

Do NOT create a fake third client project.

Instead, use:

## "AI capability" as the third proof point

The existing interactive Agent Demo already provides this.

The page therefore has:

### Proof 01
StaffXP — product / application engineering

### Proof 02
ESS — enterprise / workflow engineering

### Proof 03
AI Agent Demo — AI / automation capability

This is much more credible than showing three invented case-study cards.

---

# 10. Optional "Engineering behind the work" section

After Selected Work, add a compact technical capability strip.

Heading:
> Built to fit your stack.

Show technology categories, not a random logo wall.

Example:
- .NET / APIs
- React
- Cloud
- Enterprise integrations
- AI / ML
- Data
- Automation

Only list technologies XionTechs actually wants to market.

If specific technology logos are shown, verify every logo before production.

---

# 11. How We Work

Keep the existing four-step idea, but redesign the visual.

Current:
Explore → Pilot → Production → Scale

Recommended wording:
> From idea to production, one step at a time.

### 01 Discover
Find the workflow or product opportunity worth solving.

### 02 Build
Turn the idea into a working pilot or product increment.

### 03 Integrate
Connect data, APIs, systems, users, and operational workflows.

### 04 Scale
Add capability, automation, and engineering capacity as the business grows.

## Visual

Use a single horizontal journey line, not four independent cards.

Desktop:
Discover ───── Build ───── Integrate ───── Scale

Each step expands on hover/focus.

Mobile:
Vertical timeline.

## Important

Remove unsupported duration claims such as:
- a few hours
- weekly check-ins
- quarterly review

unless the company explicitly approves them.

---

# 12. Why XionTechs

The current "Our Priority, Our Commitment, Our Solutions" section is too generic.

Replace with evidence-oriented pillars.

Possible structure:

## Engineering that understands the business
We build around workflows, not just features.

## AI where it creates leverage
We use agents and automation where they can remove repetitive work or accelerate decisions.

## Flexible delivery
Work with XionTechs for a focused build, a complete product team, or additional engineering capacity.

## Built for integration
Connect new software with the systems your business already depends on.

Avoid generic claims such as "best quality", "innovative", "industry-leading" unless supported.

---

# 13. Team / human trust section

Because XionTechs is a young company, do not manufacture a huge corporate credibility section.

Use a compact human section.

Heading:
> A small, senior-minded team focused on getting IT done.

Use:
- real team image if approved
- leadership / engineering background if factually approved
- short explanation of delivery approach

Do not use "25+ years" in a way that makes the company itself appear 25 years old.

If the 25+ figure refers to leadership experience, write it clearly:
> 25+ years of combined engineering leadership experience

Only if verified.

---

# 14. FAQ

Use questions that reduce buyer uncertainty.

Recommended:
- What kinds of AI agents can XionTechs build?
- Can an agent connect to our existing systems?
- Do you also provide traditional software engineering?
- Can we start with a small pilot?
- How do you keep humans in control of important decisions?
- Can you work with an existing engineering team?

Avoid marketing-heavy FAQ answers.

---

# 15. Final CTA

Heading:
> What would you build next?

Supporting copy:
> Tell us about the workflow, product, or engineering gap you're trying to solve.

Buttons:
> Talk to us →
> See an agent work →

This connects directly to the slogan:
> Get IT Done.

---

# 16. Visual system

## Brand colors

Use the uploaded XionTechs logo as the brand source of truth.

Primary:
- XionTechs navy
- XionTechs gold
- warm white / light neutral

## Typography

Keep the current editorial pairing:
- Serif for strategic headlines
- Sans-serif for interface/body

Do not overuse serif in UI components.

## Shape language

- medium rounded corners
- thin borders
- restrained shadows
- premium whitespace
- subtle gold accents

Avoid:
- excessive glassmorphism
- excessive gradients
- generic neon AI styling
- huge glowing purple blobs
- startup template visuals

---

# 17. Visual rhythm

Target rhythm:

[Light Hero]

[Light Solutions]

[Dark AI Agent section]

[Light Selected Work / StaffXP]

[Light / structured Selected Work / ESS]

[Light or dark Engineering strip]

[Light How We Work]

[Dark Why XionTechs]

[Light FAQ]

[Dark Final CTA]

This prevents the page from feeling like one continuous list of cards.

---

# 18. Asset plan

## Available now

### Asset A — StaffXP sign-in screen
Use as secondary/offset visual for StaffXP story.

### Asset B — StaffXP dashboard
Use as primary StaffXP product visual.

### Asset C — ESS employee profile / portal
Use as primary ESS product visual.

## Asset D — XionTechs logo
Use as source of truth for brand colors, navbar, footer, favicon, OG image.

## Assets NOT required

Do not wait for:
- 10 screenshots
- full project case studies
- perfect project documentation

The current 3 product screenshots are enough to create a strong first version.

---

# 19. Screenshot treatment

The screenshots are real product UI but contain potentially identifying data.

Before production:
- blur or replace personal names
- remove staff IDs
- remove organization names where confidential
- remove client branding where required
- replace sensitive data with safe synthetic data

Do not publicly deploy screenshots that violate project confidentiality.

---

# 20. Mobile

The mobile page should NOT simply stack desktop blocks.

## Hero
Text first, compact connected-system visual second.

## AI Demo
Use a simplified vertical workflow.

## StaffXP
Main dashboard screenshot first; sign-in screen becomes a smaller secondary image.

## ESS
Crop to the most informative portion of the interface or use a horizontally scrollable product frame.

## Selected Work
Keep each project story compact; avoid 3–5 huge screenshots per project.

---

# 21. Content governance

The previous implementation had many visible Draft copy / PLACEHOLDER labels. Remove all visible placeholder wording before production.

Use one internal content mechanism:
- `draft: true`
- or `status: "draft"`

Do not render development labels in production.

Before release, verify:
- company legal name
- office locations
- leadership experience claim
- technology claims
- client/project naming rules
- screenshot permissions
- contact email
- contact phone
- booking URL

---

# 22. Accessibility / quality

Keep the strong technical practices from the current implementation:
- reduced motion
- keyboard navigation
- semantic headings
- accessible tabs
- clear focus states
- lazy loading for heavy demo content
- mobile-friendly layouts

Also fix known issues from the existing implementation:
- sticky header anchor offset
- dead footer links
- incorrect "Book a call" mailto expectation
- mobile menu Esc
- favicon
- OG metadata
- JSON-LD
- sitemap / robots

---

# 23. Performance

The existing Agent Demo is already lazy-loaded and the current build is within the documented budget.

Keep:
- lazy loading
- viewport-based demo activation
- reduced-motion fallback

Avoid:
- huge background video
- multiple auto-playing videos
- very large unoptimized screenshots
- heavy animation libraries for simple motion

Compress real screenshots to WebP/AVIF where practical while keeping visual quality.

---

# 24. Implementation order for the coding/design agent

## Phase 1 — Foundation
- Replace current brand assets with approved XionTechs logo.
- Lock brand color tokens.
- Remove production theme picker.
- Establish typography and spacing system.
- Fix navigation labels.

## Phase 2 — Hero
- Redesign hero composition.
- Replace static X graphic with connected-system visual.
- Update messaging to AI + Software Engineering.

## Phase 3 — Solutions
- Replace three equal cards with capability bands.

## Phase 4 — AI Demo
- Keep current Agent Demo logic.
- Simplify initial state.
- Move advanced controls behind progressive disclosure.
- Keep "illustrative scenario" labeling.

## Phase 5 — Selected Work
Build two real project stories:
1. StaffXP
2. ESS

Use the three supplied screenshots.

Do NOT create a fake third case study.

## Phase 6 — How We Work
- Replace cards with journey timeline.

## Phase 7 — Why XionTechs
- Replace generic copy with four evidence-oriented pillars.

## Phase 8 — FAQ + CTA
- Rewrite buyer-focused questions.
- Build clear conversion CTA.

## Phase 9 — Production polish
- responsive
- accessibility
- SEO / OG
- favicon
- footer/contact links
- screenshot privacy review
- performance
- Lighthouse checks

---

# 25. Success criteria

After the redesign, a new visitor should be able to answer:

### In 5 seconds
What does XionTechs do?
> AI + software engineering.

### In 15 seconds
Why should I keep scrolling?
> There is an actual AI agent demonstration.

### In 30 seconds
Can they build real software?
> Yes — StaffXP and ESS show real product experiences.

### In 60 seconds
Can they work with my company?
> The delivery model and engineering capability are clear.

### Before leaving
What do I do next?
> Talk to XionTechs.

---

# 26. Non-goals

Do not:
- invent client case studies
- invent metrics
- invent testimonials
- make the company look older/larger than it is
- make the site look like an AI SaaS product
- add a complex animation just for visual novelty
- add more Agent Demo features before fixing the content/proof hierarchy

The goal is not "more features".

The goal is:
> stronger positioning + stronger proof + clearer conversion.
