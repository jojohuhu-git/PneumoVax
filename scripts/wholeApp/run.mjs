#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────
// run.mjs — run the whole-app rule checks.
//
//   node scripts/wholeApp/run.mjs                     every check, every patient
//   node scripts/wholeApp/run.mjs --checks 1,4        two checks
//   node scripts/wholeApp/run.mjs --only grid         the 17,016 only
//   node scripts/wholeApp/run.mjs --out result.json   keep every group
//
// Prints distinct patients per check and per root cause, then any failure group
// `causes.mjs` has not sorted. Exits 1 on any real or unsorted failure. Splits
// the work across the machine's cores: over all 77,496 patients the replay
// follows about a million screens.
// ─────────────────────────────────────────────────────────────────────────
import { fork } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { cpus } from 'node:os';
import { fileURLToPath } from 'node:url';
import { allPatients, walk } from './replay.mjs';
import {
  CHECK_NAMES, ageLineCheck, doseLineCases, doseLineCheck, newTally, replayChecks, stableOverTime,
} from './checks.mjs';
import { CAUSES, deadLines, expectedAtAgeLine, expectedAtDoseLine } from './causes.mjs';
import { GRID_RISK_PROFILES } from '../../src/test-grid.js';

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i < 0 ? fallback : process.argv[i + 1];
};
const wanted = new Set((arg('checks', '1,2,3,4,5,6,7')).split(',').map(Number));
const only = arg('only', null);
const out = arg('out', null);
const jobs = Number(arg('jobs', Math.max(1, cpus().length - 1)));

function runShard(k, n) {
  const tally = newTally();
  const patients = allPatients({ only });
  const visitor = replayChecks(tally, wanted);
  const replay = [1, 2, 3, 4, 5, 7].some((c) => wanted.has(c));
  let states = 0;
  let done = 0;
  patients.forEach((p, i) => {
    if (i % n !== k) return;
    tally.setPatient(p);
    done += 1;
    if (replay) states += walk(p, visitor).states;
    if (wanted.has(6)) ageLineCheck(tally, p, expectedAtAgeLine);
    if (wanted.has(7)) stableOverTime(tally, p);
  });
  if (wanted.has(6)) {
    doseLineCases(GRID_RISK_PROFILES).forEach((c, i) => {
      if (i % n !== k) return;
      tally.setPatient({ key: `dose-line|${c.product}@${c.L}m|${c.prior.name}|r:${c.riskIds.join('+')}`, group: 'typical', input: c });
      doseLineCheck(tally, c, expectedAtDoseLine);
    });
  }
  return { done, states, rows: tally.rows(), causes: tally.causes() };
}

function merge(results) {
  const groups = new Map();
  for (const { rows } of results) {
    for (const r of rows) {
      const k = `${r.check}\t${r.kind}\t${r.group}`;
      const g = groups.get(k);
      if (!g) groups.set(k, { ...r, examples: [...r.examples] });
      else {
        g.flags += r.flags;
        g.grid += r.grid;
        g.typical += r.typical;
        if (g.examples.length < 4) g.examples.push(...r.examples.slice(0, 4 - g.examples.length));
      }
    }
  }
  return [...groups.values()];
}

// The kinds that are a report, not a failure: a line doing what its rule says.
const INFORMATIONAL = new Set(['line-changes-what-the-rule-says', 'dose-line-changes-what-the-rule-says']);

/** A patient counts once per cause, so these rows are distinct patients, unlike group totals. */
function mergeCauses(results) {
  const m = new Map();
  for (const { causes } of results) {
    for (const c of causes) {
      const k = `${c.cause}\t${c.check}`;
      const g = m.get(k) ?? { cause: c.cause, check: c.check, grid: 0, typical: 0 };
      g.grid += c.grid;
      g.typical += c.typical;
      m.set(k, g);
    }
  }
  return [...m.values()];
}

function report(rows, causes, totals) {
  const fails = rows.filter((r) => !INFORMATIONAL.has(r.kind));
  console.log(`\n${totals.done} patients, ${totals.states} screens followed.\n`);
  console.log('By check (distinct patients with a real or unsorted failure):');
  for (const c of [...wanted, 'harness']) {
    const mine = causes.filter((x) => x.check === c && ['real', 'unsorted'].includes(CAUSES[x.cause]?.class));
    console.log(`  ${c} ${(CHECK_NAMES[c] ?? '').padEnd(24)} grid ${mine.reduce((a, r) => a + r.grid, 0)}, typical ${mine.reduce((a, r) => a + r.typical, 0)}`);
  }
  console.log('\nBy cause (distinct patients):');
  for (const c of causes.filter((x) => x.check === 'all').sort((a, b) => a.cause.localeCompare(b.cause))) {
    console.log(`  ${c.cause.padEnd(44)} [${CAUSES[c.cause]?.class}] grid ${c.grid}, typical ${c.typical}`);
  }
  const dead = wanted.has(6) ? deadLines(rows) : [];
  if (dead.length) console.log(`\nLINES THAT CHANGED NOBODY'S ANSWER: ${dead.join(', ')}`);
  const unsorted = fails.filter((r) => r.cause === 'unsorted').sort((a, b) => (b.grid + b.typical) - (a.grid + a.typical));
  console.log(`\nUnsorted groups: ${unsorted.length}`);
  for (const r of unsorted.slice(0, Number(arg('show', 40)))) {
    console.log(`  [${r.check}] ${r.kind} — ${r.group}  (grid ${r.grid}, typical ${r.typical})`);
  }
  // Only what the header promises: a real or unsorted fault (or a dead age
  // line). 'info' groups — an age line doing its job, P2-9's "Routine then
  // Catch-up" — are not faults; they made this exit 1 on a clean run until
  // 2026-11-08, the first run with no real fault left to hide it.
  return fails.some((r) => ['real', 'unsorted'].includes(CAUSES[r.cause]?.class)) || dead.length > 0;
}

if (process.argv[2] === '--shard') {
  const [k, n] = process.argv[3].split('/').map(Number);
  process.send(runShard(k, n), () => process.exit(0));
} else {
  const self = fileURLToPath(import.meta.url);
  const passThrough = process.argv.slice(2);
  const results = await Promise.all(Array.from({ length: jobs }, (_, k) => new Promise((resolve, reject) => {
    const child = fork(self, ['--shard', `${k}/${jobs}`, ...passThrough], { serialization: 'advanced' });
    child.on('message', resolve);
    child.on('error', reject);
    child.on('exit', (code) => { if (code) reject(new Error(`shard ${k} exited ${code}`)); });
  })));
  const rows = merge(results);
  const causes = mergeCauses(results);
  const totals = results.reduce((a, r) => ({ done: a.done + r.done, states: a.states + r.states }), { done: 0, states: 0 });
  const failed = report(rows, causes, totals);
  if (out) writeFileSync(out, JSON.stringify({ totals, causes, rows }, null, 1));
  process.exit(failed ? 1 : 0);
}
