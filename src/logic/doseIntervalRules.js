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
// words, so voiding a dose below it claims no more than the source does. Three
// of the four **paediatric** floors, and only those. The adult rows that carry
// 'CDC' are the ones that void nothing — `enforcement: 'none'` and the
// catch-all `'recommendation'` rows — where CDC really is the one speaking.
//
// ⚠ The FOURTH paediatric floor, `CHILD-PCV-AFTER-PPSV23`, is **not** CDC's.
// It was added 2026-10-25 and is the first child row to carry the owner's
// name: ACIP states its 8 weeks as the timing for the NEXT dose and nowhere
// says a dose given inside it stops counting, so the interval is ACIP's and
// the BAR is hers. See the row's own comment and CLINICAL_SPEC.md
// §K-PPSV23THENPCV. Never relabel it CDC to make the four look uniform.
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
// `authority: 'OWNER'` — ⚠️ **AN OWNER CLINICAL DETERMINATION. Never cite ACIP
// or CDC for these rows.** Most are dated 2026-10-11 and are about ADULT gaps;
// the evidence below is theirs. Two later rows are hers for the same REASON but
// on their own evidence, so do not read the 2026-10-11 material as covering
// them: `ADULT-PCV-AFTER-PCV-UNDER-4-WEEKS` (2026-10-25) and the one child row,
// `CHILD-PCV-AFTER-PPSV23` (2026-10-25). The adult sources disagree, and were
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
  intervalPhrase,
  intervalPhraseAdj,
  intervalArticle,
  calendarIntervalMeetsMinimum,
  pcvNextDoseMinIntervalDays,
  PCV_PPSV23_MIN_INTERVAL_DAYS,
  PPSV23_REVACC_MIN_MONTHS,
  ADULT_ADVISED_PCV_GAP_MONTHS,
  ADULT_CONJUGATE_SUPPORTED_MIN_DAYS,
  GRACE_DAYS,
} from './intervals.js';
import {
  ADULT_PPSV23_INTERVAL_MONTHS,
  adultPpsvShorterMinimumApplies,
  adultPpsvShorterIntervalIsTheAdvice,
} from '../data/riskFactors.js';
import { ADULT_SCHED_MIN_M } from './scheduleConstants.js';
// C12 (2026-10-24, owner decision): one date format on the screen. Every
// patient date a clinician READS goes through `fmtDate` — "Feb 10, 2026" —
// because the rec card has always printed dates that way and the dose chips
// printed raw ISO beside them. The DATA fields (`earliestValidDate`,
// `repeatDueDate`, every corpus column) stay ISO and are untouched; only the
// sentences change. ⚠️ A PROVENANCE date — "an owner clinical determination
// dated 2026-10-11" — is NOT a patient date and must stay as it is written.
import { fmtDate } from './format.js';

// ── Plain-English gap formatting ─────────────────────────────────────────
// Minimums read back the way the source states them: "4 weeks (28 days)".
//
// S6 (2026-10-15) moved the words themselves onto intervals.js's shared
// intervalPhrase() and left only the "(N days)" gloss here, so a week-based
// minimum is spelled the same way in a recommendation and in a verdict.
function fmtDays(days) {
  if (days % 7 === 0) return `${intervalPhrase({ days })} (${days} days)`;
  return intervalPhrase({ days });
}

/**
 * THIS row's own interval, in the words a clinician reads (S6 second half).
 *
 * Passed to every `message` as its third argument so a verdict's sentence is
 * physically unable to name a different number from the one that decided it.
 * Before S6 each message hand-typed its own minimum: nine rows said "1 year"
 * or "5 years" in prose while `interval:` above them held the constant, and
 * nothing reconciled the two.
 *
 * `daysFrom` rows compute their minimum from the anchor AND the judged dose's
 * own context, so they are resolved the same way here rather than being left to
 * hand-type the answer. `ctx` was added 2026-10-23: CDC's Catch-up Table 2 keys
 * the PCV cell on the DOSE NUMBER as well as the two ages, so a function of the
 * anchor alone cannot express it (see `CHILD-PCV-AFTER-PCV`).
 */
function intervalWords(rule, anchor, ctx) {
  const iv = rule.interval;
  if (!iv) return null;                       // an enforcement:'none' row
  const spec = iv.daysFrom ? { days: iv.daysFrom(anchor, ctx) } : iv;
  // Both grammatical forms, because the verdict sentences use both: "given at
  // least 5 years after the first" (noun) and "this 5-year gap is enforced as
  // a minimum" (adjective). Handing out only the noun is what printed
  // "this 5 years gap" to 396 of the 16,250 swept patients.
  return {
    words: intervalPhrase(spec),
    adj: intervalPhraseAdj(spec),
    article: intervalArticle(spec),
  };
}

// The shorter minimum that three rows MENTION without being keyed to it: the
// 8 weeks rr7203a1 allows for an immunocompromising condition, cochlear
// implant or CSF leak. Named from its own constant, not from `gap`, because in
// those rows it is the SIBLING row's interval being described — pointing it at
// `gap` would have tied the sentence to the wrong rule.
const SHORTER_MINIMUM_WORDS = intervalPhrase({ days: PCV_PPSV23_MIN_INTERVAL_DAYS });
// The adjectival form, for "the 8-week minimum interval applies only to…".
// English needs both and they are not interchangeable: the first pass used the
// noun form in all three places and printed "the 8 weeks minimum interval" to
// 511 of the 16,250 swept patients.
const SHORTER_MINIMUM_ADJ = intervalPhraseAdj({ days: PCV_PPSV23_MIN_INTERVAL_DAYS });
const SHORTER_MINIMUM_ARTICLE = intervalArticle({ days: PCV_PPSV23_MIN_INTERVAL_DAYS });

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
export function fmtSince(fromISO, toISO) {
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
  // 2026-10-30 (OWNER RULING, on Ben): the most recent PPSV23 that counted OR
  // was recorded as an extra dose — a PPSV23 the child received, either way.
  // Read by ONE row, `CHILD-PCV-AFTER-PPSV23`: its 8-week wait rests on a
  // weaker conjugate response after a PPSV23, which a dose that was not
  // needed causes as much as one that was. A REJECTED PPSV23 still anchors
  // nothing across streams (ANCHOR-1) — RE-CONFIRMED 2026-10-31 on Rosa and
  // Eli, below `lastPpsv23HoldingAConjugate`.
  lastPpsv23Received: (ctx) => lastPpsv23HoldingAConjugate(ctx.priorPpsv23, ctx.ppsv23ExtraGiven),
};

/**
 * The PPSV23 a child's next conjugate is held 8 weeks after: the most recent
 * one that COUNTED or was an EXTRA dose. The ONE definition — the dose check
 * (`CHILD-PCV-AFTER-PPSV23`) and the card's advised date (`recommend.js`, via
 * validate.js's `conjugateHold`) both call this, so the app advises the date
 * it accepts. Until 2026-10-31 the card read counted doses only, and a child
 * whose EXTRA PPSV23 was 3 weeks old was told her conjugate was due today,
 * then had it thrown out.
 *
 * A THROWN-OUT PPSV23 holds off nothing — OWNER RULINGS 2026-10-31. Rosa (a
 * PPSV23 given by mistake at 12 months, the PCV13 booster a week later): "The
 * Sep 8 PCV13 dose should count ... Per CDC: repeat dose should be spaced
 * after the invalid dose by the recommended minimum interval. This means this
 * rule applies when the repeat dose is the same as the invalid dose." Then Eli
 * (a PPSV23 thrown out for spacing, a PCV20 33 days later), shown dose by
 * dose: "Count it" — which withdrew her first answer on Eli that morning.
 */
export function lastPpsv23HoldingAConjugate(counted, extra) {
  return lastOf(
    [...(counted ?? []), ...(extra ?? [])]
      .filter((d) => d && d.date)
      .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0)),
  );
}

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
//   shorterIsTheAdvice
//                 true  → only when the 8 weeks is this adult's RECOMMENDATION
//                         (19–49 with an immunocompromising condition, cochlear
//                         implant or CSF leak — S15, 2026-10-16)
//                 false → only when it is not (50+, or chronic only)
//                 undefined → regardless
//                 A DECLARED selector, read once in ruleApplies() exactly like
//                 shorterMinimum. It is NOT an inline age test deciding whether
//                 a rule may bite — that was the S14-RC root cause. A row that
//                 needs to speak only to one age band declares it here.
//   anchorCounted true  → only when the anchor dose COUNTED
//                 false → only when it did NOT (it was set aside)
//                 undefined → regardless
//                 Added by P2 (2026-10-30) so one pair of doses can get two
//                 answers: a second PPSV23 after a counted first is her P2
//                 ruling (count it), a repeat after a rejected one is Ruling D
//                 (space it from the dose given, or it does not count).
//   interval      { days } | { months } | { daysFrom: fn(anchor, ctx) }
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
    // OWNER DECISION 2026-10-23. This row used to grade the gap with
    // `pcvSeriesMinIntervalDays(anchor.ageAtDose)` — 4 weeks whenever the
    // earlier dose fell before the first birthday — while the scheduler
    // ADVISED the next dose with `pcvNextDoseMinIntervalDays`, which is CDC's
    // Catch-up Table 2 cell by cell. The two disagree on one cell, and
    // `intervals.js` said so in writing while leaving both standing: the app
    // told a clinician to wait until 2026-08-15 and then accepted the dose
    // given on 2026-07-18, silently, for the same child.
    //
    // The two now share ONE function, so they cannot drift apart again. That
    // is the point of the fix, not a side effect of it — a second reading of
    // the same table is what produced the contradiction.
    //
    // Table 2 keys the cell on the DOSE NUMBER as well as the two ages ("4
    // weeks if current age is younger than 12 months AND previous dose was
    // administered at <7 months old"), which a function of the anchor alone
    // cannot express — hence `ctx`.
    //
    // `doseNumber` counts the doses that COUNT (`ctx.doseNumber` is built from
    // validate.js's `kept` list), because that is how CDC's catch-up table
    // counts them: a PCV7, or a dose already rejected for spacing, is not a
    // "previous dose" these cells are about.
    interval: {
      daysFrom: (anchor, ctx) => pcvNextDoseMinIntervalDays({
        doseNumber: ctx.doseNumber,
        ageAtPrevDose: anchor.ageAtDose,
        // "current age" for a dose already given is the age AT that dose: the
        // question is whether it was valid when it was administered, not
        // whether it would be valid today.
        currentAgeMonths: ctx.ageAtDose,
        anyDoseBefore12: ctx.anyPriorDoseBefore12,
      }),
    },
    grace: true,
    enforcement: 'floor',
    authority: 'CDC',
    source: 'CDC Catch-up Immunization Schedule, pneumococcal conjugate row, column "Minimum '
      + 'Interval Between Doses" (fetched live 2026-10-23). Dose 1 to Dose 2: "4 weeks if first '
      + 'dose was administered before the 1st birthday / 8 weeks (as final dose for healthy '
      + 'children) if first dose was administered at the 1st birthday or after". Dose 2 to Dose 3: '
      + '"4 weeks if current age is younger than 12 months and previous dose was administered at '
      + '<7 months old / 8 weeks (as final dose for healthy children) if previous dose was '
      + 'administered between 7-11 months (wait until at least 12 months old); OR if current age '
      + 'is 12 months or older and at least 1 dose was administered before age 12 months". '
      + 'Dose 3 to Dose 4: "8 weeks (as final dose)". The cells are transcribed in intervals.js, '
      + 'which owns the function both this row and the scheduler call.',
    message: (ctx, anchor, min) => {
      const gap = daysBetween(anchor.date, ctx.doseDate);
      // The number comes from `min` — resolved from this row's own `interval`
      // — so the sentence is physically unable to name a different one from
      // the number that decided the verdict (S6). It used to recompute it.
      const band = anchor.ageAtDose == null
        ? 'earlier'
        : anchor.ageAtDose < 7
          ? 'before 7 months of age'
          : anchor.ageAtDose < 12
            ? 'between 7 and 11 months of age'
            : 'at 12 months of age or older';
      return {
        reasons: [`Given ${fmtDayCount(gap)} after the previous dose — for dose ${ctx.doseNumber} of the series, when the earlier dose was given ${band}, CDC's minimum interval is ${min.words}.`],
        detail: `Gap: ${fmtDayCount(gap)} since the dose of ${fmtDate(anchor.date)}. Minimum: ${min.words} (doses up to 4 days early still count, per CDC).`,
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
    message: (ctx, anchor, min) => {
      const gap = daysBetween(anchor.date, ctx.doseDate);
      // Same-visit is the 0-day case of the same minimum, named separately
      // because it is the mistake a clinician is most likely to have made.
      // It names the PCV the RECORD shows (2026-10-31): it said "PCV15 and
      // PPSV23 should not be given at the same visit" for every product, and
      // on the grid none of its 583 showings sat beside a PCV15. CDC's
      // same-visit sentence names PCV15 alone, so it stays for a PCV15 only.
      if (gap === 0) {
        const given = anchor.product ? `a ${anchor.product} dose` : 'a PCV dose';
        const pcv15 = anchor.product === 'PCV15' ? 'PCV15 and PPSV23 should not be given at the same visit, and ' : '';
        return {
          reasons: [`Given on the same day as ${given} — ${pcv15}PPSV23 is given at least ${fmtDays(PCV_PPSV23_MIN_INTERVAL_DAYS)} after a PCV dose.`],
          detail: `Gap: same day. Minimum: ${fmtDays(PCV_PPSV23_MIN_INTERVAL_DAYS)} after the PCV dose.`,
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
    // Only after a PPSV23 that COUNTED. A repeat of a rejected one is the next
    // row's, and stays a floor (Ruling D) — P2's rulings are about a SECOND
    // dose, and a dose after a set-aside first is not one.
    anchorCounted: true,
    interval: { months: PPSV23_REVACC_MIN_MONTHS },
    // What the rules page and CLINICAL_SPEC.md §K say happens — in words,
    // because the enforcement alone ("Counts, with a note") is untrue of Ava.
    ifShorter: {
      short: 'Immunocompromised: counts, with a note. Otherwise: an extra dose, not counted',
      means: 'For a child with an immunocompromising condition the dose counts and the app notes the shorter gap — a third PPSV23 is never given. For any other child a second PPSV23 is never needed, so it is recorded as an extra dose: not harmful, not counted, nothing to repeat.',
    },
    // P2 (2026-10-30): a RECOMMENDATION, no longer a floor — the adult twin's
    // relaxation of 2026-10-25 (`ADULT-PPSV23-AFTER-PPSV23`), run on the child
    // row. OWNER RULING 2026-10-29: a 2nd PPSV23 inside 5 years to an
    // immunocompromised child COUNTS, and she is never offered a third. As a
    // floor this row asserted that an early dose stops counting, which CDC
    // does not state; as a recommendation it asserts only CDC's interval,
    // which it does — so the authority stays CDC's.
    //
    // A child with NO immunocompromising condition is never owed a second
    // PPSV23 at all, so for her this row's note is replaced by validate.js's
    // extra-dose sentence (OWNER RULING 2026-10-30, on Ava). The row still
    // fires for both: whether a second PPSV23 was indicated is the risk
    // class's question, not the interval's.
    //
    // ⚠ THE ONE RECOMMENDATION ROW THAT KEEPS CDC'S 4-DAY GRACE — OWNER
    // DECISION 2026-10-30, and the floor⇔grace rule's only exception (pinned
    // by name in rule-docs-match-code). Without it the line between "on time"
    // and "early" moved: the test grid dates a second PPSV23 two days short of
    // five years, which counted silently on main, and dropping the grace moved
    // 708 of 17,016 patients — 22 of them ADULTS whose card changed because of
    // a PPSV23 given in childhood. Shown that, she chose to keep the grace: a
    // dose up to 4 days early is on time, as it was, and only a dose that used
    // to be THROWN OUT gets the new answer. 96 move with it, all one family
    // (see recommend.js, "Sofia").
    grace: true,
    enforcement: 'recommendation',
    authority: 'CDC',
    source: 'CDC Child & Adolescent Schedule Notes, pneumococcal, immunocompromising conditions: '
      + '"If PPSV23 is used, administer either PCV20 or dose 2 PPSV23 at least 5 years after dose 1 PPSV23." '
      + '(read live 2026-10-30). The non-immunocompromising list gives one PPSV23 and no second. '
      + 'OWNER RULINGS 2026-10-29 (immunocompromised: count, never a third) and 2026-10-30 '
      + '(not immunocompromised: an extra dose). See CLINICAL_SPEC.md §K and §C-P2.',
    message: (ctx, anchor, min) => ({
      reason: `Given ${fmtSince(anchor.date, ctx.doseDate)} the previous PPSV23 dose of ${fmtDate(anchor.date)} — shorter than the ${min.words} advised between PPSV23 doses. **Counted; never give a third.**`,
      why: `CDC's child schedule gives an immunocompromised child a second PPSV23 at least ${min.words} after the first, and never a third. The dose counts because setting it aside would only invite a third PPSV23.`,
    }),
  },
  {
    // P2 (2026-10-30). The old floor, kept EXACTLY as it was on main, for the
    // one case her P2 rulings do not reach: a PPSV23 given inside five years of
    // an earlier PPSV23 that did NOT count (say, given under 8 weeks after a
    // PCV). That later dose is a REPEAT of a rejected dose, not a second dose,
    // and RULING D (2026-10-23) governs it: "the repeat dose should be spaced
    // from the invalid dose by the minimum interval. This should be followed."
    // Without this row the recommendation above would have counted it with a
    // note saying "never give a third" — on what is the child's FIRST counted
    // PPSV23.
    //
    // NARROWED 2026-10-30 (OWNER RULING, on Noah): only when an earlier PPSV23
    // HAS counted. The 5 years is the gap from dose 1 to dose 2, so it can only
    // govern the repeat of a rejected SECOND dose. The repeat of a rejected
    // FIRST dose is the child's first PPSV23 and is the next row's.
    id: 'CHILD-PPSV23-AFTER-INVALID-PPSV23',
    what: 'A PPSV23 dose given after an earlier PPSV23 that did not count, when an even earlier PPSV23 did, under the child schedule',
    rulebook: 'child',
    vaccine: 'PPSV23',
    products: null,
    from: 'prevSameStream',
    anchorCounted: false,
    needsPriorPpsv23: true,
    interval: { months: PPSV23_REVACC_MIN_MONTHS },
    grace: true,
    enforcement: 'floor',
    authority: 'CDC',
    source: 'CDC Child & Adolescent Schedule Notes, pneumococcal, immunocompromising conditions: '
      + '"If PPSV23 is used, administer either PCV20 or dose 2 PPSV23 at least 5 years after dose 1 PPSV23." '
      + 'Measured from the dose given, not the dose that counted: ACIP General Best Practices, "The repeat '
      + 'dose should be spaced after the invalid dose by the recommended minimum interval" (RULING D, 2026-10-23).',
    message: (ctx, anchor, min) => ({
      reasons: [`Given less than ${min.words} after the previous PPSV23 dose — a second PPSV23 is given at least ${min.words} after the first.`],
      detail: `Previous PPSV23: ${fmtDate(anchor.date)}. Minimum: ${min.words} later (doses up to 4 days early still count, per CDC).`,
    }),
  },
  {
    // ── 2026-10-30, OWNER RULING ON NOAH — "Counts as 1st PPSV23" ──────────
    //
    // A PPSV23 given after a PPSV23 that did NOT count, when no PPSV23 has
    // counted yet. It is the REPEAT of a rejected first dose, so it takes that
    // dose's place: CDC's own example of the rule ends "The repeat dose is
    // counted as the valid second dose." It is spaced from the dose given by
    // the interval that governs a FIRST PPSV23 — CDC's 8 weeks — which is the
    // date the rejected dose's chip already prints (RULING D, `repeatDueDate`
    // of `CHILD-PPSV23-AFTER-PCV`). The PCV row above still judges the gap
    // from the PCV, so the repeat must clear both.
    //
    // Until today the row above judged it, as a SECOND dose, at 5 years: Noah
    // (asplenia, PPSV23 4 weeks after his PCV13, repeated 10 weeks later) was
    // told his repeat was too soon "until Jul 10, 2028", beside a chip saying
    // "from Jun 24, 2023", and his card offered PPSV23 again — his third shot.
    // Guard: regression-2026-10-30-repeat-of-a-rejected-first-ppsv23.test.js.
    id: 'CHILD-PPSV23-REPEAT-AFTER-INVALID-FIRST',
    what: 'A PPSV23 dose repeating an earlier PPSV23 that did not count, when no PPSV23 has counted yet, under the child schedule',
    rulebook: 'child',
    vaccine: 'PPSV23',
    products: null,
    from: 'prevSameStream',
    anchorCounted: false,
    needsNoPriorPpsv23: true,
    interval: { days: PCV_PPSV23_MIN_INTERVAL_DAYS },
    grace: true,
    enforcement: 'floor',
    authority: 'CDC',
    source: 'CDC General Best Practices, Timing and Spacing of Immunobiologics (read live 2026-10-30): '
      + '"The repeat dose should be spaced after the invalid dose by the recommended minimum interval" and, '
      + 'in its worked example, "The repeat dose is counted as the valid second dose." The interval for a '
      + 'first PPSV23, CDC Child & Adolescent Schedule Notes, pneumococcal: "1 dose PPSV23 at least 8 weeks '
      + 'after the most recent PCV dose" (read live 2026-10-30). OWNER RULING 2026-10-30: the repeat of a '
      + 'rejected first PPSV23 counts as the first PPSV23. See CLINICAL_SPEC.md §C-P2.',
    message: (ctx, anchor, min) => ({
      reasons: [`Given ${fmtSinceDays(anchor.date, ctx.doseDate)} the PPSV23 dose of ${fmtDate(anchor.date)}, which did not count — the repeat of a PPSV23 that did not count is given at least ${fmtDays(PCV_PPSV23_MIN_INTERVAL_DAYS)} after it.`],
      detail: `Previous PPSV23 (did not count): ${fmtDate(anchor.date)}. Minimum: ${fmtDays(PCV_PPSV23_MIN_INTERVAL_DAYS)} later (doses up to 4 days early still count, per CDC).`,
    }),
  },
  {
    // ── NEW 2026-10-25, AND REVERSED THE SAME DAY ───────────────────────
    //
    // Until this morning the app had NO rule here. A child given a conjugate
    // two weeks after her PPSV23 was accepted in silence — no note, no number,
    // nothing — while the card beside her quoted an 8-week interval. It was
    // found from the advice side: the 6-18 block held the next dose to 8 weeks
    // after a PPSV23 and the 24-71-month block did not, and checking which was
    // right turned up that NEITHER side graded a dose already given.
    //
    // THE DOCUMENT STATES THE PPSV23 ANCHOR OUTRIGHT. ACIP's 2023 PCV20-in-
    // children report, "Children 6-18 years with any risk condition with no
    // previous PCV13, PCV15, or PCV20 vaccination":
    //
    //   "a single dose of PCV15 or PCV20 is recommended >=8 weeks after the
    //    most recent dose of pneumococcal vaccination, REGARDLESS OF WHETHER
    //    THE CHILD HAS PREVIOUSLY RECEIVED PPSV23, even if PCV7 was received."
    //
    // ⚠ A FLOOR, AND THAT IS AN OWNER RULING THAT REVERSES AN EARLIER ONE OF
    // THE SAME DAY. It shipped in `a66219a` as a RECOMMENDATION, on her
    // morning answer: *"I think this a grey zone where it could be considered
    // complete but an alternative suggest should be listed that allows a
    // clinician to repeat the dose 8 weeks after the early PCV20 if
    // conservative due to lack of direct CDC/ACIP guidance."* She was then
    // asked directly — "count (this morning's ruling) or repeat?" — and
    // answered **"Repeat — her table wins."** Her interval table gives this row
    // the basis "ACIP rule" plus the 2014 *Vaccine* report on a blunted
    // conjugate response following PPSV23: hyporesponsiveness is her reason
    // for turning ACIP's timing sentence into a bar.
    //
    // ⚠ SO THE AUTHORITY IS HERS, NOT CDC'S — and this is the FIRST paediatric
    // floor that is. The quoted sentence states the INTERVAL and stops there;
    // "a dose given inside it does not count" is a further claim no document
    // makes. That is exactly the distinction this file's header draws between
    // ACIP's "minimum RECOMMENDED interval" and the General Best Practices
    // "minimum interval" that carries the repeat-the-dose consequence, and it
    // is why `authority` is OWNER and the per-dose text says so to the
    // clinician. This is Ruling F's relabelling run BACKWARDS: Ruling F took
    // the owner's name off rows whose bar was removed, and this puts it on a
    // row that has gained one. Never relabel it CDC to make the four
    // paediatric floors look uniform — the app would then cite ACIP for a
    // consequence ACIP does not state.
    //
    // ⚠ IT IS NO LONGER ASYMMETRIC WITH CHILD-PPSV23-AFTER-PCV IN
    // `enforcement` — both are now floors at the same 8 weeks — BUT THE TWO
    // ROWS STILL DIFFER, and must stay separate. The difference moved to
    // `authority`: CDC instructs the PPSV23 itself ("administer 1 dose PPSV23
    // at least 8 weeks after the most recent PCV dose", nine times) and adds
    // "PCV15 and PPSV23 should not be administered during the same visit",
    // while for a conjugate following a PPSV23 it states only the timing of
    // the next dose. Two authorities, one number. Never "tidy" them into one
    // row, and never merge the interval either — `PCV_PPSV23_MIN_INTERVAL_DAYS`
    // is already the single home for the 8 weeks.
    id: 'CHILD-PCV-AFTER-PPSV23',
    what: 'A PCV dose given after a PPSV23 dose, under the child schedule',
    rulebook: 'child',
    vaccine: 'PCV',
    products: null,
    // 2026-10-30: counted OR extra — see `lastPpsv23Received`.
    from: 'lastPpsv23Received',
    interval: { days: PCV_PPSV23_MIN_INTERVAL_DAYS },
    // CDC's 4-day grace, like every other floor: the grace decides whether a
    // dose that missed a MINIMUM still counts, which is a question only a
    // floor asks. `rule-docs-match-code` holds the whole table to
    // floor <=> grace, so this flag moved with the enforcement.
    grace: true,
    enforcement: 'floor',
    // OWNER, not CDC — see the block above. Relabelling this CDC would make
    // the app cite ACIP for a consequence ACIP does not state.
    authority: 'OWNER',
    // No `optionalRepeat`. It existed so a RECOMMENDATION could name a date
    // for a repeat nobody owed; a floor owes the repeat outright and
    // `repeatDueDate` already carries its date (Ruling D's clock, measured
    // from the dose the patient got). Leaving the flag on would put a second
    // clock on one dose, which is the P0 bug's own shape.
    source: 'OWNER CLINICAL DETERMINATION 2026-10-25 that this interval is a BAR and not only a '
      + 'timing recommendation. The BAR is hers - not ACIP, not CDC, in either form - and rests on '
      + 'her hyporesponsiveness evidence; the INTERVAL it enforces is ACIP\'s. Neither ACIP nor CDC '
      + 'states that a dose given inside the 8 weeks stops counting. '
      + 'The interval itself: "Use of 20-Valent Pneumococcal Conjugate Vaccine Among U.S. '
      + 'Children: Updated Recommendations of the Advisory Committee on Immunization Practices - '
      + 'United States, 2023" (published 22 September 2023), under "Children 6-18 years with any '
      + 'risk condition with no previous PCV13, PCV15, or PCV20 vaccination": "a single dose of '
      + 'PCV15 or PCV20 is recommended >=8 weeks after the most recent dose of pneumococcal '
      + 'vaccination, regardless of whether the child has previously received PPSV23, even if PCV7 '
      + 'was received." Table 1 states it again. CDC\'s Child & Adolescent Schedule Notes say the '
      + 'same for the younger band - "Less than 3 PCV doses: 2 doses PCV (at least 8 weeks after '
      + 'the most recent dose ...)" - and CDC\'s own PneumoRecs tool names the PPSV23 as the anchor '
      + 'for a 4-year-old. None of those says a dose given inside the 8 weeks must be repeated. '
      + 'The owner\'s interval table gives this row the basis "ACIP rule" plus the 2014 Vaccine '
      + 'report on a blunted conjugate response after PPSV23; shipped as a RECOMMENDATION in '
      + 'a66219a on her earlier "grey zone" answer of the same morning, she reversed it the same '
      + 'day - "Repeat - her table wins". See CLINICAL_SPEC.md §K-PPSV23THENPCV.',
    message: (ctx, anchor, min) => ({
      reasons: [`Given ${fmtSince(anchor.date, ctx.doseDate)} the PPSV23 dose of ${fmtDate(anchor.date)} — shorter than the ${min.words} between a PPSV23 and a following conjugate dose.`],
      // The disclosure. ACIP states the 8 weeks as the timing for the next
      // dose and nowhere says an earlier dose must be repeated, so the app
      // must not let a clinician read this rejection as CDC's.
      detail: `Previous PPSV23: ${fmtDate(anchor.date)}. Minimum: ${min.words} later (doses up to 4 days early still count, per CDC). ACIP states the ${min.words} as the timing for the next pneumococcal dose and does not direct that an earlier dose be repeated; setting the dose aside is an owner clinical determination of this app, made because immunogenicity at the shorter interval has not been established.`,
    }),
  },

  // ── Adult conjugate-to-conjugate ─────────────────────────────────────
  //
  // OWNER DECISION 2026-10-24 (the "relax both" ruling). These two rows were
  // the last adult FLOORS asserting that one conjugate given sooner than a
  // year after another does not count. She had already said, reasoning about
  // a different patient, that an adult conjugate-to-conjugate interval
  // "exists in no document"; shown two hand-built patients scored both ways
  // she ruled that both rows become RECOMMENDATIONS — the dose counts, and
  // the card explains the timing. Her wording instruction, verbatim: *"make
  // the wording more clinical and nuanced since this is clinically likely ok
  // but data free. Also bold it."* Hence the `**...**` span in each message,
  // which `renderNoteWithCites` turns into <strong class="note-emphasis">.
  //
  // ⚠️ ORDER IS NO LONGER LOAD-BEARING FOR SAFETY, and that is deliberate.
  // Until this change `evaluateDoseInterval` returned on the FIRST unmet row,
  // so a recommendation placed ahead of a floor would have let a dose escape
  // the floor, and this comment said the floor must come first. The walk now
  // COLLECTS unmet recommendations and keeps going, so a later floor still
  // fires and a patient who misses two advised gaps hears about both. That
  // second half is the owner's other instruction of the same day, asked about
  // a 70-year-old who missed the 1-year conjugate gap AND the 5-year gap
  // after her PPSV23 and was told only about the first: she chose *"mention
  // both gaps"*.
  //
  // ⚠️ THE TWO ROWS DO NOT SHARE AN AUTHORITY, and the split is the point.
  // ADULT-PCV20-21-AFTER-PCV13's year is CDC's own sentence ("at least 1 year
  // after the last PCV13 dose"), so as a recommendation it may carry CDC's
  // name — the same relabelling Ruling F did for the 5-year row, and for the
  // same reason: what was removed was an owner-invented BAR, leaving CDC's
  // advice behind. ADULT-PCV20-21-1Y-AFTER-PCV has no such sentence anywhere;
  // its year is this app's own convention. It stays `authority: 'OWNER'` and
  // its message SAYS SO IN WORDS to the clinician. Never relabel it CDC to
  // make the pair look tidy.
  // Guards: regression-ruling-f-2026-10-24-early-conjugate-counts.test.js and
  // regression-2026-10-24-conjugate-gaps-are-advice-not-floors.test.js.
  // ── Conjugate after conjugate, under 4 weeks ──────────────────────────
  //
  // OWNER RULING 2026-10-25, from her three-row adult table. The "PCV, then
  // PCV" row reads: ACIP-stated minimum "None stated"; shortest interval with
  // supporting data "4 weeks (HSCT schedule; infant priming)"; practical
  // cutoff "4 weeks. Count doses given 4 weeks or more apart. Under 4 weeks,
  // there are no supporting data; repeat is optional".
  //
  // A SEPARATE ROW, NOT A BRANCH INSIDE THE THREE 1-YEAR ROWS. Three reasons,
  // and the third is the one that would have bitten:
  //
  //   * one home for the number, per this repo's own rule — a 4-week test
  //     inside three message functions is three readings of one threshold
  //   * the walk continues past a recommendation, so this row and whichever
  //     1-year row applies BOTH speak, which is right: the gap is short of
  //     CDC's advised year AND short of the 4 weeks that has data
  //   * ADULT-PCV20-21-AFTER-PCV15-NO-INTERVAL declares enforcement 'none',
  //     which RETURNS and ends the walk. A PCV20 given 10 days after a PCV15
  //     would therefore have passed in total silence if this row sat below it.
  //     That is why it is first among the adult rows and not near its sibling.
  //
  // It voids NOTHING. `enforcement: 'recommendation'` — her table's whole
  // point is that the dose counts; the row exists so the card can offer the
  // repeat rather than stay quiet.
  {
    id: 'ADULT-PCV-AFTER-PCV-UNDER-4-WEEKS',
    what: 'An adult conjugate dose given less than 4 weeks after another conjugate — shorter than any schedule spaces them',
    rulebook: 'adult',
    vaccine: 'PCV',
    products: null,
    from: 'prevSameStream',
    interval: { days: ADULT_CONJUGATE_SUPPORTED_MIN_DAYS },
    // The repeat is offered 8 weeks after the dose GIVEN, which is her number,
    // not this row's own 4 weeks.
    optionalRepeat: true,
    optionalRepeatInterval: { days: PCV_PPSV23_MIN_INTERVAL_DAYS },
    // No grace. A recommendation counts every dose, so a grace could only move
    // the day the note starts printing; and the ruling of 2026-10-24 keeps
    // every ADVISED date outside the four-day window.
    grace: false,
    enforcement: 'recommendation',
    // ⚠️ ADVISORY ONLY, and this flag is load-bearing. `namedByRule` exists so
    // the catch-all cannot talk over a row that already named the pair. This
    // row is not that kind of row — it adds a second constraint rather than
    // giving the pair its disposition — and it matches EVERY adult
    // conjugate-after-conjugate pair. Without the flag, satisfying it (any gap
    // of 4 weeks or more) set `namedByRule` and silenced
    // ADULT-PCV-AFTER-PCV-CATCH-ALL everywhere, which is the anti-silence
    // guard S14-7 exists to keep. Caught by
    // `regression-s14-7-one-rule-table`'s "a pair no floor names".
    advisoryOnly: true,
    // OWNER, not CDC. CDC states no adult conjugate-to-conjugate minimum at
    // all — "None stated" is her own table's first column — so there is no
    // CDC sentence this row could be asserting. The 4 weeks is her reading of
    // two schedules written about other patients. See the constant's comment
    // in intervals.js for both, including that the post-transplant schedule is
    // ASCO's in this app's record and not ACIP's.
    authority: 'OWNER',
    source: 'OWNER CLINICAL DETERMINATION 2026-10-25 — not ACIP, not CDC, and CDC states no adult '
      + 'conjugate-to-conjugate minimum whatever. Her words: "For conjugate after conjugate, ACIP\'s '
      + 'own HSCT schedule supports counting any dose given 4 weeks or more after the prior PCV. That '
      + 'is especially reasonable when PCV20 or PCV21 adds serotypes the patient has never received. '
      + 'Under 4 weeks, no ACIP schedule spaces pneumococcal conjugate doses that closely. An optional '
      + 'repeat (PCV20 or PCV21, at least 8 weeks later) is reasonable, mainly for immunocompromised '
      + 'patients." The two bases are the post-transplant schedule (3 adult PCV20 doses 4 weeks apart '
      + '— ASCO 2024 in this app\'s record, see '
      + 'docs/archive/retired-2026-10-16-post-transplant-pneumococcal-schedules.md) and infant priming '
      + 'at 4 weeks (ACIP 2022, PCV15 in children). Neither is a sentence about a routine adult '
      + 'interval, which is why this row carries her name. It sets no dose aside. See '
      + 'CLINICAL_SPEC.md §K.',
    message: (ctx, anchor, min, repeatFrom) => ({
      // `fmtSinceDays`, not a raw day count: it says "on the same day as" for
      // a co-administered pair. The first draft printed "Given 0 days after the
      // previous conjugate dose", which reads as "no gap was required" — the
      // exact wording fault `fmtSince`'s own comment was written about, and
      // `regression-s14-7-one-rule-table` caught it.
      reason: `Given ${fmtSinceDays(anchor.date, ctx.doseDate)} the previous conjugate dose — under ${min.words}, which is shorter than any pneumococcal schedule spaces them. **Counted; an optional repeat is reasonable.**`,
      why: `No ACIP schedule spaces conjugate doses closer than ${min.words}, so there are no data on a gap this short — but nothing says the dose must be repeated either, and it counts. A clinician who prefers the conservative course may give an optional PCV20 or PCV21 from ${fmtDate(repeatFrom)}, ${fmtDays(PCV_PPSV23_MIN_INTERVAL_DAYS)} after the dose given. That is most worth considering for an immunocompromised patient.`,
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
    // No grace, deliberately — the same reasoning Ruling F wrote onto the
    // 5-year row below. The 4-day grace exists to let a dose given slightly
    // early still COUNT; a recommendation counts every dose already, so a
    // grace here would only shift the day the note starts printing.
    grace: false,
    enforcement: 'recommendation',
    // STAYS OWNER — see the block above. No ACIP or CDC source states a
    // minimum, or even an advised, interval between two adult conjugate
    // doses. The year is this app's own convention and the message says so.
    authority: 'OWNER',
    source: 'OWNER CLINICAL DETERMINATION 2026-10-11, DOWNGRADED FROM A FLOOR TO A RECOMMENDATION '
      + 'BY OWNER DECISION 2026-10-24 — not ACIP, not CDC, in either form. This was once "the '
      + 'second leg" of the 5-year PPSV23 row, when both gaps had to hold for the dose to count; '
      + 'RULING F (2026-10-24) made that row a recommendation, leaving this as the only gap that '
      + 'could void an adult PCV20/PCV21 whose record already has PCV13 and PPSV23. The owner had '
      + 'said of a different patient that an adult conjugate-to-conjugate interval "exists in no '
      + 'document", and the row was left standing as raised-not-decided. Shown a 70-year-old '
      + '(PPSV23 2018-06-01, PCV13 2026-01-15, PCV20 2026-08-15) scored both ways she closed it: '
      + 'the dose counts and the card explains the timing. CDSI v4.64 sets absMinInt = 0 days for '
      + 'every adult pneumococcal interval. See CLINICAL_SPEC.md §K.',
    // ⚠️ THE CHIP LINE MUST SAY THE INTERVAL WAS NOT MET, not merely state
    // what the interval is. The owner, reading patient C's card: *"the 5
    // years isn't being met right?"* — her dose came 2 years 2 months after
    // her PPSV23 against an advised 5 years, and the sentence quoted the rule
    // and left the reader to do the subtraction. Hence "— shorter than the
    // <interval> ...advises" on every one of these three rows. A note that
    // recites a rule without saying how this patient sits against it is not
    // a clinical note.
    //
    // OWNER REQUEST 2026-10-24, after reading the first draft on screen:
    // *"the bolded and nonbolded text on the card — meningovax has an
    // abbreviated explanation that you can expand. Do that here while also
    // tailoring the language to sound more clinical yet succinct."* So the
    // message is `{ reason, why }`: one clinical line on the chip, the
    // rationale behind the "Why this" disclosure. The bold marks the
    // disposition — the thing a clinician reads first.
    message: (ctx, anchor, min) => ({
      reason: `Given ${fmtSince(anchor.date, ctx.doseDate)} the previous conjugate dose of ${fmtDate(anchor.date)} — shorter than the ${min.words} applied here. **Counted; no repeat indicated.**`,
      why: `No ACIP or CDC source specifies an interval between adult conjugate doses; the ${min.words} interval applied here is this app’s own convention. Immunogenicity at shorter intervals has not been established, so a further conjugate dose is a matter of clinical judgement.`,
    }),
  },
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
    // No grace, deliberately — see the "Recommendations" block below. The
    // grace exists to let a dose up to 4 days early still COUNT; a
    // recommendation counts every dose already, so a grace here would only
    // move the line at which the note prints.
    grace: false,
    enforcement: 'recommendation',
    // CDC, not OWNER — and the change of label is the point of Ruling F, not
    // a detail of it. While this row was a FLOOR it asserted something no
    // source states (that an early dose stops counting), so it had to carry
    // the owner's name. As a recommendation it asserts only CDC's own advised
    // interval, which is why every other recommendation row in this table is
    // CDC too. The owner's ruling is recorded in the source text below; what
    // it did was REMOVE an owner-invented bar, leaving CDC's sentence behind.
    authority: 'CDC',
    source: 'CDC Adult Immunization Schedule Notes, with OWNER RULING F of 2026-10-24 — which '
      + 'REVERSED the owner\'s own determination of 2026-10-11 for this row only, on the ground '
      + 'that the determination added a bar the sources do not state. CDC states the gap as advice '
      + 'for the next dose: "1 dose PCV20 or 1 dose PCV21 '
      + 'at least 5 years after the last pneumococcal vaccine dose", and CDSI v4.64 sets '
      + 'absMinInt = 0 days for it. The owner, shown a 70-year-old with PCV13 2016-10-13, PPSV23 '
      + '2021-10-13 and PCV20 2025-10-10: "Once an adult has received PCV20, ACIP recommends no '
      + 'additional pneumococcal doses... The only issue is timing... ACIP describes that as '
      + 'recommended timing and does not say an earlier dose is invalid or must be repeated." So the '
      + 'dose counts and carries a note. ⚠️ This row is ordered AFTER '
      + 'ADULT-PCV20-21-1Y-AFTER-PCV, which is still a floor: the evaluator returns on the first '
      + 'unmet row, so a recommendation placed before a floor would let a dose missing both gaps '
      + 'escape the floor. See CLINICAL_SPEC.md §K.',
    // Split into chip line + disclosure on 2026-10-24, with the two conjugate
    // rows beside it — the owner's *"abbreviated explanation that you can
    // expand... more clinical yet succinct"*. Same wording shape as those
    // rows, deliberately: a clinician meeting both on one card (patient C)
    // should read two sentences built the same way, not two registers.
    message: (ctx, anchor, min) => ({
      reason: `Given ${fmtSince(anchor.date, ctx.doseDate)} the PPSV23 dose of ${fmtDate(anchor.date)} — shorter than the ${min.words} ACIP advises. **Counted; no repeat indicated.**`,
      why: `With PCV13 and PPSV23 both on the record, ACIP schedules PCV20 or PCV21 at least ${min.words} after the most recent pneumococcal dose, but states that as recommended timing and does not direct that an earlier dose given inside it be repeated.`,
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
    // No grace — see the sibling row above and Ruling F's note on the
    // 5-year row: a recommendation counts every dose, so a grace would only
    // shift the day the note starts printing.
    grace: false,
    enforcement: 'recommendation',
    // CDC, not OWNER — the relabelling Ruling F performed on the 5-year row,
    // for the same reason. As a FLOOR this row asserted something no source
    // states (that an early dose stops counting), so it had to carry the
    // owner's name. As a recommendation it asserts only CDC's own advised
    // interval, which CDC does state in words. Contrast the sibling row
    // above, which has no CDC sentence at all and stays OWNER.
    authority: 'CDC',
    source: 'CDC Adult Immunization Schedule Notes, with OWNER DECISION 2026-10-24 — which '
      + 'DOWNGRADED the owner\'s own determination of 2026-10-11 (decision 5) from a floor to a '
      + 'recommendation, on the ground that the determination added a bar the sources do not '
      + 'state. CDC states the gap as advice for the next dose: "Previously received only PCV13: '
      + '1 dose PCV20 or 1 dose PCV21 at least 1 year after the last PCV13 dose", and CDSI v4.64 '
      + 'sets absMinInt = 0 days for it. The owner, shown a 68-year-old with chronic heart disease '
      + '(PCV13 2026-02-10, PCV20 2026-09-10) whose PCV20 was being thrown out and re-ordered for '
      + '2027-09-10, ruled that the dose counts and the card explains the timing. See '
      + 'CLINICAL_SPEC.md §K.',
    // See the sibling row above for the owner's 2026-10-24 wording request.
    message: (ctx, anchor, min) => ({
      reason: `Given ${fmtSince(anchor.date, ctx.doseDate)} the PCV13 dose of ${fmtDate(anchor.date)} — shorter than the ${min.words} CDC advises. **Counted; no repeat indicated.**`,
      why: `CDC states the ${min.words} interval after PCV13 as recommended timing, not a minimum, and does not direct that a dose given inside it be repeated. Immunogenicity at shorter intervals has not been established, so a further conjugate dose is a matter of clinical judgement.`,
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
    grace: false,
    enforcement: 'recommendation',
    authority: 'CDC',
    source: 'OWNER RULING 2026-10-25 relaxed this row from a floor to a recommendation, and the authority '
      + 'moved with it. As a FLOOR it asserted something no source states \u2014 that an early dose stops '
      + 'counting \u2014 so it carried the owner\'s name (her clinical determination of 2026-10-11). As a '
      + 'RECOMMENDATION it asserts only the interval, which CDC states in words, so it is CDC\'s. That is '
      + 'Ruling F\'s relabelling of 2026-10-24, applied to the rest of the adult rows. CDSI v4.64 sets '
      + 'absMinInt = 0 days for every adult pneumococcal interval, which is the machine-readable form of '
      + 'the same point. Her adult table of 2026-10-25 gives the practical cutoff for COUNTING a dose in '
      + 'each sequence, and no adult sequence rejects one. This row is a conjugate following a PPSV23, '
      + 'her table\'s third sequence: ACIP-stated minimum \"None stated (1 year recommended)\", practical '
      + 'cutoff \"Count; response blunted\". CDC states, for an adult who previously received only '
      + 'PPSV23: give PCV15, PCV20 or PCV21 at least 1 year after the PPSV23 dose \u2014 advice for the '
      + 'next dose. \u26a0\ufe0f THIS ROW WAS A FLOOR TWICE AND A RECOMMENDATION TWICE; 2026-10-25 IS THE '
      + 'LATEST AND IT GENERALISES. On the morning of 2026-10-24 she made it a recommendation (FAMILY 2); '
      + 'that afternoon, on a 70-year-old with PPSV23 2025-10-11 and PCV15 2026-06-19, she called the '
      + 'PCV15 invalid and restored the floor. Shown the SAME patient against her new table on 2026-10-25 '
      + 'she chose to count the dose. Do not re-read the 2026-10-24 afternoon ruling as current. Both are '
      + 'recorded in docs/archive/decision-2026-10-24-invalid-adult-dose-repeat-rule.md. See '
      + 'CLINICAL_SPEC.md \u00a7K.',
    message: (ctx, anchor, min) => ({
      reason: `Given ${fmtSince(anchor.date, ctx.doseDate)} the PPSV23 dose of ${fmtDate(anchor.date)} — shorter than the ${min.words} CDC advises. **Counted; no repeat indicated.**`,
      why: `CDC states the ${min.words} after a PPSV23 as recommended timing for the next dose, and ACIP states no minimum for a conjugate following PPSV23. The conjugate response is blunted by the earlier polysaccharide dose but not absent, so the dose counts.`,
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
    grace: false,
    enforcement: 'recommendation',
    authority: 'CDC',
    source: 'OWNER RULING 2026-10-25 relaxed this row from a floor to a recommendation, and the authority '
      + 'moved with it. As a FLOOR it asserted something no source states \u2014 that an early dose stops '
      + 'counting \u2014 so it carried the owner\'s name (her clinical determination of 2026-10-11). As a '
      + 'RECOMMENDATION it asserts only the interval, which CDC states in words, so it is CDC\'s. That is '
      + 'Ruling F\'s relabelling of 2026-10-24, applied to the rest of the adult rows. CDSI v4.64 sets '
      + 'absMinInt = 0 days for every adult pneumococcal interval, which is the machine-readable form of '
      + 'the same point. Her adult table of 2026-10-25 gives the practical cutoff for COUNTING a dose in '
      + 'each sequence, and no adult sequence rejects one. This row is a PPSV23 following a PCV15 for an '
      + 'immunocompromising condition, cochlear implant or CSF leak \u2014 her table\'s FIRST sequence, '
      + 'and the 8 weeks is the one interval she calls a true adult minimum: \"8 weeks is a true adult '
      + 'minimum only for PPSV23 after a conjugate.\" Its practical cutoff is nevertheless \"8 weeks '
      + 'formally. Under 8 weeks: count it rather than repeat PPSV23 (expert opinion)\", because the '
      + 'remedy a floor implies \u2014 another polysaccharide dose \u2014 lowers responses rather than '
      + 'raising them. The INTERVAL is rr7203a1\'s, read live 2026-10-11: \"A minimum interval of 8 weeks '
      + 'can be considered for adults with an immunocompromising condition, a CSF leak, or a cochlear '
      + 'implant to minimize the time of risk\" \u2014 permission to vaccinate SOONER, never a bar to '
      + 'fall below. rr7203a1 says \"should be repeated\" 0 times and \"not be counted\" 0 times. See '
      + 'CLINICAL_SPEC.md \u00a7K.',
    // S15 (2026-10-16): this message used to end "and the recommended interval
    // is 1 year", hardcoded. That clause had to go, for two reasons:
    //
    //   1. It was wrong at 19–49, where 8 weeks IS the recommendation.
    //   2. Making it age-aware made it worse, not better. This row judges a
    //      dose by `ctx.ageAtDose` — the patient's age WHEN THE DOSE WAS
    //      GIVEN, which is right for a validity question. The recommendation
    //      card keys on their age NOW. For a 50-year-old whose PCV15 was given
    //      at 45 those differ, and the note then said "for an adult 19–49..."
    //      beside a card computed for a 50-year-old. Measured: 15 of the
    //      16,250 swept patients.
    //
    // So the floor states the floor, and says nothing about what is
    // recommended — that number has one home, the recommendation card, which
    // the clinician is already looking at. Duplicating it here is what let
    // this rule contradict itself three times.
    message: (ctx, anchor, min) => ({
      reason: `Given ${fmtSinceDays(anchor.date, ctx.doseDate)} the PCV15 dose of ${fmtDate(anchor.date)} — shorter than the ${fmtDays(PCV_PPSV23_MIN_INTERVAL_DAYS)} ACIP recommends for this patient. **Counted; no further PPSV23 indicated.**`,
      why: `${fmtDays(PCV_PPSV23_MIN_INTERVAL_DAYS)} is the shortest interval ACIP recommends after PCV15 for an immunocompromising condition, cochlear implant or CSF leak, and it is the one genuine adult minimum. The dose is still counted, because giving another PPSV23 lowers responses for some serotypes rather than raising them. Where more protection is wanted the next dose is a conjugate — PCV20 or PCV21 — not a second polysaccharide dose.`,
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
    grace: false,
    enforcement: 'recommendation',
    authority: 'CDC',
    source: 'OWNER RULING 2026-10-25 relaxed this row from a floor to a recommendation, and the authority '
      + 'moved with it. As a FLOOR it asserted something no source states \u2014 that an early dose stops '
      + 'counting \u2014 so it carried the owner\'s name (her clinical determination of 2026-10-11). As a '
      + 'RECOMMENDATION it asserts only the interval, which CDC states in words, so it is CDC\'s. That is '
      + 'Ruling F\'s relabelling of 2026-10-24, applied to the rest of the adult rows. CDSI v4.64 sets '
      + 'absMinInt = 0 days for every adult pneumococcal interval, which is the machine-readable form of '
      + 'the same point. Her adult table of 2026-10-25 gives the practical cutoff for COUNTING a dose in '
      + 'each sequence, and no adult sequence rejects one. This row is a PPSV23 following a PCV15 for an '
      + 'adult WITHOUT an immunocompromising condition, cochlear implant or CSF leak. CDC states \"at '
      + 'least 1 year after the PCV15 dose\" and names NO minimum for them. \u26a0\ufe0f THIS ROW WAS A '
      + 'FLOOR TWICE AND A RECOMMENDATION TWICE; 2026-10-25 IS THE LATEST. On the morning of 2026-10-24 '
      + 'she made it a recommendation (FAMILY 3); that afternoon, on a 60-year-old with no risk '
      + 'conditions (PCV15 2026-07-19, PPSV23 2026-10-11), she called the dose invalid twice and set out '
      + 'what is owed instead. Shown the same patient against her new table on 2026-10-25 she chose to '
      + 'count it, because the remedy a floor implies is a repeat PPSV23 and repeating one lowers '
      + 'responses. Both rulings are recorded in '
      + 'docs/archive/decision-2026-10-24-invalid-adult-dose-repeat-rule.md. The recommended interval is '
      + 'unchanged by all of this (S15, 2026-10-16: the 8 weeks is the recommendation only at 19-49, and '
      + 'only for an immunocompromising condition, cochlear implant or CSF leak). See CLINICAL_SPEC.md '
      + '\u00a7K.',
    message: (ctx, anchor, min) => ({
      reason: `Given ${fmtSince(anchor.date, ctx.doseDate)} the PCV15 dose of ${fmtDate(anchor.date)} — shorter than the ${min.words} CDC advises. **Counted; no further PPSV23 indicated.**`,
      why: `CDC states the ${min.words} after PCV15 as recommended timing and names no minimum for an adult without an immunocompromising condition, cochlear implant or CSF leak — for whom the shortest recommended gap is ${SHORTER_MINIMUM_WORDS}. The dose is counted, because giving another PPSV23 lowers responses for some serotypes rather than raising them. Where more protection is wanted the next dose is a conjugate — PCV20 or PCV21.`,
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
    grace: false,
    enforcement: 'recommendation',
    authority: 'CDC',
    source: 'OWNER RULING 2026-10-25 relaxed this row from a floor to a recommendation, and the authority '
      + 'moved with it. As a FLOOR it asserted something no source states \u2014 that an early dose stops '
      + 'counting \u2014 so it carried the owner\'s name (her clinical determination of 2026-10-11). As a '
      + 'RECOMMENDATION it asserts only the interval, which CDC states in words, so it is CDC\'s. That is '
      + 'Ruling F\'s relabelling of 2026-10-24, applied to the rest of the adult rows. CDSI v4.64 sets '
      + 'absMinInt = 0 days for every adult pneumococcal interval, which is the machine-readable form of '
      + 'the same point. Her adult table of 2026-10-25 gives the practical cutoff for COUNTING a dose in '
      + 'each sequence, and no adult sequence rejects one. This row is a PPSV23 following a PCV13 for an '
      + 'immunocompromising condition, cochlear implant or CSF leak. The INTERVAL is rr7203a1\'s, verified '
      + 'live 2026-10-11: \"the minimum recommended interval between PCV13 and PPSV23 administration is '
      + '>=8 weeks for adults with an immunocompromising condition, a CSF leak, or a cochlear implant and '
      + '>=1 year for adults without these conditions.\" Watch the vocabulary: \"minimum RECOMMENDED '
      + 'interval\" is the shortest recommended spacing, not the General Best Practices minimum that '
      + 'voids a dose. See CLINICAL_SPEC.md \u00a7K.',
    message: (ctx, anchor, min) => ({
      reason: `Given ${fmtSinceDays(anchor.date, ctx.doseDate)} the PCV13 dose of ${fmtDate(anchor.date)} — shorter than the ${fmtDays(PCV_PPSV23_MIN_INTERVAL_DAYS)} ACIP recommends for this patient. **Counted; no further PPSV23 indicated.**`,
      why: `${fmtDays(PCV_PPSV23_MIN_INTERVAL_DAYS)} is the shortest interval ACIP recommends after PCV13 for an immunocompromising condition, cochlear implant or CSF leak, and it is the one genuine adult minimum. The dose is still counted, because giving another PPSV23 lowers responses for some serotypes rather than raising them. Where more protection is wanted the next dose is a conjugate — PCV20 or PCV21.`,
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
    grace: false,
    enforcement: 'recommendation',
    authority: 'CDC',
    source: 'OWNER RULING 2026-10-25 relaxed this row from a floor to a recommendation, and the authority '
      + 'moved with it. As a FLOOR it asserted something no source states \u2014 that an early dose stops '
      + 'counting \u2014 so it carried the owner\'s name (her clinical determination of 2026-10-11). As a '
      + 'RECOMMENDATION it asserts only the interval, which CDC states in words, so it is CDC\'s. That is '
      + 'Ruling F\'s relabelling of 2026-10-24, applied to the rest of the adult rows. CDSI v4.64 sets '
      + 'absMinInt = 0 days for every adult pneumococcal interval, which is the machine-readable form of '
      + 'the same point. Her adult table of 2026-10-25 gives the practical cutoff for COUNTING a dose in '
      + 'each sequence, and no adult sequence rejects one. This row is a PPSV23 following a PCV13 for '
      + 'every other adult \u2014 the other half of rr7203a1\'s sentence, \">=1 year for adults without '
      + 'these conditions\". See CLINICAL_SPEC.md \u00a7K.',
    message: (ctx, anchor, min) => ({
      reason: `Given ${fmtSince(anchor.date, ctx.doseDate)} the PCV13 dose of ${fmtDate(anchor.date)} — shorter than the ${min.words} CDC advises. **Counted; no further PPSV23 indicated.**`,
      why: `CDC states the ${min.words} after PCV13 as recommended timing and names no minimum for an adult without an immunocompromising condition, cochlear implant or CSF leak — for whom the shortest recommended gap is ${SHORTER_MINIMUM_WORDS}. The dose is counted, because giving another PPSV23 lowers responses for some serotypes rather than raising them. Where more protection is wanted the next dose is a conjugate — PCV20 or PCV21.`,
    }),
  },
  {
    id: 'ADULT-PPSV23-AFTER-PPSV23',
    // ⚠️ `conjugateAlternativeAfterInvalid: true` USED TO SIT HERE and has been
    // removed, because it is only read in the evaluator's FLOOR branch and
    // this row is no longer a floor (owner ruling 2026-10-25, "count, note the
    // shortfall"). It existed for her ruling of 2026-10-24 (afternoon), which
    // kept the 5-year floor and asked for both options on the card with the
    // conjugate one emphasised — two dates, each with the rule it came from.
    //
    // NOTHING IS LOST BY REMOVING IT. With the dose counted there is no invalid
    // dose to measure a repeat from, and the conjugate option she wanted named
    // is already on the recommendation card with its own date: a 68-year-old
    // with two PPSV23 doses reads "PCV20 or PCV21 ≥5 years (shared clinical
    // decision-making)". A dead flag left in place would read as live
    // behaviour to the next session.
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
    grace: false,
    enforcement: 'recommendation',
    authority: 'CDC',
    source: 'OWNER RULING 2026-10-25 relaxed this row from a floor to a recommendation, and the authority '
      + 'moved with it. As a FLOOR it asserted something no source states \u2014 that an early dose stops '
      + 'counting \u2014 so it carried the owner\'s name (her clinical determination of 2026-10-11). As a '
      + 'RECOMMENDATION it asserts only the interval, which CDC states in words, so it is CDC\'s. That is '
      + 'Ruling F\'s relabelling of 2026-10-24, applied to the rest of the adult rows. CDSI v4.64 sets '
      + 'absMinInt = 0 days for every adult pneumococcal interval, which is the machine-readable form of '
      + 'the same point. Her adult table of 2026-10-25 gives the practical cutoff for COUNTING a dose in '
      + 'each sequence, and no adult sequence rejects one. \u26a0\ufe0f THIS IS THE ONE ADULT INTERVAL '
      + 'WITH DIRECT EVIDENCE BEHIND IT, and it still does not void a dose. rr7203a1, under \"Repeat '
      + 'PPSV23 administration\" (URL supplied by the owner 2026-10-25, '
      + 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10495181/): \"immune responses were lower with repeat '
      + 'PPSV23 than with the initial vaccination for certain serotypes when the interval between PPSV23 '
      + 'doses was <5 years, whereas no evidence of hyporesponsiveness was noted in studies that used an '
      + 'interval of >=5 years, an interval that has been recommended for adults with indications for >=2 '
      + 'PPSV23 doses.\" Her updated adult table has no row for this sequence; asked directly about a '
      + '68-year-old with COPD (PPSV23 2024, a second in 2026) she chose COUNT, NOTE THE SHORTFALL \u2014 '
      + 'because setting the dose aside would only invite a third, which is the harm the evidence '
      + 'describes, and two PPSV23 doses is the lifetime maximum. The interval is enforced on the DOSE '
      + 'PAIR, not on the risk row: whether a second PPSV23 was indicated at all is the recommendation '
      + 'engine\'s question. See CLINICAL_SPEC.md \u00a7K.',
    message: (ctx, anchor, min) => ({
      reason: `Given ${fmtSince(anchor.date, ctx.doseDate)} the previous PPSV23 dose of ${fmtDate(anchor.date)} — shorter than the ${min.words} advised between PPSV23 doses. **Counted; never give a third.**`,
      why: `This is the one adult interval with direct evidence behind it: immune responses to a repeat PPSV23 were lower than to the first dose for certain serotypes when the gap was under ${min.words}, and no hyporesponsiveness was seen at ${min.words} or more (ACIP, rr7203a1). The dose counts because setting it aside would only invite a third, which would deepen that effect; two PPSV23 doses is the lifetime maximum. Where more protection is wanted the next dose is a conjugate — PCV20 or PCV21.`,
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
      + 'stated interval whatever else is on the record, and the more specific rows above are '
      + 'ordered ahead of this row so they still win where they apply: a floor returns before it, '
      + 'and an unmet recommendation (the under-4-weeks note) keeps its sentence, because this '
      + 'row stops the walk without erasing what was collected (\u00a7K-NONE-KEEPS, 2026-10-31).',
    message: null,
  },

  // ── Recommendations: the dose counts, and carries a note ─────────────
  //
  // No grace on these, deliberately. The grace is CDC's rule for whether a
  // dose that missed a MINIMUM still counts; nothing is being voided here, so
  // a day short of the year is a day short.
  {
    id: 'ADULT-PPSV23-AFTER-PCV15-SHORTER-MINIMUM-USED',
    what: 'An adult aged 50+ whose PPSV23 used the 8-week option rather than waiting the recommended year',
    rulebook: 'adult',
    vaccine: 'PPSV23',
    products: null,
    from: 'lastPcv15',
    shorterMinimum: true,
    // S15 (2026-10-16): 50+ only. At 19-49 the 8 weeks IS the recommendation,
    // so this note told those patients they had fallen short of a year that
    // was never recommended to them — the A-P1-1 self-contradiction, one
    // surface along, exactly as the comment in evaluateDoseInterval() warns.
    shorterIsTheAdvice: false,
    interval: { months: ADULT_PPSV23_INTERVAL_MONTHS },
    grace: false,
    enforcement: 'recommendation',
    authority: 'CDC',
    source: 'mm7401a1 (ACIP, January 2025), >=50 row: PPSV23 "should be administered >=1 year after '
      + 'the PCV15 dose. A minimum interval of 8 weeks CAN BE CONSIDERED if PCV15 is used in adults '
      + 'with an immunocompromising condition, cochlear implant, or CSF leak." So for an adult 50+ '
      + 'the year is the advice and the 8 weeks is a choice; the app names the option and never '
      + 'substitutes it. The 19-49 band is a different row, below.',
    message: (ctx, anchor, min) => `Given ${fmtSince(anchor.date, ctx.doseDate)} the PCV15 dose. CDC recommends PPSV23 at least ${min.words} after PCV15 and names ${SHORTER_MINIMUM_ARTICLE} ${SHORTER_MINIMUM_ADJ} minimum that may be considered for an immunocompromising condition, cochlear implant or CSF leak — this dose met that minimum, so it counts.`,
  },
  // S15 (2026-10-16). The 19-49 half of the row above. For an adult 19-49 with
  // an immunocompromising condition, cochlear implant or CSF leak, mm7401a1
  // says "administer a single dose of PPSV23 >=8 weeks after the PCV15 dose" —
  // 8 weeks is the RECOMMENDATION, not a shortcut from one. A dose at or past
  // 8 weeks has met the advice in full, so there is nothing to tell the
  // clinician and this row is never flagged.
  //
  // It exists as a ROW rather than an age test inside the row above, per
  // CLAUDE.md: "Never add an age test that decides whether a rule may bite —
  // add a row instead."
  {
    id: 'ADULT-PPSV23-AFTER-PCV15-MEETS-SHORTER-ADVICE',
    what: 'An adult 19-49 with an immunocompromising condition, cochlear implant or CSF leak whose PPSV23 came >=8 weeks after PCV15 — the recommended interval for them',
    rulebook: 'adult',
    vaccine: 'PPSV23',
    products: null,
    from: 'lastPcv15',
    shorterMinimum: true,
    shorterIsTheAdvice: true,
    // Never-flagged rows state NO interval and NO grace — both fields would
    // only mislead a reader into thinking this row judges something. The
    // row that does judge these doses is
    // ADULT-PPSV23-AFTER-PCV15-SHORTER-MINIMUM, and it is unchanged.
    interval: null,
    grace: false,
    enforcement: 'none',
    authority: 'CDC',
    source: 'mm7401a1 (ACIP, January 2025), row "Adults aged 19-49 years with an immunocompromising '
      + 'condition, a CSF leak, or a cochlear implant": "If PCV15 is used, administer a single dose '
      + 'of PPSV23 >=8 weeks after the PCV15 dose." Never flagged because the dose met the '
      + 'recommendation; a shorter gap is still caught by the row above, '
      + 'ADULT-PPSV23-AFTER-PCV15-SHORTER-MINIMUM (a recommendation since 2026-10-25), whose note '
      + 'this row stops the walk without erasing (\u00a7K-NONE-KEEPS, 2026-10-31).',
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
    message: (ctx, anchor, min) => `Given ${fmtSince(anchor.date, ctx.doseDate)} the previous dose. For adults CDC advises at least ${min.words} between pneumococcal conjugate doses. This dose still counts.`,
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
      + 'states, so it under-flags. S14-4B and S14-4C (2026-10-12) then took the PCV20/PCV21 pairs '
      + 'away from it entirely — a PPSV23 recorded after, or at the same visit as, a counting '
      + 'PCV20/PCV21 is an extra dose and validate.js strips this row\'s advisory from it, because no '
      + 'PPSV23 follows those products at ANY interval. WHAT IS LEFT is this row\'s real job, and it '
      + 'was measured on the 16,250-patient grid rather than assumed: 324 patients reach the row in 9 '
      + 'history shapes, and 180 of them (5 shapes) are anchored on a PCV dose whose PRODUCT THE '
      + 'CLINICIAN COULD NOT NAME (the "Unknown PCV product" option). No product-keyed row can select '
      + 'on an unnamed product, so no enumerated row will ever name those pairs, and CDC\'s generic '
      + '≥1-year sentence is exactly the right thing to say about them. An earlier version of this '
      + 'comment claimed the row was "reachable only by a SAME-DAY pair"; that was never true, and '
      + 'it is recorded here because a row whose purpose is mis-stated is a row someone deletes.',
    message: (ctx, anchor, min) => `Given ${fmtSince(anchor.date, ctx.doseDate)} the previous pneumococcal conjugate dose. For adults CDC advises at least ${min.words} between a conjugate dose and PPSV23. This dose still counts.`,
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
  if (rule.shorterIsTheAdvice !== undefined
    && rule.shorterIsTheAdvice
      !== adultPpsvShorterIntervalIsTheAdvice(ctx.ageAtDose, ctx.riskIds)) return false;
  return true;
}

// Some rows name a CDC prior-vaccine row that only holds while the anchor is
// still the patient's MOST RECENT dose of its kind — "previously received
// PCV13" stops describing someone once they have had a PCV15 as well. Checked
// after the anchor resolves, because it is a fact about the anchor, not the
// judged dose.
function anchorAllowed(rule, anchor, ctx) {
  if (rule.anchorMustBeProduct && anchor.product !== rule.anchorMustBeProduct) return false;
  if (rule.anchorCounted != null) {
    // The anchor is a fresh {date, ageAtDose, product} record (validate.js
    // `anchorOn`), so "did it count" is answered by DATE against this stream's
    // counting doses — the list `ctx` already carries for every other row.
    const own = rule.vaccine === 'PPSV23' ? ctx.priorPpsv23 : ctx.priorPcv;
    const counted = (own ?? []).some((d) => d.date === anchor.date);
    if (counted !== rule.anchorCounted) return false;
  }
  return true;
}

// W1 (2026-10-11): the earliest date a floor's dose could have validly been
// given — anchor date + the rule's own interval, minus the 4-day grace that
// `intervalMet` already extends in the same direction. Lets validate.js say
// "the next dose is due on or after <date>" instead of "repeat this dose",
// which is wrong for a dose that was never missing, only early.
function earliestValidDate(rule, anchor, ctx) {
  // Grace ON. This question is ABOUT the grace: "would the dose the patient
  // already received have counted?" — and a dose up to 4 days early does.
  return intervalFrom(rule, anchor, ctx, anchor.date, { grace: true });
}

// RULING D (owner, 2026-10-23) — when the REPEAT of this rejected dose may be
// given: the same rule and the same interval, measured from the dose that was
// actually given rather than from the one before it. "The repeat dose should
// be spaced from the invalid dose by the minimum interval."
//
// It is deliberately a sibling of `earliestValidDate` and not a replacement.
// The two answer different questions and the app says both out loud:
//
//   earliestValidDate  when THIS dose would have been valid  (anchor + gap)
//   repeatDueDate      when the REPEAT may be given          (this dose + gap)
//
// They were conflated in one sentence until now. `validate.js` printed "the
// next dose in this series is due on or after <earliestValidDate>" — a date
// computed for the dose already given — so a 7-month-old's chip read
// "2026-10-15" beside a card reading "eligible Dec 7, 2026". Two dates for one
// dose on one screen, which is the shape of the P0 bug fixed the same day.
//
// OWNER RULING 2026-10-24 — and the grace is OFF here. Her words, answering
// the first question PR #83 left open: "I don't need the app to recommend
// dates within the 4 day grace period. Just the routine date next dose is due
// with a comment on the earliest date it could be given."
//
// This is `intervals.js`'s own standing line, which Ruling D had crossed
// without anyone noticing: the grace is a VALIDITY rule and "NOT the
// scheduler… Granting grace there would make the app advertise a date 4 days
// early and actively advise giving doses before the minimum." `repeatDueDate`
// is the only graced date the app ever printed as advice — it put "due on or
// after 2026-11-05" on a card whose own note already said "can be given from
// 2026-11-09 … the minimum interval of 4 weeks". Same dose, two earliest
// dates, four days apart.
//
// The app therefore advises the 9th and still ACCEPTS the 5th, exactly as it
// does everywhere else. Guard:
// regression-2026-10-24-advice-never-inside-the-four-day-grace.test.js.
// ─────────────────────────────────────────────────────────────────────────
// OWNER RULING 2026-10-24 (afternoon) — WHAT AN INVALID ADULT DOSE LEAVES
// OWING, AND WHEN.
//
// Her four steps, verbatim and in order:
//
//   1. "Decide what is being repeated. Base this on the valid history."
//   2. "Start the clock at the invalid dose. Under CDC's rule, every interval
//       runs from the most recent dose given, valid or not."
//   3. "Use the interval for the prior vaccine type, counted from that invalid
//       dose."
//   4. "Check the earlier valid doses too... In practice, use whichever date
//       comes later."
//
// STEP 1 HAS A CONSTANT ANSWER FOR ADULTS, and that is what makes this
// tractable here rather than in recommend.js. Asked what is owed after an
// invalid dose in each direction, she gave the same product both times:
//
//   invalid PPSV23 after a PCV15  -> "a single PCV20 or PCV21 ... >=1 year
//     after the PPSV23. That dose completes the series." NOT a repeat PPSV23,
//     because "ACIP's only PPSV23 -> PPSV23 interval is >=5 years" and
//     "repeating polysaccharide doses less than 5 years apart is linked to
//     hyporesponsiveness".
//   invalid conjugate after a PPSV23 -> "PCV20 or PCV21 is preferable to
//     another PCV15"; "PCV15 adds nothing over the patient's prior dose."
//
// So the owed dose is ALWAYS a conjugate, and the only thing the interval
// depends on is which vaccine the clock is anchored on. That is why this needs
// no view of the patient's history beyond what `ctx` already carries, and why
// it must NOT be re-derived in recommend.js.
//
// ⚠️ THE ERROR THIS REPLACES. `repeatDueDate` used to spend the interval of
// the rule that REJECTED the dose. For the three healthy patients she worked
// through, the rejecting rule's interval and the owed dose's interval are both
// 1 year, so the answer came out right by coincidence. For her asplenic
// patient it did not: the rejecting row is the 8-week IC minimum, so the chip
// advised repeating a PPSV23 on 2026-12-06 — the wrong vaccine on the wrong
// date. Her verdict on exactly that: "Why 12/6/26 ... is not appropriate: the
// 8-week interval applies only to PCV15 -> PPSV23. It does not apply to
// PPSV23 -> PPSV23."
//
// CHILDREN ARE DELIBERATELY NOT HERE. Every word above is adult-shaped, and
// she has said separately that "pediatric intervals don't follow the adult
// 1-year rule". A child keeps the original arithmetic until she rules; the
// boundary is `rulebookOf(ctx.ageAtDose)` and it is asserted, not assumed.
// See docs/archive/decision-2026-10-24-invalid-adult-dose-repeat-rule.md.
// ─────────────────────────────────────────────────────────────────────────

/**
 * The products an invalid adult pneumococcal dose leaves owing. One dose of
 * either completes the series, whichever vaccine was given early.
 */
export const ADULT_OWED_AFTER_INVALID_DOSE = ['PCV20', 'PCV21'];

/**
 * How long after a dose of `priorVaccine` the owed PCV20/PCV21 may be given,
 * and WHICH of the owner's two citations states it.
 *
 * ONE NUMBER FOR EVERY ADULT: a year. Asked directly whether the shorter
 * interval should apply to an immunocompromised adult here, she answered
 * "can you use 1 year for adults and 8 weeks for pediatrics with risks?" — so
 * the adult clock is flat and the 8 weeks stays where it is published, in the
 * child schedule. Children are not routed through this function at all.
 *
 * ⚠️ THE TWO LEGS CARRY THE SAME NUMBER AND DIFFERENT STANDING. That is why
 * this returns a `basis` as well as an interval: her instruction of 2026-10-24
 * was "make it clear that the 8 week interval is pediatric data with nothing
 * clarifying adults. Cite the reference. State using 1 year is an
 * interpretation from ACIP minimum interval for adults between PCV13 and the
 * next conjugate. Cite this too." A card cannot honour that without knowing
 * which leg it is standing on.
 *
 *   after a PPSV23 -> STATED. CDC adult notes, read live 2026-10-24: "1 dose
 *     PCV15 or 1 dose PCV20 or 1 dose PCV21 at least 1 year after the last
 *     PPSV23 dose." Every adult risk group; CDSi v4.64 agrees, giving 1 year
 *     in this direction even in its immunocompromised series, with no 8-week
 *     option anywhere. Her words: ">=1 year for every risk group. There is no
 *     8-week option."
 *
 *   after a conjugate -> INTERPRETED. CDC states exactly one adult
 *     conjugate-to-conjugate interval — "1 dose PCV20 or 1 dose PCV21 at
 *     least 1 year after the last PCV13 dose" — and this applies it to a
 *     conjugate that must be REPEATED, which CDC does not discuss. It is
 *     generalised from PCV13 to any conjugate for the same reason.
 *
 * ⚠️ NOT 8 WEEKS, AND THE REASON IS ON THE RECORD. A flat 8-week second clock
 * was built first and she declined it: the only 8-week conjugate-to-conjugate
 * figure is paediatric, from CDC's catch-up table whose own scope line reads
 * "Children age 4 months through 6 years". Her ground for preferring the year
 * was not caution for its own sake — "Conservative should mean meeting every
 * published interval, not waiting the longest" — and for an adult the year is
 * published where the 8 weeks is not.
 */
function adultIntervalToOwedConjugate(priorVaccine) {
  return {
    interval: { months: ADULT_ADVISED_PCV_GAP_MONTHS },
    basis: priorVaccine === 'PPSV23' ? 'ppsv23ToConjugate' : 'conjugateToConjugate',
  };
}

/**
 * The most recent dose that COUNTED, on or before the judged dose — step 4's
 * anchor. Read from `ctx.priorPcv` / `ctx.priorPpsv23`, which the walk has
 * already filtered to counting doses, so a rejected earlier dose cannot
 * become a clock of its own.
 */
function lastCountingDose(ctx) {
  const last = (list, vaccine) => {
    const dated = (list ?? []).filter((d) => d?.date);
    return dated.length ? { date: dated[dated.length - 1].date, vaccine } : null;
  };
  const candidates = [last(ctx.priorPcv, 'PCV'), last(ctx.priorPpsv23, 'PPSV23')].filter(Boolean);
  if (!candidates.length) return null;
  return candidates.reduce((a, b) => (b.date > a.date ? b : a));
}

/**
 * Both clocks, step 4's `max`, and which leg won — computed in ONE place so
 * the date a card prints and the date a chip prints cannot be two readings.
 *
 * No grace on either, for the reason the 2026-10-24 morning ruling gave about
 * this same date: the grace decides what the app ACCEPTS, never what it
 * ADVISES.
 *
 * `boundBy` is not decoration. It is how a card explains itself, and it is how
 * a test can see the `max` actually doing something rather than one leg always
 * winning by construction.
 */
function adultRepeatClocks(ctx) {
  const invalidLeg = adultIntervalToOwedConjugate(ctx.vaccine);
  const fromInvalid = applyIntervalFrom(ctx.doseDate, invalidLeg.interval);
  const valid = lastCountingDose(ctx);
  const validLeg = valid ? adultIntervalToOwedConjugate(valid.vaccine) : null;
  const fromValid = valid ? applyIntervalFrom(valid.date, validLeg.interval) : null;
  const validWins = fromValid != null && fromValid > fromInvalid;
  return {
    dueDate: validWins ? fromValid : fromInvalid,
    boundBy: validWins ? 'lastValidDose' : 'invalidDose',
    basis: validWins ? validLeg.basis : invalidLeg.basis,
    anchoredOnInvalid: ctx.doseDate,
    anchoredOnValid: valid?.date ?? null,
  };
}

function adultRepeatDueDate(ctx) {
  const { dueDate } = adultRepeatClocks(ctx);
  return dueDate;
}

/**
 * Both clocks and the owed products, for a caller that has to SAY them rather
 * than just use the date — the recommendation card. Exported so the card and
 * the dose chip read one answer; `recommend.js` must never recompute either
 * clock.
 */
export function adultRepeatAfterInvalidDose(ctx) {
  if (!ctx?.doseDate || rulebookOf(ctx.ageAtDose) !== 'adult') return null;
  const clocks = adultRepeatClocks(ctx);
  return { ...clocks, owedProducts: ADULT_OWED_AFTER_INVALID_DOSE };
}

function repeatDueDate(rule, anchor, ctx) {
  if (!ctx.doseDate) return null;
  // An ADULT dose follows the owner's ruling above: the clock length comes
  // from the pair (vaccine before -> PCV20/PCV21 owed), not from this rule.
  if (rulebookOf(ctx.ageAtDose) === 'adult' && rule.id !== 'ADULT-PPSV23-AFTER-PPSV23') return adultRepeatDueDate(ctx);
  return intervalFrom(rule, anchor, ctx, ctx.doseDate);
}

// One reading of the rule's interval, applied to whichever date is handed in —
// so the two dates above can never drift apart by using different arithmetic.
// The grace is a PARAMETER and not a second reading: the two callers ask
// different questions of the same interval (see each one's comment), and the
// only difference between them must stay this single flag.
function intervalFrom(rule, anchor, ctx, from, { grace: allowGrace = false } = {}) {
  const grace = allowGrace && rule.grace ? GRACE_DAYS : 0;
  const interval = rule.interval.daysFrom
    ? { days: rule.interval.daysFrom(anchor, ctx) }
    : rule.interval;
  return applyIntervalFrom(from, interval, grace);
}

// The arithmetic itself, on a bare `{months}` or `{days}` interval and nothing
// else. Split out of `intervalFrom` so the invalid-dose clocks below measure
// with the SAME code as every other date this file prints — a second
// implementation of "add an interval to a date" is how the P0 bug of
// 2026-10-23 came to tell one clinician two different dates for one dose.
function applyIntervalFrom(from, interval, graceDays = 0) {
  if (interval.months != null) {
    return addDays(addCalendarMonths(from, interval.months), -graceDays);
  }
  return addDays(from, interval.days - graceDays);
}

// Is the gap long enough? `null` interval (a never-flagged row) is always met.
function intervalMet(rule, ctx, anchor) {
  if (!rule.interval) return true;
  if (rule.interval.months != null) {
    return rule.grace
      ? calendarIntervalMeetsMinimum(anchor.date, rule.interval.months, ctx.doseDate)
      : calendarIntervalElapsed(anchor.date, rule.interval.months, ctx.doseDate);
  }
  const minDays = rule.interval.daysFrom ? rule.interval.daysFrom(anchor, ctx) : rule.interval.days;
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
 *   | {kind:'recommendation', ruleId:string, authority:string, reasons:string[],
 *      whys:string[]}}
 */
export function evaluateDoseInterval(ctx) {
  const book = rulebookOf(ctx.ageAtDose);
  // No date, or no age to place the dose in a schedule → no timing verdict.
  // Never a silent pass that LOOKS like a clean one: validate.js says in words
  // that an undated dose cannot have its intervals checked.
  if (!book || !ctx.doseDate) return null;

  // Has an enumerated (non-catch-all) row already spoken for this dose?
  let namedByRule = false;
  // OWNER DECISION 2026-10-24, *"mention both gaps"*. An unmet RECOMMENDATION
  // no longer ends the walk; its sentence is collected here and the walk goes
  // on, so a dose that misses two advised gaps is told about both. The
  // 70-year-old who forced it: PPSV23 2024-06-01, PCV13 2026-01-15, PCV20
  // 2026-08-15 — inside the 1-year conjugate gap AND inside the 5-year gap
  // after her PPSV23, and until now told only about the first.
  //
  // An unmet FLOOR still returns immediately, and DISCARDS anything collected
  // before it. That is not an oversight: every recommendation sentence ends by
  // saying the dose is counted, which would contradict a rejection printed
  // beside it. The floor is the headline; the advice is moot.
  const advisories = [];
  for (const rule of DOSE_INTERVAL_RULES) {
    if (!ruleApplies(rule, ctx, book)) continue;
    const anchor = ANCHORS[rule.from](ctx);
    if (!anchor || !anchor.date || anchor.date > ctx.doseDate) continue;
    if (!anchorAllowed(rule, anchor, ctx)) continue;

    // A matching never-flagged row stops the walk — that is its whole job.
    // It does NOT erase what the walk already collected (§K-NONE-KEEPS,
    // 2026-10-31): since "mention both gaps" an unmet recommendation above it
    // no longer returns, so `return null` here threw that sentence away. An
    // adult 19-48 with HIV whose PPSV23 came 4 weeks after PCV15 read as
    // routine, while the same dose at 49 carried the note. The rows below
    // that stop the walk say nothing themselves; the sentences above stand.
    if (rule.enforcement === 'none') break;

    // A catch-all only speaks for a pair NO enumerated row named. Without
    // this, the generic note talks over the specific rule and gets the number
    // wrong: an immunocompromised adult whose PPSV23 came 10 weeks after PCV13
    // met the 8-week interval rr7203a1 states FOR THEM, and was then told
    // "CDC advises at least 1 year" by a row that cannot see their risk class.
    // That is the A-P1-1 mistake — one flat interval quoted at every adult —
    // reappearing one rule along.
    if (rule.catchAll && namedByRule) continue;
    if (intervalMet(rule, ctx, anchor)) {
      namedByRule = namedByRule || !(rule.catchAll || rule.advisoryOnly);
      continue;
    }

    // The fourth argument is the OPTIONAL REPEAT date (owner ruling
    // 2026-10-25), and it exists so a message never computes a date. Same
    // arithmetic as `repeatDueDate`'s child branch and the same grace
    // decision: `intervalFrom` without `{ grace: true }`, because the ruling
    // of 2026-10-24 keeps every ADVISED date outside the 4-day grace.
    const msg = rule.message(
      ctx, anchor, intervalWords(rule, anchor, ctx),
      // `optionalRepeatInterval` lets a row advise one gap and offer the
      // repeat at another — the adult conjugate rows advise a year and offer
      // the repeat at 8 weeks. Still ONE arithmetic path (`intervalFrom`), so
      // a message never computes a date.
      rule.optionalRepeat
        ? intervalFrom(
          rule.optionalRepeatInterval ? { ...rule, interval: rule.optionalRepeatInterval } : rule,
          anchor, ctx, ctx.doseDate,
        )
        : null,
    );
    if (rule.enforcement !== 'floor') {
      // An unmet enumerated row HAS spoken for this dose, so the catch-all
      // must stay quiet even though the walk continues past it — otherwise
      // the generic "CDC advises at least 1 year" note talks over the
      // specific row, which is the A-P1-1 mistake the block above describes.
      // An `advisoryOnly` row is excluded: it adds a constraint rather than
      // giving the pair its disposition, so the pair still needs naming.
      namedByRule = namedByRule || !(rule.catchAll || rule.advisoryOnly);
      // A recommendation's `message` may return a plain string (one sentence
      // on the chip, nothing behind the disclosure) or `{ reason, why }` —
      // the short clinical line and the rationale, per the owner's request of
      // 2026-10-24 for MeningoVax's abbreviated-and-expandable shape.
      advisories.push({
        ruleId: rule.id,
        authority: rule.authority,
        reason: typeof msg === 'string' ? msg : msg.reason,
        why: typeof msg === 'string' ? null : (msg.why ?? null),
      });
      continue;
    }
    {
      return {
        kind: 'floor', ruleId: rule.id, authority: rule.authority,
        reasons: msg.reasons, detail: msg.detail,
        earliestValidDate: earliestValidDate(rule, anchor, ctx),
        repeatDueDate: repeatDueDate(rule, anchor, ctx),
        // The owner's emphasised alternative, where a row asks for it. The
        // date comes from the SAME clocks as every other repeat date in this
        // file — validate.js must never compute it.
        conjugateAlternative: rule.conjugateAlternativeAfterInvalid
          ? adultRepeatAfterInvalidDose(ctx)
          : null,
      };
    }
  }
  if (advisories.length) {
    return {
      kind: 'recommendation',
      // The FIRST unmet row names the verdict, as it always did — so
      // `intervalRuleId`, which the corpora and several guards record, is
      // unchanged for every dose that misses exactly one gap.
      ruleId: advisories[0].ruleId,
      authority: advisories[0].authority,
      reasons: advisories.map((a) => a.reason),
      // One entry per sentence that HAS a rationale, in the same order. The
      // chip's disclosure shows these; a row with nothing to expand adds
      // nothing, so a dose whose rules are all plain strings has no toggle.
      whys: advisories.map((a) => a.why).filter(Boolean),
    };
  }
  return null;
}

/** Every rule id, for the drift-guard test. */
export const RULE_IDS = DOSE_INTERVAL_RULES.map((r) => r.id);
