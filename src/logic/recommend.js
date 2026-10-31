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
import { dobToAgeMonths, fmtDate } from './format.js';
import { analyzeBoth } from './validate.js';
import { ageAtDoseMonths } from './patientAge.js';
import { pcvNextDoseMinIntervalCell, intervalPhrase } from './intervals.js';
import { ADULT_SCHED_MIN_M, ROUTINE_ADULT_MIN_M } from './scheduleConstants.js';
import { ADULT_OWED_AFTER_INVALID_DOSE } from './doseIntervalRules.js';

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

// P2 (2026-10-30, OWNER RULING 2026-10-29): an immunocompromised child's early
// second PPSV23 COUNTS, and no third is given. Every card that tells such a
// child "complete" adds this, so the card says what the chip under the dose
// says. CDC's child notes have no third PPSV23 anywhere (read live 2026-10-30:
// "dose 2 PPSV23" three times, no "dose 3").
const earlySecondPpsv23 = (ppsv) => (ppsv.secondCameEarly
  ? ` The second PPSV23 came less than ${LONG_GAP_WORDS} after the first; it is counted, and no third PPSV23 is given.`
  : '');

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
// `anchorDose` is validate.js's own anchor for this stream — the last DATED
// dose, INCLUDING one rejected for spacing and EXCLUDING PCV7. It is passed in
// rather than recomputed here because the validator already decides which
// doses may anchor, and two places deciding that separately is exactly the
// fault RULING D fixes (see the `anchorDate` field below).
function summarizePcv(pcvDoses, am = 0, today = null, dob = null, anchorDose = null) {
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
    // Age in months at the dose `lastDate` names. Derived from `lastDated`
    // rather than counted in the loop above so that a key and a date can
    // never refer to different doses. null when undated.
    lastAgeAtDose: lastDated && today
      ? ageAtDoseMonths(lastDated, { dob, ageMonths: am }, today)
      : null,

    // ── The SAME-STREAM interval anchor — RULING D (owner, 2026-10-23) ──
    //
    // "The repeat dose should be spaced from the invalid dose by the minimum
    // interval. This should be followed." ACIP's General Best Practices says
    // the same in its own words, and names hepatitis B as the only vaccine
    // that anchors on the valid dose instead; pneumococcal is not an
    // exception there.
    //
    // So this is deliberately NOT `lastDate`. `lastDate` is the last dose that
    // COUNTED; `anchorDate` is the last dose the patient actually RECEIVED
    // that can anchor a gap — a dose rejected for spacing does, PCV7 does not.
    // For a patient with no rejected dose the two are the same date, which is
    // every patient the app saw before this change.
    //
    // ⚠ The DATE and the AGE AT IT move together and must always name one
    // dose. The series POSITION (dose number, totals, `band`) does not move:
    // it still counts only doses that counted, because that is how CDC's
    // catch-up table counts a "previous dose". That split is not invented
    // here — it is the validator's, copied: DOSE_INTERVAL_RULES'
    // CHILD-PCV-AFTER-PCV already takes `ageAtPrevDose` from the anchor and
    // `doseNumber` from the kept list.
    anchorDate: anchorDose?.date ?? (lastDated?.date || null),
    anchorAgeAtDose: anchorDose
      ? anchorDose.ageAtDose
      : (lastDated && today
        ? ageAtDoseMonths(lastDated, { dob, ageMonths: am }, today)
        : null),
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

// P2 (2026-10-30, OWNER RULING on "Sofia"): an immunocompromised child who has
// had TWO counting PPSV23 doses is never offered a third (her ruling of
// 2026-10-29). If the conjugate came AFTER both of them, CDC's row is not
// finished — it orders "1 dose PCV20 or 1 dose PPSV23 at least 8 weeks after
// the most recent PCV13 dose" — so the PCV20 is still owed, alone. The lead
// says why the other option is missing, so its absence is not a mystery.
const IC_TWO_PPSV23_PCV20_LEAD = `Give 1 dose of PCV20 ≥${LONG_GAP_WORDS} after the first PPSV23 [c]. Two PPSV23 doses have already been given, so a PPSV23 is not offered — no third PPSV23 is given.`;
const icFurtherDoseLead = (noThird) => (noThird ? IC_TWO_PPSV23_PCV20_LEAD : IC_POST_PPSV23_LEAD);
const whicheverProduct = (noThird) => (noThird ? '' : ', whichever product is chosen');

// ── C8 (2026-10-23): the five-year step, cited on BOTH of its cards ──────
//
// An immunocompromised child who has had a PPSV23 is shown two cards — the
// PCV20, and the 2nd PPSV23 as the alternative — and until now only the PCV20
// one credited anything from CDC's schedule notes. On the alternative card the
// notes sat as a grey button no number pointed at: 603 cards, the single
// largest uncredited group left in that document.
//
// CDC states BOTH options in one sentence ("administer either PCV20 or dose 2
// PPSV23 at least 5 years after dose 1 PPSV23"), so the row that speaks for the
// PCV20 card speaks for this one too. WHICH row that is depends on the child's
// history, and the caller passes it: there are four of them, one per branch,
// and a card must quote the branch its own patient is in (FINDING K, FINDING N).
const icFiveYearAlternative = (rowCite) => ({
  note: {
    lead: `Alternative to the PCV20 above: a 2nd PPSV23 ≥${LONG_GAP_WORDS} after the first PPSV23 [c]. Choose ONE option (PCV20 or 2nd PPSV23), not both.`,
    detail: "CDC's own row for this history names both options in one sentence and puts the second PPSV23 at that same five years [c].",
  },
  noteCites: [cite('pedsIcPpsvWaitFiveYears'), rowCite],
});

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
//
// FINDING D (2026-10-17): `riskIds` was added. This function used to take none,
// so the under-2 pathway could not tell a baby with asplenia from a healthy
// one and gave both the healthy child's citation — a sentence that opens "For
// children WITHOUT RISK CONDITIONS". The risk class does not change a single
// dose or date before age 2 (CDC's at-risk rows begin at "Age 2-5 years");
// it changes which sentence is true of this child, and what happens next.
// The caller passes `pedsRiskIds(riskIds)`, so an adult-only tick cannot reach
// here, exactly as it cannot reach `pcvRiskChild`.
function pcvInfant(am, riskIds, pcv, today, dob) {
  const rowClass = pedsRiskRowClass(riskIds);   // 'IC' | 'nonIC' | null
  const prior = pcv.count;
  // A CARD CREDITS ONLY THE DOCUMENTS THAT SPEAK FOR IT. Until C10-1
  // (2026-10-23) this was one flat list spread over every card the function
  // builds -- the exact shape CLAUDE.md forbids, and the last block still
  // doing it. `infantRefsExcept` is the twin of `adultRefs` / `childRefsExcept`
  // / `healthyRefsExcept`; the default is unchanged, so a card that does rest
  // on both documents still lists both.
  const INFANT_DEFAULT_REFS = ['cdcChildPneumo', 'p2016'];
  /** The pathway defaults, minus documents that do not speak for this card. */
  const infantRefsExcept = (...drop) => INFANT_DEFAULT_REFS.filter(
    (k) => !drop.includes(k),
  );
  const brands = pcvRecBrands({ adult: false });
  // RULING D (2026-10-23): the dose the child actually received, which is the
  // last VALID one for every patient without a rejected dose. See
  // `summarizePcv`'s `anchorDate`.
  const anchor = pcv.anchorDate;

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
  // The VALIDITY FLOOR used to be deliberately untouched (owner decision 2 of
  // 2026-10-11): a dose already given was graded by a MORE PERMISSIVE reading,
  // so nothing a clinician had done was retroactively invalidated. OWNER
  // DECISION 2026-10-23 REVERSED THAT. Shown a 15-month-old whose third dose
  // came 4 weeks after a dose at 11.3 months, she ruled that it "does not
  // satisfy the required interval and does not count" — and the app had been
  // advising 8 weeks for that very dose while accepting 4. Both sides now read
  // CDC Table 2 through one function — `pcvNextDoseMinIntervalCell`, which
  // C10-2 made the home of the branching and which `pcvNextDoseMinIntervalDays`
  // (still the validator's entry point) now wraps — so there is one reading and
  // not two. See `doseIntervalRules.js`'s `CHILD-PCV-AFTER-PCV` row and
  // `regression-2026-10-23-pcv-dose3-floor-follows-cdc-table2.test.js`.
  //
  // The interval is computed BELOW rather than here, after `needs12moFloor` is
  // known, because the dose-4-and-beyond cell keys on the age at which the dose
  // will be GIVEN, and a final dose this function is holding back to the first
  // birthday will be given at 12 months however old the child is today.

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
  // C10-1 (2026-10-23): the ladder below IS p2016 Table 1, so it now RECORDS
  // which row it used (`t1row`) instead of leaving the card to be asked later
  // which row fits. That is the difference between the two faults this repo
  // keeps finding -- a wrong DOCUMENT on a card, which the column-fit guard
  // catches, and a wrong ROW of a document that does cover the patient, which
  // it cannot (see `regression-2026-10-18-every-p2016-card-has-a-row-that-fits`).
  // Recording the row closes the second one for this block by construction.
  //
  // A row is only CITED when its own stated total equals the number the card
  // ends up printing; `table1Row` below enforces that. The totals can part
  // company two ways -- the `prior + 1` reassignment further down, and a
  // mixed history Table 1 does not tabulate -- and in both the printed total
  // is the app's own arithmetic, which no row states. FINDING 2's rule.
  let target;
  let t1row = null;
  if (am < M.m7) {
    // "2 through 6 months": 0 prior -> "4 doses"; 1 -> "3 additional doses";
    // 2 -> "2 additional doses"; 3 -> "1 additional dose at age 12-15 months".
    // Every row sums to 4, so the band needs no sub-branching. No row is
    // recorded: a total of 4 prints CDC's routine sentence, which states it.
    target = 4;
  } else if (am < M.m12) {
    // "7 through 11 months", keyed on WHEN the prior doses were given.
    if (before7 >= 3) {
      target = before7 + 1;      // "3 before age 7 months" -> 1 additional
    } else if (before7 >= 1) {
      target = before7 + 2;      // "1 or 2 before age 7 months" -> 2 additional
      t1row = 'p2016Table1_7to11_oneOrTwoBefore7';
    } else if (m7to11 >= 2) {
      target = m7to11 + 1;       // "2 at age 7 months or older" -> 1 additional
      t1row = 'p2016Table1_7to11_twoAt7Plus';
    } else if (m7to11 === 1) {
      target = m7to11 + 2;       // "1 at age 7 months or older" -> 2 additional
      t1row = 'p2016Table1_7to11_oneAt7Plus';
    } else {
      target = 3;                // "0 before age 7 months" -> "3 doses"
      t1row = 'p2016Table1_7to11_noneBefore7';
    }
  } else {
    // "12 through 23 months".
    if (before12 >= 2) {
      target = before12 + 1;     // "2 or 3 before age 12 months" -> 1 additional
      t1row = 'p2016Table1_12to23_twoOrThreeBefore12';
    } else if (before12 === 1) {
      target = before12 + 2;     // "1 before age 12 months" -> 2 additional
      t1row = 'p2016Table1_12to23_oneBefore12';
    } else if (at12plus >= 1) {
      target = at12plus + 1;     // "1 dose at age 12 months or older" -> 1 additional
      t1row = 'p2016Table1_12to23_oneAt12Plus';
    } else {
      target = 2;                // "0 before age 12 months" -> "2 doses"
      t1row = 'p2016Table1_12to23_noneBefore12';
    }
  }
  // The total each recorded row STATES, for the equality check below. Table 1
  // writes a row either as a total ("3 doses") or as doses still owed ("2
  // additional doses"); both are read here as the total the row comes to, the
  // same arithmetic the ladder above uses.
  const t1rowTotal = target;

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

  // The p2016 Table 1 row to CITE, if any. A row earns the card's marker only
  // when the total it states is the total the card prints. The reassignment
  // just above is precisely when they part company: the child holds more doses
  // than their row contemplates and still owes the >=12-month closing dose, so
  // the printed total is the app's own arithmetic and no row says it. Same
  // rule as FINDING 2 at the top of the range, enforced by equality rather
  // than by a second reading of the ladder.
  // `target < 4` is part of the condition, not an optimisation. A child can
  // reach a total of exactly 4 through a 7-11-month row (two doses before 7
  // months, two more owed), and at 4 the lead prints CDC's OWN routine
  // sentence -- "4-dose series at 2, 4, 6, and 12-15 months" -- which states
  // that number. Letting the row take the lead's single marker there pushed
  // CDC off 231 cards it speaks for: a removal by side effect, which is the
  // FINDING F fault. p2016 is cited only where the card prints a total CDC
  // does not state.
  const table1Row = target < 4 && t1row && t1rowTotal === target ? t1row : null;

  if (prior >= target && boosterGiven) {
    // FINDING D + E (2026-10-17). Three different children reach this line and
    // CDC says three different things about them, so the card now says which
    // one it is talking to instead of giving all three the healthy sentence.
    //
    //   healthy          nothing further, ever. `pedsNoPcv20IfComplete` is
    //                    written about exactly this child ("For children
    //                    without risk conditions...").
    //   at risk, PCV20   nothing further either — a series containing PCV20
    //     in the series  completes an at-risk child too.
    //   at risk, no      complete TODAY, and a further dose falls due on the
    //     PCV20          child's second birthday, because CDC's at-risk rows
    //                    start at "Age 2-5 years". Saying nothing here left a
    //                    clinician reading "complete" with no reason to
    //                    re-check; the adult pathway has said "review at age
    //                    50" for the mirror-image patient all along.
    //
    // The IC and non-IC sentences are NOT the same sentence — only the IC one
    // carries the five-year follow-on — so each class quotes its own.
    const atRisk = rowClass !== null;
    const pcv20Done = pcv.hasPCV20;
    const nextDoseCite = rowClass === 'IC' ? 'pedsIcPcv20orPpsv23' : 'pedsRiskPcv20orPpsv23';
    const note = !atRisk
      ? 'The age-appropriate PCV series appears complete [c]. If any dose was PCV15, ensure a PPSV23 follow-up is given only when a risk condition is present (PPSV23 is not routine for healthy children).'
      : pcv20Done
        ? {
          lead: 'The age-appropriate PCV series appears complete [c].',
          detail: 'This child has a risk condition, and the series already includes PCV20, so no further pneumococcal dose is needed at age 2 years or later [c].',
        }
        : {
          lead: 'The age-appropriate PCV series appears complete [c].',
          // The interval comes from `intervalPhrase` like every other one in
          // this file — a hand-typed "8 weeks" here was caught by
          // regression-s6-5-interval-prose-one-home before it ever ran.
          detail: `This child has a risk condition. The series is complete for their age now, and one further dose falls due at age 2 years: 1 dose of PCV20, or 1 dose of PPSV23 given ≥${PNEUMO_GAP_WORDS} after the most recent PCV dose [c]. Re-check at the 2-year visit.`,
        };
    return [rec({
      vaccine: 'PCV', status: 'complete',
      ...pcvSeriesShape(pcv, am, target),
      doseLabel: `PCV series complete (${prior} dose${prior === 1 ? '' : 's'})`,
      note,
      // FINDING K (2026-10-18): `pedsRiskPcv20Complete` is the Age 6-18 instance
      // of CDC's sub-bullet, under the parent "Received PCV before age 6 years
      // but have not received PPSV23". This card is the under-2/2-5 one, and its
      // own sentence says "at age 2 years or later" -- so the quote it needs is
      // the AGE 2-5 instance, under "Completed recommended PCV series but have
      // not received PPSV23". Same words in both of CDC's lists, different
      // parent from the 6-18 one, and a separate key so neither can be shown
      // where the other belongs.
      noteCites: !atRisk
        ? [cite('pedsNoPcv20IfComplete')]
        : [cite('pedsRoutine4Dose'), cite(pcv20Done ? 'pedsRiskPcv20CompleteAt2' : nextDoseCite)],
      refs: INFANT_DEFAULT_REFS,
    })];
  }

  const remaining = Math.max(1, target - prior);
  const doseNum = prior + 1;
  // The final dose must be at ≥12 months — if this is the last dose and the
  // child is <12mo, it is not due until 12 months.
  const isFinal = remaining === 1;
  const needs12moFloor = isFinal && am < M.m12;
  // ── The interval to the NEXT dose: CDC Catch-up Table 2, dose by dose ──
  //
  // Keyed off `anchor`, not off `prior`: an interval only exists when there is
  // a DATED earlier dose to measure it from. With no prior dose (or only
  // undated ones) the honest answer is null, not a number nothing was measured
  // against — dueState short-circuits on a null anchor anyway.
  //
  // `ageAtThisDose` is the age at which the advised dose will be GIVEN, which
  // is 12 months exactly when `needs12moFloor` is holding it to the first
  // birthday — the owner's 2026-10-23 ruling that "the booster is defined by
  // age, not by how many doses came before it". Passing `am` there would advise
  // 4 weeks for a 6-month-old's booster, which she ruled owes 8.
  // C10-2: the CELL is taken from the same call that produces the number, so the
  // citation can never drift from the figure it is citing. See the ⚠ in
  // `pcvNextDoseMinIntervalCell` — a second reading of this table is the P0 bug.
  const minCellResult = anchor
    ? pcvNextDoseMinIntervalCell({
      doseNumber: prior + 1,
      ageAtPrevDose: pcv.anchorAgeAtDose,
      currentAgeMonths: am,
      anyDoseBefore12: pcv.band.before12 >= 1 || pcv.band.undated >= 1,
      ageAtThisDose: needs12moFloor ? M.m12 : am,
    })
    : null;
  const minInterval = minCellResult ? minCellResult.days : null;
  const minCell = minCellResult ? minCellResult.cell : null;

  // ── C10-2 (2026-10-23): the date the app ADVISES is not the floor ───────
  //
  // Until now this block had ONE number for the next dose — CDC Catch-up
  // Table 2's minimum interval — and used it for everything: the date, the
  // `dueToday` flag, and the sentence a clinician reads. A minimum interval is
  // the earliest a dose may be given and still COUNT. It is not when to bring
  // the child back. Measured on the owner's worked patient F (healthy, 4
  // months old, PCV20 at 2.0 and 3.0 months): the app said "PCV dose 3 of 4 …
  // due 4 weeks after the most recent one", `dueToday: true` — advising the
  // third dose at 4 months, where CDC's series (quoted on that very card) puts
  // it at 6.
  //
  // TWO OWNER RULINGS, 2026-10-23, set the shape:
  //
  //   RULING A ranks the paediatric documents — CDC/ACIP Notes → immunize.org
  //   p2016 → CDC catch-up table — and CDC's own catch-up page agrees it is an
  //   adjunct: "Always use this table in conjunction with Table 1 and the Notes
  //   that follow." So where p2016 states a spacing, p2016's number is the
  //   ADVICE and the catch-up table's stays the floor.
  //
  //   RULING C is the limit: "the validity floor does NOT change. A dose
  //   already given is graded by the rule that applied to that dose. Only the
  //   *recommended* number moves." `minInterval` above is therefore untouched,
  //   and patient E (PCV20 at 11 and 12.5 months, a 6-week gap) keeps her
  //   second dose, which p2016's footnote read as a floor would have voided.
  //
  // ⚠ BOTH NUMBERS GO ON THE CARD, and that is not optional. The P0 fix
  // earlier today removed a state where the app named one date and then
  // silently accepted a dose given earlier — "the app had two numbers for one
  // dose". Rulings A and C together deliberately re-create two numbers (advise
  // 8 weeks, accept 4), so the minimum is STATED in the note instead of
  // hidden. A second number the reader can see is not that bug; an invisible
  // one is.
  //
  // WHY 8 WEEKS NEEDS NO PER-ROW TABLE. All eight of p2016 Table 1's catch-up
  // rows state eight weeks — read off the quotes C10-1 transcribed from the PDF
  // on 2026-10-23 ("1 dose at least 8 weeks after most recent dose", "2 doses 8
  // weeks apart", and so on). CDC's own routine series is 8-week spacing too (2,
  // 4, 6 months). So the recommended spacing is one number; it is the ROUTINE
  // AGES that vary, and only in the 2-6-month band, which is the one band with
  // no Table 1 row because CDC's routine sentence covers it.
  //
  // ⚠ AND THE SPACING APPLIES ONLY WHERE A ROW STATES IT. The 2-6-month band is
  // the one band with no Table 1 row, because CDC's routine sentence covers it
  // — and p2016 does NOT state an 8-week spacing there: its 2-6-month rows read
  // "4 doses … last dose at age 12-15 months" and, as C7's reading of the PDF
  // recorded, p2016 "never prints the 2/4/6 months". So in that band the advice
  // is CDC's routine AGES, and if those have passed the honest remaining
  // statement is the minimum, which CDC's catch-up table does state. A first
  // draft applied 8 weeks to every band and would have printed a number no
  // document on the card says.
  const RECOMMENDED_SPACING_DAYS = WK8;
  // CDC's routine series, "2, 4, 6, and 12-15 months", by dose number. The
  // closing dose is absent on purpose: `needs12moFloor` already holds it to the
  // first birthday, which is where CDC's 12-15-month window opens.
  const ROUTINE_DOSE_AGE_M = { 1: 2, 2: 4, 3: 6 };
  const routineAgeM = ROUTINE_DOSE_AGE_M[doseNum] ?? null;
  // The date this child turns `routineAgeM` months old. With a date of birth on
  // file that is exact calendar arithmetic; without one (a patient entered as
  // years/months) it is derived from the age instead, carrying the same
  // approximation that path already has everywhere else. Null when the routine
  // age has no meaning for this dose number.
  const routineAgeDate = routineAgeM == null
    ? null
    : dob
      ? addCalendarMonths(dob, routineAgeM)
      : addCalendarMonths(today, Math.max(0, routineAgeM - am));
  // Has the routine age already gone by? A card may still be ADVISING the
  // routine age when the child is long past it — a 12-month-old whose only
  // PCV15 was at 2 months is owed dose 2, whose routine age is 4 months, and
  // the `max` below picks that date because it is later than both the 4-week
  // minimum and the 8-week spacing. The DATE is right; the old sentence read
  // it out as an instruction ("The next dose is due at age 4 months") to a
  // clinician looking at a one-year-old. 198 of 17,016 real patients read a
  // routine age they had already passed. Wording only — this flag is used
  // nowhere but the note. Guard:
  // regression-2026-10-24-a-card-never-advises-an-age-already-passed.test.js
  const routineAgePassed = routineAgeDate != null && routineAgeDate <= today;
  const minDate = anchor && minInterval != null ? addDays(anchor, minInterval) : null;
  // `t1row`, not `table1Row`: the citable-for-the-total test is an equality on
  // the TOTAL, and it has no bearing on whether the row states a spacing. The
  // ladder picked `t1row` from this child's actual history, so its history
  // columns fit her by construction — which is what the column-fit rule asks.
  const spacingDate = anchor && t1row ? addDays(anchor, RECOMMENDED_SPACING_DAYS) : null;
  // The advised date is the LATEST of the three — and that single `max` IS the
  // answer to the open design question the owner agreed was real: a child
  // genuinely behind (first dose at 9 months) has no routine date left, so the
  // routine term simply stops binding and the recommendation collapses to the
  // minimum. Nothing is ever advised earlier than the floor allows.
  const advisedDate = [minDate, spacingDate, routineAgeDate]
    .filter(Boolean)
    .sort()
    .at(-1) ?? null;
  // Which constraint actually decided it, so the note can name its own reason
  // instead of printing a spacing it did not use. Patient F's date comes from
  // the routine age (6 months), not from 8 weeks after her 3-month dose.
  const advisedReason = advisedDate == null ? null
    : advisedDate === routineAgeDate && advisedDate !== spacingDate && advisedDate !== minDate
      ? 'routineAge'
      : advisedDate === spacingDate ? 'spacing' : 'minimum';
  const advisedDueToday = anchor ? (advisedDate == null || advisedDate <= today) : true;
  const dueToday = advisedDueToday;
  const earliestNextDate = advisedDueToday ? null : advisedDate;
  const due = needs12moFloor ? false : dueToday;
  // The minimum, in words — but only where a clinician could act on it. Three
  // cases, and the first two were wrong in the first draft of this change:
  //
  //   • The dose is already due. There is no earlier date to offer, so saying
  //     "it can be given from 2025-07-04" (patient D, a year overdue) is noise
  //     pointing at a date in the past.
  //   • The advised date is in the future but the minimum has already passed —
  //     patient F, whose 4-week minimum fell four days ago. The useful sentence
  //     is "today", not the stale date.
  //   • Both are in the future: name the date.
  const showMinClause = !(!minDate || advisedDueToday || !advisedDate || advisedDate <= minDate);
  // The minimum is a CDC catch-up cell, so it takes a marker — but only when
  // Table 2 actually prints a branch for this patient (`minCell`). Where it does
  // not, the number is still stated and simply credits nobody, rather than
  // borrowing the nearest-looking row.
  const minClauseCite = showMinClause && minCell ? minCell : null;
  const minMark = minClauseCite ? ' [c]' : '';
  const minClause = !showMinClause
    ? ''
    : minDate <= today
      ? `; it can be given today if needed, as the minimum interval of ${intervalPhrase({ days: minInterval })} has already passed${minMark}`
      : `; it can be given from ${fmtDate(minDate)} if needed, which is the minimum interval of ${intervalPhrase({ days: minInterval })}${minMark}`;
  // The document that states the advised number itself. Each branch is credited
  // to the one source whose own words carry it:
  //   routineAge -> CDC's notes, "4-dose series at 2, 4, 6, and 12-15 months"
  //   spacing    -> the p2016 Table 1 row, "8 weeks after most recent dose"
  //   minimum    -> the CDC catch-up cell, when Table 2 prints one
  // `null` where the advice has no anchor to measure from, which states nothing
  // a document could speak for.
  const advisedCiteRaw = !anchor ? null
    : advisedReason === 'routineAge' ? 'pedsRoutine4Dose'
      : advisedReason === 'spacing' ? t1row
        : minCell;
  // The lead's one marker, named here so the detail can avoid repeating it.
  const leadCite = target > 4
    ? 'pedsInfantLastDose1215mo'
    : table1Row || 'pedsRoutine4Dose';
  // ⚠ NOT CITED AGAIN WHERE THE LEAD ALREADY CITES IT. A p2016 Table 1 row
  // states the child's TOTAL and her SPACING in one sentence ("2 additional
  // doses: 1 dose at least 8 weeks after most recent dose"), so crediting it on
  // both clauses gives ONE SENTENCE TWO NUMBERS — which `regression-c8-2026-10
  // -23-infant-catchup-credits-the-booster-row`'s "no card anywhere gives the
  // SAME sentence two numbers" forbids outright, and which it caught here. The
  // interval still rests on that row; the row is already numbered on the card.
  // This is the same conditional C8 used for CDC's notes at a total of 4.
  // The closing "final/booster dose is given at >=12 months" marker, which
  // exists only when the total is not exactly 4. Named here for the same
  // reason `leadCite` is: the advised marker has to know every OTHER marker
  // the card will carry before it can decide whether it is a duplicate.
  //
  // RULING D (2026-10-23) found the gap. The dedupe above compared the advised
  // document against the LEAD's only, which was enough while a child whose
  // every dose had been rejected reached this card with no anchor at all —
  // `anchor` was null, so no advised marker was emitted and the clash could
  // not occur. Once a rejected dose anchors, it can: a 12-month-old whose only
  // PCV20 was given below the minimum age gets "due at age 12 months,
  // following the routine 2, 4, 6 and 12-15 month series [c]" AND "the
  // final/booster dose is given at >=12 months [c]", both pointing at CDC's
  // notes — one sentence, two numbers, on 132 cards. Caught by
  // `regression-c8-2026-10-23-infant-catchup-credits-the-booster-row`'s "no
  // card anywhere gives the SAME sentence two numbers", which is exactly the
  // sweep that invariant exists for.
  //
  // `minClauseCite` needs no such test: `showMinClause` is false unless the
  // advised date is strictly LATER than the minimum, so the advised branch is
  // never the minimum when that clause is shown.
  const boosterCite = target !== 4 ? 'pedsRoutine4Dose' : null;
  const advisedCite = (advisedCiteRaw === leadCite || advisedCiteRaw === boosterCite)
    ? null
    : advisedCiteRaw;
  const advisedMark = advisedCite ? ' [c]' : '';

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
      //
      // FINDING 2 (2026-10-18). A third case: a total ABOVE 4, which neither
      // cited document prints. p2016's Table 1 keys its rows on 0–3 previous
      // doses and its largest total is "4 doses"; MMWR mm7137a3's Table 2 does
      // the same. So for a baby with four doses already given before age 7
      // months — all of them valid, none of them the ≥12-month booster — the
      // app's "5 doses in total" is its own arithmetic, and crediting p2016 for
      // the number 5 was the "card states a figure its quote never says" fault.
      //
      // OWNER DECISION 2026-10-18: cite MMWR Table 2, which states where the
      // LAST dose goes ("1 additional dose at age 12–15 mos"). The sentence now
      // shows the arithmetic — doses on record, plus the booster still owed —
      // so the [c] sits on the booster clause, which is the part the document
      // actually supports, instead of on a total that no document states.
      lead: `${target === 4
        ? 'Routine infant PCV (PCV15 or PCV20), 4-dose series at 2, 4, 6, and 12–15 months [c].'
        : target > 4
          ? `Catch-up infant PCV (PCV15 or PCV20): ${target} doses in total for this child — the ${pcv.count} already on record, and the booster still owed at age 12–15 months [c].`
          : `Catch-up infant PCV (PCV15 or PCV20): ${target} doses in total for this child [c].`}${needs12moFloor ? ' This final dose is not due until the patient reaches 12 months.' : ''}`,
      // C10-2: the clause names whichever constraint actually set the date, and
      // then states the minimum separately whenever the two differ. The old
      // sentence read the floor out as if it were the plan ("due 4 weeks after
      // the most recent one" for a 4-month-old whose routine date is 6 months),
      // and `minInterval === 28 ? '4 weeks' : '8 weeks'` hand-typed the words
      // beside the number — the exact drift `intervalPhrase` exists to stop.
      detail: `${!anchor
        ? 'There is no earlier dated dose to measure an interval from'
        : advisedReason === 'routineAge'
          ? (routineAgePassed
            // Past tense, and it says what the clinician can do about it. The
            // "can be given now" half is conditional because a card held back
            // to the first birthday (`needs12moFloor`) is NOT due today, and
            // its lead already says so — two clauses contradicting each other
            // on one card is the fault this whole fix is about.
            ? `This dose was due at age ${routineAgeM} months in the routine 2, 4, 6 and 12–15 month series and is overdue${due ? ' — it can be given now' : ''}`
            : `The next dose is due at age ${routineAgeM} months, following the routine 2, 4, 6 and 12–15 month series`)
          : `The next dose is due ${intervalPhrase({
            days: advisedReason === 'spacing' ? RECOMMENDED_SPACING_DAYS : minInterval,
          })} after the most recent one`}${anchor ? advisedMark : ''}${minClause}; the final/booster dose is given at ≥12 months${target !== 4 ? ' [c]' : ''}. If PCV15 is used, a PPSV23 follow-up is needed only for children with a risk condition.`,
    },
    // FINDING 2: a total above 4 is cited to MMWR Table 2's "last dose" row,
    // not to CDC's routine 4-dose sentence, which states a different number.
    //
    // C8 (2026-10-23): and CDC's notes earn the second number on those same
    // cards. 220 of them listed that page with nothing pointing at it, because
    // FINDING 2 had moved the lead's citation to MMWR. The page does state WHERE
    // the last dose goes — "4-dose series at 2, 4, 6, 12-15 months" — so the
    // marker sits on the booster clause, which is the half it supports, and
    // never on the total, which is still the app's own arithmetic. This is
    // FINDING 2's own rule applied to the second document rather than a new one.
    //
    // CONDITIONAL, deliberately: at a total of 4 or fewer the lead already
    // cites this page, and a document must not take two numbers on one card for
    // one claim (the same rule as `mmwrNoneRowCites` and the adult 8-week card).
    //
    // C10-1 (2026-10-23): and the SAME rule, applied at the bottom of the
    // range. A total BELOW 4 -- "2 doses in total for this child" -- was
    // footnoting CDC's "4-dose series at 2, 4, 6, 12-15 months", a quote
    // stating a different number from the card, on 781 cards. CDC's notes
    // cannot state it: read live 2026-10-23 they give the routine series and
    // then punt, "For other catch-up guidance, see Table 2." p2016 Table 1
    // does state it, row by row, and `table1Row` is the row this child keyed
    // on. So the lead's marker moves to that row and CDC keeps the booster
    // clause -- exactly the split FINDING 2 made for a total above 4.
    // ORDER MATTERS AND IS POSITIONAL. `noteCites` is one ordered list across
    // both halves of the note (the contract `RecCard`'s `RecNote` documents):
    // the lead's "[c]" markers consume the first entries and the detail's take
    // the rest, in the order they appear. C10-2 adds up to two markers to the
    // detail — the advised number, then the minimum — and both sit BEFORE the
    // "final/booster at ≥12 months" marker, so they are spliced in ahead of it.
    noteCites: [
      // The lead's one marker.
      cite(leadCite),
      // The detail, in reading order.
      ...(anchor && advisedCite ? [cite(advisedCite)] : []),
      ...(minClauseCite ? [cite(minClauseCite)] : []),
      // The closing "final/booster dose is given at ≥12 months", which only
      // carries a marker when the total is not exactly 4 (at 4 the lead already
      // cites this page, and a document must not take two numbers for one claim).
      ...(target !== 4 ? [cite('pedsRoutine4Dose')] : []),
    ],
    // A CARD CREDITS ONLY THE DOCUMENTS THAT SPEAK FOR IT. p2016 stays only
    // where one of its rows is actually cited above; on a routine 4-dose card
    // and on a total above 4 (which Table 1's largest row does not reach) it
    // comes off, because nothing on those cards rests on it.
    //
    // C10-2: and CDC's catch-up schedule joins the list on the cards that now
    // cite one of its interval cells — the first cards in the app ever to carry
    // that document, which until today appeared on none despite being what
    // `intervals.js` is built from. It is added CONDITIONALLY, by the same rule:
    // only where a cell of it is actually cited above.
    refs: [
      ...(table1Row ? INFANT_DEFAULT_REFS : infantRefsExcept('p2016')),
      // The whole-page entry, not the cell key: a grey button names a DOCUMENT,
      // and C3's rule is that every cited document has exactly one such entry.
      ...([advisedCite, minClauseCite].some((k) => k && k.startsWith('cdcCatchupDose'))
        ? ['cdcCatchupSchedule']
        : []),
      // And p2016 stays on a card whose INTERVAL rests on one of its rows even
      // when its TOTAL does not. The two tests are different and both are real:
      // `table1Row` asks whether the row's stated total equals the printed one
      // (C10-1's rule), while the interval only needs the row's history columns
      // to fit. They part company on a 7-11-month child owed two more doses whose
      // total comes to exactly 4 — 99 cards in the prose dump — where the lead
      // prints CDC's routine sentence and the interval is p2016's. Without this
      // the card carried a number pointing at a document its own chip list had
      // dropped.
      ...(!table1Row && advisedCite && advisedCite.startsWith('p2016') ? ['p2016'] : []),
    ],
  })];
}

// ── "Come back at 50" — ONE wording, ONE source, for the cards that earn it ──
//
// OWNER REQUEST 2026-10-29 (Nora, a healthy 10-year-old): "add a comment to
// re-evaluate pneumococcal vaccines once the patient turns 50 years old and
// cite the necessary adult reference." Extended 2026-10-30 to the healthy
// 24-59-month child whose series is complete, after she was shown what the app
// says to each of the nine children's cards that end in "nothing needed", taken
// forward to 19 and to 50.
//
// ⚠ IT GOES ONLY WHERE 50 IS REALLY THE NEXT EVENT. Of those nine families:
//   • 2 (these) are HEALTHY children — nothing at 19, a dose due at 50.
//   • 4 are AT-RISK children, 640 cards, where the app gives a dose at NINETEEN,
//     not 50. Printing "re-evaluate at age 50" there would name the wrong age.
//     Owner 2026-10-30: parked, deliberately, not decided — see the handoff.
//   • 3 are complete for life (a PCV20 in the series, or PCV15 + PPSV23): no
//     such line belongs on them at all.
// So this is not a sentence to spread. Before putting it on a new card, run
// that patient forward and check that 50 is the age the app itself acts on.
//
// Kept here as one constant rather than typed twice, because two copies of a
// sentence are two things that can drift — the fault this file keeps paying
// for. The marker and the cite move together.
const REVIEW_AT_50_SENTENCE = 'Re-evaluate at age 50, when routine pneumococcal vaccination begins for every adult [c].';
const reviewAt50Cite = () => cite('adultRoutine50', {
  aboutAnotherGroup: 'states where routine adult vaccination begins, which is the age this child should be re-assessed at',
});

// ── C13 (OWNER RULING 2026-10-30, on "Maya") — what the adult schedule does at 19 ──
//
// GROUP B of the C12 ruling: an at-risk, non-immunocompromised child whose card
// says "complete", and who is not complete for life. Maya — 18, cochlear
// implant, PCV13 at 7y11m, PPSV23 at 12y11m — read "no further doses of any PCV
// or PPSV23 are indicated", and at 19 the app says "Due today: PCV20 or PCV21".
// Both right; the card named no age.
//
// It is NOT one sentence. All 540 of these cards were run forward to 19 in the
// engine before she was asked, and they split four ways — so she chose one line
// per group, each saying what the app itself will say at 19 and citing the
// adult row it comes from (all four read live 2026-10-30):
//   (1) cochlear implant / CSF leak, one PPSV23        156  dose: PCV20 or PCV21
//   (2) chronic condition only                         282  no dose; review at 50
//   (3) cochlear implant / CSF leak, TWO PPSV23 given   32  review at 50, or the dose
//   (4) a conjugate of unrecorded product               70  PCV15, PCV20 or PCV21
//
// ⚠ THIS IS A SECOND READING OF THE ADULT RULES, and a second reading is how
// this app keeps breaking. It is held to the first by
// `regression-c13-2026-10-30-what-happens-at-19.test.js`, which runs EVERY
// card carrying one of these lines forward to 19 and fails if the adult card
// says something else. Change an adult row → that test tells you which line.
//
// `ppsvGiven` is the number of PPSV23 doses the child RECEIVED, an extra dose
// included: ACIP's adult rows count doses received ("PCV13 and 2 doses of
// PPSV23"), and that is the count the adult block will see at 19.
function atNineteen(riskIds, ppsvGiven, unrecordedConjugate) {
  const why = 'states what the adult schedule gives this patient at 19, the next age at which anything changes';
  if (unrecordedConjugate) {
    return {
      sentence: 'At 19, because the earlier conjugate’s product is not recorded, the adult schedule gives 1 dose of PCV15, PCV20 or PCV21, at least 1 year after the PPSV23 [c].',
      cite: cite('adultPpsvOnly1949', { aboutAnotherGroup: why }),
    };
  }
  if (hasSpecial(riskIds)) {
    return ppsvGiven >= 2
      ? {
        sentence: 'At 19, the adult schedule says to review again at age 50, or give 1 dose of PCV20 or PCV21 at least 5 years after the last pneumococcal dose [c].',
        cite: cite('mmwrIc1949TwoPpsv', { aboutAnotherGroup: why }),
      }
      : {
        sentence: 'At 19, the adult schedule gives 1 dose of PCV20 or PCV21, at least 5 years after the last pneumococcal dose [c].',
        cite: cite('adultIc1949BothPcv13Ppsv', { aboutAnotherGroup: why }),
      };
  }
  return {
    sentence: 'At 19, the adult schedule gives no dose now; re-evaluate at age 50 [c].',
    cite: cite('adultChronicOnlyReviewAt50', { aboutAnotherGroup: why }),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
//  HEALTHY CHILDREN 24 months – 18 years — p2016 Table 2
// ═══════════════════════════════════════════════════════════════════════════
function pcvHealthyChild(am, pcv, ppsv, today) {
  // A CARD CREDITS ONLY THE DOCUMENTS THAT SPEAK FOR IT. This block asks per
  // card -- `healthyRefsExcept` is the twin of `adultRefs` / `childRefsExcept`
  // -- rather than spreading one list over every card it builds.
  const HEALTHY_CHILD_DEFAULT_REFS = ['cdcChildPneumo', 'p2016', 'cdcCatchupJobAid'];
  /** The pathway defaults, minus documents that do not speak for this card. */
  const healthyRefsExcept = (...drop) => HEALTHY_CHILD_DEFAULT_REFS.filter(
    (k) => !drop.includes(k),
  );
  const refs = HEALTHY_CHILD_DEFAULT_REFS;
  const prior = pcv.count;
  // RULING D (2026-10-23) — same-stream PCV→PCV gap, so the anchor is the dose
  // given, not the last that counted.
  const anchor = pcv.anchorDate;
  // OWNER DECISION 2026-10-29 — a healthy child's catch-up waits 8 weeks after
  // a PPSV23 too. See `catchupAnchor` below; this is the later of the two
  // clocks, the same shape `anchorPneumoGiven` uses in `pcvRiskChild`.
  const catchupAnchor = mostRecent(anchor, ppsv.lastDate);
  /** True when the PPSV23 is what is actually holding the dose back. */
  const ppsvHolds = ppsv.lastDate != null && catchupAnchor === ppsv.lastDate
    && (anchor == null || ppsv.lastDate > anchor);
  const b = pcv.band;

  // Completeness for a HEALTHY child is age-band driven, NOT "has any PCV20."
  // A single PCV20 given in infancy does NOT complete the series (that shortcut
  // is an ADULT rule — verified against CDC PneumoRecs, case P09). A healthy
  // 24–59mo child is complete only when EITHER:
  //   • the full infant series was finished (≥4 counting doses incl. a ≥12mo booster), OR
  //   • a catch-up dose was given at ≥24mo (the single 24–59mo catch-up dose suffices), OR
  //   • the series was STARTED in the second year of life and two doses are on
  //     record (FINDING M, below).
  const completedInfantSeries = prior >= 4 && (b.m12to23 >= 1 || b.undated >= 1);
  const caughtUpAt24mo = b.ge24 >= 1;

  // FINDING M (2026-10-22). A series begun at 12–23 months is a TWO-dose series,
  // and this function used to credit a 12–23 month dose as a final dose only
  // when four doses were on record — so a child who had 2 or 3 doses, all in the
  // second year, was told to come back for one more. Three documents say
  // otherwise, and all three sit on that very card:
  //
  //   • CDC Catch-up Schedule Table 2, "Dose 3 to Dose 4": that dose "is only
  //     necessary for children age 12 through 59 months regardless of risk, or
  //     age 60 through 71 months with any risk, who received 3 doses before age
  //     12 months."
  //   • CDC PCV Catch-Up Job Aid p.3, 24–59 months: with 3 previous doses and
  //     "1 or more doses were given at 12 months of age or older" → "No dose
  //     today"; with 2 previous doses and "Dose 1 was given after 12 months of
  //     age" → the same.
  //   • immunize.org p2016 Table 2: a schedule "Completed … by 24 mos" gets "No
  //     additional doses".
  //
  // OWNER RULING 2026-10-22: "Healthy children, PCV initiated at 12–23 months →
  // 2 doses, ≥8 weeks apart is the full series. Two documented, appropriately
  // spaced doses in this age range satisfy that requirement. … This applies to
  // the child who had only a single 12–23 month dose. Interval validity
  // matters."
  //
  // "≥8 weeks apart" needs no test here, and that was CHECKED rather than
  // assumed: `CHILD-PCV-AFTER-PCV` in `doseIntervalRules.js` is a FLOOR keyed on
  // the age at the previous dose, so a dose following one given at ≥12 months
  // needs 56 days and gets CDC's 4-day grace. `b` is built from the EFFECTIVE
  // list, so a second dose given too soon is already gone from it — measured on
  // the engine as 51 days not counting and 52 days counting. Reading the band
  // therefore enforces the spacing for free; adding a second interval test here
  // would be the duplicate-source-of-truth mistake, not extra safety.
  //
  // HOW MANY DOSES FINISH IT depends on when the series STARTED, which is the
  // job aid's own 2- and 3-dose split and CDC Table 2's "Dose 2 to Dose 3" cell
  // ("8 weeks (as final dose for healthy children) … if current age is 12 months
  // or older and at least 1 dose was administered before age 12 months"):
  //
  //   started at 12–23 months  → 2 doses finish it   (job aid, 2 previous doses,
  //                              "Dose 1 was given after 12 months of age" → no
  //                              dose today)
  //   started before 12 months → 3 doses finish it, provided one of them came at
  //                              ≥12 months (job aid, 3 previous doses, "1 or
  //                              more doses were given at 12 months of age or
  //                              older" → no dose today; where all three came
  //                              before 12 months, Table 2 asks for a fourth)
  //
  // ⚠ A FIRST VERSION OF THIS WROTE `b.before12 === 0 && b.m12to23 >= 2`, i.e.
  // only the first line. It passed every test in the suite, and it was wrong:
  // a child dosed at 5, 14 and 17 months was still being offered a fourth dose,
  // though the job aid's 3-dose row says to give none. It was caught by deleting
  // the two guards and finding that NOTHING failed — so the cases below now
  // cover both lines, and that mutation fails.
  //
  // An undated dose is counted toward the total but can never be the ≥12-month
  // dose, because it cannot be placed: the engine's standing policy assumes an
  // undated historical dose is an infant dose. That is the conservative reading
  // (the child is still offered the dose) and it keeps `b.undated` out of the
  // "started in the second year" test.
  const startedInSecondYear = b.before12 === 0 && b.undated === 0;
  const dosesThatFinishIt = startedInSecondYear ? 2 : 3;
  const secondYearSeriesComplete = b.m12to23 >= 1 && prior >= dosesThatFinishIt;

  // 24–59 months
  if (am < M.m60) {
    if (completedInfantSeries || caughtUpAt24mo || secondYearSeriesComplete
        || pcv.hasUndatedCompleting) {
      // C8, documents 3 and 5. Both were listed on this card and credited with
      // nothing. p2016 Table 2's "Completed any PCV schedule … by 24 mos" row is
      // this card's sentence and fits every route to it.
      //
      // The job aid's "no dose today" cells need the same all-columns check as
      // the catch-up card below: its table is keyed on 1–3 DOCUMENTED previous
      // doses, at least one of them at 12 months or later. Two routes here fall
      // outside that and get NO cite — a child with four or more conjugate doses
      // (the table stops at three), and one whose completing dose is undated
      // (the job aid requires doses to be documented). Owner case (a) both
      // times: no document has a row for the history.
      const datedAtOrAfter12mo = b.m12to23 + b.ge24;
      const jobAidEndsItHere = b.undated === 0 && datedAtOrAfter12mo >= 1
        && prior >= 1 && prior <= 3;
      return [rec({
        vaccine: 'PCV', status: 'complete',
        // Markers are paired to cites by POSITION (`noteCiteSlices`), so the
        // count here and the array below must move together.
        note: `Healthy child 24–59 months whose age-appropriate PCV schedule is complete — no additional doses needed [c] [c]${jobAidEndsItHere ? ' [c]' : ''}. (A series that includes PCV20 also needs no PPSV23.) ${REVIEW_AT_50_SENTENCE}`,
        doseLabel: 'PCV series complete',
        noteCites: [
          cite('pedsNoPcv20IfComplete'),
          cite('p2016HealthyComplete24to59'),
          ...(jobAidEndsItHere ? [cite('jobAidPedsCatchupNoneNeeded')] : []),
          // OWNER DECISION 2026-10-30. This child and Nora are the two healthy
          // families where the app itself does nothing until 50: at 19 she
          // reads "not indicated (no risk, <50y)", at 50 a dose falls due.
          reviewAt50Cite(),
        ],
        refs,
      })];
    }
    // OWNER DECISION 2026-10-29 — the healthy child's catch-up waits 8 weeks
    // after her most recent PNEUMOCOCCAL dose, a PPSV23 included.
    //
    // She was shown a healthy 4-year-old with a PPSV23 four weeks ago and no
    // conjugate ever, told her first conjugate was due TODAY, beside the same
    // child with asplenia, who was correctly held eight weeks. Two children,
    // one PPSV23, two answers. Her ruling: both wait.
    //
    // ⚠ THIS IS HERS, NOT CDC'S, AND THE CARD MUST SAY SO. Every document on
    // this card measures the 8 weeks from a PCV — CDC's healthy row states no
    // interval at all, p2016's says "after most recent PCV dose", and the
    // catch-up job aid says "Give Dose 1 today". So the documents keep their
    // sentence, and the PPSV23 clause is added separately, in the app's own
    // words, exactly where it is doing work. Never widen a document's quote to
    // cover it.
    //
    // ⚠ ONE `max`, NO SECOND INTERVAL. Both clocks carry the same 8 weeks, so
    // the later anchor is the later date; nothing new is invented. A child with
    // no PPSV23 is untouched — `mostRecent` drops a null.
    const { dueToday, earliestNextDate } = dueState(catchupAnchor, WK8, today);

    // C8, document 5. The catch-up job aid was listed on this card and credited
    // with nothing, for all 144 of its cards. It cannot be credited with ONE
    // sentence, because page 3 answers this one age band differently depending
    // on how many previous doses there are — the owner's all-columns rule of
    // 2026-10-18 applied to a second document. Which cell fits is decided here,
    // in one place, the same shape as `mmwrBothPcv13PpsvKey()`.
    //
    // The job aid counts "previous doses" the way its own preamble requires —
    // "previous doses must be documented and must meet minimum age requirements
    // and minimum intervals between doses" — which is `pcv.count`, the EFFECTIVE
    // count. A PCV7 or a dose rejected for spacing is not a previous dose this
    // table is about. (Counting raw rows instead is what produced the 60/72/12
    // split recorded in the 2026-10-22 handoff; measured on effective doses it
    // is 48/84/12, and after FINDING M 48/84.)
    //
    // ⚠ FOUR OR MORE PREVIOUS DOSES GETS NO CITE. The table stops at three, so a
    // child with four conjugate doses all given before 12 months — who does
    // still reach this card — has no row here. Left uncredited deliberately:
    // owner case (a), "no document has a row for the history". Do not point them
    // at the 3-dose row.
    const jobAidCatchupKey = () => {
      if (prior === 0) return 'jobAidPedsCatchupDose1';
      if (prior === 1) return dueToday ? 'jobAidPedsCatchupDose2' : 'jobAidPedsCatchupDose2Later';
      // The 2- and 3-dose blocks print only a "today" cell; neither states a
      // not-yet-due variant, so when the app is holding the dose back there is
      // no cell of this document that says what the card says.
      if (!dueToday) return null;
      if (prior === 2) return 'jobAidPedsCatchupDose3';
      if (prior === 3) return 'jobAidPedsCatchupDose4';
      return null;
    };
    const jobAidKey = jobAidCatchupKey();

    return [rec({
      vaccine: 'PCV', status: prior === 0 ? 'due' : 'catchup',
      doseLabel: '1 dose PCV (catch-up)',
      dueToday, earliestNextDate, minIntervalDays: WK8,
      brands: pcvRecBrands({ adult: false }),
      note: {
        // Two markers always (CDC's notes, then p2016's row), a third only when
        // the job aid has a cell for this history. `noteCiteSlices` pairs
        // markers to cites by POSITION, so the count here and the array below
        // must move together.
        lead: `Give 1 dose of PCV15 or PCV20, ≥${PNEUMO_GAP_WORDS} after the most recent PCV [c] [c]${jobAidKey ? ' [c]' : ''}.${ppsvHolds ? ` **Held to ${PNEUMO_GAP_WORDS} after this child's PPSV23 of ${fmtDate(ppsv.lastDate)}.**` : ''}`,
        detail: `This is the catch-up for a healthy child 24–59 months whose PCV schedule was not complete by 24 months. If PCV15 is used, a PPSV23 follow-up is NOT routine for a healthy child — PPSV23 here is risk-based only.${ppsvHolds ? ' The 8 weeks above is CDC\'s, measured in every source on this card from the most recent PCV. Measuring it from a PPSV23 as well is this app\'s own determination on the owner\'s instruction of 2026-10-29, so that a healthy child and an at-risk child with the same recent PPSV23 are not given different dates.' : ''}`,
      },
      // p2016 Table 2's row states this card's whole sentence — the single dose
      // AND the 8 weeks — and is the only source on the card that states the
      // interval. It goes on the lead beside CDC's notes.
      noteCites: [
        cite('pedsHealthyCatchup'),
        cite('p2016HealthyCatchup24to59'),
        ...(jobAidKey ? [cite(jobAidKey)] : []),
      ],
      refs,
    })];
  }

  // 5–18 years healthy — no additional doses (healthy older children not caught up).
  return [rec({
    vaccine: 'PCV', status: 'not-indicated',
    doseLabel: 'Not indicated (healthy 5–18y)',
    note: {
      lead: 'No PCV is indicated — healthy children 5–18 years are not routinely caught up [c].',
      detail: `CDC's catch-up row covers healthy children only through age 4. PCV is recommended at this age only if a risk condition is present [c]. ${REVIEW_AT_50_SENTENCE}`,
    },
    noteCites: [
      cite('pedsHealthyCatchup'),
      // A declared cross-reference (2026-10-17): this card is for a child with
      // NO risk condition, and it quotes CDC's at-risk list on purpose — the
      // claim is "PCV is recommended at this age only if a risk condition is
      // present", and that list is what "a risk condition" means. The quote is
      // about a different group by design, so it says so rather than the
      // source pretending its scope is wider than it is.
      cite('cdcChildSpecialSituations', {
        aboutAnotherGroup: 'names the risk conditions this child does NOT have, which is why no dose is indicated',
      }),
      // OWNER REQUEST 2026-10-29, on the card for a healthy 10-year-old: "add a
      // comment to re-evaluate pneumococcal vaccines once the patient turns 50
      // years old and cite the necessary adult reference."
      //
      // The second declared cross-reference on this card, and the ONE place in
      // the app where a child's card carries an adult source. That is the N6
      // rule crossed deliberately rather than by accident: the sentence is
      // ABOUT the adult schedule, so the adult schedule is the only document
      // that can carry it, and `aboutAnotherGroup` is what says so out loud.
      // The key is already one of the four pinned cross-references, and the
      // same sentence is already on the adult 19-49 no-risk card -- one
      // wording, one source, both sides of the boundary.
      reviewAt50Cite(),
    ],
    // C9 (2026-10-23). p2016 is NOT listed here, and the reason is an OWNER
    // RULE rather than this card alone: "Ok to cite p2016 if you cannot just
    // cite the CDC references."
    //
    // You can cite CDC here. The card's sentence is a claim about SCOPE -- a
    // healthy 5-18-year-old is not caught up, because CDC's catch-up row stops
    // at age 4 -- and the row that stops at 4 is quoted on the lead. It settles
    // the question identically for a child with no doses, an incomplete series
    // or a complete one, so no second witness is needed.
    //
    // p2016 could not have served as one anyway. Table 2's 5-18 band holds a
    // single row whose prior-dose column reads "No previous doses or any
    // incomplete PCV schedule by 24 months" -- written about a child who never
    // finished. A healthy 10-year-old who COMPLETED her series at 2/4/6/12
    // months fails that column, and the row describing her sits in the
    // 24-through-59-month band she has aged out of (OWNER RULE 2026-10-18: every
    // column must fit). Both pages and all five tables were read before
    // removing it (the FINDING F discipline) -- Table 4 is risk conditions, and
    // Table 5 is HSCT.
    //
    // C12 (2026-10-29) — THE CATCH-UP JOB AID COMES OFF, and this closes the
    // LAST uncredited (document, statement) pair in the app. The chip used to
    // stay here as the owner's do-not-re-raise decision; she lifted that
    // herself on 2026-10-29 by asking for the last citation to be worked, was
    // shown this very card for a healthy 10-year-old, and chose: "Take chip
    // off."
    //
    // WHAT READING THE DOCUMENT FOUND (the FINDING F discipline; the local PDF
    // is 95,267 bytes, byte-for-byte what cdc.gov serves, all 3 pages read):
    // its oldest row is "24 through 59 months" and the table ENDS there, its
    // title is "Catch-Up Guidance for Healthy Children 4 Months through 4 Years
    // of Age", and footnote 1 hands at-risk children to CDC's notes. So the
    // document has NO row for a child of 5-18 -- its own title is the only
    // thing on it that touches this card, and a title describes what a document
    // covers rather than stating a recommendation.
    //
    // That is the shape the owner already ruled on for the ADULT job aid on
    // 2026-10-18 ("use MMWR table"): where a job aid's claim is not in the
    // document's own words, the job aid comes off and the document that states
    // it in words is cited. CDC's Child/Adolescent Notes row -- the one that
    // stops at age 4 -- is quoted on the lead and carries the claim alone.
    //
    // ⚠ MIRROR GUARD. A removal is only safe while the document stays credited
    // where it DOES speak: it keeps its place, with its cells cited, on the 144
    // healthy 24-59-month cards. Asserted in the guard, not assumed.
    refs: healthyRefsExcept('p2016', 'cdcCatchupJobAid'),
  })];
}

/**
 * How to NAME the conjugate doses on record, for the sentence that tells the
 * clinician WHO the advice in front of them is for.
 *
 * FINDING H + the 112 residue (2026-10-18). Four statements in the at-risk
 * child block used to say "PCV13" unconditionally, because the p2016 and CDC
 * rows they come from do. Measured over the committed grid, 976 card instances
 * said it to a child who had no PCV13 dose on record -- a PCV15, or a dose
 * whose product the clinician could not name.
 *
 * OWNER RULINGS, both 2026-10-18, and the reason the DOSE is untouched:
 *   - "PCV13 and PCV15 are interchangeable when assessing how to move forward
 *     in the schedule" -- which is ACIP's own sentence, and is cited as
 *     `pedsPcv13Pcv15Interchangeable` wherever this helper substitutes.
 *   - a dose of unrecorded product "cannot be assumed" to have been a PCV20;
 *     whichever of PCV13/PCV15 it was, the row and the dose are the same.
 *
 * So the row is unchanged and only the description of the patient moves. What
 * this must never do is name a product for a clinician who declined to:
 * "Unknown PCV product" is a real option on the history step, and naming it
 * PCV20 would be the one guess that ends the series.
 *
 * `phrase` fits a slot that wants "... only" ("with PCV15 only (at/after age
 * 6)"); `label` fits one that wants a bare name ("Complete (PCV15 + PPSV23
 * ...)"). `needsBridge` is true exactly when the governing row names a product
 * other than the one on record -- the only place the interchangeability
 * sentence belongs.
 */
const UNRECORDED_PCV_WORDS = 'a PCV of unrecorded product';
function pcvProductWords(pcv) {
  // `pcv.products` is built from the EFFECTIVE list, so a PCV7 and a rejected
  // same-day PCV20 are both already gone; `pcv.count` includes the doses whose
  // product is blank, which `products` does not.
  const named = [...new Set(pcv.products)].sort();
  const unrecorded = pcv.count - pcv.products.length;
  if (!named.length) {
    return { phrase: UNRECORDED_PCV_WORDS, label: UNRECORDED_PCV_WORDS, needsBridge: true, unrecorded: true };
  }
  const list = named.join(' and ');
  if (unrecorded > 0) {
    const both = `${list} and ${UNRECORDED_PCV_WORDS}`;
    return { phrase: both, label: both, needsBridge: true, unrecorded: true };
  }
  return {
    phrase: `${list} only`,
    label: list,
    needsBridge: !(named.length === 1 && named[0] === 'PCV13'),
    unrecorded: false,
  };
}

/**
 * The sentence that says why a row worded for PCV13 governs this child, plus
 * the cite that backs it. Empty strings when the row already names what the
 * patient got, so a PCV13 child's card is untouched.
 */
function pcvInterchangeableBridge(words) {
  if (!words.needsBridge) return { sentence: '', cites: [], refKeys: [] };
  const sentence = words.unrecorded
    ? ' The product of at least one dose on record was not entered, so it is counted as a generic PCV and is not assumed to have been PCV20. PCV13 and PCV15 can be used interchangeably for all recommendations, so this row governs whichever was given [c].'
    : ' The row for this history is worded for PCV13. PCV13 and PCV15 can be used interchangeably for all recommendations, so it governs this child too [c].';
  // FINDING L, the part of it this commit owns (2026-10-18). `refKeys` is new:
  // the numbered citation this bridge adds pointed at a document that was NOT
  // among the card's grey buttons, so a clinician clicking the number found no
  // chip to match it -- C8's fault with the arrow reversed. Measured over the
  // grid: 864 instances on five cards, 144 of them introduced by FINDING K's own
  // 576-card branch, which is why it is fixed here rather than queued. Every
  // call site that uses `cites` must also spread `refKeys` into its refs, and
  // `regression-finding-k-...` asserts that for all of them.
  //
  // It is deliberately NOT folded into the block-level `refs`: cards in the same
  // block that do not print this sentence would then carry a chip with no
  // number, which is the fault C8 exists to remove.
  return {
    sentence,
    cites: [cite('pedsPcv13Pcv15Interchangeable')],
    refKeys: ['pedsPcv13Pcv15Interchangeable'],
  };
}

// ═══════════════════════════════════════════════════════════════════════════
//  AT-RISK CHILDREN 24 months – 18 years — p2016 Table 4
// ═══════════════════════════════════════════════════════════════════════════
function pcvRiskChild(am, riskIds, pcv, ppsv, today) {
  // C13 (2026-10-30): the "at 19" line for the complete-but-not-for-life cards.
  // Built once; only the non-IC "complete" cards below print it.
  // "Unrecorded" means NO conjugate on record names its product — the adult
  // block's "no prior PCV or a PCV of unknown product". One named PCV13 among
  // them and the adult rows read it as a PCV13 history.
  const at19 = atNineteen(riskIds, ppsv.given ?? ppsv.count,
    pcv.count > 0 && !(pcv.products ?? []).length);
  // Population field (2026-10-17). Every `pedsRiskPcv20orPpsv23` below is
  // chosen by risk class, because CDC prints that row in both at-risk lists
  // and ONLY the immunocompromising one carries the five-year follow-on dose
  // ("If PPSV23 is used, administer 1 dose of PCV20 or dose 2 PPSV23 at least
  // 5 years after dose 1 PPSV23"). The app had the non-IC sentence under one
  // key and no key at all for the IC one, so 24 immunocompromised children's
  // cards quoted the sentence that omits the dose their own row owes them.
  const rowClass = pedsRiskRowClass(riskIds); // 'IC' | 'nonIC'
  const isIC = rowClass === 'IC';
  // A CARD CREDITS ONLY THE DOCUMENTS THAT SPEAK FOR IT — the paediatric twin
  // of `adultRefs`/`adultRefsExcept` below, added C9 2026-10-23. Until now this
  // block computed ONE list and spread it over every card it builds, which is
  // precisely the shape CLAUDE.md forbids and the reason the owner asked "why
  // there are multiple source chips listed if its only citing one of them".
  // Ask through these, never reuse `refs` for a card a document is silent on.
  const CHILD_RISK_DEFAULT_REFS = ['cdcChildPneumo', 'p2016'];
  const childRefs = (defaults = CHILD_RISK_DEFAULT_REFS) => collectRefs(riskIds, defaults, 'child');
  /** The pathway defaults, minus documents that do not speak for this card. */
  const childRefsExcept = (...drop) => childRefs(
    CHILD_RISK_DEFAULT_REFS.filter((k) => !drop.includes(k)),
  );
  /** The pathway defaults, minus `drop`, plus `add`. */
  const childRefsSwap = (drop, add) => childRefs(
    [...CHILD_RISK_DEFAULT_REFS.filter((k) => k !== drop), add],
  );
  const refs = childRefs();
  // FINDING H / the 112 residue (2026-10-18). Computed once here so every
  // sentence in this block names the same history — the shape S6-1 exists to
  // enforce for numbers, applied to words.
  const words = pcvProductWords(pcv);
  const bridge = pcvInterchangeableBridge(words);
  // RULING D (2026-10-23) — same-stream PCV→PCV gap (the 8-week rows below).
  // `anchorPneumo` on the next line deliberately does NOT move: it is a
  // CROSS-stream anchor, and ANCHOR-1 keys those on COUNTING doses in both
  // directions.
  const anchorPcv = pcv.anchorDate;
  // Anchor for "most recent pneumococcal vaccine" = latest of PCV or PPSV23.
  //
  // ⚠ `ppsv.lastDate`, NOT `ppsv.effective.find(...)` — 2026-10-26. `find`
  // returns the FIRST counting PPSV23, so a child with two of them had her
  // eight weeks measured from a dose up to seven years old and the wait had
  // always already passed. Hana, 12, asplenia, no conjugate ever, PPSV23 on
  // 1 Jan 2019 and 1 Sep 2026: told "due today" on 25 Oct, 54 days after her
  // real last dose, on a card whose own label reads ">=8 weeks". A child with
  // ONLY the 2026 dose was correctly held to 27 Oct — more history, earlier
  // date.
  //
  // OWNER, 2026-10-26: "both statements are correct. 'Give PPSV23 dose 2 >=5
  // years after dose 1 PPSV23' is the routine schedule when spacing out 2
  // PPSV23 doses. 'Give the next conjugate >=8 weeks after the most recent
  // pneumococcal vaccine' is correct when spacing out conjugate from PPSV23 or
  // between conjugate vaccines." So NO INTERVAL CHANGES HERE — only which dose
  // is fed into the 8-week one.
  //
  // The 5-year revaccination clock does run from dose 1, and the five call
  // sites that want it keep reaching for `effective.find(...)` directly
  // (`dueStateMonths(..., MO60, ...)` and `firstPpsv` in
  // `icPostPpsv23DueState`). First and last are different questions; this line
  // is the one that asks for the last.
  const anchorPneumo = mostRecent(pcv.lastDate, ppsv.lastDate);
  // ── 2026-10-25: the 24-71-month catch-up card's 8 weeks ─────────────────
  //
  // CDC's at-risk catch-up row states TWO intervals and the card implemented
  // only the second: "Less than 3 PCV doses: 2 doses PCV (at least 8 weeks
  // after the most recent dose AND administered at least 8 weeks apart)". The
  // card was anchored on `anchorPcv`, so a 4-year-old with asplenia, a PPSV23
  // 24 days ago and no conjugate was told her first PCV was due TODAY on a
  // card quoting "at least 8 weeks after the most recent dose". Measured over
  // the grid: 225 patients were advised a PCV sooner than 8 weeks after a
  // PPSV23, all of them aged 2 or 5 — the 6-18 block below already uses a
  // pneumococcal anchor, which is why no patient over 6 was affected. 192 are
  // fixed here; the 33 left are the two cases no document covers, below.
  //
  // It is the LATER of the two clocks, not a third reading of either:
  //   `anchorPcv`      the PCV side, which is RULING D's anchor (the dose the
  //                    patient GOT, including one that did not count)
  //   `ppsv.lastDate`  the PPSV23 side, which is ANCHOR-1's (counting doses
  //                    only — "an unnecessary dose cannot reset a clock")
  // Both carry the same 8 weeks, so the later anchor is the later date and no
  // second interval is introduced.
  //
  // ⚠ A PPSV23 ANCHOR IS NOT APPLIED TO A HEALTHY CHILD'S CATCH-UP CARD. No
  // document states it there: CDC's healthy row gives no interval, p2016's
  // says "after most recent PCV dose", and the catch-up job aid says "Give
  // Dose 1 today". See CLINICAL_SPEC.md §C-PPSV23ANCHOR.
  const anchorPneumoGiven = mostRecent(anchorPcv, ppsv.lastDate);
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
  // P2 (2026-10-30). Two counting PPSV23 doses for an immunocompromised child:
  // never a third (owner ruling 2026-10-29). Whether that FINISHES the row
  // depends on order (owner ruling 2026-10-30, "Sofia" vs "Zoe"): CDC's rows
  // give the PPSV23 AFTER the conjugate, so the PPSV23 doses must be later
  // than the last counting PCV. A counted PPSV23 after a PCV has already
  // passed `CHILD-PPSV23-AFTER-PCV`'s 8 weeks, so ordering is the whole test.
  // No dated PCV means the order cannot be shown, so the PCV20 stays owed.
  //
  // EVERY counted PPSV23 must follow the conjugate — the FIRST one, not just
  // the last. A sickle-cell patient in the suite (PPSV23 at 2, PCV13 at 7,
  // PPSV23 at 9) straddles it; read cautiously, CDC's row is not finished for
  // her, and the PCV20 she keeps is never a harmful answer.
  const icNoThirdPpsv23 = isIC && ppsv.count >= 2;
  const firstCountedPpsv23 = ppsv.effective.find((d) => d.date)?.date ?? null;
  const icTwoPpsv23Done = icNoThirdPpsv23 && !!pcv.lastDate && !!firstCountedPpsv23
    && ppsv.effective.every((d) => d.date) && firstCountedPpsv23 > pcv.lastDate;
  // Every counting PCV dose is DATED and was given before age 6 (72 months).
  // See the long note at its first use below for why an undated dose fails it.
  const allCountingPcvBefore72mo =
    pcv.count >= 1 && pcv.band.ge72 === 0 && pcv.band.undated === 0;
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
    // FINDING K (2026-10-18). ONE card, FOUR different patients, and until now
    // one citation for all of them.
    //
    // The comment that stood here said CDC's sentence "carries no age condition
    // in its own words, which is what the population rule asks about, so it
    // speaks for this patient at either age". Read as a flat sentence that is
    // true. CDC prints it as a SUB-BULLET under "Received PCV before age 6 years
    // but have not received PPSV23", and that parent carries both an age
    // condition and a PPSV23 condition. Measured: of 960 cards showing it in
    // this age band, 56 fitted and 904 did not.
    //
    // So the card asks the question CDC's branches ask -- what happened before
    // age 6, and has a PPSV23 been given -- and cites the document that has a
    // row for the answer. The DOSE is the same on all four; only the credited
    // document and the words explaining it differ.
    const pcv20IsFirstConjugate = pcv.count > 0
      && !pcv.hasPCV13 && !pcv.hasPCV15
      // An unrecorded product cannot be assumed to have been a PCV20 (owner,
      // 2026-10-18), so it is an earlier conjugate for this question.
      && pcv.products.length === pcv.count;
    const completedBefore6 = allCountingPcvBefore72mo;
    const complete = 'At-risk child whose PCV series includes PCV20 — no additional PCV or PPSV23 doses needed [c].';
    // The conjugates on record BEFORE the completing dose -- the only ones
    // CDC's "PCV13 only, given at or after age 6 years" row is about. The
    // block-level `words`/`bridge` describe the whole series and would print the
    // interchangeability sentence to a child who really does have a PCV13,
    // because the series also holds a PCV20.
    const completingProducts = pcv.products.filter((x) => x === 'PCV20' || x === 'PCV21');
    const priorWords = pcvProductWords({
      products: pcv.products.filter((x) => x !== 'PCV20' && x !== 'PCV21'),
      count: pcv.count - completingProducts.length,
    });
    const priorBridge = pcvInterchangeableBridge(priorWords);
    let note;
    let noteCites;
    let cardRefs;
    if (completedBefore6 && ppsv.count === 0) {
      // Group A. CDC's branch fits on both columns: the PCV series was before
      // age 6 and no PPSV23 has been given. The two risk classes word the
      // sub-bullet differently, so each quotes its own.
      // OWNER DECISION 2026-10-25, and it is the 2026-10-23 "cite CDC; reach
      // for p2016 only if you cannot" rule applied with a document that did
      // not exist on these cards before. She had given the 2023 ACIP
      // PCV20-in-children report herself -- *"You can reference this document
      // for pediatric recommendations too"* -- and, shown this card and what
      // it cites, chose to SWAP: p2016 off, the 2023 report on.
      //
      // Both documents state the whole claim, read live 2026-10-25:
      //   p2016 Table 4  "Completed PCV series before age 6 years, including
      //                   one or more doses of PCV20 | No additional doses"
      //   ACIP 2023 T1   "No additional doses of any pneumococcal vaccine are
      //                   indicated."
      // So this is NOT a removal for silence -- p2016 has a fitting row and
      // keeps it everywhere else. It is CDC/ACIP preferred over immunize.org
      // where the two agree, which is her standing rule, and it leaves the
      // card with two CDC sources rather than one CDC and one handout.
      note = {
        lead: complete,
        detail: "ACIP's 2023 PCV20-in-children report states the same for this history: for a child 2-18 with any risk condition whose completed series includes a PCV20, no additional doses of any pneumococcal vaccine are indicated [c].",
      };
      noteCites = [
        cite(isIC ? 'pedsIcPcv20Complete' : 'pedsRiskPcv20Complete'),
        cite('cdcPcv20Children2023CompleteWithPcv20'),
      ];
      cardRefs = childRefsSwap('p2016', 'cdcPcv20Children2023');
    } else if (completedBefore6) {
      // Group B. The series was before age 6, but a PPSV23 HAS been given, and
      // CDC's branch is headed "but have not received PPSV23". p2016 Table 4
      // has the row that fits -- "2 through 18 years (any risk condition) |
      // Completed PCV series before age 6 years, including one or more doses of
      // PCV20 | No additional doses" -- and states no PPSV23 condition, so a
      // prior PPSV23 does not break it.
      //
      // OWNER DECISION 2026-10-23 — 40 cards, and it REVERSES HALF OF FINDING K.
      // On 2026-10-18 CDC's notes were taken off these cards on the engineering
      // judgement that the sub-bullet's parent ("Received PCV before age 6 years
      // but have not received PPSV23") excludes a child who has had one. Shown
      // this patient -- a 6-year-old with asplenia, PCV20 at age 5, PPSV23 eight
      // weeks later -- she answered with the deep link to that very branch,
      // parent and sub-bullet together:
      //   .../child-adolescent-notes.html#:~:text=Received%20PCV%20before,
      //   PPSV23%20doses%20needed
      // So the row DOES speak for him and the card credits it. Her ruling, not
      // an inference from it: the chip stays and takes a number.
      //
      // WHAT IS NOT REVERSED, and the guard still holds it: FINDING K's other
      // 864 cards, where NO conjugate was given before age 6 (the PCV20 came at
      // 17 or 18). The parent's age condition still bars those; only its PPSV23
      // condition is now read as describing the history that led to the dose.
      // `regression-finding-k-...` pins this exception at exactly 40 so it
      // cannot grow by accident.
      //
      // Age-split for the same reason as FINDING N: CDC prints this sub-bullet
      // under "Age 2-5 years" as well, in words that differ, and a card must
      // quote its own patient's band.
      note = {
        lead: complete,
        detail: "CDC's row for a child who received PCV before age 6 is written for one who has not yet had PPSV23; this child has had one, which does not change the answer — a prior PCV20 means no further doses either way, and immunize.org p2016 prints the same row with no PPSV23 condition at all [c].",
      };
      noteCites = [
        am >= M.m72
          ? cite(isIC ? 'pedsIcPcv20Complete' : 'pedsRiskPcv20Complete')
          : cite('pedsRiskPcv20CompleteAt2'),
        cite('p2016CompletedBefore6WithPcv20'),
      ];
      cardRefs = collectRefs(riskIds, ['cdcChildPneumo', 'p2016'], 'child');
    } else if (pcv20IsFirstConjugate) {
      // The 288. Never had a conjugate before this PCV20, so CDC's Risk-based
      // branch "Never received PCV13, PCV15, or PCV20" describes them, and that
      // branch states the completion in words -- including for a child who
      // already had a PPSV23 ("Give it regardless of whether the child has
      // previously received PPSV23 or PCV7"). CDC's notes row for the same
      // branch is cited too, because it is what called for the dose; that way
      // both chips on the card are credited.
      note = {
        lead: complete,
        detail: 'This child had never received PCV13, PCV15 or PCV20 before that dose, which is the history CDC\'s row for an at-risk 6-18 year old describes [c]. CDC gives that dose whether or not a PPSV23 was given earlier.',
      };
      noteCites = [
        cite('pedsRiskPcv20FirstConjugate'),
        cite(isIC ? 'pedsIc6to18NoPcv' : 'pedsRisk6to18NoPcv'),
      ];
      cardRefs = collectRefs(riskIds, ['cdcRiskIndications', 'cdcChildPneumo'], 'child');
    } else {
      // The 576, and an OWNER DECISION of 2026-10-18. A conjugate at age 8-13,
      // then the PCV20 at 17: no document states a completion for that history
      // (CDC's Risk-based page has only "never received any conjugate" and
      // "received one before age 6"; p2016's PCV20 row demands before age 6).
      // Put to her as patients with three options, and she chose: cite the row
      // the PCV20 SATISFIED, and have the card say that dose has been given, so
      // a row that asks for a dose is not read as still owing one.
      //
      // p2016 prints a parallel row ("PCV13 only, given at or after age 6
      // years | Option A: 1 dose of PCV20 ...") with the same instruction,
      // satisfied by the same dose, and stays OFF this card -- OWNER DECISION
      // 2026-10-18, now settled rather than queued. She was shown the 17-year-old
      // with chronic lung disease (PCV13 at 8, PCV20 at 17), both rows side by
      // side, and the cost of admitting p2016: the all-columns guard would have to
      // accept a patient who HAS a PCV20, and that `!hasCompletingProduct` is what
      // FINDING J rests on. She chose the single CDC row over a second confirming
      // source bought with a weaker guard. No dose, date or verdict was in question
      // either way -- only which grey buttons the 576 cards show. Do not re-raise.
      //
      // CDC's Risk-based chip comes off: neither of its two prior-conjugate
      // branches reaches a conjugate first given at or after age 6.
      note = {
        lead: 'At-risk child whose PCV series includes PCV20 — no additional PCV or PPSV23 doses needed.',
        detail: `The conjugate on record before the PCV20 was ${priorWords.phrase}, given at or after age 6 years. CDC's row for that history calls for exactly one dose of PCV20, and that dose has been given [c].${priorBridge.sentence}`,
      };
      noteCites = [cite('pedsRiskPcv13At6'), ...priorBridge.cites];
      cardRefs = collectRefs(riskIds, ['cdcChildPneumo', ...priorBridge.refKeys], 'child');
    }
    out.push(rec({
      vaccine: 'PCV', status: 'complete',
      doseLabel: 'PCV complete (includes PCV20)',
      note,
      noteCites,
      refs: cardRefs,
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
  //
  // FINDING G (2026-10-18). These two rows key on WHEN the doses were given,
  // not only how many, and between them they cover less than this branch used
  // to claim. Read live from p2016 Table 4 on 2026-10-18:
  //   row 1 — "Any incomplete schedule of 0, 1, or 2 PCV doses by age 24 months"
  //   row 2 — "3 doses of PCV, all before 12 months"
  // A child with three doses given BETWEEN 12 and 24 months matches neither.
  // 32 cards were landing on row 2 anyway, because the gate below read
  // `band.before24` where the row says before TWELVE months, and then told the
  // clinician "3 PCV doses before 24 months" — a row label belonging to no
  // patient.
  //
  // OWNER DECISION 2026-10-18, on a 24-month-old with asplenia and three PCV13
  // doses at 16, 18 and 20 months: that child "would follow the table in
  // immunize.org table for 2 through 18 years (IC only); Completed PCV series
  // before age 6 years with PCV13 and/or PCV15". So they fall through to rows
  // 4/5 below. Note those rows' age band is "2 through 18 years" — the 24–71
  // month rows are not a ceiling, and a 24-month-old reads them too.
  //
  // `undated === 0` keeps undated histories on their existing path: a dose with
  // no date cannot be placed before or after 12 months, so rerouting it would
  // be a guess. Same reasoning as `allCountingPcvBefore72mo` below.
  const threeByAge24mo = pcv.band.before24 >= 3;
  const threeAllBefore12mo = pcv.band.before12 >= 3;
  const matchesNoTable4Row = threeByAge24mo && !threeAllBefore12mo && pcv.band.undated === 0;
  if (am < M.m72 && pcv.count < 4 && !matchesNoTable4Row) {
    const target = threeByAge24mo ? 1 : 2; // row 2 (1) vs row 1 (2)
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
      if (isIC ? icTwoPpsv23Done : pedsPostSeriesDoseDone) {
        out.push(rec({
          vaccine: 'PCV', status: 'complete',
          doseLabel: 'PCV complete (at-risk catch-up done)',
          // C9 (2026-10-23). The SAME claim as the "completed the PCV series +
          // PPSV23" card further down, on a differently-worded card, so the
          // owner's ruling there applies here too — a one-card fix would have
          // left these 15 reading differently from those 5 for one clinical
          // situation. ACIP's single-dose sentence is cited for the completion;
          // CDC's row keeps the choice it offered. p2016 off, same reading.
          //
          // (!) SUPERSEDED BY P2 (2026-10-30) — kept because it explains why the
          // IC wording below did not exist until then. It used to say "(non-
          // immunocompromising)" UNCONDITIONALLY, even though its gate
          // `pedsPostSeriesDoseDone` is
          // `isIC ? ppsv.count >= 2 : ppsv.count >= 1` and so mentions IC.
          //
          // An IC child cannot reach this card, and the reason is arithmetic,
          // not a coincidence of the grid: a first PPSV23 does not count before
          // age 24 months, a second needs >=5 years after it
          // (`CHILD-PPSV23-AFTER-PPSV23`, 4-day grace), so the earliest an IC
          // child can hold TWO counting PPSV23 doses is about age 84 months —
          // past this block's 71-month ceiling. Checked by exhaustive search
          // over every age 24-71 and every pair of PPSV23 dates: 0 reachable
          // combinations.
          //
          // So there was deliberately NO `isIC` branch here. A branch for an
          // unreachable state is dead code that cannot be tested, and an
          // earlier draft of this change added one on the false premise that
          // the path was live. The unreachability was GUARDED instead
          // (`regression-c9-2026-10-23-complete-after-ppsv23-cards`) — and P2
          // tripped that guard exactly as intended: it found 43 combinations,
          // and the IC wording below is the answer it asked for.
          //
          // ⚠ P2 (2026-10-30) MADE IT REACHABLE, as the paragraph above said a
          // moved interval would. An immunocompromised child's early second
          // PPSV23 now COUNTS (owner ruling 2026-10-29), so a 4-year-old with
          // PPSV23 at 24 and 29 months holds two counting doses and lands here.
          // She gets her own wording: ACIP's "single dose" sentence is untrue
          // of her, so it is not cited, and CDC's IC row — the one that ordered
          // her second dose — is, with the card saying that dose was given.
          note: isIC
            ? `At-risk immunocompromised child 24–71 months who has received the age-appropriate at-risk PCV catch-up dose(s) at ≥24 months and both PPSV23 doses — complete. CDC's row for an immunocompromised child this age gives a PCV20 or a second PPSV23 at least ${LONG_GAP_WORDS} after the first PPSV23, and the second PPSV23 has been given [c].${earlySecondPpsv23(ppsv)}`
            : `At-risk (non-immunocompromising) child 24–71 months who has received the age-appropriate at-risk PCV catch-up dose(s) at ≥24 months and has had PPSV23 — complete [c]. ACIP puts that at a single dose of PPSV23 once the conjugate doses are done [c]. ${at19.sentence}`,
          noteCites: isIC
            ? [cite('pedsIcPcv20orPpsv23')]
            : [cite('pedsRiskPcv20orPpsv23'), cite('pedsRiskSinglePpsv23AfterPcv'), at19.cite],
          refs: isIC ? childRefsExcept('p2016') : childRefsSwap('p2016', 'mmwr7137a3'),
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
          noteCites: [cite(isIC ? 'pedsIcPcv20orPpsv23' : 'pedsRiskPcv20orPpsv23')],
          // C10-1 (2026-10-23): CDC states this card's claim and is cited by
          // number above; nothing here rests on p2016, so it comes off.
          refs: childRefsExcept('p2016'),
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
            ? [cite(isIC ? 'pedsIcPcv20orPpsv23' : 'pedsRiskPcv20orPpsv23'), cite('pedsSecondPpsv5y')]
            : [cite(isIC ? 'pedsIcPcv20orPpsv23' : 'pedsRiskPcv20orPpsv23')],
          // C10-1 (2026-10-23): CDC states this card's claim and is cited by
          // number above; nothing here rests on p2016, so it comes off.
          refs: childRefsExcept('p2016'),
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
          lead: icFurtherDoseLead(icNoThirdPpsv23),
          detail: `This is an immunocompromising at-risk child 24–71 months who has had the at-risk PCV catch-up and PPSV23. For an immunocompromising condition the PPSV23 is followed by one further pneumococcal dose; it is not the end of the series. CDC puts that dose at ${LONG_GAP_WORDS} after the first PPSV23${whicheverProduct(icNoThirdPpsv23)}. CDC's schedule notes state that further dose in the same row, for this history [c].`,
        },
        noteCites: [cite('pedsIcPpsvWaitFiveYears'), cite('pedsIcPcv20orPpsv23')],
        refs: collectRefs(riskIds, ['cdcRiskIndications', 'cdcChildPneumo'], 'child'),
      }));
      const ppsv2done = dueStateMonths(
        ppsv.effective.find((d) => d.date)?.date || anchorPneumo, MO60, today,
      );
      // P2: never a third PPSV23.
      if (!icNoThirdPpsv23) out.push(rec({
        vaccine: 'PPSV23', status: 'risk-based',
        doseLabel: '2nd PPSV23 (alternative, ≥5y after first)',
        dueToday: ppsv2done.dueToday,
        earliestNextDate: ppsv2done.earliestNextDate,
        minIntervalMonths: MO60,
        brands: ['PPSV23 (Pneumovax 23)'],
        ...icFiveYearAlternative(cite('pedsIcPcv20orPpsv23')),
        refs: collectRefs(riskIds, ['cdcRiskIndications', 'cdcChildPneumo'], 'child'),
      }));
      return out;
    }
    // ⚠ BOTH ROWS NOW ANCHOR ON THE MOST RECENT PNEUMOCOCCAL DOSE, but for
    // two different reasons, and the difference is what the card must say.
    //
    // `target === 2` is CDC's "Less than 3 PCV doses" row, whose own words are
    // "at least 8 weeks after the most recent DOSE" — so a PPSV23 anchors it
    // on CDC's authority, and the card cites CDC for it.
    //
    // `target === 1` is the 3-doses-before-12-months row, and every document
    // that states its interval says PCV: ACIP 2023, "one dose of either PCV15
    // or PCV20 is recommended at least 8 weeks after the last PCV dose", and
    // CDC's neighbouring rows, "at least 8 weeks after the most recent PCV
    // dose". OWNER DECISION 2026-10-29 anchors it on a PPSV23 anyway — she was
    // shown a 4-year-old with asplenia, three PCV13 doses in 2022–23 and a
    // PPSV23 three weeks ago, told her extra conjugate was due TODAY while the
    // child beside her waited eight weeks — so on THIS row the PPSV23 clock is
    // the app's own and the card says so in its own words. The documents keep
    // their PCV sentence untouched; nothing is re-quoted to cover her ruling.
    //
    // ⚠ ONE `max`, NO SECOND INTERVAL, on both rows: the same 8 weeks on both
    // clocks, so the later anchor is simply the later date.
    const ppsvHoldsRow1 = target === 1 && ppsv.lastDate != null
      && anchorPneumoGiven === ppsv.lastDate
      && (anchorPcv == null || ppsv.lastDate > anchorPcv);
    const { dueToday, earliestNextDate } = dueState(anchorPneumoGiven, WK8, today);
    const doseNum = target - remaining + 1;
    out.push(rec({
      vaccine: 'PCV', status: 'risk-based',
      doseLabel: target === 1 ? '1 dose PCV (at-risk catch-up)' : `PCV dose ${doseNum} of 2 (at-risk catch-up)`,
      dueToday, earliestNextDate, minIntervalDays: WK8,
      brands: pcvRecBrands({ adult: false }),
      // C9 (2026-10-23). p2016 was listed on all 976 of these cards and credited
      // with nothing. It is not a confirming source here: CDC's notes say "2
      // doses PCV", and p2016's row is the only place on the card that names
      // WHICH products and states the 8 weeks between them in one sentence —
      // "2 doses of PCV20 or PCV15, given at least 8 weeks apart". So the
      // products and the interval now point at the row they come from.
      //
      // The PCV15 sentence in the detail earns footnote ‡, which is the mark on
      // the "PCV15" in that very cell. Reading the row without its footnote is
      // what FINDING F cost 1,594 cards; here the footnote IS the sentence.
      //
      // `target` already selects the row (1 = row 2, "3 doses of PCV, all
      // before 12 months"; 2 = row 1, "0, 1, or 2 PCV doses by age 24 months"),
      // so the key follows `target` and needs no second test of its own.
      note: target === 1
        ? {
          lead: `Give 1 dose of PCV20 or PCV15, ≥${PNEUMO_GAP_WORDS} after the most recent PCV [c] [c].${ppsvHoldsRow1 ? ` **Held to ${PNEUMO_GAP_WORDS} after this child's PPSV23 of ${fmtDate(ppsv.lastDate)}.**` : ''}`,
          // FINDING G: "all before 12 months", which is what p2016's row says.
          // It used to read "before 24 months" — a looser claim than the row,
          // and one that described 32 children the row is not about.
          detail: `This is the at-risk catch-up for a child 24–71 months who had 3 PCV doses, all before 12 months. If PCV15 is used, add PPSV23 ≥${PNEUMO_GAP_WORDS} later [c].${ppsvHoldsRow1 ? ' The 8 weeks above is ACIP\'s, measured from the last PCV dose. Measuring it from a PPSV23 as well is this app\'s own determination on the owner\'s instruction of 2026-10-29, so that this child and one on the neighbouring row with the same recent PPSV23 are not given different dates.' : ''}`,
        }
        : {
          // Both halves of CDC's row, 2026-10-25. It states two intervals --
          // "at least 8 weeks after the most recent dose AND administered at
          // least 8 weeks apart" -- and this lead printed only the second,
          // while the card's date was computed from neither.
          lead: `Give 2 doses of PCV20 or PCV15, ≥${PNEUMO_GAP_WORDS} after the most recent pneumococcal dose and ≥${PNEUMO_GAP_WORDS} apart [c] [c].`,
          detail: `This is the at-risk catch-up for a child 24–71 months with fewer than 3 PCV doses by 24 months. These doses are additional to any infant doses. If PCV15 is used to complete, add PPSV23 ≥${PNEUMO_GAP_WORDS} after the last PCV [c].`,
        },
      noteCites: [
        cite('pedsRiskIncompleteCatchup'),
        cite(target === 1
          ? 'p2016AtRiskCatchup24to71ThreeBefore12'
          : 'p2016AtRiskCatchup24to71Incomplete'),
        cite('p2016Pcv15NeedsFurtherDoses'),
      ],
      refs,
    }));
    return out;
  }

  // Rows 4–9: 2–18y (rows 4/5 say "2–18y completed before 6y"; rows 6–9 are 6–18y).
  // Branch on whether a PCV13/15 series was completed before age 6 vs no prior PCV
  // vs PCV13-only at/after age 6:
  //   • no counting PCV            → rows 6/7, "no previous dose of PCV13/15/20"
  //   • counting PCV all before 6y → rows 4/5, "completed PCV series before age 6"
  //   • a counting dose at/after 6 → rows 8/9, "PCV13 only at/after 6y"
  //
  // FINDING G (2026-10-18). This used to branch on the dose COUNT — "prior
  // counting PCV ≥3 → completed before 6y; 1–2 → PCV13 only at/after 6y" —
  // under a comment saying "we can't see exact ages of historical doses". The
  // engine can: `pcv.band` has held the age at each dose since the bands were
  // added, and `allCountingPcvBefore72mo` below is built from it. Branching on
  // the count instead put 336 cards on rows 8/9's label, which told the
  // clinician the child had "PCV13 only (at/after age 6)" when the dose on
  // record was a PCV15 at age 4, or a PCV13 at 12 months, or an unknown
  // product. The dose offered was the same either way — rows 4/5 and rows 8/9
  // both give PCV20 at ≥8 weeks, or PPSV23 — so no verdict moved; only the
  // sentence naming the patient was wrong, which no corpus records.
  //
  // OWNER DECISION 2026-10-18, on a 6-year-old with a cochlear implant and one
  // PCV15 at age 4: that child "should follow ... 2 through 18 years (non-IC
  // only); Completed PCV series before age 6 years with PCV13 and/or PCV15".
  // So a SINGLE conjugate dose before age 6 counts as "completed" for this
  // row's purpose; the row is not reserved for three-dose histories.
  //
  // `recommend.js` had already named this hazard twice without sweeping for it
  // — once where the 24–71 month block writes its own cards rather than reuse
  // these rows ("which would be a true sentence about somebody else"), and once
  // in the IC fix of 2026-10-17, which rescued one group from this very row.
  // The sweep is `regression-c8-2026-10-18-card-names-the-history-the-patient-has.test.js`.

  // ── PCV given ONLY before age 72 months (before age 6) + PPSV23 already given → complete ──
  // Verified against CDC PneumoRecs VaxAdvisor (2026-07-09). A high-risk patient (IC or
  // non-IC) who is now ≥6 years old, whose ONLY conjugate doses (PCV7 excluded) were all
  // given before age 72 months, who has received PPSV23 and never PCV20/PCV21, has COMPLETED
  // the pediatric PCV + PPSV23 series — no adult/older-child PCV20 catch-up. The decisive
  // gate is PneumoRecs' question "did the patient only receive PCV before age 72 months?".
  // Requires all counting PCV doses to be DATED and before 72mo: an undated dose cannot be
  // confirmed pre-72mo, so it falls through to the standard rows (matches "PPSV23 already
  // given → PCV20/2nd-PPSV23" for undated-history IC cases).
  //
  // Defined once at the top of this function since FINDING J (2026-10-18) —
  // p2016's row 3 asks the same question of a PCV20 history that rows 4/5 ask
  // of a PCV13/15 one ("Completed PCV series before age 6 years"), and a second
  // copy of the predicate could answer it differently. Same reason as S6-1.
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
      // OWNER DECISION 2026-10-23, in her words: *"her series is complete based
      // on the following recommendation"*, linking CDC's Age 6-18 row "Received
      // PCV before age 6 years but have not received PPSV23 -> Not previously
      // received PCV20: 1 dose PCV20 or 1 dose PPSV23 administer at least 8
      // weeks after the most recent PCV dose".
      //
      // The parent bullet says "have not received PPSV23" and this child HAS
      // one, which is why the document looked silent here and sat on 145 cards
      // as a grey button no number pointed at. Her reading settles it: that row
      // is what ORDERED the dose, and the dose has been given — so the card
      // credits the row it followed and says so, exactly as she ruled on
      // 2026-10-18 for the 17-year-old whose PCV20 satisfied a row.
      //
      // This is NOT a licence to quote a nested sub-bullet at anyone whose
      // history contradicts its parent. FINDING K's rule stands untouched: the
      // "Previously received at least 1 dose of PCV20: no further doses" line
      // orders nothing, so a child who also has a PPSV23 cannot have followed
      // it, and `regression-finding-k-...` still fails if it is quoted to them.
      //
      // p2016's row for the same history is footnoted on the very column that
      // appears to exclude this child, and the footnote is the answer: § "If
      // PPSV23 previously given, then child is complete" for the non-IC row,
      // and ǁ for the IC row, which gives options rather than completion.
      // Both read from a live download today. With these, every document listed
      // on this card is credited.
      note: {
        lead: 'No further PCV or PPSV23 is needed — the paediatric high-risk series is complete [c].',
        detail: `All conjugate doses on record were given before age 6 (72 months)${isIC ? ' and both PPSV23 doses have been received' : ' and PPSV23 has been received'}, which completes the series. ${isIC
          ? "CDC's row for an immunocompromised child this age asks for a PPSV23 and then, at least 5 years later, a PCV20 or a second PPSV23 — and both doses have been given [c]. immunize.org p2016 sets out the same two options for a child in this position [c]."
          : "CDC's row for a child this age who received PCV before age 6 and had not yet had PPSV23 asks for one dose of PCV20 or PPSV23, and that dose has been given [c]. immunize.org p2016 states the completion outright in the footnote on that row [c]."}${earlySecondPpsv23(ppsv)} PCV7 doses are never counted toward the series.`,
      },
      noteCites: [
        cite('pedsBefore6NoPcv20'),
        cite(isIC ? 'pedsIcBefore6NoPcv20At6to18' : 'pedsRiskBefore6NoPcv20At6to18'),
        cite(isIC ? 'p2016Before6PpsvGivenIcOptions' : 'p2016Before6PpsvGivenComplete'),
      ],
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
        detail: `This is an immunocompromising at-risk child whose conjugate doses were all given before age 6, with no PCV20, and who has already received one PPSV23 [c]. For an immunocompromising condition that PPSV23 is followed by one further pneumococcal dose — it is not the end of the series. CDC puts that dose at ${LONG_GAP_WORDS} after the first PPSV23, whichever product is chosen. CDC's schedule notes state that further dose in the same row, for this history [c].`,
      },
      noteCites: [cite('pedsIcPpsvWaitFiveYears'), cite('pedsBefore6NoPcv20'), cite('pedsIcBefore6NoPcv20At6to18')],
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
      ...icFiveYearAlternative(cite('pedsIcBefore6NoPcv20At6to18')),
      refs: collectRefs(riskIds, ['cdcRiskIndications', 'cdcChildPneumo'], 'child'),
    }));
    return out;
  }

  // FINDING G: `|| allCountingPcvBefore72mo` is the fix. Rows 4/5 describe a
  // child whose conjugate doses were all given before age 6, whatever the
  // count; rows 8/9 below describe one with a dose at or after age 6. The
  // `>= 3` is kept rather than replaced so a three-dose history with an
  // undated dose — which `allCountingPcvBefore72mo` deliberately excludes —
  // lands exactly where it did before.
  //
  // FINDING I (2026-10-18): `&& pcv.band.ge72 === 0` is the condition the kept
  // half was missing. `pcv.count >= 3` on its own also caught a fully DATED
  // three-dose history given at or after age 6 — a teenager with three PCV13
  // doses at 16 was told they "completed PCV13/15 before age 6". 64 cards made
  // that claim; another 32 were routed here without claiming anything about
  // age. The undated case the `>= 3` exists for is untouched, because
  // `band.ge72` counts DATED doses only.
  //
  // Not written as the shorter `pcv.count >= 1 && pcv.band.ge72 === 0`, which
  // reads better and is wrong: it would pull a child with one or two UNDATED
  // doses out of rows 8/9 and into rows 4/5, asserting "completed before age 6"
  // about doses whose dates nobody knows. Neither row describes that child;
  // this change does not pretend to settle them and leaves them where they are.
  if ((pcv.count >= 3 && pcv.band.ge72 === 0) || allCountingPcvBefore72mo) {
    // Rows 4 (non-IC) / 5 (IC): completed before 6y with PCV13/15 (no PCV20, no PPSV23).
    //
    // FINDING N (2026-10-23). CDC's notes print this row FOUR times — once in
    // each at-risk list under "Age 2-5 years", once in each under "Age 6-18
    // years" — and the parent bullets differ as well as the wording:
    //
    //   Age 2-5    "Completed recommended PCV series but have not received PPSV23"
    //   Age 6-18   "Received PCV before age 6 years but have not received PPSV23"
    //
    // This block serves 24 months through 18 years, and until now it cited the
    // Age 2-5 keys at every age inside it: 496 cards belonging to children aged
    // 6 and over were shown a sentence printed about a 2-to-5-year-old. The
    // instruction is the same either way, so no dose, date or verdict moves —
    // only which sentence the number quotes and where its deep link lands.
    //
    // ONE age test, here, reading the engine's own `M.m72` boundary. Do not add
    // a second one at any of the three call sites below.
    const before6Cite = () => cite(am >= M.m72
      ? (isIC ? 'pedsIcBefore6NoPcv20At6to18' : 'pedsRiskBefore6NoPcv20At6to18')
      : (isIC ? 'pedsIcPcv20orPpsv23' : 'pedsRiskPcv20orPpsv23'));
    if (ppsvGiven) {
      // non-IC: PPSV23 already given → complete.
      if (!isIC) {
        out.push(rec({
          vaccine: 'PCV', status: 'complete', doseLabel: 'Complete (PCV series + PPSV23)',
          // C9 (2026-10-23) — OWNER DECISION, 5 cards, and it OVERRULED a
          // proposal to cite p2016's footnote §.
          //
          // The card said "complete [1]" and its only citation was CDC's
          // *"Not previously received PCV20: administer 1 dose PCV20 or 1 dose
          // PPSV23 ... at least 8 weeks after the most recent PCV dose"* — an
          // instruction to GIVE a dose, hung on the word "complete". A
          // clinician clicking [1] on a card saying she needs nothing was shown
          // an order for a dose.
          //
          // Shown that patient (24 months, cochlear implant, three PCV13 doses
          // at 17/19/21 months, PPSV23 given), the owner ruled: *"p2016 doesn't
          // cite this case. The MMWR pediatric PCV15 paper should"*, quoting
          // the sentence now held in `pedsRiskSinglePpsv23AfterPcv`.
          //
          // So the two claims are separated and each gets its own source:
          //   [1] ACIP mm7137a3 — a child >=2 with any risk condition gets a
          //       SINGLE dose of PPSV23 after the PCV doses. That is the
          //       completion.
          //   [2] CDC's row — which offered PCV20 OR PPSV23 after the series.
          //       It is cited for the CHOICE, in the PAST tense, because the
          //       dose on record is the one it called for. That is the owner's
          //       2026-10-23 rule ("cite the row the patient FOLLOWED, and say
          //       on the card that its dose has been given") applied to the
          //       sentence that used to read as a live offer.
          // p2016 comes off: see the 840-card removal below for the reading.
          note: `At-risk (non-immunocompromising) child who completed the PCV series and has received PPSV23 — complete [c]. ACIP puts that at a single dose of PPSV23 once the conjugate doses are done. The row this child followed offered either a PCV20 or that PPSV23 ≥${PNEUMO_GAP_WORDS} after the last PCV, and the dose on record is that dose [c]. ${at19.sentence}`,
          noteCites: [cite('pedsRiskSinglePpsv23AfterPcv'), before6Cite(), at19.cite],
          refs: childRefsSwap('p2016', 'mmwr7137a3'),
        }));
        return out;
      }
      // P2 (2026-10-30): IC with BOTH PPSV23 doses counted — complete. This
      // branch never asked, because before P2 an IC child here could not hold
      // two counting doses (the early one was thrown out, and on-time needs
      // ~84 months). Now a 4-year-old with PPSV23 at 24 and 29 months does,
      // and was being offered PCV20 or a "2nd PPSV23" — her third. OWNER
      // RULING 2026-10-29: never a third. `pedsPostSeriesDoseDone` is the
      // engine's one answer to "has the follow-on dose been given".
      if (icTwoPpsv23Done) {
        out.push(rec({
          vaccine: 'PCV', status: 'complete', doseLabel: 'Complete (PCV series + 2 PPSV23)',
          note: `At-risk immunocompromised child who completed the PCV series and has received both PPSV23 doses — complete. CDC's row for an immunocompromised child this age gives a PCV20 or a second PPSV23 at least ${LONG_GAP_WORDS} after the first PPSV23, and the second PPSV23 has been given [c].${earlySecondPpsv23(ppsv)}`,
          noteCites: [before6Cite()],
          refs: childRefsExcept('p2016'),
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
          lead: icFurtherDoseLead(icNoThirdPpsv23),
          detail: `This applies to an immunocompromising at-risk child who completed ${words.unrecorded ? 'the PCV series' : 'PCV13/15'} and has already received PPSV23. CDC puts the further dose at ${LONG_GAP_WORDS} after the first PPSV23${whicheverProduct(icNoThirdPpsv23)}. CDC's schedule notes state that further dose in the same row, for this history [c].`,
        },
        noteCites: [cite('pedsIcPpsvWaitFiveYears'), before6Cite()],
        refs: collectRefs(riskIds, ['cdcRiskIndications', 'cdcChildPneumo'], 'child'),
      }));
      const ppsv2 = dueStateMonths(ppsv.effective.find((d) => d.date)?.date || anchorPneumo, MO60, today);
      // P2: never a third PPSV23.
      if (!icNoThirdPpsv23) out.push(rec({
        vaccine: 'PPSV23', status: 'risk-based', doseLabel: '2nd PPSV23 (alternative, ≥5y after first)',
        dueToday: ppsv2.dueToday, earliestNextDate: ppsv2.earliestNextDate, minIntervalMonths: MO60,
        brands: ['PPSV23 (Pneumovax 23)'],
        ...icFiveYearAlternative(before6Cite()),
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
      // "PCV13/15" is a fair description of a PCV13 or a PCV15 — it is p2016's
      // own row wording, "with PCV13 and/or PCV15" — but not of a dose nobody
      // recorded. CDC's matching row is product-agnostic ("Received PCV before
      // age 6 years"), so that is the wording an unrecorded dose gets.
      // No interchangeability bridge here, and that is deliberate: unlike the
      // at/after-6 rows below, CDC's before-6 row is already product-agnostic
      // ("Received PCV before age 6 years ... at least 8 weeks after the most
      // recent PCV dose", read live 2026-10-18), and its risk-indications twin
      // names both products. Nothing is being substituted, so nothing needs
      // explaining.
      // OWNER DECISION 2026-10-25 — ACIP's 2023 PCV20-in-children report is
      // ADDED here (not swapped: p2016 is already off these cards, and CDC's
      // child notes state the interval). Shown this card and asked where its
      // Table 1 belongs, she chose to add it alongside.
      //
      // ⚠️ THE MARKER IS ON ITS OWN SENTENCE, AND THAT IS NOT TIDINESS.
      // Table 1 states the CHOICE and no interval: "Either a single dose of
      // PCV20 or PPSV23 using previously recommended dosing and schedules is
      // recommended to complete the recommended vaccine series" (read live
      // 2026-10-25, Supplementary Report p.10). The 8 weeks is CDC's child
      // notes' number. Putting both markers on one sentence would give that
      // sentence two numbers for two different claims — the thing
      // `regression-c8-...-infant-catchup-credits-the-booster-row`'s "no card
      // anywhere gives the SAME sentence two numbers" forbids outright.
      note: `At-risk ${isIC ? 'immunocompromising' : 'non-immunocompromising'} child who completed ${words.unrecorded ? 'the PCV series' : 'PCV13/15'} before age 6 (no PCV20, no PPSV23): Option A — 1 dose of PCV20 ≥${PNEUMO_GAP_WORDS} after the most recent PCV [c]. Either a single dose of PCV20 or a PPSV23 completes the recommended series [c].`,
      noteCites: [before6Cite(), cite('cdcPcv20Children2023CompleteWithoutPcv20')],
      // C10-1 (2026-10-23): CDC states this card's claim and is cited by
      // number above; nothing here rests on p2016, so it comes off.
      refs: childRefsSwap('p2016', 'cdcPcv20Children2023'),
    }));
    out.push(rec({
      vaccine: 'PPSV23', status: 'risk-based', doseLabel: 'Option B: 1 dose PPSV23 (≥8 weeks)',
      dueToday, earliestNextDate, minIntervalDays: WK8,
      brands: ['PPSV23 (Pneumovax 23)'],
      // The Option B half of the same owner decision, and the same discipline:
      // Table 1's sentence is about the CHOICE completing the series, so it
      // takes its own sentence. The IC card's "≥5 years later" clause belongs
      // to `pedsSecondPpsv5y` and Table 1 is silent on it — never let the 2023
      // marker drift onto that one.
      note: isIC
        ? 'Option B — 1 dose of PPSV23 ≥8 weeks after the most recent PCV [c]; then ≥5 years later give 1 dose of PCV20 or a 2nd PPSV23 [c]. Choose Option A or B, not both. Either a single dose of PCV20 or a PPSV23 completes the recommended series [c].'
        : 'Option B — 1 dose of PPSV23 ≥8 weeks after the most recent PCV [c]. Choose Option A or B, not both. Either a single dose of PCV20 or a PPSV23 completes the recommended series [c].',
      noteCites: isIC
        ? [before6Cite(), cite('pedsSecondPpsv5y'), cite('cdcPcv20Children2023CompleteWithoutPcv20')]
        : [before6Cite(), cite('cdcPcv20Children2023CompleteWithoutPcv20')],
      // C10-1 (2026-10-23): CDC states this card's claim and is cited by
      // number above; nothing here rests on p2016, so it comes off.
      refs: childRefsSwap('p2016', 'cdcPcv20Children2023'),
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
      const at19Here = words.label === 'PCV13' || words.label === UNRECORDED_PCV_WORDS;
      out.push(rec({
        vaccine: 'PCV', status: 'complete',
        doseLabel: `Complete (${words.label} + PPSV23 at/after age 6)`,
        // FINDING H, the 380. This said "PCV13" to 230 children whose dose was
        // a PCV15, 80 with a PCV15 plus a rejected same-day PCV20, and 70 whose
        // product was never recorded.
        // C13: only the two labels she was shown in Group B. The SAME template
        // builds "Complete (PCV15 + PPSV23 at/after age 6)", which is complete
        // for life (Group C: the adult rows finish a PCV15 + PPSV23 history),
        // so it must not gain a "come back at 19" line.
        note: `Non-immunocompromising at-risk child with ${words.label} at/after age 6 who has received PPSV23 — no further doses of any PCV or PPSV23 are indicated [c].${bridge.sentence}${at19Here ? ` ${at19.sentence}` : ''}`,
        noteCites: [cite('pedsRiskDone'), ...bridge.cites, ...(at19Here ? [at19.cite] : [])],
        // C9 (2026-10-23) — OWNER DECISION, 840 cards: p2016 COMES OFF.
        //
        // The owner was shown an 18-year-old with a cochlear implant, PCV13 at
        // age 8 and PPSV23 at 13, and asked what the card's unnumbered p2016
        // button was for. Her answer: "Take p2016 off."
        //
        // Why it does not speak here, read cell by cell off a live download
        // (sha1 d69cf77055182b27cf6774b087138c3617068737, "Item #P2016
        // (2/16/2024)", Table 4, page 2):
        //   - p2016's rows 8/9 DO fit her history ("PCV13 only, given at or
        //     after age 6 years"), but their Option B only ORDERS the PPSV23
        //     she has had. Neither row says what follows it.
        //   - the sentence that does say it, footnote § ("If PPSV23 previously
        //     given, then child is complete"), is the mark on rows 4/5's
        //     history cell — "Completed PCV series BEFORE age 6 years". Her
        //     only conjugate dose was at 8, so she fails that row's prior-dose
        //     column, and OWNER RULE 2026-10-18 requires every column to fit.
        // Meanwhile `pedsRiskDone` is CDC's Child/Adolescent Notes stating the
        // whole claim verbatim about exactly this patient — her age band, her
        // PCV13 at/after 6, her PPSV23, and the conclusion. Nothing on this
        // card rests on p2016, so it is not listed.
        //
        // NOT a FINDING F repeat: that was six removals approved from a reading
        // that had never opened the document's table. This one is the table,
        // transcribed above, footnotes included. The mirror guard
        // (`regression-c8-2026-10-18-mmwr-table-rows-restored`) asserts a
        // document is PRESENT where it speaks; this card is the other case.
        refs: [...childRefsExcept('p2016'), ...bridge.refKeys],
      }));
      return out;
    }
    // P2 (2026-10-30): IC with BOTH PPSV23 doses counted — complete. CDC's row
    // below orders "1 dose PCV20 or 1 dose PPSV23 … at least 5 years after
    // dose 1 PPSV23", and a second counting PPSV23 IS that dose. This branch
    // never checked, so it was wrong BEFORE P2 too: a 15-year-old with
    // asplenia, PCV13 at 7 and PPSV23 at 7y3m and 12y3m (on time) was offered
    // PCV20 or a "2nd PPSV23" — her third. The grid cannot build her (no
    // vaccinated teenager), which is how it survived. OWNER RULING 2026-10-29:
    // never a third.
    if (icTwoPpsv23Done) {
      out.push(rec({
        vaccine: 'PCV', status: 'complete',
        doseLabel: `Complete (${words.label} + 2 PPSV23 at/after age 6)`,
        note: `Immunocompromising at-risk child with ${words.label} at/after age 6 who has received both PPSV23 doses — complete. CDC's row for this history gives a PCV20 or a second PPSV23 at least ${LONG_GAP_WORDS} after the first PPSV23, and the second PPSV23 has been given [c].${bridge.sentence}${earlySecondPpsv23(ppsv)}`,
        noteCites: [cite('pedsIcPcv13AndPpsvAt6'), ...bridge.cites],
        refs: collectRefs(riskIds, ['cdcChildPneumo', ...bridge.refKeys], 'child'),
      }));
      return out;
    }
    // Finding A (2026-10-17): the five-year date, not 8 weeks.
    //
    // ⚠ CORRECTED SAME DAY by Finding B. This comment first said no source
    // states this history with a PPSV23 already given, and that the five years
    // was an INFERENCE read across from p2016's Option B. That was wrong, and
    // re-reading a source the app already cites is what found it. CDC's child
    // notes state this row outright, in the IMMUNOCOMPROMISING list:
    //   "Received 1 dose PCV13 and 1 dose PPSV23 at or after age 6 years:
    //    administer 1 dose PCV20 or 1 dose PPSV23 at least 8 weeks after the
    //    most recent PCV13 dose AND at least 5 years after dose 1 PPSV23."
    // It CONJOINS the two conditions -- which is exactly what
    // `icPostPpsv23DueState()` computes, so Finding A's "later of the two"
    // gate turns out to be quoted rather than reasoned.
    //
    // The matching NON-IC sentence three lines earlier on the same page says
    // the opposite ("no further doses of any PCV or PPSV23 indicated") and is
    // `pedsRiskDone`, used by the non-IC branch above. Same opening words,
    // opposite instruction.
    //
    // One edge this sentence does not settle: a child whose PCV13 was at/after
    // 6 but whose PPSV23 was BEFORE 6. CDC's "at or after age 6 years" reads
    // as covering both doses. The answer is the same either way here -- every
    // CDC row for a prior PPSV23 gives five years -- so the branch is not
    // split on it.
    const icState = icPostPpsv23DueState(ppsv, anchorPneumo, today);
    out.push(rec({
      vaccine: 'PCV', status: 'risk-based', doseLabel: '1 dose PCV20 (immunocompromising)',
      dueToday: icState.dueToday,
      earliestNextDate: icState.earliestNextDate,
      minIntervalMonths: MO60,
      brands: ['PCV20 (Prevnar 20)'],
      note: {
        lead: icFurtherDoseLead(icNoThirdPpsv23),
        // The IC twin of FINDING H, 228 of its 456 cards product-wrong. Found
        // by sweeping the whole class rather than the one card reported — the
        // spot-check was a sample.
        detail: `This applies to an immunocompromising at-risk child whose conjugate ${pcv.count === 1 ? 'dose was' : 'doses were'} ${words.label}, given at or after age 6, and who has already received PPSV23 [c]. CDC puts the further dose at ${LONG_GAP_WORDS} after the first PPSV23${whicheverProduct(icNoThirdPpsv23)}.${bridge.sentence}`,
      },
      noteCites: [cite('pedsIcPpsvWaitFiveYears'), cite('pedsIcPcv13AndPpsvAt6'), ...bridge.cites],
      refs: collectRefs(riskIds, ['cdcRiskIndications', 'cdcChildPneumo', ...bridge.refKeys], 'child'),
    }));
    const ppsv2 = dueStateMonths(ppsv.effective.find((d) => d.date)?.date || anchorPneumo, MO60, today);
    // P2: never a third PPSV23.
    if (!icNoThirdPpsv23) out.push(rec({
      vaccine: 'PPSV23', status: 'risk-based', doseLabel: '2nd PPSV23 (alternative, ≥5y after first)',
      dueToday: ppsv2.dueToday, earliestNextDate: ppsv2.earliestNextDate, minIntervalMonths: MO60,
      brands: ['PPSV23 (Pneumovax 23)'],
      ...icFiveYearAlternative(cite('pedsIcPcv13AndPpsvAt6')),
      refs: collectRefs(riskIds, ['cdcRiskIndications', 'cdcChildPneumo'], 'child'),
    }));
    return out;
  }

  // ── 2026-10-25, the second half of the PPSV23-then-PCV ruling ──────────
  //
  // `noPriorPcv` counts doses that COUNTED, so the moment
  // `CHILD-PCV-AFTER-PPSV23` became a floor this branch started catching a new
  // patient: a child whose only conjugate WAS given and was then set aside.
  // For her `anchorPneumo` is her PPSV23 — ANCHOR-1 keys it on counting doses
  // — so the card advised 8 weeks from the PPSV23 while her chip promised the
  // repeat 8 weeks from the dose she actually got. Maya, 8, asplenia (PPSV23
  // 1 Oct, PCV20 15 Oct): card "eligible Nov 26", chip "from Dec 10".
  //
  // The card's date was the harmful one: the dose given on 26 Nov is rejected
  // again by CHILD-PCV-AFTER-PCV (42 days, needs 56) and she still reads
  // incomplete. ACIP's General Best Practices and RULING D both space the
  // repeat from the invalid dose, which is 10 Dec.
  //
  // So take the LATER of the two anchors — the identical "later of two clocks"
  // shape `anchorPneumoGiven` uses above, and for the identical reason. Both
  // carry the same 8 weeks, so the later anchor is the later date and NO second
  // interval is introduced.
  //
  // ⚠ A CHILD WITH NO CONJUGATE AT ALL IS UNTOUCHED: `anchorPcv` is null for
  // her, `mostRecent` drops it, and the pneumococcal anchor stands. Nothing of
  // hers was set aside, so there is no repeat to space from. Children aged 2–5
  // never had the defect — their block already uses `anchorPneumoGiven` — and
  // every one of the 375 patients this moved was in the 6–18 block.
  // Guard: regression-2026-10-25-card-and-chip-name-one-date.test.js.
  const anchorForA = noPriorPcv ? mostRecent(anchorPneumo, anchorPcv) : anchorPcv;
  const aState = dueState(anchorForA, WK8, today);

  out.push(rec({
    vaccine: 'PCV', status: 'risk-based', doseLabel: 'Option A: 1 dose PCV20 (≥8 weeks)',
    dueToday: aState.dueToday, earliestNextDate: aState.earliestNextDate, minIntervalDays: WK8,
    brands: ['PCV20 (Prevnar 20)'],
    // C9 (2026-10-23): p2016's Option A cell for rows 6/7 is this sentence, and
    // it was a grey button with no number on 528 of these cards. Its cell is
    // identical in the non-IC and IC rows, so one key serves both classes —
    // unlike CDC's notes above, which word the two differently and get a key
    // each.
    note: noPriorPcv
      ? `At-risk ${isIC ? 'immunocompromising' : 'non-immunocompromising'} child 6–18 years with no prior PCV: Option A — 1 dose of PCV20 ≥8 weeks after the most recent pneumococcal vaccine [c] [c].`
      // The 112 residue. "the most recent PCV13" is replaced by the
      // product-agnostic phrase p2016's own Option A cell uses ("at least 8
      // weeks after most recent PCV dose"), so the anchor cannot name a product
      // the patient has not had either.
      : `At-risk ${isIC ? 'immunocompromising' : 'non-immunocompromising'} child 6–18 years with ${words.phrase} (at/after age 6): Option A — 1 dose of PCV20 ≥${PNEUMO_GAP_WORDS} after the most recent PCV [c].${bridge.sentence}`,
    // Population field (2026-10-17): the IC and non-IC lists print this row
    // with different wording, so each class quotes its own. `pedsRiskPcv13At6`
    // stays shared on purpose — that sentence IS identical in both lists, and
    // the IC card cites its five-year tail separately below.
    noteCites: noPriorPcv
      ? [cite(isIC ? 'pedsIc6to18NoPcv' : 'pedsRisk6to18NoPcv'), cite('p2016NoPriorPcv6to18OptionA')]
      : [cite('pedsRiskPcv13At6'), ...bridge.cites],
    // C10-1 (2026-10-23): the at/after-6 card cites CDC's row and the
    // interchangeability bridge, and nothing of p2016's; only the no-prior-PCV
    // card above rests on p2016 (its Option A cell), so only that one keeps it.
    refs: noPriorPcv ? refs : [...childRefsExcept('p2016'), ...bridge.refKeys],
  }));

  if (noPriorPcv) {
    // Option B: PCV15 then PPSV23 ≥8wk later (rows 6/7).
    out.push(rec({
      vaccine: 'PCV', status: 'risk-based', doseLabel: 'Option B-1: 1 dose PCV15 (≥8 weeks)',
      dueToday: aState.dueToday, earliestNextDate: aState.earliestNextDate, minIntervalDays: WK8,
      brands: ['PCV15 (Vaxneuvance)'],
      note: {
        // C9: p2016's Option B cell states this whole two-step plan, including
        // the "if PPSV23 not previously given" condition, so it takes the
        // second number here and on the follow-up card below. The two cards are
        // one cell shown twice — the same shape as the five-year step's two
        // cards (2026-10-23) — so they must quote the SAME entry, which the
        // guard asserts for one patient rather than trusting the two call sites.
        lead: `Option B — 1 dose of PCV15 ≥${PNEUMO_GAP_WORDS} after the most recent pneumococcal vaccine, then ≥${PNEUMO_GAP_WORDS} later 1 dose of PPSV23 if not previously given [c] [c].`,
        detail: 'Choose Option A or B, not both.',
      },
      noteCites: [
        cite(isIC ? 'pedsIc6to18NoPcv' : 'pedsRisk6to18NoPcv'),
        cite('p2016NoPriorPcv6to18OptionB'),
      ],
      refs,
    }));
    if (!ppsvGiven) {
      out.push(rec({
        vaccine: 'PPSV23', status: 'risk-based', doseLabel: 'Option B-2: PPSV23 (≥8 weeks after PCV15)',
        dueToday: false, earliestNextDate: null, minIntervalDays: WK8,
        brands: ['PPSV23 (Pneumovax 23)'],
        note: `Second step of Option B: PPSV23 ≥${PNEUMO_GAP_WORDS} after the PCV15 dose [c] [c]. Only if PPSV23 was not previously given.`,
        noteCites: [
          cite(isIC ? 'pedsIc6to18NoPcv' : 'pedsRisk6to18NoPcv'),
          cite('p2016NoPriorPcv6to18OptionB'),
        ],
        refs,
      }));
    }
  } else {
    // PCV13-only at/after 6y. Option B: PPSV23 ≥8wk (IC: then ≥5y → PCV20 or 2nd PPSV23).
    out.push(rec({
      vaccine: 'PPSV23', status: 'risk-based', doseLabel: 'Option B: 1 dose PPSV23 (≥8 weeks after the last PCV)',
      dueToday: aState.dueToday, earliestNextDate: aState.earliestNextDate, minIntervalDays: WK8,
      brands: ['PPSV23 (Pneumovax 23)'],
      note: isIC
        ? {
          lead: `Option B — 1 dose of PPSV23 ≥${PNEUMO_GAP_WORDS} after the most recent PCV [c]; then ≥${LONG_GAP_WORDS} after the first PPSV23, give 1 dose of PCV20 or a 2nd PPSV23 [c].`,
          detail: 'This is the immunocompromising row: the 5-year follow-on dose is part of the plan, not optional. Choose Option A or B, not both.',
        }
        : {
          lead: `Option B — 1 dose of PPSV23 ≥${PNEUMO_GAP_WORDS} after the most recent PCV [c].`,
          detail: 'Choose Option A or B, not both.',
        },
      noteCites: isIC
        ? [cite('pedsRiskPcv13At6'), cite('pedsSecondPpsv5y')]
        : [cite('pedsRiskPcv13At6')],
      // C10-1 (2026-10-23): CDC states this card's claim and is cited by
      // number above; nothing here rests on p2016, so it comes off.
      refs: childRefsExcept('p2016'),
    }));
  }

  return out;
}

// ═══════════════════════════════════════════════════════════════════════════
//  ADULTS 19–49y (risk-only) and ≥50y (routine) — CDC adult notes
// ═══════════════════════════════════════════════════════════════════════════
function pcvAdult(am, riskIds, pcv, ppsv, today, dob = null, adultRepeat = null) {
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
  //
  // C8, document 2's CITE (2026-10-17): this sentence had NO citation at all,
  // on all 120 cards that printed it. The job aid's page 1 footnote is where
  // "consider" comes from, so it is now quoted here rather than left to the
  // reader to locate among the card's buttons.
  const offersShorterMinimum = adultPpsvShorterMinimumOffered(am, riskIds);
  const shorterMinimumNote = offersShorterMinimum
    ? ` A minimum interval of ${intervalPhrase({ days: ADULT_PPSV23_SHORTER_MINIMUM_WEEKS * 7 })} may be considered for an immunocompromising condition, cochlear implant, or cerebrospinal fluid leak [c].`
    : '';
  // One cite per marker: empty when the sentence is absent, so a caller can
  // spread it into noteCites without an age test of its own.
  const shorterMinimumCites = offersShorterMinimum
    ? [cite('jobAidEightWeekOptionAt50')]
    : [];
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
  //
  // C8, document 2 (OWNER DECISIONS 2026-10-17). These three are the adult
  // pathway's DEFAULT source list, and a card may now ask for a different one.
  // That is the structural fix for the root cause the owner reported: one
  // `collectRefs` call used to be computed here and spread onto all ten adult
  // cards, so every card listed all three documents whether or not anything it
  // said rested on them -- the whole of "I forget why there are multiple
  // source chips listed if its only citing one of them". A card asks for its
  // own list through `adultRefs()`; the default is unchanged, so a card that
  // does not ask is exactly as it was.
  const ADULT_DEFAULT_REFS = ['cdcAdultPneumo', 'cdcAdultTimingJobAid', 'mmwr7401a1'];
  const adultRefs = (defaults = ADULT_DEFAULT_REFS) => collectRefs(riskIds, defaults, 'adult');
  const refs = adultRefs();
  // Document 2, decision 1: the Timing Job Aid never states in words that
  // routine vaccination begins at 50 -- that is inferable only from its page
  // HEADINGS. Citing a table of contents as the source of a prose claim is the
  // "right-sounding quote that isn't there" failure, so it comes off.
  /** The pathway defaults, minus documents that do not speak for this card. */
  const adultRefsExcept = (...drop) => adultRefs(
    ADULT_DEFAULT_REFS.filter((k) => !drop.includes(k)),
  );
  const refsWithoutJobAid = adultRefsExcept('cdcAdultTimingJobAid');
  // C8, document 1 (OWNER DECISION 2026-10-17, *"Approve all six removals."*),
  // NARROWED 2026-10-18 by FINDING F. mm7401a1 does not state that "a series
  // including PCV20/21 is complete" or that "PCV15 then PPSV23 is complete" --
  // both are the Adult Notes' sentences, already cited on those cards -- so it
  // comes off those two families, and off the PCV15-given / PPSV23-pending
  // cards, where the only candidate sentence is printed inside the "None or
  // PCV7 only" row and is the instruction for CHOOSING PCV15 (owner, 18 Oct:
  // *"use job aid since PCV15 isn't listed in the MMWR table"*).
  //
  // ⚠ The 2026-10-17 removals went further than that, and were wrong to. The
  // reading they rested on had recorded only three sentences, all from the
  // Summary box and the body prose; the clinical guidance TABLE was not read
  // until the next session. Two of the removed statements have a table row
  // whose HEADING is the patient's exact history -- "PPSV23 only" and "PCV13
  // at any age and PPSV23 at age >=65 years" -- so the document does speak for
  // them. Restored 2026-10-18 with those rows cited; see
  // `regression-c8-2026-10-18-mmwr-table-rows-restored.test.js`. Before
  // removing this document from anything again, read its table.
  const refsWithoutMmwr = adultRefsExcept('mmwr7401a1');
  // Document 2, decision 2: the job aid's page 1 row `PCV15 & PPSV23 OR PCV20
  // OR PCV21 / at any age` answers (D) "schedule is complete" -- but page 1 is
  // the >=50 page. On pages 2-4 the same history answers (E) "Review
  // pneumococcal vaccine recommendations again when your patient turns 50
  // years old", which is not what these two cards say. So the job aid is
  // credited at 50+ and removed below it. The advice does not move; only the
  // credit does. `isOlderAdult` IS the ROUTINE_ADULT_MIN_M predicate -- do not
  // grow a second age test here.
  const refsSeriesComplete = isOlderAdult
    ? refsWithoutMmwr
    : adultRefsExcept('mmwr7401a1', 'cdcAdultTimingJobAid');
  // C8, document 2's CITEs (2026-10-17) — the OTHER half of the same owner
  // decision. Decision 2 said the job aid is credited at 50+ and removed below
  // it; the line above does the removing, and these two do the crediting, so
  // the button and the raised number are decided by ONE predicate and cannot
  // drift apart. `isOlderAdult` IS the ROUTINE_ADULT_MIN_M test — never a
  // second age test here (the escape that passed all 1,177 tests).
  // C8, document 1's CITEs (2026-10-17). mm7401a1's table answers a PCV13 +
  // PPSV23 history in THREE different rows, and which one speaks for a card
  // depends on the patient's age band AND — below 50 — on how many PPSV23
  // doses actually counted. `ppsv.count` is the EFFECTIVE count (a dose the
  // engine rejected is not a dose ACIP's row is about), and this is the one
  // place that reads it for a citation, so the marker and the key cannot
  // drift apart. `isOlderAdult` IS the ROUTINE_ADULT_MIN_M predicate — never
  // a second age test here.
  //
  // The CHRONIC block does not split on the count (OWNER DECISION 2026-10-18).
  // mm7401a1 prints one row there for a PCV13 + PPSV23 history, headed "PCV13
  // and 1 dose of PPSV23", and the owner ruled that it speaks for a patient
  // with two doses as well: *"for chronic condition with PCV13 and 2 doses of
  // PPSV23 I would use the citation covering PCV13 and 1 dose of PPSV23 …"*.
  // The clinical reason the count cannot move the row: in the chronic block a
  // second PPSV23 is never OFFERED. ACIP offers one only inside the
  // immunocompromising block ("When a second PPSV23 dose is used instead of
  // PCV21 or PCV20…"), and the chronic 1-dose row offers nothing but the
  // review at 50 — so there is no second-dose disposition for an extra dose
  // to land on. This retired the 45 deliberately-uncredited cards.
  //
  // ⚠ The IMMUNOCOMPROMISING block below still splits on the count and must
  // keep splitting: one dose reads "the series is complete", two doses reads
  // "reviewed again … Alternatively, … >=5 years". Those are different
  // sentences about different dispositions. Never collapse THAT pair.
  const mmwrBothPcv13PpsvKey = (icRow) => {
    if (isOlderAdult) return 'mmwrBothPcv13Ppsv50plus';
    if (!icRow) return 'mmwrChronic1949ReviewAt50';
    if (ppsv.count === 1) return 'mmwrIc1949OnePpsv';
    // TWO OR MORE (§C-P2-THIRD, 2026-10-31). ACIP prints no row for a third
    // PPSV23; an adult who had one as a child (the "child today" limit lets the
    // adult rows count it) is given the two-dose row's dose either way, so the
    // row that names it is cited rather than none.
    if (ppsv.count >= 2) return 'mmwrIc1949TwoPpsv';
    return null;
  };
  // One cite per marker, so a caller spreads both or neither.
  const mmwrBothPcv13PpsvCites = (icRow) => {
    const key = mmwrBothPcv13PpsvKey(icRow);
    return key ? [cite(key)] : [];
  };
  const mmwrBothPcv13PpsvMarker = (icRow) => (mmwrBothPcv13PpsvKey(icRow) ? ' [c]' : '');
  // OWNER DECISION 2026-10-18, the job aid's three cell-only statements:
  // *"use MMWR table"*. mm7401a1's "PCV13 only" row is printed in two
  // wordings ONE WORD apart -- the 19-49 immunocompromising / cochlear / CSF
  // block inserts "administered", the >=50 and 19-49 chronic blocks do not.
  // `ppsvIntervalDays != null` IS the S15 risk-class decision (8 weeks at
  // 19-49 for IC / cochlear / CSF, a year otherwise), reused here rather than
  // re-derived, so the split has one home -- the same reasoning as
  // `mmwrNoneRowCites` above. Never a second age test, and never a second
  // risk-class test either.
  const mmwrPcv13OnlyCite = ppsvIntervalDays != null
    ? 'mmwrPcv13OnlyThenPcv1949Ic'
    : 'mmwrPcv13OnlyThenPcv';
  const jobAidCompleteMarker = isOlderAdult ? ' [c]' : '';
  const jobAidCompleteCites = isOlderAdult ? [cite('jobAidSeriesCompleteAt50')] : [];
  // Which sentence sits beside the PCV15->PPSV23 interval. It must state the
  // SAME number the card states, so it follows the same predicate.
  const ppsvIntervalCite = ppsvIntervalDays != null
    ? 'adultPcv15ThenPpsvShort'
    : 'adultPcv15ThenPpsv';
  // C8, document 1's CITE for mm7401a1's "None or PCV7 only at any age" row.
  // ACIP prints that row's YEAR wording identically in two blocks — adults
  // >=50, and 19-49 with chronic conditions only — so one entry serves both
  // (`population` records who a sentence is about, and this one is about
  // both). The 19-49 IMMUNOCOMPROMISING / cochlear / CSF version of the same
  // row says 8 weeks instead, and already credits mm7401a1 through
  // `adultPcv15ThenPpsvShort`, so it must not get a second number for the
  // same document. Keying on `ppsvIntervalCite` ties this to the ONE
  // interval decision (S15) rather than growing an age test of its own.
  const mmwrNoneRowCites = ppsvIntervalCite === 'adultPcv15ThenPpsv'
    ? [cite('mmwrNoneOrPcv7Only')]
    : [];
  const mmwrNoneRowMarker = mmwrNoneRowCites.length ? ' [c]' : '';
  // C8, CDC Adult Notes' last uncredited statement (2026-10-22), 25 cards.
  // The PCV15->PPSV23 card carries a grey button for CDC's Adult Schedule
  // Notes. At >=50, and at 19-49 with chronic conditions only, the INTERVAL
  // sentence already cites them (`adultPcv15ThenPpsv`, the year), so the
  // button has a number. At 19-49 with an immunocompromising condition,
  // cochlear implant or CSF leak the interval sentence cites ACIP instead
  // (the 8 weeks), and the notes were left on the card with nothing pointing
  // at them. This credits them for the claim they DO state for her -- that a
  // PCV15 is not a complete series until the PPSV23 is given.
  //
  // Conditional for the reason recorded a few lines above for
  // `mmwrNoneRowCites`: a document must not take a SECOND number on a card
  // that already cites it. Keyed on `ppsvIntervalCite`, which IS the one S15
  // risk-class decision -- never a second age test and never a second
  // risk-class test.
  const notesCompletionCites = ppsvIntervalCite === 'adultPcv15ThenPpsvShort'
    ? [cite('adultPcv15NeedsPpsvCompletion')]
    : [];
  const notesCompletionMarker = notesCompletionCites.length ? ' [c]' : '';
  const adultBrands = pcvRecBrands({ adult: true });

  // 19–49 with NO risk → not indicated (routine starts at 50).
  if (!isOlderAdult && !anyRisk) {
    return [rec({
      vaccine: 'PCV', status: 'not-indicated',
      doseLabel: 'Not indicated (no risk, <50y)',
      note: 'Routine pneumococcal vaccination begins at age 50 [c]. Adults 19–49 years are recommended a pneumococcal vaccine only with a qualifying risk condition [c] [c].',
      noteCites: [
        // A declared cross-reference (2026-10-17): the 50+ routine sentence,
        // quoted to a patient below 50 on purpose. The claim it supports is
        // "routine pneumococcal vaccination begins at age 50", which is the
        // reason this patient is NOT due — a boundary can only be stated by
        // the rule on the other side of it.
        cite('adultRoutine50', {
          aboutAnotherGroup: 'states where routine vaccination begins, which is why this younger patient is not due',
        }),
        cite('cdcAdultRiskFactorList'),
        // C8, document 1's CITE. ACIP's own summary of what the October 2024
        // expansion did NOT change. It is about 19-49 adults in its own
        // words, so this card credits mm7401a1 without needing a second
        // declared cross-reference beside `adultRoutine50`.
        cite('mmwrRiskBased1949Unchanged'),
      ],
      refs: refsWithoutJobAid,
    })];
  }

  const ppsvGiven = ppsv.count > 0;

  // ── Already complete by product ──────────────────────────────────────
  // PCV20 or PCV21 in history → complete.
  if (pcv.hasPCV20 || pcv.hasPCV21) {
    return [rec({
      vaccine: 'PCV', status: 'complete',
      doseLabel: `Complete (history includes ${pcv.hasPCV21 ? 'PCV21' : 'PCV20'})`,
      note: `A pneumococcal series that includes PCV20 or PCV21 is complete — no PPSV23 and no further PCV needed [c]${jobAidCompleteMarker}.`,
      noteCites: [cite('adultPcv20or21Complete'), ...jobAidCompleteCites],
      refs: refsSeriesComplete,
    })];
  }
  // PCV15 + PPSV23 → complete.
  if (pcv.hasPCV15 && ppsvGiven) {
    return [rec({
      vaccine: 'PCV', status: 'complete',
      doseLabel: 'Complete (PCV15 + PPSV23)',
      note: `PCV15 followed by PPSV23 is a complete pneumococcal series — no further doses needed [c]${jobAidCompleteMarker}.`,
      noteCites: [cite('adultPcv15ThenPpsv'), ...jobAidCompleteCites],
      refs: refsSeriesComplete,
    })];
  }

  // ── An invalid dose is the last thing on the record → a conjugate is owed
  //    (OWNER RULING 2026-10-24) ─────────────────────────────────────────
  //
  // PLACED AFTER THE TWO "COMPLETE" CHECKS ON PURPOSE, and that placement is
  // her dividing line, not an implementation detail: "Calling it 'invalid'
  // changes nothing, because no dose was owed." A patient whose COUNTING
  // history already completes the series keeps her complete card — an early
  // extra dose cannot un-finish her, which is Ruling F. This branch is only
  // for a patient who still owed a dose and whose attempt at it came too soon.
  //
  // It replaces two cards that were both wrong for these patients. Driven in
  // the app on her asplenic patient, the old screen read "PPSV23 (>=8 weeks
  // after PCV15) — Not yet due, eligible Oct 25, 2026" directly above a chip
  // reading "can be given from 2027-10-11": two dates, two different vaccines,
  // one patient.
  //
  // THE DATE AND THE PRODUCTS COME FROM `adultRepeat`, which the engine read
  // off the dose verdict. Nothing here recalculates either.
  if (adultRepeat) {
    const { dueDate, products, invalidDate, invalidVaccine, basis } = adultRepeat;
    const dueToday = dueDate <= today;
    const productWords = products.join(' or ');
    const gaveWhat = invalidVaccine === 'PPSV23' ? 'PPSV23' : 'conjugate';

    // HER RULING 6, the whole reason this sentence exists: "make it clear that
    // the 8 week interval is pediatric data with nothing clarifying adults.
    // Cite the reference. State using 1 year is an interpretation from ACIP
    // minimum interval for adults between PCV13 and the next conjugate. Cite
    // this too."
    //
    // So the two legs of her lookup say different things about their own
    // standing, and the clause is EMPHASISED because a reader who skims past
    // it is the reader who thinks the app has simply used the wrong number.
    //
    // ⚠️ THE PAEDIATRIC TABLE IS NAMED IN WORDS AND CARRIES NO [c]. A numbered
    // citation asserts "this document states my claim", and the claim here is
    // partly about what the document does NOT cover — there is no adult
    // 8-week conjugate-to-conjugate interval anywhere. CLAUDE.md's rule is
    // cite it or take it off; a negative claim can be neither, so it is stated
    // the way the dose chips already name CDC, in prose. The card's grey
    // buttons stay adult, which is also what `population` requires.
    // ⚠️ FINDING F IN MINIATURE, CAUGHT BY THE COUNT PINS. Narrowing this
    // card's sources to CDC's adult notes took the job aid off 56 cards it
    // DOES speak for. For a patient with a PCV15 on record whose PPSV23 came
    // too soon, the conjugate now being offered is literally standing in for
    // the PPSV23 she still owes — which is the job aid's footnote, and nothing
    // else in the app's source set states it (C8, document 2). So those cards
    // keep it, WITH a number and the sentence it is attached to. For family 2
    // there is no PPSV23 being substituted, so it stays off.
    //
    // This is the owner's 2026-10-18 rule in use: every candidate document
    // gives the SAME dose here, so the only question is which goes on the
    // card, and that is a judgement to take and record rather than escalate.
    const substitutingForOwedPpsv23 = invalidVaccine === 'PPSV23' && pcv.hasPCV15;
    const substitutionNote = substitutingForOwedPpsv23
      ? ' The PPSV23 this patient still owed may be replaced by PCV20 or PCV21 [c].'
      : '';
    const substitutionCites = substitutingForOwedPpsv23 ? [cite('jobAidPpsv23Unavailable')] : [];

    // THE SAME CORRECTION, FOR THE OTHER FAMILY AND THE OTHER DOCUMENT.
    // Narrowing the sources also took mm7401a1 off 132 family-2 cards, and
    // FINDING F's guard is what caught it. Its "PPSV23 only" row — identical in
    // all three adult blocks — states exactly this patient's disposition: "A
    // single dose of PCV21, PCV20, or PCV15 >=1 year after the last PPSV23
    // dose." With her conjugate set aside her counting history IS PPSV23-only,
    // so the row fits, and its own year has already elapsed.
    //
    // ⚠️ CITED FOR THE DISPOSITION, NOT FOR THE DATE. The card's date is later
    // than the row's, because the repeat must also clear the spacing from the
    // dose that did not count. Crediting mm7401a1 with the card's date would
    // be the "right-sounding quote written about something else" fault, so the
    // claim gets its OWN sentence and the sentence says why the date differs.
    // The two families are mutually exclusive: family 2 has no counting PCV15.
    const ppsvOnlyRowApplies = invalidVaccine === 'PCV' && !pcv.hasPCV15 && !pcv.hasPCV13;
    const ppsvOnlyRowNote = ppsvOnlyRowApplies
      ? ` With only a PPSV23 counting, a single dose of ${productWords} at least ${ADULT_GAP_WORDS} after it completes the series [c] — the later date above is the further spacing CDC's general rule requires from the dose that did not count.`
      : '';
    const ppsvOnlyRowCites = ppsvOnlyRowApplies
      ? [cite('mmwrPpsvOnlyThenPcv')]
      : [];

    // THE SAME CORRECTION AGAIN, FOR THE FAMILIES ADDED 2026-10-25.
    //
    // Extending this card to the two PCV13 rows took mm7401a1 off **212**
    // cards it speaks for, and the three C8 guards caught it the moment the
    // change ran (3,795 -> 3,583). That is FINDING F's mirror for the third
    // time on this one card, and the fix is the same shape as the two above:
    // read the document, find the row that fits, cite it in its own sentence.
    //
    // The row: with the PPSV23 set aside, this patient's COUNTING history is a
    // PCV13 and nothing else, which is precisely mm7401a1's "PCV13 only" row —
    // "A single dose of PCV21 or PCV20 >=1 year after the PCV13 dose." It
    // states her disposition outright, and it is the row the card she had
    // before this change was built on.
    //
    // ⚠️ CITED FOR THE DISPOSITION, NOT FOR THE DATE — the same care the
    // "PPSV23 only" sentence above takes, and for the same reason. The row's
    // year runs from the PCV13; the card's date is later, because the repeat
    // must also clear the spacing from the PPSV23 that did not count. That
    // gap IS the owner's 2026-10-25 ruling (she was shown both dates and chose
    // the later), so the sentence says which number belongs to the document
    // and which to the ruling, and never lets the document carry the date.
    //
    // Mutually exclusive with both branches above: this one needs a counting
    // PCV13 and no PCV15, `substitutingForOwedPpsv23` needs a PCV15, and
    // `ppsvOnlyRowApplies` needs neither conjugate.
    //
    // `mmwrPcv13OnlyCite` is the existing picker (the 19-49 IC/CSF/cochlear
    // block prints this row one word differently). Reused, never re-derived —
    // a second risk-class test here would be the S14-RC fault.
    const pcv13OnlyRowApplies = invalidVaccine === 'PPSV23' && pcv.hasPCV13 && !pcv.hasPCV15;
    const pcv13OnlyRowNote = pcv13OnlyRowApplies
      ? ` With only the PCV13 counting, ACIP's own row for this history gives a single dose of ${productWords} at least ${ADULT_GAP_WORDS} after that PCV13 [c] — the later date above is the further spacing CDC's general rule requires from the dose that did not count.`
      : '';
    const pcv13OnlyRowCites = pcv13OnlyRowApplies
      ? [cite(mmwrPcv13OnlyCite)]
      : [];

    const standing = basis === 'ppsv23ToConjugate'
      ? ` **ACIP states this interval itself — a conjugate dose comes at least ${ADULT_GAP_WORDS} after the last PPSV23, for every risk group, with no 8-week option [c]. Counting it from the dose that was given, rather than from the one before it, follows CDC's general rule that a repeat is spaced from the invalid dose.**`
      : ` **The ${ADULT_GAP_WORDS} is read across from the only adult conjugate-to-conjugate interval ACIP states — PCV20 or PCV21 at least ${ADULT_GAP_WORDS} after the last PCV13 dose [c] — and applied here to a conjugate that has to be repeated, which ACIP does not discuss. It is an interpretation, not a stated rule. The 8-week conjugate interval is paediatric: it is CDC's catch-up schedule, whose own scope line reads "Children age 4 months through 6 years", and no adult source states one.**`;

    return [rec({
      vaccine: 'PCV', status: anyRisk ? 'risk-based' : 'due',
      doseLabel: `${productWords} ≥${ADULT_GAP_WORDS} after the ${gaveWhat} dose of ${fmtDate(invalidDate)} — completes the series`,
      dueToday, earliestNextDate: dueToday ? null : dueDate,
      minIntervalMonths: MO12,
      brands: products.map((k) => (k === 'PCV20' ? 'PCV20 (Prevnar 20)' : 'PCV21 (Capvaxive)')),
      note: {
        lead: `The ${gaveWhat} dose of ${fmtDate(invalidDate)} was given too soon to count, so the series is INCOMPLETE. Give 1 dose of ${productWords} ${dueToday ? 'now' : `on or after ${fmtDate(dueDate)}`} and the series is complete [c].${standing}`,
        detail: `PPSV23 is not what is owed here: ACIP's only interval between two PPSV23 doses is 5 years, and a repeat conjugate completes the series on its own. PCV15 is not used either — it adds nothing over a conjugate already on the record, and it would itself require a PPSV23 afterwards.${ppsvOnlyRowNote}${pcv13OnlyRowNote}${substitutionNote}`,
      },
      noteCites: [
        cite('adultPcv20or21Complete'),
        basis === 'ppsv23ToConjugate'
          ? cite(isOlderAdult ? 'adultPpsvOnly' : 'adultPpsvOnly1949')
          : cite('adultPcv13Only'),
        ...ppsvOnlyRowCites,
        ...pcv13OnlyRowCites,
        ...substitutionCites,
      ],
      // ⚠️ CDC'S ADULT NOTES ALONE, and this is the fix for a real defect the
      // first draft shipped. `adultRefs()` with no exclusions spreads all three
      // adult documents over the card — exactly the shape CLAUDE.md forbids,
      // "never a single list computed once and spread over every card" — and
      // it left 188 cards carrying mm7401a1 and job-aid buttons that no number
      // on the card pointed at. Every numbered citation this card makes is a
      // sentence of CDC's adult notes: the completion claim, and whichever leg
      // of the interval lookup applies. The job aid and mm7401a1 say nothing
      // about repeating an invalid dose, so they come off — "cite it, or take
      // it off that card".
      // Each family carries the documents that speak for ITS sentences and no
      // others: CDC's notes always, mm7401a1 only where its "PPSV23 only" row
      // fits, the job aid only where its substitution footnote does.
      // Each family carries the documents that speak for ITS sentences, and
      // the branch order matches the four `...RowApplies` flags above.
      // `pcv13OnlyRowApplies` (2026-10-25) keeps mm7401a1 for its "PCV13 only"
      // row and drops the job aid, which says nothing about a repeat.
      refs: ppsvOnlyRowApplies
        ? adultRefsExcept('cdcAdultTimingJobAid')
        : pcv13OnlyRowApplies
          ? adultRefsExcept('cdcAdultTimingJobAid')
          : substitutingForOwedPpsv23
            ? adultRefsExcept('mmwr7401a1')
            : adultRefsExcept('cdcAdultTimingJobAid', 'mmwr7401a1'),
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
        detail: `PCV15 was given but PPSV23 is still pending; the pneumococcal series is complete once it is given${notesCompletionMarker}. If PPSV23 is unavailable, a dose of PCV20 or PCV21 may be substituted to complete [c].`,
      },
      // C8, document 2's CITE: the substitution sentence is the job aid's
      // footnote and NOTHING ELSE in the app's source set states it, so this
      // claim had no citation of any kind before now.
      //
      // C8, CDC Adult Notes' last statement (2026-10-22): `notesCompletion*`
      // credits the notes for the REQUIREMENT that a PPSV23 follow a PCV15.
      // See its definition above for why it is conditional.
      noteCites: [
        cite(ppsvIntervalCite),
        ...shorterMinimumCites,
        ...notesCompletionCites,
        cite('jobAidPpsv23Unavailable'),
      ],
      refs: refsWithoutMmwr,
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
        lead: `Give 1 dose of PCV15, PCV20, or PCV21 ≥${ADULT_GAP_WORDS} after the PPSV23 dose [c] [c].`,
        detail: 'PPSV23 was given previously, with no prior PCV or a PCV of unknown product. If PCV15 is chosen, no further PPSV23 is needed — the PPSV23 requirement is already met.',
      },
      // Population field (2026-10-17): CDC prints this row in both adult
      // blocks and the wording differs ("or PCV21," at 19-49, "or 1 dose
      // PCV21" at 50+). Same advice either way; the card quotes the block its
      // patient is in. The boundary is ROUTINE_ADULT_MIN_M via isOlderAdult —
      // never a second age test.
      // FINDING F (2026-10-18): mm7401a1's table carries a row headed "PPSV23
      // only" in all three adult blocks, word for word identical, stating
      // this card's whole claim -- products and interval. It had been removed
      // from these 1,154 cards on the ground that the document does not state
      // the interval. It does. `population` covers both bands, so there is no
      // age split here and no second age test.
      noteCites: [
        cite(isOlderAdult ? 'adultPpsvOnly' : 'adultPpsvOnly1949'),
        cite('mmwrPpsvOnlyThenPcv'),
      ],
      // The job aid states this only as a table CELL -- "≥1 year" and
      // "PCV20 or PCV21" as two text runs in its "PPSV23 only" row -- and
      // nowhere in words. OWNER DECISION 2026-10-18: use the MMWR table, and
      // the job aid comes off.
      refs: refsWithoutJobAid,
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
      note: `PCV13 was given previously: give 1 dose of PCV20 or PCV21 ≥${ADULT_GAP_WORDS} after the last PCV13 dose [c] [c]. This completes the series — no PPSV23 needed [c].`,
      // C8, document 1's CITE. "No PPSV23 needed" carried NO citation at all
      // before this: it is mm7401a1's body prose, the paragraph that retired
      // PPSV23 as a way to finish a PCV13-started series. The sentence says
      // "adults aged >=19 years" itself, so it needs no age split.
      // OWNER DECISION 2026-10-18. The ≥1 year and the products are ACIP's
      // "PCV13 only" row; "no PPSV23 needed" is its body prose, cited
      // separately above -- one citation per claim, never one quote covering
      // both halves. The job aid stated the interval only as a table cell, so
      // it comes off.
      noteCites: [
        cite('adultPcv13Only'),
        cite(mmwrPcv13OnlyCite),
        cite('mmwrPcv13NoPpsv23ToComplete'),
      ],
      refs: refsWithoutJobAid,
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
          lead: `An additional PCV20 or PCV21, ≥${LONG_GAP_WORDS} after the last pneumococcal dose, is a shared clinical decision — it may be given or omitted [c] [c] [c].`,
          detail: 'PCV13 and PPSV23 have both been given, and the PPSV23 dose was received at age 65 or older. CDC places this group under shared clinical decision-making rather than a routine recommendation.',
        },
        // C8, document 2's CITE: both documents state this one in words, so
        // the sentence carries both numbers. That is "cite it, or take it off
        // that card" with the cite chosen (OWNER DECISION 2026-10-17).
        // FINDING F (2026-10-18): the third number is mm7401a1's own row,
        // "PCV13 at any age and PPSV23 at age >=65 years", which states the
        // shared decision AND the >=5 years. It had been removed from these
        // 440 cards on the ground that "the paper never discusses it"; the
        // paper gives it a table row.
        noteCites: [
          cite('adultBothAt65'),
          cite('jobAidSharedDecision65'),
          cite('mmwrSharedDecision65'),
        ],
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
        // FINDING C (2026-10-17): one citation per claim, each to the sentence
        // that states THAT claim. The lead says no dose is due now — CDC says
        // that in its 19–49 block, and `adultChronicOnlyReviewAt50` is it. The
        // detail says what happens at 50, which is the 50+ row, so
        // `adultBothNotAt65` stays and moves to the half it supports. Before
        // this, the 50+ row was the lead's only citation: a quote instructing
        // a dose beside a sentence saying none is due, on 175 grid patients.
        note: {
          lead: `No additional pneumococcal dose now — re-evaluate at age 50 [c] [c]${mmwrBothPcv13PpsvMarker(false)}.`,
          detail: `This is an adult aged 19–49 with a chronic (non-immunocompromising) condition who has already received PCV13 and PPSV23. At age 50, a dose of PCV20 or PCV21 is recommended, ≥${LONG_GAP_WORDS} after the last pneumococcal dose [c].`,
        },
        noteCites: [
          cite('adultChronicOnlyReviewAt50'),
          // C8, document 2's CITE. The job aid's page 4 row is the same claim
          // in CDC's own words, and page 4 is the 19-49 chronic page — the
          // only one of the four whose PCV13 + PPSV23 row has no Option A.
          cite('jobAidChronic1949ReviewAt50'),
          // C8, document 1's CITE. ACIP's chronic block states "reviewed
          // again … at age 50" for a patient with PCV13 and PPSV23, and the
          // owner ruled 2026-10-18 that the row speaks whether one dose or
          // two are on record — it is the block's only disposition for that
          // history. It is NOT the immunocompromising block's row, which is a
          // different patient and still splits on the count.
          ...mmwrBothPcv13PpsvCites(false),
          // A declared cross-reference (2026-10-17): the detail half says what
          // happens AT 50, so it quotes the 50+ row — about a patient this one
          // is not yet. Same shape as `adultRoutine50` on the no-risk card: a
          // boundary can only be stated by the rule on the other side of it.
          cite('adultBothNotAt65', {
            aboutAnotherGroup: 'states the dose this patient will be due once they reach 50, which is what the card tells them to come back for',
          }),
        ],
        refs,
      })];
    }
    // ── 19-49 IC / cochlear / CSF with TWO PPSV23 doses: ACIP's order ──
    // OWNER DECISION 2026-10-18 (*"use MMWR"*). mm7401a1's immunocompromising
    // block answers a PCV13 + PPSV23 history in two rows that do NOT say the
    // same thing. One dose is a flat recommendation ("A single dose of PCV21
    // or PCV20 >=5 years ... The pneumococcal vaccination series is
    // complete"). Two doses leads with the deferral and offers the dose
    // second ("...should be reviewed again when the person turns age 50
    // years. Alternatively, a single dose of either PCV21 or PCV20 should be
    // administered >=5 years..."). The app said the same thing to both, which
    // hid a choice its own source prints.
    //
    // The DOSE does not change: same products, same five years, same due
    // date, same status. Only the words do -- the note AND the dose label,
    // because the label is the first line read and a header that still led
    // with the dose would contradict the body. The verdict corpora record no
    // prose and no dose labels, by design, so neither moves.
    //
    // `ppsv.count` is the EFFECTIVE count. The card asks
    // `mmwrBothPcv13PpsvKey()` which row speaks rather than re-testing the
    // count (§C-P2-THIRD, 2026-10-31), so the wording and the quote cannot
    // drift apart. `isOlderAdult` IS the ROUTINE_ADULT_MIN_M
    // predicate -- never a second age test.
    if (mmwrBothPcv13PpsvKey(true) === 'mmwrIc1949TwoPpsv') {
      return [rec({
        vaccine: 'PCV', status: anyRisk ? 'risk-based' : 'due',
        doseLabel: `Review at age 50 — or PCV20 or PCV21 ≥${LONG_GAP_WORDS} after the last pneumococcal dose`,
        dueToday, earliestNextDate, minIntervalMonths: MO60,
        brands: ['PCV20 (Prevnar 20)', 'PCV21 (Capvaxive)'],
        note: {
          lead: `Review the pneumococcal recommendations again at age 50 [c]. Alternatively, 1 dose of PCV20 or PCV21 may be given now, ≥${LONG_GAP_WORDS} after the last pneumococcal dose [c] — that completes the series.`,
          detail: `This is an adult aged 19–49 with an immunocompromising condition, a cochlear implant or a CSF leak who has already received PCV13 and ${ppsv.count === 2 ? 'two' : ppsv.count} doses of PPSV23. ACIP states the review at 50 first and the further dose as the alternative; both are recommended options.`,
        },
        // One citation per claim. The review at 50 is stated only by ACIP's
        // two-dose row -- CDC's Adult Notes give the dose and its five years
        // and say nothing about 50 -- so the halves do not share a number.
        noteCites: [
          cite('mmwrIc1949TwoPpsv'),
          cite('adultIc1949BothPcv13Ppsv'),
        ],
        refs: refsWithoutJobAid,
      })];
    }
    return [rec({
      vaccine: 'PCV', status: anyRisk ? 'risk-based' : 'due',
      doseLabel: `PCV20 or PCV21 ≥${LONG_GAP_WORDS} after last pneumococcal dose — completes the series`,
      dueToday, earliestNextDate, minIntervalMonths: MO60,
      brands: ['PCV20 (Prevnar 20)', 'PCV21 (Capvaxive)'],
      note: `PCV13 and PPSV23 already given: give 1 dose of PCV20 or PCV21 ≥${LONG_GAP_WORDS} after the last pneumococcal dose [c]${mmwrBothPcv13PpsvMarker(true)}. This completes the series.`,
      // Population field (2026-10-17). Reaching here below 50 means the
      // chronic-only branch above did not fire, so this patient has a cochlear
      // implant, a CSF leak or an immunocompromising condition — CDC's own
      // 19-49 row for exactly that, rather than the 50+ row this card used to
      // quote. Same five years, same products; what differs is which patient
      // the sentence was written about.
      // C8, document 1's CITE. Below 50 this card is the IC / cochlear / CSF
      // branch (the chronic-only one returned above), and mm7401a1 splits
      // THAT block again by PPSV23 dose count — one dose "the series is
      // complete", two doses "reviewed again … Alternatively, … ≥5 years".
      // The card's advice is the same either way; the sentence behind it is
      // not, so the quote follows the count.
      noteCites: [
        cite(isOlderAdult ? 'adultBothNotAt65' : 'adultIc1949BothPcv13Ppsv'),
        ...mmwrBothPcv13PpsvCites(true),
      ],
      // The job aid's "PCV13 & PPSV23" row is the two text runs "≥5 years"
      // and "PCV20 or PCV21"; it says this in no sentence. OWNER DECISION
      // 2026-10-18: use the MMWR table, already cited on the line above.
      refs: refsWithoutJobAid,
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
        lead: `Give 1 dose of PCV20 or PCV21 — OR 1 dose of PCV15 followed by PPSV23 ≥${ppsvIntervalLabel} later [c]${mmwrNoneRowMarker}.${shorterMinimumNote}`,
        detail: 'Routine pneumococcal vaccination for adults ≥50 with no, unknown, or PCV7-only history. A PCV7-only history counts as no PCV history [c] [c]. PCV20 and PCV21 each complete the series alone [c].',
      }
      : {
        // No shorterMinimumNote here: at 19–49 the 8 weeks is already the
        // interval in `ppsvIntervalLabel` for this class, so the sentence
        // could only ever be empty. S6-3's rule — do not leave a branch that
        // cannot fire looking load-bearing.
        lead: `Give 1 dose of PCV15, PCV20, or PCV21. If PCV15 is chosen, follow with PPSV23 ≥${ppsvIntervalLabel} later [c]${mmwrNoneRowMarker}.`,
        detail: 'This is an adult 19–49 with a qualifying risk condition and no, unknown, or PCV7-only pneumococcal history; the series is complete once the PPSV23 follow-up is given. A PCV7-only history counts as no PCV history [c] [c]. PCV20 and PCV21 each complete the series alone [c].',
      },
    noteCites: [
      cite(isOlderAdult ? 'adultRoutine50' : ppsvIntervalCite),
      // C8, document 1's CITE. Empty for the 19-49 immunocompromising /
      // cochlear / CSF patient, whose interval is 8 weeks and whose cite
      // above IS mm7401a1 already.
      ...mmwrNoneRowCites,
      // Empty below 50, where the 8-week sentence is absent, so the marker
      // count and the cite count stay equal without a second age test.
      ...shorterMinimumCites,
      cite('adultPcv7Only'),
      // C8, document 2's CITE: the job aid's footnote * says the same thing
      // for the "None*" row, on all four pages.
      cite('jobAidPcv7CountsAsNone'),
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
// The adult families whose RECOMMENDATION CARD follows the invalid dose, per
// the owner's ruling of 2026-10-24. See `adultRepeatOwed` for why this is a
// named set and not "every adult floor".
const CARD_FOLLOWS_INVALID_DOSE = new Set([
  'ADULT-PCV-AFTER-PPSV23',
  'ADULT-PPSV23-AFTER-PCV15',
  'ADULT-PPSV23-AFTER-PCV15-SHORTER-MINIMUM',
  // OWNER DECISIONS 2026-10-25, the two PCV13 twins of the rows above.
  //
  // Shown two 60-year-olds alike in every particular but one — PCV13 on
  // 2026-07-19 against PCV15 on the same day, each followed by a PPSV23 three
  // months later — the owner ruled: *"A is treated the same as B."* The PCV15
  // patient's screen had agreed with itself since 2026-10-24; the PCV13
  // patient's card said 2027-07-19 while her own dose chip said 2027-10-11.
  // Nothing in ACIP or CDC separates them: rr7203a1 states both halves in one
  // sentence, and `CLINICAL_SPEC.md` §K already recorded the two rows as
  // having "the same two-tier shape... for the same reason".
  'ADULT-PPSV23-AFTER-PCV13',
  // ...and the same for her 8-week class. Asked to confirm the number, she
  // asked back whether the conjugate is owed "at least 1 year after the last
  // PCV", which is ONE of the two clocks and the earlier one. Shown a
  // 40-year-old with asplenia (PCV13 2026-08-30, PPSV23 2026-10-11) scored
  // both ways — 2027-08-30 counting from the PCV13, 2027-10-11 counting from
  // the PPSV23 that did not count, 2027-10-11 taking the later of the two —
  // she chose the later of the two, *"and i want the rationale to be
  // explained and cited when its recommended"*. That explanation is the
  // sentence `invalidAdultDoseCard` already carries, which is why extending
  // the set is the whole change: both intervals have to be satisfied, so the
  // conjugate waits for whichever runs out last.
  'ADULT-PPSV23-AFTER-PCV13-SHORTER-MINIMUM',
]);

/**
 * The repeat an adult's invalid dose leaves owing, or null.
 *
 * Returns the date and products the RULES TABLE computed, plus which leg of
 * her two clocks set it, so the card can say whether its number is stated by
 * ACIP or read across from a neighbouring rule.
 */
function adultRepeatOwed(analysis, rawPcv, rawPpsv, ageMonths) {
  if (ageMonths < ADULT_SCHED_MIN_M) return null;
  const dated = (list) => (list ?? []).filter((d) => d?.date)
    .slice().sort((a, b) => a.date.localeCompare(b.date));
  const rows = [
    ...(analysis.pcv?.perDose ?? []).map((v, i) => ({ v, d: dated(rawPcv)[i], vaccine: 'PCV' })),
    ...(analysis.ppsv23?.perDose ?? []).map((v, i) => ({ v, d: dated(rawPpsv)[i], vaccine: 'PPSV23' })),
  ].filter((r) => r.d?.date).sort((a, b) => a.d.date.localeCompare(b.d.date));
  if (!rows.length) return null;
  const last = rows[rows.length - 1];
  // Only an invalid LAST dose leaves something owing (her "repaired" proviso),
  // and never a record problem — "a dose the patient never had".
  if (last.v.status !== 'invalid' || last.v.recordProblem || !last.v.repeatDueDate) return null;
  // ⚠️ DELIBERATELY NARROW, AND THE FIRST DRAFT WAS NOT. Applied to every
  // adult whose last dose is invalid, this moved 667 of 17,016 verdicts and
  // broke eleven citation guards — because it overrode cards that reason from
  // a RICHER history with a blunter rule. The clearest casualty: an
  // immunocompromised adult with PCV13 + two PPSV23 doses, the second given
  // too soon, lost her mm7401a1 "review again at age 50" card altogether and
  // was told to come back for a conjugate in a year. Her counting history owes
  // a conjugate at FIVE years, which is Ruling F's territory, and no ruling
  // said otherwise.
  //
  // So this fires only for the families the owner actually worked through, and
  // they are named by the rule that rejected the dose rather than inferred:
  //
  //   ADULT-PCV-AFTER-PPSV23                    her patients 1 and 2
  //   ADULT-PPSV23-AFTER-PCV15                  her patient 3
  //   ADULT-PPSV23-AFTER-PCV15-SHORTER-MINIMUM  her patient 4, the asplenic one
  //
  // Every other adult family keeps the card it had. `ADULT-PPSV23-AFTER-PCV13`
  // (402 patients) is the same clinical shape and is the previous handoff's
  // "clearest defect", but widening to it moves verdicts in a family she has
  // not been shown — her own 2026-10-18 rule sends that back to her. It is
  // flagged, not taken.
  if (!CARD_FOLLOWS_INVALID_DOSE.has(last.v.intervalRuleId)) return null;
  const alt = last.v.conjugateAlternative;
  return {
    dueDate: last.v.repeatDueDate,
    products: ADULT_OWED_AFTER_INVALID_DOSE,
    invalidDate: last.d.date,
    invalidVaccine: last.vaccine,
    invalidProduct: last.d.product || null,
    // `conjugateAlternative` is only attached by the one row that opts in, so
    // fall back to the leg the date implies.
    basis: alt?.basis ?? (last.vaccine === 'PPSV23' ? 'ppsv23ToConjugate' : 'conjugateToConjugate'),
  };
}

// ─────────────────────────────────────────────────────────────────────────
// C14 (2026-10-25) — `path`: the route this patient actually took.
//
// The owner asked for a map of the rules AND a way to see, for the patient on
// screen, which way the app went. The map is the Rulebook page; this is the
// other half.
//
// IT IS RECORDED WHERE THE DECISION IS MADE, never re-derived afterwards. A
// second reading of the same question is the shape of the worst bug this repo
// has had (the scheduler and the validator reading CDC's catch-up table
// separately), so `path` is pushed to at the branch itself and is a plain
// record of what happened — it decides nothing and nothing reads it back.
//
// Each step is { step, took, because } in plain words, and `because` may be
// null when the step speaks for itself.
function pathStep(step, took, because = null) {
  return { step, took, because };
}

/** Months the way a clinician says them. Shared with the Rulebook page's own
 *  helper in intent, but kept here so the engine owes the UI nothing. */
function ageWords(m) {
  if (m == null) return 'an age that was not given';
  // `am` is fractional when it comes from a date of birth, so floor it: a
  // clinician says "15 months", never "15.16 months".
  const w = Math.floor(m);
  if (w < 24) return `${w} month${w === 1 ? '' : 's'}`;
  const y = Math.floor(w / 12), r = w % 12;
  return r === 0 ? `${y} years` : `${y} years ${r} month${r === 1 ? '' : 's'}`;
}

/** The risk conditions as the group the rules actually turn on. */
function riskWords(riskIds) {
  if (!riskIds.length) return 'None ticked';
  const names = riskIds.map((id) => RISK_BY_ID[id]?.label ?? id);
  const group = hasIC(riskIds) ? 'an immunocompromising condition'
    : hasSpecial(riskIds) ? 'a cochlear implant or CSF leak'
    : 'a chronic condition';
  return `${names.join('; ')} — ${group}`;
}

/** What the engine made of the doses on the record: how many it counted, and
 *  how many it set aside. The REASON each one was set aside stays on the dose
 *  itself, where the clinician reads it; it is not repeated here.
 *
 *  2026-10-30: an EXTRA dose is validly given and NOT counted, so it is
 *  neither. Found by driving Ava's screen: her second PPSV23 read "it isn't
 *  counted" above a panel reading "2 of 2 PPSV23 doses counted". The old test
 *  (`status === 'valid'`) let every extra dose through — the infant's extra
 *  PCV, the adult's dose after a completed series, and P2's early PPSV23. */
function doseWords(pcvAnalysis, ppsvAnalysis) {
  const parts = [];
  for (const [name, a] of [['PCV', pcvAnalysis], ['PPSV23', ppsvAnalysis]]) {
    const all = a?.perDose ?? [];
    if (!all.length) continue;
    const extra = all.filter((d) => d.extraDose).length;
    const kept = all.filter((d) => !d.extraDose && (d.status === 'valid' || d.status === 'counted')).length;
    const set = all.length - kept - extra;
    const asides = [
      ...(extra ? [`${extra} an extra dose, not needed`] : []),
      ...(set ? [`${set} set aside`] : []),
    ];
    parts.push(`${kept} of ${all.length} ${name} dose${all.length === 1 ? '' : 's'} counted`
      + (asides.length ? ` — ${asides.join(', ')}, with the reason on the dose itself` : ''));
  }
  return parts.length ? parts.join('. ') : 'None on the record';
}

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
      // C14: deliberately NO `path` here. The transplant hard stop shows one
      // banner and nothing else on the page (owner decision 2026-10-16, frozen
      // byte-for-byte against MeningoVax), so the route is withheld at the
      // engine rather than left for a surface to remember not to render.
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

  // OWNER RULING 2026-10-24 — what an adult with an UNREPAIRED invalid dose is
  // owed, read off the walk's own verdicts.
  //
  // ⚠️ READ, NEVER RECOMPUTED. `repeatDueDate` is produced by
  // `doseIntervalRules.js`'s clocks and carried on the dose verdict; this
  // function only picks the right verdict and hands the date on. Computing a
  // second answer here is the exact shape of the P0 bug of 2026-10-23, where
  // the card and the chip each read CDC's table and disagreed.
  //
  // "UNREPAIRED" is her own proviso, from the 2026-10-23 ruling: "if a later
  // dose given helps correct the mistake in giving a vaccine early, this
  // should be noted and marked as complete if appropriate." So the invalid
  // dose only leaves something owing if it is the LAST dose on the record —
  // a properly spaced dose after it has already filled the gap, and the
  // counting history speaks for itself.
  const adultRepeat = adultRepeatOwed(analysis, rawPcv, rawPpsv, am);
  const pcv = summarizePcv(effectivePcv, am, today, dob, pcvAnalysis.anchor);
  const ppsv = {
    count: effectivePpsv.length,
    // C13 (2026-10-30): PPSV23 doses RECEIVED, an extra dose included — the
    // count the ADULT rows read ("PCV13 and 2 doses of PPSV23"). Never use it
    // for a child's own series; that is `count`.
    given: (ppsvAnalysis?.perDose ?? []).filter((d) => d.extraDose || d.status === 'valid' || d.status === 'counted').length,
    effective: effectivePpsv,
    // The most recent COUNTING PPSV23, mirroring `pcv.lastDate`. Added
    // 2026-10-25 for the at-risk catch-up card's 8 weeks, which CDC measures
    // from "the most recent dose" and not from the most recent PCV.
    //
    // Deliberately NOT `effective.find(...)`, which five call sites above use
    // for the FIRST PPSV23 because the 5-year revaccination clock runs from
    // dose 1. First and last are different questions; a child with two PPSV23
    // doses has them five years apart, so reading one for the other is a
    // five-year error.
    //
    // ⚠ THE DIFFERENCE IS NOW REACHABLE, and the trap this comment warned
    // about had already been sprung elsewhere. When the field was added its
    // one caller was the 24-71-month catch-up card, where a SECOND counting
    // PPSV23 could not exist by arithmetic — a first PPSV23 cannot count
    // before 24 months and a second needed >=5 years after it. ⚠ P2
    // (2026-10-30) ENDED THAT: an immunocompromised child's early second
    // PPSV23 now counts, so a 4-year-old can hold two (guard:
    // `regression-p2-2026-10-30-child-second-ppsv23`, "Noah" and "Maya"). But `anchorPneumo` was reading
    // `effective.find(...)` for the same question, and for a 6-18-year-old
    // with two counting PPSV23 doses that was a seven-year error (fixed
    // 2026-10-26; guard
    // `regression-2026-10-26-eight-weeks-runs-from-the-last-ppsv23`). Both
    // 8-week callers now read this field. The field keeps the name it earns:
    // a `lastDate` that returned the first dose is a trap for whoever calls
    // it next.
    lastDate: [...effectivePpsv].reverse().find((d) => d.date)?.date || null,
    // P2 (2026-10-30): a COUNTED PPSV23 that came inside the five years. Read
    // off validate.js's own verdict — never re-test the interval here, which
    // would be a second reading of one rule (the P0 bug's shape). Only an
    // immunocompromised child's dose can be both counted and early: a non-IC
    // child's becomes an extra dose and is not in `effective`.
    secondCameEarly: ppsvAnalysis.perDose.some((d) => d.effectiveDoseNum != null
      && d.earlyAdvisory && d.intervalRuleId === 'CHILD-PPSV23-AFTER-PPSV23'),
  };

  // ── Standard (age/history/risk) recommendations ──────────────────────
  //
  // C14: `path` is built HERE, at the branch, as each decision is taken.
  const path = [
    pathStep('Age', ageWords(am), dob ? 'worked out from the date of birth you entered' : 'from the age you entered'),
    pathStep('Risk conditions', riskWords(riskIds), null),
  ];
  let recs;
  if (am < M.m24) {
    // FINDING D (2026-10-17): the infant pathway gets the paediatric risk ids
    // too. `pedsRiskIds` strips adult-only ticks here for the same reason it
    // does below — a tick that does not apply to a child must not reach a
    // child's card, by any route.
    path.push(pathStep('Which rules apply', 'Babies and toddlers under 2', `under ${ageWords(M.m24)}`));
    recs = pcvInfant(am, pedsRiskIds(riskIds), pcv, today, dob);
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
      path.push(pathStep('Which rules apply', 'Children with a risk condition',
        `at least ${ageWords(M.m24)} and under ${ageWords(M.y18)}, with a risk condition that applies at this age`));
      recs = pcvRiskChild(am, pedsIds, pcv, ppsv, today);
    } else {
      path.push(pathStep('Which rules apply', 'Children with no risk condition',
        `at least ${ageWords(M.m24)} and under ${ageWords(M.y18)}`
        + (riskIds.length && !pedsIds.length ? ' — the condition ticked is one that only applies to adults' : '')));
      recs = pcvHealthyChild(am, pcv, ppsv, today);
    }
  } else {
    path.push(pathStep('Which rules apply', 'Adults',
      am < M.y50
        ? `${ageWords(M.y18)} and over but under ${ageWords(M.y50)}, so a vaccine is recommended only with a qualifying risk condition`
        : `${ageWords(M.y50)} and over, so a vaccine is recommended whatever the risk conditions`));
    recs = pcvAdult(am, riskIds, pcv, ppsv, today, dob, adultRepeat);
  }
  path.push(pathStep('Doses already given', doseWords(pcvAnalysis, ppsvAnalysis), null));

  // ── PCV21 geographic advisory ─────────────────────────────────────────
  const pcv21Geo = pcv21GeoNote(am, recs);

  // ── OWNER DECISION 2026-10-25: a rejected dose does not promise a dose
  //    nobody is asking for ───────────────────────────────────────────────
  //
  // The grey note under a dose rejected for TIMING ended with "the next dose
  // in this series can be given from <date> at the earliest." Swept over the
  // grid, that was being shown to **647 of the 814 children** whose PPSV23
  // was rejected, on screens whose every card said the child was finished or
  // needed nothing:
  //
  //   398  at risk, series complete, PCV20 in it   <- her Table 1 row exactly
  //   111  PCV20 in the series, "Not indicated"
  //   138  no PCV20, complete or not indicated
  //
  // Her ruling, with the document: *"Children aged 2–18 years with any risk
  // condition who completed a recommended PCV series before age 6 years:
  // Completed series includes >=1 dose of PCV20: No additional doses of any
  // pneumococcal vaccine are indicated"* — CDC/ACIP, "Use of 20-Valent
  // Pneumococcal Conjugate Vaccine Among U.S. Children", 22 September 2023,
  // Table 1 (`cdcPcv20Children2023Table1`). The cards already honoured it; the
  // note did not.
  //
  // ⚠️ THE TEST IS "IS ANYTHING OWED AT ALL", NOT "IS A DOSE OF THIS VACCINE
  // OWED", and the difference is deliberate. An adult whose PPSV23 was
  // rejected IS owed something — a conjugate, per the 2026-10-24/25 rulings —
  // so her clause stays and keeps agreeing with her card's date. Keying on the
  // stream instead would have stripped it from every one of those adults, two
  // commits after the owner ruled the two surfaces must agree.
  //
  // It is also not an age test. CLAUDE.md forbids one deciding whether a rule
  // bites, and none is needed: what makes these children different is that
  // nothing is owed, which `recs` states directly.
  //
  // `complete` and `not-indicated` are the only two statuses that ask for
  // nothing; `due`, `catchup`, `risk-based` and `shared-decision` all ask.
  const ASKS_FOR_NOTHING = new Set(['complete', 'not-indicated']);
  const nothingIsOwed = recs.length > 0 && recs.every((r) => ASKS_FOR_NOTHING.has(r.status));
  const withdrawForwardLook = (list) => (nothingIsOwed
    ? list.map((d) => (d.forwardLookingReason
      ? { ...d, reasons: d.reasons.map((x) => (x === d.forwardLookingReason ? d.withoutForwardLook : x)) }
      : d))
    : list);

  return {
    recs,
    pcv21Geo,
    perDose: {
      pcv: withdrawForwardLook(pcvAnalysis.perDose),
      ppsv23: withdrawForwardLook(ppsvAnalysis.perDose),
    },
    // P0 (2026-10-12): `orderedDoses[v][i]` is the dose `perDose[v][i]` was
    // computed for. A caller rendering a verdict beside its dose reads BOTH
    // from here; reading its own input array alongside `perDose` is what put
    // every verdict on the wrong row for a history typed newest-first.
    orderedDoses: { pcv: pcvAnalysis.doses, ppsv23: ppsvAnalysis.doses },
    path,
    meta: { ageMonths: am, dob, today, riskIds, pcvCount: pcv.count, ppsv23Count: ppsv.count },
  };
}
