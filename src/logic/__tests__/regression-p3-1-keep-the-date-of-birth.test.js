// P3-1 (S10, 2026-10-10) — the date of birth must reach the engine.
//
// StepAge collects a real date of birth and its own header says why: "it lets
// the engine compute a dose's age precisely (e.g. was PPSV23 given on/after the
// 65th birthday...)". It then converted the date to a number of months and threw
// the date away, so the engine had to reconstruct birthdays by multiplying
// months by an averaged 30.4375 -- the exact approximation the date of birth was
// collected to avoid (A-P0-1, peds audit P1-1).
//
// Two consequences, both asserted below:
//  (a) reconstructed dates and ages-at-dose are approximate;
//  (b) the age was computed ONCE, at typing time, while dose validity and
//      "due today" read the clock live -- a tab left open overnight held a
//      patient who did not age while the calendar did.
import { describe, it, expect } from 'vitest';
import { patientAgeMonths, ageAtDoseMonths } from '../patientAge.js';
import { dobToAgeMonths } from '../format.js';

describe('P3-1 — patientAgeMonths', () => {
  it('derives the age from the date of birth, at the reference date', () => {
    expect(patientAgeMonths({ dob: '1958-01-10' }, '2023-01-10')).toBe(780); // 65y
    expect(patientAgeMonths({ dob: '2024-05-06' }, '2026-05-06')).toBe(24);
  });

  it('lets the date of birth outrank a stale ageMonths snapshot', () => {
    // The snapshot is what the old code stored. It must never outrank the
    // thing it came from, or a tab open across midnight freezes the patient.
    const patient = { dob: '2024-05-06', ageMonths: 0 };
    expect(patientAgeMonths(patient, '2026-05-06')).toBe(24);
  });

  it('ages the patient as the calendar moves', () => {
    const patient = { dob: '2026-01-01' };
    const a = patientAgeMonths(patient, '2026-07-01');
    const b = patientAgeMonths(patient, '2027-01-01');
    expect(a).toBe(6);
    expect(b).toBe(12);
  });

  it('keeps years/months entry working when there is no date of birth', () => {
    expect(patientAgeMonths({ ageMonths: 300 }, '2026-10-10')).toBe(300);
    expect(patientAgeMonths({}, '2026-10-10')).toBe(null);
    expect(patientAgeMonths(null, '2026-10-10')).toBe(null);
  });
});

describe('P3-1 — ageAtDoseMonths', () => {
  it('measures from the birthday, so a dose on an anniversary is exact', () => {
    const patient = { dob: '2024-05-06' };
    expect(ageAtDoseMonths({ date: '2026-05-06' }, patient)).toBe(24);
    expect(ageAtDoseMonths({ date: '2025-05-06' }, patient)).toBe(12);
  });

  it('is exact for the 65th-birthday case the old subtraction got wrong', () => {
    const patient = { dob: '1958-01-10' };
    expect(ageAtDoseMonths({ date: '2023-01-10' }, patient)).toBe(780);
    expect(ageAtDoseMonths({ date: '2023-01-09' }, patient)).toBeLessThan(780);
    expect(ageAtDoseMonths({ date: '2022-12-26' }, patient)).toBeLessThan(780);
  });

  it('falls back to subtraction when there is no date of birth', () => {
    const patient = { ageMonths: 300 };
    const am = ageAtDoseMonths({ date: '2024-10-10' }, patient, '2026-10-10');
    expect(am).toBeCloseTo(276, 4); // 300 - 24 calendar months
  });

  it('returns negative for a dose dated before birth, so callers can detect it', () => {
    expect(ageAtDoseMonths({ date: '2025-01-01' }, { dob: '2026-01-01' })).toBeLessThan(0);
  });

  it('returns null when the dose has no date', () => {
    expect(ageAtDoseMonths({}, { dob: '2026-01-01' })).toBe(null);
  });
});

describe('P3-1 — dobToAgeMonths is calendar-exact', () => {
  it('a birthday-to-birthday span is a whole number', () => {
    // Was 25.00205... before the fix, which is how a dose given on a child's
    // 2nd birthday came to be graded "below the 2-year minimum age".
    expect(dobToAgeMonths('2024-05-06', '2026-06-06')).toBe(25);
    expect(dobToAgeMonths('1958-01-10', '2023-01-10')).toBe(780);
  });

  it('refuses a date of birth in the future', () => {
    expect(dobToAgeMonths('2027-01-01', '2026-10-10')).toBe(null);
    expect(dobToAgeMonths(null, '2026-10-10')).toBe(null);
  });
});
