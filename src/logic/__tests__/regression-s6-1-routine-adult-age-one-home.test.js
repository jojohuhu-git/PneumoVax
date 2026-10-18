// S6-1 — the age at which ROUTINE adult pneumococcal vaccination begins (50
// years / 600 months) had no home. It was typed out twice, in two files that
// never speak to each other:
//
//   recommend.js   M.y50 = 600         (the engine's decision)
//   format.js      if (am < 600) ...   (the words shown to the clinician)
//
// That is the shape of every bug this app has had with a clinical number: the
// engine judges a patient against one copy while the screen describes them
// using another, and nothing fails when only one copy is updated. ACIP lowered
// this age from 65 to 50 in 2024 (mm7401a1), so it is a number that has already
// moved once and may move again.
//
// The same file also judged the adolescent/adult boundary against a bare `228`
// while `scheduleConstants.js` existed specifically to own that number — the
// very drift (H1) that file was created to prevent.
//
// These tests hold the displayed age band to the shared constants, and the
// source guards fail if either number is ever typed out in that code again.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { ageGroup } from '../format.js';
import {
  ADULT_SCHED_MIN_M,
  PCV21_MIN_AGE_M,
  ROUTINE_ADULT_MIN_M,
} from '../scheduleConstants.js';

/**
 * The file with its comments removed.
 *
 * Needed because the comments explaining THIS rule name the numbers 228 and
 * 600 on purpose. Matching the raw source would report a comment as an
 * offending literal — a false positive that teaches the next session to
 * distrust the guard. Comment text is replaced by its own newlines rather than
 * deleted, so a reported line number still points at the right real line.
 */
function codeOnly(src) {
  const blank = (m) => m.replace(/[^\n]/g, '');
  return src
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    .replace(/^\s*\/\/.*$/gm, blank)
    .replace(/\s+\/\/.*$/gm, '');
}

function read(rel) {
  return codeOnly(readFileSync(new URL(rel, import.meta.url), 'utf8'));
}

/** The body of a named function, so a guard can scan it and nothing else. */
function functionBody(src, name) {
  const start = src.indexOf(`function ${name}(`);
  expect(start, `${name}() not found`).toBeGreaterThan(-1);
  const open = src.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < src.length; i += 1) {
    if (src[i] === '{') depth += 1;
    else if (src[i] === '}') {
      depth -= 1;
      if (depth === 0) return src.slice(open, i + 1);
    }
  }
  throw new Error(`could not find the end of ${name}()`);
}

describe('S6-1 — the routine-adult age (50y) has one home', () => {
  it('scheduleConstants.js states it, as its own clinical concept', () => {
    expect(ROUTINE_ADULT_MIN_M).toBe(600);
  });

  // CLAUDE.md: the boundary constants are distinct clinical concepts and must
  // never be collapsed into one. This is now a three-way version of that rule.
  it('it is distinct from both existing boundary constants', () => {
    const all = [ADULT_SCHED_MIN_M, PCV21_MIN_AGE_M, ROUTINE_ADULT_MIN_M];
    expect(new Set(all).size).toBe(3);
    // 18y (product floor) < 19y (schedule) < 50y (routine start).
    expect(PCV21_MIN_AGE_M).toBeLessThan(ADULT_SCHED_MIN_M);
    expect(ADULT_SCHED_MIN_M).toBeLessThan(ROUTINE_ADULT_MIN_M);
  });

  // The displayed band is what a clinician reads back to check they typed the
  // right age, so it must sit on the same numbers the engine routes on.
  it('the displayed age band turns over exactly at the shared constants', () => {
    expect(ageGroup(ADULT_SCHED_MIN_M - 1)).toBe('Adolescent (11–18y)');
    expect(ageGroup(ADULT_SCHED_MIN_M)).toBe('Adult (19–49y)');
    expect(ageGroup(ROUTINE_ADULT_MIN_M - 1)).toBe('Adult (19–49y)');
    expect(ageGroup(ROUTINE_ADULT_MIN_M)).toBe('Older adult (≥50y)');
  });

  it('ageGroup() does not write either boundary out by hand', () => {
    const body = functionBody(read('../format.js'), 'ageGroup');
    expect(body).not.toMatch(/\b228\b/);
    expect(body).not.toMatch(/\b600\b/);
    // It must be reading the shared constants instead.
    expect(body).toContain('ADULT_SCHED_MIN_M');
    expect(body).toContain('ROUTINE_ADULT_MIN_M');
  });

  it("the engine's age-band table does not write 600 out by hand", () => {
    const src = read('../recommend.js');
    const table = src.slice(src.indexOf('const M = {'), src.indexOf('};', src.indexOf('const M = {')));
    expect(table.length).toBeGreaterThan(20);
    expect(table).not.toMatch(/\b600\b/);
    expect(table).toContain('ROUTINE_ADULT_MIN_M');
  });

  // WIDENED 2026-10-17 (C8 document 2). The guard above scanned the `M` table
  // and nothing else, so a hand-typed 600 anywhere ELSE in the engine walked
  // straight past it. That was measured, not supposed: C8 added an
  // age-conditional source list, and replacing its `isOlderAdult` with a bare
  // `am >= 600` left **all 1,156 tests green** — behaviourally identical code,
  // and exactly the second age test `CLAUDE.md` forbids twice ("Never add an
  // age test that decides whether a rule may bite", the S14-RC root cause).
  // A behavioural test cannot catch it, because there is no behaviour to
  // catch; only the source can. There are 0 bare 600s in the engine's code
  // today, so this starts from a clean file.
  it('nowhere else in the engine writes 600 out by hand either', () => {
    const src = read('../recommend.js');
    const mStart = src.indexOf('const M = {');
    const outsideTheTable = src.slice(0, mStart) + src.slice(src.indexOf('};', mStart));
    expect(outsideTheTable).not.toMatch(/\b600\b/);
  });
});
