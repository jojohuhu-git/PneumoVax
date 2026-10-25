// ─────────────────────────────────────────────────────────────────────────
// OWNER RULING (2026-10-24) — the app never RECOMMENDS a date inside CDC's
// 4-day grace.
//
// Her words, answering the first of the two questions PR #83 left open:
// "I don't need the app to recommend dates within the 4 day grace period.
// Just the routine date next dose is due with a comment on the earliest date
// it could be given."
//
// ── WHAT WAS WRONG ───────────────────────────────────────────────────────
//
// `intervals.js` has said since the grace was added that it is a VALIDITY
// rule and "NOT the scheduler": "recommend.js's 'due today' and 'earliest
// next date' keep using the real minimum. Granting grace there would make the
// app advertise a date 4 days early and actively advise giving doses before
// the minimum — which is not what CDC's sentence permits."
//
// Ruling D (2026-10-23) put a date from the VALIDATOR's side of that line on
// screen as advice: the chip under a rejected dose spent `repeatDueDate`,
// which `intervalFrom` built with the grace subtracted. So the 7-month-old
// below read, on one screen:
//
//   header   "Not yet due — eligible Dec 7, 2026"   (the routine 8 weeks)
//   chip     "due on or after 2026-11-05"           (minimum MINUS the grace)
//   note     "can be given from 2026-11-09 … the minimum interval of 4 weeks"
//
// Three dates for one dose, and the earliest of them was one no document
// recommends — it is only the date CDC will still ACCEPT a dose on.
//
// ── WHAT MOVES AND WHAT DOES NOT ─────────────────────────────────────────
//
//   MOVES   `repeatDueDate` — advice about a dose NOT YET GIVEN. Full
//           interval from the dose the patient got, no grace.
//   STAYS   `earliestValidDate` — "when would THIS dose have been valid",
//           a judgement about a dose ALREADY GIVEN. The grace is exactly
//           what that question is asking about, and it is the field the
//           verdict corpora record.
//   STAYS   every validity threshold. A dose given 4 days early still
//           counts. The app now advises the 9th, and still accepts the 5th.
//
// That last line is the sharpest statement of the ruling, so it is what the
// sweep below asserts: a dose given ON the advised date is valid, a dose
// given 4 days BEFORE it is still valid, and a dose 5 days before is not.
// Pre-fix the advised date already sat at the bottom of the grace window, so
// "4 days before it" was 8 days early and was rejected.
// ─────────────────────────────────────────────────────────────────────────
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { analyzeBoth } from '../validate.js';
import { addDays, calendarMonthsBetween } from '../dateUtils.js';

// The child from Ruling D's own guard — a DAYS-stated interval (4 weeks).
const CHILD = {
  dob: '2026-03-23',
  ageMonths: 7,
  today: '2026-10-23',
  riskIds: [],
  ppsv23Doses: [],
  pcvDoses: [
    { product: 'PCV20', date: '2026-07-23' },
    { product: 'PCV20', date: '2026-09-21' },
    { product: 'PCV20', date: '2026-10-12' }, // 21 days after dose 2 — rejected
  ],
};

// An adult — a CALENDAR-MONTH interval (1 year), the other arm of
// `intervalFrom`. A months rule subtracts the grace from a calendar date, so
// it needs its own case: the days arm passing proves nothing about it.
//
// ⚠️ THE HISTORY CHANGED ON 2026-10-24, THE NUMBERS DID NOT. It used to be
// PCV13 2026-01-01 → PCV20 2026-02-05, rejected by the 1-year
// conjugate-to-conjugate floor. §K-CONJUGATE downgraded that row to a
// recommendation the same day, so the dose counts and the fixture stopped
// exercising a floor at all. It is now PPSV23 → PCV20 at the same two dates,
// rejected by ADULT-PCV-AFTER-PPSV23 — also adult, also 1 calendar year,
// also cross-stream, and it produces the identical pair of dates
// (earliestValidDate 2026-12-28, repeatDueDate 2027-02-05). Every assertion
// below is unchanged.
const ADULT = {
  dob: '1956-01-01',
  ageMonths: 846,
  today: '2026-10-23',
  riskIds: [],
  ppsv23Doses: [{ product: 'PPSV23', date: '2026-01-01' }],
  pcvDoses: [
    { product: 'PCV20', date: '2026-02-05' }, // 5 weeks after the PPSV23 — rejected
  ],
};

const lastPcvDose = (p) => analyzeBoth({ ...p }).pcv.perDose.at(-1);

/** Re-run the patient with one more dose of `product` given on `date`. */
function giveNextDose(patient, product, date) {
  const ageMonths = patient.dob
    ? calendarMonthsBetween(patient.dob, date)
    : patient.ageMonths;
  const a = analyzeBoth({
    ...patient,
    pcvDoses: [...patient.pcvDoses, { product, date }],
    ageMonths,
    today: date,
  });
  return a.pcv.perDose.at(-1);
}

describe('the advised repeat date is the real minimum, not the graced one', () => {
  it('the child is advised 2026-11-09 — the minimum the card already names', () => {
    const dose = lastPcvDose(CHILD);
    expect(dose.status).toBe('invalid');
    // Pre-fix: 2026-11-05, four days earlier.
    expect(dose.repeatDueDate).toBe('2026-11-09');
    // The wording matters as much as the date: the chip states an EARLIEST,
    // and the rec card alone states when the dose is DUE. "is due on or
    // after" put a second due-date on the screen.
    expect(dose.reasons.at(-1))
      .toContain('can be given from Nov 9, 2026 at the earliest');
    expect(dose.reasons.at(-1)).not.toContain('is due on or after');
    expect(dose.reasons.at(-1)).not.toContain('2026-11-05');
  });

  it("and that is the same date the rec card's own note calls the minimum", () => {
    // The whole point of the ruling: one earliest date on the screen, not two.
    const card = recommend(CHILD).recs.find((r) => r.vaccine === 'PCV');
    // C12 (2026-10-24): the card's minimum clause prints the friendly form.
    expect(card.note.detail).toContain('Nov 9, 2026');
    expect(lastPcvDose(CHILD).repeatDueDate).toBe('2026-11-09');
  });

  it('the adult months-stated rule loses the grace too', () => {
    const dose = lastPcvDose(ADULT);
    expect(dose.status).toBe('invalid');
    expect(dose.intervalRuleId).toBe('ADULT-PCV-AFTER-PPSV23');
    // 2026-02-05 + 1 calendar year. Pre-fix: 2027-02-01.
    expect(dose.repeatDueDate).toBe('2027-02-05');
  });

  it('`earliestValidDate` KEEPS the grace — it judges a dose already given', () => {
    // 2026-09-21 + 28 days = 2026-10-19, minus the 4-day grace. This is the
    // field the verdict corpora record; the ruling is about advice, so it must
    // not move, and no committed verdict may change with it.
    expect(lastPcvDose(CHILD).earliestValidDate).toBe('2026-10-15');
    // 2026-01-01 + 1 year = 2027-01-01, minus 4 days.
    expect(lastPcvDose(ADULT).earliestValidDate).toBe('2026-12-28');
  });

  it('the app advises the 9th and still ACCEPTS the 5th — grace intact', () => {
    const advised = lastPcvDose(CHILD).repeatDueDate;
    expect(giveNextDose(CHILD, 'PCV20', advised).status).toBe('valid');
    // Four days early: CDC's grace, so it still counts.
    expect(giveNextDose(CHILD, 'PCV20', addDays(advised, -4)).status).toBe('valid');
    // Five days early: outside the grace. Pre-fix the advised date itself sat
    // here, so `advised - 4` was 8 days early and this assertion's sibling
    // above failed.
    expect(giveNextDose(CHILD, 'PCV20', addDays(advised, -5)).status).toBe('invalid');
  });

  it('that grace-window property is a CHILD property, and here is why', () => {
    // Not an oversight: an adult's next PCV is anchored on the PPSV23 that
    // still counts (ADULT-PCV-AFTER-PPSV23, `from: 'lastPpsv23'`), so the
    // rejected PCV20 does not move the date the app will ACCEPT. A child's is
    // anchored on the previous dose including a rejected one, so it does.
    // (The rule named here was ADULT-PCV20-21-AFTER-PCV13 until 2026-10-24;
    // the cross-stream shape that produces the gap is the same.)
    //
    // That difference is the second of PR #83's two open questions, put to the
    // owner on 2026-10-24 and NOT decided here: the adult chip names
    // 2027-02-05 while the adult card names 2027-01-01, and the app would
    // accept the dose on either. Nothing below pins which is right.
    const advised = lastPcvDose(ADULT).repeatDueDate;
    expect(giveNextDose(ADULT, 'PCV20', advised).status).toBe('valid');
    // The card's date, a month earlier, is accepted too — that is the gap.
    expect(giveNextDose(ADULT, 'PCV20', '2027-01-01').status).toBe('valid');
  });
});
