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
// C12 (2026-10-24): the SENTENCE prints "Apr 12, 2026"; the DATA field
// (`repeatDueDate`) is still ISO. The expected text is built from the same
// formatter the app uses, so a date arithmetic change still fails here.
import { fmtDate } from '../format.js';

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
    //
    // OWNER RULING 2026-10-24: and the grace comes OFF the date the app
    // ADVISES. "I don't need the app to recommend dates within the 4 day
    // grace period." So the full 28 days from the dose the child got.
    // Was 2026-03-25 (dose 1 + 28 - 4) before Ruling D, then 2026-04-08
    // (dose 2 + 28 - 4); now 2026-04-12.
    const repeatDue = addDays('2026-03-15', 28);
    expect(repeatDue).toBe('2026-04-12');
    expect(reasons).toMatch(new RegExp(`can be given from ${fmtDate(repeatDue)} at the earliest`));
    // Both superseded dates, asserted as DATES rather than inside the old
    // sentence — a negative assertion that quotes wording the app no longer
    // prints anywhere passes for the wrong reason.
    expect(reasons).not.toMatch(/Mar 25, 2026/);
    expect(reasons).not.toMatch(/Apr 8, 2026/);
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
    // ⚠️ 2026-10-25: this ADULT dose now counts (her table removed every adult
    // floor). The CHILD case above is untouched and still a floor — W1's
    // finding was about WORDING, not about which doses are rejected, and the
    // wording assertions below are the ones that carry it.
    expect(second.status).toBe('valid');
    const reasons = second.reasons.join(' ');

    // RULING D (owner, 2026-10-23): the date in this sentence is now measured
    // from the INVALID dose, not from the last one that counted. W1's point is
    // unchanged — a too-soon dose is not "repeated", it is simply not yet due —
    // only the anchor moved. CDC: "The repeat dose should be spaced after the
    // invalid dose by the recommended minimum interval."
    //
    // OWNER RULING 2026-10-24: ungraced, because this is advice about a dose
    // not yet given. Was 2019-12-28 (the 2015 dose + 5y - 4d), then
    // 2022-12-28 (the 2018 dose + 5y - 4d); now 2023-01-01.
    // The forward-looking sentence is gone with the rejection — there is no
    // "next dose in this series" to date, because this one counted. What W1
    // exists to prevent is still asserted, and is now stronger: the text must
    // not tell the reader to repeat anything, and must not print the graced
    // date W1 was filed about.
    expect(reasons).not.toMatch(/does not count toward the series/);
    expect(reasons).not.toMatch(/Dec 28, 2022/);
    expect(reasons).not.toMatch(/repeat this dose only/);
    expect(reasons).toMatch(/shorter than the 5 years/);
    expect(reasons).toMatch(/never give a third/i);
  });

  it('keeps "repeat this dose only" for a dose rejected for a reason OTHER than timing', () => {
    // A PPSV23 below its 2-year minimum age — not a timing-between-doses
    // rejection, so the dose really is missing and must be re-given.
    //
    // ⚠ THIS FIXTURE CHANGED on 2026-10-29, from a too-young PCV13 to a
    // too-young PPSV23, and the swap is not a convenience. W1's point is that
    // a NON-timing rejection still tells the clinician the dose must be
    // re-given; the owner's decision of that date took the product-naming
    // sentence off every age-rejected CONJUGATE (CDC gives PCV15 and PCV20 one
    // minimum age and no preference, so the product was never what was wrong),
    // while a child whose PPSV23 came at 18 months still needs a PPSV23 once
    // she is 2 and no conjugate substitutes. So the PPSV23 is now the family
    // that demonstrates W1. The conjugate is asserted below, on its new
    // sentence, so neither case is simply dropped.
    const a = analyzeHistory('PPSV23', [
      { date: '2026-01-10', product: 'PPSV23' },
    ], 12, '2026-01-20', '2025-01-01');
    const first = a.perDose[0];
    expect(first.status).toBe('invalid');
    expect(first.reasons.join(' ')).toMatch(/repeat this dose only/);
  });

  it('gives a too-young CONJUGATE the product-free sentence instead', () => {
    // The fixture W1 used to assert the sentence above. It is still a
    // non-timing rejection and the dose is still missing; what changed is that
    // the app no longer implies it must be the same vaccine. See
    // regression-2026-10-29-age-rejection-names-no-product.test.js.
    const a = analyzeHistory('PCV', [
      { date: '2026-01-10', product: 'PCV13' },
    ], 0, '2026-01-20', '2026-01-01');
    const first = a.perDose[0];
    expect(first.status).toBe('invalid');
    expect(first.reasons.join(' ')).toMatch(/any PCV approved/i);
    expect(first.reasons.join(' ')).not.toMatch(/repeat this dose only/);
  });
});
