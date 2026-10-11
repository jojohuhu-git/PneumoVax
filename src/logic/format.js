import { calendarMonthsBetween, todayISO } from './dateUtils.js';

// format.js — UI display helpers (not clinical logic)

/**
 * Format ageMonths using clinical immunization units.
 *   0 → "Birth", weeks for ≤2 months, months for 2–23 months,
 *   years (+months) for ≥24 months. Never "72 months" → "6 years".
 *
 * P3-5 (S10b, 2026-10-10): pass `exactDays` — the real number of days between
 * the birthday and the date being described — whenever the caller has a date of
 * birth and a real date. Weeks are then COUNTED (exactDays / 7) instead of
 * derived from the age in months via a second averaged constant.
 *
 * Why it matters: PCV's minimum age is stated in weeks ("minimum age: 6 weeks")
 * and PCV_MIN_AGE_DAYS is 42, but `am * 4.348` double-averages — calendar
 * months carry a denominator that is the length of the month the date falls in,
 * so the same 42 days came out as 5.94 weeks in a 30-day month and floored to
 * "5 weeks". Measured across 400 consecutive birth dates, 181 of them printed a
 * 42-day dose as "5 weeks", beside a rule written in 6. The engine graded those
 * doses correctly (validate.js works in exact days); only the display lied.
 *
 * `exactDays` is advisory: when it is absent or unusable — a patient entered as
 * Years/Months has no birthday to count from — the averaged path is used, as
 * before. The BAND is always chosen from `am`, so passing exactDays never moves
 * an age between weeks, months and years; it only makes the weeks count exact.
 *
 * @param {number|null} am           age in months
 * @param {object}  [opts]
 * @param {number}  [opts.exactDays] real days from the birthday, when known
 */
export function fmtAgeMonths(am, { exactDays } = {}) {
  if (am == null) return '';
  // P3-6 (S10): a negative age used to fall into the "Birth" branch below, so
  // -7 months and 0 months printed the same word. A dose dated before the
  // patient was born then read "Given at ~birth" — an ordinary-looking newborn
  // dose. A value that cannot exist must not be mistakable for a patient.
  if (am < 0) return 'Before birth';
  const haveDays = typeof exactDays === 'number' && Number.isFinite(exactDays);
  if (haveDays && exactDays < 0) return 'Before birth';
  // P3-5: the "Birth" cut was a second averaged constant of the same kind —
  // am < 0.25 months is about 7.6 days, so a genuine one-week-old printed
  // "Birth". When the days are known, the cut is simply the first whole week.
  if (haveDays ? exactDays < 7 : am < 0.25) return 'Birth';
  if (am <= 2) {
    // Count the weeks when we can; fall back to the average when we cannot.
    const wks = haveDays
      ? Math.floor(exactDays / 7)              // completed weeks, exactly
      : floorAge(am * 4.348);                  // 1 month ≈ 4.348 weeks
    if (wks < 1) return 'Birth';
    return `${wks} week${wks === 1 ? '' : 's'}`;
  }
  if (am < 24) {
    const mo = floorAge(am);
    return `${mo} month${mo === 1 ? '' : 's'}`;
  }
  // Nudge ONCE, in months, then split. Applying floorAge to am/12 and am%12
  // separately would let the same epsilon act twice: 59.9999999 floors to 5
  // years AND to a 12-month remainder, and carrying that remainder produced
  // "6 years" for an age that is five. Splitting a single nudged value cannot
  // produce a 12-month remainder at all.
  const a = am + FLOOR_EPS;
  const years = Math.floor(a / 12);
  const months = Math.floor(a - years * 12);
  if (months === 0) return `${years} year${years === 1 ? '' : 's'}`;
  return `${years} year${years === 1 ? '' : 's'} ${months} month${months === 1 ? '' : 's'}`;
}

// P3-4 (S10, 2026-10-10): ages floor, they never round up. A dose given two
// weeks before a birthday must not display as if it were given ON it —
// PneumoVax prints an age immediately beside a threshold claim about that
// birthday (A-P0-1's 65-year rule), so rounding up reads as the patient having
// crossed a line they had not.
//
// The epsilon is load-bearing: an age that IS exactly five years can arrive
// from the arithmetic as 59.9999999, and flooring that bare would print
// "4 years". 1e-6 of a month is about 2.6 seconds — far finer than a day, far
// coarser than floating-point noise.
export const FLOOR_EPS = 1e-6;
export function floorAge(n) {
  return Math.floor(n + FLOOR_EPS);
}

/** Format ISO date (YYYY-MM-DD) → "Jul 3, 2026". */
export function fmtDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[m - 1]} ${d}, ${y}`;
}

/** Derive age group label from ageMonths.
 *
 * FIX L1: the old boundary `am < 120` for "Child" excluded ages 120–131mo
 * (the 10th year) which should still be "Child". A 10-year-old is 120–131.9mo.
 * Fixed to `am < 132` so "Child (2–10y)" covers the full 2–10y range inclusive.
 * StepAge chips are aligned to the same boundary (see AGE_GROUP_CHIPS).
 */
export function ageGroup(am) {
  if (am == null) return null;
  if (am < 24) return 'Infant (<2y)';
  if (am < 132) return 'Child (2–10y)';
  if (am < 228) return 'Adolescent (11–18y)';
  if (am < 600) return 'Adult (19–49y)';
  return 'Older adult (≥50y)';
}

/** Compute ageMonths from a DOB ISO string and a reference date (defaults today).
 *
 * P3-2/P3-1 (S10, 2026-10-10): this divided elapsed milliseconds by an averaged
 * 30.4375 days per month, so a birthday-to-birthday span did not land on a
 * whole number — a child on their 2nd birthday measured 25.00205 months from a
 * month earlier, and a dose on that birthday was graded "below the 2-year
 * minimum age for PPSV23". Counting real calendar months instead makes an
 * anniversary exact. See dateUtils.calendarMonthsBetween.
 */
export function dobToAgeMonths(dobISO, refISO) {
  if (!dobISO) return null;
  const ref = refISO || todayISO();
  if (dobISO > ref) return null;   // a date of birth in the future is not an age
  return calendarMonthsBetween(dobISO, ref);
}
