# XionTechs landing page redesign — design spec

Date: 2026-09-30
Branch: `feat/landing-redesign`
Status: awaiting review

## 1. Goal

Rebuild the single landing page so that a business decision-maker (CEO, COO,
founder) arriving at xiontechs.com understands within seconds that XionTechs
builds AI agents and smart connected platforms, trusts that the company can
deliver, and knows how to start. The page must feel bold and modern while
staying within the challenge rules: no invented facts, every unverified claim
clearly labeled as a placeholder.

### Decisions already made

| Topic | Decision |
|---|---|
| Primary visitor | Business decision-makers. Outcome-first copy, technical detail one click deeper. |
| Agentic / IoT pillar copy | No verified source yet. Ship clearly labeled placeholder copy; track in `content/TODO.md`. |
| Themes | Three: Classic Navy (default light), Midnight (dark), Aurum (warm light). Device dark-mode setting picks Midnight on first visit; user choice is remembered. |
| AI visualization | "Watch an agent work": three illustrative, labeled scenarios. |
| Chatbot | Scripted guide now. Answer lookup isolated in one module so a real AI backend can be added later without touching the UI. |
| Roadmap | "From idea to agent" engagement path (Explore → Pilot → Production → Scale). Replaces the Process section. |
| Build approach | Rework the existing Vite + React + Tailwind site. No new runtime dependencies. Vitest added as a dev dependency. |
| Empty sections | Testimonials hidden until real quotes exist. Case studies reduced to one honest "coming soon" strip. |

## 2. Page structure

Top to bottom, mapped to the visitor's questions:

| # | Section | Component | Visitor question | Change |
|---|---|---|---|---|
| 1 | Nav | `Nav.jsx` + `ThemePicker.jsx` | — | reworked: new links, theme picker, "Talk to us" button |
| 2 | Hero | `Hero.jsx` | What do you do? | reworked copy, buttons, trust line, SVG visual |
| 3 | Pillars | `Pillars.jsx` | Is this for me? | new; replaces `Services.jsx` 8-card grid |
| 4 | Agent demo | `AgentDemo.jsx` | Can you really do AI? | new |
| 5 | Why XionTechs | `WhyUs.jsx` | Can I trust you? | merges `WhoWeAre.jsx` + `About.jsx` |
| 6 | Roadmap | `Roadmap.jsx` | What's it like to work with you? | new; replaces `Process.jsx` |
| 7 | Case studies | `CaseStudies.jsx` | Proof? | reduced to a slim strip |
| 8 | FAQ | `FAQ.jsx` | Remaining doubts | kept |
| 9 | CTA + Contact | `Contact.jsx` | How do I start? | `CTA.jsx` merged in |
| 10 | Footer | `Footer.jsx` | — | kept |
| — | ChatGuide | `ChatGuide.jsx` | Quick answers anywhere | new floating bubble |

Nav links: Solutions (`#solutions`) · Agent Demo (`#demo`) · Why Us (`#why-us`) ·
How We Work (`#roadmap`) · FAQ (`#faqs`) · Contact (`#contact`).

Old files `Services.jsx`, `WhoWeAre.jsx`, `About.jsx`, `Process.jsx`, `CTA.jsx` are
deleted once their content has moved. `Testimonials.jsx` and the empty
`testimonials` array stay in the codebase but are removed from `App.jsx`.

### Where the existing content goes

All eight original services survive as capability bullets inside a pillar:

- **AI Agentic Development** — AI-Powered Solutions, AI-Driven Analytics, plus
  placeholder agent-specific bullets.
- **Smart Agent Platform (IoT)** — all placeholder.
- **Engineering & Cloud** — Product Engineering, Custom App Development,
  Low-code Solutions, Cloud Computing, Staffing Services, Product Co-Creation.

"Get IT Done" remains the brand tagline. The 25+ years / 3 offices / 20+ tech
stacks stats, the "Consumer-Centric" paragraph, the three values, the FAQ, and
all contact details are real (captured from the live site) and are reused
unchanged.

## 3. Theming

### Tokens

Every colour used by the page is a CSS custom property on `:root`, keyed by
`data-theme` on `<html>`:

| Token | Purpose | Classic Navy | Midnight | Aurum |
|---|---|---|---|---|
| `--bg` | page background | `#f8f9fb` | `#0a1a2e` | `#fbf7ef` |
| `--surface` | cards, panels | `#ffffff` | `#11253f` | `#ffffff` |
| `--ink` | body text | `#101826` | `#e8edf5` | `#1a1a1a` |
| `--muted` | secondary text | `#5b6474` | `#a3b1c6` | `#5f5a4f` |
| `--line` | borders | `#e2e5eb` | `#1e3350` | `#e9e2d3` |
| `--primary` | buttons, bubble | navy `#183860` | gold | gold |
| `--primary-ink` | text on primary | white | `#0a1a2e` | `#1a1a1a` |
| `--accent` | highlights, icons | gold | `#5b8bd0` | navy `#183860` |

The navy `#183860` is sampled from the logo wordmark. The gold is sampled from
the logo's "X" gradient during implementation; `#e5a52a` is the working
estimate until then. Exact values may be adjusted to pass WCAG AA contrast
(4.5:1 for body text, 3:1 for large text and UI components).

`tailwind.config.js` maps its colour names (`paper`, `ink`, `accent`, `line`,
…) to these variables using the `rgb(var(--x) / <alpha-value>)` pattern so
existing class names keep working and opacity modifiers still apply.

### Behaviour

- **Resolution order:** saved choice in `localStorage` (`xt-theme`) →
  `prefers-color-scheme: dark` → Midnight, else Classic Navy. Invalid stored
  values are ignored.
- **No flash:** an inline `<script>` in `index.html` applies the resolved theme
  to `<html>` before React loads. The React `ThemeProvider` reads the same
  value on mount.
- **Picker:** a palette icon button in the Nav opens a popover with three
  labeled swatches. Selecting one sets `data-theme`, saves it, and closes the
  popover. Escape closes; focus returns to the button.
- **Transition:** `transition: background-color, color 200ms` on themed
  surfaces, disabled under `prefers-reduced-motion: reduce`.
- **Logo in Midnight:** a light variant of the logo is used if one can be
  produced cleanly; otherwise the PNG sits on a light rounded chip.

### Code

```
src/theme/
  themes.js        THEMES = ['navy','midnight','aurum'], DEFAULT, resolveTheme(stored, prefersDark)
  ThemeProvider.jsx context + useTheme() hook; applies data-theme, persists
src/components/ThemePicker.jsx
src/index.css      :root[data-theme=…] token blocks
```

## 4. Agent demo — "Watch an agent work"

Section id `#demo`. Heading: "See what an AI agent does for your business."

Three tabs, each a scenario of exactly five steps with fixed roles:

| Step | Role | Icon |
|---|---|---|
| 1 | Request | inbox |
| 2 | Understand | brain |
| 3 | Check systems | plug |
| 4 | Act | zap |
| 5 | Outcome | check |

Scenarios (content in `site.js`, marked `// ILLUSTRATIVE: invented demo
scenario, not a client claim`):

- **Customer Support** — order-status question → identifies intent → queries
  order system and shipping tracker → replies with tracking link, flags late
  delivery → "Customer answered instantly; your team only sees the exceptions."
- **Inventory & Orders** — low-stock signal → recognises reorder need →
  checks sales history and supplier lead times → drafts a reorder for approval
  → "Stock-outs caught before they happen; a human approves, not chases."
- **Smart Factory (IoT)** — vibration sensor spike → identifies anomaly →
  checks maintenance history and shift roster → schedules technician, alerts
  shift lead → "Downtime prevented instead of repaired."

Outcomes are words only. No numbers, percentages, or durations.

### Behaviour

- Steps reveal sequentially, ~1.2 s apart, with a connector line filling
  between them. Playback starts when the section enters the viewport
  (`IntersectionObserver`) and pauses when it leaves.
- Controls: Replay, Pause/Play. Switching tabs restarts playback.
- Tabs follow the WAI-ARIA tabs pattern (arrow keys, `role="tablist"`).
- Under `prefers-reduced-motion`, all five steps render at once.
- A visible badge on the panel: "Illustrative scenario — not a client case
  study."

## 5. ChatGuide — "Ask XionTechs"

### UI

- Floating round button, bottom-right, `--primary` colour, 56 px. Opens a
  360×480 px panel; full-screen below 480 px viewport width.
- Header label: "Guided assistant · answers from this site." It never presents
  itself as a live AI.
- Greeting, then suggestion chips:
  - What can an AI agent do for my business?
  - What is the Smart Agent Platform?
  - How does a project start?
  - Where are your offices?
  - Show me an agent demo
  - Talk to a human
- Free-text input. Submitting sends the text to the answer engine.
- Each answer: short text + zero or more action buttons. Action types:
  `scroll` (to a section id; closes the panel), `copy` (copies text, shows
  "Copied"), `link` (external href).
- Fallback answer: "I'm a guided assistant and don't have an answer for that
  yet — here's how to reach the team." followed by email and phone actions.
- History persists in `sessionStorage` (`xt-chat`) for the tab's lifetime.
- One-time nudge bubble ("Hi 👋 Need a quick answer?") 8 s after load, dismissed
  on any interaction, never shown again in that session. The panel never
  auto-opens.
- Escape closes; focus is trapped inside the panel while open and returns to
  the bubble on close.

### Code

```
src/chat/
  answerEngine.js   export async function getAnswer(question, ctx) → { text, actions }
  intents.js        ordered rules: { id, keywords[], chipLabel?, answer: () => {text, actions} }
src/components/ChatGuide.jsx   UI only; calls getAnswer()
```

- `getAnswer` is `async` from day one. Replacing it with a serverless AI call
  changes only `answerEngine.js`.
- Answers are built from `site.js` exports (`contact`, `roadmap`, `pillars`,
  `faqs`), never from copied strings. Placeholder content surfaces with its
  placeholder label intact.
- Matching: lower-cased input, first rule whose any keyword is a substring
  match wins; chips map to a rule id directly.

## 6. Hero, Pillars, Roadmap, remaining sections

### Hero

- Headline: "AI agents and smart platforms that **get IT done** for your
  business." Accent colour on "get IT done".
  `// PLACEHOLDER: new positioning copy, pending team sign-off`
- Subline: "From your first AI pilot to connected operations at scale — built
  by a team with 25+ years of engineering leadership." (25+ is real.)
- Buttons: "See an agent work" → `#demo` (primary); "Book a call" →
  `#contact` (secondary).
- Trust line: Dallas · Ho Chi Minh City · Da Nang (real).
- Visual: inline SVG of connected nodes forming an "X", stroked in
  `--accent`; re-themes automatically.

### Pillars (`#solutions`)

Three cards: icon, title, one-line outcome, 3–5 capability bullets, "Learn
more" that expands an inline detail panel (no modal). Cards whose copy is
placeholder show a small "Draft copy" tag driven by a `placeholder: true`
flag in `site.js`. Engineering & Cloud uses real service copy and has no tag.

### Roadmap (`#roadmap`)

Four stages: Explore → Pilot → Production → Scale. Each has `what you get`,
`your involvement`, `typical next step`. No durations or prices. Horizontal
on ≥ 1024 px, vertical below. Stages highlight as they scroll into view
(`IntersectionObserver`); all highlighted under reduced motion.
`// PLACEHOLDER: engagement model framing pending team sign-off`

### Why XionTechs (`#why-us`)

Three real stat tiles, the "Consumer-Centric" paragraph and bullets, the
three values (two keep their existing placeholder markers).

### Case studies (`#work`)

Single strip: "Client case studies are being prepared — ask us for references
on a call." + "Book a call" button. The three placeholder entries remain in
`site.js` for later use but are not rendered as cards.

### CTA + Contact (`#contact`)

One band. Left: "Ready to explore your first agent?" + short line. Right:
email (copyable), both phones, both addresses, social links.

### Housekeeping

- `CLAUDE.md`: replace the "green accent" description with the three-theme
  system and point to `src/theme/`.
- `content/TODO.md`: add pillar copy, hero copy, roadmap copy, chat answer
  review.
- `PROMPT_LOG.md`: entry for this brainstorming session and one per feature
  commit.

## 7. Testing and verification

### Automated (Vitest, dev dependency only)

- `answerEngine`: each chip returns its expected rule; keyword matching;
  unknown input returns fallback with contact actions; answers contain live
  `site.js` values (e.g. `contact.email`).
- `resolveTheme`: stored beats device; device beats default; invalid stored
  value ignored.
- Content guard: scans every string exported from `site.js`; fails on
  "lorem" (case-insensitive); fails if any `agentScenarios` entry lacks
  `illustrative: true`.

### Build checks per commit

- `npm run lint`, `npm run build`, `npm test` pass.
- Bundle budget: main JS chunk ≤ current build + 15 KB gzipped. Baseline is
  recorded in `PROMPT_LOG.md` at the start of implementation.

### Manual browser checklist (before completion)

For each of the three themes at 1280 px and 390 px:
- No flash of wrong theme on reload; logo readable in Midnight.
- Agent demo: all three scenarios play and replay; reduced-motion shows all
  steps at once.
- ChatGuide: every chip works; every action scrolls or copies correctly; Esc
  closes; keyboard-only navigation works.
- DevTools contrast spot-check on text over `--primary` and `--accent`.
- Stop the dev server afterwards via `netstat` / `taskkill` (CLAUDE.md).

### Git

- All work on `feat/landing-redesign`, small commits per feature (themes,
  hero, pillars, demo, chat, roadmap, cleanup), under the user's own git
  identity.

## 8. Out of scope

- Real AI backend for the chat (decided later).
- Company history timeline.
- Multi-page routing, CMS, analytics, i18n.
- Sourcing real testimonials and case studies (tracked in `content/TODO.md`).
