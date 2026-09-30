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
