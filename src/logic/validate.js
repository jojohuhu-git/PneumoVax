// ─────────────────────────────────────────────────────────────────────────
// validate.js — dose-history validation / effective-dose counting for PneumoVax.
//
// Pure functions. Pneumococcal history is two product streams:
//   • PCV  doses   (PCV7/PCV13/PCV15/PCV20/PCV21)
//   • PPSV23 doses
//
// analyzeHistory(vaccine, doses, ageMonths, today)
//   → { perDose: [...], effective: [...] }
//
//   perDose — parallel to input; each { status, effectiveDoseNum, reasons[],
//             detail?, doesNotCount? } for display.
//   effective — the kept doses the recommendation engine counts.
//
// Counting policy (CLINICAL_SPEC §Products, §K):
//   • PCV7 → does NOT count (dropped from the effective list with an explanation).
//     This is not an "error"; it is the ACIP/immunize.org rule. Marked status
//     'unknown'-style 'noncounting' so the UI shows "recorded, does not count".
//   • PCV13/PCV15/PCV20 (+ PCV21 adults) → count.
//   • PCV21 recorded for a child (<19y) → INVALID (not licensed for children).
//   • A dose given below the product's min age → INVALID (dropped).
//     Dateless doses use current age as an upper bound on age-at-administration
//     (a past dose can't have been given later than today), mirroring MeningoVax.
//   • Unknown product, dated, plausible age → counts as a generic PCV (unknown).
//   • PPSV23 below 24 months → INVALID.
//
// "effective" PCV list contains only COUNTING PCV doses (PCV7 excluded). The
// engine reads effective.length and the product mix (requiresPPSV23 /
// completesSeries) to drive the matrix.
// ─────────────────────────────────────────────────────────────────────────

import { daysBetween } from './dateUtils.js';
import { ageAtDoseMonths } from './patientAge.js';
import { floorAge, FLOOR_EPS } from './format.js';
import { productByKey, PCV_MIN_AGE_M, PCV_MIN_AGE_DAYS } from '../data/brands.js';
import { ageMeetsMinimum, ageMeetsMinimumDays } from './intervals.js';
import { PCV21_MIN_AGE_M } from './scheduleConstants.js';

// PCV21 product gate is 18y (216mo) — the PRODUCT minimum age per mm7336a3.
// This is intentionally distinct from the ADULT_SCHED_MIN_M (228mo / 19y);
// see scheduleConstants.js for the reasoning.
const Y18_MONTHS = PCV21_MIN_AGE_M;  // 216 — PCV21 product age, NOT schedule boundary

// Age in months at a past dose. null if the dose has no date.
//
// P3-3 (S10, 2026-10-10): this was `ageMonths - daysBetween(dose.date, today) /
// 30.4375` — two spans measured on different rulers (the patient's own
// anniversaries, and the dose date's), subtracted from one another. A child
// dosed exactly on their 2nd birthday read as 23.98 months and was told the
// dose was "below the 2-year minimum age for PPSV23", i.e. that 24 months is
// below 24 months (peds audit P1-1). With a date of birth on file the answer is
// measured straight from the birthday; without one the subtraction remains, now
// in calendar months. `dob` is optional so existing callers keep working.
export function ageAtDoseFromDate(dose, ageMonths, today, dob) {
  return ageAtDoseMonths(dose, { dob, ageMonths }, today);
}

// P3-4 (S10): floors, never rounds up — the validator states an age in the
// same breath as the minimum it is being judged against, so an age rounded up
// onto a threshold makes the verdict read as a contradiction.
function fmtAgeM(m) {
  if (m == null) return '?';
  if (m < 0) return 'before birth';   // P3-6 — never mistakable for a newborn
  if (m < 0.5) return 'birth';
  if (m < 24) {
    const mo = floorAge(m);
    return `${mo} month${mo === 1 ? '' : 's'}`;
  }
  const a = m + FLOOR_EPS;   // one nudge, then split — see format.fmtAgeMonths
  const y = Math.floor(a / 12);
  const rem = Math.floor(a - y * 12);
  return rem === 0 ? `${y} year${y === 1 ? '' : 's'}` : `${y}y ${rem}m`;
}

function fmtMinAge(minAgeM) {
  if (minAgeM >= 12) {
    const y = minAgeM / 12;
    return `${y} year${y === 1 ? '' : 's'}`;
  }
  // Sub-2-month minimums (e.g. the 6-week PCV floor) read better in weeks.
  if (minAgeM < 2) {
    const w = Math.round((minAgeM * 30.4375) / 7);
    return `${w} week${w === 1 ? '' : 's'}`;
  }
  return `${minAgeM} month${minAgeM === 1 ? '' : 's'}`;
}

function valid(reasons = []) { return { status: 'valid', reasons }; }
function unknown(reasons = []) { return { status: 'unknown', reasons }; }
function invalid(reasons, detail) {
  const r = { status: 'invalid', reasons };
  if (detail != null) r.detail = detail;
  return r;
}
// P3-6: a dose dated before the patient was born is not an under-age dose, it
// is an impossible one — almost always a mistyped year on the dose or the date
// of birth. Saying "below the minimum age" sends the clinician looking for the
// wrong mistake, so this names the real one.
function beforeBirth(dose, label) {
  return invalid(
    [`Dated ${dose.date}, which is before the patient was born — this dose cannot be correct. Check the date on the dose and the date of birth. It does not count.`],
    `${label || 'This dose'} is dated before the recorded date of birth.`
  );
}

// 'noncounting' — recorded, acknowledged, but excluded from the series (PCV7).
function noncounting(reasons = []) { return { status: 'noncounting', reasons }; }

// ── Validate one PCV dose ────────────────────────────────────────────────
function validateOnePCV(dose, ageMonths, today, dob) {
  const key = dose.product || '';
  const prod = productByKey(key); // null when unknown

  // PCV7 — never counts (ACIP / immunize.org). Recorded, acknowledged, excluded.
  if (prod && prod.key === 'PCV7') {
    return noncounting([
      'PCV7 (Prevnar 7) is not counted toward the pneumococcal series. Per ACIP/immunize.org, PCV7 doses are ignored when determining current pneumococcal needs — treat the patient as if PCV-naïve for these doses.',
    ]);
  }

  // PCV21 is adults-only (≥19y). A child recorded with PCV21 → invalid.
  if (prod && prod.key === 'PCV21' && ageMonths < Y18_MONTHS) {
    return invalid(
      [`PCV21 (Capvaxive) is licensed for adults ≥18 years only. The patient is currently ~${fmtAgeM(ageMonths)} — this dose does not count.`],
      `PCV21 minimum age: 18 years. Current age (upper bound on age at administration): ~${fmtAgeM(ageMonths)}.`
    );
  }

  // Min-age check.
  const minAgeM = prod?.minAgeM ?? PCV_MIN_AGE_M; // unknown product → permissive (ACIP 6wk)
  if (!dose.date) {
    // Dateless: current age is an upper bound on age at administration.
    if (ageMonths < minAgeM) {
      return invalid(
        [`Recorded without a date, but the patient is currently only ~${fmtAgeM(ageMonths)} — below the ${fmtMinAge(minAgeM)} minimum age for ${prod?.label || key || 'this product'}. A past dose cannot have been given later than today, so it could not have been given at a valid age. This dose does not count.`],
        `Current age: ~${fmtAgeM(ageMonths)}. Minimum: ${fmtMinAge(minAgeM)}.`
      );
    }
    return unknown([
      `No date recorded — cannot verify age or interval. Counted in the series (must have been given at ≥${fmtMinAge(minAgeM)} to be valid).`,
    ]);
  }

  const ageAtDose = ageAtDoseFromDate(dose, ageMonths, today, dob);
  if (ageAtDose !== null && ageAtDose < 0) return beforeBirth(dose, prod?.label || key);
  // CDC's 4-day grace (peds audit P1-1): a dose given up to 4 days before the
  // minimum age counts. PCV's floor is stated in days, so when a date of birth
  // is on file it is compared in days — exact in any month. Without one, fall
  // back to the calendar-month comparison, which also gets the grace.
  const ageAtDoseDays = dob && dose.date ? daysBetween(dob, dose.date) : null;
  const minDays = prod ? prod.minAgeDays ?? null : PCV_MIN_AGE_DAYS;
  const oldEnough = (minDays != null && ageAtDoseDays != null)
    ? ageMeetsMinimumDays(ageAtDoseDays, minDays)
    : ageMeetsMinimum(ageAtDose, minAgeM, { doseDate: dose.date, ageMonths, today, dob });
  if (!oldEnough) {
    return invalid(
      [`Given at ~${fmtAgeM(ageAtDose)} — below the ${fmtMinAge(minAgeM)} minimum age for ${prod?.label || key || 'this product'}.`],
      `Age at administration: ~${fmtAgeM(ageAtDose)}. Minimum: ${fmtMinAge(minAgeM)} (doses up to 4 days early still count, per CDC).`
    );
  }

  return key ? valid() : unknown(['Product not recorded — counted as a generic PCV dose.']);
}

// ── Validate one PPSV23 dose ─────────────────────────────────────────────
function validateOnePPSV23(dose, ageMonths, today, dob) {
  const minAgeM = 24; // ≥2 years
  if (!dose.date) {
    if (ageMonths < minAgeM) {
      return invalid(
        [`Recorded without a date, but the patient is currently only ~${fmtAgeM(ageMonths)} — below the 2-year minimum age for PPSV23. This dose does not count.`],
        `Current age: ~${fmtAgeM(ageMonths)}. Minimum: 2 years.`
      );
    }
    return unknown(['No date recorded — counted (must have been given at ≥2 years to be valid).']);
  }
  const ageAtDose = ageAtDoseFromDate(dose, ageMonths, today, dob);
  if (ageAtDose !== null && ageAtDose < 0) return beforeBirth(dose, 'PPSV23');
  // CDC's 4-day grace — PPSV23's floor is 2 CALENDAR years, so the grace is
  // applied by asking whether the dose would have cleared it 4 days later.
  if (!ageMeetsMinimum(ageAtDose, minAgeM, { doseDate: dose.date, ageMonths, today, dob })) {
    return invalid(
      [`Given at ~${fmtAgeM(ageAtDose)} — below the 2-year minimum age for PPSV23.`],
      `Age at administration: ~${fmtAgeM(ageAtDose)}. Minimum: 2 years (doses up to 4 days early still count, per CDC).`
    );
  }
  return valid();
}

// ── Core walk ────────────────────────────────────────────────────────────
function runWalk(vaccine, rawDoses, ageMonths, today, dob) {
  const kept = [];
  const perDose = [];
  let effectiveCount = 0;

  for (let i = 0; i < rawDoses.length; i++) {
    const dose = rawDoses[i];
    const result = vaccine === 'PCV'
      ? validateOnePCV(dose, ageMonths, today, dob)
      : validateOnePPSV23(dose, ageMonths, today, dob);

    if (result.status === 'invalid') {
      perDose.push({
        ...result,
        effectiveDoseNum: null,
        doesNotCount: true,
        reasons: [
          ...result.reasons,
          'This dose does not count toward the series — repeat this dose only (do not restart the series).',
        ],
      });
      continue;
    }
    if (result.status === 'noncounting') {
      // PCV7 — recorded but not added to the effective list.
      perDose.push({ ...result, effectiveDoseNum: null, doesNotCount: true });
      continue;
    }

    effectiveCount++;
    perDose.push({ ...result, effectiveDoseNum: effectiveCount });
    kept.push(dose);
  }

  return { perDose, effective: kept };
}

/**
 * analyzeHistory(vaccine, doses, ageMonths, today)
 * @param {'PCV'|'PPSV23'} vaccine
 * @param {Array<{date?:string, product?:string}>} doses
 * @param {number} ageMonths
 * @param {string} [today]
 * @param {string} [dob]  patient's date of birth, when one was entered (P3-1)
 */
export function analyzeHistory(vaccine, doses, ageMonths, today, dob) {
  const ref = today || new Date().toISOString().slice(0, 10);
  // Sort chronologically before the walk. The last-kept algorithm and the engine both
  // assume ascending order (interval anchoring, "first/last dated dose"), so doses entered
  // out of order must be re-sorted. Dated doses ascending; undated doses sort FIRST — they
  // count but are never a timing anchor, and an undated historical dose is assumed to be
  // the earlier (infant) dose, matching summarizePcv's convention.
  const filtered = sortDosesChronologically((doses ?? []).filter(Boolean));
  if (filtered.length === 0) return { perDose: [], effective: [] };
  return runWalk(vaccine, filtered, ageMonths, ref, dob);
}

// Chronological, stable sort. ISO date strings compare lexicographically. Undated doses
// sort before all dated doses, preserving their relative input order.
function sortDosesChronologically(doses) {
  return doses
    .map((d, i) => ({ d, i }))
    .sort((a, b) => {
      const da = a.d?.date || '';
      const db = b.d?.date || '';
      if (da && db) return da < db ? -1 : da > db ? 1 : a.i - b.i;
      if (!da && db) return -1; // undated sorts before dated
      if (da && !db) return 1;
      return a.i - b.i;         // both undated → stable input order
    })
    .map((x) => x.d);
}

export function validateHistory(vaccine, doses, ageMonths, today, dob) {
  return analyzeHistory(vaccine, doses, ageMonths, today, dob).perDose;
}
