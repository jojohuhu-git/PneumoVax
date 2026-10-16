// ─────────────────────────────────────────────────────────────────────────
// intervals.js — CDC's 4-day grace, in one place.
//
// Source: CDC Child and Adult Immunization Schedule Notes, "Additional
// Information". Both pages fetched live 2026-10-10 and carry identical wording:
//
//   "Vaccine doses administered ≤4 days before the minimum age or interval are
//    considered valid. Doses of any vaccine administered ≥5 days earlier than
//    the minimum age or minimum interval should not be counted as valid and
//    should be repeated as age appropriate. The repeat dose should be spaced
//    after the invalid dose by the recommended minimum interval."
//
//   https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html
//   https://www.cdc.gov/vaccines/hcp/imz-schedules/adult-notes.html
//
// This was implemented NOWHERE in PneumoVax — `grep -rE "grace|4 days"` over
// src/ returned nothing — so every age floor was a hard edge and the app
// advised repeating doses ACIP counts. Measured on the PCV 6-week floor: the
// app's accept threshold was day 43 where CDC's is day 38, so five days of
// valid doses were rejected (peds audit P1-1).
//
// WHAT THIS APPLIES TO, and what it deliberately does not.
//
// The rule is about whether a dose that was ALREADY GIVEN counts. It is a
// validity rule, so it lives on the validator's thresholds. One exclusion,
// deliberate: NOT the scheduler. recommend.js's "due today" and "earliest next
// date" keep using the real minimum. Granting grace there would make the app
// advertise a date 4 days early and actively advise giving doses before the
// minimum — which is not what CDC's sentence permits. The app therefore still
// says "eligible on the 1st" and still ACCEPTS a dose given on the 28th.
// There is a test for that exclusion in
// __tests__/regression-peds-p1-1-four-day-grace.test.js.
//
// S3 (2026-10-11) added the first recorded-dose INTERVAL checks (queue P1-0);
// the same sentence grants them the same grace, and intervalMeetsMinimum was
// already the right shape for it. The minimums themselves now live here too —
// see below.
//
// Ported from MeningoVax's intervals.js (its P1-1), which reads the same CDC
// sentence off the same page.
// ─────────────────────────────────────────────────────────────────────────

import { addDays, calendarMonthsBetween, calendarIntervalElapsed } from './dateUtils.js';

/** Days a dose may precede a minimum age or interval and still count. */
export const GRACE_DAYS = 4;

// ── The pneumococcal minimum intervals, in one place (queue P1-0) ────────
//
// Before S3 these numbers existed only inside recommend.js's forward-looking
// scheduler, as module-local `WK4`/`WK8`. The validator had no constant to
// reach for, which is half of why it never checked an interval at all. They
// live here now and both callers import them.
//
// Sources, fetched live 2026-10-11:
//
//   CDC Catch-up Immunization Schedule (Table 2) — the column is literally
//   headed "Minimum Interval Between Doses"; pneumococcal conjugate row:
//     "4 weeks if first dose was administered before the 1st birthday /
//      8 weeks (as final dose for healthy children) if first dose was
//      administered at the 1st birthday or after"
//   https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-catch-up.html
//
//   immunize.org p2016 Table 1 footnote, the same rule keyed the same way:
//     "Minimum interval between doses: for children younger than age 12
//      months = 4 weeks; for children age 12 months or older = 8 weeks"
//
// "4 weeks = 28 days" is CDC's own arithmetic, from the same "Additional
// Information" block as the grace.

/** PCV-to-PCV minimum, when the earlier dose was given under 12 months. */
export const PCV_MIN_INTERVAL_DAYS_UNDER_12M = 28;   // 4 weeks

/** PCV-to-PCV minimum, when the earlier dose was given at 12 months or older. */
export const PCV_MIN_INTERVAL_DAYS_FROM_12M = 56;    // 8 weeks

/**
 * Minimum days between two PCV doses, keyed on an age in months.
 *
 * WHICH age is the caller's decision, and the two callers deliberately pass
 * different ones:
 *
 *   • validate.js passes the age at the PREVIOUS dose — the reading both
 *     sources above share ("if first dose was administered before the 1st
 *     birthday"), and the only one that makes sense when grading a gap that
 *     has already happened.
 *   • recommend.js passes the patient's CURRENT age, which is what its
 *     forward-looking scheduler has always done. That keying is a known open
 *     question (peds audit P0-2, which owns it); it is NOT changed here,
 *     because changing it moves recommendation totals, not dose validity.
 *
 * The two agree everywhere except a dose 2→3 whose previous dose fell at 7–11
 * months, where CDC Table 2 is stricter than the footnote (8 weeks, and not
 * before the first birthday). The validator deliberately uses the more
 * permissive footnote reading, so it can never tell a clinician to repeat a
 * dose that CDC Table 2 would have accepted. That stricter cell belongs with
 * P0-2 as well.
 *
 * @param {?number} ageMonths  age in months (at the previous dose, or current)
 */
export function pcvSeriesMinIntervalDays(ageMonths) {
  return ageMonths != null && ageMonths < 12
    ? PCV_MIN_INTERVAL_DAYS_UNDER_12M
    : PCV_MIN_INTERVAL_DAYS_FROM_12M;
}

/**
 * Minimum days before the NEXT PCV dose is due, per CDC Catch-up Table 2.
 *
 * ── Why this exists alongside pcvSeriesMinIntervalDays ──────────────────
 *
 * pcvSeriesMinIntervalDays (above) is the VALIDITY FLOOR's key: it grades a
 * gap that already happened, and owner decision 2 of 2026-10-11 left it
 * exactly as it was. This function answers the other question — what the app
 * ADVISES for a dose not yet given — and CDC states that one dose by dose.
 *
 * Neither age alone can reproduce CDC Table 2, which is the whole finding of
 * peds audit P0-2. A patient at 12.2 months whose previous dose was at 11.5
 * months gets 4 weeks as dose 2 and 8 weeks as dose 3: same two ages, same
 * child, different answer, because the DOSE NUMBER is part of the key. The
 * scheduler used to pass the current age and the validator the age at the
 * previous dose, and each was right in some cells and wrong in others.
 *
 * This is NOT a gap-between-recorded-doses rule, so it does not belong in
 * doseIntervalRules.js — that table owns doses already given. Do not move it
 * there, and do not key the table's row off this function.
 *
 * SOURCE, fetched live 2026-10-11 (CLINICAL_SPEC.md §L carries the full
 * quotes): CDC Catch-up Immunization Schedule, "Children age 4 months through
 * 6 years", pneumococcal conjugate row, column "Minimum Interval Between
 * Doses".
 *   https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-catch-up.html
 *
 *   Dose 1 to Dose 2: "4 weeks if first dose was administered before the 1st
 *     birthday" / "8 weeks (as final dose for healthy children) if first dose
 *     was administered at the 1st birthday or after"
 *   Dose 2 to Dose 3: "4 weeks if current age is younger than 12 months and
 *     previous dose was administered at <7 months old" / "8 weeks (as final
 *     dose for healthy children) if previous dose was administered between
 *     7-11 months (wait until at least 12 months old); OR if current age is 12
 *     months or older and at least 1 dose was administered before age 12
 *     months"
 *   Dose 3 to Dose 4: "8 weeks (as final dose)"
 *
 * The "wait until at least 12 months old" parenthetical is not an interval, so
 * it is not returned here — the caller's own ≥12-month floor on the closing
 * dose expresses it (and p2016 Table 1 states the same thing as "last dose at
 * age 12-15 months").
 *
 * Table 2's two "No further doses needed … at age 24 months or older" cells
 * are also absent: this function is only ever called for a child under 24
 * months, for whom no earlier dose can have been given at 24 months or later.
 *
 * Where Table 2 lists no branch — a 12-23-month-old whose doses were all given
 * at or after the first birthday — the answer falls through to 8 weeks, which
 * is both the stricter option and what p2016 footnote t states for a child
 * aged 12 months or older.
 *
 * @param {object} p
 * @param {number}  p.doseNumber        the dose about to be given (2, 3 or 4+)
 * @param {?number} p.ageAtPrevDose     age in months at the most recent counting dose
 * @param {number}  p.currentAgeMonths  the patient's age now
 * @param {boolean} p.anyDoseBefore12   was any counting dose given before 12 months?
 */
export function pcvNextDoseMinIntervalDays({
  doseNumber,
  ageAtPrevDose,
  currentAgeMonths,
  anyDoseBefore12,
}) {
  // Dose 1 to Dose 2 — keyed on the age at that first dose.
  if (doseNumber <= 2) {
    return ageAtPrevDose != null && ageAtPrevDose < 12
      ? PCV_MIN_INTERVAL_DAYS_UNDER_12M
      : PCV_MIN_INTERVAL_DAYS_FROM_12M;
  }
  // Dose 2 to Dose 3 — the only cell that needs BOTH ages. Each branch below
  // is one clause of Table 2's cell, in the order the cell states them.
  if (doseNumber === 3) {
    // "4 weeks if current age is younger than 12 months and previous dose was
    //  administered at <7 months old"
    if (currentAgeMonths < 12 && ageAtPrevDose != null && ageAtPrevDose < 7) {
      return PCV_MIN_INTERVAL_DAYS_UNDER_12M;
    }
    // "8 weeks ... if previous dose was administered between 7-11 months
    //  (wait until at least 12 months old); OR if current age is 12 months or
    //  older and at least 1 dose was administered before age 12 months"
    const prev7to11 = ageAtPrevDose != null && ageAtPrevDose >= 7 && ageAtPrevDose < 12;
    if (prev7to11 || (currentAgeMonths >= 12 && anyDoseBefore12)) {
      return PCV_MIN_INTERVAL_DAYS_FROM_12M;
    }
    // Unlisted by Table 2: every dose given at or after the first birthday.
    // 8 weeks is the stricter option and matches p2016 footnote t for a child
    // aged 12 months or older.
    return PCV_MIN_INTERVAL_DAYS_FROM_12M;
  }
  // Dose 3 to Dose 4 and anything beyond — a flat 8 weeks "(as final dose)".
  return PCV_MIN_INTERVAL_DAYS_FROM_12M;
}

/**
 * Minimum days between a PCV dose and a PPSV23 dose given after it.
 *
 * CDC Child & Adolescent Schedule Notes, pneumococcal (live 2026-10-11):
 *   "administer 1 dose of PPSV23 at least 8 weeks after the PCV15 dose.**"
 *   "**When both PCV15 and PPSV23 are indicated, administer all doses of PCV15
 *     first. PCV15 and PPSV23 should not be administered during the same visit."
 *
 * For adults this 8 weeks is the *allowable minimum*, not the recommendation —
 * the recommendation is ≥1 year (CLAUDE.md, A-P1-1). A dose at 3 months is
 * therefore short of what the app advises but still valid, which is exactly
 * what a validity floor of 8 weeks expresses.
 */
export const PCV_PPSV23_MIN_INTERVAL_DAYS = 56;      // 8 weeks

/**
 * Calendar months CDC ADVISES between two adult PCV doses (S3-N1).
 *
 * This is not a minimum and must never be used as one — see the adult note in
 * validate.js. CDC Adult Schedule Notes, live 2026-10-11:
 *   "Previously received only PCV13: 1 dose PCV20 or 1 dose PCV21 at least 1
 *    year after the last PCV13 dose."
 *
 * 1 year is the SHORTEST of CDC's adult gaps — the PCV13+PPSV23 rows say 5
 * years — so an advisory keyed on it under-flags rather than over-flags. The
 * longer rows depend on which prior-vaccine row the patient is on, which is the
 * engine's job; the validator does not re-derive that matrix.
 */
export const ADULT_ADVISED_PCV_GAP_MONTHS = 12;

/**
 * Minimum CALENDAR months between a first and second PPSV23 dose.
 *
 * CDC Child & Adolescent Schedule Notes, pneumococcal, IC (live 2026-10-11):
 *   "If PPSV23 is used, administer either PCV20 or dose 2 PPSV23 at least 5
 *    years after dose 1 PPSV23."
 *
 * Calendar months, not 1,826 days: "Intervals of ≥4 months are determined by
 * calendar months" (A-P2-11 made the same move in the scheduler).
 */
export const PPSV23_REVACC_MIN_MONTHS = 60;          // 5 years

/**
 * Does an interval measured in DAYS clear its minimum, allowing the grace?
 * Use for week-based minimums, which are exact day counts (4 weeks = 28 days).
 */
export function intervalMeetsMinimum(actualDays, minDays) {
  return actualDays >= minDays - GRACE_DAYS;
}

/**
 * Does a CALENDAR-month interval clear its minimum, allowing the grace?
 *
 * The grace is applied by moving the LATER date forward, not by subtracting an
 * averaged number of days from the minimum — the same reason these comparisons
 * moved onto the calendar in the first place (P3-2).
 */
export function calendarIntervalMeetsMinimum(sinceISO, months, refISO) {
  if (!sinceISO || !refISO) return true;
  return calendarIntervalElapsed(sinceISO, months, addDays(refISO, GRACE_DAYS));
}

/**
 * Was the patient old enough at this dose, allowing the grace?
 *
 * For floors stated in MONTHS or YEARS (PPSV23's 2 years, PCV21's 18 years).
 *
 * Ages here are fractional months, and 4 days is not a fixed fraction of a
 * month (it is 4/28 in February and 4/31 in March). Rather than pick an
 * average and reintroduce exactly the drift P3-2 removed, this re-derives the
 * age as if the dose had been given GRACE_DAYS later, using the same calendar
 * arithmetic that produced the age in the first place.
 *
 * `when` carries the dose date and the reference point. Without a dose date
 * the check falls back to the exact comparison — never more lenient than it
 * can justify.
 *
 * @param {?number} ageAtDoseMonths  age in months at the dose (null = unknown)
 * @param {number}  minAgeMonths
 * @param {{doseDate?: ?string, ageMonths?: ?number, today?: ?string, dob?: ?string}} [when]
 */
export function ageMeetsMinimum(ageAtDoseMonths, minAgeMonths, when = {}) {
  if (ageAtDoseMonths != null && ageAtDoseMonths >= minAgeMonths) return true;
  const { doseDate, ageMonths, today, dob } = when;
  if (!doseDate) return false;
  const graced = addDays(doseDate, GRACE_DAYS);
  if (dob) return calendarMonthsBetween(dob, graced) >= minAgeMonths;
  if (ageMonths == null || !today) return false;
  return ageMonths - calendarMonthsBetween(graced, today) >= minAgeMonths;
}

/**
 * Was the patient old enough at this dose, allowing the grace — for a floor
 * stated in DAYS (PCV's 6 weeks = 42 days; see brands.PCV_MIN_AGE_DAYS)?
 *
 * Unlike ageMeetsMinimum above this needs no re-derivation: days are exact
 * regardless of which calendar month they fall in — that is the whole reason a
 * days-stated floor exists — so the grace is just GRACE_DAYS more days, always.
 *
 * @param {?number} ageAtDoseDays  age in days at the dose, or null when there
 *   is no date of birth on file (days cannot be counted from a birthday the
 *   app was never given; the caller falls back to ageMeetsMinimum then)
 * @param {number} minAgeDays
 */
export function ageMeetsMinimumDays(ageAtDoseDays, minAgeDays) {
  if (ageAtDoseDays == null) return false;
  return intervalMeetsMinimum(ageAtDoseDays, minAgeDays);
}

// ── The WORDS for an interval, derived from the number ───────────────────
//
// S6 second half (census step 6, 2026-10-15). Every interval a clinician
// reads used to be hand-typed beside the constant that computes the date, so
// the two could drift apart — and they did, silently, in the one direction
// that matters. Measured on `main` at 999393b by setting
// ADULT_PPSV23_INTERVAL_MONTHS to 6 and asking the engine for a 60-year-old
// with diabetes and a PCV15 on record:
//
//   doseLabel        : PPSV23 (≥1 year after PCV15) — completes the series
//   minIntervalMonths: 6
//   earliestNextDate : 2027-04-10
//
// The card said "≥1 year" while its own eligible-on date was six months out.
// Nothing in the app reconciled the sentence with the arithmetic, because the
// sentence was a string literal and the date came from the constant.
//
// So this is the single place an interval turns into words, and every label
// and note is fed from the same constant that drives its date.
//
// WHAT THIS IS NOT FOR. Verbatim source quotes keep their own wording —
// `refs.js`'s `quote` fields and `doseIntervalRules.js`'s `source` provenance
// are transcriptions of ACIP/CDC sentences, and a transcription that silently
// followed one of our constants would stop being a quote. Those are left
// hand-typed on purpose.

/**
 * An interval as a clinician reads it — "8 weeks", "1 year", "5 years".
 *
 * Takes the interval the way its own rule states it, because the two are not
 * interchangeable in this app: week-based gaps are exact day counts and
 * month-based gaps are calendar months (A-P2-11; CDC's "4 weeks = 28 days.
 * Intervals of >=4 months are determined by calendar months"). Pass whichever
 * unit the governing constant is written in and the words follow it.
 *
 * Deliberately returns the bare phrase with no "≥" and no "at least" — the
 * callers differ on which of those they use, and some sit mid-sentence.
 *
 * @param {{days?: number, months?: number}} spec exactly one of days/months
 */
export function intervalPhrase({ days, months } = {}) {
  const [n, unit] = intervalParts({ days, months });
  return `${n} ${unit}${n === 1 ? '' : 's'}`;
}

/**
 * The same interval as an ADJECTIVE — "8-week", "1-year", "5-year".
 *
 * Needed because clinical sentences use both forms and they are not
 * interchangeable: "PPSV23 is given at least 8 weeks after PCV15" (noun) but
 * "the 8-week minimum interval applies only to…" (adjective). S6's first pass
 * fed intervalPhrase() into both and produced "the 8 weeks minimum interval"
 * on 511 of the 16,250 swept patients — caught by diffing the rendered prose,
 * not by the suite, because no test asserted that clause.
 *
 * Always singular, as English adjectives are: "a 5-year gap", never
 * "a 5-years gap".
 */
export function intervalPhraseAdj({ days, months } = {}) {
  const [n, unit] = intervalParts({ days, months });
  return `${n}-${unit}`;
}

/**
 * "a" or "an" for an interval phrase, so the article follows the number too.
 *
 * Without this, "names an 8-week minimum" silently becomes "names an 1-year
 * minimum" the day the constant moves — the same drift this file exists to
 * stop, one word to the left.
 *
 * Only the leading digit decides it, and only 8 (eight, eighty, eight
 * hundred…), 11 (eleven) and 18 (eighteen) are pronounced vowel-initially.
 */
export function intervalArticle({ days, months } = {}) {
  const [n] = intervalParts({ days, months });
  const vowelSound = String(n).startsWith('8') || n === 11 || n === 18;
  return vowelSound ? 'an' : 'a';
}

/** The number and singular unit behind a phrase, shared by the formatters. */
function intervalParts({ days, months }) {
  if (days != null && months != null) {
    throw new Error('intervalPhrase: pass days OR months, not both');
  }
  if (days != null) {
    return days % 7 === 0 ? [days / 7, 'week'] : [days, 'day'];
  }
  if (months != null) {
    return months % 12 === 0 ? [months / 12, 'year'] : [months, 'month'];
  }
  throw new Error('intervalPhrase: pass days or months');
}
