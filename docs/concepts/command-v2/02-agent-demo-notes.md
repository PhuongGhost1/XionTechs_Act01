# Station 05 AGENT RUN: the agent demo as a printer tape

Added after `00-direction.md` (the law) and `01-contract-notes.md`; neither is rewritten. The page now has
eight stations: `00 STANDBY, 01 PREMISE, 02 DEPLOY, 03 LINE, 04 WORK, 05 AGENT, 06 LEDGER, 07 DONE`.

## What it is

The main page's illustrative agent demo (three scenarios, a human approval, two drills each, and the
"Agent at work" journeys) rebuilt for this page as **TAPE**: the run is a strip of paper that feeds up
out of a printer slot, one printed mono line per tick. It is the READ | RAW sheet made into a device.
Everything on it is illustrative and says so on screen (the hatched `ILLUSTRATIVE` chip in the panel
and on the printer plate); the capability tags are placeholders and are always dashed (`PENDING`). The
agent is called `XionTechs agent` and nothing else. There is not one number on the tape.

| Run event | On the tape |
|---|---|
| trigger | the first line, tag `TRIGGER` |
| agent step | a line, label, dot leader, dashed capability tag (placeholder) |
| router | a line, then a perforation row (dashed hairline), then the strip splits in two columns headed by the branch names; the taken branch prints in its column, the other is marked `NOT TAKEN` |
| parallel steps | two cells of one row, one per column, printed in the same tick |
| human wait | the printer stops: a dashed "sign here" box, `AWAITING APPROVAL`, a static yellow underline (no blink), the print head rests |
| Approve / Reject | flat buttons outside every transformed element; Approve presses a stamp into the box (translateZ in the box's own 480 px perspective, 180 ms) |
| retry drill | the failed line is struck (scaleX 0 to 1) and reprinted below with `RETRY` and the one-word fault |
| other drill | a `PROBLEM` line after the step that meets it |
| outcome | a line with a zigzag notch (clip-path on the leaf row); its slip falls away (rotateZ, translate) and is gone at rest; a rejected run also carries an `ABORT` mark |
| Agent at work | one column; `RESOURCE` / `SKILL` prefixes; the compaction stop folds the three lines before it into one `FOLDED` line (rotateX from the top edge, 360 ms) that stays |

## Depth (restrained, real)

Stacked mode (from 1024 px wide, not RAW, not reduced motion): `perspective: 1400px` with origin
`50% 40%` on the stage, the device is `preserve-3d` and tilted `rotateX(6deg)`, the strip is a
`preserve-3d` list of leaf rows. Each row carries its own depth from its distance to the slot
(`tape.js depthAt`): `translateZ` back, `rotateX` away, opacity down to a floor of 0.7 and then 0.
The floor is computed, not eyeballed: `tape.test.js` mixes ink-2 over the paper from the tokens and
demands 4.5:1 at every visible distance. A row rises out from behind the printer housing, which is in
front of the strip (`translateZ(10px)`); the tear-off slip is in front of the housing. Opacity,
clip-path and overflow live on the leaf rows only, never on a `preserve-3d` parent. Only transform,
opacity and clip-path animate. The strip needs no WebGL and no three.js: it runs in every tier
(`data-tier` is not consulted), and the tier system's rule "off screen means stopped" is kept by the
run itself (below).

## Behaviour and fallbacks

- **Time driven, not scrubbed.** `sections/Agent/useAgentRun.js` is the main page's AgentDemo state
  machine without the graph: one timeout per tick (700 ms, the failure tick held twice as long), the
  run waits at the decision node until the visitor decides, it starts when the stage is on screen and
  waits when it is not. Scrolling never moves it.
- **Phones and tablets (under 1024 px):** no pin; the tape is a normal flow growing downward, perspective
  flattened; the scenario tabs sit above it; Approve / Reject become a bottom bar on the CTA bar's place
  (above the dock, 56 px bar, 48 px buttons, safe-area aware through `--dock-h`) drawn only while an
  approval is awaited. The strip's second column is not drawn below 30 rem.
- **Reduced motion / MOTION off** (`useReducedMotion`) **and RAW** (`data-view="raw"`): the run is pinned
  to its end. The strip is a flat flow, every line in full ink, no motion. A run that waits for a
  person ends at the sign box, where Approve and Reject are replaced by their result text (`IF APPROVED`
  ... `IF REJECTED` ...). RAW additionally drops the paper and the notch: the same lines as a plain mono
  dot-leader sheet. Scenario tabs, drills and "Agent at work" still work (they swap the finished sheet).
- **Loops:** there are none longer than 5 s. The run stops at the approval and at the end; the print head
  sweeps once per line. `MOTION: OFF` ends everything through `useReducedMotion`.
- **Pause / Replay:** Pause sets `data-paused` on the stage (the page's rule pauses the keyframes) and
  stops the tick timer. Replay restarts; after a finished plain run it takes the next path, like the
  main page.

## Contract

- Registered as station `agent` (index 5, hash `#agent`, `lvh 320`, `lvhPhone 0`, mode `pin`, pinned) in
  `contract/stations.js`; ledger is now index 6 and done index 7 (`data-station` 0..7). Track token
  `--track-agent` (`0lvh` phone, `320lvh` from 768) and the `.track[data-track='agent']` rule; the pin
  itself is only used from 1024 px (`sections/Agent/index.jsx`), below that the track is not pinned.
- Frame: the dock counter reads `BUILD 005` there, the scrubber has eight ticks, `SIGNAL_STATIONS`
  is `[1, 3, 4, 7]` (the signal line still fires for the same sections), the core stays hidden (k 3,
  alpha 0) through the station: no change to `kAlphaFor` or the anchors was needed, `work` stays above 0.
- Content: `content/agent.js` (not in the entry aggregate; it loads with the section). The station
  label `05 / AGENT RUN` is in `content/stations.js`. Every string has a `src` tag; the validator and
  `content.test.js` run on it with the rest. Reserved keys: no `status` or `state` field (the validator
  treats them as OFFERED / ACTIVE / PENDING words); nodes say `type` and `text`, stops say `doing`.
- Lazy: `sections/Agent` is a lazy chunk, loaded when the browser is idle after first paint; until then a
  placeholder `section#agent` of the same height holds its place. This keeps the entry JS where it was.

## Ported (zero-state rule: copied, adapted, tagged; nothing imported from outside the folder)

From the main checkout, read 2026-10-04:

| Here | From | Kept / left behind |
|---|---|---|
| `runtime/agent/run.js` (+ test) | `src/workflow/run.js` | `buildRun`, `stateAt`, `totalTicks`, `nextBranchIndex`: identical tick semantics (tick 0 trigger, 2i-1 travel, 2i working, wait at the decision, a repeated step is a retry, parallel steps as arrays). Left: `splitBranches`, `visibleRows`, `visibleNodeIds` |
| `runtime/agent/phase.js` (+ test) | `src/workflow/phase.js` | `TICK_MS`, `tickMs`, `runPhase`. Left: depth planes, wire scale, connector look |
| `runtime/agent/log.js` (+ test) | `src/workflow/log.js` | `fill`, `statusLine`. Left: `executionLog` (the printed lines are the log) |
| `runtime/agent/journey.js` (+ test) | `src/workflow/journey.js` | `journeyEvents`, `journeyTicks`, `journeyStateAt`. Left: staircase layout, camera, context ring |
| `content/agent.js` | `src/content/site.js`: `workflows`, `agentJourneys`, `capabilityLabels`, `aiAgents.run` words | scenarios, branches, decisions, drills and journeys as `ILLUSTRATIVE` (source tag in each), capability words as `PLACEHOLDER`, interface words as `DRAFT`. Node coordinates, icons, edges and run-log rows are not ported |

New and not ported: `runtime/agent/tape.js` (rows, split columns, strike, fold, depth; tested),
`sections/Agent/` (`index.jsx`, `Tape.jsx`, `Controls.jsx`, `useAgentRun.js`, `useMediaQuery.js`,
`agent.css`, `agent.test.js`).

## Budgets (kept, not raised)

The stylesheet was at 13.995 of 14 kB gzip before this station, so there was no room for any CSS.
How it fits: `agent.css` is only the six keyframes; the grid, the depth, the printer and the controls are
utilities and inline style decided by the layout the components already know (`wide`, `stacked`).
`tailwind.command.config.js` also switches off the core plugins this page never uses (rings, shadows,
filters, backdrop filters, gradients, snap, touch-action, numeric variants, border-spacing, `contain`,
and the `*-opacity` indirection): Tailwind wrote their `--tw-*` defaults twice (`*` and `::backdrop`),
about 350 bytes gzip, and no utility was lost (the generated class list is identical). Do not
add them back, and write new layout as utilities or inline style, not as a rule, until there is slack.

## Open items

- The scenarios, branch names, fault words and journey stops are the main page's invented demo
  material; the capability labels stay placeholders until the team confirms the real Azure services.
- The hash `#agent` is not in the header nav (three words only, doc 4.9).
- The DEP-003 row in ON FILE still links to the main page's demo (`/#ai-agents`); pointing it at
  `#agent` on this page is a one-line content change for the team to decide.
