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
import { DOSE_INTERVAL_RULES } from '../doseIntervalRules.js';

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
// A child with a CALENDAR-MONTH interval (5 years), the other arm of
// `intervalFrom`. A months rule subtracts the grace from a calendar date, so
// it needs its own case: the days arm passing proves nothing about it.
//
// ⚠️ THIS WAS AN ADULT UNTIL 2026-10-25, AND THE ASSERTIONS ARE UNCHANGED.
// It was a 70-year-old with PPSV23 2026-01-01 → PCV20 2026-02-05, rejected by
// ADULT-PCV-AFTER-PPSV23 (1 calendar year). Her three-row adult table turned
// that row — and every other adult floor — into a recommendation, so no adult
// dose is set aside for timing any more and the fixture stopped exercising a
// floor at all. `CHILD-PPSV23-AFTER-PPSV23` replaces it because it is now the
// ONLY row in the whole table that is both months-stated and graced, which the
// last test below asserts structurally. If that row is ever downgraded too —
// and the owner's 2026-10-25 table queues exactly that for an
// immunocompromised child — the months arm of the grace has no home left and
// this file's coverage of it goes with it. Say so rather than deleting it.
//
// ⚠️ IT WAS DOWNGRADED (P2, 2026-10-30), AND THE ARM DID FIND A HOME. A second
// PPSV23 after a COUNTED first is now a recommendation. The old floor survives
// as `CHILD-PPSV23-AFTER-INVALID-PPSV23` — a repeat of a REJECTED PPSV23,
// Ruling D's case — months-stated and graced. So her PCV20 moved from
// 2019-01-01 to 2019-03-04, four weeks before her first PPSV23, which makes
// that first dose rejected (`CHILD-PPSV23-AFTER-PCV`) and puts her second on
// the surviving floor. Every date below is unchanged.
//
// Her second PPSV23 is 2024-02-05, about two months inside the five years:
//   earliestValidDate  2024-03-28   (2019-04-01 + 5y, MINUS the grace)
//   repeatDueDate      2029-02-05   (2024-02-05 + 5y, NO grace — pre-fix 02-01)
const CHILD_MONTHS = {
  dob: '2016-01-01',
  ageMonths: 129,
  today: '2026-10-23',
  riskIds: ['asplenia'],
  pcvDoses: [{ product: 'PCV20', date: '2019-03-04' }],
  ppsv23Doses: [
    { product: 'PPSV23', date: '2019-04-01' }, // 28 days after the PCV20 — rejected
    { product: 'PPSV23', date: '2024-02-05' }, // under 5 years of a rejected dose — rejected (Ruling D)
  ],
};

const lastPcvDose = (p) => analyzeBoth({ ...p }).pcv.perDose.at(-1);
const lastPpsvDose = (p) => analyzeBoth({ ...p }).ppsv23.perDose.at(-1);

/** Re-run the patient with one more dose of `product` given on `date`. */
function giveNextDose(patient, product, date) {
  const ageMonths = patient.dob
    ? calendarMonthsBetween(patient.dob, date)
    : patient.ageMonths;
  const stream = product === 'PPSV23' ? 'ppsv23Doses' : 'pcvDoses';
  const a = analyzeBoth({
    ...patient,
    [stream]: [...(patient[stream] || []), { product, date }],
    ageMonths,
    today: date,
  });
  return (product === 'PPSV23' ? a.ppsv23 : a.pcv).perDose.at(-1);
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

  it('the months-stated rule loses the grace too', () => {
    const dose = lastPpsvDose(CHILD_MONTHS);
    expect(dose.status).toBe('invalid');
    expect(dose.intervalRuleId).toBe('CHILD-PPSV23-AFTER-INVALID-PPSV23');
    // 2024-02-05 + 5 calendar years. Pre-fix: 2029-02-01.
    expect(dose.repeatDueDate).toBe('2029-02-05');
    expect(dose.reasons.at(-1))
      .toContain('can be given from Feb 5, 2029 at the earliest');
  });

  it('`earliestValidDate` KEEPS the grace — it judges a dose already given', () => {
    // 2026-09-21 + 28 days = 2026-10-19, minus the 4-day grace. This is the
    // field the verdict corpora record; the ruling is about advice, so it must
    // not move, and no committed verdict may change with it.
    expect(lastPcvDose(CHILD).earliestValidDate).toBe('2026-10-15');
    // 2019-04-01 + 5 years = 2024-04-01, minus 4 days.
    expect(lastPpsvDose(CHILD_MONTHS).earliestValidDate).toBe('2024-03-28');
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

  it('and the same holds on the months arm — advise 2029-02-05, accept 02-01', () => {
    // Added 2026-10-25 with the retarget above. The adult fixture this file
    // used to carry never asserted this, because an adult's next PCV was
    // anchored on a dose that still counted (see the last test). Here the
    // rejected PPSV23 IS the anchor, so the grace window is visible: the
    // advised date and the four days below it all count, the fifth does not.
    const advised = lastPpsvDose(CHILD_MONTHS).repeatDueDate;
    expect(advised).toBe('2029-02-05');
    expect(giveNextDose(CHILD_MONTHS, 'PPSV23', advised).status).toBe('valid');
    expect(giveNextDose(CHILD_MONTHS, 'PPSV23', addDays(advised, -4)).status).toBe('valid');
    expect(giveNextDose(CHILD_MONTHS, 'PPSV23', addDays(advised, -5)).status).toBe('invalid');
  });

  it('the adult chip/card gap this file recorded cannot arise any more', () => {
    // ── WHAT THIS TEST USED TO SAY ───────────────────────────────────────
    //
    // It documented PR #83's second open question: a 70-year-old whose PCV20
    // came 5 weeks after her PPSV23 had the dose REJECTED, and then the chip
    // under it named 2027-02-05 (a year from the dose she got) while the rec
    // card named 2027-01-01 (a year from the PPSV23, which still counted).
    // Two dates, and the app would have accepted the dose on either. Nothing
    // here pinned which was right, because the owner had not ruled.
    //
    // ── WHY IT CANNOT HAPPEN NOW ─────────────────────────────────────────
    //
    // The owner's 2026-10-25 adult table removed every adult floor. A chip
    // can only name a repeat date for a dose that was set aside, so with no
    // adult floor there is no adult `repeatDueDate` and no second date to
    // disagree with the card. Her question is answered by the rule changing
    // underneath it, not by a ruling on the gap.
    const dose = lastPcvDose(ADULT_WHO_USED_TO_BE_REJECTED);
    expect(dose.status).toBe('valid');
    expect(dose.repeatDueDate).toBeUndefined();
    expect(dose.earliestValidDate).toBeUndefined();
    // The row still fires — it is a recommendation now, and says so.
    expect(dose.intervalRuleId).toBe('ADULT-PCV-AFTER-PPSV23');
    expect(dose.earlyAdvisory).toBe(true);

    // And the structural half: no adult row can lose a grace it does not
    // have, and exactly one row in the table is both months-stated and
    // graced — the fixture above. If this list grows, the new row needs its
    // own case here; if it empties, say so (see CHILD_MONTHS's comment).
    expect(DOSE_INTERVAL_RULES.filter((r) => r.rulebook === 'adult' && r.grace))
      .toEqual([]);
    // P2 (2026-10-30): two rows now, and only one is a FLOOR. The months arm
    // of a repeat date lives on the floor (CHILD_MONTHS above); the graced
    // RECOMMENDATION never sets a dose aside, so it never names a repeat.
    expect(
      DOSE_INTERVAL_RULES.filter((r) => r.grace && r.interval?.months).map((r) => r.id),
    ).toEqual(['CHILD-PPSV23-AFTER-PPSV23', 'CHILD-PPSV23-AFTER-INVALID-PPSV23']);
    expect(
      DOSE_INTERVAL_RULES.filter((r) => r.grace && r.interval?.months && r.enforcement === 'floor')
        .map((r) => r.id),
    ).toEqual(['CHILD-PPSV23-AFTER-INVALID-PPSV23']);
  });
});

// The patient the last test is about, kept beside it rather than at the top:
// she is no longer an example of anything the first six tests assert.
const ADULT_WHO_USED_TO_BE_REJECTED = {
  dob: '1956-01-01',
  ageMonths: 846,
  today: '2026-10-23',
  riskIds: [],
  ppsv23Doses: [{ product: 'PPSV23', date: '2026-01-01' }],
  pcvDoses: [{ product: 'PCV20', date: '2026-02-05' }], // 5 weeks after — counted
};
