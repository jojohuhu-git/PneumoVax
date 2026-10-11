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

import { daysBetween, todayISO, calendarIntervalElapsed } from './dateUtils.js';
import { adultPpsvShorterMinimumApplies, ADULT_PPSV23_INTERVAL_MONTHS } from '../data/riskFactors.js';
import { ageAtDoseMonths } from './patientAge.js';
import { floorAge, FLOOR_EPS } from './format.js';
import { productByKey, productLabel, PCV_MIN_AGE_M, PCV_MIN_AGE_DAYS } from '../data/brands.js';
import {
  ageMeetsMinimum,
  ageMeetsMinimumDays,
  intervalMeetsMinimum,
  calendarIntervalMeetsMinimum,
  pcvSeriesMinIntervalDays,
  PCV_PPSV23_MIN_INTERVAL_DAYS,
  PPSV23_REVACC_MIN_MONTHS,
  ADULT_ADVISED_PCV_GAP_MONTHS,
} from './intervals.js';
import { PCV21_MIN_AGE_M, ADULT_SCHED_MIN_M } from './scheduleConstants.js';

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

// Minimums read back to a clinician the way the source states them: "4 weeks
// (28 days)", not "28 days".
function fmtDays(days) {
  if (days % 7 === 0) {
    const w = days / 7;
    return `${w} week${w === 1 ? '' : 's'} (${days} days)`;
  }
  return `${days} days`;
}

function fmtDayCount(days) {
  return `${days} day${days === 1 ? '' : 's'}`;
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

// P6-3 (S13, 2026-10-10): a verdict that sets a recorded dose aside can carry
// the sentence it rests on, shown the same way as on the cards — a numbered
// superscript linking to that exact sentence, with the quote on hover.
// `reasonCites` is ONE ordered list of cite() objects per literal "[c]" across
// the whole `reasons` array, in order; RecCard slices it per reason by marker
// count, so reasons appended later that carry no marker never disturb the
// pairing. Omitted entirely when a verdict cites nothing, which is most of
// them today — the wiring is P6-3c's job.
function withCites(result, reasonCites) {
  if (reasonCites && reasonCites.length) result.reasonCites = reasonCites;
  return result;
}
function valid(reasons = [], reasonCites) { return withCites({ status: 'valid', reasons }, reasonCites); }
function unknown(reasons = [], reasonCites) { return withCites({ status: 'unknown', reasons }, reasonCites); }
function invalid(reasons, detail, reasonCites) {
  const r = { status: 'invalid', reasons };
  if (detail != null) r.detail = detail;
  return withCites(r, reasonCites);
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
function noncounting(reasons = [], reasonCites) { return withCites({ status: 'noncounting', reasons }, reasonCites); }

// ── Recorded-dose interval checks (queue P1-0) ───────────────────────────
//
// The gap between two doses already on the record. Until S3 nothing looked
// backwards at all: a PCV series recorded at 2, 2.5, 3 and 3.5 months was
// graded "On time" four times and counted as a complete 4-dose series, because
// `runWalk` graded each dose in isolation and `recommend.js`'s dueState only
// ever looks forward. Sources and the exact quotes are in intervals.js and in
// __tests__/regression-p1-0-recorded-dose-intervals.test.js.
//
// `prev` is the previous DATED dose that anchors the gap. CDC decides what that
// means: "The repeat dose should be spaced after the invalid dose by the
// recommended minimum interval." So a dose that did not count because it was
// given too early still holds the clock — the dose replacing it is measured
// from it, not from the last dose that counted. A series recorded at 2, 2.5, 3
// and 3.5 months therefore keeps only its first dose, which is the answer CDC's
// sentence gives. The one exception is PCV7: it is a properly given dose of a
// superseded product rather than a mistimed one, and no source states an
// interval from it, so it anchors nothing.
//
// Returns an invalid() result, or null when the dose is fine or unjudgeable.
function checkPcvInterval(dose, prev, ageAtDose) {
  if (!prev || !dose.date || !prev.date) return null;
  // Doses given under the ADULT rulebook carry no interval verdict. CDC's adult
  // notes state their gaps as recommendations for the next dose ("1 dose PCV20
  // or 1 dose PCV21 at least 1 year after the last PCV13 dose") and never as a
  // minimum interval, nor that a shorter gap stops a dose counting. Calling one
  // invalid would claim more than the source does. ADULT_SCHED_MIN_M, not the
  // PCV21 product gate — this is a question of which rulebook applies.
  if (ageAtDose != null && ageAtDose >= ADULT_SCHED_MIN_M) return null;

  const minDays = pcvSeriesMinIntervalDays(prev.ageAtDose);
  const gap = daysBetween(prev.date, dose.date);
  if (intervalMeetsMinimum(gap, minDays)) return null;

  const band = prev.ageAtDose != null && prev.ageAtDose < 12
    ? 'before 12 months of age'
    : 'at 12 months of age or older';
  return invalid(
    [`Given ${fmtDayCount(gap)} after the previous dose — the minimum interval is ${fmtDays(minDays)} when the earlier dose was given ${band}.`],
    `Gap: ${fmtDayCount(gap)} since the dose of ${prev.date}. Minimum: ${fmtDays(minDays)} (doses up to 4 days early still count, per CDC).`
  );
}

// PPSV23 against the PCV doses that come before it (peds audit P1-4).
//
// CDC's CHILD notes state both halves of this, and state them as minimums:
//   "administer 1 dose PCV20 or 1 dose PPSV23 at least 8 weeks after the most
//    recent PCV dose" (9 times, across both risk groups and both age rows)
//   "PCV15 and PPSV23 should not be administered during the same visit."
// Same-visit is the 0-week case of that minimum, named separately because it is
// the mistake a clinician is most likely to have actually made.
//
// PAEDIATRIC ONLY, and that is a source fact, not a simplification. The adult
// notes were searched live on 2026-10-11 with "pneumococcal" (13 hits) as a
// positive control that the whole page had loaded: they contain no "same
// visit" sentence, no "8 weeks after the most recent PCV", and no "8 weeks
// after the PCV15 dose". The adult gap is stated as a RECOMMENDATION of ≥1
// year, with 8 weeks offered as a minimum that may be *considered* for an
// immunocompromising condition, cochlear implant or CSF leak (CLAUDE.md,
// A-P1-1). Voiding an adult's recorded dose for missing 8 weeks would invent a
// floor the source does not state — and A-P1-1 exists precisely because the app
// used to substitute that minimum for the recommendation.
function checkPpsvAfterPcv(dose, priorPcv, ageAtDose) {
  if (!dose.date || !priorPcv || priorPcv.length === 0) return null;
  if (ageAtDose != null && ageAtDose >= ADULT_SCHED_MIN_M) return null;
  const before = priorPcv.filter((d) => d.date && d.date <= dose.date);
  if (before.length === 0) return null;
  const mostRecent = before[before.length - 1];
  const gap = daysBetween(mostRecent.date, dose.date);
  if (intervalMeetsMinimum(gap, PCV_PPSV23_MIN_INTERVAL_DAYS)) return null;

  if (gap === 0) {
    return invalid(
      ['Given on the same day as a PCV dose — PCV15 and PPSV23 should not be given at the same visit, and PPSV23 is given at least 8 weeks (56 days) after a PCV dose.'],
      'Gap: same day. Minimum: 8 weeks (56 days) after the PCV dose.'
    );
  }
  return invalid(
    [`Given ${fmtDayCount(gap)} after the most recent PCV dose — PPSV23 is given at least ${fmtDays(PCV_PPSV23_MIN_INTERVAL_DAYS)} after a PCV dose.`],
    `Gap: ${fmtDayCount(gap)}. Minimum: ${fmtDays(PCV_PPSV23_MIN_INTERVAL_DAYS)} (doses up to 4 days early still count, per CDC).`
  );
}

// A second PPSV23 goes at least 5 CALENDAR years after the first.
//
// Paediatric, for the same reason as the rule above: "If PPSV23 is used,
// administer either PCV20 or dose 2 PPSV23 at least 5 years after dose 1
// PPSV23" is in the CHILD notes, and no adult row recommends a second PPSV23
// at all. The app matches that — the only place it offers a 2nd PPSV23 is
// pcvRiskChild — so this is the only place it should judge one.
function checkPpsvRevaccInterval(dose, prev, ageAtDose) {
  if (!prev || !dose.date || !prev.date) return null;
  if (ageAtDose != null && ageAtDose >= ADULT_SCHED_MIN_M) return null;
  if (calendarIntervalMeetsMinimum(prev.date, PPSV23_REVACC_MIN_MONTHS, dose.date)) return null;
  return invalid(
    ['Given less than 5 years after the previous PPSV23 dose — a second PPSV23 is given at least 5 years after the first.'],
    `Previous PPSV23: ${prev.date}. Minimum: 5 years later (doses up to 4 days early still count, per CDC).`
  );
}

// ── The adult advisory: counts, but earlier than CDC advises (S3-N1) ─────
//
// Adult gaps are the mirror image of the paediatric ones. CDC states them as
// recommendations for the NEXT dose and never as minimum intervals, so a short
// adult gap cannot make a dose invalid (that is why checkPcvInterval and
// checkPpsvAfterPcv both stop at the adult boundary).
//
// So this is a third thing — the dose COUNTS and carries a note. It is
// deliberately a FLAG on a valid result and not a status of its own: `status`
// stays 'valid' and the dose still gets its `effectiveDoseNum`, so nothing
// downstream that counts doses can mistake it for a dropped one.
//
// S14-3 (owner decision 2026-10-11): this flag is named `earlyAdvisory`, not
// `offWindow`. "Off-window" is reserved for MeningoVax's sense of the word —
// a dose that does NOT count and is owed a repeat (see doseChipLabel.js,
// S14-6) — and this dose is the opposite of that: it counts. The old name
// invited exactly the confusion S14-RC's root-cause review found.
//
// No 4-day grace here, deliberately. The grace is CDC's rule for whether a
// dose that missed a minimum still COUNTS. This is not a minimum and nothing is
// being voided, so there is no grace to apply and a day short of the year is a
// day short.
function advise(result, reason) {
  return { ...result, earlyAdvisory: true, reasons: [...(result.reasons ?? []), reason] };
}

// Two adult PCV doses: CDC advises at least a year.
function adultPcvGapAdvice(dose, prev, ageAtDose) {
  if (!prev || !dose.date || !prev.date) return null;
  if (ageAtDose == null || ageAtDose < ADULT_SCHED_MIN_M) return null;
  if (calendarIntervalElapsed(prev.date, ADULT_ADVISED_PCV_GAP_MONTHS, dose.date)) return null;
  return 'Given less than a year after the previous dose. For adults CDC advises at least 1 year between pneumococcal conjugate doses. This dose still counts — no repeat is needed.';
}

// An adult's PPSV23 after a PCV15: CDC advises a year, and names 8 weeks as a
// minimum that may be CONSIDERED for an immunocompromising condition, cochlear
// implant or CSF leak (CLAUDE.md, A-P1-1). So for those patients a gap over 8
// weeks is a legitimate choice and must not be second-guessed; a gap under 8
// weeks is short of even that option.
function adultPpsvGapAdvice(dose, priorPcv, ageAtDose, riskIds) {
  if (!dose.date || !priorPcv || priorPcv.length === 0) return null;
  if (ageAtDose == null || ageAtDose < ADULT_SCHED_MIN_M) return null;
  const before = priorPcv.filter((d) => d.date && d.date <= dose.date && d.product === 'PCV15');
  if (before.length === 0) return null;
  const mostRecent = before[before.length - 1];

  if (adultPpsvShorterMinimumApplies(riskIds)) {
    if (intervalMeetsMinimum(daysBetween(mostRecent.date, dose.date), PCV_PPSV23_MIN_INTERVAL_DAYS)) return null;
    return 'Given less than 8 weeks after the PCV15 dose. CDC advises PPSV23 at least 1 year after PCV15, and for this patient the 8-week minimum may be considered — this gap is shorter than either. The dose still counts.';
  }
  if (calendarIntervalElapsed(mostRecent.date, ADULT_PPSV23_INTERVAL_MONTHS, dose.date)) return null;
  return 'Given less than a year after the PCV15 dose. CDC advises PPSV23 at least 1 year after PCV15 for adults. This dose still counts — no repeat is needed.';
}

// ── Validate one PCV dose ────────────────────────────────────────────────
function validateOnePCV(dose, ageMonths, today, dob, prev) {
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

  // Age is settled; now the gap to the previous counted dose (queue P1-0).
  const tooSoon = checkPcvInterval(dose, prev, ageAtDose);
  if (tooSoon) return tooSoon;

  const result = key ? valid() : unknown(['Product not recorded — counted as a generic PCV dose.']);
  const advice = adultPcvGapAdvice(dose, prev, ageAtDose);
  return advice ? advise(result, advice) : result;
}

// ── Validate one PPSV23 dose ─────────────────────────────────────────────
function validateOnePPSV23(dose, ageMonths, today, dob, prev, priorPcv, riskIds) {
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
  // Age is settled; now the two interval rules (queue P1-0, peds audit P1-4).
  // The PCV gap is checked first: a PPSV23 given at the same visit as PCV15 is
  // the error the clinician most needs named, even if the 5-year gap also fails.
  const failed = checkPpsvAfterPcv(dose, priorPcv, ageAtDose)
    || checkPpsvRevaccInterval(dose, prev, ageAtDose);
  if (failed) return failed;

  const advice = adultPpsvGapAdvice(dose, priorPcv, ageAtDose, riskIds);
  return advice ? advise(valid(), advice) : valid();
}

// ── Core walk ────────────────────────────────────────────────────────────
function runWalk(vaccine, rawDoses, ageMonths, today, dob, priorPcv, riskIds) {
  const kept = [];
  const perDose = [];
  let effectiveCount = 0;
  // The previous DATED dose, which anchors the interval checks (queue P1-0).
  // Undated doses count but can never anchor a gap. An invalid dose DOES
  // anchor — see checkPcvInterval for CDC's sentence on repeat doses. PCV7
  // does not.
  let prev = null;
  const anchorOn = (dose) => {
    if (dose.date) {
      prev = { date: dose.date, ageAtDose: ageAtDoseFromDate(dose, ageMonths, today, dob) };
    }
  };

  for (let i = 0; i < rawDoses.length; i++) {
    const dose = rawDoses[i];
    const result = vaccine === 'PCV'
      ? validateOnePCV(dose, ageMonths, today, dob, prev)
      : validateOnePPSV23(dose, ageMonths, today, dob, prev, priorPcv, riskIds);

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
      anchorOn(dose);
      continue;
    }
    if (result.status === 'noncounting') {
      // PCV7 — recorded but not added to the effective list.
      perDose.push({ ...result, effectiveDoseNum: null, doesNotCount: true });
      continue;
    }

    // S14-4: an ADULT PCV dose recorded after the series was already complete
    // BY PRODUCT (history already includes a PCV20 or PCV21) is an extra
    // dose, not a mistimed one — see brands.js `completesSeries`. Until this
    // existed, `adultPcvGapAdvice` graded such a dose purely on the gap since
    // the previous one, so a PCV21 given five weeks after a completing PCV20
    // read "given less than a year after the previous dose ... still counts"
    // when no further PCV was ever recommended. Root cause: S14-RC handoff.
    //
    // ADULTS ONLY. `completesSeries` on a product means "no PPSV23 follow-up
    // needed" — for a CHILD it does not mean "no more PCV doses of any kind":
    // a PCV20 given as infant dose 2 of 4 still leaves the 12–15mo booster
    // due, and an at-risk child's PCV20 only completes the series alongside
    // other conditions pcvRiskChild checks (age band, catch-up count). Only
    // in the adult rulebook does "includes PCV20/PCV21" mean the series is
    // done outright (`pcvAdult`'s own "already complete by product" check).
    const ageAtDoseForExtra = dose.date
      ? ageAtDoseFromDate(dose, ageMonths, today, dob)
      : ageMonths;
    const priorCompletingDose = vaccine === 'PCV'
      && ageAtDoseForExtra != null && ageAtDoseForExtra >= ADULT_SCHED_MIN_M
      ? kept.find((d) => productByKey(d.product)?.completesSeries)
      : null;
    if (priorCompletingDose) {
      const undatedExtra = !dose.date;
      // Strip the early-advisory flag/sentence if validateOnePCV attached
      // one — "still counts" would contradict "does not extend the series".
      const { earlyAdvisory, reasons: resultReasons, ...rest } = result;
      const reasons = earlyAdvisory ? resultReasons.slice(0, -1) : resultReasons;
      perDose.push({
        ...rest,
        effectiveDoseNum: null,
        extraDose: true,
        ...(undatedExtra ? { extraDoseUnverified: true } : {}),
        reasons: undatedExtra
          ? [
            'No date recorded, so this dose cannot be placed in time.',
            'Do you mean this was an extra dose given after the series was already complete? With no date recorded, the app cannot tell whether this is a dose beyond the series or a series dose whose date is missing, so it is not counted. Adding the date settles it.',
          ]
          : [
            ...reasons,
            `Given after the series was already complete (a ${productLabel(priorCompletingDose.product)} dose already completes it): this dose does not extend the series.`,
          ],
      });
      // Validly given, with a real date — worth anchoring the next dose's gap
      // check, same as an invalid dose does.
      anchorOn(dose);
      continue;
    }

    effectiveCount++;
    perDose.push({ ...result, effectiveDoseNum: effectiveCount });
    kept.push(dose);
    anchorOn(dose);
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
 * @param {{pcvDoses?: Array<{date?:string, product?:string}>}} [opts]
 *   When validating PPSV23, the PCV doses that COUNTED — PPSV23's 8-week floor
 *   is measured against them (peds audit P1-4). The two streams are analysed by
 *   separate calls that otherwise never see each other, so the PCV analysis has
 *   to run first and hand its kept doses in.
 */
export function analyzeHistory(vaccine, doses, ageMonths, today, dob, opts = {}) {
  // P3-7: local date, not UTC's — see dateUtils.todayISO.
  const ref = todayISO(today);
  // Sort chronologically before the walk. The last-kept algorithm and the engine both
  // assume ascending order (interval anchoring, "first/last dated dose"), so doses entered
  // out of order must be re-sorted. Dated doses ascending; undated doses sort FIRST — they
  // count but are never a timing anchor, and an undated historical dose is assumed to be
  // the earlier (infant) dose, matching summarizePcv's convention.
  const filtered = sortDosesChronologically((doses ?? []).filter(Boolean));
  if (filtered.length === 0) return { perDose: [], effective: [] };
  const priorPcv = vaccine === 'PPSV23'
    ? sortDosesChronologically((opts.pcvDoses ?? []).filter(Boolean))
    : null;
  return runWalk(vaccine, filtered, ageMonths, ref, dob, priorPcv, opts.riskIds);
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
