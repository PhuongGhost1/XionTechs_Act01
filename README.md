# XionTechs_Act01

Landing page rebuild for the internal AI build challenge. See [CLAUDE.md](CLAUDE.md)
for agent context and rules, [PROMPT_LOG.md](PROMPT_LOG.md) for the prompt/decision
log, and [content/TODO.md](content/TODO.md) for outstanding real-content items.

The design follows the team's brief in
[docs/idea/XionTechs_Landing_Page_Redesign_Plan_v3.md](docs/idea/XionTechs_Landing_Page_Redesign_Plan_v3.md).
Add `?review` to any URL to see which copy is still a draft.

## Stack
Vite + React + Tailwind CSS. Copy lives in `src/content/site.js`; Vitest checks the content
rules (`npm test`).

## Getting started
```bash
npm install
npm run dev
```

## Check and build
```bash
npm test
npm run lint
npm run build
npm run preview
```
