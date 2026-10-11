// P3-6 (S10, 2026-10-10) — a dose dated before the patient was born must say so.
//
// fmtAgeMonths had no negative branch, so -7 months and 0 months printed the
// same word: "Birth". validate.js's fmtAgeM had the same hole (`if (m < 0.5)
// return 'birth'`). A dose dated before the patient was born therefore read
// "Given at ~birth" — an ordinary-looking newborn dose.
//
// Reproduced before the fix: DOB 2026-01-01 with a PCV13 dated 2025-06-01 gave
//   "Given at ~birth — below the 6 weeks minimum age for PCV13 (Prevnar 13)."
//
// The dose was correctly refused, so this is a message defect rather than a
// counting one — but it is the message a clinician uses to find the typo, and
// "birth" sends them looking for the wrong thing. A value that cannot exist
// must not be mistakable for a patient.
import { describe, it, expect } from 'vitest';
import { fmtAgeMonths } from '../format.js';
import { analyzeHistory } from '../validate.js';

describe('P3-6 — a negative age is not "Birth"', () => {
  it('prints "Before birth"', () => {
    expect(fmtAgeMonths(-7)).toBe('Before birth');
    expect(fmtAgeMonths(-0.5)).toBe('Before birth');
    expect(fmtAgeMonths(-0.01)).toBe('Before birth');
  });

  it('still prints "Birth" for a genuine newborn', () => {
    expect(fmtAgeMonths(0)).toBe('Birth');
    expect(fmtAgeMonths(0.1)).toBe('Birth');
  });
});

describe('P3-6 — the validator names the real problem', () => {
  const dob = '2026-01-01';
  const verdict = (date, vaccine = 'PCV', product = 'PCV13') =>
    analyzeHistory(vaccine, [{ date, product }], 12, '2026-10-10', dob).perDose[0];

  it('says the dose predates the date of birth, not that it is under-age', () => {
    const v = verdict('2025-06-01');
    expect(v.status).toBe('invalid');
    expect(v.reasons[0]).toMatch(/before .*born|before birth/i);
    expect(v.reasons[0]).not.toMatch(/~birth/);
  });

  it('does the same for PPSV23', () => {
    const v = verdict('2025-06-01', 'PPSV23', 'PPSV23');
    expect(v.status).toBe('invalid');
    expect(v.reasons[0]).toMatch(/before .*born|before birth/i);
  });

  it('still refuses the dose', () => {
    expect(verdict('2025-06-01').doesNotCount).toBe(true);
  });

  it('leaves a dose given ON the date of birth alone', () => {
    // Not before birth — just far below the 6-week minimum, which is a
    // different message.
    const v = verdict('2026-01-01');
    expect(v.status).toBe('invalid');
    expect(v.reasons[0]).not.toMatch(/before .*born/i);
  });
});
