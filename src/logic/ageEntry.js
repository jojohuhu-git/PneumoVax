// What counts as an age a human being can actually be.
//
// P3-8 (S10b, 2026-10-10). The Age step accepted anything. Typing the year as
// `0026` instead of `2026` — one keystroke short, in a four-digit year box —
// was accepted silently: the badge read "2000 years · Older adult (≥50y)", Next
// stayed enabled, and the Results step produced a complete, ordinary-looking
// routine adult recommendation ("Due today: PCV", "1 dose PCV (PCV20, PCV15,
// or PCV21)"). For the infant actually in the room that is the wrong schedule
// entirely — an infant needs the 4-dose Table 1 series, not one adult dose —
// and nothing on the card looks wrong, so nothing tells the clinician.
//
// The Years/Months boxes had the same door: they carry max="120", but the app
// read the typed value directly, so the attribute never bit and 999 years was
// accepted ("999 years · Older adult (≥50y)").
//
// Both entry modes ask THIS module, so the two doors cannot drift apart — the
// same discipline as intervals.js and patientAge.js.
//
// This is a PLAUSIBILITY bound, not a clinical rule. No ACIP/CDC guidance turns
// on it; 120 years is simply the bound the Years box already claimed. It is
// deliberately generous: refusing a real patient is the worse error, so the
// only ages refused here are ones no living person can have.
//
// The messages name the field and say what is probably wrong, modelled on the
// future-dated-dose message in validate.js — "if the year is a typo, correct
// it" is more use to the person holding the chart than "invalid".
//
// Ported from MeningoVax's impossible-entries P0-1 (`b8a9335`) so the sibling
// apps refuse the same entries with the same wording. The rule is ported, not
// the clinical content — there is none here.
import { dobToAgeMonths } from './format.js';
import { todayISO } from './dateUtils.js';

/**
 * The oldest a patient can plausibly be, in whole years. Matches the Years
 * box's existing max="120".
 *
 * The WHOLE of that year is allowed: someone aged 120 years and 11 months still
 * answers "120" when asked their age, and refusing them would be refusing a real
 * patient — the worse error of the two. So the check is on whole years, not on a
 * months total, and the first age refused is 121 years exactly.
 *
 * For context on how generous this is: the oldest verified human lived to 122.
 */
export const MAX_PLAUSIBLE_AGE_YEARS = 120;

/** The first age refused, in months — one whole year past the bound. */
export const MAX_PLAUSIBLE_AGE_MONTHS = (MAX_PLAUSIBLE_AGE_YEARS + 1) * 12;

/** Months only ever run 0-11 here; 12 or more is a year spelled wrong. */
const MAX_MONTHS_BOX = 11;

/**
 * What is wrong with what has been typed into the Age step, if anything.
 *
 * Returns a sentence to show the clinician, or null when the entry is fine —
 * including when it is simply empty, which is unanswered rather than wrong.
 *
 * @param {object} entry
 * @param {'dob'|'precise'} entry.mode  which entry box is in use
 * @param {string} [entry.dob]          ISO date string, mode 'dob'
 * @param {string} [entry.years]        raw text from the Years box
 * @param {string} [entry.months]       raw text from the Months box
 * @param {string} [entry.today]        reference date; defaults to the clock
 */
export function ageEntryProblem({ mode, dob, years, months, today }) {
  const ref = todayISO(today);

  if (mode === 'dob') {
    if (!dob) return null;
    if (dob > ref) {
      return 'That date of birth is in the future. Check the year — if it is a typo, correct it.';
    }
    const am = dobToAgeMonths(dob, ref);
    if (am == null || !Number.isFinite(am)) {
      return 'That date of birth cannot be read. Check the year, month and day.';
    }
    if (am >= MAX_PLAUSIBLE_AGE_MONTHS) {
      return `That date of birth would make the patient over ${MAX_PLAUSIBLE_AGE_YEARS} years old. Check the year — a two-digit year such as 26 is read as the year 26, not 2026.`;
    }
    return null;
  }

  const yBlank = years == null || String(years).trim() === '';
  const mBlank = months == null || String(months).trim() === '';
  if (yBlank && mBlank) return null;

  const y = yBlank ? 0 : Number(years);
  const m = mBlank ? 0 : Number(months);

  if (!yBlank && (!Number.isFinite(y) || y < 0)) {
    return 'Years cannot be a negative number.';
  }
  if (!mBlank && (!Number.isFinite(m) || m < 0)) {
    return 'Months cannot be a negative number.';
  }
  if (!mBlank && m > MAX_MONTHS_BOX) {
    return `Months runs from 0 to ${MAX_MONTHS_BOX}. For a whole year or more, use the Years box.`;
  }
  if (y * 12 + m >= MAX_PLAUSIBLE_AGE_MONTHS) {
    return `A patient cannot be more than ${MAX_PLAUSIBLE_AGE_YEARS} years old. Check the Years box.`;
  }
  return null;
}
