#!/usr/bin/env node
/**
 * SDD shallow anchor check (per-repo, CI-friendly).
 *
 * Validates @spec / @capability anchor syntax in source files WITHOUT
 * cross-referencing docs/ (which lives in shared parent dir, not in this repo).
 *
 * Checks:
 *   1. @spec value matches `docs/(design|reference|adr)/<path>#<section>` shape
 *   2. @capability value matches `<module>.<feature-slug>` (kebab-case)
 *
 * For full cross-validation (verify spec / capability actually exist), use
 *   `node ../scripts/sdd/check-anchor-integrity.mjs` in the shared parent dir.
 *
 * Exit 1 on any malformed anchor; 0 if clean.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';

const REPO_ROOT = resolve(new URL('../..', import.meta.url).pathname);
const SRC_EXT = new Set(['.java', '.vue', '.js', '.ts', '.mjs']);
const SKIP_DIRS = new Set(['node_modules', 'target', '.git', 'dist', '.wiki', '.github', '.vscode', '.idea', 'coverage', 'playwright-report', 'test-results', 'sdd']);

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const p = join(dir, entry);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else {
      const ext = entry.includes('.') ? '.' + entry.split('.').pop() : '';
      if (SRC_EXT.has(ext)) out.push(p);
    }
  }
  return out;
}

const SPEC_OK = /^docs\/(design|reference|adr)\/[\w./-]+(#[\w.-]+)?$/;
const CAP_OK = /^[a-z][\w-]*\.[a-z][a-z0-9-]*$/;

const issues = [];
let scanned = 0, specs = 0, caps = 0;

for (const f of walk(REPO_ROOT)) {
  scanned++;
  const content = readFileSync(f, 'utf8');
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const specMatch = line.match(/@spec\s+(\S+)/);
    if (specMatch) {
      specs++;
      if (!SPEC_OK.test(specMatch[1])) {
        issues.push({ file: relative(REPO_ROOT, f), line: i + 1, kind: 'spec-malformed', detail: specMatch[1] });
      }
    }
    const capMatch = line.match(/@capability\s+(\S+)/);
    if (capMatch) {
      caps++;
      if (!CAP_OK.test(capMatch[1])) {
        issues.push({ file: relative(REPO_ROOT, f), line: i + 1, kind: 'capability-malformed', detail: capMatch[1] });
      }
    }
  }
}

console.log(`\n[anchor-shallow] ${relative(process.cwd(), REPO_ROOT)}`);
console.log(`  scanned: ${scanned} source files`);
console.log(`  @spec:   ${specs}`);
console.log(`  @capability: ${caps}`);

if (issues.length === 0) {
  console.log(`\n✓ All anchors well-formed.\n`);
  process.exit(0);
} else {
  console.log(`\n✗ ${issues.length} malformed:\n`);
  for (const i of issues) console.log(`  ${i.kind.padEnd(22)} ${i.file}:${i.line} → ${i.detail}`);
  process.exit(1);
}
