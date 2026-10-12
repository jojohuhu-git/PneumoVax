// A-P2-11 (S10, 2026-10-10) — the 1-year and 5-year gaps are calendar
// intervals, not fixed day counts.
//
// Source, CDC Adult and Child Immunization Schedule Notes, "Additional
// Information", both fetched live 2026-10-10:
//   "For calculating intervals between doses, 4 weeks = 28 days. Intervals of
//    >=4 months are determined by calendar months."
//
// recommend.js used DAYS.years(1) = 365 and DAYS.years(5) = 1826. A fixed 365
// is a day short whenever a 29 February falls inside the year, so the
// "Not yet due — eligible <date>" line on the card could print a date one or
// two days before the real anniversary.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';

function adultPcv13Only({ doseDate, today }) {
  return recommend({
    dob: '1960-03-01',
    ageMonths: 800,
    riskIds: [],
    pcvDoses: [{ date: doseDate, product: 'PCV13' }],
    ppsv23Doses: [],
    today,
  }).recs.find((r) => r.vaccine === 'PCV');
}

describe('A-P2-11 — the 1-year gap after PCV13', () => {
  it('prints the real anniversary, not 365 days, across a leap year', () => {
    // 2023-03-01 + 365 days is 2024-02-29. The anniversary is 2024-03-01.
    const r = adultPcv13Only({ doseDate: '2023-03-01', today: '2023-06-01' });
    expect(r.earliestNextDate).toBe('2024-03-01');
  });

  it('is not yet due on the day before the anniversary', () => {
    const r = adultPcv13Only({ doseDate: '2023-03-01', today: '2024-02-29' });
    expect(r.dueToday).toBe(false);
    expect(r.earliestNextDate).toBe('2024-03-01');
  });

  it('is due ON the anniversary — "at least 1 year after" includes that day', () => {
    const r = adultPcv13Only({ doseDate: '2023-03-01', today: '2024-03-01' });
    expect(r.dueToday).toBe(true);
    expect(r.earliestNextDate).toBe(null);
  });

  it('states the interval in the unit CDC states it in', () => {
    const r = adultPcv13Only({ doseDate: '2023-03-01', today: '2023-06-01' });
    expect(r.minIntervalMonths).toBe(12);
    expect(r.minIntervalDays).toBe(null);
  });

  it('clamps a month-end anchor rather than spilling into the next month', () => {
    // 31 January + 12 calendar months is 31 January, but a 29 Feb anchor has no
    // anniversary in a common year and must clamp to the 28th.
    const r = adultPcv13Only({ doseDate: '2024-02-29', today: '2024-06-01' });
    expect(r.earliestNextDate).toBe('2025-02-28');
  });
});

describe('A-P2-11 — the 5-year gap after PCV13 + PPSV23', () => {
  function adultBoth({ today }) {
    return recommend({
      dob: '1950-06-15',
      ageMonths: 915,
      riskIds: [],
      // The PPSV23 date is chosen so the five-year span contains TWO leap days
      // (2020, 2024) and is therefore 1827 days: a fixed 1826 lands on
      // 2024-02-29, a day early. That date is what this case is about.
      //
      // S14-7 (2026-10-11): the PCV13 is now dated 14 months EARLIER. It used
      // to sit on the same day as the PPSV23, which the rr7203a1 floor added
      // this session correctly voids — leaving the patient with no PPSV23 at
      // all, on a different CDC row, and this case quietly testing nothing.
      // The leap-day arithmetic it exists for is untouched.
      pcvDoses: [{ date: '2018-01-01', product: 'PCV13' }],
      ppsv23Doses: [{ date: '2019-03-01', product: 'PPSV23' }],
      today,
    }).recs.find((r) => r.vaccine === 'PCV');
  }

  it('prints the real 5-year anniversary', () => {
    const r = adultBoth({ today: '2022-01-01' });
    expect(r.earliestNextDate).toBe('2024-03-01');
    expect(r.minIntervalMonths).toBe(60);
  });

  it('is not due on 29 February, where a fixed 1826 days would have said it was', () => {
    expect(adultBoth({ today: '2024-02-29' }).dueToday).toBe(false);
    expect(adultBoth({ today: '2024-03-01' }).dueToday).toBe(true);
  });
});

describe('A-P2-11 — week-stated intervals are unchanged', () => {
  it('8 weeks stays an exact day count', () => {
    // An at-risk child's ">=8 weeks after the most recent PCV" catch-up dose.
    // (This used to use an adult PCV15 -> PPSV23 gap, but A-P1-1 moved that one
    // onto the calendar: >=1 year for every adult.)
    const r = recommend({
      dob: '2018-03-01', ageMonths: 100,
      riskIds: ['asplenia'],
      pcvDoses: [{ date: '2026-01-01', product: 'PCV13' }],
      ppsv23Doses: [],
      today: '2026-02-01',
    }).recs.find((x) => x.minIntervalDays != null);
    expect(r).toBeDefined();
    expect(r.minIntervalDays).toBe(56);
    expect(r.minIntervalMonths).toBe(null);
  });
});
