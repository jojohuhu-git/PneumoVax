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

import { daysBetween, todayISO } from './dateUtils.js';
import { ageAtDoseMonths } from './patientAge.js';
import { floorAge, FLOOR_EPS } from './format.js';
import { productByKey, productLabel, PCV_MIN_AGE_M, PCV_MIN_AGE_DAYS } from '../data/brands.js';
// S14-7: only the MINIMUM-AGE helpers are imported here. Every minimum
// INTERVAL — and every decision about whether a gap can void a dose — lives in
// doseIntervalRules.js, reached through the single call below. If you find
// yourself importing an interval constant into this file, the rule you are
// adding belongs in that table instead. `doseIntervalRules.test.js` has a
// drift guard that fails if one appears here.
import { ageMeetsMinimum, ageMeetsMinimumDays } from './intervals.js';
import { PCV21_MIN_AGE_M, ADULT_SCHED_MIN_M } from './scheduleConstants.js';
import { evaluateDoseInterval } from './doseIntervalRules.js';

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

// ── Recorded-dose interval checks ────────────────────────────────────────
//
// S14-7 (2026-10-11): the five age-gated functions that used to live here —
// `checkPcvInterval`, `checkPpsvAfterPcv`, `checkPpsvRevaccInterval`,
// `adultPcvGapAdvice`, `adultPpsvGapAdvice` — are GONE. Each one decided
// whether a timing rule may void a dose from the patient's AGE, and three
// adult gaps fell in the hole between the paediatric half (everything can
// void) and the adult half (nothing can), so nothing checked them at all.
//
// Every rule now lives in ONE table, `logic/doseIntervalRules.js`, where
// "which schedule states this" (`rulebook`) and "may it void a dose"
// (`enforcement`) are two separate fields. Read that file's header before
// changing any interval; it carries the sources and the owner determination.
//
// Nothing below asks the patient's age in order to decide whether a rule
// bites. If you are about to add such a test, add a table row instead.

// A valid result that carries a timing note. DELIBERATELY a flag on a valid
// result and not a status of its own: `status` stays 'valid' and the dose
// still gets its `effectiveDoseNum`, so nothing downstream that counts doses
// can mistake it for a dropped one.
//
// S14-3 (owner decision 2026-10-11): named `earlyAdvisory`, not `offWindow`.
// "Off-window" is reserved for MeningoVax's sense of the word — a dose that
// does NOT count and is owed a repeat (doseChipLabel.js, S14-6) — and this
// dose is the opposite of that: it counts.
function advise(result, reason, ruleId) {
  return {
    ...result,
    earlyAdvisory: true,
    intervalRuleId: ruleId,
    reasons: [...(result.reasons ?? []), reason],
  };
}

// Judge one dose's timing against the table, and turn the answer into the
// shape the walk already speaks: an invalid() result, an advisory applied to
// the caller's result, or the result untouched.
function applyIntervalRules(result, ctx) {
  const verdict = evaluateDoseInterval(ctx);
  if (!verdict) return result;
  if (verdict.kind === 'floor') {
    const r = invalid(verdict.reasons, verdict.detail);
    r.intervalRuleId = verdict.ruleId;
    r.earliestValidDate = verdict.earliestValidDate;
    return r;
  }
  return advise(result, verdict.reason, verdict.ruleId);
}

// ── Validate one PCV dose ────────────────────────────────────────────────
function validateOnePCV(dose, ageMonths, today, dob, prev, ctxParts) {
  const key = dose.product || '';
  const prod = productByKey(key); // null when unknown

  // PCV7 — never counts (ACIP / immunize.org). Recorded, acknowledged, excluded.
  if (prod && prod.key === 'PCV7') {
    return noncounting([
      'PCV7 (Prevnar 7) is not counted toward the pneumococcal series. Per ACIP/immunize.org, PCV7 doses are ignored when determining current pneumococcal needs — treat the patient as if PCV-naïve for these doses.',
    ]);
  }

  // PCV21 is licensed from 18y (the PRODUCT gate — PCV21_MIN_AGE_M, NOT the
  // 19y schedule boundary; see scheduleConstants.js). Below it → invalid.
  //
  // S10-N1 (folded into S14-7, 2026-10-11): this used to read the patient's
  // age TODAY in both the test and the sentence. The test is harmless either
  // way — current age is an upper bound on age at administration, so it can
  // never clear a dose the generic minimum-age check below would reject (that
  // check already uses the age at the dose). The SENTENCE was wrong: a
  // 10-year-old whose PCV21 is dated at age 9 was told "the patient is
  // currently ~10 years", sending a clinician to check the wrong field. When a
  // date puts a real age on the dose, say that age.
  if (prod && prod.key === 'PCV21' && ageMonths < Y18_MONTHS) {
    const atDose = dose.date ? ageAtDoseFromDate(dose, ageMonths, today, dob) : null;
    if (atDose != null && atDose >= 0) {
      return invalid(
        [`PCV21 (Capvaxive) is licensed for adults ≥18 years only. This dose was given at ~${fmtAgeM(atDose)} — it does not count.`],
        `Age at administration: ~${fmtAgeM(atDose)}. PCV21 minimum age: 18 years.`
      );
    }
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

  // Age is settled; now the dose's timing, against the one rule table.
  const result = key ? valid() : unknown(['Product not recorded — counted as a generic PCV dose.']);
  return applyIntervalRules(result, {
    vaccine: 'PCV',
    product: key,
    doseDate: dose.date,
    ageAtDose,
    prev,
    priorPcv: (ctxParts.priorPcv ?? []).filter((d) => d.date && d.date <= dose.date),
    priorPpsv23: (ctxParts.priorPpsv23 ?? []).filter((d) => d.date && d.date <= dose.date),
    riskIds: ctxParts.riskIds ?? [],
  });
}

// ── Validate one PPSV23 dose ─────────────────────────────────────────────
function validateOnePPSV23(dose, ageMonths, today, dob, prev, ctxParts) {
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
  // Age is settled; now the dose's timing, against the one rule table. Rule
  // ORDER decides which message a dose that breaks two rules gets — the table
  // is sorted most-specific-first for exactly that reason (a PPSV23 given at
  // the same visit as a PCV15 is the error the clinician most needs named,
  // even when a 5-year gap also fails).
  return applyIntervalRules(valid(), {
    vaccine: 'PPSV23',
    product: dose.product || 'PPSV23',
    doseDate: dose.date,
    ageAtDose,
    prev,
    priorPcv: (ctxParts.priorPcv ?? []).filter((d) => d.date && d.date <= dose.date),
    priorPpsv23: (ctxParts.priorPpsv23 ?? []).filter((d) => d.date && d.date <= dose.date),
    riskIds: ctxParts.riskIds ?? [],
  });
}

// ── Core walk ────────────────────────────────────────────────────────────
//
// One stream's running state. Held in an object rather than in closure
// variables so that two streams can be advanced dose by dose in a single
// chronological pass — see walkBothStreams (ANCHOR-1).
function freshStreamState() {
  return {
    kept: [],          // this stream's COUNTING doses, in order
    perDose: [],       // the verdict on each dose, chronological
    effectiveCount: 0, // how many have counted so far
    // The previous DATED dose in THIS stream, which anchors the same-stream
    // interval rows. Undated doses count but can never anchor a gap. An
    // invalid dose DOES anchor — CDC: "The repeat dose should be spaced after
    // the invalid dose by the recommended minimum interval." PCV7 does not:
    // it is a properly given dose of a superseded product rather than a
    // mistimed one, and no source states an interval from it.
    prev: null,
  };
}

// Judge ONE dose and fold the verdict into `st`.
//
// `otherKept` is what the cross-stream rows measure from: the other stream's
// COUNTING doses. `st.kept` supplies this stream's own, which is what CDC's
// prior-vaccine rows are composed from (a PCV7 or a voided dose is not
// "previously received PCV13"). Both lists are narrowed to doses dated on or
// before the judged dose inside validateOnePCV / validateOnePPSV23.
//
// ANCHOR-1 (owner decision 2026-10-11) — `otherKept` is COUNTING doses in
// BOTH directions. It used to be counting one way and raw the other: the
// PPSV23 stream received `pcvAnalysis.effective` because the PCV walk ran
// first, while the PCV stream received the raw PPSV23 list, whose verdicts did
// not exist yet. So a PPSV23 that did not count could still void a later PCV
// dose. Two adult rows measure a conjugate dose from a PPSV23
// (`ADULT-PCV-AFTER-PPSV23`, `ADULT-PCV20-21-5Y-AFTER-PPSV23`), and both
// anchored on the raw list, which is how a 70-year-old's PCV20 was rejected
// for sitting too close to a PPSV23 that had itself been rejected. The owner's
// words: that dose "is rejected not because it is too soon but because it was
// unnecessary", and an unnecessary dose cannot reset a clock.
function stepStream(vaccine, dose, st, otherKept, ageMonths, today, dob, riskIds) {
  const anchorOn = (d) => {
    if (d.date) {
      st.prev = {
        date: d.date,
        ageAtDose: ageAtDoseFromDate(d, ageMonths, today, dob),
        product: d.product || '',
      };
    }
  };
  const crossStream = (otherKept ?? []).filter((d) => d && d.date);
  const perDose = st.perDose;

  // One dose, so every branch below RETURNS where the old per-stream loop
  // used `continue`.
  {
    const kept = st.kept;
    const prev = st.prev;
    const ctxParts = vaccine === 'PCV'
      ? { priorPcv: kept, priorPpsv23: crossStream, riskIds }
      : { priorPcv: crossStream, priorPpsv23: kept, riskIds };
    const result = vaccine === 'PCV'
      ? validateOnePCV(dose, ageMonths, today, dob, prev, ctxParts)
      : validateOnePPSV23(dose, ageMonths, today, dob, prev, ctxParts);

    if (result.status === 'invalid') {
      // W1 (owner-approved wording, 2026-10-11): a dose rejected only for
      // TIMING (`intervalRuleId` — it came from doseIntervalRules.js) was
      // never missing, so "repeat this dose" is wrong advice for it — there
      // is nothing to repeat, the next dose is simply due once the interval
      // has elapsed. Every other invalid reason (below minimum age, wrong
      // product for age, dated before birth) IS a missing dose, and keeps
      // the repeat sentence, which is correct for those.
      const closingSentence = result.intervalRuleId
        ? `This dose does not count toward the series — given too soon after the dose it is measured from. It is not repeated; the next dose in this series is due on or after ${result.earliestValidDate}.`
        : 'This dose does not count toward the series — repeat this dose only (do not restart the series).';
      perDose.push({
        ...result,
        effectiveDoseNum: null,
        doesNotCount: true,
        reasons: [...result.reasons, closingSentence],
      });
      anchorOn(dose);
      return;
    }
    if (result.status === 'noncounting') {
      // PCV7 — recorded but not added to the effective list.
      perDose.push({ ...result, effectiveDoseNum: null, doesNotCount: true });
      return;
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
      const { earlyAdvisory, intervalRuleId, reasons: resultReasons, ...rest } = result;
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
      return;
    }

    st.effectiveCount++;
    perDose.push({ ...result, effectiveDoseNum: st.effectiveCount });
    kept.push(dose);
    anchorOn(dose);
  }
}

// ── One stream, the other stream's verdicts already settled ──────────────
//
// The standalone path, kept for callers that analyse a single stream and hand
// over the other one themselves (`analyzeHistory`). Whatever is handed in is
// taken at face value as the other stream's COUNTING doses — which is what
// `analyzeHistory`'s own contract says it is.
function runWalk(vaccine, rawDoses, ageMonths, today, dob, otherStream, riskIds) {
  const st = freshStreamState();
  for (const dose of rawDoses) {
    stepStream(vaccine, dose, st, otherStream, ageMonths, today, dob, riskIds);
  }
  return { perDose: st.perDose, effective: st.kept };
}

// ── Both streams, one chronological pass (ANCHOR-1) ──────────────────────
//
// WHY ONE PASS AND NOT TWO WALKS.
//
// Each stream needs the other stream's COUNTING doses, which reads like a
// circular dependency: PCV validity would depend on PPSV23 validity and vice
// versa. It is not circular, because every interval rule measures a gap from a
// dose given EARLIER. Walk both streams together in date order and the
// dependency always points backwards: by the time a dose is judged, every
// dose that could possibly anchor it — in either stream — already has its
// verdict. No iteration, no fixed point to converge on.
//
// TIES: a PCV and a PPSV23 on the SAME DAY. The PCV is judged first, so a
// same-visit PPSV23 still sees the PCV15 it was given alongside — the
// co-administration error a clinician most needs named, and the one S14-7's
// rule table is ordered around. The consequence runs the other way too: a PCV
// dose is no longer judged against a PPSV23 given at the same visit. That
// follows from the same decision — a dose cannot be made invalid by a dose
// that was not given before it — and it is the narrower, more honest reading:
// of a same-day PCV15 + PPSV23 pair, the PPSV23 is the dose that was early,
// and it is now the only one set aside.
function walkBothStreams({ pcvDoses, ppsv23Doses, ageMonths, today, dob, riskIds }) {
  const pcv = freshStreamState();
  const ppsv23 = freshStreamState();
  const queue = [
    ...pcvDoses.map((dose) => ({ dose, vaccine: 'PCV' })),
    ...ppsv23Doses.map((dose) => ({ dose, vaccine: 'PPSV23' })),
  ];
  // Undated doses first — they count but can never anchor a gap, and an
  // undated historical dose is assumed to be the earlier one (the same
  // convention summarizePcv uses). Then by date; on a tie, PCV before PPSV23.
  // `sort` is stable, so each stream's own order survives untouched.
  queue.sort((a, b) => {
    const da = a.dose?.date || '';
    const db = b.dose?.date || '';
    if (da !== db) {
      if (!da) return -1;
      if (!db) return 1;
      return da < db ? -1 : 1;
    }
    if (a.vaccine === b.vaccine) return 0;
    return a.vaccine === 'PCV' ? -1 : 1;
  });

  for (const { dose, vaccine } of queue) {
    const self = vaccine === 'PCV' ? pcv : ppsv23;
    const other = vaccine === 'PCV' ? ppsv23 : pcv;
    stepStream(vaccine, dose, self, other.kept, ageMonths, today, dob, riskIds);
  }

  return {
    pcv: { perDose: pcv.perDose, effective: pcv.kept },
    ppsv23: { perDose: ppsv23.perDose, effective: ppsv23.kept },
  };
}

/**
 * analyzeHistory(vaccine, doses, ageMonths, today)
 * @param {'PCV'|'PPSV23'} vaccine
 * @param {Array<{date?:string, product?:string}>} doses
 * @param {number} ageMonths
 * @param {string} [today]
 * @param {string} [dob]  patient's date of birth, when one was entered (P3-1)
 * @param {object} [opts]
 * @param {Array<{date?:string, product?:string}>} [opts.pcvDoses]
 *   When validating PPSV23: the PCV doses that COUNTED. PPSV23's floors are
 *   measured against them (peds audit P1-4). The two streams are analysed by
 *   separate calls that otherwise never see each other, so the PCV analysis
 *   has to run first and hand its kept doses in.
 * @param {Array<{date?:string}>} [opts.ppsv23Doses]
 *   When validating PCV: the PPSV23 doses (S14-7). The adult rows that measure
 *   a conjugate dose from a PPSV23 — the 1-year "previously received only
 *   PPSV23" floor and the 5-year PCV13+PPSV23 floor — need them, and before
 *   S14-7 the PCV walk could not see the PPSV23 stream at all, which is one
 *   reason those two gaps went unchecked.
 * @param {string[]} [opts.riskIds]
 *   Needed because risk class decides WHICH floor an adult PPSV23 after a
 *   PCV15 is judged against: the 8-week minimum CDC names for an
 *   immunocompromising condition, cochlear implant or CSF leak, or the year.
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
  // The OTHER stream's doses, which the cross-stream rule rows measure from.
  const otherStream = sortDosesChronologically(
    ((vaccine === 'PPSV23' ? opts.pcvDoses : opts.ppsv23Doses) ?? []).filter(Boolean)
  );
  return runWalk(vaccine, filtered, ageMonths, ref, dob, otherStream, opts.riskIds);
}

/**
 * analyzeBoth — both pneumococcal streams, judged together (ANCHOR-1).
 *
 * The engine's entry point. Use this rather than two `analyzeHistory` calls:
 * it is the only path on which a gap is measured from a dose that COUNTED in
 * BOTH directions. Two separate calls can only ever get that right one way
 * round, because the second call needs the first call's verdicts and the first
 * call needs the second's. See walkBothStreams for why one chronological pass
 * removes the circularity instead of iterating on it.
 *
 * @param {object} input
 * @param {Array<{date?:string, product?:string}>} input.pcvDoses
 * @param {Array<{date?:string, product?:string}>} input.ppsv23Doses
 * @param {number} input.ageMonths
 * @param {string} [input.today]
 * @param {string} [input.dob]
 * @param {string[]} [input.riskIds]
 *   Risk class decides WHICH floor an adult's PPSV23 after a PCV15 is judged
 *   against — the 8-week minimum CDC names for an immunocompromising
 *   condition, cochlear implant or CSF leak, or the year. One call now, so the
 *   two streams cannot be handed different risk lists.
 * @returns {{pcv: {perDose: Array, effective: Array}, ppsv23: {perDose: Array, effective: Array}}}
 */
export function analyzeBoth({ pcvDoses, ppsv23Doses, ageMonths, today, dob, riskIds }) {
  const ref = todayISO(today);
  return walkBothStreams({
    pcvDoses: sortDosesChronologically((pcvDoses ?? []).filter(Boolean)),
    ppsv23Doses: sortDosesChronologically((ppsv23Doses ?? []).filter(Boolean)),
    ageMonths,
    today: ref,
    dob,
    riskIds: riskIds ?? [],
  });
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
