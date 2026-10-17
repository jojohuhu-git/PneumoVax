// ─────────────────────────────────────────────────────────────────────────
// recommend.js — the PneumoVax recommendation engine.
//
// Pure function. Given a patient (age, risks, PCV history, PPSV23 history),
// returns the current pneumococcal recommendations (PCV and PPSV23 streams).
//
// It returns NO recommendations at all for one group: transplant / CAR-T /
// B-cell patients, who get `excluded: true` and the stop message. That is the
// 2026-10-16 owner decision; until then the transplant tick printed a
// four-dose advisory recipe of its own, which was corrected five times across
// the two apps in five weeks. See
// docs/archive/plan-2026-10-16-transplant-hard-stop-both-apps.md.
//
// Every clinical rule is traceable to a citation key in src/data/refs.js and to
// a section of CLINICAL_SPEC.md. Verified live 2026-06-06 against CDC child &
// adult schedule notes, immunize.org p2016 (Tables 1–5), the PCV7-not-counted
// article, mm7401a1 (≥50 expansion), and mm7336a3 (PCV21).
//
// Design rule (ported from vaxapp/MeningoVax): all clinical logic and product
// validity live HERE; the UI consumes pre-built recs. No clinical logic in
// components.
// ─────────────────────────────────────────────────────────────────────────

import { resolveRefs, cite, REFS } from '../data/refs.js';
import {
  RISK_BY_ID,
  hasExclusion,
  hasIC,
  hasAnyRisk,
  hasSpecial,
  adultPpsvRecommendedInterval,
  adultPpsvShorterMinimumOffered,
  ADULT_PPSV23_SHORTER_MINIMUM_WEEKS,
  pedsRiskRowClass,
  pedsRiskIds,
} from '../data/riskFactors.js';
import { productByKey, pcvRecBrands } from '../data/brands.js';
import { todayISO, addDays, daysBetween, intervalElapsed, addCalendarMonths, DAYS } from './dateUtils.js';
import { dobToAgeMonths } from './format.js';
import { analyzeBoth } from './validate.js';
import { ageAtDoseMonths } from './patientAge.js';
import { pcvNextDoseMinIntervalDays, intervalPhrase } from './intervals.js';
import { ADULT_SCHED_MIN_M, ROUTINE_ADULT_MIN_M } from './scheduleConstants.js';

// Age bands (months)
// y18 is the ADULT SCHEDULE boundary (228 = 19y), not the PCV21 product gate (216 = 18y).
// See scheduleConstants.js for the authoritative values and distinction.
// S6-1 (2026-10-13): y50 is shared too — format.js's displayed age band had its own
// copy of 600. y65 (780) stays a literal here because this table is its only home in
// the app; give it a second reader and it belongs in scheduleConstants.js as well.
// S6-3 (2026-10-13): five entries were deleted from here — `m2`, `m16`, and the
// three aliases `y2` (= m24), `y5` (= m60) and `y6` (= m72). All five were
// referenced nowhere in the app. The aliases were the real hazard: a reader
// could not tell whether `y2` and `m24` were one rule written twice or two
// rules that merely share a number today, so changing "the 2-year threshold"
// meant guessing which name it travels under — and updating one and not the
// other leaves the engine holding two opinions about the same age.
// regression-s6-3-no-dead-age-bands.test.js now fails on any unused entry or
// any two entries holding the same number.
const M = {
  m7: 7, m12: 12, m24: 24, m60: 60, m72: 72,
  y18: ADULT_SCHED_MIN_M, y50: ROUTINE_ADULT_MIN_M, y65: 780,
};

const WK8 = DAYS.weeks(8);   // 56
const WK4 = DAYS.weeks(4);   // 28
// A-P2-11 (S10, 2026-10-10): the year-and-longer gaps are counted in CALENDAR
// months, not fixed day counts. CDC Adult and Child Schedule Notes, "Additional
// Information", fetched live 2026-10-10: "For calculating intervals between
// doses, 4 weeks = 28 days. Intervals of >=4 months are determined by calendar
// months." DAYS.years(1) is 365, a day short across a leap year, and
// DAYS.years(5) is 1826, a day short of some five-calendar-year spans — so the
// "eligible on" date printed on the card could be a day or two early.
// Week-based minimums above stay as exact day counts, which is the other half
// of the same sentence.
const MO12 = 12;   // "at least 1 year"
const MO60 = 60;   // "at least 5 years"

// ── The WORDS for those intervals (S6 second half, 2026-10-15) ───────────
//
// Derived from the same constants that drive the dates, so a change to a
// number can no longer leave the sentence beside it stating the old one. That
// drift was real and latent: setting ADULT_PPSV23_INTERVAL_MONTHS to 6 made a
// card read "PPSV23 (≥1 year after PCV15)" above its own eligible-on date of
// six months later. Written up in intervals.js and guarded by
// __tests__/regression-s6-5-interval-prose-one-home.test.js.
//
// Named for the ROLE each gap plays, never for its value: a constant called
// EIGHT_WEEKS deriving from WK8 would start lying the moment WK8 moved, which
// is this same bug one level up.
//
// Three names rather than two, although MO12 and MO60 are each ALSO the value
// of a constant in intervals.js / riskFactors.js. They are kept apart on
// purpose — the adult PCV15→PPSV23 year (ADULT_PPSV23_INTERVAL_MONTHS), the
// adult PCV13→PCV20/21 year (MO12) and the PPSV23 revaccination five years
// (PPSV23_REVACC_MIN_MONTHS) are different CDC rows that happen to share a
// number today, and collapsing them is the mistake CLAUDE.md forbids for the
// three schedule constants.
const PNEUMO_GAP_WORDS = intervalPhrase({ days: WK8 });    // the 8-week gap
const ADULT_GAP_WORDS = intervalPhrase({ months: MO12 });  // the 1-year gap
const LONG_GAP_WORDS = intervalPhrase({ months: MO60 });   // the 5-year gap

// ── rec() helper ──────────────────────────────────────────────────────────
function rec(o) {
  return {
    vaccine: o.vaccine,                 // 'PCV' | 'PPSV23'
    status: o.status,                   // due | catchup | risk-based | shared-decision | complete | not-indicated | deferred
    doseLabel: o.doseLabel,
    dueToday: !!o.dueToday,
    earliestNextDate: o.earliestNextDate ?? null,
    minIntervalDays: o.minIntervalDays ?? null,
    // Set instead of minIntervalDays when CDC states the gap in calendar
    // months/years (A-P2-11). Exactly one of the two is non-null.
    minIntervalMonths: o.minIntervalMonths ?? null,
    brands: o.brands ?? [],
    note: o.note,
    // P6-3: one cite() object per literal "[c]" in `note`, in order. RecCard
    // assigns the visible [N] at render time, so nothing here hardcodes a
    // number. A note with no "[c]" leaves this empty and renders as before.
    noteCites: o.noteCites ?? [],
    // DEAD since 2026-10-16: the deleted post-transplant advisory was the one
    // caller that ever set this, so it is now always false. Left in place on
    // purpose rather than ripped out in the same commit as a clinical change:
    // `test-grid.js` prints it into both corpora, so deleting it would move
    // every row and bury the 1,334 patients this commit is measuring. Its
    // "Advisory" pill in RecCard.jsx is likewise unreachable. Remove the flag,
    // the pill and the corpus column together, as their own change.
    advisory: !!o.advisory,
    // Series shape for the recorded-dose list's "Primary series" / "Boosters"
    // headings (owner decision 2026-09-15). Both null on cards whose total
    // counts a DIFFERENT set of doses than the list displays -- the list then
    // renders ungrouped rather than showing a denominator that doesn't match.
    seriesTotal: o.seriesTotal ?? null,
    primaryTotal: o.primaryTotal ?? null,
    citations: resolveRefs(o.refs ?? []),
  };
}

// Merge risk-driven ref keys with defaults, de-duplicated, preserving order.
//
// N6 (owner-reported 2026-10-16). `rulebook` is the schedule the CARD is
// written from — 'child' or 'adult' — and a risk condition only contributes
// the sources written for that schedule, plus the age-neutral ones. Each
// source declares where it belongs in `refs.js`; this function never decides
// it, so a new source cannot be added without saying.
//
// WHY. Most risk conditions exist at every age and so list BOTH CDC pages.
// Without this filter the whole list reached whichever card was being built,
// and a 55-year-old smoker's card cited the child schedule (13 of 17
// conditions did it one way; 12 of 17 did the mirror). The `defaults` are the
// card's own choice and are never filtered — a card that asks for a source
// has already decided it belongs there.
//
// This is NOT P3-9b's filter and does not replace it. That one strips
// `adultOnly` ticks so an adult-only condition cannot route a child to the
// wrong PATHWAY; it is the right answer to a different question, and it left
// this hole because a condition present at every age is not `adultOnly`.
//
// EXPORTED FOR TEST, and here is the honest reason. No risk condition shipping
// today carries an 'any' source that reaches a card: the only one that lists
// an age-neutral source is B-cell depleting / CAR-T therapy, which is an
// EXCLUSION and builds no standard card at all. So the `'any'` branch below
// cannot be reached end-to-end, and a mutation that deletes it leaves the
// whole suite green (measured: 1026/1026). It is kept, not deleted, because
// the day someone adds an age-neutral source to a risk condition it must not
// vanish — so the branch is tested directly instead of pretended about.
export function collectRefs(riskIds, defaults, rulebook) {
  const out = [];
  for (const id of riskIds) {
    for (const k of RISK_BY_ID[id]?.refs ?? []) {
      const book = REFS[k]?.rulebook;
      if (rulebook && book && book !== 'any' && book !== rulebook) continue;
      if (!out.includes(k)) out.push(k);
    }
  }
  for (const k of defaults) if (!out.includes(k)) out.push(k);
  return out;
}

// ── PCV history summary helpers ───────────────────────────────────────────
// `pcvDoses` here is the EFFECTIVE list (PCV7 already excluded by validate.js).
// `am`/`today` let us bucket each dated dose by the age it was given — matching
// the age-band model CDC PneumoRecs uses (before 12mo / 12–23mo / 24–71mo / ≥6y).
// Undated doses can't be banded; they're counted in `undated` and the total only.
function summarizePcv(pcvDoses, am = 0, today = null, dob = null) {
  const products = pcvDoses.map((d) => d.product).filter(Boolean);
  const has = (k) => products.includes(k);
  const hasPCV20 = has('PCV20');
  const hasPCV21 = has('PCV21');
  const hasPCV15 = has('PCV15');
  const hasPCV13 = has('PCV13');
  // A series is "complete-by-product" if it includes a PCV20 (any age) or PCV21 (adult).
  const includesCompleting = hasPCV20 || hasPCV21;
  // The most recent dose's date (for interval anchoring).
  const lastDated = [...pcvDoses].reverse().find((d) => d.date) || null;

  // Age-banded counts (months at administration), from dated doses only.
  // before7 / m7to11 split the infant band because p2016 Table 1 keys its rows
  // on it ("1 or 2 before age 7 months" vs "1 at age 7 months or older") and
  // CDC Catch-up Table 2 keys the dose 2->3 interval on it too (P0-2). Both
  // are DATED-ONLY; see the undated policy where the ladder consumes them.
  const band = { before7: 0, m7to11: 0, before12: 0, m12to23: 0, m24to71: 0, ge72: 0, undated: 0 };
  for (const d of pcvDoses) {
    if (!d.date || !today) { band.undated += 1; continue; }
    // P3-3 (S10): measured from the birthday when one is on file, instead of
    // subtracting two spans counted on different rulers. These bands decide HOW
    // MANY doses a child needs, so a fraction of a month moved the dose count in
    // both directions — a baby dosed on their 7-month anniversary read as 6.97.
    const ageAtDose = ageAtDoseMonths(d, { dob, ageMonths: am }, today);
    if (ageAtDose < M.m12) {
      band.before12 += 1;
      if (ageAtDose < M.m7) band.before7 += 1;
      else band.m7to11 += 1;
    } else if (ageAtDose < M.m24) band.m12to23 += 1;
    else if (ageAtDose < M.m72) band.m24to71 += 1;
    else band.ge72 += 1;
  }
  // Doses "by 24 months" (p2016 Table 4 rows 1/2 split). Undated doses are folded
  // in here — an undated historical dose is assumed to be an infant dose.
  band.before24 = band.before12 + band.m12to23 + band.undated;
  // Doses given at/after 24 months (progress toward the at-risk 2-dose catch-up).
  // Dated only — we never ASSUME an undated dose was a ≥24mo catch-up dose.
  band.ge24 = band.m24to71 + band.ge72;

  // A completing dose (PCV20/PCV21) that we CANNOT prove was given before 24mo —
  // i.e. undated, or dated at ≥24mo. Used by the healthy-child completeness check:
  // a single PCV20 dated in infancy does NOT complete (case P09), but an undated
  // one gets the benefit of the doubt (preserves prior behavior).
  const hasUndatedCompleting = pcvDoses.some(
    (d) => (d.product === 'PCV20' || d.product === 'PCV21') && !d.date,
  );

  return {
    count: pcvDoses.length,
    products,
    hasPCV20, hasPCV21, hasPCV15, hasPCV13,
    includesCompleting,
    hasUndatedCompleting,
    lastDate: lastDated?.date || null,
    // Age in months at the dose `lastDate` names — the anchor CDC Catch-up
    // Table 2 keys its intervals on. Derived from `lastDated` rather than
    // counted in the loop above so that the interval's key and the interval's
    // anchor date can never refer to different doses. null when undated.
    lastAgeAtDose: lastDated && today
      ? ageAtDoseMonths(lastDated, { dob, ageMonths: am }, today)
      : null,
    band,
  };
}

// Most recent of two ISO date strings (either may be null).
function mostRecent(a, b) {
  const dates = [a, b].filter(Boolean).sort();
  return dates.length ? dates[dates.length - 1] : null;
}

// Build a "due now or eligible later" pair from an anchor date + interval.
function dueState(anchorDate, intervalDays, today) {
  if (!anchorDate) return { dueToday: true, earliestNextDate: null };
  const elapsed = intervalElapsed(anchorDate, intervalDays, today);
  return {
    dueToday: elapsed,
    earliestNextDate: elapsed ? null : addDays(anchorDate, intervalDays),
  };
}

// The same, for an interval CDC states in months or years (A-P2-11). The
// anniversary itself counts as elapsed: "at least 1 year after" is satisfied ON
// the 1-year date, not the day after. ISO date strings compare correctly with >=.
function dueStateMonths(anchorDate, months, today) {
  if (!anchorDate) return { dueToday: true, earliestNextDate: null };
  const next = addCalendarMonths(anchorDate, months);
  const elapsed = today >= next;
  return { dueToday: elapsed, earliestNextDate: elapsed ? null : next };
}

// FINDING A (2026-10-17) — when the NEXT pneumococcal dose is due for an
// immunocompromised child who has ALREADY had one PPSV23.
//
// Four branches below reach this situation, and before today each gated its
// PCV20 card at 8 weeks while gating the 2nd-PPSV23 alternative beside it at 5
// years — so one card offered a choice between a dose available now and a dose
// available in 2029. 219 of the 16,008 grid patients were told PCV20 was due
// today when it was not.
//
// CDC, "Summary of Risk-based Pneumococcal Vaccination Recommendations" (page
// dated May 8, 2026, read live 2026-10-17), states it for BOTH paediatric age
// bands, in the same words:
//   "Then no pneumococcal vaccines are recommended at this time. Wait until at
//    least 5 years have passed since they received their first PPSV23 dose.
//    Then give 1 dose of PCV20 or PPSV23."
// Both options therefore become available on the SAME day.
//
// immunize.org P2016 (2/16/2024) footnote || offers PCV20 at 8 weeks instead.
// OWNER DECISION 2026-10-17: CDC governs — it is two years newer, it says this
// twice, and P2016's own Table 4 Option B already says 5 years for a child who
// reaches this state by following P2016's own plan. See CLAUDE.md's authority
// rule, extended in the same commit to rank CDC above an older immunize.org
// handout where AAP is silent.
//
// The 8-week floor is KEPT as the later of the two dates: a conjugate dose can
// fall after the PPSV23, and nothing here should let the app recommend a dose
// two weeks after the last one. Measured on the grid, that floor changes no
// committed verdict (0 of the 234 patients already past five years are also
// inside 8 weeks); it is exercised directly by its own test.
function icPostPpsv23DueState(ppsv, anchorPneumo, today) {
  const firstPpsv = ppsv.effective.find((d) => d.date)?.date || anchorPneumo;
  const fiveYear = dueStateMonths(firstPpsv, MO60, today);
  const eightWeek = dueState(anchorPneumo, WK8, today);
  if (fiveYear.dueToday && eightWeek.dueToday) {
    return { dueToday: true, earliestNextDate: null };
  }
  const pending = [fiveYear.earliestNextDate, eightWeek.earliestNextDate].filter(Boolean);
  // ISO date strings sort chronologically, so the last one is the later date.
  return { dueToday: false, earliestNextDate: pending.sort().at(-1) ?? null };
}

// The sentence both the PCV20 card and its 2nd-PPSV23 alternative now carry.
// One string so the two cards cannot drift apart in wording the way their
// DATES had drifted apart before Finding A.
const IC_POST_PPSV23_LEAD = `Give ONE further pneumococcal dose — either 1 dose of PCV20 or a 2nd PPSV23 — ≥${LONG_GAP_WORDS} after the first PPSV23 [c]. Choose ONE option, not both.`;

// ═══════════════════════════════════════════════════════════════════════════
//  CHILDREN 2–23 months — p2016 Table 1 (routine + catch-up; all children)
// ═══════════════════════════════════════════════════════════════════════════
// Where the primary series ends, for a child PCV schedule of `total` doses.
//
// Verified live 2026-09-15 — MMWR 71(37), "Use of 15-Valent Pneumococcal
// Conjugate Vaccine Among U.S. Children"
// (https://www.cdc.gov/mmwr/volumes/71/wr/mm7137a3.htm):
//   "The primary infant series consists of 3 doses of PCV."
//   "The fourth (booster) dose is recommended at age 12-15 months and >=8
//    weeks after the third dose"
// So the dose at >=12 months that CLOSES a series begun in infancy is the
// booster, and everything before it is primary — which holds for the shorter
// 7-11-month start too (2 primary + 1 booster).
//
// A series BEGUN at >=12 months is pure catch-up. CDC child & adolescent
// schedule notes, pneumococcal catch-up (fetched live 2026-09-15) describe
// those plainly as doses — "Healthy children ages 2-4 years with any
// incomplete PCV series: 1 dose PCV" — never as boosters. So there is no
// booster to split off and primaryTotal is the whole total.
function pcvSeriesShape(pcv, am, total) {
  const begunInInfancy = pcv.band.before12 >= 1 || am < M.m12;
  const hasBooster = begunInInfancy && total > 1;
  return { seriesTotal: total, primaryTotal: hasBooster ? total - 1 : total };
}

// Snapshot model: compute doses still needed + the next dose's min interval.
function pcvInfant(am, pcv, today) {
  const prior = pcv.count;
  const refs = ['cdcChildPneumo', 'p2016'];
  const brands = pcvRecBrands({ adult: false });
  const anchor = pcv.lastDate;

  // Determine total target doses + whether the booster (≥12mo) is the next due.
  // Reduced from p2016 Table 1 to: remaining count + next interval + 12mo floor.
  // Healthy and at-risk infants follow Table 1 alike.
  // ── The interval to the NEXT dose: CDC Catch-up Table 2, dose by dose ──
  //
  // P0-2 (owner decision 1, 2026-10-11). This used to be
  // `pcvSeriesMinIntervalDays(am)` — the patient's CURRENT age — while the
  // validator keyed the same number off the age at the PREVIOUS dose. Neither
  // can reproduce CDC Table 2, which keys on the DOSE NUMBER as well: a
  // 12.2-month-old whose previous dose was at 11.5 months gets 4 weeks as
  // dose 2 and 8 weeks as dose 3. See intervals.js for the quoted cells.
  //
  // The VALIDITY FLOOR is deliberately untouched (owner decision 2): a dose
  // already given is still graded by doseIntervalRules.js's more permissive
  // reading, so nothing a clinician already did is retroactively invalidated.
  // Only what the app advises changes.
  // Keyed off `anchor`, not off `prior`: an interval only exists when there is
  // a DATED earlier dose to measure it from. With no prior dose (or only
  // undated ones) the honest answer is null, not a number nothing was measured
  // against — dueState short-circuits on a null anchor anyway.
  const minInterval = anchor
    ? pcvNextDoseMinIntervalDays({
      doseNumber: prior + 1,
      ageAtPrevDose: pcv.lastAgeAtDose,
      currentAgeMonths: am,
      anyDoseBefore12: pcv.band.before12 >= 1 || pcv.band.undated >= 1,
    })
    : null;

  // ── The series total: immunize.org p2016 Table 1, cell by cell ──────────
  //
  // P0-2. The previous ladder was a formula (`Math.min(4, prior + 2)` and a
  // `prior < 1 ? 3 : 4` collapse of the whole 7-11-month band) with no
  // counterpart in any source; it over-stated the total in 5 of Table 1's 14
  // cells, and its half-written `before7` line was computed and never used.
  //
  // Table 1 keys every row on the child's CURRENT age band crossed with the
  // count of prior doses SPLIT BY WHEN THEY WERE GIVEN. The counts come from
  // summarizePcv's bands; the totals below are `prior + (doses Table 1 says
  // are still owed)`, which is what the table's third column states.
  //
  // UNDATED DOSES (the audit's open question, decided here): an undated dose
  // cannot be placed in a before-7-months band, so it is treated as an infant
  // dose — the convention `band.before24` already states, and the same
  // benefit-of-the-doubt `boosterGiven` below gives it. For a 7-11-month-old
  // the two possible readings agree (total 3 either way); for a 12-23-month-old
  // it yields the HIGHER total, which is the direction the authority rule
  // allows (never fewer doses than a source supports).
  const undatedAsInfant = pcv.band.undated;
  const before7 = pcv.band.before7 + undatedAsInfant;
  const m7to11 = pcv.band.m7to11;
  const before12 = pcv.band.before12 + undatedAsInfant;
  const at12plus = pcv.band.m12to23;

  // The arithmetic that makes every cell come out right:
  //
  //     target = (the doses the ROW KEYS ON) + (the doses it says are owed)
  //
  // and NOT `prior + owed`. Table 1's "1 additional dose" is counted against
  // the doses in its own key — the infant doses — so adding it to EVERY prior
  // dose double-counts a closing dose the child has already had. Worked
  // example (regression-boundary-and-fixes H5): a 15-month-old with 3 infant
  // doses and a booster at 12.01 months keys on "2 or 3 before age 12 months
  // -> 1 additional dose"; that additional dose IS the booster they already
  // received, so the total is 3 + 1 = 4 and the series is complete. `prior + 1`
  // would have made it 5 and called a finished series "catchup".
  //
  // It also settles the mixed histories Table 1 does not tabulate (a dose
  // before 7 months AND one at 7-11 months, say): the later dose counts as the
  // first of the "additional" doses the row owes, rather than stacking on top
  // of them.
  let target;
  if (am < M.m7) {
    // "2 through 6 months": 0 prior -> "4 doses"; 1 -> "3 additional doses";
    // 2 -> "2 additional doses"; 3 -> "1 additional dose at age 12-15 months".
    // Every row sums to 4, so the band needs no sub-branching.
    target = 4;
  } else if (am < M.m12) {
    // "7 through 11 months", keyed on WHEN the prior doses were given.
    if (before7 >= 3) {
      target = before7 + 1;      // "3 before age 7 months" -> 1 additional
    } else if (before7 >= 1) {
      target = before7 + 2;      // "1 or 2 before age 7 months" -> 2 additional
    } else if (m7to11 >= 2) {
      target = m7to11 + 1;       // "2 at age 7 months or older" -> 1 additional
    } else if (m7to11 === 1) {
      target = m7to11 + 2;       // "1 at age 7 months or older" -> 2 additional
    } else {
      target = 3;                // "0 before age 7 months" -> "3 doses"
    }
  } else {
    // "12 through 23 months".
    if (before12 >= 2) {
      target = before12 + 1;     // "2 or 3 before age 12 months" -> 1 additional
    } else if (before12 === 1) {
      target = before12 + 2;     // "1 before age 12 months" -> 2 additional
    } else if (at12plus >= 1) {
      target = at12plus + 1;     // "1 dose at age 12 months or older" -> 1 additional
    } else {
      target = 2;                // "0 before age 12 months" -> "2 doses"
    }
  }

  // Has a dose at ≥12mo been given? (booster satisfied)
  // FIX H5: Must check whether ≥1 dose was ADMINISTERED at ≥12mo, not just
  // whether the patient's CURRENT age is ≥12mo.  A 13-month-old with 4 doses
  // all given at <12mo still needs the ≥12mo booster — prior >= target alone
  // does not prove the series is complete.
  // Undated doses get benefit-of-the-doubt (matching completedInfantSeries logic
  // in pcvHealthyChild) — consistent with validate.js counting policy.
  const boosterGiven = (pcv.band.m12to23 + pcv.band.ge72 + pcv.band.undated) >= 1 && prior >= target;

  // P1-2 — "PCV dose 5 of 4" was an impossible label. A child can hold more
  // doses than p2016 Table 1 contemplates (four infant doses, say, where the
  // table's 2-6-month rows total 4) and STILL owe the >=12-month closing dose,
  // because Table 1 ends every infant row with "last dose at age 12-15
  // months". The old code floored `remaining` at 1 while leaving `target`
  // behind, so `doseNum` overtook it. The owed closing dose is a real dose, so
  // it belongs in the total: this child's series is their own doses plus it.
  if (prior >= target && !boosterGiven) target = prior + 1;

  if (prior >= target && boosterGiven) {
    return [rec({
      vaccine: 'PCV', status: 'complete',
      ...pcvSeriesShape(pcv, am, target),
      doseLabel: `PCV series complete (${prior} dose${prior === 1 ? '' : 's'})`,
      note: 'The age-appropriate PCV series appears complete [c]. If any dose was PCV15, ensure a PPSV23 follow-up is given only when a risk condition is present (PPSV23 is not routine for healthy children).',
      noteCites: [cite('pedsNoPcv20IfComplete')],
      refs,
    })];
  }

  const remaining = Math.max(1, target - prior);
  const doseNum = prior + 1;
  const { dueToday, earliestNextDate } = dueState(anchor, minInterval, today);
  // The final dose must be at ≥12 months — if this is the last dose and the
  // child is <12mo, it is not due until 12 months.
  const isFinal = remaining === 1;
  const needs12moFloor = isFinal && am < M.m12;
  const due = needs12moFloor ? false : dueToday;

  return [rec({
    vaccine: 'PCV', status: prior === 0 ? 'due' : 'catchup',
    ...pcvSeriesShape(pcv, am, target),
    doseLabel: `PCV dose ${doseNum} of ${target}`,
    dueToday: due,
    earliestNextDate: needs12moFloor ? null : earliestNextDate,
    minIntervalDays: minInterval,
    brands,
    note: {
      // P0-2: the lead used to assert a "4-dose series" for every infant,
      // which was invisible while the ladder over-stated every total AS 4 and
      // became a flat contradiction once the totals were corrected ("4-dose
      // series" above "PCV dose 3 of 3"). A child starting at 7-11 months owes
      // 3 doses and one starting at 12-23 months owes 2, per p2016 Table 1, so
      // the routine sentence is kept for the routine case and the child's own
      // total is stated otherwise. One [c] either way — noteCites has one cite.
      lead: `${target === 4
        ? 'Routine infant PCV (PCV15 or PCV20), 4-dose series at 2, 4, 6, and 12–15 months [c].'
        : `Catch-up infant PCV (PCV15 or PCV20): ${target} doses in total for this child [c].`}${needs12moFloor ? ' This final dose is not due until the patient reaches 12 months.' : ''}`,
      detail: `${minInterval
        ? `The next dose is due ${minInterval === 28 ? '4 weeks' : '8 weeks'} after the most recent one`
        : 'There is no earlier dated dose to measure an interval from'}; the final/booster dose is given at ≥12 months. If PCV15 is used, a PPSV23 follow-up is needed only for children with a risk condition.`,
    },
    noteCites: [cite('pedsRoutine4Dose')],
    refs,
  })];
}

// ═══════════════════════════════════════════════════════════════════════════
//  HEALTHY CHILDREN 24 months – 18 years — p2016 Table 2
// ═══════════════════════════════════════════════════════════════════════════
function pcvHealthyChild(am, pcv, ppsv, today) {
  const refs = ['cdcChildPneumo', 'p2016', 'cdcCatchupJobAid'];
  const prior = pcv.count;
  const anchor = pcv.lastDate;
  const b = pcv.band;

  // Completeness for a HEALTHY child is age-band driven, NOT "has any PCV20."
  // A single PCV20 given in infancy does NOT complete the series (that shortcut
  // is an ADULT rule — verified against CDC PneumoRecs, case P09). A healthy
  // 24–59mo child is complete only when EITHER:
  //   • the full infant series was finished (≥4 counting doses incl. a ≥12mo booster), OR
  //   • a catch-up dose was given at ≥24mo (the single 24–59mo catch-up dose suffices).
  const completedInfantSeries = prior >= 4 && (b.m12to23 >= 1 || b.undated >= 1);
  const caughtUpAt24mo = b.ge24 >= 1;

  // 24–59 months
  if (am < M.m60) {
    if (completedInfantSeries || caughtUpAt24mo || pcv.hasUndatedCompleting) {
      return [rec({
        vaccine: 'PCV', status: 'complete',
        doseLabel: 'PCV series complete',
        note: 'Healthy child 24–59 months whose age-appropriate PCV schedule is complete — no additional doses needed [c]. (A series that includes PCV20 also needs no PPSV23.)',
        noteCites: [cite('pedsNoPcv20IfComplete')],
        refs,
      })];
    }
    const { dueToday, earliestNextDate } = dueState(anchor, WK8, today);
    return [rec({
      vaccine: 'PCV', status: prior === 0 ? 'due' : 'catchup',
      doseLabel: '1 dose PCV (catch-up)',
      dueToday, earliestNextDate, minIntervalDays: WK8,
      brands: pcvRecBrands({ adult: false }),
      note: {
        lead: `Give 1 dose of PCV15 or PCV20, ≥${PNEUMO_GAP_WORDS} after the most recent PCV [c].`,
        detail: 'This is the catch-up for a healthy child 24–59 months whose PCV schedule was not complete by 24 months. If PCV15 is used, a PPSV23 follow-up is NOT routine for a healthy child — PPSV23 here is risk-based only.',
      },
      noteCites: [cite('pedsHealthyCatchup')],
      refs,
    })];
  }

  // 5–18 years healthy — no additional doses (healthy older children not caught up).
  return [rec({
    vaccine: 'PCV', status: 'not-indicated',
    doseLabel: 'Not indicated (healthy 5–18y)',
    note: {
      lead: 'No PCV is indicated — healthy children 5–18 years are not routinely caught up [c].',
      detail: 'CDC\'s catch-up row covers healthy children only through age 4. PCV is recommended at this age only if a risk condition is present [c].',
    },
    noteCites: [cite('pedsHealthyCatchup'), cite('cdcChildSpecialSituations')],
    refs,
  })];
}

// ═══════════════════════════════════════════════════════════════════════════
//  AT-RISK CHILDREN 24 months – 18 years — p2016 Table 4
// ═══════════════════════════════════════════════════════════════════════════
function pcvRiskChild(am, riskIds, pcv, ppsv, today) {
  const rowClass = pedsRiskRowClass(riskIds); // 'IC' | 'nonIC'
  const isIC = rowClass === 'IC';
  const refs = collectRefs(riskIds, ['cdcChildPneumo', 'p2016'], 'child');
  const anchorPcv = pcv.lastDate;
  // Anchor for "most recent pneumococcal vaccine" = latest of PCV or PPSV23.
  const anchorPneumo = mostRecent(pcv.lastDate, ppsv.effective.find((d) => d.date)?.date || null);
  const ppsvGiven = ppsv.count > 0;
  // IC-1/IC-2/IC-3 (2026-10-17). Once an at-risk child's conjugate series is
  // done, CDC and p2016 ask ONE more question — has the post-series dose been
  // given? — and the two risk classes answer it differently. This predicate is
  // the single place that difference is written down.
  //
  //   non-IC  a single PPSV23 finishes the schedule.
  //           p2016 Table 4 footnote §: "If PPSV23 previously given, then child
  //           is complete."
  //   IC      the PPSV23 is followed by one MORE dose — PCV20, or a 2nd PPSV23
  //           at >=5 years. So an IC child is finished only once that second
  //           dose actually exists.
  //           p2016 Table 4 footnote ||: "If PPSV23 previously given, options
  //           are (a) give one dose of PCV20 at least 8 weeks after most recent
  //           pneumococcal vaccination, or (b) give a second dose of PPSV23
  //           five years after the first dose of PPSV23."
  //           CDC child notes, IC, Age 2-5 and Age 6-18: "If PPSV23 is used,
  //           administer 1 dose of PCV20 or dose 2 PPSV23 at least 5 years
  //           after dose 1 PPSV23".
  //
  // `ppsv.count` counts EFFECTIVE doses, so a second PPSV23 given inside the
  // 5-year floor does not satisfy this — which is the behaviour the rule wants.
  //
  // A counting PCV20 satisfies either class and is handled before this point
  // (the includesCompleting block), so PCV20 is deliberately not re-tested.
  //
  // WHY A PREDICATE AND NOT `!isIC` AT EACH CALL SITE. The first draft of this
  // fix wrote `&& !isIC`, which made every IC child with any PPSV23 incomplete
  // and broke a REAL patient already in the suite: an 18y9m sickle-cell patient
  // with PCV13 at 2y10m and THREE PPSV23 doses, who is genuinely complete
  // because option (b) has been satisfied several times over. The question is
  // not "is this child immunocompromised" but "has the dose that follows the
  // PPSV23 been given", and only the second one is answerable in one place.
  const pedsPostSeriesDoseDone = isIC ? ppsv.count >= 2 : ppsv.count >= 1;
  const out = [];

  // Row 3: completed series before 6y including ≥1 PCV20 → no additional doses.
  // FIX M2: The shortcut "includes PCV20 → complete" is an ADULT and older-child
  // rule (CDC adult notes / p2016 Table 2 for healthy children), NOT a universal
  // rule for at-risk 24–71mo children.  Per CDC Table 4, an at-risk child <6y
  // with only 1 PCV20 still needs 1 more dose (Row 1: <3 doses before 24mo → 2
  // doses at ≥24mo).  The Row-3 shortcut only applies once the child has
  // COMPLETED the age-appropriate series (i.e. the Table 4 rows-1/2 requirement
  // is fully met AND the history includes a completing dose).
  //
  // Gate: child <6y AND insufficient doses at ≥24mo → fall through to rows 1/2.
  // For child ≥6y the catch-up is a single dose regardless, so the shortcut is
  // safe once a PCV20 is present (they've had their 1 at-risk dose).
  const enoughAt24mo = am >= M.m72 || pcv.band.ge24 >= (pcv.band.before24 >= 3 ? 1 : 2);
  if (pcv.includesCompleting && (am >= M.m72 || enoughAt24mo)) {
    out.push(rec({
      vaccine: 'PCV', status: 'complete',
      doseLabel: 'PCV complete (includes PCV20)',
      note: 'At-risk child whose PCV series includes PCV20 — no additional PCV or PPSV23 doses needed [c].',
      noteCites: [cite('pedsRiskPcv20Complete')],
      refs,
    }));
    return out;
  }

  // Rows 1 & 2: 24–71 months catch-up. The at-risk catch-up doses are given at
  // ≥24 months; prior INFANT doses do NOT reduce them. CDC: "<3 prior PCV by 24mo
  // → 2 doses, regardless of 0/1/2 before 24mo"; "3 doses before 24mo → 1 dose."
  // Progress toward the catch-up = doses already given at ≥24mo (band.ge24).
  // Verified vs PneumoRecs (P11 → 2, P12 → 1, P20 → 2).
  //
  // A COMPLETED infant series (≥4 counting PCV doses) is NOT a catch-up case —
  // per CDC child notes a child who "completed the recommended PCV series but has
  // not received PPSV23" gets 1 PCV20 OR 1 PPSV23, not another plain PCV dose.
  // Such children fall through to the rows-4/5 "completed before age 6" block below.
  // Source: cdc.gov/.../child-adolescent-notes.html#note-pneumo ("Completed
  // recommended PCV series but have not received PPSV23").
  if (am < M.m72 && pcv.count < 4) {
    const target = pcv.band.before24 >= 3 ? 1 : 2; // row 2 (1) vs row 1 (2)
    const remaining = Math.max(0, target - pcv.band.ge24);
    // IC-2 / IC-3 (2026-10-17). The PCV catch-up being finished is NOT the end
    // of this child's schedule, and until today this branch said it was.
    //
    // CDC's "Special situations", Age 2-5 years, asks a SECOND question once the
    // conjugate series is done — and answers it differently by risk class:
    //   non-IC: "Not previously received PCV20: administer 1 dose PCV20 or 1
    //            dose PPSV23 administer at least 8 weeks after the most recent
    //            PCV dose."
    //   IC:     the same, plus "If PPSV23 is used, administer 1 dose of PCV20 or
    //            dose 2 PPSV23 at least 5 years after dose 1 PPSV23".
    // So "complete" is right ONLY for a non-IC child who has already had the
    // PPSV23. Measured before the fix: 8 cards with neither PPSV23 nor PCV20,
    // and 15 IC cards whose second dose was already due, were all told complete
    // and shown no other card at all.
    //
    // A history containing a counting PCV20 never reaches here — the
    // includesCompleting block above returns first — which is why PCV20 is not
    // re-tested below.
    if (remaining === 0) {
      if (pedsPostSeriesDoseDone) {
        out.push(rec({
          vaccine: 'PCV', status: 'complete',
          doseLabel: 'PCV complete (at-risk catch-up done)',
          note: 'At-risk (non-immunocompromising) child 24–71 months who has received the age-appropriate at-risk PCV catch-up dose(s) at ≥24 months and has had PPSV23 — complete [c].',
          noteCites: [cite('pedsRiskPcv20orPpsv23')],
          refs,
        }));
        return out;
      }
      // The cards below are written for THIS population — an at-risk child
      // 24-71 months — rather than reusing the 6-18y rows further down. Those
      // rows give the same clinical answer but describe the patient as "6-18
      // years with PCV13 only (at/after age 6)", which would be a true sentence
      // about somebody else.
      const done = dueState(anchorPneumo, WK8, today);
      if (ppsv.count === 0) {
        out.push(rec({
          vaccine: 'PCV', status: 'risk-based',
          doseLabel: `Option A: 1 dose PCV20 (≥${PNEUMO_GAP_WORDS})`,
          dueToday: done.dueToday, earliestNextDate: done.earliestNextDate, minIntervalDays: WK8,
          brands: ['PCV20 (Prevnar 20)'],
          note: {
            lead: `The at-risk PCV catch-up is done, but one more pneumococcal dose is owed: Option A — 1 dose of PCV20 ≥${PNEUMO_GAP_WORDS} after the most recent PCV [c].`,
            detail: 'This is an at-risk child 24–71 months who has had the catch-up dose(s) at ≥24 months but has received neither PCV20 nor PPSV23. Choose Option A or B, not both.',
          },
          noteCites: [cite('pedsRiskPcv20orPpsv23')],
          refs,
        }));
        out.push(rec({
          vaccine: 'PPSV23', status: 'risk-based',
          doseLabel: `Option B: 1 dose PPSV23 (≥${PNEUMO_GAP_WORDS})`,
          dueToday: done.dueToday, earliestNextDate: done.earliestNextDate, minIntervalDays: WK8,
          brands: ['PPSV23 (Pneumovax 23)'],
          note: isIC
            ? `Option B — 1 dose of PPSV23 ≥${PNEUMO_GAP_WORDS} after the most recent PCV [c]; then ≥${LONG_GAP_WORDS} later give 1 dose of PCV20 or a 2nd PPSV23 [c]. Choose Option A or B, not both.`
            : `Option B — 1 dose of PPSV23 ≥${PNEUMO_GAP_WORDS} after the most recent PCV [c]. Choose Option A or B, not both.`,
          noteCites: isIC
            ? [cite('pedsRiskPcv20orPpsv23'), cite('pedsSecondPpsv5y')]
            : [cite('pedsRiskPcv20orPpsv23')],
          refs,
        }));
        return out;
      }
      // IC and PPSV23 already given: the five-year step is still owed.
      // Finding A (2026-10-17): the five-year date, not 8 weeks. This branch
      // can never be past five years — a child under 72 months whose first
      // PPSV23 was 5 years ago would have been under age 1 at the time, below
      // PPSV23's 2-year minimum age — so every patient it sees is waiting.
      const icPost = icPostPpsv23DueState(ppsv, anchorPneumo, today);
      out.push(rec({
        vaccine: 'PCV', status: 'risk-based',
        doseLabel: '1 dose PCV20 (immunocompromising)',
        dueToday: icPost.dueToday,
        earliestNextDate: icPost.earliestNextDate,
        minIntervalMonths: MO60,
        brands: ['PCV20 (Prevnar 20)'],
        note: {
          lead: IC_POST_PPSV23_LEAD,
          detail: `This is an immunocompromising at-risk child 24–71 months who has had the at-risk PCV catch-up and PPSV23. For an immunocompromising condition the PPSV23 is followed by one further pneumococcal dose; it is not the end of the series. CDC puts that dose at ${LONG_GAP_WORDS} after the first PPSV23, whichever product is chosen.`,
        },
        noteCites: [cite('pedsIcPpsvWaitFiveYears')],
        refs: collectRefs(riskIds, ['cdcRiskIndications', 'cdcChildPneumo'], 'child'),
      }));
      const ppsv2done = dueStateMonths(
        ppsv.effective.find((d) => d.date)?.date || anchorPneumo, MO60, today,
      );
      out.push(rec({
        vaccine: 'PPSV23', status: 'risk-based',
        doseLabel: '2nd PPSV23 (alternative, ≥5y after first)',
        dueToday: ppsv2done.dueToday,
        earliestNextDate: ppsv2done.earliestNextDate,
        minIntervalMonths: MO60,
        brands: ['PPSV23 (Pneumovax 23)'],
        note: `Alternative to the PCV20 above: a 2nd PPSV23 ≥${LONG_GAP_WORDS} after the first PPSV23 [c]. Choose ONE option (PCV20 or 2nd PPSV23), not both.`,
        noteCites: [cite('pedsIcPpsvWaitFiveYears')],
        refs: collectRefs(riskIds, ['cdcRiskIndications', 'cdcChildPneumo'], 'child'),
      }));
      return out;
    }
    const { dueToday, earliestNextDate } = dueState(anchorPcv, WK8, today);
    const doseNum = target - remaining + 1;
    out.push(rec({
      vaccine: 'PCV', status: 'risk-based',
      doseLabel: target === 1 ? '1 dose PCV (at-risk catch-up)' : `PCV dose ${doseNum} of 2 (at-risk catch-up)`,
      dueToday, earliestNextDate, minIntervalDays: WK8,
      brands: pcvRecBrands({ adult: false }),
      note: target === 1
        ? {
          lead: `Give 1 dose of PCV20 or PCV15, ≥${PNEUMO_GAP_WORDS} after the most recent PCV [c].`,
          detail: `This is the at-risk catch-up for a child 24–71 months who had 3 PCV doses before 24 months. If PCV15 is used, add PPSV23 ≥${PNEUMO_GAP_WORDS} later.`,
        }
        : {
          lead: `Give 2 doses of PCV20 or PCV15, ≥${PNEUMO_GAP_WORDS} apart [c].`,
          detail: `This is the at-risk catch-up for a child 24–71 months with fewer than 3 PCV doses by 24 months. These doses are additional to any infant doses. If PCV15 is used to complete, add PPSV23 ≥${PNEUMO_GAP_WORDS} after the last PCV.`,
        },
      noteCites: [cite('pedsRiskIncompleteCatchup')],
      refs,
    }));
    return out;
  }

  // Rows 4–9: 2–18y (here ≥6y by age, but rows 4/5 say "2–18y completed before 6y").
  // Branch on whether a PCV13/15 series was completed before age 6 vs no prior PCV
  // vs PCV13-only at/after age 6. We can't see exact ages of historical doses, so:
  //   • prior counting PCV ≥3  → treat as "completed series before 6y with PCV13/15"
  //   • prior counting PCV 0   → "no prior PCV13/15/20"
  //   • prior counting PCV 1–2 (e.g. a single PCV13 at/after 6y) → "PCV13 only at/after 6y"

  // ── PCV given ONLY before age 72 months (before age 6) + PPSV23 already given → complete ──
  // Verified against CDC PneumoRecs VaxAdvisor (2026-07-09). A high-risk patient (IC or
  // non-IC) who is now ≥6 years old, whose ONLY conjugate doses (PCV7 excluded) were all
  // given before age 72 months, who has received PPSV23 and never PCV20/PCV21, has COMPLETED
  // the pediatric PCV + PPSV23 series — no adult/older-child PCV20 catch-up. The decisive
  // gate is PneumoRecs' question "did the patient only receive PCV before age 72 months?".
  // Requires all counting PCV doses to be DATED and before 72mo: an undated dose cannot be
  // confirmed pre-72mo, so it falls through to the standard rows (matches "PPSV23 already
  // given → PCV20/2nd-PPSV23" for undated-history IC cases).
  const allCountingPcvBefore72mo =
    pcv.count >= 1 && pcv.band.ge72 === 0 && pcv.band.undated === 0;
  // IC-1 (2026-10-17): `&& !isIC`. This shortcut used to fire for either risk
  // class — its comment above says "IC or non-IC" — and it is right only for
  // non-IC. Measured before the fix: 69 cards where an immunocompromised child
  // (asplenia, HIV) with PPSV23 and no PCV20 was told the series was complete,
  // each shown that one card and nothing else.
  //
  // Both documents the card itself cites say otherwise, for exactly this
  // patient:
  //   p2016 Table 4, footnote || (its row spans "2 through 18 years", so it
  //   covers this child): "If PPSV23 previously given, options are (a) give one
  //   dose of PCV20 at least 8 weeks after most recent pneumococcal
  //   vaccination, or (b) give a second dose of PPSV23 five years after the
  //   first dose of PPSV23."
  //   CDC child notes, IC, Age 2-5 (the section this child was under when the
  //   PPSV23 was given): "If PPSV23 is used, administer 1 dose of PCV20 or dose
  //   2 PPSV23 at least 5 years after dose 1 PPSV23".
  // p2016's footnote § is the non-IC twin — "If PPSV23 previously given, then
  // child is complete" — which is what keeps the non-IC path below unchanged.
  //
  // The shortcut's justification was PneumoRecs VaxAdvisor, a mobile app.
  // Under CLAUDE.md's authority rule the published schedule and immunize.org
  // govern, and here they agree with each other against the app.
  //
  // No new rule was needed: the two blocks below ALREADY draw this split
  // correctly, for >=3 prior doses and for 1-2. This shortcut was simply
  // intercepting IC children before either could run.
  if (am >= M.m72 && allCountingPcvBefore72mo && pedsPostSeriesDoseDone
    && !pcv.includesCompleting) {
    out.push(rec({
      vaccine: 'PCV', status: 'complete',
      doseLabel: 'PCV series complete (PCV before age 6 + PPSV23)',
      note: {
        lead: 'No further PCV or PPSV23 is needed — the paediatric high-risk series is complete [c].',
        detail: 'All conjugate doses on record were given before age 6 (72 months) and PPSV23 has been received, which completes the series. Verified against CDC PneumoRecs VaxAdvisor: "only received PCV before age 72 months" plus PPSV23 received → complete. PCV7 doses are never counted toward the series.',
      },
      noteCites: [cite('pedsBefore6NoPcv20')],
      refs: collectRefs(riskIds, ['cdcRiskIndications', 'cdcChildPneumo', 'p2016'], 'child'),
    }));
    return out;
  }

  // IC-1, second half (2026-10-17). The same history as the block above — all
  // conjugate doses before age 6, no PCV20 — but immunocompromised with only
  // ONE PPSV23, so the five-year follow-on is still owed.
  //
  // This needs its OWN card rather than falling through to the rows below, and
  // that was found by driving the app rather than by a test. With only the
  // routing fix, these children landed on the "PCV13 only at or after age 6"
  // row, whose quote reads "Received PCV13 only at or after age 6 years:
  // administer 1 dose PCV20 or 1 dose PPSV23 at least 8 weeks after the most
  // recent PCV13 dose" — a true sentence about the opposite history. The
  // clinical answer was right and the citation was describing somebody else,
  // which is exactly the fault C6/G4 exist to catch.
  //
  // `pcv.count < 3` keeps this away from the >=3 block below, whose own
  // "completed PCV13/15 before age 6" prose already fits those children.
  if (am >= M.m72 && allCountingPcvBefore72mo && isIC && ppsv.count === 1
    && pcv.count < 3 && !pcv.includesCompleting) {
    // Finding A (2026-10-17): the five-year date, not 8 weeks.
    const icBefore6 = icPostPpsv23DueState(ppsv, anchorPneumo, today);
    out.push(rec({
      vaccine: 'PCV', status: 'risk-based',
      doseLabel: '1 dose PCV20 (immunocompromising)',
      dueToday: icBefore6.dueToday,
      earliestNextDate: icBefore6.earliestNextDate,
      minIntervalMonths: MO60,
      brands: ['PCV20 (Prevnar 20)'],
      note: {
        lead: IC_POST_PPSV23_LEAD,
        // Two [c] markers, two citations, in order: the lead's five-year rule,
        // then the history this child actually has. The second one is not
        // decoration -- it is what stops this card being cited to the "PCV13
        // only at or after age 6 years" sentence, which is a true statement
        // about the opposite history, and is asserted by
        // regression-2026-10-17-ic-child-with-ppsv23-is-not-complete.js.
        detail: `This is an immunocompromising at-risk child whose conjugate doses were all given before age 6, with no PCV20, and who has already received one PPSV23 [c]. For an immunocompromising condition that PPSV23 is followed by one further pneumococcal dose — it is not the end of the series. CDC puts that dose at ${LONG_GAP_WORDS} after the first PPSV23, whichever product is chosen.`,
      },
      noteCites: [cite('pedsIcPpsvWaitFiveYears'), cite('pedsBefore6NoPcv20')],
      refs: collectRefs(riskIds, ['cdcRiskIndications', 'cdcChildPneumo'], 'child'),
    }));
    const ppsv2Before6 = dueStateMonths(
      ppsv.effective.find((d) => d.date)?.date || anchorPneumo, MO60, today,
    );
    out.push(rec({
      vaccine: 'PPSV23', status: 'risk-based',
      doseLabel: '2nd PPSV23 (alternative, ≥5y after first)',
      dueToday: ppsv2Before6.dueToday,
      earliestNextDate: ppsv2Before6.earliestNextDate,
      minIntervalMonths: MO60,
      brands: ['PPSV23 (Pneumovax 23)'],
      note: `Alternative to the PCV20 above: a 2nd PPSV23 ≥${LONG_GAP_WORDS} after the first PPSV23 [c]. Choose ONE option (PCV20 or 2nd PPSV23), not both.`,
      noteCites: [cite('pedsIcPpsvWaitFiveYears')],
      refs: collectRefs(riskIds, ['cdcRiskIndications', 'cdcChildPneumo'], 'child'),
    }));
    return out;
  }

  if (pcv.count >= 3) {
    // Rows 4 (non-IC) / 5 (IC): completed before 6y with PCV13/15 (no PCV20, no PPSV23).
    if (ppsvGiven) {
      // non-IC: PPSV23 already given → complete.
      if (!isIC) {
        out.push(rec({
          vaccine: 'PCV', status: 'complete', doseLabel: 'Complete (PCV series + PPSV23)',
          note: `At-risk (non-immunocompromising) child who completed the PCV series and has received PPSV23 — complete [c]. Alternatively a single PCV20 ≥${PNEUMO_GAP_WORDS} after the last PCV also completes.`,
          noteCites: [cite('pedsRiskPcv20orPpsv23')],
          refs,
        }));
        return out;
      }
      // IC + PPSV23 already given. Finding A (2026-10-17): BOTH options are
      // five years after the first PPSV23, not one at 8 weeks and one at five
      // years. 24 of the 219 patients this fix moves come from here.
      const { dueToday, earliestNextDate } = icPostPpsv23DueState(ppsv, anchorPneumo, today);
      out.push(rec({
        vaccine: 'PCV', status: 'risk-based', doseLabel: '1 dose PCV20 (immunocompromising)',
        dueToday, earliestNextDate, minIntervalMonths: MO60,
        brands: ['PCV20 (Prevnar 20)'],
        note: {
          lead: IC_POST_PPSV23_LEAD,
          detail: `This applies to an immunocompromising at-risk child who completed PCV13/15 and has already received PPSV23. CDC puts the further dose at ${LONG_GAP_WORDS} after the first PPSV23, whichever product is chosen.`,
        },
        noteCites: [cite('pedsIcPpsvWaitFiveYears')],
        refs: collectRefs(riskIds, ['cdcRiskIndications', 'cdcChildPneumo'], 'child'),
      }));
      const ppsv2 = dueStateMonths(ppsv.effective.find((d) => d.date)?.date || anchorPneumo, MO60, today);
      out.push(rec({
        vaccine: 'PPSV23', status: 'risk-based', doseLabel: '2nd PPSV23 (alternative, ≥5y after first)',
        dueToday: ppsv2.dueToday, earliestNextDate: ppsv2.earliestNextDate, minIntervalMonths: MO60,
        brands: ['PPSV23 (Pneumovax 23)'],
        note: `Alternative to the PCV20 above: a 2nd PPSV23 ≥${LONG_GAP_WORDS} after the first PPSV23 [c]. Choose ONE option (PCV20 or 2nd PPSV23), not both.`,
        noteCites: [cite('pedsIcPpsvWaitFiveYears')],
        refs: collectRefs(riskIds, ['cdcRiskIndications', 'cdcChildPneumo'], 'child'),
      }));
      return out;
    }
    // No PPSV23 yet. A) PCV20 ≥8wk; or B) PPSV23 ≥8wk (IC: then ≥5y → PCV20 or 2nd PPSV23).
    const { dueToday, earliestNextDate } = dueState(anchorPneumo, WK8, today);
    out.push(rec({
      vaccine: 'PCV', status: 'risk-based', doseLabel: 'Option A: 1 dose PCV20 (≥8 weeks)',
      dueToday, earliestNextDate, minIntervalDays: WK8,
      brands: ['PCV20 (Prevnar 20)'],
      note: `At-risk ${isIC ? 'immunocompromising' : 'non-immunocompromising'} child who completed PCV13/15 before age 6 (no PCV20, no PPSV23): Option A — 1 dose of PCV20 ≥${PNEUMO_GAP_WORDS} after the most recent PCV (completes the series) [c].`,
      noteCites: [cite('pedsRiskPcv20orPpsv23')],
      refs,
    }));
    out.push(rec({
      vaccine: 'PPSV23', status: 'risk-based', doseLabel: 'Option B: 1 dose PPSV23 (≥8 weeks)',
      dueToday, earliestNextDate, minIntervalDays: WK8,
      brands: ['PPSV23 (Pneumovax 23)'],
      note: isIC
        ? 'Option B — 1 dose of PPSV23 ≥8 weeks after the most recent PCV [c]; then ≥5 years later give 1 dose of PCV20 or a 2nd PPSV23 [c]. Choose Option A or B, not both.'
        : 'Option B — 1 dose of PPSV23 ≥8 weeks after the most recent PCV [c]. Choose Option A or B, not both.',
      noteCites: isIC
        ? [cite('pedsRiskPcv20orPpsv23'), cite('pedsSecondPpsv5y')]
        : [cite('pedsRiskPcv20orPpsv23')],
      refs,
    }));
    return out;
  }

  // 6–18y with no prior counting PCV (rows 6/7) OR PCV13-only at/after 6y (rows 8/9).
  const noPriorPcv = pcv.count === 0;

  // Rows 8/9 (PCV13-only at/after 6y) where PPSV23 has ALREADY been given:
  //   • non-IC → Option B (the single PPSV23) is satisfied → COMPLETE.
  //   • IC     → still owes the recurring step: 1 PCV20 ≥8wk OR a 2nd PPSV23 ≥5y
  //              after the first (p2016 Table 4 row 9).
  // Verified vs CDC child notes + PneumoRecs (P19 non-IC → complete).
  if (!noPriorPcv && ppsvGiven) {
    if (!isIC) {
      out.push(rec({
        vaccine: 'PCV', status: 'complete',
        doseLabel: 'Complete (PCV13 + PPSV23 at/after age 6)',
        note: 'Non-immunocompromising at-risk child with PCV13 at/after age 6 who has received PPSV23 — no further doses of any PCV or PPSV23 are indicated [c].',
        noteCites: [cite('pedsRiskDone')],
        refs,
      }));
      return out;
    }
    // Finding A (2026-10-17): the five-year date, not 8 weeks.
    //
    // Note what this branch is: PCV13 given at or AFTER age 6, plus a PPSV23.
    // Neither source states that combination outright. CDC's 6-18 section has
    // only two history rows ("never received PCV13, PCV15 or PCV20" and
    // "received PCV13 or PCV15 before age 6 years"), and P2016's matching row
    // carries no footnote for a PPSV23 already given. The five years is read
    // across from the Option B of P2016's own row for this history -- "at
    // least 5 years after the first PPSV23 dose, give 1 dose of PCV20 or a
    // second dose of PPSV23" -- which agrees with every CDC row that does
    // speak to a prior PPSV23. Recorded here because it is an inference, not
    // a quotation, and a future reader should know which it is.
    const icState = icPostPpsv23DueState(ppsv, anchorPneumo, today);
    out.push(rec({
      vaccine: 'PCV', status: 'risk-based', doseLabel: '1 dose PCV20 (immunocompromising)',
      dueToday: icState.dueToday,
      earliestNextDate: icState.earliestNextDate,
      minIntervalMonths: MO60,
      brands: ['PCV20 (Prevnar 20)'],
      note: {
        lead: IC_POST_PPSV23_LEAD,
        detail: `This applies to an immunocompromising at-risk child whose only conjugate dose was PCV13 given at or after age 6, and who has already received PPSV23. CDC puts the further dose at ${LONG_GAP_WORDS} after the first PPSV23, whichever product is chosen.`,
      },
      noteCites: [cite('pedsIcPpsvWaitFiveYears')],
      refs: collectRefs(riskIds, ['cdcRiskIndications', 'cdcChildPneumo'], 'child'),
    }));
    const ppsv2 = dueStateMonths(ppsv.effective.find((d) => d.date)?.date || anchorPneumo, MO60, today);
    out.push(rec({
      vaccine: 'PPSV23', status: 'risk-based', doseLabel: '2nd PPSV23 (alternative, ≥5y after first)',
      dueToday: ppsv2.dueToday, earliestNextDate: ppsv2.earliestNextDate, minIntervalMonths: MO60,
      brands: ['PPSV23 (Pneumovax 23)'],
      note: `Alternative to the PCV20 above: a 2nd PPSV23 ≥${LONG_GAP_WORDS} after the first PPSV23 [c]. Choose ONE option (PCV20 or 2nd PPSV23), not both.`,
      noteCites: [cite('pedsIcPpsvWaitFiveYears')],
      refs: collectRefs(riskIds, ['cdcRiskIndications', 'cdcChildPneumo'], 'child'),
    }));
    return out;
  }

  const anchorForA = noPriorPcv ? anchorPneumo : anchorPcv;
  const aState = dueState(anchorForA, WK8, today);

  out.push(rec({
    vaccine: 'PCV', status: 'risk-based', doseLabel: 'Option A: 1 dose PCV20 (≥8 weeks)',
    dueToday: aState.dueToday, earliestNextDate: aState.earliestNextDate, minIntervalDays: WK8,
    brands: ['PCV20 (Prevnar 20)'],
    note: noPriorPcv
      ? `At-risk ${isIC ? 'immunocompromising' : 'non-immunocompromising'} child 6–18 years with no prior PCV: Option A — 1 dose of PCV20 ≥8 weeks after the most recent pneumococcal vaccine [c].`
      : `At-risk ${isIC ? 'immunocompromising' : 'non-immunocompromising'} child 6–18 years with PCV13 only (at/after age 6): Option A — 1 dose of PCV20 ≥8 weeks after the most recent PCV13 [c].`,
    noteCites: [cite(noPriorPcv ? 'pedsRisk6to18NoPcv' : 'pedsRiskPcv13At6')],
    refs,
  }));

  if (noPriorPcv) {
    // Option B: PCV15 then PPSV23 ≥8wk later (rows 6/7).
    out.push(rec({
      vaccine: 'PCV', status: 'risk-based', doseLabel: 'Option B-1: 1 dose PCV15 (≥8 weeks)',
      dueToday: aState.dueToday, earliestNextDate: aState.earliestNextDate, minIntervalDays: WK8,
      brands: ['PCV15 (Vaxneuvance)'],
      note: {
        lead: `Option B — 1 dose of PCV15 ≥${PNEUMO_GAP_WORDS} after the most recent pneumococcal vaccine, then ≥${PNEUMO_GAP_WORDS} later 1 dose of PPSV23 if not previously given [c].`,
        detail: 'Choose Option A or B, not both.',
      },
      noteCites: [cite('pedsRisk6to18NoPcv')],
      refs,
    }));
    if (!ppsvGiven) {
      out.push(rec({
        vaccine: 'PPSV23', status: 'risk-based', doseLabel: 'Option B-2: PPSV23 (≥8 weeks after PCV15)',
        dueToday: false, earliestNextDate: null, minIntervalDays: WK8,
        brands: ['PPSV23 (Pneumovax 23)'],
        note: `Second step of Option B: PPSV23 ≥${PNEUMO_GAP_WORDS} after the PCV15 dose [c]. Only if PPSV23 was not previously given.`,
        noteCites: [cite('pedsRisk6to18NoPcv')],
        refs,
      }));
    }
  } else {
    // PCV13-only at/after 6y. Option B: PPSV23 ≥8wk (IC: then ≥5y → PCV20 or 2nd PPSV23).
    out.push(rec({
      vaccine: 'PPSV23', status: 'risk-based', doseLabel: 'Option B: 1 dose PPSV23 (≥8 weeks after PCV13)',
      dueToday: aState.dueToday, earliestNextDate: aState.earliestNextDate, minIntervalDays: WK8,
      brands: ['PPSV23 (Pneumovax 23)'],
      note: isIC
        ? {
          lead: `Option B — 1 dose of PPSV23 ≥${PNEUMO_GAP_WORDS} after the most recent PCV13 [c]; then ≥${LONG_GAP_WORDS} after the first PPSV23, give 1 dose of PCV20 or a 2nd PPSV23 [c].`,
          detail: 'This is the immunocompromising row: the 5-year follow-on dose is part of the plan, not optional. Choose Option A or B, not both.',
        }
        : {
          lead: `Option B — 1 dose of PPSV23 ≥${PNEUMO_GAP_WORDS} after the most recent PCV13 [c].`,
          detail: 'Choose Option A or B, not both.',
        },
      noteCites: isIC
        ? [cite('pedsRiskPcv13At6'), cite('pedsSecondPpsv5y')]
        : [cite('pedsRiskPcv13At6')],
      refs,
    }));
  }

  return out;
}

// ═══════════════════════════════════════════════════════════════════════════
//  ADULTS 19–49y (risk-only) and ≥50y (routine) — CDC adult notes
// ═══════════════════════════════════════════════════════════════════════════
function pcvAdult(am, riskIds, pcv, ppsv, today, dob = null) {
  const isOlderAdult = am >= M.y50;
  const anyRisk = hasAnyRisk(riskIds);
  // S15 (owner decision 2026-10-16): the recommended PCV15→PPSV23 interval
  // takes BOTH the age band and the risk class, per mm7401a1 (ACIP, Jan 2025)
  // and CDC's March 2025 Timing Job Aid — >=8 weeks for a 19–49 adult with an
  // immunocompromising condition / cochlear implant / CSF leak, >=1 year for
  // every other adult. `adultPpsvRecommendedInterval()` in riskFactors.js is
  // the ONLY place that is decided; this file must never re-derive it.
  //
  // It returns `{days}` or `{months}` — the shape intervalPhrase() and the
  // due-date helpers both take — so the words, the number and the date cannot
  // drift apart (S6). `ppsvIntervalDays` once sat here as a permanently-null
  // branch left over from the rule A-P1-1 amended away; it is a real branch
  // again now, and this time it is fed from one function rather than an
  // inline condition.
  const ppsvInterval = adultPpsvRecommendedInterval(am, riskIds);
  const ppsvIntervalDays = ppsvInterval.days ?? null;
  const ppsvIntervalMonths = ppsvInterval.months ?? null;
  const ppsvIntervalLabel = intervalPhrase(ppsvInterval);
  // The 8-week option is named only where ACIP names it as a choice: at 50+
  // for that same class. At 19–49 it IS the recommendation above, so repeating
  // it as an option would offer the patient the number just recommended.
  // Wording comes from ADULT_PPSV23_SHORTER_MINIMUM_WEEKS so the constant
  // keeps the sentence true (S6).
  const shorterMinimumNote = adultPpsvShorterMinimumOffered(am, riskIds)
    ? ` A minimum interval of ${intervalPhrase({ days: ADULT_PPSV23_SHORTER_MINIMUM_WEEKS * 7 })} may be considered for an immunocompromising condition, cochlear implant, or cerebrospinal fluid leak.`
    : '';
  // One helper for either unit, so a caller cannot pick the wrong one.
  const ppsvDueState = (anchor) => (ppsvIntervalDays != null
    ? dueState(anchor, ppsvIntervalDays, today)
    : dueStateMonths(anchor, ppsvIntervalMonths, today));
  // S15 (2026-10-16): mm7401a1 at BOTH age bands. The 19–49 card used to link
  // rr7203a1 (2023), which the owner identified as out of date — it is the
  // document whose stale rows produced two findings in the S15 plan that the
  // current sources contradict. mm7401a1's clinical guidance table carries all
  // three adult blocks (>=50, 19–49 IC/CSF/cochlear, 19–49 chronic), so it
  // covers every adult row this file uses. Do not reinstate rr7203a1 here.
  const refs = collectRefs(riskIds, [
    'cdcAdultPneumo', 'cdcAdultTimingJobAid', 'mmwr7401a1',
  ], 'adult');
  // Which sentence sits beside the PCV15->PPSV23 interval. It must state the
  // SAME number the card states, so it follows the same predicate.
  const ppsvIntervalCite = ppsvIntervalDays != null
    ? 'adultPcv15ThenPpsvShort'
    : 'adultPcv15ThenPpsv';
  const adultBrands = pcvRecBrands({ adult: true });

  // 19–49 with NO risk → not indicated (routine starts at 50).
  if (!isOlderAdult && !anyRisk) {
    return [rec({
      vaccine: 'PCV', status: 'not-indicated',
      doseLabel: 'Not indicated (no risk, <50y)',
      note: 'Routine pneumococcal vaccination begins at age 50 [c]. Adults 19–49 years are recommended a pneumococcal vaccine only with a qualifying risk condition [c].',
      noteCites: [cite('adultRoutine50'), cite('cdcAdultRiskFactorList')],
      refs,
    })];
  }

  const ppsvGiven = ppsv.count > 0;

  // ── Already complete by product ──────────────────────────────────────
  // PCV20 or PCV21 in history → complete.
  if (pcv.hasPCV20 || pcv.hasPCV21) {
    return [rec({
      vaccine: 'PCV', status: 'complete',
      doseLabel: `Complete (history includes ${pcv.hasPCV21 ? 'PCV21' : 'PCV20'})`,
      note: 'A pneumococcal series that includes PCV20 or PCV21 is complete — no PPSV23 and no further PCV needed [c].',
      noteCites: [cite('adultPcv20or21Complete')],
      refs,
    })];
  }
  // PCV15 + PPSV23 → complete.
  if (pcv.hasPCV15 && ppsvGiven) {
    return [rec({
      vaccine: 'PCV', status: 'complete',
      doseLabel: 'Complete (PCV15 + PPSV23)',
      note: 'PCV15 followed by PPSV23 is a complete pneumococcal series — no further doses needed [c].',
      noteCites: [cite('adultPcv15ThenPpsv')],
      refs,
    })];
  }

  // ── PCV15 only, no PPSV23 → INCOMPLETE: give PPSV23 ─────────────────
  if (pcv.hasPCV15 && !ppsvGiven) {
    const { dueToday, earliestNextDate } = ppsvDueState(pcv.lastDate);
    return [rec({
      vaccine: 'PPSV23', status: anyRisk ? 'risk-based' : 'due',
      doseLabel: `PPSV23 (≥${ppsvIntervalLabel} after PCV15) — completes the series`,
      dueToday, earliestNextDate,
      minIntervalDays: ppsvIntervalDays, minIntervalMonths: ppsvIntervalMonths,
      brands: ['PPSV23 (Pneumovax 23)'],
      note: {
        lead: `Give PPSV23 ≥${ppsvIntervalLabel} after the PCV15 dose [c] — the series is INCOMPLETE until then.${shorterMinimumNote}`,
        detail: 'PCV15 was given but PPSV23 is still pending; the pneumococcal series is complete once it is given. If PPSV23 is unavailable, a dose of PCV20 or PCV21 may be substituted to complete.',
      },
      noteCites: [cite(ppsvIntervalCite)],
      refs,
    })];
  }

  // ── PPSV23 given, no PCV15/PCV13 (no prior PCV OR unknown-product PCV) →
  //    give a PCV (≥1y after PPSV23) ─────────────────────────────────────
  // Fires for both "0 PCV + PPSV23" and "unknown-product PCV + PPSV23"
  // (pcv.count>0 but neither PCV13 nor PCV15 identified). Both resolve the same
  // way per ACIP: a PCV15/20/21 ≥1y after PPSV23 completes the series.
  if (ppsvGiven && !pcv.hasPCV13 && !pcv.hasPCV15) {
    const ppsvDate = ppsv.effective.find((d) => d.date)?.date || null;
    const { dueToday, earliestNextDate } = dueStateMonths(ppsvDate, MO12, today);
    return [rec({
      vaccine: 'PCV', status: anyRisk ? 'risk-based' : 'due',
      doseLabel: `PCV (PCV15, PCV20, or PCV21) ≥${ADULT_GAP_WORDS} after PPSV23`,
      dueToday, earliestNextDate, minIntervalMonths: MO12,
      brands: adultBrands,
      note: {
        lead: `Give 1 dose of PCV15, PCV20, or PCV21 ≥${ADULT_GAP_WORDS} after the PPSV23 dose [c].`,
        detail: 'PPSV23 was given previously, with no prior PCV or a PCV of unknown product. If PCV15 is chosen, no further PPSV23 is needed — the PPSV23 requirement is already met.',
      },
      noteCites: [cite('adultPpsvOnly')],
      refs,
    })];
  }

  // ── PCV13 only (no PPSV23) → PCV20 or PCV21 ≥1y → complete ───────────
  if (pcv.hasPCV13 && !ppsvGiven) {
    const { dueToday, earliestNextDate } = dueStateMonths(pcv.lastDate, MO12, today);
    return [rec({
      vaccine: 'PCV', status: anyRisk ? 'risk-based' : 'due',
      doseLabel: `PCV20 or PCV21 ≥${ADULT_GAP_WORDS} after PCV13 — completes the series`,
      dueToday, earliestNextDate, minIntervalMonths: MO12,
      brands: ['PCV20 (Prevnar 20)', 'PCV21 (Capvaxive)'],
      note: `PCV13 was given previously: give 1 dose of PCV20 or PCV21 ≥${ADULT_GAP_WORDS} after the last PCV13 dose [c]. This completes the series — no PPSV23 needed.`,
      noteCites: [cite('adultPcv13Only')],
      refs,
    })];
  }

  // ── PCV13 + PPSV23 → PCV20/PCV21 ≥5y (SCDM nuance by PPSV23 age) ─────
  if (pcv.hasPCV13 && ppsvGiven) {
    const anchor = lastDoseDate(pcv, ppsv);
    const { dueToday, earliestNextDate } = dueStateMonths(anchor, MO60, today);
    // PCV13+PPSV23 → shared decision ONLY when the PPSV23 dose was given at age
    // ≥65 (CDC adult notes) — NOT when the patient is merely ≥65 now. PneumoVax
    // captures both the patient's age and the PPSV23 date, so compute age-at-PPSV23
    // directly when the dose is dated; fall back to the current-age proxy only when
    // the PPSV23 dose is undated. (Verified against CDC PneumoRecs VaxAdvisor 2026-06-07.)
    const ppsvDateForAge = ppsv.effective.find((d) => d.date)?.date || null;
    let ppsvAtOrAfter65;
    if (ppsvDateForAge && dob) {
      // A-P0-1 (S10): compare the dose date against the patient's REAL 65th
      // birthday. This used to be `am - Math.round(daysBetween(...) / 30.4375)
      // >= M.y65` — a float current-age minus an elapsed span rounded to whole
      // months — which put up to half a month of error into the reconstructed
      // age at the dose and flipped the verdict either way within about two
      // weeks of the birthday (2,782 of 29,565 swept pairs, 9.4%). CDC's rows
      // say "at age 65 years or older", so the birthday itself counts.
      //
      // The 4-day grace does NOT apply: it governs whether a dose that was
      // given counts as valid, and this is not a validity floor — it selects
      // which of two CDC recommendation rows the patient is on.
      ppsvAtOrAfter65 = ppsvDateForAge >= addCalendarMonths(dob, M.y65);
    } else if (ppsvDateForAge) {
      // No date of birth: the best the app can honestly do is measure back
      // from today in calendar months. Unrounded, unlike the old expression.
      const ageAtPpsv = ageAtDoseMonths({ date: ppsvDateForAge }, { ageMonths: am }, today);
      ppsvAtOrAfter65 = ageAtPpsv != null && ageAtPpsv >= M.y65;
    } else {
      ppsvAtOrAfter65 = am >= M.y65; // proxy when PPSV23 is undated
    }
    // A dose received at >=65 implies the patient is >=65, which is >50, so the
    // old `isOlderAdult &&` half was dead. Removed rather than left looking
    // load-bearing (A-P0-1).
    const sharedDecision = ppsvAtOrAfter65;
    if (sharedDecision) {
      return [rec({
        vaccine: 'PCV', status: 'shared-decision',
        doseLabel: `PCV20 or PCV21 ≥${LONG_GAP_WORDS} (shared clinical decision-making)`,
        dueToday, earliestNextDate, minIntervalMonths: MO60,
        brands: ['PCV20 (Prevnar 20)', 'PCV21 (Capvaxive)'],
        note: {
          lead: `An additional PCV20 or PCV21, ≥${LONG_GAP_WORDS} after the last pneumococcal dose, is a shared clinical decision — it may be given or omitted [c].`,
          detail: 'PCV13 and PPSV23 have both been given, and the PPSV23 dose was received at age 65 or older. CDC places this group under shared clinical decision-making rather than a routine recommendation.',
        },
        noteCites: [cite('adultBothAt65')],
        refs,
      })];
    }
    // chronic-only adult <50: nothing now, review at 50.
    // Not the interval question. CDC's 19–49 special-situations rows split on
    // "cochlear implant, cerebrospinal fluid leak, or an immunocompromising
    // condition" (→ ≥5 years) versus chronic conditions (→ review at 50). Said
    // directly here rather than borrowed from the interval predicate, which is
    // how these two unrelated rules came to share one function (A-P1-1).
    if (!isOlderAdult && !hasIC(riskIds) && !hasSpecial(riskIds)) {
      return [rec({
        vaccine: 'PCV', status: 'complete',
        doseLabel: 'No dose now — review at age 50',
        note: {
          lead: 'No additional pneumococcal dose now — re-evaluate at age 50 [c].',
          detail: `This is an adult aged 19–49 with a chronic (non-immunocompromising) condition who has already received PCV13 and PPSV23. At age 50, a dose of PCV20 or PCV21 is recommended, ≥${LONG_GAP_WORDS} after the last pneumococcal dose.`,
        },
        noteCites: [cite('adultBothNotAt65')],
        refs,
      })];
    }
    return [rec({
      vaccine: 'PCV', status: anyRisk ? 'risk-based' : 'due',
      doseLabel: `PCV20 or PCV21 ≥${LONG_GAP_WORDS} after last pneumococcal dose — completes the series`,
      dueToday, earliestNextDate, minIntervalMonths: MO60,
      brands: ['PCV20 (Prevnar 20)', 'PCV21 (Capvaxive)'],
      note: `PCV13 and PPSV23 already given: give 1 dose of PCV20 or PCV21 ≥${LONG_GAP_WORDS} after the last pneumococcal dose [c]. This completes the series.`,
      noteCites: [cite('adultBothNotAt65')],
      refs,
    })];
  }

  // ── None / unknown / PCV7-only → start a PCV ────────────────────────
  // (PCV7-only is handled by validate.js dropping PCV7 → pcv.count===0 here.)
  return [rec({
    vaccine: 'PCV', status: anyRisk && !isOlderAdult ? 'risk-based' : 'due',
    doseLabel: '1 dose PCV (PCV20, PCV15, or PCV21)',
    dueToday: true, earliestNextDate: null,
    brands: adultBrands,
    note: isOlderAdult
      ? {
        // S15: the 8-week option belongs here too. mm7401a1's >=50 "None or
        // PCV7 only" row names it in the same breath as the year — "A minimum
        // interval of 8 weeks can be considered if PCV15 is used in adults
        // with an immunocompromising condition, cochlear implant, or CSF leak"
        // — and this card was the one >=50 surface that left it out, so an
        // IC adult saw the option only after the PCV15 was recorded.
        lead: `Give 1 dose of PCV20 or PCV21 — OR 1 dose of PCV15 followed by PPSV23 ≥${ppsvIntervalLabel} later [c].${shorterMinimumNote}`,
        detail: 'Routine pneumococcal vaccination for adults ≥50 with no, unknown, or PCV7-only history. A PCV7-only history counts as no PCV history [c]. PCV20 and PCV21 each complete the series alone [c].',
      }
      : {
        // No shorterMinimumNote here: at 19–49 the 8 weeks is already the
        // interval in `ppsvIntervalLabel` for this class, so the sentence
        // could only ever be empty. S6-3's rule — do not leave a branch that
        // cannot fire looking load-bearing.
        lead: `Give 1 dose of PCV15, PCV20, or PCV21. If PCV15 is chosen, follow with PPSV23 ≥${ppsvIntervalLabel} later [c].`,
        detail: 'This is an adult 19–49 with a qualifying risk condition and no, unknown, or PCV7-only pneumococcal history; the series is complete once the PPSV23 follow-up is given. A PCV7-only history counts as no PCV history [c]. PCV20 and PCV21 each complete the series alone [c].',
      },
    noteCites: [
      cite(isOlderAdult ? 'adultRoutine50' : ppsvIntervalCite),
      cite('adultPcv7Only'),
      cite('adultPcv20or21Complete'),
    ],
    refs,
  })];
}

// Most recent dose date across PCV + PPSV23 effective lists.
function lastDoseDate(pcv, ppsv) {
  const dates = [];
  if (pcv.lastDate) dates.push(pcv.lastDate);
  for (const d of ppsv.effective) if (d.date) dates.push(d.date);
  dates.sort();
  return dates.length ? dates[dates.length - 1] : null;
}

// ═══════════════════════════════════════════════════════════════════════════
//  PCV21 geographic advisory (adults only)
// ═══════════════════════════════════════════════════════════════════════════
function pcv21GeoNote(am, recs) {
  const adult = am >= M.y18;
  if (!adult) return null;
  const offersPcv21 = recs.some((r) => (r.brands || []).some((b) => b.includes('PCV21')));
  if (!offersPcv21) return null;
  return {
    note: 'PCV21 (Capvaxive) does not contain serotype 4. In regions where serotype 4 causes a high share of pneumococcal disease (e.g., Alaska, Colorado, the Navajo Nation, New Mexico, Oregon), PCV20 — or PCV15 followed by PPSV23 — may provide broader coverage. This is an advisory note, not a hard rule.',
    citations: resolveRefs(['mmwr7336a3']),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
//  Hard-stop exclusion (hematopoietic cell transplant / CAR-T therapy /
//  B-cell malignancy / B-cell-depleting therapy) — too heterogeneous for one
//  safe recipe. Verified live against CDC's ACIP General Best Practice
//  Guidelines, "Altered Immunocompetence" page, 2026-09-12.
//
//  Transplant joined this stop on 2026-10-16 (owner decision). It had its own
//  advisory pathway printing a four-dose PCV20 recipe; that recipe's clinical
//  content was wrong or half-updated five times across the two apps in five
//  weeks. See docs/archive/plan-2026-10-16-transplant-hard-stop-both-apps.md.
//
//  MIRRORED: MeningoVax's EXCLUSION_MESSAGE is byte-identical to this one, and
//  regression-2026-10-16-transplant-stop-mirrors-meningovax.test.js compares
//  the two files. The non-breaking hyphens (U+2011) are load-bearing twice
//  over — they stop "CAR-T" and "B-cell" breaking mid-term on a phone, and the
//  mirror test compares bytes.
//
//  The four authorities are named in WORDS, not linked (decision 6 of the
//  plan): a sentence naming ASCO, NCCN, IDSA and CDC is still true in 2030,
//  while a URL to the 2024 ASCO guideline is not — and every refs.js entry is
//  an annual re-read enforced by citation-freshness.test.js.
// ═══════════════════════════════════════════════════════════════════════════
const EXCLUSION_MESSAGE = 'Revaccination after hematopoietic cell transplant, '
  + 'CAR‑T therapy, or B‑cell–depleting therapy follows a '
  + 'transplant‑ or therapy‑specific protocol, not age‑based '
  + 'scheduling, and some live vaccines may be contraindicated. Follow your '
  + 'institutional protocol or current national guidance (ASCO, NCCN, IDSA, '
  + 'CDC).';

// ═══════════════════════════════════════════════════════════════════════════
//  PUBLIC API
// ═══════════════════════════════════════════════════════════════════════════
export function recommend(input) {
  // P3-1 (S10): the patient's date of birth, when the clinician gave one. It is
  // what lets the engine compare a dose date against a real birthday — the
  // 65th for the PPSV23 shared-decision rule, the minimum ages in validate.js —
  // instead of reconstructing birthdays from months x 30.4375. A patient
  // entered as years/months has no `dob` and keeps the approximate path.
  const dob = input.dob ?? null;
  const riskIds = input.riskIds ?? [];
  const today = todayISO(input.today);
  // When a date of birth is given, the age follows from it. App passes both,
  // but deriving here means a caller that passes only a date of birth cannot
  // silently land on age 0 and be routed to the infant schedule.
  const am = input.ageMonths ?? (dob ? dobToAgeMonths(dob, today) : null) ?? 0;

  // ── Hard-stop exclusion wins over everything, and since 2026-10-16 the
  //    transplant tick IS one of these rows rather than a separate advisory.
  //
  //    It also wins over a risk factor the clinician ticked alongside it that
  //    would have produced a card on its own (decision 2 of the hard-stop
  //    plan, which deliberately retires the 2026-09-19 C2-6 fix). The reason
  //    is that there is no way to say "this half of your answer is safe" on a
  //    screen whose whole point is that this patient's schedule cannot be
  //    computed here.
  if (hasExclusion(riskIds)) {
    return {
      excluded: true,
      exclusionMessage: EXCLUSION_MESSAGE,
      exclusionCitations: resolveRefs(['cdcAlteredImmunocompetence']),
      recs: [],
      pcv21Geo: null,
      // P6-5 (S13, 2026-10-10): ARRAYS, not `{}`. Every other return path
      // sets these to the walk's perDose, which is an array, so the
      // hard-stop path was the one shape a consumer could not iterate. Latent
      // while Results re-walked the history itself; a crash the moment it
      // started reading these instead.
      perDose: { pcv: [], ppsv23: [] },
      // P0 (2026-10-12): the doses in the order their verdicts are in. Empty
      // here for the same reason perDose is, and an ARRAY for the same
      // reason — a consumer iterating it must not have to special-case the
      // hard stop.
      orderedDoses: { pcv: [], ppsv23: [] },
      meta: { ageMonths: am, dob, today, riskIds, pcvCount: 0, ppsv23Count: 0 },
    };
  }
  // P1-3 (2026-10-12): rows nobody typed in are not doses — but they are
  // dropped ONCE, inside the walk (`analyzeBoth`), not here. These two lists
  // are only ever handed to that walk, and `meta.pcvCount` is counted from
  // its output, so a second filter here would be a second place that decides
  // what a dose is. An earlier draft of this fix had one; removing it changed
  // no test, which is exactly what a redundant source of truth looks like
  // before it drifts. If you need blanks gone somewhere new, call
  // `dropBlankDoseRows` there — do not re-add it here.
  const rawPcv = (input.pcvDoses ?? []).filter(Boolean);
  const rawPpsv = (input.ppsv23Doses ?? []).filter(Boolean);

  // Validate + filter to effective lists (PCV7 dropped; invalid doses dropped).
  // ANCHOR-1 (owner decision 2026-10-11): ONE call, both streams, judged in
  // date order — so every gap is measured from a dose that COUNTED.
  //
  // This used to be two calls, and the order of them was the bug. The PCV call
  // ran first and was handed `rawPpsv`, the PPSV23 stream INCLUDING doses that
  // did not count, because their verdicts did not exist yet; the PPSV23 call
  // then got `pcvAnalysis.effective`, the counting PCV doses only (peds audit
  // P1-4). So a PPSV23 that had itself been rejected could still void a later
  // PCV dose — a 70-year-old's PCV20 was turned away for sitting too close to
  // a PPSV23 that the app had already set aside. Whichever stream went first
  // was going to have this problem; two calls cannot both see the other's
  // verdicts. `analyzeBoth` walks them together instead, which works because
  // every interval is measured from an EARLIER dose.
  //
  // Risk class goes in once now, so the two streams cannot be handed different
  // risk lists (S3-N1: it decides whether the 8-week minimum may be CONSIDERED
  // for an adult's PPSV23 after a PCV15 — immunocompromising condition,
  // cochlear implant, CSF leak — and without it every adult is judged against
  // the flat 1-year advice).
  const analysis = analyzeBoth({
    pcvDoses: rawPcv,
    ppsv23Doses: rawPpsv,
    ageMonths: am,
    today,
    dob,
    riskIds,
  });
  const pcvAnalysis = analysis.pcv;
  const ppsvAnalysis = analysis.ppsv23;
  const effectivePcv = pcvAnalysis.effective;
  const effectivePpsv = ppsvAnalysis.effective;

  const pcv = summarizePcv(effectivePcv, am, today, dob);
  const ppsv = { count: effectivePpsv.length, effective: effectivePpsv };

  // ── Standard (age/history/risk) recommendations ──────────────────────
  let recs;
  if (am < M.m24) {
    recs = pcvInfant(am, pcv, today);
  } else if (am < M.y18) {
    // Children 2–18y: at-risk pathway wins over healthy when a risk is present.
    // P3-9b: the paediatric pathway sees only the paediatric risk ids, so an
    // adult-only tick cannot route the child here.
    //
    // ⚠️ This comment used to go on: "and cannot drag an adult citation
    // (cdcAdultPneumo / mmwr7203a1) into a child's card via collectRefs
    // either." THAT WAS FALSE, and it stood for four days. Measured
    // 2026-10-16: 12 of 17 risk conditions did exactly that. `pedsRiskIds`
    // strips ticks flagged `adultOnly` — the right filter for ROUTING, which
    // is what P3-9b was about — but a condition that exists at every age
    // (asplenia, HIV, diabetes) is not `adultOnly`, lists both CDC pages, and
    // sailed straight through. Citations are now filtered by the SOURCE's own
    // declared rulebook instead (N6; see collectRefs and refs.js), which is a
    // different question from routing and is answered separately.
    //
    // The lesson, written where the claim was: a comment asserting that
    // something cannot happen is a test that does not run. This one is now
    // `regression-n6-citations-follow-the-rulebook.test.js`.
    const pedsIds = pedsRiskIds(riskIds);
    if (pedsRiskRowClass(pedsIds)) {
      recs = pcvRiskChild(am, pedsIds, pcv, ppsv, today);
    } else {
      recs = pcvHealthyChild(am, pcv, ppsv, today);
    }
  } else {
    recs = pcvAdult(am, riskIds, pcv, ppsv, today, dob);
  }

  // ── PCV21 geographic advisory ─────────────────────────────────────────
  const pcv21Geo = pcv21GeoNote(am, recs);

  return {
    recs,
    pcv21Geo,
    perDose: { pcv: pcvAnalysis.perDose, ppsv23: ppsvAnalysis.perDose },
    // P0 (2026-10-12): `orderedDoses[v][i]` is the dose `perDose[v][i]` was
    // computed for. A caller rendering a verdict beside its dose reads BOTH
    // from here; reading its own input array alongside `perDose` is what put
    // every verdict on the wrong row for a history typed newest-first.
    orderedDoses: { pcv: pcvAnalysis.doses, ppsv23: ppsvAnalysis.doses },
    meta: { ageMonths: am, dob, today, riskIds, pcvCount: pcv.count, ppsv23Count: ppsv.count },
  };
}
