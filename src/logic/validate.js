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
import { productByKey, PCV_MIN_AGE_M } from '../data/brands.js';

const Y18_MONTHS = 216;

// Age in months at a past dose, from date + current age + today. null if no date.
function ageAtDoseFromDate(dose, ageMonths, today) {
  if (!dose?.date) return null;
  return ageMonths - daysBetween(dose.date, today) / 30.4375;
}

function fmtAgeM(m) {
  if (m == null) return '?';
  if (m < 0.5) return 'birth';
  if (m < 24) {
    const mo = Math.round(m);
    return `${mo} month${mo === 1 ? '' : 's'}`;
  }
  const y = Math.floor(m / 12);
  const rem = Math.round(m % 12);
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
// 'noncounting' — recorded, acknowledged, but excluded from the series (PCV7).
function noncounting(reasons = []) { return { status: 'noncounting', reasons }; }

// ── Validate one PCV dose ────────────────────────────────────────────────
function validateOnePCV(dose, ageMonths, today) {
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

  const ageAtDose = ageAtDoseFromDate(dose, ageMonths, today);
  if (ageAtDose !== null && ageAtDose < minAgeM) {
    return invalid(
      [`Given at ~${fmtAgeM(ageAtDose)} — below the ${fmtMinAge(minAgeM)} minimum age for ${prod?.label || key || 'this product'}.`],
      `Age at administration: ~${fmtAgeM(ageAtDose)}. Minimum: ${fmtMinAge(minAgeM)}.`
    );
  }

  return key ? valid() : unknown(['Product not recorded — counted as a generic PCV dose.']);
}

// ── Validate one PPSV23 dose ─────────────────────────────────────────────
function validateOnePPSV23(dose, ageMonths, today) {
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
  const ageAtDose = ageAtDoseFromDate(dose, ageMonths, today);
  if (ageAtDose !== null && ageAtDose < minAgeM) {
    return invalid(
      [`Given at ~${fmtAgeM(ageAtDose)} — below the 2-year minimum age for PPSV23.`],
      `Age at administration: ~${fmtAgeM(ageAtDose)}. Minimum: 2 years.`
    );
  }
  return valid();
}

// ── Core walk ────────────────────────────────────────────────────────────
function runWalk(vaccine, rawDoses, ageMonths, today) {
  const kept = [];
  const perDose = [];
  let effectiveCount = 0;

  for (let i = 0; i < rawDoses.length; i++) {
    const dose = rawDoses[i];
    const result = vaccine === 'PCV'
      ? validateOnePCV(dose, ageMonths, today)
      : validateOnePPSV23(dose, ageMonths, today);

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
 */
export function analyzeHistory(vaccine, doses, ageMonths, today) {
  const ref = today || new Date().toISOString().slice(0, 10);
  const filtered = (doses ?? []).filter(Boolean);
  if (filtered.length === 0) return { perDose: [], effective: [] };
  return runWalk(vaccine, filtered, ageMonths, ref);
}

export function validateHistory(vaccine, doses, ageMonths, today) {
  return analyzeHistory(vaccine, doses, ageMonths, today).perDose;
}
