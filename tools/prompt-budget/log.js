// Shared run log: one JSON object per line in <project>/.claude/prompt-budget/runs.jsonl
import { appendFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

export const logPath = (projectDir = process.env.CLAUDE_PROJECT_DIR ?? process.cwd()) =>
  join(projectDir, '.claude', 'prompt-budget', 'runs.jsonl');

export function logEvent(obj, projectDir) {
  try {
    const file = logPath(projectDir);
    mkdirSync(join(file, '..'), { recursive: true });
    appendFileSync(file, JSON.stringify({ ts: new Date().toISOString(), ...obj }) + '\n');
  } catch {
    /* logging is best-effort and must never block a subagent */
  }
}
