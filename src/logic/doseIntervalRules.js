// ─────────────────────────────────────────────────────────────────────────
// doseIntervalRules.js — every gap-between-recorded-doses rule, as one table.
//
// WHY THIS FILE EXISTS (S14-7, root cause S14-RC, 2026-10-11).
//
// `validate.js` used to decide **whether a timing rule may void a dose from
// the patient's age, not from what the rule says.** Five functions, one axis:
//
//   checkPcvInterval        if (ageAtDose >= ADULT_SCHED_MIN_M) return null
//   checkPpsvAfterPcv       same — exempted adults
//   checkPpsvRevaccInterval same — exempted adults
//   adultPcvGapAdvice       if (ageAtDose <  ADULT_SCHED_MIN_M) return null
//   adultPpsvGapAdvice      same — exempted children
//
// Below 19 every pneumococcal gap could void a dose; at 19+ none could. Age was
// standing in for "is this rule a minimum", and three adult gaps fell in the
// hole BETWEEN the two halves, so nothing checked them at all — a 70-year-old's
// second PPSV23 two years after the first read `valid`, numbered, with an empty
// reasons array. Silent. That is the bug this table removes.
//
// Here, the two questions are two separate FIELDS on every row:
//
//   `rulebook`     which schedule states this rule (child / adult / any) —
//                  it selects WHICH interval and WHICH citation applies.
//   `enforcement`  'floor'          → a short gap voids the dose; grace applies
//                  'recommendation' → the dose counts and carries a note
//                  'none'           → explicitly never flagged, with a reason
//
// Nothing anywhere asks "is the patient an adult?" in order to decide whether a
// rule may bite. A rule bites because its own `enforcement` says so.
//
// `PPSV23-AFTER-PPSV23` is the proof: child and adult carry the SAME 5-year
// number, so the old age gate was pure loss. The two rows are kept separate
// only because their CITATIONS differ (see "Authority" below) — never the
// interval. `doseIntervalRules.test.js` asserts they read the same constant.
//
// ── Authority ────────────────────────────────────────────────────────────
//
// `authority: 'CDC'`  — the source states this gap as a MINIMUM in so many
// words, so voiding a dose below it claims no more than the source does. The
// three **paediatric** floors, and only those. The adult rows that carry 'CDC'
// are the ones that void nothing — `enforcement: 'none'` and the catch-all
// `'recommendation'` rows — where CDC really is the one speaking.
//
// ⚠️ **No adult FLOOR is CDC's.** An earlier draft of this header claimed the
// 8-week PCV15→PPSV23 gap as a CDC-stated adult floor, because "minimum
// interval" appears in the adult notes. That was wrong, and it was wrong
// because the sentence had been transcribed from a handoff file instead of read
// from the source. rr7203a1, fetched live 2026-10-11, says a minimum of 8 weeks
// "**can be considered** … to minimize the time of risk" — permission to
// vaccinate SOONER, not a bar to fall below. ACIP's recurring phrase is
// "minimum **recommended** interval", the shortest *recommended* spacing, which
// is a different concept from the General Best Practices "minimum interval"
// that carries the repeat-the-dose consequence. Corrected in S14-7b; two tests
// now hold both the rows and this paragraph to it.
//
// `authority: 'OWNER'` — ⚠️ **OWNER CLINICAL DETERMINATION, 2026-10-11. Never
// cite ACIP or CDC for these rows.** The published sources disagree, and were
// re-checked live on 2026-10-11 before the owner reaffirmed:
//
//   • CDSI v4.64 (CDC's own machine-readable rule set) carries two fields per
//     interval — `minInt` (the recommended gap) and `absMinInt` (the hard floor
//     below which a dose is invalid). Infant PCV dose 2 reads
//     `absMinInt = 4 weeks − 4 days`: a real floor, with CDC's grace built in.
//     Every ADULT pneumococcal interval reads `absMinInt = 0 days`.
//   • rr7203a1, mm7336a3 and mm7401a1 — the three current adult MMWRs — contain
//     zero hits for "should be repeated" or "does not count", and state adult
//     gaps as advice for the NEXT dose: "1 dose PCV20 or 1 dose PCV21 at least
//     1 year after the last PCV13 dose."
//   • CDC General Best Practices attaches the grace to *minimum* intervals, and
//     Table 3-2 gives adult PCV none.
//
// The owner's determination is that an interval is an interval: a dose given
// inside one was not validly given, whatever age the patient was. It is
// recorded the same way the Fred Hutch HSCT pathway is — named as
// institution/owner-specific, with the published position quoted beside it.
// See CLINICAL_SPEC.md §K.
//
// ── Adding a row ─────────────────────────────────────────────────────────
//
// Put the row in the table, most specific first, and give it all seven fields.
// Do NOT add an age test to the evaluator; express it as `rulebook`. Do NOT add
// a second rule that silently overlaps an existing one — an `enforcement:
// 'none'` row with a stated reason is how this table says "deliberately not
// flagged", so a future reader can tell a decision from an oversight.
// ─────────────────────────────────────────────────────────────────────────

import { daysBetween, calendarMonthsBetween, calendarIntervalElapsed, addDays, addCalendarMonths } from './dateUtils.js';
import {
  intervalMeetsMinimum,
  calendarIntervalMeetsMinimum,
  pcvSeriesMinIntervalDays,
  PCV_PPSV23_MIN_INTERVAL_DAYS,
  PPSV23_REVACC_MIN_MONTHS,
  ADULT_ADVISED_PCV_GAP_MONTHS,
  GRACE_DAYS,
} from './intervals.js';
import { ADULT_PPSV23_INTERVAL_MONTHS, adultPpsvShorterMinimumApplies } from '../data/riskFactors.js';
import { ADULT_SCHED_MIN_M } from './scheduleConstants.js';

// ── Plain-English gap formatting ─────────────────────────────────────────
// Minimums read back the way the source states them: "4 weeks (28 days)".
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

// An elapsed gap, for the 1-year and 5-year rows where "1,094 days" would make
// a clinician do arithmetic. Calendar months, matching how the gap is judged.
//
// FLOORS to whole months, and that matters twice over.
// `calendarMonthsBetween` returns a FRACTION — the first version of this
// printed "Given 1.1428571428571428 months after the PCV13 dose" in the
// running app, which the unit tests never saw because they matched on the
// rule's wording and not on the number. Driving the app is what caught it.
// Flooring is also the honest direction: the sentence sits beside the minimum
// the dose is being judged against, so a gap rounded UP onto the threshold
// would make the verdict read as a contradiction (the same reasoning as
// format.js's floorAge, P3-4).
function fmtGap(fromISO, toISO) {
  const months = Math.floor(calendarMonthsBetween(fromISO, toISO));
  if (months < 1) return fmtDayCount(daysBetween(fromISO, toISO));
  if (months < 24) return `${months} month${months === 1 ? '' : 's'}`;
  const y = Math.floor(months / 12);
  const rem = months - y * 12;
  return rem === 0 ? `${y} years` : `${y} years ${rem} month${rem === 1 ? '' : 's'}`;
}

// "Given <X> the previous dose" — the connecting phrase, so a same-visit pair
// reads as one. Without this the messages said "Given 0 days after the
// previous pneumococcal conjugate dose", which is both ugly and easy to
// misread as "no gap was required". Same-visit is the single most likely
// real-world co-administration error on these pairs, so it is the one phrase
// that most needs to land.
function fmtSince(fromISO, toISO) {
  return daysBetween(fromISO, toISO) === 0
    ? 'on the same day as'
    : `${fmtGap(fromISO, toISO)} after`;
}

// The day-count twin, for the rows whose minimum is stated in weeks.
function fmtSinceDays(fromISO, toISO) {
  const d = daysBetween(fromISO, toISO);
  return d === 0 ? 'on the same day as' : `${fmtDayCount(d)} after`;
}

// ── Anchors: what a gap is measured FROM ─────────────────────────────────
//
// `prevSameStream` is the previous DATED dose in this vaccine's own stream,
// INCLUDING one that did not count. CDC decides that: "The repeat dose should
// be spaced after the invalid dose by the recommended minimum interval." PCV7
// anchors nothing — a properly given dose of a superseded product, not a
// mistimed one, and no source states an interval from it. validate.js's walk
// owns both of those facts; this file just reads the anchor it is handed.
//
// The cross-stream anchors read the COUNTING doses of the other stream.
const ANCHORS = {
  prevSameStream: (ctx) => ctx.prev,
  lastPcv: (ctx) => lastOf(ctx.priorPcv),
  lastPcv13: (ctx) => lastOf(ctx.priorPcv.filter((d) => d.product === 'PCV13')),
  lastPcv15: (ctx) => lastOf(ctx.priorPcv.filter((d) => d.product === 'PCV15')),
  lastPpsv23: (ctx) => lastOf(ctx.priorPpsv23),
};

function lastOf(list) {
  return list && list.length ? list[list.length - 1] : null;
}

// ── The table ────────────────────────────────────────────────────────────
//
// Fields, every row:
//   id            stable identifier, used in tests and in the dose's `ruleId`
//   what          plain English: which dose this row judges, and against what
//   rulebook      'child' | 'adult' | 'any' — which schedule states it
//   vaccine       'PCV' | 'PPSV23' — the stream the judged dose is in
//   products      which products this row judges (null = any in that stream)
//   from          key into ANCHORS: what the gap is measured from
//   needsPriorPcv / needsNoPriorPcv / needsPriorPpsv23 / needsNoPriorPpsv23
//                 history conditions, by PRODUCT KEY, on the COUNTING doses
//                 recorded before the judged dose. This is how CDC's
//                 prior-vaccine rows are selected — never from risk class,
//                 which is the recommendation engine's job, not the
//                 validator's.
//   shorterMinimum  true  → only when the 8-week option applies to this adult
//                   false → only when it does not
//                   undefined → regardless
//   interval      { days } | { months } | { daysFrom: fn(anchor) }
//   grace         does CDC's 4-day grace apply? (floors: yes. recommendations:
//                 no — the grace governs whether a dose that missed a MINIMUM
//                 still counts, and a recommendation voids nothing.)
//   enforcement   'floor' | 'recommendation' | 'none'
//   authority     'CDC' | 'OWNER'  (see the header)
//   source        the sentence the row rests on
//   message       (ctx, anchor) → { reasons: [...], detail } for a floor,
//                 or a single string for a recommendation
export const DOSE_INTERVAL_RULES = [
  // ── Paediatric floors — every one stated as a minimum by CDC ──────────
  {
    id: 'CHILD-PCV-AFTER-PCV',
    what: 'A PCV dose given after an earlier PCV dose, under the child schedule',
    rulebook: 'child',
    vaccine: 'PCV',
    products: null,
    from: 'prevSameStream',
    interval: { daysFrom: (anchor) => pcvSeriesMinIntervalDays(anchor.ageAtDose) },
    grace: true,
    enforcement: 'floor',
    authority: 'CDC',
    source: 'CDC Catch-up Immunization Schedule, Table 2, column "Minimum Interval Between Doses": '
      + '"4 weeks if first dose was administered before the 1st birthday / 8 weeks (as final dose '
      + 'for healthy children) if first dose was administered at the 1st birthday or after". '
      + 'immunize.org p2016 Table 1 footnote keys it the same way.',
    message: (ctx, anchor) => {
      const minDays = pcvSeriesMinIntervalDays(anchor.ageAtDose);
      const gap = daysBetween(anchor.date, ctx.doseDate);
      const band = anchor.ageAtDose != null && anchor.ageAtDose < 12
        ? 'before 12 months of age'
        : 'at 12 months of age or older';
      return {
        reasons: [`Given ${fmtDayCount(gap)} after the previous dose — the minimum interval is ${fmtDays(minDays)} when the earlier dose was given ${band}.`],
        detail: `Gap: ${fmtDayCount(gap)} since the dose of ${anchor.date}. Minimum: ${fmtDays(minDays)} (doses up to 4 days early still count, per CDC).`,
      };
    },
  },
  {
    id: 'CHILD-PPSV23-AFTER-PCV',
    what: 'A PPSV23 dose given after a PCV dose, under the child schedule',
    rulebook: 'child',
    vaccine: 'PPSV23',
    products: null,
    from: 'lastPcv',
    interval: { days: PCV_PPSV23_MIN_INTERVAL_DAYS },
    grace: true,
    enforcement: 'floor',
    authority: 'CDC',
    source: 'CDC Child & Adolescent Schedule Notes, pneumococcal: "administer 1 dose PCV20 or 1 dose '
      + 'PPSV23 at least 8 weeks after the most recent PCV dose" (9 times, across both risk groups '
      + 'and both age rows), and "PCV15 and PPSV23 should not be administered during the same visit."',
    message: (ctx, anchor) => {
      const gap = daysBetween(anchor.date, ctx.doseDate);
      // Same-visit is the 0-day case of the same minimum, named separately
      // because it is the mistake a clinician is most likely to have made.
      if (gap === 0) {
        return {
          reasons: ['Given on the same day as a PCV dose — PCV15 and PPSV23 should not be given at the same visit, and PPSV23 is given at least 8 weeks (56 days) after a PCV dose.'],
          detail: 'Gap: same day. Minimum: 8 weeks (56 days) after the PCV dose.',
        };
      }
      return {
        reasons: [`Given ${fmtDayCount(gap)} after the most recent PCV dose — PPSV23 is given at least ${fmtDays(PCV_PPSV23_MIN_INTERVAL_DAYS)} after a PCV dose.`],
        detail: `Gap: ${fmtDayCount(gap)}. Minimum: ${fmtDays(PCV_PPSV23_MIN_INTERVAL_DAYS)} (doses up to 4 days early still count, per CDC).`,
      };
    },
  },
  {
    id: 'CHILD-PPSV23-AFTER-PPSV23',
    what: 'A second PPSV23 dose, under the child schedule',
    rulebook: 'child',
    vaccine: 'PPSV23',
    products: null,
    from: 'prevSameStream',
    interval: { months: PPSV23_REVACC_MIN_MONTHS },
    grace: true,
    enforcement: 'floor',
    authority: 'CDC',
    source: 'CDC Child & Adolescent Schedule Notes, pneumococcal, immunocompromising conditions: '
      + '"If PPSV23 is used, administer either PCV20 or dose 2 PPSV23 at least 5 years after dose 1 PPSV23."',
    message: (ctx, anchor) => ({
      reasons: ['Given less than 5 years after the previous PPSV23 dose — a second PPSV23 is given at least 5 years after the first.'],
      detail: `Previous PPSV23: ${anchor.date}. Minimum: 5 years later (doses up to 4 days early still count, per CDC).`,
    }),
  },

  // ── Adult floors ─────────────────────────────────────────────────────
  //
  // Ordered most specific first: a 70-year-old with PCV13 + PPSV23 whose PCV20
  // misses BOTH the 5-year gap from the PPSV23 and the 1-year gap from the
  // PCV13 should be told about the 5-year one, which is the binding rule for
  // the CDC row they are actually on.
  {
    id: 'ADULT-PCV20-21-5Y-AFTER-PPSV23',
    what: 'PCV20/PCV21 for an adult whose history already has BOTH PCV13 and PPSV23 — 5 years from the PPSV23',
    rulebook: 'adult',
    vaccine: 'PCV',
    products: ['PCV20', 'PCV21'],
    from: 'lastPpsv23',
    needsPriorPcv: ['PCV13'],
    needsPriorPpsv23: true,
    interval: { months: PPSV23_REVACC_MIN_MONTHS },
    grace: true,
    enforcement: 'floor',
    authority: 'OWNER',
    source: 'OWNER CLINICAL DETERMINATION 2026-10-11 — not ACIP, not CDC. CDC states the gap as advice '
      + 'for the next dose: "1 dose PCV20 or 1 dose PCV21 at least 5 years after the last pneumococcal '
      + 'vaccine dose", and CDSI v4.64 sets absMinInt = 0 days for it. The owner determined that a dose '
      + 'given inside the interval was not validly given. See CLINICAL_SPEC.md §K.',
    message: (ctx, anchor) => ({
      reasons: [`Given ${fmtSince(anchor.date, ctx.doseDate)} the PPSV23 dose of ${anchor.date}. With both PCV13 and PPSV23 already on the record, this dose is given at least 5 years after the most recent pneumococcal dose.`],
      detail: `Previous PPSV23: ${anchor.date}. Minimum: 5 years later (doses up to 4 days early still count, per CDC). This 5-year gap is enforced as a minimum by an owner clinical determination dated 2026-10-11, not by ACIP — see CLINICAL_SPEC.md §K.`,
    }),
  },
  {
    id: 'ADULT-PCV20-21-1Y-AFTER-PCV',
    what: 'PCV20/PCV21 for an adult whose history already has BOTH PCV13 and PPSV23 — 1 year from the last PCV',
    rulebook: 'adult',
    vaccine: 'PCV',
    products: ['PCV20', 'PCV21'],
    from: 'lastPcv',
    needsPriorPcv: ['PCV13'],
    needsPriorPpsv23: true,
    interval: { months: ADULT_ADVISED_PCV_GAP_MONTHS },
    grace: true,
    enforcement: 'floor',
    authority: 'OWNER',
    source: 'OWNER CLINICAL DETERMINATION 2026-10-11 — not ACIP, not CDC. The second leg of the row '
      + 'above: both the 5-year gap from the PPSV23 and the 1-year gap from the last PCV must hold.',
    message: (ctx, anchor) => ({
      reasons: [`Given ${fmtSince(anchor.date, ctx.doseDate)} the previous pneumococcal conjugate dose of ${anchor.date} — at least 1 year is required between conjugate doses.`],
      detail: `Previous PCV: ${anchor.date}. Minimum: 1 year later (doses up to 4 days early still count, per CDC). Enforced as a minimum by an owner clinical determination dated 2026-10-11, not by ACIP — see CLINICAL_SPEC.md §K.`,
    }),
  },
  {
    id: 'ADULT-PCV20-21-AFTER-PCV13',
    what: 'PCV20/PCV21 for an adult whose history has PCV13 and no PPSV23 — 1 year from the PCV13',
    rulebook: 'adult',
    vaccine: 'PCV',
    products: ['PCV20', 'PCV21'],
    from: 'lastPcv13',
    needsPriorPcv: ['PCV13'],
    needsNoPriorPpsv23: true,
    interval: { months: ADULT_ADVISED_PCV_GAP_MONTHS },
    grace: true,
    enforcement: 'floor',
    authority: 'OWNER',
    source: 'OWNER CLINICAL DETERMINATION 2026-10-11 (decision 5) — not ACIP, not CDC. CDC states: '
      + '"Previously received only PCV13: 1 dose PCV20 or 1 dose PCV21 at least 1 year after the last '
      + 'PCV13 dose" — advice for the next dose, with CDSI v4.64 absMinInt = 0 days. The owner '
      + 'determined that a PCV20/PCV21 given inside that year does not count and must be repeated, '
      + 'with the 4-day grace. See CLINICAL_SPEC.md §K.',
    message: (ctx, anchor) => ({
      reasons: [`Given ${fmtSince(anchor.date, ctx.doseDate)} the PCV13 dose of ${anchor.date} — PCV20 or PCV21 is given at least 1 year after the last PCV13 dose.`],
      detail: `Previous PCV13: ${anchor.date}. Minimum: 1 year later (doses up to 4 days early still count, per CDC). Enforced as a minimum by an owner clinical determination dated 2026-10-11, not by ACIP — see CLINICAL_SPEC.md §K.`,
    }),
  },
  {
    id: 'ADULT-PCV-AFTER-PPSV23',
    what: 'An adult PCV dose when PPSV23 is the only thing on the record — 1 year from the PPSV23',
    rulebook: 'adult',
    vaccine: 'PCV',
    products: ['PCV15', 'PCV20', 'PCV21'],
    from: 'lastPpsv23',
    needsNoPriorPcv: true,
    needsPriorPpsv23: true,
    interval: { months: ADULT_ADVISED_PCV_GAP_MONTHS },
    grace: true,
    enforcement: 'floor',
    authority: 'OWNER',
    source: 'OWNER CLINICAL DETERMINATION 2026-10-11 — not ACIP, not CDC. CDC states, for an adult who '
      + 'previously received only PPSV23: give PCV15, PCV20 or PCV21 at least 1 year after the PPSV23 '
      + 'dose — advice for the next dose, with CDSI v4.64 absMinInt = 0 days. See CLINICAL_SPEC.md §K.',
    message: (ctx, anchor) => ({
      reasons: [`Given ${fmtSince(anchor.date, ctx.doseDate)} the PPSV23 dose of ${anchor.date} — a conjugate dose is given at least 1 year after PPSV23.`],
      detail: `Previous PPSV23: ${anchor.date}. Minimum: 1 year later (doses up to 4 days early still count, per CDC). Enforced as a minimum by an owner clinical determination dated 2026-10-11, not by ACIP — see CLINICAL_SPEC.md §K.`,
    }),
  },
  {
    id: 'ADULT-PPSV23-AFTER-PCV15-SHORTER-MINIMUM',
    what: 'An adult PPSV23 after PCV15, where the 8-week minimum may be considered (immunocompromising condition, cochlear implant, CSF leak)',
    rulebook: 'adult',
    vaccine: 'PPSV23',
    products: null,
    from: 'lastPcv15',
    shorterMinimum: true,
    interval: { days: PCV_PPSV23_MIN_INTERVAL_DAYS },
    grace: true,
    enforcement: 'floor',
    authority: 'OWNER',
    source: 'OWNER CLINICAL DETERMINATION 2026-10-11 — not ACIP, not CDC. ⚠️ CORRECTED 2026-10-11 after '
      + 'reading rr7203a1 live: this row was first labelled CDC authority on the grounds that the adult '
      + 'notes call 8 weeks a "minimum interval". The full sentence points the other way — rr7203a1 '
      + 'says "A minimum interval of 8 weeks CAN BE CONSIDERED for adults with an immunocompromising '
      + 'condition, a CSF leak, or a cochlear implant TO MINIMIZE THE TIME OF RISK for IPD caused by '
      + 'serotypes unique to PPSV23". It is permission to vaccinate SOONER, not a bar to fall below. '
      + 'rr7203a1 says "should be repeated" 0 times and "not be counted" 0 times (positive control: '
      + '"interval", 64 hits). So the 8 weeks is the shortest RECOMMENDED gap for these patients, and '
      + 'treating it as a floor is the owner\'s determination, like every other adult floor.',
    message: (ctx, anchor) => ({
      reasons: [`Given ${fmtSinceDays(anchor.date, ctx.doseDate)} the PCV15 dose of ${anchor.date} — for this patient the shortest interval CDC permits is ${fmtDays(PCV_PPSV23_MIN_INTERVAL_DAYS)}, and the recommended interval is 1 year.`],
      detail: `Previous PCV15: ${anchor.date}. Minimum: ${fmtDays(PCV_PPSV23_MIN_INTERVAL_DAYS)} — the shortest interval ACIP recommends for an immunocompromising condition, cochlear implant or CSF leak (doses up to 4 days early still count, per CDC). The recommended interval is 1 year. Enforced as a minimum by an owner clinical determination dated 2026-10-11, not by ACIP — see CLINICAL_SPEC.md §K.`,
    }),
  },
  {
    id: 'ADULT-PPSV23-AFTER-PCV15',
    what: 'An adult PPSV23 after PCV15, where the 8-week option does not apply — 1 year from the PCV15',
    rulebook: 'adult',
    vaccine: 'PPSV23',
    products: null,
    from: 'lastPcv15',
    shorterMinimum: false,
    interval: { months: ADULT_PPSV23_INTERVAL_MONTHS },
    grace: true,
    enforcement: 'floor',
    authority: 'OWNER',
    source: 'OWNER CLINICAL DETERMINATION 2026-10-11 — not ACIP, not CDC. CDC states "at least 1 year '
      + 'after the PCV15 dose" and names NO minimum for an adult without an immunocompromising '
      + 'condition, cochlear implant or CSF leak. The owner determined the year is the floor for them. '
      + 'A-P1-1 is untouched: ≥1 year remains what the app RECOMMENDS at every adult age, and the '
      + '8-week option is still named rather than substituted. See CLINICAL_SPEC.md §K.',
    message: (ctx, anchor) => ({
      reasons: [`Given ${fmtSince(anchor.date, ctx.doseDate)} the PCV15 dose of ${anchor.date} — PPSV23 is given at least 1 year after PCV15.`],
      detail: `Previous PCV15: ${anchor.date}. Minimum: 1 year later (doses up to 4 days early still count, per CDC). The 8-week minimum interval applies only to an adult with an immunocompromising condition, cochlear implant or CSF leak. Enforced as a minimum by an owner clinical determination dated 2026-10-11, not by ACIP — see CLINICAL_SPEC.md §K.`,
    }),
  },
  // PPSV23 after PCV13 — the pair rr7203a1 spells out, added 2026-10-11 after
  // the owner reviewed it. Two floors, exactly as that MMWR keys the gap:
  //
  //   "When PPSV23 is used instead of PCV20, the minimum recommended interval
  //    between PCV13 and PPSV23 administration is >=8 weeks for adults with an
  //    immunocompromising condition, a CSF leak, or a cochlear implant and
  //    >=1 year for adults without these conditions."
  //
  // Same two-tier shape as the PCV15 rows above, and for the same reason: the
  // interval a dose is judged against is the one that applied to THAT patient.
  // ⚠️ rr7203a1 states these as RECOMMENDED intervals and nowhere says a dose
  // given sooner stops counting — treating them as floors is the owner's
  // determination, like every other adult floor here.
  //
  // `anchorMustBeProduct` keeps this on CDC's actual row. "Previously received
  // PCV13" stops describing a patient once a PCV15 is also on the record, and
  // the PCV15 rows above then govern.
  {
    id: 'ADULT-PPSV23-AFTER-PCV13-SHORTER-MINIMUM',
    what: 'An adult PPSV23 after PCV13, for an immunocompromising condition, cochlear implant or CSF leak — 8 weeks',
    rulebook: 'adult',
    vaccine: 'PPSV23',
    products: null,
    from: 'lastPcv',
    anchorMustBeProduct: 'PCV13',
    shorterMinimum: true,
    interval: { days: PCV_PPSV23_MIN_INTERVAL_DAYS },
    grace: true,
    enforcement: 'floor',
    authority: 'OWNER',
    source: 'OWNER CLINICAL DETERMINATION 2026-10-11 — not ACIP, not CDC. The INTERVAL is rr7203a1\'s, '
      + 'verified live 2026-10-11: "the minimum recommended interval between PCV13 and PPSV23 '
      + 'administration is >=8 weeks for adults with an immunocompromising condition, a CSF leak, or a '
      + 'cochlear implant and >=1 year for adults without these conditions." Treating it as a validity '
      + 'floor is the owner\'s: rr7203a1 says "should be repeated" 0 times and "not be counted" 0 '
      + 'times, and CDSI v4.64 gives every adult pneumococcal interval absMinInt = 0 days.',
    message: (ctx, anchor) => ({
      reasons: [`Given ${fmtSinceDays(anchor.date, ctx.doseDate)} the PCV13 dose of ${anchor.date} — for this patient PPSV23 is given at least ${fmtDays(PCV_PPSV23_MIN_INTERVAL_DAYS)} after PCV13.`],
      detail: `Previous PCV13: ${anchor.date}. Minimum: ${fmtDays(PCV_PPSV23_MIN_INTERVAL_DAYS)} — the interval ACIP recommends for an immunocompromising condition, cochlear implant or CSF leak (doses up to 4 days early still count, per CDC). Enforced as a minimum by an owner clinical determination dated 2026-10-11, not by ACIP — see CLINICAL_SPEC.md §K.`,
    }),
  },
  {
    id: 'ADULT-PPSV23-AFTER-PCV13',
    what: 'An adult PPSV23 after PCV13, for any other adult — 1 year',
    rulebook: 'adult',
    vaccine: 'PPSV23',
    products: null,
    from: 'lastPcv',
    anchorMustBeProduct: 'PCV13',
    shorterMinimum: false,
    interval: { months: ADULT_PPSV23_INTERVAL_MONTHS },
    grace: true,
    enforcement: 'floor',
    authority: 'OWNER',
    source: 'OWNER CLINICAL DETERMINATION 2026-10-11 — not ACIP, not CDC. Same rr7203a1 sentence as the '
      + 'row above, other half: ">=1 year for adults without these conditions". Treating it as a '
      + 'validity floor is the owner\'s determination.',
    message: (ctx, anchor) => ({
      reasons: [`Given ${fmtSince(anchor.date, ctx.doseDate)} the PCV13 dose of ${anchor.date} — PPSV23 is given at least 1 year after PCV13.`],
      detail: `Previous PCV13: ${anchor.date}. Minimum: 1 year later (doses up to 4 days early still count, per CDC). The 8-week interval applies only to an adult with an immunocompromising condition, cochlear implant or CSF leak. Enforced as a minimum by an owner clinical determination dated 2026-10-11, not by ACIP — see CLINICAL_SPEC.md §K.`,
    }),
  },
  {
    id: 'ADULT-PPSV23-AFTER-PPSV23',
    what: 'A second adult PPSV23 dose',
    rulebook: 'adult',
    vaccine: 'PPSV23',
    products: null,
    from: 'prevSameStream',
    // SAME CONSTANT as CHILD-PPSV23-AFTER-PPSV23, deliberately. The two rows
    // exist separately only because their citations differ; the number has no
    // age term, and the old age gate on it is what made a 70-year-old's
    // second PPSV23 two years after the first read valid and SILENT.
    interval: { months: PPSV23_REVACC_MIN_MONTHS },
    grace: true,
    enforcement: 'floor',
    authority: 'OWNER',
    source: 'OWNER CLINICAL DETERMINATION 2026-10-11 — not ACIP, not CDC. The adult notes recommend a '
      + 'second PPSV23 at 5 years for an immunocompromised adult 19–64 (rr7203a1, which excludes '
      + 'cochlear implant and CSF leak from that row) and at ≥65 when an earlier PPSV23 was given '
      + 'before 65 — stated as advice, with CDSI v4.64 absMinInt = 0 days. The interval is enforced on '
      + 'the DOSE PAIR, not on the risk row: whether a second PPSV23 was indicated at all is the '
      + 'recommendation engine\'s question, and keying the floor on risk class is what left this gap '
      + 'unchecked for adults in the first place. See CLINICAL_SPEC.md §K.',
    message: (ctx, anchor) => ({
      reasons: [`Given ${fmtSince(anchor.date, ctx.doseDate)} the previous PPSV23 dose of ${anchor.date} — a second PPSV23 is given at least 5 years after the first.`],
      detail: `Previous PPSV23: ${anchor.date}. Minimum: 5 years later (doses up to 4 days early still count, per CDC). Enforced as a minimum by an owner clinical determination dated 2026-10-11, not by ACIP — see CLINICAL_SPEC.md §K.`,
    }),
  },

  // ── Explicitly never flagged ─────────────────────────────────────────
  //
  // These rows void nothing and say nothing. They exist so that a future
  // reader can tell a DECISION from an oversight — and so the catch-all
  // recommendation below cannot quietly reach a pair a source says nothing
  // about. An `enforcement: 'none'` row that matches stops the walk.
  {
    id: 'ADULT-PCV20-21-AFTER-PCV15-NO-INTERVAL',
    what: 'PCV20/PCV21 given after an adult PCV15 — the "PPSV23 not available" substitute path',
    rulebook: 'adult',
    vaccine: 'PCV',
    products: ['PCV20', 'PCV21'],
    from: 'lastPcv15',
    needsPriorPcv: ['PCV15'],
    interval: null,
    grace: false,
    enforcement: 'none',
    authority: 'CDC',
    source: 'CDC Adult Immunization Schedule Notes offer PCV20 or PCV21 as a substitute when PPSV23 is '
      + 'not available after a PCV15, and state NO interval for that substitution. Flagging a gap here '
      + 'would invent one. Deliberately NOT conditioned on PPSV23 history: the substitution has no '
      + 'stated interval whatever else is on the record, and the more specific floors above are '
      + 'ordered ahead of this row so they still win where they apply.',
    message: null,
  },

  // ── Recommendations: the dose counts, and carries a note ─────────────
  //
  // No grace on these, deliberately. The grace is CDC's rule for whether a
  // dose that missed a MINIMUM still counts; nothing is being voided here, so
  // a day short of the year is a day short.
  {
    id: 'ADULT-PPSV23-AFTER-PCV15-SHORTER-MINIMUM-USED',
    what: 'An adult PPSV23 that used the 8-week option rather than waiting the recommended year',
    rulebook: 'adult',
    vaccine: 'PPSV23',
    products: null,
    from: 'lastPcv15',
    shorterMinimum: true,
    interval: { months: ADULT_PPSV23_INTERVAL_MONTHS },
    grace: false,
    enforcement: 'recommendation',
    authority: 'CDC',
    source: 'CDC Adult Immunization Schedule Notes (see ADULT-PPSV23-AFTER-PCV15-SHORTER-MINIMUM). '
      + '≥1 year is the recommendation for every adult; 8 weeks is a minimum that MAY BE CONSIDERED '
      + 'for an immunocompromising condition, cochlear implant or CSF leak. A-P1-1: the app names the '
      + 'option, and never substitutes it for the recommendation.',
    message: (ctx, anchor) => `Given ${fmtSince(anchor.date, ctx.doseDate)} the PCV15 dose. CDC recommends PPSV23 at least 1 year after PCV15 and names an 8-week minimum that may be considered for an immunocompromising condition, cochlear implant or CSF leak — this dose met that minimum, so it counts.`,
  },
  {
    id: 'ADULT-PCV-AFTER-PCV-CATCH-ALL',
    what: 'Any two adult PCV doses less than a year apart that no row above covers',
    rulebook: 'adult',
    vaccine: 'PCV',
    products: null,
    from: 'prevSameStream',
    interval: { months: ADULT_ADVISED_PCV_GAP_MONTHS },
    grace: false,
    catchAll: true,
    enforcement: 'recommendation',
    authority: 'CDC',
    source: 'CDC Adult Immunization Schedule Notes: "Previously received only PCV13: 1 dose PCV20 or 1 '
      + 'dose PCV21 at least 1 year after the last PCV13 dose." 1 year is the SHORTEST of CDC\'s adult '
      + 'gaps, so a catch-all keyed on it under-flags rather than over-flags. It exists so that a pair '
      + 'the enumerated rows above do not name — PCV13→PCV15, say — does not pass unremarked; without '
      + 'it, "enumerate, never generalise" would turn into silence.',
    message: (ctx, anchor) => `Given ${fmtSince(anchor.date, ctx.doseDate)} the previous dose. For adults CDC advises at least 1 year between pneumococcal conjugate doses. This dose still counts.`,
  },
  {
    id: 'ADULT-PPSV23-AFTER-PCV-CATCH-ALL',
    what: 'An adult PPSV23 less than a year after a PCV dose that no row above covers (a PCV13 or PCV20, not a PCV15)',
    rulebook: 'adult',
    vaccine: 'PPSV23',
    products: null,
    from: 'lastPcv',
    interval: { months: ADULT_PPSV23_INTERVAL_MONTHS },
    grace: false,
    catchAll: true,
    enforcement: 'recommendation',
    authority: 'CDC',
    source: 'The PPSV23-stream twin of ADULT-PCV-AFTER-PCV-CATCH-ALL, and it exists for the same '
      + 'reason: without it a pair the enumerated rows do not name would pass in total silence — the '
      + 'exact shape of bug S14-7 exists to remove. ≥1 year is the shortest adult PCV→PPSV23 gap CDC '
      + 'states, so it under-flags. After the owner promoted PCV13→PPSV23 to a floor (2026-10-11) the '
      + 'only pairs still reaching this row are a PPSV23 after a PCV20 or PCV21 — sequences no CDC row '
      + 'recommends at all, because those products complete the series on their own, so no source '
      + 'states an interval to enforce.',
    message: (ctx, anchor) => `Given ${fmtSince(anchor.date, ctx.doseDate)} the previous pneumococcal conjugate dose. For adults CDC advises at least 1 year between a conjugate dose and PPSV23. This dose still counts.`,
  },
];

// ── The evaluator ────────────────────────────────────────────────────────
//
// One walk, no age test of its own. `rulebook` is matched against the age at
// the dose because that is what selects WHICH schedule's sentence applies —
// never whether a rule is allowed to bite, which is `enforcement`'s job alone.

function rulebookOf(ageAtDose) {
  if (ageAtDose == null) return null;
  return ageAtDose >= ADULT_SCHED_MIN_M ? 'adult' : 'child';
}

function ruleApplies(rule, ctx, book) {
  if (rule.vaccine !== ctx.vaccine) return false;
  if (rule.rulebook !== 'any' && rule.rulebook !== book) return false;
  if (rule.products && !rule.products.includes(ctx.product)) return false;
  if (rule.needsPriorPcv && !rule.needsPriorPcv.every((k) => ctx.priorPcv.some((d) => d.product === k))) return false;
  if (rule.needsNoPriorPcv && ctx.priorPcv.length > 0) return false;
  if (rule.needsPriorPpsv23 && ctx.priorPpsv23.length === 0) return false;
  if (rule.needsNoPriorPpsv23 && ctx.priorPpsv23.length > 0) return false;
  if (rule.shorterMinimum !== undefined
    && rule.shorterMinimum !== adultPpsvShorterMinimumApplies(ctx.riskIds)) return false;
  return true;
}

// Some rows name a CDC prior-vaccine row that only holds while the anchor is
// still the patient's MOST RECENT dose of its kind — "previously received
// PCV13" stops describing someone once they have had a PCV15 as well. Checked
// after the anchor resolves, because it is a fact about the anchor, not the
// judged dose.
function anchorAllowed(rule, anchor) {
  return !rule.anchorMustBeProduct || anchor.product === rule.anchorMustBeProduct;
}

// W1 (2026-10-11): the earliest date a floor's dose could have validly been
// given — anchor date + the rule's own interval, minus the 4-day grace that
// `intervalMet` already extends in the same direction. Lets validate.js say
// "the next dose is due on or after <date>" instead of "repeat this dose",
// which is wrong for a dose that was never missing, only early.
function earliestValidDate(rule, anchor) {
  const grace = rule.grace ? GRACE_DAYS : 0;
  if (rule.interval.months != null) {
    return addDays(addCalendarMonths(anchor.date, rule.interval.months), -grace);
  }
  const minDays = rule.interval.daysFrom ? rule.interval.daysFrom(anchor) : rule.interval.days;
  return addDays(anchor.date, minDays - grace);
}

// Is the gap long enough? `null` interval (a never-flagged row) is always met.
function intervalMet(rule, ctx, anchor) {
  if (!rule.interval) return true;
  if (rule.interval.months != null) {
    return rule.grace
      ? calendarIntervalMeetsMinimum(anchor.date, rule.interval.months, ctx.doseDate)
      : calendarIntervalElapsed(anchor.date, rule.interval.months, ctx.doseDate);
  }
  const minDays = rule.interval.daysFrom ? rule.interval.daysFrom(anchor) : rule.interval.days;
  const gap = daysBetween(anchor.date, ctx.doseDate);
  return rule.grace ? intervalMeetsMinimum(gap, minDays) : gap >= minDays;
}

/**
 * Judge one recorded dose's timing against the whole table.
 *
 * @param {object} ctx
 * @param {'PCV'|'PPSV23'} ctx.vaccine   stream the judged dose is in
 * @param {string} ctx.product           product key ('' when not recorded)
 * @param {string} ctx.doseDate          ISO date of the judged dose
 * @param {?number} ctx.ageAtDose        age in months at the judged dose
 * @param {?{date:string, ageAtDose:?number, product?:string}} ctx.prev
 *   previous DATED dose in the same stream, including one that did not count
 * @param {Array<{date:string, product?:string}>} ctx.priorPcv
 *   COUNTING PCV doses dated on or before this dose
 * @param {Array<{date:string}>} ctx.priorPpsv23
 *   PPSV23 doses dated on or before this dose
 * @param {string[]} ctx.riskIds
 * @returns {null
 *   | {kind:'floor', ruleId:string, authority:string, reasons:string[], detail:string, earliestValidDate:string}
 *   | {kind:'recommendation', ruleId:string, authority:string, reason:string}}
 */
export function evaluateDoseInterval(ctx) {
  const book = rulebookOf(ctx.ageAtDose);
  // No date, or no age to place the dose in a schedule → no timing verdict.
  // Never a silent pass that LOOKS like a clean one: validate.js says in words
  // that an undated dose cannot have its intervals checked.
  if (!book || !ctx.doseDate) return null;

  // Has an enumerated (non-catch-all) row already spoken for this dose?
  let namedByRule = false;
  for (const rule of DOSE_INTERVAL_RULES) {
    if (!ruleApplies(rule, ctx, book)) continue;
    const anchor = ANCHORS[rule.from](ctx);
    if (!anchor || !anchor.date || anchor.date > ctx.doseDate) continue;
    if (!anchorAllowed(rule, anchor)) continue;

    // A matching never-flagged row stops the walk — that is its whole job.
    if (rule.enforcement === 'none') return null;

    // A catch-all only speaks for a pair NO enumerated row named. Without
    // this, the generic note talks over the specific rule and gets the number
    // wrong: an immunocompromised adult whose PPSV23 came 10 weeks after PCV13
    // met the 8-week interval rr7203a1 states FOR THEM, and was then told
    // "CDC advises at least 1 year" by a row that cannot see their risk class.
    // That is the A-P1-1 mistake — one flat interval quoted at every adult —
    // reappearing one rule along.
    if (rule.catchAll && namedByRule) continue;
    if (intervalMet(rule, ctx, anchor)) { namedByRule = namedByRule || !rule.catchAll; continue; }

    const msg = rule.message(ctx, anchor);
    if (rule.enforcement === 'floor') {
      return {
        kind: 'floor', ruleId: rule.id, authority: rule.authority,
        reasons: msg.reasons, detail: msg.detail,
        earliestValidDate: earliestValidDate(rule, anchor),
      };
    }
    return { kind: 'recommendation', ruleId: rule.id, authority: rule.authority, reason: msg };
  }
  return null;
}

/** Every rule id, for the drift-guard test. */
export const RULE_IDS = DOSE_INTERVAL_RULES.map((r) => r.id);
