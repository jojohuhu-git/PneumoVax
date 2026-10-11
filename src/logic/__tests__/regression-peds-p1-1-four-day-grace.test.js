// peds audit P1-1 (S10, 2026-10-10) — CDC's 4-day grace on a minimum age.
//
// There was no grace anywhere in src/ (grep for "grace" returned nothing), so
// every age floor was a hard edge and the app advised repeating doses ACIP
// counts.
//
// Source, CDC Child and Adult Immunization Schedule Notes, "Additional
// Information" — both pages fetched live 2026-10-10, identical wording:
//
//   "Vaccine doses administered <=4 days before the minimum age or interval are
//    considered valid. Doses of any vaccine administered >=5 days earlier than
//    the minimum age or minimum interval should not be counted as valid and
//    should be repeated as age appropriate. The repeat dose should be spaced
//    after the invalid dose by the recommended minimum interval."
//
// https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html
// https://www.cdc.gov/vaccines/hcp/imz-schedules/adult-notes.html
//
// The grace is a VALIDITY rule — it decides whether a dose already given
// counts. It deliberately does NOT move the scheduler: "earliest next date"
// still shows the real minimum, so the app never advises giving a dose early.
// That exclusion is asserted at the bottom of this file.
import { describe, it, expect } from 'vitest';
import { analyzeHistory } from '../validate.js';
import { recommend } from '../recommend.js';
import { addDays } from '../dateUtils.js';
import { GRACE_DAYS, intervalMeetsMinimum, ageMeetsMinimum, ageMeetsMinimumDays } from '../intervals.js';
import { PCV_MIN_AGE_DAYS } from '../../data/brands.js';

const REF = '2026-12-01';

describe('peds P1-1 — the grace constant and its helpers', () => {
  it('is 4 days', () => {
    expect(GRACE_DAYS).toBe(4);
  });

  it('PCV\'s 6-week floor is exactly 42 days, stated once', () => {
    expect(PCV_MIN_AGE_DAYS).toBe(42);
  });

  it('a days-stated minimum accepts 4 days early and rejects 5', () => {
    expect(intervalMeetsMinimum(38, 42)).toBe(true);
    expect(intervalMeetsMinimum(37, 42)).toBe(false);
    expect(ageMeetsMinimumDays(38, 42)).toBe(true);
    expect(ageMeetsMinimumDays(37, 42)).toBe(false);
  });

  it('a calendar-month minimum accepts 4 days early and rejects 5', () => {
    // 2nd birthday 2026-05-06; grace reaches back to 2026-05-02.
    const dob = '2024-05-06';
    const at = (d) => ageMeetsMinimum(null, 24, { doseDate: d, dob });
    expect(at('2026-05-06')).toBe(true);
    expect(at('2026-05-02')).toBe(true);
    expect(at('2026-05-01')).toBe(false);
  });
});

describe('peds P1-1 reproduction A — the PCV 6-week floor, day by day', () => {
  // DOB 2026-01-01, so 6 weeks = day 42 = 2026-02-12. CDC accepts from day 38.
  const dob = '2026-01-01';
  const verdictOnDay = (d) => {
    const doseDate = addDays(dob, d);
    return analyzeHistory('PCV', [{ date: doseDate, product: 'PCV13' }], 11, REF, dob)
      .perDose[0].status;
  };

  it('rejects 5 or more days early', () => {
    expect(verdictOnDay(36)).toBe('invalid');
    expect(verdictOnDay(37)).toBe('invalid');
  });

  it('accepts the four graced days, which the app used to reject', () => {
    expect(verdictOnDay(38)).toBe('valid');
    expect(verdictOnDay(39)).toBe('valid');
    expect(verdictOnDay(40)).toBe('valid');
    expect(verdictOnDay(41)).toBe('valid');
  });

  it('accepts the minimum age itself, which the app also used to reject', () => {
    // The old accept threshold was day 43: the 4 graced days plus one day of
    // rounding error from the averaged-month arithmetic.
    expect(verdictOnDay(42)).toBe('valid');
    expect(verdictOnDay(43)).toBe('valid');
  });
});

describe('peds P1-1 reproduction B — PPSV23 on the 2nd birthday', () => {
  const dob = '2024-05-06';
  const verdictOn = (date) =>
    analyzeHistory('PPSV23', [{ date, product: 'PPSV23' }], 31, REF, dob).perDose[0].status;

  it('accepts the birthday itself and the four days before it', () => {
    expect(verdictOn('2026-05-06')).toBe('valid');
    expect(verdictOn('2026-05-02')).toBe('valid');
  });

  it('still rejects 5 days early', () => {
    expect(verdictOn('2026-05-01')).toBe('invalid');
  });
});

describe('peds P1-1 — a patient with no date of birth still gets the grace', () => {
  it('grades on the fallback path without regressing', () => {
    // Years/Months entry: 31 months old today, PPSV23 dated 7 months ago, so
    // given at ~24 months. Must not be voided.
    const dose = { date: '2026-05-01', product: 'PPSV23' };
    const out = analyzeHistory('PPSV23', [dose], 31, '2026-12-01').perDose[0];
    expect(out.status).toBe('valid');
  });
});

describe('peds P1-1 — the grace does NOT move the scheduler', () => {
  it('earliest next date still shows the real minimum, not 4 days earlier', () => {
    // CDC's sentence permits COUNTING a dose given up to 4 days early. It does
    // not permit ADVISING one. A patient owed a dose 1 year after PCV13 must
    // still be told the real anniversary.
    const out = recommend({
      dob: '1960-03-01',
      ageMonths: 800,
      riskIds: [],
      pcvDoses: [{ date: '2026-03-01', product: 'PCV13' }],
      ppsv23Doses: [],
      today: '2026-10-10',
    });
    const r = out.recs.find((x) => x.earliestNextDate);
    expect(r).toBeDefined();
    expect(r.earliestNextDate).toBe('2027-03-01');
  });
});
