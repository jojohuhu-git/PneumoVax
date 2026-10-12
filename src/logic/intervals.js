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
