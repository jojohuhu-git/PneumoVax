// How old the patient is — worked out in one place, from the best thing the
// clinician gave us.
//
// P3-1 (S10, 2026-10-10). The Age step promised, in its own subtitle, that
// "date of birth is recommended: it lets dose dates be checked precisely (e.g.
// against the 65th birthday for PPSV23, or the 19th-birthday adult schedule
// boundary)" — and then threw the date of birth away, keeping only a number of
// months. Two things followed from that:
//
//   - Birthdays had to be reconstructed by multiplying months by an averaged
//     30.4375 days. That is how the "was PPSV23 given at >=65?" test came to be
//     wrong by up to half a month in both directions: 2,782 of 29,565 swept
//     (date of birth, dose date) pairs were misclassified, every one of them
//     within -14 to +15 days of the 65th birthday (A-P0-1).
//
//   - The age was computed ONCE, at the moment of typing, against the clock at
//     that instant — while dose validity and "due today" all read the clock
//     live. A tab left open across midnight held a patient who did not age
//     while the calendar did.
//
// Keeping the date of birth and deriving the age from it at render fixes both,
// and is what lets the app know what "before birth" means for a recorded dose.
//
// A patient entered as years/months is unchanged, deliberately: the app does
// not know their birthday, so it must not start printing exact dates for them.
//
// Ported from MeningoVax's patientAge.js (its calendar P1-3 / P2-1 / P2-2),
// which solved the same problem against the 16th birthday.
import { dobToAgeMonths } from './format.js';
import { calendarMonthsBetween } from './dateUtils.js';

/**
 * The patient's age in months, now.
 *
 * @param {object} patient        anything carrying `dob` and/or `ageMonths`
 * @param {string} [today]        reference date; defaults to the clock
 * @returns {number|null}         age in months, or null if nothing was entered
 */
export function patientAgeMonths(patient, today) {
  if (!patient) return null;
  // The date of birth wins whenever there is one: a stored ageMonths is a
  // snapshot of it, and a snapshot must never outrank the thing it came from.
  if (patient.dob) {
    const am = dobToAgeMonths(patient.dob, today);
    if (am != null) return am;
  }
  return patient.ageMonths ?? null;
}

/**
 * How old the patient was at a past dose, in months.
 *
 * P3-3 (S10). This used to be worked out by subtraction, in two hand-written
 * copies (validate.js's ageAtDoseFromDate and recommend.js's summarizePcv):
 *
 *   ageAtDose = ageMonths - daysBetween(doseDate, today) / 30.4375
 *
 * Both terms are measured between DIFFERENT pairs of anniversaries — the
 * patient's own, and the dose date's — so subtracting one from the other mixes
 * two rulers. A child dosed exactly on their 2nd birthday read as 23.98 months
 * and was told the dose was "below the 2-year minimum age for PPSV23": the
 * message stated that 24 months is below 24 months (peds audit P1-1).
 *
 * With the date of birth kept, the exact answer is one call: measure from the
 * birthday to the dose, on the patient's own anniversaries — the same ruler
 * everything else uses. A patient entered as years/months has no birthday to
 * measure from, so they keep the subtraction: it is the best the app can
 * honestly do for them, and it is unchanged apart from now being measured in
 * calendar months rather than averaged ones.
 *
 * A dose dated before birth comes back NEGATIVE rather than null, on both
 * paths, because that is how callers detect it (P3-6).
 *
 * @param {{date?: ?string}} dose
 * @param {{dob?: ?string, ageMonths?: ?number}} patient
 * @param {string} [today]   reference date, used only on the fallback path
 * @returns {number|null}    age in months at the dose, or null if unknowable
 */
export function ageAtDoseMonths(dose, patient, today) {
  if (!dose?.date) return null;
  if (patient?.dob) return round6(calendarMonthsBetween(patient.dob, dose.date));
  const am = patient?.ageMonths;
  if (am == null || !today) return null;
  return round6(am - calendarMonthsBetween(dose.date, today));
}

// Subtracting two large nearly-equal floats (both ~months since a distant
// birthday) leaves binary floating-point noise — 779.9999999999999 instead of
// 780 — which would still trip a ">= 780 months" threshold by less than a
// microsecond's worth of age. Six decimal places is far finer than a day and
// far coarser than the noise.
function round6(n) {
  return Math.round(n * 1e6) / 1e6;
}
