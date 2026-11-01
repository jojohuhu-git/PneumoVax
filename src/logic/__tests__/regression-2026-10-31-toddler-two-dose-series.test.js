// ── §L-T1-12TO23 (2026-10-31): a toddler who STARTED at 12-23 months is ──
//    finished after two doses, not three
//
// Found by the typical-patient walk (follow the app's own advice forward). A
// 15-month-old with no doses was told "2 doses in total for this child", got
// them 8 weeks apart, and was then told "PCV dose 3 of 3 … 3 doses in total".
//
// p2016 Table 1 (Item #P2016, 2/16/2024, read live 2026-10-31), "all children
// (healthy and those with risk conditions) age 2 through 23 months", 12 through
// 23 months:
//   "0 before age 12 months | 2 doses: 2 doses 8 weeks apart"
//   "1 dose at age 12 months or older | 1 additional dose, at least 8 weeks
//    after the most recent dose"
// CDC Catch-up Table 2 (read live 2026-10-31), dose 1 to dose 2: "8 weeks (as
// final dose for healthy children) if first dose was administered at the 1st
// birthday or after".
//
// Cause: the 12-23-month ladder wrote `target = at12plus + 1`, so the row for
// ONE dose at 12+ months added one to however many there were. Its own
// comment says a row's total is "the doses the ROW KEYS ON" plus what it owes.
//
// An AT-RISK toddler is finished by Table 1 too (OWNER RULING B, 2026-10-23: no
// healthy/at-risk split under 24 months) — and at 24 months her own rows ask
// for more: p2016 Table 4 "0, 1, or 2 PCV doses by age 24 months", and CDC's
// "final dose for HEALTHY children". That card is pinned unchanged below.

import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';

const DOB = '2025-01-15';
const run = (today, ageMonths, dates, riskIds = []) => recommend({
  dob: DOB, ageMonths, today, riskIds,
  pcvDoses: dates.map((date) => ({ product: 'PCV20', date })), ppsv23Doses: [],
});
const labels = (out) => out.recs.map((r) => r.doseLabel);

describe('first seen at 15 months, two doses 8 weeks apart', () => {
  it('after the first dose: "PCV dose 2 of 2"', () => {
    expect(labels(run('2026-04-15', 15, ['2026-04-15']))).toEqual(['PCV dose 2 of 2']);
  });

  it('healthy, after the second: complete — not "PCV dose 3 of 3"', () => {
    const out = run('2026-06-10', 16, ['2026-04-15', '2026-06-10']);
    expect(out.recs).toHaveLength(1);
    expect(out.recs[0].status).toBe('complete');
    expect(out.recs[0].doseLabel).toBe('PCV series complete (2 doses)');
  });

  it('diabetes, after the second: complete under 24 months too (Table 1 is for all children)', () => {
    const out = run('2026-06-10', 16, ['2026-04-15', '2026-06-10'], ['diabetes']);
    expect(out.recs.map((r) => r.status)).toEqual(['complete']);
  });

  // Both doses here are PCV20, and she is STILL owed two at age 2: her rows
  // key on the dose count, not the product. The card must say what the
  // 24-month card will ask, not "no further dose" or "one further dose".
  for (const riskIds of [['diabetes'], ['asplenia']]) {
    it(`${riskIds[0]}: the card says two more PCV doses fall due at age 2, citing the row she followed and CDC's`, () => {
      const r = run('2026-06-10', 16, ['2026-04-15', '2026-06-10'], riskIds).recs[0];
      expect(r.note.detail).toMatch(/2 more PCV doses fall due from the 2nd birthday/);
      expect(r.note.detail).not.toMatch(/one further dose|no further pneumococcal dose/);
      expect(r.noteCites.map((c) => c.key)).toEqual(['p2016Table1_12to23_noneBefore12', 'pedsRiskIncompleteCatchup']);
    });
  }

  it('three months later, still complete (the bug said "due today")', () => {
    const out = run('2026-09-10', 19, ['2026-04-15', '2026-06-10']);
    expect(out.recs.map((r) => r.status)).toEqual(['complete']);
  });
});

describe('unchanged', () => {
  it('diabetes at 24 months: her own at-risk rows still ask for two more doses', () => {
    const out = run('2027-01-15', 24, ['2026-04-15', '2026-06-10'], ['diabetes']);
    expect(labels(out)).toEqual(['PCV dose 1 of 2 (at-risk catch-up)']);
  });

  it('one dose before 12 months and one after still owes a third (Table 1 "1 before age 12 months")', () => {
    const out = run('2026-04-15', 15, ['2025-11-15', '2026-02-15']);
    expect(labels(out)).toEqual(['PCV dose 3 of 3']);
  });

  it('a second dose given too soon does not finish it', () => {
    const out = run('2026-05-15', 16, ['2026-04-15', '2026-05-10']);
    expect(out.recs[0].status).not.toBe('complete');
  });
});
