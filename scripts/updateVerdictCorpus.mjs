#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────
// updateVerdictCorpus.mjs — regenerate the committed verdict corpora.
//
//   npm run sweep:update
//
// Run this ONLY when you meant to change the engine's answers, and then read
// what it prints. It tells you how many synthetic patients got a different
// answer, and shows a sample of before/after.
//
// That number belongs in the pull request description. It is the whole point of
// the corpora: ANCHOR-1 moved 19,546 patients' verdicts and P0-2 moved five whole
// cells of CDC's infant table, and in both cases every guard the repo had came
// out byte-identical. A number in the diff cannot come out byte-identical.
//
// If the number surprises you, do not regenerate — find out why first.
//
// ── Two corpora (owner decision, 2026-10-12) ─────────────────────────────
//
//   verdict-corpus.tsv         patients a clinician could really enter.
//   record-problem-corpus.tsv  records they could not — a dose dated before the
//                              patient was born, or dated after today.
//
// Kept apart so the first one's count keeps its meaning: a clinical change that
// moves 300 real patients should read as 300 lines, not 300 lost among 23,000
// impossible records. Both are regenerated together, and both are gates — see
// sweep-verdict-corpus.test.js and sweep-record-problem-corpus.test.js.
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import {
  corpusLines,
  recordProblemCorpusLines,
  CORPUS_RELATIVE_PATH,
  RECORD_PROBLEM_CORPUS_RELATIVE_PATH,
  CORPUS_TODAY,
} from '../src/test-grid.js';

const asMap = (lines) => new Map(lines.map((l) => {
  const i = l.indexOf('\t');
  return [l.slice(0, i), l.slice(i + 1)];
}));

/**
 * Regenerate one corpus and report what moved.
 *
 * Returns true when anything changed, so the summary at the end can say
 * "nothing changed" only when that is true of BOTH files — a per-file message
 * would otherwise let one file's silence read as the whole run's.
 */
function regenerate(label, relativePath, build) {
  const target = resolve(import.meta.dirname, '..', relativePath);
  const before = existsSync(target)
    ? readFileSync(target, 'utf8').split('\n').filter(Boolean)
    : [];

  process.stdout.write(`\n${label}\n  running the engine over the grid (pinned to ${CORPUS_TODAY})... `);
  const after = build();
  console.log(`${after.length} cases.`);

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
    console.log(`  created ${relativePath} with ${after.length} cases.`);
    return true;
  }

  console.log(`  verdicts moved : ${moved.length} of ${b.size}`);
  console.log(`  cases added    : ${added.length}`);
  console.log(`  cases removed  : ${removed.length}`);

  if (moved.length) {
    console.log('\n  A sample of what changed:\n');
    for (const k of moved.slice(0, 10)) {
      console.log(`    ${k}`);
      console.log(`      was: ${b.get(k)}`);
      console.log(`      now: ${a.get(k)}`);
    }
    if (moved.length > 10) console.log(`    ... and ${moved.length - 10} more.`);
  }

  return Boolean(moved.length || added.length || removed.length);
}

const changed = [
  regenerate('Real patients', CORPUS_RELATIVE_PATH, corpusLines),
  regenerate('Impossible entries', RECORD_PROBLEM_CORPUS_RELATIVE_PATH, recordProblemCorpusLines),
].some(Boolean);

if (changed) {
  console.log('\nPut the moved counts in the pull request, and say why those patients');
  console.log('should get a different answer now. If you cannot say why, this is a bug.');
} else {
  console.log('\nNothing changed — both corpora were already current.');
}
