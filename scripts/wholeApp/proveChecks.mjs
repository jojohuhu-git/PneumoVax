#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────
// proveChecks.mjs — does each check actually fail when the app is broken?
//
//   node scripts/wholeApp/proveChecks.mjs [--only M3,M7a] [--out result.json]
//
// A check nobody has seen fail proves nothing. Each mutation below breaks the
// app on purpose in a way one check exists to catch, runs that check over the
// grid, and compares the failing-patient count with the unbroken app's.
//
// The breaking happens in a THROWAWAY COPY of `src/` and `scripts/wholeApp/`,
// made fresh for each mutation in the system's temp folder, so this working
// copy is never touched and there is nothing to restore. (`git checkout` during
// mutation testing deleted an uncommitted fix once; a copy cannot.)
//
// Several checks still fail on the unbroken app, so "it went red" would prove
// nothing. The bar is that the count of real-or-unsorted failures must MOVE.
// ─────────────────────────────────────────────────────────────────────────
import { execFileSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deadLines } from './causes.mjs';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const arg = (name) => { const i = process.argv.indexOf(`--${name}`); return i < 0 ? null : process.argv[i + 1]; };
const onlyIds = arg('only')?.split(',');

const REC = 'src/logic/recommend.js';
const VAL = 'src/logic/validate.js';
const RULES = 'src/logic/doseIntervalRules.js';

export const MUTATIONS = [
  { id: 'M1a', check: 1, what: 'Cards advise 6 weeks where the dose check still wants 8',
    file: REC, from: 'const WK8 = DAYS.weeks(8);', to: 'const WK8 = DAYS.weeks(6);' },
  { id: 'M2a', check: 2, what: 'The adult PCV card says it finishes the series when PCV15 does not',
    file: REC, from: 'doseLabel: o.doseLabel,', to: "doseLabel: o.doseLabel === '1 dose PCV (PCV20, PCV15, or PCV21)' ? `${o.doseLabel} — completes the series` : o.doseLabel," },
  { id: 'M2b', check: 2, what: 'The adult PCV card stops mentioning the PPSV23 that PCV15 needs',
    file: REC, from: '    note: o.note,', to: "    note: String(o.doseLabel).startsWith('1 dose PCV (PCV20, PCV15') ? 'Give 1 dose.' : o.note," },
  { id: 'M3a', check: 3, what: 'At-risk "complete" cards lose the line saying what happens at 19',
    file: REC, from: "if (!at19 || card.status !== 'complete') return card;", to: 'if (at19 || !at19) return card;' },
  // Moved from check 4 on 2026-11-05: both cards now share one date, so breaking
  // it moves them together and they still agree. Advice-accepted is what sees it.
  { id: 'M4a', check: 1, what: 'Both cards take the earlier of their two waits, not the later',
    file: REC, from: 'const earliestNextDate = pending.sort().at(-1) ?? null;', to: 'const earliestNextDate = pending.sort()[0] ?? null;' },
  { id: 'M4b', check: 4, what: 'R1 returns: the 2nd-PPSV23 card works out five years alone',
    file: REC, from: 'dueToday: icState.dueToday, earliestNextDate: icState.earliestNextDate, minIntervalMonths: MO60,\n      brands: [\'PPSV23', to: 'dueToday: dueStateMonths(ppsv.effective.find((d) => d.date)?.date || anchorPneumo, MO60, today).dueToday, earliestNextDate: dueStateMonths(ppsv.effective.find((d) => d.date)?.date || anchorPneumo, MO60, today).earliestNextDate, minIntervalMonths: MO60,\n      brands: [\'PPSV23' },
  { id: 'M5a', check: 5, what: 'The chip under a thrown-out dose prints a date a year later',
    file: RULES, from: 'repeatDueDate: repeatDueDate(rule, anchor, ctx),', to: 'repeatDueDate: repeatDueDate(rule, anchor, ctx)?.replace(/^\\d{4}/, (y) => String(Number(y) + 1)),' },
  { id: 'M6a', check: 6, what: 'The 6-year line moves to 6 years 1 month',
    file: REC, from: 'm7: 7, m12: 12, m24: 24, m60: 60, m72: 72,', to: 'm7: 7, m12: 12, m24: 24, m60: 60, m72: 73,' },
  { id: 'M6b', check: 6, what: 'The 2-year line reads "up to and including 24 months"',
    file: REC, from: 'if (am < M.m24) {\n    // FINDING D', to: 'if (am <= M.m24) {\n    // FINDING D' },
  { id: 'M6c', check: 6, what: 'PCV21 minimum age moves a month past 18 years',
    file: 'src/logic/scheduleConstants.js', from: 'export const PCV21_MIN_AGE_M = 216;', to: 'export const PCV21_MIN_AGE_M = 217;' },
  { id: 'M7a', check: 7, what: 'An advised date counts from today rather than from the last dose',
    file: REC, from: 'earliestNextDate: elapsed ? null : addDays(anchorDate, intervalDays),', to: 'earliestNextDate: elapsed ? null : addDays(today, intervalDays),' },
  { id: 'M7b', check: 7, what: "A dose's adult-or-child verdict reads today's age, not the age at the dose",
    file: VAL, from: '&& ageAtDoseForExtra >= ADULT_SCHED_MIN_M;', to: '&& ageMonths >= ADULT_SCHED_MIN_M;' },
  { id: 'H1', check: 1, what: 'CONTROL, breaking the harness: "not due until 12 months" read as due today, the 924-false-flag bug',
    file: 'scripts/wholeApp/replay.mjs', from: "if (/not due until the patient reaches 12 months/.test(noteText(r))) {\n    const date = addCalendarMonths(dob, 12);\n    return { kind: 'age-gated', date: date > today ? date : today };\n  }", to: "if (/not due until the patient reaches 12 months/.test(noteText(r))) {\n    return { kind: 'now', date: today };\n  }" },
];

function freshCopy() {
  const dir = mkdtempSync(join(tmpdir(), 'pneumovax-prove-'));
  cpSync(join(REPO, 'src'), join(dir, 'src'), { recursive: true });
  cpSync(join(REPO, 'scripts/wholeApp'), join(dir, 'scripts/wholeApp'), { recursive: true });
  cpSync(join(REPO, 'package.json'), join(dir, 'package.json'));
  return dir;
}

function runCheck(dir, check) {
  const out = join(dir, 'out.json');
  try {
    execFileSync('node', ['scripts/wholeApp/run.mjs', '--only', 'grid', '--checks', String(check), '--out', out, '--show', '0'], { cwd: dir, stdio: 'pipe' });
  } catch (e) {
    // Exit 1 just means failures were found. A crash writes no result file.
    if (e.status !== 1) throw new Error(String(e.stderr));
  }
  const { rows, causes } = JSON.parse(readFileSync(out, 'utf8'));
  const failing = causes
    .filter((c) => c.check === check && !/^(D\d|line-doing)/.test(c.cause))
    .reduce((a, c) => a + c.grid, 0);
  const dead = check === 6 ? deadLines(rows) : [];
  return { failing, dead, unsorted: rows.filter((r) => r.cause === 'unsorted').length };
}

const baselines = new Map();
const results = [];
for (const m of MUTATIONS.filter((x) => !onlyIds || onlyIds.includes(x.id))) {
  if (!baselines.has(m.check)) {
    const dir = freshCopy();
    baselines.set(m.check, runCheck(dir, m.check));
    rmSync(dir, { recursive: true, force: true });
  }
  const dir = freshCopy();
  const path = join(dir, m.file);
  const before = readFileSync(path, 'utf8');
  if (!before.includes(m.from)) { results.push({ ...m, error: 'text to break not found' }); console.log(`${m.id} NOT APPLIED: text not found`); continue; }
  writeFileSync(path, before.replace(m.from, m.to));
  const after = runCheck(dir, m.check);
  rmSync(dir, { recursive: true, force: true });
  const base = baselines.get(m.check);
  const caught = after.failing !== base.failing || after.dead.length > base.dead.length;
  results.push({ id: m.id, check: m.check, what: m.what, base: base.failing, broken: after.failing, dead: after.dead, unsorted: after.unsorted, caught });
  console.log(`${m.id} check ${m.check}: ${base.failing} → ${after.failing}${after.dead.length ? `, dead lines ${after.dead}` : ''}, new unsorted groups ${after.unsorted} — ${caught ? 'CAUGHT' : 'NOT CAUGHT'} — ${m.what}`);
}
if (arg('out')) writeFileSync(arg('out'), JSON.stringify(results, null, 1));
process.exit(results.every((r) => r.caught) ? 0 : 1);
