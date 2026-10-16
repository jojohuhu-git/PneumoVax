// ─────────────────────────────────────────────────────────────────────────
// BRANDS — pneumococcal product metadata.
//
// Two vaccine TYPES (not antigen families):
//   • PCV  — conjugate (PCV7, PCV13, PCV15, PCV20, PCV21)
//   • PPSV — polysaccharide (PPSV23)
//
// Counting policy (CLINICAL_SPEC §Products):
//   • PCV7  → history only, NEVER counted (immunize.org). counts:false
//   • PCV13 → history only (phased out of new series) but COUNTS as prior PCV
//   • PCV15 → counts; requiresPPSV23:true (a series ending in PCV15 needs PPSV23)
//   • PCV20 → counts; completesSeries:true (no PPSV23 needed)
//   • PCV21 → adults ≥18y only; counts; completesSeries:true; lacks serotype 4
//   • PPSV23 → polysaccharide, risk-based, ≥2y
//
// `minAgeM` are ACIP-usable minimums in months. 999 = no hard upper limit.
//
// PCV21 product min age = 18y (216mo) per FDA label + ACIP mm7336a3. This is
// DISTINCT from the ADULT SCHEDULE boundary (19y / 228mo). See
// src/logic/scheduleConstants.js for the authoritative constants and the
// rationale for keeping them separate.
//
// Sources: CDC child/adult schedule notes, p2016, mm7336a3 (PCV21),
//   mm7239a5 (PCV20 peds), immunize.org PCV7 rule. See src/data/refs.js.
// ─────────────────────────────────────────────────────────────────────────

// Import PCV21 product min age constant — see scheduleConstants.js.
import { PCV21_MIN_AGE_M } from '../logic/scheduleConstants.js';
import { AVG_DAYS_PER_MONTH } from '../logic/dateUtils.js';

export { PCV21_MIN_AGE_M };

export const VAX = {
  PCV: 'PCV',
  PPSV23: 'PPSV23',
};

// ACIP minimum age for all conjugate PCVs is 6 weeks (42 days), NOT the 2-month
// routine start. Expressed in months for the validator's float-month comparison.
// (42 / AVG_DAYS_PER_MONTH ≈ 1.38mo.) Using the routine 2-month start wrongly
// rejects a dose given at the recommended 2-month visit (56–62 days < 60.9 days).
// ACIP's PCV floor is 6 weeks, and weeks are EXACT day counts ("4 weeks = 28
// days", CDC schedule notes). 42 is therefore the real number and the months
// form is the derived one — stated here once so the two can never drift (S10;
// see also the number census in docs/archive/).
export const PCV_MIN_AGE_DAYS = 42;
export const PCV_MIN_AGE_M = PCV_MIN_AGE_DAYS / AVG_DAYS_PER_MONTH;

// PCV product catalog. `key` matches the value stored in history doses.
export const PCV_PRODUCTS = [
  {
    key: 'PCV7',
    label: 'PCV7 (Prevnar 7)',
    type: 'PCV',
    valency: 7,
    counts: false,          // NEVER counts — immunize.org / CDC adult notes
    requiresPPSV23: false,
    completesSeries: false,
    minAgeM: PCV_MIN_AGE_M,  // ACIP 6 weeks
    minAgeDays: PCV_MIN_AGE_DAYS,  // the floor as CDC states it: exact days
    maxAgeM: 999,
    historyOnly: true,
    childOk: true,
    adultOk: true,
    active: false,          // record-only; never recommended
  },
  {
    key: 'PCV13',
    label: 'PCV13 (Prevnar 13)',
    type: 'PCV',
    valency: 13,
    counts: true,           // counts as prior PCV
    requiresPPSV23: false,  // alone does NOT complete; residual dose handled by matrix
    completesSeries: false,
    minAgeM: PCV_MIN_AGE_M,  // ACIP 6 weeks
    minAgeDays: PCV_MIN_AGE_DAYS,  // the floor as CDC states it: exact days
    maxAgeM: 999,
    historyOnly: true,      // phased out of new series; record-only
    childOk: true,
    adultOk: true,
    active: false,          // record-only; never recommended for new series
  },
  {
    key: 'PCV15',
    label: 'PCV15 (Vaxneuvance)',
    type: 'PCV',
    valency: 15,
    counts: true,
    requiresPPSV23: true,   // a series ending in PCV15 needs a PPSV23 follow-up
    completesSeries: false,
    minAgeM: PCV_MIN_AGE_M,  // ACIP 6 weeks (was 2mo routine start — rejected valid 2mo doses)
    minAgeDays: PCV_MIN_AGE_DAYS,  // the floor as CDC states it: exact days
    maxAgeM: 999,
    historyOnly: false,
    childOk: true,
    adultOk: true,
    active: true,
  },
  {
    key: 'PCV20',
    label: 'PCV20 (Prevnar 20)',
    type: 'PCV',
    valency: 20,
    counts: true,
    requiresPPSV23: false,
    completesSeries: true,  // a series including PCV20 = complete (no PPSV23)
    minAgeM: PCV_MIN_AGE_M,  // ACIP 6 weeks
    minAgeDays: PCV_MIN_AGE_DAYS,  // the floor as CDC states it: exact days
    maxAgeM: 999,
    historyOnly: false,
    childOk: true,
    adultOk: true,
    active: true,
  },
  {
    key: 'PCV21',
    label: 'PCV21 (Capvaxive)',
    type: 'PCV',
    valency: 21,
    counts: true,
    requiresPPSV23: false,
    completesSeries: true,
    minAgeM: PCV21_MIN_AGE_M,  // 216 (≥18y) — FDA label + ACIP mm7336a3; schedule boundary is 228 (19y)
    maxAgeM: 999,
    historyOnly: false,
    childOk: false,         // not licensed/recommended for children
    adultOk: true,
    active: true,
    lacksSerotype4: true,   // geographic advisory note
  },
];

export const PPSV23_PRODUCT = {
  key: 'PPSV23',
  label: 'PPSV23 (Pneumovax 23)',
  type: 'PPSV23',
  valency: 23,
  counts: true,
  minAgeM: 24,              // ≥2 years
  maxAgeM: 999,
  historyOnly: false,
  childOk: true,
  adultOk: true,
  active: true,
};

export const ALL_PRODUCTS = [...PCV_PRODUCTS, PPSV23_PRODUCT];

// Lookup a product entry by its stored history key.
export function productByKey(key) {
  if (!key) return null;
  return ALL_PRODUCTS.find((p) => p.key === key) || null;
}

// Display-friendly brand label for a key (falls back to the raw key).
export function productLabel(key) {
  return productByKey(key)?.label || key || 'Unknown product';
}

// Min age (months) for a product key; null when unknown.
export function productMinAgeM(key) {
  return productByKey(key)?.minAgeM ?? null;
}

// History-entry option lists (include "Unknown" sentinel for record entry).
//
// ── Every PCV, at every age, with no gate ────────────────────────────────
//
// PCV21-OFFLABEL (owner decision, 2026-10-15). `pcvHistoryProductsFor(ageMonths)`
// used to live here and removed PCV21 from this list whenever the patient was
// under 18 today. It is GONE, parameter and all — not loosened, not widened.
//
// Why there is no gate, and must not be one again:
//
//   A Capvaxive dose given off-label to a 17-year-old is a thing that really
//   happened. Hiding the product does not prevent it; it only prevents the
//   clinician from telling us about it, and the dose then vanishes from the
//   record with no warning and no flag. Every OTHER PCV carries a 6-week
//   `minAgeM` and has never been gated, for exactly this reason: the app's job
//   is to record what happened and then grade it.
//
//   The grading is where the licence age belongs, and it was already there.
//   `validate.js` reads the product's own `minAgeM` (PCV21's is
//   `PCV21_MIN_AGE_M`, 18y) and returns "licensed for adults ≥18 years only…
//   it does not count", with CDC's 4-day grace. That verdict did not change
//   with this decision — it simply became reachable from both screens.
//
//   Sources for not counting it: FDA approval for ages ≥18 (MMWR mm7336a3)
//   and CDC General Best Practices, "Doses of any vaccine administered ≥5 days
//   earlier than the minimum interval or age should not be counted as valid
//   doses and should be repeated as age appropriate."
//
// Guarded by `regression-pcv21-offlabel-recordable.test.jsx`, which asserts
// this list is IDENTICAL at every age from 2 months to 65 years on both dose
// editors — so a gate keyed on any number, in any file, fails there.
export const PCV_HISTORY_PRODUCTS = [
  ...PCV_PRODUCTS,
  { key: '', label: 'Unknown PCV product' },
];

export const PPSV23_HISTORY_PRODUCTS = [PPSV23_PRODUCT];

// Recommendation-facing brand option strings ----------------------------
// Engine emits these as `brands` arrays. PCV21 only when adult.
export function pcvRecBrands({ adult, includePCV21 = true } = {}) {
  const out = ['PCV20 (Prevnar 20)', 'PCV15 (Vaxneuvance)'];
  if (adult && includePCV21) out.push('PCV21 (Capvaxive)');
  return out;
}
