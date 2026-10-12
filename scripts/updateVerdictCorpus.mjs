#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────
// updateVerdictCorpus.mjs — regenerate the committed verdict corpus.
//
//   npm run sweep:update
//
// Run this ONLY when you meant to change the engine's answers, and then read
// what it prints. It tells you how many of the ~14,500 synthetic patients got a
// different answer, and shows a sample of before/after.
//
// That number belongs in the pull request description. It is the whole point of
// the corpus: ANCHOR-1 moved 19,546 patients' verdicts and P0-2 moved five whole
// cells of CDC's infant table, and in both cases every guard the repo had came
// out byte-identical. A number in the diff cannot come out byte-identical.
//
// If the number surprises you, do not regenerate — find out why first.
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { corpusLines, CORPUS_RELATIVE_PATH, CORPUS_TODAY } from '../src/test-grid.js';

const target = resolve(import.meta.dirname, '..', CORPUS_RELATIVE_PATH);

const before = existsSync(target)
  ? readFileSync(target, 'utf8').split('\n').filter(Boolean)
  : [];

process.stdout.write(`Running the engine over the grid (pinned to ${CORPUS_TODAY})... `);
const after = corpusLines();
console.log(`${after.length} cases.`);

const asMap = (lines) => new Map(lines.map((l) => {
  const i = l.indexOf('\t');
  return [l.slice(0, i), l.slice(i + 1)];
}));
const b = asMap(before);
const a = asMap(after);

const moved = [];
const added = [];
const removed = [];
for (const [k, v] of a) {
  if (!b.has(k)) added.push(k);
  else if (b.get(k) !== v) moved.push(k);
}
for (const k of b.keys()) if (!a.has(k)) removed.push(k);

mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, `${after.join('\n')}\n`);

if (!before.length) {
  console.log(`\nCreated ${CORPUS_RELATIVE_PATH} with ${after.length} cases.`);
  process.exit(0);
}

console.log('');
console.log(`  verdicts moved : ${moved.length} of ${b.size}`);
console.log(`  cases added    : ${added.length}`);
console.log(`  cases removed  : ${removed.length}`);

if (moved.length) {
  console.log('\nA sample of what changed:\n');
  for (const k of moved.slice(0, 10)) {
    console.log(`  ${k}`);
    console.log(`    was: ${b.get(k)}`);
    console.log(`    now: ${a.get(k)}`);
  }
  if (moved.length > 10) console.log(`  ... and ${moved.length - 10} more.`);
  console.log('\nPut the moved count in the pull request, and say why those patients');
  console.log('should get a different answer now. If you cannot say why, this is a bug.');
}
if (!moved.length && !added.length && !removed.length) {
  console.log('\nNothing changed — the corpus was already current.');
}
