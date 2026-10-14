// S6-4 — the averaged length of a month (30.4375 days) has one home.
//
// ── What was wrong ───────────────────────────────────────────────────────
//
// Three files wrote the number out independently:
//
//   dateUtils.js   DAYS.months = (m) => Math.round(m * 30.4375)
//   validate.js    Math.round((minAgeM * 30.4375) / 7)   months → weeks, for display
//   brands.js      PCV_MIN_AGE_M = PCV_MIN_AGE_DAYS / 30.4375
//
// The number census queued this as the highest-duplication item in the app.
// It claimed six copies; measured on 2026-10-13 only these three were live
// code — the rest are comments describing bugs this number already caused.
//
// ── Why this number in particular deserves a name ────────────────────────
//
// It is an APPROXIMATION, and `dateUtils.js`'s own comments record what it has
// cost when used as if it were exact: a calendar-exact ten-year span measured
// this way lands at ~119.98 months and wrongly trips a "< 120 months" age
// gate, and a real six-month interval of 181 days fails a `DAYS.months(6)`
// (= 183) minimum. Both were fixed by moving the clinical comparisons onto the
// calendar-exact helpers (`calendarMonthsBetween`, `addCalendarMonths`,
// `calendarIntervalElapsed`).
//
// So naming it does more than remove duplication: it makes every remaining use
// of the rough ruler findable by one word. A bare `30.4375` scattered across
// three files cannot be audited; `AVG_DAYS_PER_MONTH` can.
//
// The name is MeningoVax's — it already calls this constant
// `AVG_DAYS_PER_MONTH` in two of its own modules.
//
// ── The mirror ───────────────────────────────────────────────────────────
//
// `dateUtils.js` is kept identical across PneumoVax and MeningoVax (CLAUDE.md
// makes that non-negotiable), so the export was added to BOTH. The last test
// here compares the two files and fails if they drift — the hand-maintained
// mirror previously had nothing checking it. It is SKIPPED, not failed, when
// the sibling repo is not checked out alongside this one, because CI clones
// only this repo.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { AVG_DAYS_PER_MONTH, DAYS } from '../dateUtils.js';
import { PCV_MIN_AGE_DAYS, PCV_MIN_AGE_M } from '../../data/brands.js';
import { analyzeBoth } from '../validate.js';

const MENINGO_DATEUTILS = '/Users/joannehuang/Downloads/MeningoVax-main/src/logic/dateUtils.js';

/** The file with its comments removed, so a guard scans real code only. */
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

describe('S6-4 — the averaged month has one home', () => {
  it('dateUtils.js states it', () => {
    expect(AVG_DAYS_PER_MONTH).toBe(30.4375);
  });

  it('the day-count helper is computed from it', () => {
    expect(DAYS.months(1)).toBe(Math.round(AVG_DAYS_PER_MONTH));
    expect(DAYS.months(6)).toBe(Math.round(6 * AVG_DAYS_PER_MONTH));
  });

  it('the PCV minimum age is derived from it, not from a second copy', () => {
    // 42 days is the exact number ACIP states; months is the derived form.
    expect(PCV_MIN_AGE_M).toBe(PCV_MIN_AGE_DAYS / AVG_DAYS_PER_MONTH);
  });

  // The behaviour that must not move: the validator's sub-2-month minimum is
  // spelled in weeks, and the words must still say six. Derived from the exact
  // day count (42 / 7) rather than typed, so this cannot drift either.
  it('a PCV dose below the minimum age still reads the same number of weeks', () => {
    const r = analyzeBoth({
      pcvDoses: [{ date: '2020-01-20', product: 'PCV13' }],  // 19 days old
      ppsv23Doses: [],
      ageMonths: 72,
      today: '2026-01-01',
      dob: '2020-01-01',
      riskIds: [],
    });
    const v = r.pcv.perDose[0];
    expect(v.status).toBe('invalid');
    const weeks = PCV_MIN_AGE_DAYS / 7;
    expect([...v.reasons, v.detail].join(' ')).toContain(`${weeks} week`);
  });

  describe('the source guards', () => {
    it.each(['../validate.js', '../../data/brands.js'])(
      '%s reads the shared constant instead of typing the number',
      (rel) => {
        const code = read(rel);
        expect(code).not.toMatch(/30\.4375/);
        expect(code).toContain('AVG_DAYS_PER_MONTH');
      },
    );

    it('dateUtils.js writes the number once, in the constant itself', () => {
      const code = read('../dateUtils.js');
      expect([...code.matchAll(/30\.4375/g)]).toHaveLength(1);
      expect(code).toMatch(/export const AVG_DAYS_PER_MONTH = 30\.4375;/);
    });
  });

  // The mirror had nothing guarding it until now. CLAUDE.md requires this file
  // to be identical in both apps; the only sanctioned difference is the mirror
  // NOTE itself, which exists only in PneumoVax's copy. Comparing code-only
  // text makes that exception automatic rather than hand-waved.
  it("matches MeningoVax's copy line for line, comments aside", () => {
    let sibling;
    try {
      sibling = readFileSync(MENINGO_DATEUTILS, 'utf8');
    } catch {
      return; // sibling repo not present (CI) — the guards above still ran
    }
    const lines = (src) =>
      codeOnly(src).split('\n').map((l) => l.trimEnd()).filter(Boolean);

    const mine = lines(readFileSync(new URL('../dateUtils.js', import.meta.url), 'utf8'));
    expect(mine.length).toBeGreaterThan(20);   // not vacuous
    expect(mine).toEqual(lines(sibling));
  });
});
