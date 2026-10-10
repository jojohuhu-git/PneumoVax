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
// S3 will add the first recorded-dose INTERVAL checks (queue P1-0); the same
// sentence grants them the same grace, and intervalMeetsMinimum is already the
// right shape for it.
//
// Ported from MeningoVax's intervals.js (its P1-1), which reads the same CDC
// sentence off the same page.
// ─────────────────────────────────────────────────────────────────────────

import { addDays, calendarMonthsBetween, calendarIntervalElapsed } from './dateUtils.js';

/** Days a dose may precede a minimum age or interval and still count. */
export const GRACE_DAYS = 4;

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
