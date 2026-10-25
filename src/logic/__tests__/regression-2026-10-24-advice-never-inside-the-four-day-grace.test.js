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
// ⚠️ THE HISTORY HAS CHANGED TWICE AND THE NUMBERS HAVE NOT MOVED ONCE. The
// fixture only ever needs an adult floor stated in calendar MONTHS, and each
// time the row it stood on stopped being a floor it was repointed at the next
// one, keeping the same two dates.
//
//   originally  PCV13 2026-01-01 → PCV20 2026-02-05, the 1-year
//               conjugate-to-conjugate floor — downgraded by §K-CONJUGATE on
//               2026-10-24.
//   then        PPSV23 2026-01-01 → PCV20 2026-02-05, ADULT-PCV-AFTER-PPSV23
//               — downgraded by the owner on 2026-10-25 ("count like the
//               child").
//   now         PCV13 2026-01-01 → PPSV23 2026-02-05,
//               ADULT-PPSV23-AFTER-PCV13 — adult, 1 calendar year,
//               cross-stream, graced, still a floor.
//
// All three produce the identical pair of dates (earliestValidDate
// 2026-12-28, repeatDueDate 2027-02-05), which is why every assertion below
// is unchanged. The judged dose is now a PPSV23, so it is read out of the
// PPSV23 stream — hence `lastAdultDose` beside `lastPcvDose`.
const ADULT = {
  dob: '1956-01-01',
  ageMonths: 846,
  today: '2026-10-23',
  riskIds: [],
  pcvDoses: [{ product: 'PCV13', date: '2026-01-01' }],
  ppsv23Doses: [
    { product: 'PPSV23', date: '2026-02-05' }, // 5 weeks after the PCV13 — rejected
  ],
};

const lastPcvDose = (p) => analyzeBoth({ ...p }).pcv.perDose.at(-1);
const lastAdultDose = (p) => analyzeBoth({ ...p }).ppsv23.perDose.at(-1);

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
    const dose = lastAdultDose(ADULT);
    expect(dose.status).toBe('invalid');
    expect(dose.intervalRuleId).toBe('ADULT-PPSV23-AFTER-PCV13');
    // 2026-02-05 + 1 calendar year. Pre-fix: 2027-02-01.
    expect(dose.repeatDueDate).toBe('2027-02-05');
  });

  it('`earliestValidDate` KEEPS the grace — it judges a dose already given', () => {
    // 2026-09-21 + 28 days = 2026-10-19, minus the 4-day grace. This is the
    // field the verdict corpora record; the ruling is about advice, so it must
    // not move, and no committed verdict may change with it.
    expect(lastPcvDose(CHILD).earliestValidDate).toBe('2026-10-15');
    // 2026-01-01 + 1 year = 2027-01-01, minus 4 days.
    expect(lastAdultDose(ADULT).earliestValidDate).toBe('2026-12-28');
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
    // Not an oversight. An adult's next conjugate is anchored CROSS-STREAM on
    // a dose that still counts — here the PCV13 of 2026-01-01
    // (ADULT-PCV20-21-AFTER-PCV13, `from: 'lastPcv13'`) — so the rejected
    // PPSV23 does not move the date the app will ACCEPT. A child's is
    // anchored on the previous dose in the same stream INCLUDING a rejected
    // one, so it does.
    //
    // ⚠️ THE CARD/CHIP GAP THIS USED TO RECORD IS CLOSED. It read "the adult
    // chip names 2027-02-05 while the adult card names 2027-01-01" and left
    // the question open for the owner. She answered it on 2026-10-25 for this
    // family — the card follows the invalid dose — so both surfaces now say
    // 2027-02-05, which is asserted here rather than described.
    const advised = lastAdultDose(ADULT).repeatDueDate;
    expect(advised).toBe('2027-02-05');
    expect(recommend(ADULT).recs[0].earliestNextDate).toBe('2027-02-05');
    expect(giveNextDose(ADULT, 'PCV20', advised).status).toBe('valid');
    // And the app still ACCEPTS a dose earlier than it ADVISES, because the
    // acceptance clock is the PCV13's. That is the property, and it is what
    // makes the advice/acceptance split visible on an adult at all.
    expect(giveNextDose(ADULT, 'PCV20', '2027-01-01').status).toBe('valid');
  });
});
