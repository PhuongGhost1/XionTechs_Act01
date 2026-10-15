#!/usr/bin/env node
// Usage: node tools/prompt-budget/report.js [path/to/runs.jsonl]
// Joins pre (optimizer) + post + stop (actual usage) events and prints one row per subagent run.
import { readFileSync, existsSync } from 'node:fs';
import { logPath } from './log.js';

// Prices per 1M tokens as given for Haiku 5.5 (unverified — edit here if they differ).
// cache write is ASSUMED 1.25x input; cache read $0.01 (tier 1) as stated.
const P = {
  t1: { in: 0.1, out: 0.5, cr: 0.01, cw: 0.125 },
  t2: { in: 0.5, out: 2.5, cr: 0.05, cw: 0.625 }, // cache-read 0.05 is an assumption (0.1x input)
};
const TIER2_AT = 100_000;
const tier = (tokens) => (tokens > TIER2_AT ? P.t2 : P.t1);

const file = process.argv[2] ?? logPath();
if (!existsSync(file)) {
  console.log(`No log yet at ${file}. Spawn a subagent first.`);
  process.exit(0);
}
const ev = readFileSync(file, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));

const posts = new Map(ev.filter((e) => e.type === 'post').map((e) => [e.tool_use_id, e]));
const stops = new Map(ev.filter((e) => e.type === 'stop').map((e) => [e.agent_id, e]));

const rows = ev
  .filter((e) => e.type === 'pre')
  .map((pre) => {
    const post = posts.get(pre.tool_use_id);
    const stop = post && stops.get(post.agent_id);
    const u = stop?.usage;
    const pr = tier(Math.max(pre.final_tokens, u?.input_tokens ?? 0));
    const cost = u
      ? (u.input_tokens * pr.in + u.output_tokens * pr.out + u.cache_read_input_tokens * pr.cr + u.cache_creation_input_tokens * pr.cw) / 1e6
      : null;
    // first-request input saving only: prompt at the price tier it WOULD have hit vs. the compacted one
    const saved = pre.compacted ? (pre.orig_tokens * tier(pre.orig_tokens).in - pre.final_tokens * tier(pre.final_tokens).in) / 1e6 : 0;
    let applied = '?';
    if (stop?.first_prompt_chars != null) {
      const near = (a, b) => Math.abs(a - b) <= Math.max(200, b * 0.05); // transcript may add wrappers
      applied = !pre.compacted ? 'n/a' : near(stop.first_prompt_chars, pre.final_chars) && !near(stop.first_prompt_chars, pre.orig_chars) ? 'yes' : 'NO';
    }
    return { time: pre.ts.slice(11, 19), model: pre.model ?? '-', orig: pre.orig_tokens, final: pre.final_tokens, compacted: pre.compacted ? 'yes' : 'no', applied, in: u?.input_tokens ?? '-', cache_read: u?.cache_read_input_tokens ?? '-', out: u?.output_tokens ?? '-', cost: cost === null ? '-' : '$' + cost.toFixed(4), est_saved: '$' + saved.toFixed(4), desc: (pre.description ?? '').slice(0, 28) };
  });

console.table(rows);
const n = rows.filter((r) => r.compacted === 'yes').length;
const sum = (k) => rows.reduce((s, r) => s + (parseFloat(String(r[k]).replace('$', '')) || 0), 0);
console.log(`runs: ${rows.length}, compacted: ${n}, total cost: $${sum('cost').toFixed(4)}, est. saved (first request input only): $${sum('est_saved').toFixed(4)}`);
console.log('applied = did the subagent receive the compacted prompt (checked from its transcript). "?" = no stop event/transcript yet.');
