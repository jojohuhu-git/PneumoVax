// P3-2 (S10, 2026-10-10) — calendar-exact month arithmetic.
//
// Before this fix dateUtils.js had no calendar helpers at all: every span was
// measured by dividing days by an averaged 30.4375, which drifts away from
// whole months depending on how many leap days the span happens to contain.
// A dose given exactly on a patient's month-anniversary could therefore read as
// 23.98 months and be voided as "below the 2-year minimum" (peds audit P1-1),
// and a displayed "1 year later" date could land a day early (A-P2-11).
//
// Source, CDC Child and Adult Immunization Schedule Notes, "Additional
// Information", both fetched live 2026-10-10:
//   "For calculating intervals between doses, 4 weeks = 28 days. Intervals of
//    >=4 months are determined by calendar months."
import { describe, it, expect } from 'vitest';
import {
  calendarMonthsBetween,
  addCalendarMonths,
  addCalendarYears,
  calendarIntervalElapsed,
  daysInMonthOf,
} from '../dateUtils.js';

describe('P3-2 — addCalendarMonths lands on the real anniversary', () => {
  it('keeps the day of month', () => {
    expect(addCalendarMonths('2026-01-15', 1)).toBe('2026-02-15');
    expect(addCalendarMonths('2026-03-01', 12)).toBe('2027-03-01');
  });

  it('clamps to the last day when the target month is shorter', () => {
    // 31 January + 1 month has no 31 February; CDC-style calendar arithmetic
    // clamps rather than spilling into March.
    expect(addCalendarMonths('2026-01-31', 1)).toBe('2026-02-28');
    expect(addCalendarMonths('2024-01-31', 1)).toBe('2024-02-29'); // leap year
    expect(addCalendarMonths('2026-05-31', 1)).toBe('2026-06-30');
  });

  it('crosses year boundaries in both directions', () => {
    expect(addCalendarMonths('2026-11-10', 3)).toBe('2027-02-10');
    expect(addCalendarMonths('2026-02-10', -3)).toBe('2025-11-10');
  });

  it('addCalendarYears is whole calendar years, leap day clamped', () => {
    expect(addCalendarYears('2008-02-29', 18)).toBe('2026-02-28');
    expect(addCalendarYears('1958-01-10', 65)).toBe('2023-01-10');
  });
});

describe('P3-2 — calendarMonthsBetween reads back exactly', () => {
  it('a month-anniversary is an exact integer', () => {
    expect(calendarMonthsBetween('2024-05-06', '2026-05-06')).toBe(24);
    expect(calendarMonthsBetween('2026-01-01', '2026-07-01')).toBe(6);
    expect(calendarMonthsBetween('1958-01-10', '2023-01-10')).toBe(780); // 65y
  });

  it('is the exact inverse of addCalendarMonths for every offset', () => {
    for (const dob of ['2026-01-31', '2024-02-29', '2025-03-15', '2026-05-31']) {
      for (let n = 0; n <= 240; n++) {
        expect(calendarMonthsBetween(dob, addCalendarMonths(dob, n))).toBe(n);
      }
    }
  });

  it('never goes negative or non-monotonic for a 31-January baby', () => {
    // The month-end case that made MeningoVax answer a correct date of birth
    // with "Please enter a valid age". PneumoVax's old ms-division never went
    // negative, but it was not monotonic across month ends either; assert both.
    let prev = -1;
    for (let d = 0; d < 400; d++) {
      const today = new Date(Date.UTC(2026, 0, 31) + d * 86400000)
        .toISOString().slice(0, 10);
      const am = calendarMonthsBetween('2026-01-31', today);
      expect(am).toBeGreaterThanOrEqual(0);
      expect(am).toBeGreaterThan(prev);
      prev = am;
    }
  });

  it('returns negative for a span that runs backwards, so a pre-birth dose stays detectable', () => {
    expect(calendarMonthsBetween('2026-05-01', '2026-01-01')).toBeLessThan(0);
  });
});

describe('P3-2 — calendarIntervalElapsed counts the anniversary itself', () => {
  it('is satisfied ON the anniversary, not the day after', () => {
    expect(calendarIntervalElapsed('2023-03-01', 12, '2024-03-01')).toBe(true);
    expect(calendarIntervalElapsed('2023-03-01', 12, '2024-02-29')).toBe(false);
  });

  it('a fixed 365 days would be a day early across a leap year', () => {
    // 2023-03-01 + 365 days is 2024-02-29, but the real 1-year anniversary is
    // 2024-03-01. This is A-P2-11's displayed-date error, in one assertion.
    expect(addCalendarMonths('2023-03-01', 12)).toBe('2024-03-01');
    expect(calendarIntervalElapsed('2023-03-01', 12, '2024-02-29')).toBe(false);
  });
});

describe('P3-2 — daysInMonthOf', () => {
  it('knows month lengths, including leap February', () => {
    expect(daysInMonthOf('2026-02-10')).toBe(28);
    expect(daysInMonthOf('2024-02-10')).toBe(29);
    expect(daysInMonthOf('2026-01-10')).toBe(31);
    expect(daysInMonthOf('2026-04-10')).toBe(30);
  });
});
