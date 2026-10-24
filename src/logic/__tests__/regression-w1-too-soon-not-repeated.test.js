// W1 (handoff 2026-10-11, owner-approved wording 2026-10-11) — a dose rejected
// for being given TOO SOON after another dose is not a missing dose. The old
// blanket sentence on every `invalid` dose said "repeat this dose only (do not
// restart the series)" — correct for a dose given below the minimum age, or
// the wrong product for the patient's age, where the dose really is missing
// and must be re-given. It is actively wrong advice for a dose rejected only
// for timing: there is nothing to repeat, the next dose is simply due once
// the interval has elapsed. The 70-year-old's early second PPSV23 (handoff
// Case A) is the worked example that surfaced this.
//
// Scope, per owner decision: ONLY doses whose `invalid` verdict came from the
// interval rule table (`doseIntervalRules.js`, tagged with `intervalRuleId`)
// get the new sentence. Below-minimum-age, wrong-product-for-age, and
// before-birth rejections keep "repeat this dose only" — that advice is
// correct for them, and is covered by its own tests elsewhere.
import { describe, it, expect } from 'vitest';
import { analyzeHistory } from '../validate.js';
import { addDays, addCalendarYears } from '../dateUtils.js';

describe('W1 — a too-soon dose is not repeated, it is simply not yet due', () => {
  it('names the earliest valid date instead of saying "repeat", for a child PCV given too soon', () => {
    // 4-month-old: PCV13 dose 1 on 2026-03-01, dose 2 fourteen days later —
    // below CDC's 4-week (28-day) minimum for a dose given before 12 months.
    const a = analyzeHistory('PCV', [
      { date: '2026-03-01', product: 'PCV13' },
      { date: '2026-03-15', product: 'PCV13' },
    ], 4, '2026-05-01', '2026-01-01');
    const second = a.perDose[1];
    expect(second.status).toBe('invalid');
    const reasons = second.reasons.join(' ');

    // RULING D (owner, 2026-10-23): the date in this sentence is now measured
    // from the INVALID dose, not from the last one that counted. W1's point is
    // unchanged — a too-soon dose is not "repeated", it is simply not yet due —
    // only the anchor moved. CDC: "The repeat dose should be spaced after the
    // invalid dose by the recommended minimum interval."
    // Was 2026-03-25 (dose 1 + 28 - 4) before Ruling D; now 2026-04-08.
    const repeatDue = addDays('2026-03-15', 28 - 4); // CDC's 4-day grace
    expect(repeatDue).toBe('2026-04-08');
    expect(reasons).toMatch(new RegExp(`due on or after ${repeatDue}`));
    expect(reasons).not.toMatch(/due on or after 2026-03-25/);
    expect(reasons).not.toMatch(/repeat this dose only/);
  });

  it('names the earliest valid date for an adult\'s second PPSV23 given too soon (handoff Case A)', () => {
    // Adult, PPSV23 2015-01-01 (counts) then PPSV23 2018-01-01 — 3 years
    // later, short of the 5-year minimum between PPSV23 doses.
    const a = analyzeHistory('PPSV23', [
      { date: '2015-01-01' },
      { date: '2018-01-01' },
    ], 840, '2026-06-01', '1945-01-01');
    const second = a.perDose[1];
    expect(second.status).toBe('invalid');
    const reasons = second.reasons.join(' ');

    // RULING D (owner, 2026-10-23): the date in this sentence is now measured
    // from the INVALID dose, not from the last one that counted. W1's point is
    // unchanged — a too-soon dose is not "repeated", it is simply not yet due —
    // only the anchor moved. CDC: "The repeat dose should be spaced after the
    // invalid dose by the recommended minimum interval."
    // Was 2019-12-28 (the 2015 dose + 5y - 4d); now 2022-12-28.
    const repeatDue = addDays(addCalendarYears('2018-01-01', 5), -4); // 4-day grace
    expect(repeatDue).toBe('2022-12-28');
    expect(reasons).toMatch(new RegExp(`This dose does not count toward the series — given too soon after the dose it is measured from\\. It is not repeated; the next dose in this series is due on or after ${repeatDue}\\.`));
    expect(reasons).not.toMatch(/repeat this dose only/);
  });

  it('keeps "repeat this dose only" for a dose rejected for a reason OTHER than timing', () => {
    // Below the 6-week minimum age for PCV — not a timing-between-doses
    // rejection, so the old sentence is still the correct advice.
    const a = analyzeHistory('PCV', [
      { date: '2026-01-10', product: 'PCV13' },
    ], 0, '2026-01-20', '2026-01-01');
    const first = a.perDose[0];
    expect(first.status).toBe('invalid');
    expect(first.reasons.join(' ')).toMatch(/repeat this dose only/);
  });
});
