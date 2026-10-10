// A-P0-1 (S10, 2026-10-10) — the 65th-birthday test, the adult audit's P0.
//
// CDC splits adults who have had both PCV13 and PPSV23 into two rows, on
// whether the PPSV23 was received at 65 or older. CDC Adult Immunization
// Schedule Notes, pneumococcal, fetched live 2026-10-10:
//
//   "Previously received both PCV13 and PPSV23 but NO PPSV23 was received at
//    age 65 years or older: 1 dose PCV20 or 1 dose PCV21 at least 5 years
//    after the last pneumococcal vaccine dose."
//
//   "Previously received both PCV13 and PPSV23, AND PPSV23 was received at age
//    65 years or older: Based on shared clinical decision-making, 1 dose of
//    PCV20 or 1 dose of PCV21 at least 5 years after the last pneumococcal
//    vaccine dose."
//
// https://www.cdc.gov/vaccines/hcp/imz-schedules/adult-notes.html
//
// The first row is a plain recommendation; the second is shared clinical
// decision-making ("it may be given or omitted"). Landing on the wrong one is
// a silent wrong answer either way, and the dangerous direction turns a dose
// CDC recommends into an optional one.
//
// The old test was `am - Math.round(daysBetween(ppsvDate, today) / 30.4375)
// >= 780`: a float current-age minus an elapsed span rounded to whole months.
// Mixing the two put up to half a month of error into the reconstructed
// age-at-dose, so the verdict flipped either way within about two weeks of the
// birthday. A sweep over 365 birthdates x dose dates +/-40 days around each
// 65th birthday misclassified 2,782 of 29,565 pairs (9.4%), every one of them
// inside -14..+15 days of the birthday.
//
// NOTE on the 4-day grace: it does NOT apply here. CDC's grace is about
// whether a dose that was given counts as valid. This is not a validity floor
// -- it selects which of two recommendation rows a patient is on -- so the
// birthday is compared exactly.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { addCalendarYears, addDays } from '../dateUtils.js';
import { dobToAgeMonths } from '../format.js';

const TODAY = '2026-10-10';

function statusFor({ dob, ageMonths, ppsvDate }) {
  const out = recommend({
    dob,
    // App derives the age from the date of birth and passes both; mirror that.
    ageMonths: ageMonths ?? (dob ? dobToAgeMonths(dob, TODAY) : undefined),
    riskIds: [],
    pcvDoses: [{ date: '2005-05-01', product: 'PCV13' }],
    ppsv23Doses: [{ date: ppsvDate, product: 'PPSV23' }],
    today: TODAY,
  });
  return out.recs[0].status;
}

describe('A-P0-1 — the audit\'s two reproductions', () => {
  it('repro 1: PPSV23 six days BEFORE the 65th birthday is a plain recommendation', () => {
    // The dangerous direction. The app used to say shared-decision, i.e. "it
    // may be given or omitted", for a dose CDC plainly recommends.
    expect(statusFor({ dob: '1958-01-01', ppsvDate: '2022-12-26' })).not.toBe('shared-decision');
  });

  it('repro 2: PPSV23 ON the 65th birthday is shared clinical decision-making', () => {
    // "at age 65 years or older" includes the birthday itself.
    expect(statusFor({ dob: '1958-01-10', ppsvDate: '2023-01-10' })).toBe('shared-decision');
  });

  it('control: PPSV23 six months after the 65th birthday is shared decision-making', () => {
    expect(statusFor({ dob: '1958-01-10', ppsvDate: '2023-07-10' })).toBe('shared-decision');
  });
});

describe('A-P0-1 — the boundary is exact, to the day, in both directions', () => {
  const dob = '1958-01-10';
  const bday65 = addCalendarYears(dob, 65); // 2023-01-10

  it('the day before the birthday is not "at 65 or older"', () => {
    expect(statusFor({ dob, ppsvDate: addDays(bday65, -1) })).not.toBe('shared-decision');
  });

  it('the birthday and the day after are', () => {
    expect(statusFor({ dob, ppsvDate: bday65 })).toBe('shared-decision');
    expect(statusFor({ dob, ppsvDate: addDays(bday65, 1) })).toBe('shared-decision');
  });

  it('is right on every day in the +/-20 day band the old code got wrong', () => {
    for (let d = -20; d <= 20; d++) {
      const date = addDays(bday65, d);
      const expected = d >= 0 ? 'shared-decision' : 'due';
      expect(statusFor({ dob, ppsvDate: date })).toBe(expected);
    }
  });

  it('is right across a leap-year birthday too', () => {
    const leapDob = '1960-02-29';
    const b = addCalendarYears(leapDob, 65); // 2025-02-28
    expect(statusFor({ dob: leapDob, ppsvDate: addDays(b, -1) })).not.toBe('shared-decision');
    expect(statusFor({ dob: leapDob, ppsvDate: b })).toBe('shared-decision');
  });
});

describe('A-P0-1 — the engine derives the age when only a date of birth is given', () => {
  it('does not fall back to age 0 and route an adult to the infant schedule', () => {
    const out = recommend({
      dob: '1958-01-10',
      riskIds: [],
      pcvDoses: [{ date: '2005-05-01', product: 'PCV13' }],
      ppsv23Doses: [{ date: '2023-01-10', product: 'PPSV23' }],
      today: TODAY,
    });
    expect(out.meta.ageMonths).toBeGreaterThan(780);
    expect(out.recs[0].status).toBe('shared-decision');
  });
});

describe('A-P0-1 — patients with no date of birth keep the honest approximation', () => {
  it('an undated PPSV23 still falls back to the current-age proxy', () => {
    const out = recommend({
      ageMonths: 800,
      riskIds: [],
      pcvDoses: [{ date: '2005-05-01', product: 'PCV13' }],
      ppsv23Doses: [{ product: 'PPSV23' }],   // no date
      today: TODAY,
    });
    expect(out.recs[0].status).toBe('shared-decision');
  });

  it('years/months entry still decides, without a birthday to compare against', () => {
    // 68 years old, PPSV23 four years ago -> given at ~64, under 65.
    const s = statusFor({ ageMonths: 816, ppsvDate: '2022-10-10' });
    expect(s).toBe('due');
  });
});
