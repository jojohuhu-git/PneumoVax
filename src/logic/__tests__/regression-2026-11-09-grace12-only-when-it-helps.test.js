// ── §A-GRACE12-HELPS: the 12-month grace only where it means fewer doses owed
//    (OWNER RULING 2026-11-09, "Ivy") ──────────────────────────────────────
//
// §A-GRACE12 (2026-10-31, "Lily") reads a PCV dose given 1-4 days before the
// first birthday as the 12-month dose. That helps Lily (her booster counts),
// but it also costs credit: the 12-month dose owes the NEXT dose 8 weeks,
// where a dose before the birthday owes it 4 (CDC Catch-up Table 2: "4 weeks
// if first dose was administered before the 1st birthday / 8 weeks (as final
// dose for healthy children) if first dose was administered at the 1st
// birthday or after").
//
// Ivy has asplenia: her first-ever PCV20 2 days before her 1st birthday, the
// next 4 weeks later, a third 8 weeks after that. Read as a 12-month dose,
// dose 2 was thrown out and at age 2 she owed two more PCVs; read at its real
// age, all three count and she is complete. CDC's CDSI v4.64 (local copy)
// counts all three — its 4-dose series has dose 1→2 at "4 weeks - 4 days".
// Asked "should the 12-month grace be used only when it helps, as you ruled
// for Rosa at age 2?", the owner chose "Only when it helps": read the history
// both ways, keep the reading that owes fewer doses, and on a tie keep
// today's reading.
//
// Measured against untouched main over 214,200 hand-built baby views (every
// one with a dose 0-5 days before the 1st birthday): 2,496 moved, 0 lost
// "complete", 0 owe more. Two families, both at-risk only:
//   - Ivy's (window, +4 wk, +8 wk): 960 views; 720 now complete.
//   - window, then the next dose 8 or 10 weeks later: 1,536 views; "up to
//     date for age, 2 more at age 2" becomes "PCV dose 3 of 3" now.

import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';

const DOB = '2024-07-20';                 // first birthday 2025-07-20
const run = (dates, today, riskIds, product = 'PCV20') => recommend({
  dob: DOB, today, riskIds,
  pcvDoses: dates.map((date) => ({ product, date })), ppsv23Doses: [],
});
const pcvCard = (r) => r.recs.find((x) => x.vaccine === 'PCV');
const verdicts = (r) => r.perDose.pcv.map((v) => v.status);

const IVY = ['2025-07-18', '2025-08-15', '2025-10-10'];   // 2 days early, +28 d, +56 d

describe('Ivy, the patient she was shown', () => {
  it('at 2 years 3 months: all three doses count and her series is complete', () => {
    const r = run(IVY, '2026-11-09', ['asplenia']);
    expect(verdicts(r)).toEqual(['valid', 'valid', 'valid']);
    expect(pcvCard(r).status).toBe('complete');
  });

  it('at 15 months she already reads complete, not "up to date for age, 2 more at age 2"', () => {
    const dob = '2025-08-01';
    const r = recommend({
      dob, today: '2026-11-09', riskIds: ['asplenia'], ppsv23Doses: [],
      pcvDoses: ['2026-07-30', '2026-08-27', '2026-10-22'].map((date) => ({ product: 'PCV20', date })),
    });
    expect(pcvCard(r).status).toBe('complete');
  });

  it('with PCV13 and diabetes she owes 1 dose of PCV20 at age 2, not 2 more PCVs', () => {
    const card = pcvCard(run(IVY, '2026-11-09', ['diabetes'], 'PCV13'));
    expect(card.doseLabel).toMatch(/^Option A: 1 dose PCV20/);
  });
});

describe('the controls she was shown do not move', () => {
  it('the same history with dose 1 six days early (outside the grace): complete', () => {
    const r = run(['2025-07-14', '2025-08-11', '2025-10-06'], '2026-11-09', ['asplenia']);
    expect(pcvCard(r).status).toBe('complete');
  });

  it('the same history with dose 1 ON the birthday: dose 2 is too soon, 2 more PCVs at age 2', () => {
    const r = run(['2025-07-20', '2025-08-17', '2025-10-12'], '2026-11-09', ['asplenia']);
    expect(verdicts(r)).toEqual(['valid', 'invalid', 'valid']);
    expect(pcvCard(r).doseLabel).toBe('PCV dose 1 of 2 (at-risk catch-up)');
  });
});

describe('on a tie, today\'s reading (the 12-month dose) stays', () => {
  it('Lily: a booster 2 days before the birthday still completes her series', () => {
    const r = recommend({
      dob: '2025-01-15', today: '2026-03-01', riskIds: [], ppsv23Doses: [],
      pcvDoses: ['2025-03-15', '2025-05-15', '2025-07-15', '2026-01-13'].map((date) => ({ product: 'PCV20', date })),
    });
    expect(pcvCard(r).doseLabel).toBe('PCV series complete (4 doses)');
  });

  it('healthy, Ivy\'s history: complete either way, so dose 2 stays thrown out', () => {
    const r = run(IVY, '2026-11-09', []);
    expect(pcvCard(r).status).toBe('complete');
    expect(verdicts(r)).toEqual(['valid', 'invalid', 'valid']);
  });

  it('healthy, first dose in the window then a second 4 weeks later: 1 owed either way — dose 2 of 2', () => {
    const r = run(['2025-07-18', '2025-08-15'], '2025-09-01', []);
    expect(verdicts(r)).toEqual(['valid', 'invalid']);
    expect(pcvCard(r).doseLabel).toBe('PCV dose 2 of 2');
  });
});

describe('whole readings, never a mix', () => {
  // The 12-month reading's age band (both doses at 12+ months) with the real
  // age's 4-week spacing would finish a healthy baby on two doses 4 weeks
  // apart — something neither reading, nor CDSI, allows.
  it('healthy, window dose then a dose 4 weeks later is never "complete"', () => {
    for (const today of ['2025-08-15', '2025-09-01', '2026-03-01']) {
      expect(pcvCard(run(['2025-07-18', '2025-08-15'], today, [])).status).not.toBe('complete');
    }
  });
});

describe('the second family: at-risk, window dose, next dose 8 weeks later', () => {
  it('at 13 months: dose 3 of 3 is owed now, instead of 2 more PCVs at age 2', () => {
    const r = run(['2025-07-18', '2025-09-12'], '2025-09-12', ['diabetes']);
    expect(verdicts(r)).toEqual(['valid', 'valid']);
    expect(pcvCard(r).doseLabel).toBe('PCV dose 3 of 3');
  });

  it('healthy, same history: two doses from the 12-month reading finish the series (unchanged)', () => {
    expect(pcvCard(run(['2025-07-18', '2025-09-12'], '2025-09-12', [])).status).toBe('complete');
  });
});

describe('what does not move', () => {
  it('no date of birth: no grace, so nothing to choose between', () => {
    const r = recommend({
      ageMonths: 27, today: '2026-11-09', riskIds: ['asplenia'], ppsv23Doses: [],
      pcvDoses: IVY.map((date) => ({ product: 'PCV20', date })),
    });
    expect(r.recs.length).toBeGreaterThan(0);
  });

  it('the 24-month grace still only adds credit (Rosa stays complete)', () => {
    const r = recommend({
      dob: '2024-08-09', today: '2026-09-15', riskIds: ['asplenia'], ppsv23Doses: [],
      pcvDoses: [
        { product: 'PCV13', date: '2024-10-09' }, { product: 'PCV13', date: '2024-12-09' },
        { product: 'PCV20', date: '2026-08-07' },
      ],
    });
    expect(pcvCard(r).status).toBe('complete');
  });
});
