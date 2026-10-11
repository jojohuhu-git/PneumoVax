// P3-5 (S10b, 2026-10-10) — a young infant's age in weeks must be counted from
// the birthday, not derived from an averaged months figure.
//
// fmtAgeMonths printed weeks for ages up to 2 months by multiplying the age in
// months by 4.348 — a second averaged constant, applied on top of an age that
// had already been measured in calendar months. The result double-averages,
// and the error lands exactly where it matters most: PCV's minimum age is
// stated in WEEKS ("minimum age: 6 weeks"), and PCV_MIN_AGE_DAYS is 42.
//
// MEASURED before the fix, sweeping 400 consecutive birth dates and giving each
// a dose at exactly 42 days (6.0 completed weeks):
//   "6 weeks" → 219 of 400
//   "5 weeks" → 181 of 400     ← wrong, and printed beside a 6-week rule
// e.g. born 2025-03-01, dose 2025-04-12 (42 days) displayed "5 weeks".
//
// Why 181 and not all: calendarMonthsBetween gives a fraction whose
// denominator is the length of the month the dose falls in, so the same 42 days
// is a different number of "months" depending on the month — 1.3667 in a
// 30-day month (× 4.348 = 5.94 → floors to 5) and more in a 28-day February.
// The display therefore disagreed with itself across the calendar.
//
// This is a DISPLAY defect, not a counting one: validate.js already grades the
// minimum age in exact days (ageAtDoseDays / PCV_MIN_AGE_DAYS), so a 42-day
// dose was correctly accepted. But the card showed "5 weeks" next to a rule
// written in 6, which reads as the app contradicting itself — and invites a
// clinician to repeat a dose that was valid.
//
// The fix: when the caller knows the real number of days (it has a date of
// birth and a real date), pass `exactDays` and count weeks with
// Math.floor(exactDays / 7). The averaged path remains for a patient entered
// as Years/Months, who has no birthday to count from.
import { describe, it, expect } from 'vitest';
import { fmtAgeMonths, dobToAgeMonths } from '../format.js';
import { daysBetween } from '../dateUtils.js';
import { PCV_MIN_AGE_DAYS } from '../../data/brands.js';

// Walk a date forward by whole days without touching the local clock.
const addDays = (iso, n) => {
  const t = new Date(iso + 'T00:00:00Z');
  t.setUTCDate(t.getUTCDate() + n);
  return t.toISOString().slice(0, 10);
};

// What the UI does: measure months for the band, days for the number.
const showAgeAt = (dob, date) =>
  fmtAgeMonths(dobToAgeMonths(dob, date), { exactDays: daysBetween(dob, date) });

describe('P3-5 — exact weeks, counted from the birthday', () => {
  it('prints 6 weeks for every birth date when the dose is at 42 days', () => {
    // The whole point: PCV_MIN_AGE_DAYS is 42 and the rule is written "6 weeks",
    // so 42 days must never display as 5.
    expect(PCV_MIN_AGE_DAYS).toBe(42);
    const wrong = [];
    for (let i = 0; i < 400; i++) {
      const dob = addDays('2025-01-01', i);
      const shown = showAgeAt(dob, addDays(dob, 42));
      if (shown !== '6 weeks') wrong.push({ dob, shown });
    }
    expect(wrong).toEqual([]);
  });

  it('is exact at the specific date that printed 5 weeks before the fix', () => {
    expect(showAgeAt('2025-03-01', '2025-04-12')).toBe('6 weeks');
  });

  it('counts completed weeks, never rounding up to the next one', () => {
    const dob = '2025-03-01';
    expect(showAgeAt(dob, addDays(dob, 41))).toBe('5 weeks'); // one day short
    expect(showAgeAt(dob, addDays(dob, 42))).toBe('6 weeks'); // exactly 6
    expect(showAgeAt(dob, addDays(dob, 48))).toBe('6 weeks'); // 6w 6d
    expect(showAgeAt(dob, addDays(dob, 49))).toBe('7 weeks'); // exactly 7
  });

  it('agrees with itself across every month of the year', () => {
    // Pre-fix, the same 42 days printed differently depending on the month the
    // dose fell in, because the denominator was that month's length.
    const shown = new Set();
    for (let m = 1; m <= 12; m++) {
      const dob = `2025-${String(m).padStart(2, '0')}-05`;
      shown.add(showAgeAt(dob, addDays(dob, 42)));
    }
    expect([...shown]).toEqual(['6 weeks']);
  });

  it('handles a leap-year February, where the denominator is unusual', () => {
    expect(showAgeAt('2024-01-20', addDays('2024-01-20', 42))).toBe('6 weeks');
    expect(showAgeAt('2024-02-01', addDays('2024-02-01', 42))).toBe('6 weeks');
  });

  it('still says Birth for the first week', () => {
    const dob = '2025-03-01';
    expect(showAgeAt(dob, dob)).toBe('Birth');
    expect(showAgeAt(dob, addDays(dob, 6))).toBe('Birth');
    expect(showAgeAt(dob, addDays(dob, 7))).toBe('1 week');
  });

  it('says "1 week" singular and "2 weeks" plural', () => {
    const dob = '2025-03-01';
    expect(showAgeAt(dob, addDays(dob, 7))).toBe('1 week');
    expect(showAgeAt(dob, addDays(dob, 14))).toBe('2 weeks');
  });

  it('leaves the months and years bands alone', () => {
    const dob = '2020-03-01';
    // Past the weeks band, exactDays must not change the unit shown.
    expect(showAgeAt(dob, '2020-08-01')).toBe('5 months');
    // 12 months stays in the months band by design (the docstring says months
    // for 2-23 months); exactDays must not move it into years.
    expect(showAgeAt(dob, '2021-03-01')).toBe('12 months');
    expect(showAgeAt(dob, '2026-03-01')).toBe('6 years');
    expect(showAgeAt(dob, '2026-09-01')).toBe('6 years 6 months');
  });

  it('never reports a negative age as a number of weeks', () => {
    // P3-6's guarantee must survive: a dose dated before birth says so.
    // Note dobToAgeMonths is not the vehicle here — it returns null for a date
    // before the birthday ("a date of birth in the future is not an age"). The
    // negative age reaches fmtAgeMonths from ageAtDoseFromDate instead, so
    // exercise the formatter the way that caller does.
    expect(fmtAgeMonths(-1.5, { exactDays: -45 })).toBe('Before birth');
    expect(fmtAgeMonths(-0.1, { exactDays: -3 })).toBe('Before birth');
    // A negative day count must never floor into a week count either.
    expect(fmtAgeMonths(0.2, { exactDays: -2 })).toBe('Before birth');
  });
});

describe('P3-5 — the averaged path survives for a patient with no birthday', () => {
  it('behaves exactly as before when exactDays is not given', () => {
    // A patient entered as Years/Months has no date of birth to count from.
    // That caller must keep working, unchanged.
    expect(fmtAgeMonths(0)).toBe('Birth');
    expect(fmtAgeMonths(1)).toBe('4 weeks');
    expect(fmtAgeMonths(2)).toBe('8 weeks');
    expect(fmtAgeMonths(6)).toBe('6 months');
    expect(fmtAgeMonths(24)).toBe('2 years');
    expect(fmtAgeMonths(-5)).toBe('Before birth');
    expect(fmtAgeMonths(null)).toBe('');
  });

  it('ignores a null or unusable exactDays rather than throwing', () => {
    expect(fmtAgeMonths(1, { exactDays: null })).toBe('4 weeks');
    expect(fmtAgeMonths(1, { exactDays: undefined })).toBe('4 weeks');
    expect(fmtAgeMonths(1, { exactDays: NaN })).toBe('4 weeks');
    expect(fmtAgeMonths(1, {})).toBe('4 weeks');
  });
});
