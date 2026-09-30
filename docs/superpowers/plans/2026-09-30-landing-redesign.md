# Landing Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the single XionTechs landing page for business decision-makers with a three-theme system, an animated "watch an agent work" section, a scripted chat guide with a swappable answer engine, and an engagement roadmap.

**Architecture:** Every colour becomes a CSS custom property keyed by `data-theme` on `<html>`, and Tailwind colour names map to those variables so existing class names keep working. New sections are one component each in `src/components/`, all copy lives in `src/content/site.js`, and the chat UI talks only to `src/chat/answerEngine.js`.

**Tech Stack:** Vite 5, React 18, Tailwind 3.4, lucide-react (named imports only), Vitest (dev only, node environment).

**Spec:** `docs/superpowers/specs/2026-09-30-landing-redesign-design.md`

## Global Constraints

- Branch: `feat/landing-redesign`. Commit as the user's own git identity (already configured: Phuong Hoang). End every commit message with `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.
- No new runtime dependencies. Only `vitest` is added, as a dev dependency.
- Icons: named imports from `lucide-react` only. Never `import * as`.
- Copy: every string in `site.js` is either captured from the live site or carries a `PLACEHOLDER` / `ILLUSTRATIVE` marker in a comment or the value. No "Lorem". No invented numbers, durations, or prices anywhere, including agent-scenario outcomes.
- Themes: exactly `navy` (default), `midnight`, `aurum`. `localStorage` key `xt-theme`. Chat history key `xt-chat` in `sessionStorage`.
- Contrast: body text ≥ 4.5:1, large text and UI ≥ 3:1 in every theme.
- Reduced motion: no timed animation under `prefers-reduced-motion: reduce`.
- Bundle budget: main JS chunk ≤ **71 kB gzipped** (baseline 56.02 kB + 15 kB). Check with `npm run build` at the end of every task that adds a component.
- `npm run lint`, `npm run build`, `npm test` must pass at every commit.
- Windows Git Bash: to stop a stray dev server use `netstat -ano | grep ":5173" | grep LISTENING` then `taskkill //F //PID <pid>`.

## Review Focus

1. **`localStorage` throws** (Safari private mode, blocked storage): the page must still render with the default theme and the picker must still switch themes for the session. Pinned in Task 2 (`ThemeProvider` wraps storage in try/catch; `resolveTheme` test for invalid input).
2. **Chat input that is empty, whitespace, or very long (> 500 chars):** must not add an empty message or crash; trim and cap. Pinned in Task 10 (`getAnswer('   ')` returns fallback) and Task 11 (submit handler ignores blank input).
3. **Keyword false positives**, e.g. "email" must not match the `agent` intent's `ai` keyword: matching is word-boundary based. Pinned in Task 10 test `does not match "ai" inside "email"`.
4. **Agent demo tab switched mid-playback:** timers from the previous scenario must be cleared, otherwise steps from two scenarios interleave. Pinned in Task 6 (effect cleanup clears the interval; manual check listed).
5. **Theme switched while chat panel is open / hero SVG visible:** everything must use tokens, no hardcoded hex in components. Pinned in Task 12 (grep step fails the task if any `#[0-9a-f]{3,6}` appears in `src/components` or `src/chat`).

---

## File map

| Path | Responsibility |
|---|---|
| `vite.config.js` | add Vitest `test` block |
| `package.json` | `test` script, `vitest` dev dep |
| `src/content/site.js` | all copy: new hero, nav, `pillars`, `agentScenarios`, `roadmap`, `ctaBand`, `caseStudiesNote`, `chat` |
| `src/content/site.test.js` | content guard (no lorem, scenarios flagged illustrative) |
| `src/index.css` | `:root[data-theme=…]` token blocks, transitions, reduced-motion, logo inversion |
| `tailwind.config.js` | colour names → `rgb(var(--x) / <alpha-value>)` |
| `index.html` | inline no-flash theme script |
| `src/theme/themes.js` | `THEMES`, `resolveTheme` |
| `src/theme/themes.test.js` | resolution order tests |
| `src/theme/ThemeProvider.jsx` | context, applies `data-theme`, persists |
| `src/components/ThemePicker.jsx` | palette popover |
| `src/components/Nav.jsx` | new links, picker |
| `src/components/Hero.jsx` | new copy, buttons, trust line, SVG |
| `src/components/Pillars.jsx` | three solution cards (replaces `Services.jsx`) |
| `src/components/AgentDemo.jsx` | scenario tabs + timeline |
| `src/components/WhyUs.jsx` | stats + who-we-are + values (replaces `WhoWeAre.jsx`, `About.jsx`) |
| `src/components/Roadmap.jsx` | four stages (replaces `Process.jsx`) |
| `src/components/CaseStudies.jsx` | slim strip |
| `src/components/Contact.jsx` | CTA band + contact details (absorbs `CTA.jsx`) |
| `src/chat/intents.js` | ordered rules built from `site.js` |
| `src/chat/answerEngine.js` | `getAnswer(question, ctx)` |
| `src/chat/answerEngine.test.js` | engine tests |
| `src/components/ChatGuide.jsx` | floating bubble + panel |
| `src/components/icons.js` | extended icon map |
| `src/App.jsx` | new section order |
| `CLAUDE.md`, `content/TODO.md`, `PROMPT_LOG.md` | docs |

---

### Task 1: Test infrastructure and content guard

**Files:**
- Modify: `package.json`, `vite.config.js`
- Create: `src/content/site.test.js`

**Interfaces:**
- Produces: `npm test` runs Vitest once (no watch). Later tasks add `*.test.js` files next to the code they test.

- [ ] **Step 1: Install Vitest**

Run: `npm install -D vitest@^2`
Expected: `package.json` devDependencies gains `"vitest"`.

- [ ] **Step 2: Add the test script and Vitest config**

In `package.json` scripts add: `"test": "vitest run"`.

Replace `vite.config.js` with:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.js'],
  },
})
```

- [ ] **Step 3: Write the content guard test**

Create `src/content/site.test.js`:

```js
import { describe, it, expect } from 'vitest'
import * as site from './site'

// Collect every string value in the exported content, however deeply nested.
function collectStrings(value, out = []) {
  if (typeof value === 'string') out.push(value)
  else if (Array.isArray(value)) value.forEach((v) => collectStrings(v, out))
  else if (value && typeof value === 'object') Object.values(value).forEach((v) => collectStrings(v, out))
  return out
}

describe('site content rules', () => {
  it('contains no lorem ipsum', () => {
    const offenders = collectStrings(site).filter((s) => /lorem/i.test(s))
    expect(offenders).toEqual([])
  })
})
```

- [ ] **Step 4: Run the test**

Run: `npm test`
Expected: `1 passed`.

- [ ] **Step 5: Record the bundle baseline in PROMPT_LOG.md**

Append to `PROMPT_LOG.md`:

```markdown
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
```

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vite.config.js src/content/site.test.js PROMPT_LOG.md
git commit -m "test: add vitest and content guard for site copy

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 2: Theme tokens, resolution, provider, picker

**Files:**
- Create: `src/theme/themes.js`, `src/theme/themes.test.js`, `src/theme/ThemeProvider.jsx`, `src/components/ThemePicker.jsx`
- Modify: `src/index.css`, `tailwind.config.js`, `index.html`, `src/main.jsx`, `src/components/Nav.jsx`, `src/components/IconBadge.jsx`, `src/components/FAQ.jsx`, `src/components/Footer.jsx`, `src/components/icons.js`

**Interfaces:**
- Produces: `useTheme()` → `{ theme: 'navy'|'midnight'|'aurum', setTheme(id) }`; Tailwind colour names `paper surface ink muted line primary primaryHover primarySoft primaryInk accent navy navyInk` (plus temporary aliases `accentHover`, `accentSoft` removed in Task 12).

- [ ] **Step 1: Write the failing theme-resolution tests**

Create `src/theme/themes.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { resolveTheme, THEMES, DEFAULT_THEME } from './themes'

describe('resolveTheme', () => {
  it('uses a valid stored theme over the device preference', () => {
    expect(resolveTheme('aurum', true)).toBe('aurum')
  })
  it('falls back to midnight when the device prefers dark', () => {
    expect(resolveTheme(null, true)).toBe('midnight')
  })
  it('falls back to the default when the device prefers light', () => {
    expect(resolveTheme(null, false)).toBe(DEFAULT_THEME)
  })
  it('ignores an invalid stored value', () => {
    expect(resolveTheme('neon', false)).toBe('navy')
    expect(resolveTheme('neon', true)).toBe('midnight')
  })
  it('exposes exactly three themes', () => {
    expect(THEMES.map((t) => t.id)).toEqual(['navy', 'midnight', 'aurum'])
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test`
Expected: FAIL, `Cannot find module './themes'`.

- [ ] **Step 3: Implement `themes.js`**

Create `src/theme/themes.js`:

```js
// Theme registry. Colour values live in src/index.css as CSS variables keyed by
// data-theme; the swatches here are only for the picker preview.
export const THEMES = [
  { id: 'navy', label: 'Classic Navy', swatch: ['#f8f9fb', '#183860', '#b7791f'] },
  { id: 'midnight', label: 'Midnight', swatch: ['#0a1a2e', '#e5a52a', '#5b8bd0'] },
  { id: 'aurum', label: 'Aurum', swatch: ['#fbf7ef', '#e5a52a', '#183860'] },
]

export const THEME_IDS = THEMES.map((t) => t.id)
export const DEFAULT_THEME = 'navy'
export const STORAGE_KEY = 'xt-theme'

export function resolveTheme(stored, prefersDark) {
  if (THEME_IDS.includes(stored)) return stored
  return prefersDark ? 'midnight' : DEFAULT_THEME
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test`
Expected: all pass.

- [ ] **Step 5: Define the token blocks in `src/index.css`**

Replace `src/index.css` with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Colour tokens as space-separated RGB so Tailwind opacity modifiers (text-ink/60) work.
   Navy #183860 is sampled from the logo wordmark. The gold is an estimate of the logo's
   "X" gradient; #b7791f is a darkened gold used where gold must pass contrast as text
   on a light background. */
:root,
:root[data-theme='navy'] {
  --bg: 248 249 251;
  --surface: 255 255 255;
  --ink: 16 24 38;
  --muted: 91 100 116;
  --line: 226 229 235;
  --primary: 24 56 96;
  --primary-hover: 18 44 76;
  --primary-soft: 229 235 243;
  --primary-ink: 255 255 255;
  --accent: 183 121 31;
  --navy: 10 26 46;
  --navy-ink: 248 249 251;
  color-scheme: light;
}

:root[data-theme='midnight'] {
  --bg: 10 26 46;
  --surface: 17 37 63;
  --ink: 232 237 245;
  --muted: 163 177 198;
  --line: 30 51 80;
  --primary: 229 165 42;
  --primary-hover: 240 184 74;
  --primary-soft: 46 44 34;
  --primary-ink: 10 26 46;
  --accent: 91 139 208;
  --navy: 17 37 63;
  --navy-ink: 232 237 245;
  color-scheme: dark;
}

:root[data-theme='aurum'] {
  --bg: 251 247 239;
  --surface: 255 255 255;
  --ink: 26 26 26;
  --muted: 95 90 79;
  --line: 233 226 211;
  --primary: 229 165 42;
  --primary-hover: 208 146 28;
  --primary-soft: 250 236 208;
  --primary-ink: 26 26 26;
  --accent: 24 56 96;
  --navy: 24 56 96;
  --navy-ink: 251 247 239;
  color-scheme: light;
}

html {
  scroll-behavior: smooth;
}

body {
  @apply bg-paper text-ink font-sans antialiased;
}

h1, h2, h3 {
  @apply font-display;
}

/* Theme switch fade. Applied to the elements whose colours come from tokens. */
.theme-fade,
body {
  transition: background-color 200ms ease, color 200ms ease, border-color 200ms ease;
}

/* The logo PNG is navy on transparent; invert it on the dark theme. */
:root[data-theme='midnight'] .logo-img {
  filter: brightness(0) invert(1);
}

@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }
  .theme-fade,
  body {
    transition: none;
  }
}
```

- [ ] **Step 6: Map Tailwind colours to the tokens**

Replace `tailwind.config.js` with:

```js
/** @type {import('tailwindcss').Config} */
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // All values resolve to CSS variables defined per data-theme in src/index.css.
        paper: token('bg'),
        surface: token('surface'),
        ink: token('ink'),
        muted: token('muted'),
        line: token('line'),
        primary: token('primary'),
        primaryHover: token('primary-hover'),
        primarySoft: token('primary-soft'),
        primaryInk: token('primary-ink'),
        accent: token('accent'),
        navy: token('navy'),
        navyInk: token('navy-ink'),
        // Temporary aliases so not-yet-rewritten components keep styling. Removed in Task 12.
        accentHover: token('primary-hover'),
        accentSoft: token('primary-soft'),
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Fraunces"', 'serif'],
      },
    },
  },
  plugins: [],
}
```

- [ ] **Step 7: Add the no-flash script to `index.html`**

Insert as the first child of `<head>`, before the `<meta charset>`:

```html
    <script>
      // Apply the saved/preferred theme before any CSS paints, to avoid a flash.
      // Keep in sync with src/theme/themes.js.
      (function () {
        var ids = ['navy', 'midnight', 'aurum'];
        var t = null;
        try { t = localStorage.getItem('xt-theme'); } catch (e) { /* storage blocked */ }
        if (ids.indexOf(t) < 0) {
          t = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'midnight' : 'navy';
        }
        document.documentElement.setAttribute('data-theme', t);
      })();
    </script>
```

Also update the `<meta name="description">` content to:
`XionTechs builds AI agents and smart connected platforms for businesses — from a first pilot to connected operations at scale.`

- [ ] **Step 8: Create `ThemeProvider.jsx`**

Create `src/theme/ThemeProvider.jsx`:

```jsx
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { DEFAULT_THEME, STORAGE_KEY, THEME_IDS, resolveTheme } from './themes'

const ThemeContext = createContext({ theme: DEFAULT_THEME, setTheme: () => {} })

function readInitial() {
  if (typeof document === 'undefined') return DEFAULT_THEME
  // index.html already set this before React loaded; trust it if valid.
  const current = document.documentElement.getAttribute('data-theme')
  if (THEME_IDS.includes(current)) return current
  let stored = null
  try {
    stored = localStorage.getItem(STORAGE_KEY)
  } catch {
    /* storage blocked */
  }
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
  return resolveTheme(stored, prefersDark)
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(readInitial)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const setTheme = useCallback((id) => {
    if (!THEME_IDS.includes(id)) return
    setThemeState(id)
    try {
      localStorage.setItem(STORAGE_KEY, id)
    } catch {
      /* storage blocked: theme still applies for this session */
    }
  }, [])

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  return useContext(ThemeContext)
}
```

Wrap the app in `src/main.jsx`:

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './theme/ThemeProvider'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
)
```

- [ ] **Step 9: Create `ThemePicker.jsx`**

Create `src/components/ThemePicker.jsx`:

```jsx
import { useEffect, useRef, useState } from 'react'
import { Palette } from 'lucide-react'
import { THEMES } from '../theme/themes'
import { useTheme } from '../theme/ThemeProvider'

export default function ThemePicker() {
  const { theme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const buttonRef = useRef(null)
  const popoverRef = useRef(null)

  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    function onClick(e) {
      if (!popoverRef.current?.contains(e.target) && !buttonRef.current?.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClick)
    }
  }, [open])

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-label="Choose colour theme"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink/70 transition hover:border-primary hover:text-primary"
      >
        <Palette className="h-4 w-4" strokeWidth={1.75} />
      </button>

      {open && (
        <div
          ref={popoverRef}
          role="menu"
          className="theme-fade absolute right-0 mt-2 w-48 rounded-xl border border-line bg-surface p-2 shadow-lg"
        >
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              role="menuitemradio"
              aria-checked={theme === t.id}
              onClick={() => {
                setTheme(t.id)
                setOpen(false)
                buttonRef.current?.focus()
              }}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-primarySoft ${
                theme === t.id ? 'font-semibold text-primary' : 'text-ink/80'
              }`}
            >
              <span className="flex overflow-hidden rounded-full border border-line">
                {t.swatch.map((c) => (
                  <span key={c} className="h-4 w-3" style={{ backgroundColor: c }} />
                ))}
              </span>
              {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 10: Update Nav, IconBadge, FAQ, Footer to the new colour names**

`src/components/Nav.jsx`: replace the whole file with:

```jsx
import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { company, nav } from '../content/site'
import ThemePicker from './ThemePicker'

export default function Nav() {
  const [open, setOpen] = useState(false)

  return (
    <header className="theme-fade sticky top-0 z-50 border-b border-line bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a href="#top" className="flex items-center">
          <img src={company.logo} alt={company.name} className="logo-img h-8 w-auto" />
        </a>

        <nav className="hidden gap-8 md:flex">
          {nav.map((item) => (
            <a key={item.href} href={item.href} className="text-sm text-ink/70 transition hover:text-ink">
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <ThemePicker />
          <a
            href="#contact"
            className="group hidden items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primaryInk transition hover:bg-primaryHover md:inline-flex"
          >
            Talk to us
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </a>
          <button
            className="md:hidden"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <div className="space-y-1.5">
              <span className="block h-0.5 w-6 bg-ink" />
              <span className="block h-0.5 w-6 bg-ink" />
              <span className="block h-0.5 w-6 bg-ink" />
            </div>
          </button>
        </div>
      </div>

      {open && (
        <nav className="flex flex-col gap-1 border-t border-line px-6 py-4 md:hidden">
          {nav.map((item) => (
            <a key={item.href} href={item.href} className="py-2 text-sm text-ink/80" onClick={() => setOpen(false)}>
              {item.label}
            </a>
          ))}
          <a href="#contact" className="mt-2 py-2 text-sm font-medium text-primary" onClick={() => setOpen(false)}>
            Talk to us →
          </a>
        </nav>
      )}
    </header>
  )
}
```

`src/components/IconBadge.jsx`: change the class string to
`bg-primarySoft text-primary ... group-hover:bg-primary group-hover:text-primaryInk` (replace `bg-accentSoft text-accent` and `group-hover:bg-accent group-hover:text-paper`).

`src/components/FAQ.jsx`: no colour changes needed (`text-accent` is still a valid highlight token). Change `text-ink/60` on the answer paragraph to `text-muted`.

`src/components/Footer.jsx`: replace the whole file with (the footer always sits on navy, so it keeps `brightness-0 invert` on the logo rather than the `logo-img` class):

```jsx
import { company, contact, footerBlurb, footerServiceLinks, footerCompanyLinks } from '../content/site'
import SocialIcon from './SocialIcon'

export default function Footer() {
  return (
    <footer className="theme-fade border-t border-line bg-navy text-navyInk/60">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 py-16 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <img src={company.logo} alt={company.name} className="h-8 w-auto brightness-0 invert" />
          <p className="mt-4 text-sm">{footerBlurb}</p>
          <div className="mt-4 flex gap-3">
            {contact.social.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-navyInk/20 text-navyInk/70 transition-all duration-300 hover:-translate-y-0.5 hover:scale-110 hover:border-primary hover:bg-primary hover:text-primaryInk"
                aria-label={s.label}
              >
                <SocialIcon name={s.icon} />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-navyInk">Address</h3>
          <ul className="mt-4 space-y-2 text-sm">
            <li>{contact.email}</li>
            {contact.phones.map((p) => (
              <li key={p}>{p}</li>
            ))}
            {contact.addresses.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-navyInk">Company</h3>
          <ul className="mt-4 space-y-2 text-sm">
            {footerCompanyLinks.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-navyInk">Services</h3>
          <ul className="mt-4 space-y-2 text-sm">
            {footerServiceLinks.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-navyInk/10 px-6 py-6 text-center text-sm">
        &copy; {new Date().getFullYear()} {company.legalName}. All Rights Reserved.
      </div>
    </footer>
  )
}
```

- [ ] **Step 11: Lint, build, run**

Run: `npm run lint && npm run build && npm test`
Expected: all pass; no new warnings.

Run `npm run dev`, open http://localhost:5173, use the palette button to switch all three themes, reload each — no flash. Stop the dev server (Ctrl+C; verify with `netstat -ano | grep ":5173" | grep LISTENING`).

- [ ] **Step 12: Commit**

```bash
git add index.html src/index.css tailwind.config.js src/main.jsx src/theme src/components/ThemePicker.jsx src/components/Nav.jsx src/components/IconBadge.jsx src/components/FAQ.jsx src/components/Footer.jsx
git commit -m "feat: three-theme system with CSS tokens, provider and nav picker

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3: New content in `site.js`

**Files:**
- Modify: `src/content/site.js`, `src/content/site.test.js`, `content/TODO.md`

**Interfaces:**
- Produces (all named exports from `src/content/site.js`):
  - `company.heroHeadline`, `company.heroHeadlineAccent`, `company.heroSubline`, `company.offices: string[]`
  - `nav: {label, href}[]`
  - `pillars: { id, title, icon, outcome, bullets: {title, desc}[], detail, placeholder: boolean }[]`
  - `agentScenarios: { id, label, icon, illustrative: true, steps: { role: 'Request'|'Understand'|'Check systems'|'Act'|'Outcome', text }[] }[]`
  - `roadmap: { stage, title, icon, get, involvement, next }[]`
  - `caseStudiesNote: string`, `ctaBand: { title, body }`, `chat: { greeting, assistantLabel, fallback }`
- Existing exports `stats`, `services`, `whoWeAre`, `whyChooseUs`, `values`, `faqs`, `contact`, `footer*`, `testimonials`, `caseStudies`, `company.tagline` stay unchanged. `process` and `cta` are removed.

- [ ] **Step 1: Extend the content guard test**

Append to `src/content/site.test.js` inside the `describe`:

```js
  it('flags every agent scenario as illustrative with exactly five steps', () => {
    expect(site.agentScenarios.length).toBe(3)
    for (const s of site.agentScenarios) {
      expect(s.illustrative).toBe(true)
      expect(s.steps.map((st) => st.role)).toEqual(['Request', 'Understand', 'Check systems', 'Act', 'Outcome'])
    }
  })

  it('keeps agent outcomes free of invented numbers', () => {
    for (const s of site.agentScenarios) {
      const outcome = s.steps[4].text
      expect(outcome).not.toMatch(/\d/)
    }
  })

  it('has three pillars and four roadmap stages', () => {
    expect(site.pillars.map((p) => p.id)).toEqual(['agentic', 'platform', 'engineering'])
    expect(site.roadmap.map((r) => r.stage)).toEqual(['Explore', 'Pilot', 'Production', 'Scale'])
  })
```

Run: `npm test` — expected FAIL (`agentScenarios` undefined).

- [ ] **Step 2: Update `company` and `nav`**

In `src/content/site.js` replace the `company` object and `nav` array:

```js
export const company = {
  name: 'XionTechs',
  legalName: 'XionTech Joint Stock Company',
  logo: '/XionTechs-Logo_s.png',
  tagline: 'Get IT Done', // real, from the live site
  // PLACEHOLDER: new positioning copy written for the redesign, pending team sign-off.
  // The old live-site headline was "Perfect IT Solutions For Your Business".
  heroHeadline: 'AI agents and smart platforms that get IT done for your business',
  heroHeadlineAccent: 'get IT done',
  // "25+ years" is real (live-site stats). The framing sentence is PLACEHOLDER copy.
  heroSubline:
    'From your first AI pilot to connected operations at scale — built by a team with 25+ years of engineering leadership.',
  // Real: office locations from the live site stats.
  offices: ['Dallas', 'Ho Chi Minh City', 'Da Nang'],
}

export const nav = [
  { label: 'Solutions', href: '#solutions' },
  { label: 'Agent Demo', href: '#demo' },
  { label: 'Why Us', href: '#why-us' },
  { label: 'How We Work', href: '#roadmap' },
  { label: 'FAQ', href: '#faqs' },
  { label: 'Contact', href: '#contact' },
]
```

- [ ] **Step 3: Add `pillars` after the `services` array**

```js
// Helper: reuse the real service copy inside the pillars so nothing is duplicated.
const svc = (title) => {
  const s = services.find((x) => x.title === title)
  return { title: s.title, desc: s.desc }
}

// Three solution pillars. `placeholder: true` renders a visible "Draft copy" tag.
export const pillars = [
  {
    id: 'agentic',
    title: 'AI Agentic Development',
    icon: 'Bot',
    // PLACEHOLDER: no captured site copy describes agentic work. Draft framing only.
    placeholder: true,
    outcome: 'PLACEHOLDER — Agents that handle routine work end to end, so your team only sees the exceptions.',
    bullets: [
      { title: 'PLACEHOLDER — Workflow agents', desc: 'Draft: agents that read requests, check your systems and act, with a human approving the exceptions.' },
      { title: 'PLACEHOLDER — Conversational assistants', desc: 'Draft: customer- and staff-facing assistants grounded in your own data.' },
      svc('AI-Powered Solutions'),
      svc('AI-Driven Analytics'),
    ],
    detail: 'PLACEHOLDER — Confirm with the team: typical agent use cases delivered, integration approach, and how outcomes are measured.',
  },
  {
    id: 'platform',
    title: 'Smart Agent Platform (IoT)',
    icon: 'Wifi',
    // PLACEHOLDER: no captured site copy describes an IoT platform. Draft framing only.
    placeholder: true,
    outcome: 'PLACEHOLDER — Connect devices, sensors and systems so agents can watch, decide and act on live operations.',
    bullets: [
      { title: 'PLACEHOLDER — Device & sensor connectivity', desc: 'Draft: bring machines, sensors and existing systems onto one platform.' },
      { title: 'PLACEHOLDER — Live monitoring & alerts', desc: 'Draft: anomalies surfaced and routed to the right person or agent.' },
      { title: 'PLACEHOLDER — Agent-driven actions', desc: 'Draft: agents that schedule maintenance, reorder parts, or escalate.' },
    ],
    detail: 'PLACEHOLDER — Confirm with the team: supported protocols, cloud targets, and reference deployments.',
  },
  {
    id: 'engineering',
    title: 'Engineering & Cloud',
    icon: 'Layers',
    placeholder: false,
    // Real: summarises the live-site service copy below.
    outcome: 'The product engineering, cloud and staffing expertise that turns a pilot into a product.',
    bullets: [
      svc('Product Engineering'),
      svc('Custom App Development'),
      svc('Low-code Solutions'),
      svc('Cloud Computing'),
      svc('Staffing Services'),
      svc('Product Co-Creation'),
    ],
    detail:
      'Delivered on Azure, AWS and GCP with modern platforms like Power Platform, Make, n8n, Retool and Bubble, by a team with 25+ years of leadership experience across three offices.',
  },
]
```

- [ ] **Step 4: Add `agentScenarios`**

```js
// ILLUSTRATIVE: invented demo scenarios, not client claims. Rendered with a visible
// "Illustrative scenario — not a client case study" badge. Outcomes are words only —
// no numbers, so nothing reads as a measured result.
export const agentScenarios = [
  {
    id: 'support',
    label: 'Customer Support',
    icon: 'MessageCircle',
    illustrative: true,
    steps: [
      { role: 'Request', text: 'A customer asks: “Where is my order #1042?”' },
      { role: 'Understand', text: 'The agent recognises an order-status question and pulls the order number.' },
      { role: 'Check systems', text: 'It queries the order system and the shipping tracker.' },
      { role: 'Act', text: 'It replies with the tracking link and flags that delivery is running late.' },
      { role: 'Outcome', text: 'Customer answered instantly; your team only sees the exceptions.' },
    ],
  },
  {
    id: 'inventory',
    label: 'Inventory & Orders',
    icon: 'TrendingUp',
    illustrative: true,
    steps: [
      { role: 'Request', text: 'Stock for a fast-moving part drops below its safety level.' },
      { role: 'Understand', text: 'The agent recognises a reorder situation, not a one-off dip.' },
      { role: 'Check systems', text: 'It checks recent sales, open orders and supplier lead times.' },
      { role: 'Act', text: 'It drafts a reorder with quantity and supplier, and sends it for approval.' },
      { role: 'Outcome', text: 'Stock-outs caught before they happen; a human approves instead of chasing.' },
    ],
  },
  {
    id: 'factory',
    label: 'Smart Factory (IoT)',
    icon: 'Factory',
    illustrative: true,
    steps: [
      { role: 'Request', text: 'A vibration sensor on a packaging line reports an unusual spike.' },
      { role: 'Understand', text: 'The agent identifies the pattern as an early bearing-wear signal.' },
      { role: 'Check systems', text: 'It checks the maintenance history and the shift roster.' },
      { role: 'Act', text: 'It schedules a technician for the next break and alerts the shift lead.' },
      { role: 'Outcome', text: 'Downtime prevented instead of repaired.' },
    ],
  },
]
```

- [ ] **Step 5: Replace `process` with `roadmap`**

Delete the `process` export and add:

```js
// PLACEHOLDER: engagement model framing written for the redesign, pending team sign-off.
// Replaces the live site's Discovery/Design/Development/Deployment steps. No durations
// or prices — those would be invented.
export const roadmap = [
  {
    stage: 'Explore',
    title: 'Find the right first use case',
    icon: 'Compass',
    get: 'A short workshop that maps your workflows and picks the one where an agent pays off first.',
    involvement: 'A few hours from the people who know the process.',
    next: 'A scoped pilot proposal.',
  },
  {
    stage: 'Pilot',
    title: 'One agent, one workflow',
    icon: 'FlaskConical',
    get: 'A working agent on real data, with a human approving every action.',
    involvement: 'Weekly check-ins and feedback on what the agent gets right or wrong.',
    next: 'A go/no-go decision backed by what you saw.',
  },
  {
    stage: 'Production',
    title: 'Integrated and monitored',
    icon: 'Rocket',
    get: 'The agent wired into your systems, with monitoring, fallbacks and support.',
    involvement: 'Sign-off on integrations and access.',
    next: 'A backlog of the next workflows to automate.',
  },
  {
    stage: 'Scale',
    title: 'More agents, connected operations',
    icon: 'TrendingUp',
    get: 'Additional agents, IoT and data platform work, and the engineering to keep it all running.',
    involvement: 'A quarterly roadmap review.',
    next: 'Ongoing partnership.',
  },
]
```

- [ ] **Step 6: Replace `cta` with `ctaBand`, add `caseStudiesNote` and `chat`**

Delete the `cta` export and add:

```js
// PLACEHOLDER: redesign copy, pending team sign-off. The live-site CTA read
// "We Make Awesome IT Services For Your Newly Business".
export const ctaBand = {
  title: 'Ready to explore your first agent?',
  body: 'Tell us about one workflow that eats your team’s time. We’ll come back with what an agent could do about it.',
}

// Real situation: no verified case studies yet (see content/TODO.md).
export const caseStudiesNote =
  'Client case studies are being prepared — ask us for references on a call.'

// Chat guide copy. The assistant is scripted; it never claims to be a live AI.
export const chat = {
  assistantLabel: 'Guided assistant · answers from this site',
  greeting: 'Hi — I can point you to the right part of this page or to the team. What would you like to know?',
  fallback: 'I’m a guided assistant and don’t have an answer for that yet — here’s how to reach the team.',
  nudge: 'Hi 👋 Need a quick answer?',
}
```

- [ ] **Step 7: Run tests**

Run: `npm test`
Expected: all pass.

`Process.jsx` and `CTA.jsx` import the removed `process` and `cta` exports, so the build would now fail. Remove them now (their replacements arrive in Tasks 8 and 9): in `src/App.jsx` delete the `Process` and `CTA` import lines and the `<Process />` and `<CTA />` JSX lines, then run `git rm src/components/Process.jsx src/components/CTA.jsx`. `Hero.jsx` still references the removed `company.promoLine`; it renders an empty banner until Task 4 rewrites it, which is acceptable.

Run: `npm run lint && npm run build` — expected: pass.

- [ ] **Step 8: Update `content/TODO.md`**

Append before the final paragraph:

```markdown
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
- [ ] **Chat guide answers** — review `src/chat/intents.js` wording once the pillar
      copy is real.
```

- [ ] **Step 9: Commit**

```bash
git add src/content/site.js src/content/site.test.js content/TODO.md src/App.jsx
git rm src/components/Process.jsx src/components/CTA.jsx
git commit -m "content: pillars, agent scenarios, roadmap and chat copy (labeled placeholders)

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 4: Hero

**Files:**
- Modify: `src/components/Hero.jsx`, `src/components/icons.js`

**Interfaces:**
- Consumes: `company.heroHeadline/heroHeadlineAccent/heroSubline/offices/tagline` from Task 3.

- [ ] **Step 1: Extend the icon map**

Replace `src/components/icons.js` with:

```js
// Central, explicit icon map. Named imports (not `import * as` from lucide-react) so the
// bundler can tree-shake — a wildcard import pulls in every icon in the library (~1MB+).
import {
  Layers,
  BarChart3,
  Handshake,
  UserPlus,
  Code2,
  Puzzle,
  BrainCircuit,
  Cloud,
  Award,
  MapPin,
  Cpu,
  Rocket,
  Bot,
  Wifi,
  MessageCircle,
  TrendingUp,
  Factory,
  Compass,
  FlaskConical,
  Inbox,
  Brain,
  Plug,
  Zap,
  CheckCircle2,
} from 'lucide-react'

export const iconMap = {
  Layers,
  BarChart3,
  Handshake,
  UserPlus,
  Code2,
  Puzzle,
  BrainCircuit,
  Cloud,
  Award,
  MapPin,
  Cpu,
  Rocket,
  Bot,
  Wifi,
  MessageCircle,
  TrendingUp,
  Factory,
  Compass,
  FlaskConical,
  Inbox,
  Brain,
  Plug,
  Zap,
  CheckCircle2,
}

// Step icons for the agent demo, in the fixed 5-step order.
export const stepIcons = [Inbox, Brain, Plug, Zap, CheckCircle2]
```

- [ ] **Step 2: Rewrite `Hero.jsx`**

```jsx
import { MapPin } from 'lucide-react'
import { company } from '../content/site'

function Headline() {
  const { heroHeadline, heroHeadlineAccent } = company
  const idx = heroHeadline.indexOf(heroHeadlineAccent)
  if (idx === -1) return heroHeadline
  return (
    <>
      {heroHeadline.slice(0, idx)}
      <span className="text-accent">{heroHeadlineAccent}</span>
      {heroHeadline.slice(idx + heroHeadlineAccent.length)}
    </>
  )
}

// Nine nodes on two diagonals form an "X", echoing the logo mark. Pure SVG so it re-themes.
const NODES = [
  [20, 20], [60, 60], [100, 100], [140, 140], [180, 180],
  [180, 20], [140, 60], [60, 140], [20, 180],
]

function NodeX() {
  return (
    <svg viewBox="0 0 200 200" className="h-full w-full text-accent" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6">
        <line x1="20" y1="20" x2="180" y2="180" />
        <line x1="180" y1="20" x2="20" y2="180" />
      </g>
      {NODES.map(([x, y], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={i === 2 ? 9 : 5}
          fill="currentColor"
          className="hero-node"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </svg>
  )
}

export default function Hero() {
  return (
    <section id="top" className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-6 pb-20 pt-16 md:pt-24 lg:grid-cols-[3fr_2fr] lg:items-center">
      <div>
        <p className="mb-4 inline-block rounded-full bg-primarySoft px-4 py-1 text-xs font-medium uppercase tracking-wide text-primary">
          {company.tagline}
        </p>

        <h1 className="max-w-3xl text-4xl leading-tight md:text-6xl md:leading-[1.05]">
          <Headline />
        </h1>

        <p className="mt-6 max-w-xl text-lg text-muted">{company.heroSubline}</p>

        <div className="mt-8 flex flex-wrap gap-4">
          <a
            href="#demo"
            className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-primaryInk transition hover:bg-primaryHover"
          >
            See an agent work
          </a>
          <a
            href="#contact"
            className="rounded-full border border-line px-6 py-3 text-sm font-medium transition hover:border-primary hover:text-primary"
          >
            Book a call
          </a>
        </div>

        <p className="mt-10 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
          <MapPin className="h-4 w-4 text-accent" strokeWidth={1.75} />
          {company.offices.map((o, i) => (
            <span key={o}>
              {o}
              {i < company.offices.length - 1 && <span className="ml-3 text-line">·</span>}
            </span>
          ))}
        </p>
      </div>

      <div className="mx-auto aspect-square w-full max-w-xs lg:max-w-sm">
        <NodeX />
      </div>
    </section>
  )
}
```

Append to `src/index.css` (before the reduced-motion block):

```css
/* Hero node pulse */
@keyframes hero-pulse {
  0%, 100% { opacity: 0.55; }
  50% { opacity: 1; }
}
.hero-node {
  animation: hero-pulse 2.4s ease-in-out infinite;
}
```

and inside the `@media (prefers-reduced-motion: reduce)` block add `.hero-node { animation: none; }`.

- [ ] **Step 3: Lint, build, view**

Run: `npm run lint && npm run build && npm test` — expected: pass; note the gzip size (must be ≤ 71 kB).
Run the dev server, check the hero at 1280 px and 390 px in all three themes, then stop it.

- [ ] **Step 4: Commit**

```bash
git add src/components/Hero.jsx src/components/icons.js src/index.css
git commit -m "feat: outcome-first hero with node-X visual and office trust line

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 5: Pillars (replaces Services)

**Files:**
- Create: `src/components/Pillars.jsx`
- Delete: `src/components/Services.jsx`
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `pillars` from Task 3, `iconMap` from Task 4.

- [ ] **Step 1: Create `Pillars.jsx`**

```jsx
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { pillars } from '../content/site'
import IconBadge from './IconBadge'
import { iconMap } from './icons'

export default function Pillars() {
  const [openId, setOpenId] = useState(null)

  return (
    <section id="solutions" className="theme-fade border-t border-line bg-surface/60">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <p className="text-xs font-medium uppercase tracking-wide text-accent">Solutions</p>
        <h2 className="mt-3 text-3xl md:text-4xl">Three ways we get IT done</h2>
        <p className="mt-3 max-w-xl text-muted">
          Start with an agent, connect your operations, and lean on a full engineering team when it’s time to build.
        </p>

        <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {pillars.map((p) => {
            const Icon = iconMap[p.icon]
            const isOpen = openId === p.id
            return (
              <article
                key={p.id}
                className="group theme-fade flex flex-col rounded-2xl border border-line bg-surface p-6 transition hover:border-primary/40"
              >
                <div className="flex items-start justify-between">
                  <IconBadge icon={Icon} />
                  {p.placeholder && (
                    <span className="rounded-full border border-dashed border-accent px-3 py-1 text-xs font-medium text-accent">
                      Draft copy
                    </span>
                  )}
                </div>
                <h3 className="mt-4 text-xl font-semibold">{p.title}</h3>
                <p className="mt-2 text-sm text-muted">{p.outcome}</p>

                <ul className="mt-5 space-y-2">
                  {p.bullets.map((b) => (
                    <li key={b.title} className="flex gap-2 text-sm text-ink/80">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                      {b.title}
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`pillar-detail-${p.id}`}
                  onClick={() => setOpenId(isOpen ? null : p.id)}
                  className="mt-6 inline-flex items-center gap-1 self-start text-sm font-medium text-primary"
                >
                  {isOpen ? 'Show less' : 'Learn more'}
                  <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && (
                  <div id={`pillar-detail-${p.id}`} className="mt-4 space-y-3 border-t border-line pt-4 text-sm text-muted">
                    {p.bullets.map((b) => (
                      <p key={b.title}>
                        <span className="font-medium text-ink">{b.title}.</span> {b.desc}
                      </p>
                    ))}
                    <p className="italic">{p.detail}</p>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Wire into `App.jsx`, delete `Services.jsx`**

In `src/App.jsx` replace `import Services from './components/Services'` with `import Pillars from './components/Pillars'` and `<Services />` with `<Pillars />`. Run `git rm src/components/Services.jsx`.

- [ ] **Step 3: Lint, build, view, commit**

Run: `npm run lint && npm run build && npm test` — pass, gzip ≤ 71 kB.
Dev server: three cards, "Draft copy" tag on the first two only, Learn more expands inline. Stop the server.

```bash
git add src/components/Pillars.jsx src/App.jsx
git commit -m "feat: three solution pillars replace the eight-card services grid

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 6: Agent demo

**Files:**
- Create: `src/components/AgentDemo.jsx`
- Modify: `src/App.jsx`, `src/index.css`

**Interfaces:**
- Consumes: `agentScenarios` (Task 3), `stepIcons`, `iconMap` (Task 4).

- [ ] **Step 1: Create `AgentDemo.jsx`**

```jsx
import { useEffect, useRef, useState } from 'react'
import { Pause, Play, RotateCcw } from 'lucide-react'
import { agentScenarios } from '../content/site'
import { iconMap, stepIcons } from './icons'

const STEP_MS = 1200
const TOTAL = 5

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
  )
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!mq) return
    const onChange = (e) => setReduced(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return reduced
}

export default function AgentDemo() {
  const reduced = usePrefersReducedMotion()
  const [active, setActive] = useState(0)
  const [shown, setShown] = useState(reduced ? TOTAL : 0)
  const [playing, setPlaying] = useState(true)
  const [inView, setInView] = useState(false)
  const sectionRef = useRef(null)
  const tabRefs = useRef([])

  // Play only while on screen.
  useEffect(() => {
    const el = sectionRef.current
    if (!el || !('IntersectionObserver' in window)) {
      setInView(true)
      return
    }
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.3 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // Advance one step per tick. Cleanup clears the timer so switching tabs never interleaves.
  useEffect(() => {
    if (reduced) {
      setShown(TOTAL)
      return
    }
    if (!playing || !inView || shown >= TOTAL) return
    const id = setInterval(() => setShown((n) => Math.min(n + 1, TOTAL)), STEP_MS)
    return () => clearInterval(id)
  }, [playing, inView, shown, reduced, active])

  function selectTab(i) {
    setActive(i)
    setShown(reduced ? TOTAL : 0)
    setPlaying(true)
  }

  function onTabKey(e) {
    const n = agentScenarios.length
    let next = null
    if (e.key === 'ArrowRight') next = (active + 1) % n
    if (e.key === 'ArrowLeft') next = (active - 1 + n) % n
    if (e.key === 'Home') next = 0
    if (e.key === 'End') next = n - 1
    if (next === null) return
    e.preventDefault()
    selectTab(next)
    tabRefs.current[next]?.focus()
  }

  const scenario = agentScenarios[active]
  const done = shown >= TOTAL

  return (
    <section id="demo" ref={sectionRef} className="mx-auto max-w-6xl px-6 py-20">
      <p className="text-xs font-medium uppercase tracking-wide text-accent">Agent demo</p>
      <h2 className="mt-3 text-3xl md:text-4xl">See what an AI agent does for your business</h2>
      <p className="mt-3 max-w-xl text-muted">
        Pick a situation. Watch how an agent takes it from request to result while your team only handles the exceptions.
      </p>

      <div role="tablist" aria-label="Agent scenarios" className="mt-10 flex flex-wrap gap-2" onKeyDown={onTabKey}>
        {agentScenarios.map((s, i) => {
          const Icon = iconMap[s.icon]
          const selected = i === active
          return (
            <button
              key={s.id}
              ref={(el) => (tabRefs.current[i] = el)}
              role="tab"
              id={`demo-tab-${s.id}`}
              aria-selected={selected}
              aria-controls={`demo-panel-${s.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => selectTab(i)}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                selected
                  ? 'border-primary bg-primary text-primaryInk'
                  : 'border-line text-ink/70 hover:border-primary hover:text-primary'
              }`}
            >
              <Icon className="h-4 w-4" strokeWidth={1.75} />
              {s.label}
            </button>
          )
        })}
      </div>

      <div
        role="tabpanel"
        id={`demo-panel-${scenario.id}`}
        aria-labelledby={`demo-tab-${scenario.id}`}
        className="theme-fade mt-6 rounded-2xl border border-line bg-surface p-6 md:p-8"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="rounded-full border border-dashed border-accent px-3 py-1 text-xs font-medium text-accent">
            Illustrative scenario — not a client case study
          </span>
          {!reduced && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPlaying((p) => !p)}
                aria-label={playing ? 'Pause' : 'Play'}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink/70 transition hover:border-primary hover:text-primary"
              >
                {playing && !done ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={() => selectTab(active)}
                aria-label="Replay"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink/70 transition hover:border-primary hover:text-primary"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        <ol className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-5 md:gap-4">
          {scenario.steps.map((step, i) => {
            const Icon = stepIcons[i]
            const visible = i < shown
            const isLast = i === TOTAL - 1
            return (
              <li
                key={step.role}
                className={`demo-step relative ${visible ? 'demo-step-visible' : ''}`}
                aria-hidden={!visible}
              >
                {i < TOTAL - 1 && (
                  <span
                    className="demo-connector absolute left-5 top-10 h-[calc(100%-1rem)] w-px bg-line md:left-10 md:top-5 md:h-px md:w-[calc(100%-2.5rem)]"
                    aria-hidden="true"
                  >
                    <span
                      className={`block h-full w-full origin-top bg-accent transition-transform duration-700 md:origin-left ${
                        i < shown - 1 ? 'scale-y-100 md:scale-x-100' : 'scale-y-0 md:scale-x-0'
                      }`}
                    />
                  </span>
                )}
                <div className="flex gap-4 md:block">
                  <span
                    className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${
                      isLast && visible ? 'border-accent bg-accent text-primaryInk' : 'border-line bg-surface text-accent'
                    }`}
                  >
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <div className="md:mt-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted">{step.role}</p>
                    <p className="mt-1 text-sm text-ink/90">{step.text}</p>
                  </div>
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Add step reveal CSS**

Append to `src/index.css` before the reduced-motion block:

```css
/* Agent demo step reveal */
.demo-step {
  opacity: 0;
  transform: translateY(8px);
  transition: opacity 400ms ease, transform 400ms ease;
}
.demo-step-visible {
  opacity: 1;
  transform: none;
}
```

Inside the `@media (prefers-reduced-motion: reduce)` block add:

```css
  .demo-step { opacity: 1; transform: none; transition: none; }
  .demo-connector > span { transition: none; }
```

- [ ] **Step 3: Wire into `App.jsx`**

Add `import AgentDemo from './components/AgentDemo'` and place `<AgentDemo />` directly after `<Pillars />`.

- [ ] **Step 4: Lint, build, manual check**

Run: `npm run lint && npm run build && npm test` — pass, gzip ≤ 71 kB.
Dev server checks, then stop it:
- Scroll to the section: steps appear one by one, connector fills.
- Switch tabs mid-play: the new scenario starts from step 1 with no leftover steps from the old one.
- Pause stops; Play resumes; Replay restarts.
- Arrow keys move between tabs.
- Emulate reduced motion in DevTools (Rendering → prefers-reduced-motion): all five steps visible, no controls.

- [ ] **Step 5: Log and commit**

Append to `PROMPT_LOG.md`:

```markdown
- Agent demo: three invented scenarios (support, inventory, smart factory) rendered with
  an always-visible "Illustrative scenario — not a client case study" badge, and a test
  that fails if any outcome line contains a digit, so no invented metric can slip in.
```

```bash
git add src/components/AgentDemo.jsx src/App.jsx src/index.css PROMPT_LOG.md
git commit -m "feat: 'watch an agent work' scenario timeline

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 7: Why XionTechs (merges WhoWeAre + About)

**Files:**
- Create: `src/components/WhyUs.jsx`
- Delete: `src/components/WhoWeAre.jsx`, `src/components/About.jsx`
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `stats`, `whoWeAre`, `whyChooseUs`, `values` (unchanged real content), `iconMap`.

- [ ] **Step 1: Create `WhyUs.jsx`**

```jsx
import { useState } from 'react'
import { CheckCircle2, Plus } from 'lucide-react'
import { stats, whoWeAre, whyChooseUs, values } from '../content/site'
import IconBadge from './IconBadge'
import { iconMap } from './icons'

export default function WhyUs() {
  const [openIndex, setOpenIndex] = useState(0)

  return (
    <section id="why-us" className="theme-fade border-t border-line bg-navy text-navyInk">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <p className="text-xs font-medium uppercase tracking-wide text-navyInk/50">{whyChooseUs.eyebrow}</p>
        <h2 className="mt-3 max-w-xl text-3xl md:text-4xl">{whyChooseUs.title}</h2>
        <p className="mt-4 max-w-xl text-navyInk/60">{whyChooseUs.body}</p>

        <dl className="mt-12 grid grid-cols-1 gap-8 border-t border-navyInk/10 pt-10 sm:grid-cols-3">
          {stats.map((s) => {
            const Icon = iconMap[s.icon]
            return (
              <div key={s.label} className="group">
                <IconBadge icon={Icon} size="sm" />
                <dt className="mt-4 font-display text-3xl">{s.value}</dt>
                <dd className="mt-1 text-sm font-medium text-navyInk/70">{s.label}</dd>
                <dd className="mt-2 text-sm text-navyInk/50">{s.desc}</dd>
              </div>
            )
          })}
        </dl>

        <div className="mt-16 grid grid-cols-1 gap-12 lg:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-navyInk/50">{whoWeAre.eyebrow}</p>
            <h3 className="mt-3 text-2xl">{whoWeAre.title}</h3>
            <p className="mt-4 text-navyInk/60">{whoWeAre.body}</p>
            <ul className="mt-6 space-y-3">
              {whoWeAre.bullets.map((b) => (
                <li key={b} className="flex items-start gap-3 text-sm text-navyInk/70">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  {b}
                </li>
              ))}
            </ul>
          </div>

          <div className="divide-y divide-navyInk/10 border-y border-navyInk/10">
            {values.map((v, i) => {
              const isOpen = openIndex === i
              return (
                <div key={v.title}>
                  <button
                    className="group flex w-full items-center justify-between py-5 text-left"
                    onClick={() => setOpenIndex(isOpen ? -1 : i)}
                    aria-expanded={isOpen}
                  >
                    <span className="text-sm font-semibold uppercase tracking-wide">{v.title}</span>
                    <Plus
                      className={`ml-4 h-4 w-4 shrink-0 text-navyInk/70 transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`}
                    />
                  </button>
                  {isOpen && <p className="pb-5 text-sm text-navyInk/60">{v.desc}</p>}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Wire and delete**

In `src/App.jsx` remove the `WhoWeAre` and `About` imports/JSX; add `import WhyUs from './components/WhyUs'` and `<WhyUs />` after `<AgentDemo />`. `git rm src/components/WhoWeAre.jsx src/components/About.jsx`.

- [ ] **Step 3: Lint, build, commit**

Run: `npm run lint && npm run build && npm test` — pass. Dev server: check the section is readable in all three themes (Midnight: navy section is slightly lighter than the page). Stop server.

```bash
git add src/components/WhyUs.jsx src/App.jsx
git commit -m "feat: merge stats, who-we-are and values into one Why XionTechs section

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 8: Roadmap

**Files:**
- Create: `src/components/Roadmap.jsx`
- Modify: `src/App.jsx`, `src/index.css`

**Interfaces:**
- Consumes: `roadmap` (Task 3), `iconMap`.

- [ ] **Step 1: Create `Roadmap.jsx`**

```jsx
import { useEffect, useRef, useState } from 'react'
import { roadmap } from '../content/site'
import IconBadge from './IconBadge'
import { iconMap } from './icons'

export default function Roadmap() {
  const [lit, setLit] = useState(() => new Set())
  const itemRefs = useRef([])

  useEffect(() => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduced || !('IntersectionObserver' in window)) {
      setLit(new Set(roadmap.map((_, i) => i)))
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const i = Number(e.target.dataset.index)
            setLit((prev) => (prev.has(i) ? prev : new Set(prev).add(i)))
          }
        })
      },
      { threshold: 0.5 },
    )
    itemRefs.current.forEach((el) => el && io.observe(el))
    return () => io.disconnect()
  }, [])

  return (
    <section id="roadmap" className="theme-fade border-t border-line bg-surface/60">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <p className="text-xs font-medium uppercase tracking-wide text-accent">How we work</p>
        <h2 className="mt-3 text-3xl md:text-4xl">From idea to agent, one step at a time</h2>
        <p className="mt-3 max-w-xl text-muted">
          Start small and low-risk. Each stage ends with something you can see and a decision you control.
        </p>
        <p className="mt-2 text-xs italic text-muted">Draft engagement model — pending team sign-off.</p>

        <ol className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-4 lg:gap-6">
          {roadmap.map((r, i) => {
            const Icon = iconMap[r.icon]
            const on = lit.has(i)
            return (
              <li
                key={r.stage}
                ref={(el) => (itemRefs.current[i] = el)}
                data-index={i}
                className={`roadmap-stage relative rounded-2xl border p-6 ${
                  on ? 'roadmap-stage-on border-primary/40 bg-surface' : 'border-line bg-surface/50'
                }`}
              >
                <div className="group flex items-center gap-3">
                  <IconBadge icon={Icon} size="sm" />
                  <span className="text-xs font-medium uppercase tracking-wide text-accent">
                    {String(i + 1).padStart(2, '0')} · {r.stage}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-semibold">{r.title}</h3>
                <dl className="mt-4 space-y-3 text-sm">
                  <div>
                    <dt className="font-medium text-ink">What you get</dt>
                    <dd className="text-muted">{r.get}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-ink">Your involvement</dt>
                    <dd className="text-muted">{r.involvement}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-ink">Next step</dt>
                    <dd className="text-muted">{r.next}</dd>
                  </div>
                </dl>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: CSS**

Append to `src/index.css` before the reduced-motion block:

```css
/* Roadmap stages light up on scroll */
.roadmap-stage {
  opacity: 0.55;
  transition: opacity 500ms ease, border-color 500ms ease, background-color 500ms ease;
}
.roadmap-stage-on {
  opacity: 1;
}
```

Inside the reduced-motion block add `.roadmap-stage { opacity: 1; transition: none; }`.

- [ ] **Step 3: Wire, verify, commit**

In `src/App.jsx` add `import Roadmap from './components/Roadmap'` and `<Roadmap />` after `<WhyUs />`.

Run: `npm run lint && npm run build && npm test` — pass, gzip ≤ 71 kB. Dev server: stages light up as you scroll; vertical on 390 px. Stop server.

```bash
git add src/components/Roadmap.jsx src/App.jsx src/index.css
git commit -m "feat: Explore→Pilot→Production→Scale engagement roadmap

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 9: Case studies strip, CTA + Contact band, page assembly

**Files:**
- Modify: `src/components/CaseStudies.jsx`, `src/components/Contact.jsx`, `src/App.jsx`

**Interfaces:**
- Consumes: `caseStudiesNote`, `ctaBand`, `contact` (Task 3).

- [ ] **Step 1: Rewrite `CaseStudies.jsx`**

```jsx
import { FolderOpen } from 'lucide-react'
import { caseStudiesNote } from '../content/site'

export default function CaseStudies() {
  return (
    <section id="work" className="mx-auto max-w-6xl px-6 py-12">
      <div className="theme-fade flex flex-col items-start gap-4 rounded-2xl border border-dashed border-line bg-surface/60 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primarySoft text-primary">
            <FolderOpen className="h-4 w-4" strokeWidth={1.75} />
          </span>
          <p className="text-sm text-muted">{caseStudiesNote}</p>
        </div>
        <a
          href="#contact"
          className="shrink-0 rounded-full border border-line px-5 py-2 text-sm font-medium transition hover:border-primary hover:text-primary"
        >
          Book a call
        </a>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Rewrite `Contact.jsx` (absorbs the CTA band)**

```jsx
import { useState } from 'react'
import { Copy, Mail, MapPin, Phone } from 'lucide-react'
import { contact, ctaBand } from '../content/site'
import SocialIcon from './SocialIcon'

export default function Contact() {
  const [copied, setCopied] = useState(false)

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(contact.email)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard blocked: the address is still visible as text */
    }
  }

  return (
    <section id="contact" className="theme-fade border-t border-line bg-navy text-navyInk">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-6 py-20 lg:grid-cols-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-navyInk/50">Work with us</p>
          <h2 className="mt-3 text-3xl md:text-4xl">{ctaBand.title}</h2>
          <p className="mt-4 max-w-md text-navyInk/60">{ctaBand.body}</p>
          <a
            href={`mailto:${contact.email}`}
            className="mt-8 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-medium text-primaryInk transition hover:bg-primaryHover"
          >
            Book a call
          </a>
        </div>

        <dl className="grid grid-cols-1 gap-8 sm:grid-cols-2">
          <div>
            <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-navyInk/50">
              <Mail className="h-4 w-4" /> Email
            </dt>
            <dd className="mt-3 flex items-center gap-2 text-sm">
              <span>{contact.email}</span>
              <button
                type="button"
                onClick={copyEmail}
                aria-label="Copy email address"
                className="rounded-full border border-navyInk/20 p-1.5 text-navyInk/70 transition hover:border-primary hover:text-primary"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
              {copied && <span className="text-xs text-accent">Copied</span>}
            </dd>
          </div>
          <div>
            <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-navyInk/50">
              <Phone className="h-4 w-4" /> Phone
            </dt>
            <dd className="mt-3 space-y-1 text-sm">
              {contact.phones.map((p) => (
                <a key={p} href={`tel:${p.replace(/\s+/g, '')}`} className="block hover:text-accent">
                  {p}
                </a>
              ))}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-navyInk/50">
              <MapPin className="h-4 w-4" /> Offices
            </dt>
            <dd className="mt-3 space-y-2 text-sm text-navyInk/70">
              {contact.addresses.map((a) => (
                <p key={a}>{a}</p>
              ))}
            </dd>
          </div>
          <div className="flex gap-3 sm:col-span-2">
            {contact.social.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                aria-label={s.label}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-navyInk/20 text-navyInk/70 transition hover:border-primary hover:bg-primary hover:text-primaryInk"
              >
                <SocialIcon name={s.icon} />
              </a>
            ))}
          </div>
        </dl>
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Final `App.jsx` order**

```jsx
import Nav from './components/Nav'
import Hero from './components/Hero'
import Pillars from './components/Pillars'
import AgentDemo from './components/AgentDemo'
import WhyUs from './components/WhyUs'
import Roadmap from './components/Roadmap'
import CaseStudies from './components/CaseStudies'
import FAQ from './components/FAQ'
import Contact from './components/Contact'
import Footer from './components/Footer'

// Testimonials.jsx is intentionally not rendered: the `testimonials` array is empty until
// the team supplies real client quotes (see content/TODO.md).
export default function App() {
  return (
    <div className="min-h-screen">
      <Nav />
      <main>
        <Hero />
        <Pillars />
        <AgentDemo />
        <WhyUs />
        <Roadmap />
        <CaseStudies />
        <FAQ />
        <Contact />
      </main>
      <Footer />
    </div>
  )
}
```

- [ ] **Step 4: Lint, build, view, commit**

Run: `npm run lint && npm run build && npm test` — pass, gzip ≤ 71 kB. Dev server: full page top to bottom in all three themes at 1280 px and 390 px; nav links land on the right sections. Stop server.

```bash
git add src/components/CaseStudies.jsx src/components/Contact.jsx src/App.jsx
git commit -m "feat: case-studies strip, merged CTA/contact band, final section order

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 10: Chat answer engine

**Files:**
- Create: `src/chat/intents.js`, `src/chat/answerEngine.js`, `src/chat/answerEngine.test.js`

**Interfaces:**
- Produces:
  - `getAnswer(question: string, ctx?: { intentId?: string }) → Promise<{ id: string, text: string, actions: Action[] }>`
  - `Action = { type: 'scroll', label, target } | { type: 'copy', label, value } | { type: 'link', label, href }`
  - `chips: { id, label }[]` (exported from `intents.js`) for the UI to render.

- [ ] **Step 1: Write the failing tests**

Create `src/chat/answerEngine.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { getAnswer } from './answerEngine'
import { chips } from './intents'
import { contact } from '../content/site'

describe('getAnswer', () => {
  it('exposes six suggestion chips', () => {
    expect(chips.map((c) => c.id)).toEqual(['agent', 'platform', 'start', 'offices', 'demo', 'human'])
  })

  it('answers each chip by id', async () => {
    for (const c of chips) {
      const a = await getAnswer(c.label, { intentId: c.id })
      expect(a.id).toBe(c.id)
      expect(a.text.length).toBeGreaterThan(20)
    }
  })

  it('matches typed questions by keyword', async () => {
    expect((await getAnswer('where are you located?')).id).toBe('offices')
    expect((await getAnswer('how do we get started')).id).toBe('start')
    expect((await getAnswer('can I see a demo')).id).toBe('demo')
    expect((await getAnswer('what about iot devices')).id).toBe('platform')
  })

  it('does not match "ai" inside "email"', async () => {
    expect((await getAnswer('what is your email')).id).toBe('human')
  })

  it('returns the fallback with contact actions for unknown input', async () => {
    const a = await getAnswer('do you sell coffee beans')
    expect(a.id).toBe('fallback')
    expect(a.actions.some((x) => x.type === 'copy' && x.value === contact.email)).toBe(true)
  })

  it('treats blank input as unknown', async () => {
    expect((await getAnswer('   ')).id).toBe('fallback')
  })

  it('builds the offices answer from live site data', async () => {
    const a = await getAnswer('offices')
    expect(a.text).toContain('Dallas')
    expect(a.text).toContain(contact.addresses[0])
  })

  it('demo and human answers point at the right sections', async () => {
    const demo = await getAnswer('', { intentId: 'demo' })
    expect(demo.actions).toContainEqual({ type: 'scroll', label: 'Watch the agent demo', target: 'demo' })
    const human = await getAnswer('', { intentId: 'human' })
    expect(human.actions.some((x) => x.type === 'link' && x.href.startsWith('tel:'))).toBe(true)
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test` — expected FAIL, cannot find module.

- [ ] **Step 3: Create `intents.js`**

```js
// Ordered keyword rules for the scripted guide. Every answer is assembled from site.js so
// the chat can never contradict the page. Rule order matters: the first match wins.
import { chat, company, contact, faqs, pillars, roadmap } from '../content/site'

const pillar = (id) => pillars.find((p) => p.id === id)

const contactActions = () => [
  { type: 'copy', label: 'Copy email', value: contact.email },
  { type: 'link', label: `Call ${contact.phones[0]}`, href: `tel:${contact.phones[0].replace(/\s+/g, '')}` },
  { type: 'scroll', label: 'Go to contact', target: 'contact' },
]

export const intents = [
  {
    id: 'demo',
    chip: 'Show me an agent demo',
    keywords: ['demo', 'show me', 'example', 'watch', 'see it'],
    answer: () => ({
      text: 'Here is an illustrative walkthrough of an agent handling a request from start to finish — three scenarios to pick from.',
      actions: [{ type: 'scroll', label: 'Watch the agent demo', target: 'demo' }],
    }),
  },
  {
    id: 'platform',
    chip: 'What is the Smart Agent Platform?',
    keywords: ['platform', 'iot', 'device', 'sensor', 'smart', 'factory', 'machine'],
    answer: () => ({
      text: `${pillar('platform').title}: ${pillar('platform').outcome}`,
      actions: [{ type: 'scroll', label: 'See the platform pillar', target: 'solutions' }],
    }),
  },
  {
    id: 'start',
    chip: 'How does a project start?',
    keywords: ['start', 'begin', 'process', 'roadmap', 'pilot', 'first step', 'work with', 'engage', 'how do we'],
    answer: () => ({
      text: `It starts with ${roadmap[0].stage}: ${roadmap[0].get} Then a ${roadmap[1].stage}: ${roadmap[1].get}`,
      actions: [{ type: 'scroll', label: 'See the roadmap', target: 'roadmap' }],
    }),
  },
  {
    id: 'offices',
    chip: 'Where are your offices?',
    keywords: ['office', 'where', 'location', 'located', 'address', 'vietnam', 'dallas', 'time zone'],
    answer: () => ({
      text: `We work from ${company.offices.join(', ')}. Addresses: ${contact.addresses.join(' · ')}`,
      actions: [{ type: 'scroll', label: 'Go to contact', target: 'contact' }],
    }),
  },
  {
    id: 'human',
    chip: 'Talk to a human',
    keywords: ['human', 'person', 'talk', 'call', 'email', 'phone', 'contact', 'reach', 'speak'],
    answer: () => ({
      text: `Happy to connect you. Email ${contact.email} or call ${contact.phones.join(' / ')}.`,
      actions: contactActions(),
    }),
  },
  {
    id: 'agent',
    chip: 'What can an AI agent do for my business?',
    keywords: ['agent', 'ai', 'automate', 'automation', 'assistant', 'chatbot', 'help', 'what do you do', 'services'],
    answer: () => ({
      text: `${pillar('agentic').outcome} ${faqs[0].a}`,
      actions: [
        { type: 'scroll', label: 'Watch the agent demo', target: 'demo' },
        { type: 'scroll', label: 'See our solutions', target: 'solutions' },
      ],
    }),
  },
]

export const FALLBACK_ID = 'fallback'

export const fallback = () => ({
  id: FALLBACK_ID,
  text: chat.fallback,
  actions: contactActions(),
})

// Chip order as shown in the UI (matches the spec, not the matching order above).
const CHIP_ORDER = ['agent', 'platform', 'start', 'offices', 'demo', 'human']
export const chips = CHIP_ORDER.map((id) => ({ id, label: intents.find((i) => i.id === id).chip }))
```

- [ ] **Step 4: Create `answerEngine.js`**

```js
// The single seam between the chat UI and wherever answers come from. Today: keyword rules
// over site.js content. Later: replace the body of getAnswer with a call to a serverless AI
// backend — the UI (ChatGuide.jsx) only ever calls this function.
import { intents, fallback } from './intents'

const MAX_LEN = 500

function matches(keyword, text) {
  // Word-boundary at the start so "ai" does not match inside "email".
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(^|[^a-z0-9])${escaped}`, 'i').test(text)
}

export async function getAnswer(question, ctx = {}) {
  if (ctx.intentId) {
    const direct = intents.find((i) => i.id === ctx.intentId)
    if (direct) return { id: direct.id, ...direct.answer() }
  }
  const text = String(question ?? '').trim().slice(0, MAX_LEN).toLowerCase()
  if (!text) return fallback()
  for (const intent of intents) {
    if (intent.keywords.some((k) => matches(k, text))) {
      return { id: intent.id, ...intent.answer() }
    }
  }
  return fallback()
}
```

- [ ] **Step 5: Run to verify passing**

Run: `npm test` — expected: all pass. If `'what is your email'` resolves to a different id, check rule order: `human` must precede `agent` and `ai` must not match `email` (the regex requires a non-alphanumeric before the keyword).

- [ ] **Step 6: Commit**

```bash
git add src/chat
git commit -m "feat: scripted chat answer engine built from site content

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 11: ChatGuide UI

**Files:**
- Create: `src/components/ChatGuide.jsx`
- Modify: `src/App.jsx`, `src/index.css`

**Interfaces:**
- Consumes: `getAnswer`, `chips` (Task 10), `chat` copy (Task 3).

- [ ] **Step 1: Create `ChatGuide.jsx`**

```jsx
import { useEffect, useRef, useState } from 'react'
import { MessageCircle, Send, X } from 'lucide-react'
import { chat } from '../content/site'
import { getAnswer } from '../chat/answerEngine'
import { chips } from '../chat/intents'

const HISTORY_KEY = 'xt-chat'
const NUDGE_KEY = 'xt-chat-nudged'
const NUDGE_MS = 8000

function loadHistory() {
  try {
    const raw = sessionStorage.getItem(HISTORY_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveHistory(items) {
  try {
    sessionStorage.setItem(HISTORY_KEY, JSON.stringify(items))
  } catch {
    /* storage blocked */
  }
}

function scrollTo(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export default function ChatGuide() {
  const [open, setOpen] = useState(false)
  const [nudge, setNudge] = useState(false)
  const [messages, setMessages] = useState(loadHistory)
  const [input, setInput] = useState('')
  const [copiedIdx, setCopiedIdx] = useState(null)
  const bubbleRef = useRef(null)
  const panelRef = useRef(null)
  const inputRef = useRef(null)
  const logRef = useRef(null)

  // One-time nudge, never auto-open.
  useEffect(() => {
    let seen = false
    try {
      seen = sessionStorage.getItem(NUDGE_KEY) === '1'
    } catch {
      /* ignore */
    }
    if (seen) return
    const t = setTimeout(() => setNudge(true), NUDGE_MS)
    return () => clearTimeout(t)
  }, [])

  function dismissNudge() {
    setNudge(false)
    try {
      sessionStorage.setItem(NUDGE_KEY, '1')
    } catch {
      /* ignore */
    }
  }

  // Escape closes; Tab is trapped inside the panel.
  useEffect(() => {
    if (!open) return
    inputRef.current?.focus()
    function onKey(e) {
      if (e.key === 'Escape') {
        close()
        return
      }
      if (e.key !== 'Tab' || !panelRef.current) return
      const focusables = panelRef.current.querySelectorAll('button, [href], input, [tabindex]:not([tabindex="-1"])')
      if (!focusables.length) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    saveHistory(messages)
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight })
  }, [messages])

  function openPanel() {
    dismissNudge()
    setOpen(true)
  }

  function close() {
    setOpen(false)
    bubbleRef.current?.focus()
  }

  async function ask(text, intentId) {
    const q = text.trim()
    if (!q) return
    const answer = await getAnswer(q, intentId ? { intentId } : {})
    setMessages((m) => [...m, { from: 'user', text: q }, { from: 'bot', text: answer.text, actions: answer.actions }])
    setInput('')
  }

  async function runAction(a, idx) {
    if (a.type === 'scroll') {
      close()
      scrollTo(a.target)
    } else if (a.type === 'copy') {
      try {
        await navigator.clipboard.writeText(a.value)
        setCopiedIdx(idx)
        setTimeout(() => setCopiedIdx(null), 1500)
      } catch {
        /* clipboard blocked; value is visible in the message text */
      }
    } else if (a.type === 'link') {
      window.location.href = a.href
    }
  }

  return (
    <>
      {nudge && !open && (
        <button
          type="button"
          onClick={openPanel}
          className="theme-fade fixed bottom-[5.5rem] right-6 z-40 rounded-2xl border border-line bg-surface px-4 py-2 text-sm shadow-lg"
        >
          {chat.nudge}
        </button>
      )}

      <button
        ref={bubbleRef}
        type="button"
        aria-label={open ? 'Close assistant' : 'Open assistant'}
        aria-expanded={open}
        aria-controls="chat-guide-panel"
        onClick={() => (open ? close() : openPanel())}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primaryInk shadow-lg transition hover:bg-primaryHover"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {open && (
        <div
          id="chat-guide-panel"
          ref={panelRef}
          role="dialog"
          aria-label="Ask XionTechs"
          className="chat-panel theme-fade fixed z-40 flex flex-col border border-line bg-surface shadow-2xl"
        >
          <header className="border-b border-line px-4 py-3">
            <p className="font-semibold">Ask XionTechs</p>
            <p className="text-xs text-muted">{chat.assistantLabel}</p>
          </header>

          <div ref={logRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4 text-sm">
            <p className="rounded-2xl rounded-tl-sm bg-primarySoft px-3 py-2 text-ink">{chat.greeting}</p>
            {messages.map((m, i) =>
              m.from === 'user' ? (
                <p key={i} className="ml-8 rounded-2xl rounded-tr-sm bg-primary px-3 py-2 text-primaryInk">
                  {m.text}
                </p>
              ) : (
                <div key={i} className="mr-4 space-y-2">
                  <p className="rounded-2xl rounded-tl-sm bg-primarySoft px-3 py-2 text-ink">{m.text}</p>
                  {m.actions?.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {m.actions.map((a, j) => (
                        <button
                          key={j}
                          type="button"
                          onClick={() => runAction(a, `${i}-${j}`)}
                          className="rounded-full border border-line px-3 py-1 text-xs font-medium text-primary transition hover:border-primary"
                        >
                          {copiedIdx === `${i}-${j}` ? 'Copied' : a.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ),
            )}
          </div>

          <div className="flex flex-wrap gap-2 border-t border-line px-4 py-3">
            {chips.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => ask(c.label, c.id)}
                className="rounded-full bg-primarySoft px-3 py-1 text-xs text-ink/80 transition hover:bg-primary hover:text-primaryInk"
              >
                {c.label}
              </button>
            ))}
          </div>

          <form
            className="flex gap-2 border-t border-line px-4 py-3"
            onSubmit={(e) => {
              e.preventDefault()
              ask(input)
            }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, 500))}
              placeholder="Type a question…"
              aria-label="Your question"
              className="flex-1 rounded-full border border-line bg-paper px-4 py-2 text-sm outline-none focus:border-primary"
            />
            <button
              type="submit"
              aria-label="Send"
              disabled={!input.trim()}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primaryInk disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 2: Panel sizing CSS**

Append to `src/index.css`:

```css
/* Chat guide panel: fixed card on desktop, full screen on small phones */
.chat-panel {
  right: 1.5rem;
  bottom: 5.5rem;
  width: 360px;
  height: 480px;
  border-radius: 1rem;
}
@media (max-width: 479px) {
  .chat-panel {
    inset: 0;
    width: auto;
    height: auto;
    border-radius: 0;
    padding-bottom: 5rem;
  }
}
```

- [ ] **Step 3: Wire into `App.jsx`**

Add `import ChatGuide from './components/ChatGuide'` and render `<ChatGuide />` as the last child inside the root `<div>` (after `<Footer />`).

- [ ] **Step 4: Lint, build, manual check**

Run: `npm run lint && npm run build && npm test` — pass, gzip ≤ 71 kB.
Dev server, then stop it:
- Nudge appears after 8 s, disappears on click, does not return after reload in the same tab.
- Every chip returns an answer; every "Go to…" button closes the panel and scrolls; "Copy email" shows "Copied".
- Blank submit does nothing; Send is disabled when empty.
- Esc closes and focus returns to the bubble; Tab cycles inside the panel.
- Reload: history persists; open a new tab: history empty.
- 390 px: panel is full screen and the bubble stays reachable.
- Switch themes with the panel open: everything re-colours.

- [ ] **Step 5: Log and commit**

Append to `PROMPT_LOG.md`:

```markdown
- Chat guide: scripted, labeled "Guided assistant · answers from this site". Answers are
  built from `site.js` exports; `src/chat/answerEngine.js` is the only file to change if
  a real AI backend is added later. Keyword matching is word-boundary based after a test
  caught "ai" matching inside "email".
```

```bash
git add src/components/ChatGuide.jsx src/App.jsx src/index.css PROMPT_LOG.md
git commit -m "feat: floating Ask XionTechs guide with section actions

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 12: Cleanup, docs, verification

**Files:**
- Modify: `tailwind.config.js`, `CLAUDE.md`, `PROMPT_LOG.md`, `src/components/Testimonials.jsx`

- [ ] **Step 1: Remove the temporary Tailwind aliases**

In `tailwind.config.js` delete the two lines `accentHover: token('primary-hover'),` and `accentSoft: token('primary-soft'),` and the comment above them.

Run: `grep -rn "accentHover\|accentSoft" src` — expected: only matches in `src/components/Testimonials.jsx` (unrendered). Update those: `bg-accentSoft` → `bg-primarySoft`, `text-accent` stays, `hover:bg-accentHover` → `hover:bg-primaryHover` (edit whatever occurrences exist).

- [ ] **Step 2: Fail on hardcoded colours in components**

Run: `grep -rnE "#[0-9a-fA-F]{3,6}\b" src/components src/chat`
Expected: no output. (The only hex values in `src/` are the swatch previews in `src/theme/themes.js` and the token definitions in `src/index.css`.) If anything appears, replace it with a token class.

- [ ] **Step 3: Update `CLAUDE.md`**

Replace the sentence in "Challenge rules": `this rebuild is a clean, minimal, light design (off-white paper background, dark ink text, green accent) — see \`tailwind.config.js\`.` with:

```
this rebuild has three logo-derived themes — Classic Navy (default light), Midnight
(dark), Aurum (warm light) — driven by CSS variables in `src/index.css` and a registry
in `src/theme/themes.js`. Never hardcode a hex colour in a component; use the Tailwind
token names (`paper surface ink muted line primary primaryHover primarySoft primaryInk
accent navy navyInk`).
```

Under "Working conventions" add:

```
- The chat guide is scripted. Answers come from `src/chat/intents.js`, built from
  `site.js` exports. If a real AI backend is ever added, change only
  `src/chat/answerEngine.js`; `ChatGuide.jsx` must not know where answers come from.
- Agent-demo scenarios in `site.js` are invented and must stay flagged
  `illustrative: true` with no digits in the outcome line (`npm test` enforces this).
- Run `npm test` alongside `npm run lint` and `npm run build` before committing.
```

Under "Known placeholders still open" add: `- Hero copy, both AI pillars, roadmap framing, CTA band (all redesign copy pending sign-off)`.

- [ ] **Step 4: Final verification**

Run: `npm run lint && npm run build && npm test`
Expected: all pass. Record the final `index-*.js` gzip size; it must be ≤ 71 kB.

Manual checklist (dev server, then stop it and confirm with `netstat -ano | grep ":517" | grep LISTENING` that nothing is left running):
- Each theme × {1280 px, 390 px}: reload shows no flash; logo readable in Midnight; navy sections readable.
- Agent demo plays, replays, switches cleanly; reduced motion shows all steps.
- Chat: every chip and action works; Esc closes; keyboard-only works.
- DevTools accessibility contrast check on: primary button text, accent headline word, muted body text — in all three themes.

- [ ] **Step 5: Close out `PROMPT_LOG.md` and commit**

Append:

```markdown
- Redesign complete on `feat/landing-redesign`. Final bundle: `<fill from build output>`
  gzip (budget 71 kB). Manual theme/demo/chat checklist run in Chrome at 1280 px and
  390 px. Remaining placeholders listed in `content/TODO.md`.
```

Replace `<fill from build output>` with the actual number before committing.

```bash
git add tailwind.config.js CLAUDE.md PROMPT_LOG.md src/components/Testimonials.jsx
git commit -m "chore: drop colour aliases, update agent context and prompt log

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```
