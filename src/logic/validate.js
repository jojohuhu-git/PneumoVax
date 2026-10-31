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
//   perDose — the verdict on each dose, in DATE order (NOT input order — the
//             walk sorts first, because a gap can only be measured from a
//             dose given earlier). Each { status, effectiveDoseNum,
//             reasons[], detail?, doesNotCount? } for display.
//   doses   — the doses themselves, in the SAME order as `perDose`. Anything
//             rendering a verdict beside its dose must read this, never the
//             caller's own input array: pairing `perDose` with input order by
//             index showed every verdict against the wrong dose whenever a
//             history was typed newest-first (P0, 2026-10-12).
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

import { daysBetween, todayISO, AVG_DAYS_PER_MONTH } from './dateUtils.js';
import { ageAtDoseMonths } from './patientAge.js';
import { floorAge, FLOOR_EPS, fmtDate } from './format.js';
import { productByKey, productLabel, PCV_MIN_AGE_M, PCV_MIN_AGE_DAYS, PPSV23_PRODUCT } from '../data/brands.js';
import { cite } from '../data/refs.js';
// S14-7: only the MINIMUM-AGE helpers are imported here. Every minimum
// INTERVAL — and every decision about whether a gap can void a dose — lives in
// doseIntervalRules.js, reached through the single call below. If you find
// yourself importing an interval constant into this file, the rule you are
// adding belongs in that table instead. `doseIntervalRules.test.js` has a
// drift guard that fails if one appears here.
import { ageMeetsMinimum, ageMeetsMinimumDays } from './intervals.js';
import { PCV21_MIN_AGE_M, ADULT_SCHED_MIN_M } from './scheduleConstants.js';
import { hasIC } from '../data/riskFactors.js';
import { evaluateDoseInterval } from './doseIntervalRules.js';
// P1-3 (2026-10-12): a row the clinician added and never typed in is not a
// dose. Dropped HERE, at the walk, so that no caller can count one by
// forgetting to filter — the UI sweeps them too, but only for tidiness.
import { dropBlankDoseRows } from './doseIdentity.js';

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

// P2-9 (2026-10-12): `fmtDays` and `fmtDayCount` used to live here and were
// DELETED. Coverage found them: both unreachable, and both duplicated
// verbatim in doseIntervalRules.js (its own fmtDays/fmtDayCount), which is
// where every interval message has been written since S14-7 moved the rules
// into one table. Two stranded copies of the wording that tells a clinician
// how long a gap was, in the one file this repo's rules say must own no
// interval logic at all. If you need to format an interval, reach for
// doseIntervalRules.js — do not re-add a local copy here.

function fmtMinAge(minAgeM) {
  if (minAgeM >= 12) {
    const y = minAgeM / 12;
    return `${y} year${y === 1 ? '' : 's'}`;
  }
  // Sub-2-month minimums (e.g. the 6-week PCV floor) read better in weeks.
  if (minAgeM < 2) {
    const w = Math.round((minAgeM * AVG_DAYS_PER_MONTH) / 7);
    return `${w} week${w === 1 ? '' : 's'}`;
  }
  return `${minAgeM} month${minAgeM === 1 ? '' : 's'}`;
}

// The same minimum worn as an adjective: "2 years" → "2-year", "6 weeks" →
// "6-week". Exists so a message can read "below the 2-year minimum age"
// without writing the number out a second time (queue P2-12).
function fmtMinAgeAdj(minAgeM) {
  return fmtMinAge(minAgeM).replace(/^(\d+) (\w+?)s?$/, '$1-$2');
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
// A RECORD PROBLEM: the entry itself is wrong, as opposed to a real dose that
// was given at the wrong time. Graded like any other invalid dose — it does not
// count — but it must NOT collect the walk's "repeat this dose only" advice.
// That advice is for a dose the patient actually received; when the problem is
// the typing, repeating a shot nobody had is nonsense, and the fix is to
// correct the record.
//
// S10-N2 (owner decision 2026-10-12: "copy what MeningoVax does"). Ported from
// MeningoVax's `recordProblemResult` (its P1-1 / G3 work), the RULE and the
// wording, not the code — PneumoVax has no `kind`-keyed chip vocabulary, so
// `recordProblem` here only has to be truthy and name which problem it is.
//
// This does NOT reopen W1: every other invalid reason (below the minimum age,
// wrong product for the age) is still a dose that WAS given and still keeps the
// repeat sentence. Only an impossible ENTRY is carved out.
function recordProblem(kind, reasons, detail) {
  return { ...invalid(reasons, detail), recordProblem: kind };
}

// P3-6: a dose dated before the patient was born is not an under-age dose, it
// is an impossible one — almost always a mistyped year on the dose or the date
// of birth. Saying "below the minimum age" sends the clinician looking for the
// wrong mistake, so this names the real one.
//
// Two ways to know, matching MeningoVax:
//   • a date of birth is recorded → compare the dates directly.
//   • years/months were typed instead → there is no birthday to compare
//     against, so the test is that the computed age at the dose is negative.
//     That is the most the app can honestly claim, and the wording says so.
//
// Measured, not assumed: with a date of birth, PneumoVax's `ageAtDoseFromDate`
// already returns a fractional negative for a dose dated even ONE day early,
// so today the direct comparison changes no verdict — deleting it fails no
// test. It is kept because it says what it means and cannot be knocked out by
// a future change to how age is rounded, which is the bug it guards in
// MeningoVax. Do not read it as live coverage.
function beforeBirth(dose, dob) {
  const because = dob
    ? `The date of birth recorded is ${fmtDate(dob)}.`
    : 'The age entered puts this date before the patient was born.';
  return recordProblem(
    'before-birth',
    ['This date is before the patient was born, so it is not counted. Check the date — a mistyped year is the usual cause. No repeat dose is needed on the strength of it: correct the date, or take the row out if it does not belong to this patient.'],
    `Recorded date: ${fmtDate(dose.date)}. ${because}`
  );
}

// True when `dose` is dated before the patient was born, by whichever of the
// two tests above the recorded information allows.
function isBeforeBirth(dose, ageAtDose, dob) {
  if (!dose?.date) return false;
  if (dob) return dose.date < dob;
  return ageAtDose !== null && ageAtDose < 0;
}

// A dose dated AFTER today. The history lists doses the patient has already
// received, so a future date is either a mistyped year or a scheduled
// appointment typed into the wrong place. Counting it would tell a clinician
// the patient is covered by a shot that is not in their arm — and could call a
// series complete on the strength of it.
//
// Ported from MeningoVax's G3 (owner decision 2026-10-12), the rule and the
// wording. `dose.date <= today` is deliberate: a dose given today counts.
function futureDated(dose, today) {
  if (!dose?.date || !today || dose.date <= today) return null;
  return recordProblem(
    'future',
    [`This date is in the future — today is ${fmtDate(today)}. A dose cannot have been given yet, so it is not counted. Check the date: if the year is a typo, correct it; if this is an appointment the patient has not attended yet, take it out of the record, which lists doses already given.`],
    `Recorded date: ${fmtDate(dose.date)}. Today: ${fmtDate(today)}.`
  );
}

// The same shot recorded on two rows (MeningoVax's G7, ported by owner decision
// 2026-10-12, then narrowed by a second owner decision the same day — see
// `sameDayDifferentBrandNote` below for why).
//
// Two doses of the same pneumococcal vaccine are never given on the same day,
// so a date that already sits on a COUNTED row of this stream, under the SAME
// product, means the row was typed twice — the commonest slip when a paper
// record is being copied in.
//
// The grading was already right: the second row did not count. The EXPLANATION
// was wrong. The interval rule got there first and said "Given 0 days after the
// previous dose — the minimum interval is 8 weeks", then offered a date the
// next dose was due — sending a clinician to look at spacing, with a due date
// in hand, for a problem that exists only in the typing.
//
// A row whose product is blank ("Unknown PCV product") counts as a match: a
// clinician copying a record who names the brand on one line and not on the
// other has written one dose twice, not two.
//
// Two things this deliberately does NOT catch, both of them real pneumococcal
// records:
//   • A PCV and a PPSV23 on one day. Ordinary co-administration. Safe because
//     `kept` is ONE stream's counted doses and the two streams are walked
//     separately — asserted, not assumed, in this rule's regression test.
//   • A row sharing a date with a row that did not itself count — a PCV7, or a
//     row already refused for being under age. Matching against `kept` rather
//     than every row walked is what makes that row the first REAL one on its
//     date rather than a duplicate of a dose the patient never effectively had.
//     Measured: 84 cases in the impossible-entry grid take exactly that path.
//
// Undated rows share no date and are never duplicates: two undated rows on a
// paper record with no dates are two real doses.
function duplicateEntry(dose, kept) {
  if (!dose?.date) return null;
  const twin = (kept ?? []).find((k) => k?.date === dose.date
    && (!k.product || !dose.product || k.product === dose.product));
  if (!twin) return null;

  const reasons = [
    `The same date is already recorded on an earlier row (${fmtDate(dose.date)}), so this looks like one dose entered twice. It is not counted. Two doses of the same pneumococcal vaccine are never given on the same day — if the patient really did receive another dose, correct its date; otherwise remove this row.`,
  ];
  if (!twin.product || !dose.product) {
    reasons.push('One of the two rows does not name a product, so this is most likely the same dose written down twice — once with the brand and once without.');
  }
  return recordProblem('duplicate', reasons, `Same date as a dose already recorded: ${fmtDate(dose.date)}.`);
}

// TWO DIFFERENT products on one day — a sentence, not a verdict.
//
// Owner decision, 2026-10-12, taken against a conflict the sweep gate caught.
// MeningoVax's G7 calls ANY same-date pair in a stream a row typed twice, and
// that is sound there: each of its streams holds ONE vaccine family, so a
// same-day pair can only be a double entry. PneumoVax's PCV stream holds five
// products, so a same-day pair might instead be a real — if pointless —
// co-administration, and S14-4C (2026-10-12) had already settled what to say
// about one: "Given at the same visit as the PCV20 dose, which completes the
// adult series on its own: this dose does not add to the series."
//
// Importing G7 whole would have overwritten that sentence for 792 of the
// 16,250 sweep patients. The owner chose BOTH: the verdict and its existing
// wording stand, and this sentence is ADDED to them. Nothing is reclassified
// and nothing is discarded — the clinician keeps the clinical answer and is
// also told to go and look at the record.
//
// It is appended at every push site in the walk rather than inside one branch,
// because the two same-day shapes reach the clinician down different paths and
// only one of them is S14-4C's:
//
//   adult, PCV20 + PCV21     the earlier dose completes the series, so the
//                            extra-dose branch grades it and S14-4C speaks.
//   child, PCV13 + PCV15     nothing is completed, so the INTERVAL rule speaks
//                            — "0 days after the previous dose… due on or after
//                            2024-04-22" — which is the more misleading of the
//                            two, and which S14-4C never reached.
//
// Worded over "pneumococcal vaccines" rather than "conjugates" because the
// walk is shared: PPSV23 has a single product today, so this cannot fire in
// that stream, but the sentence should not become false if one is ever added.
function sameDayDifferentBrandNote(dose, kept) {
  if (!dose?.date || !dose.product) return null;
  const twin = (kept ?? []).find((k) => k?.date === dose.date
    && k.product && k.product !== dose.product);
  if (!twin) return null;
  return `Two different pneumococcal vaccines are recorded on the same day (${productLabel(twin.product)} and ${productLabel(dose.product)}). They are not given together at one visit, so check the record — a mistyped date or a mistyped brand on one of the rows is the usual cause.`;
}

// ── The same two refusals, said in one line, for the history step ────────
//
// Owner decision, 2026-10-12. Typing 05/01/2030 into a dose row used to show
// nothing at all — no warning, "View Results" fully enabled — while the AGE
// step already stopped you dead on the identical slip ("That date of birth is
// in the future. Check the year"). The two date fields disagreed about the same
// mistake. The step now says so under the row as the date is typed, and the
// results card keeps its fuller explanation.
//
// WARN, do not trap: "View Results" stays enabled (owner decision). A clinician
// who means it can still see the rest of the record.
//
// This lives here, not in the component, because the component must not decide
// what an impossible entry IS — CLAUDE.md's rule, and the reason the PCV21
// licence check once got the blame for a date before birth. It calls the very
// same `futureDated` and `isBeforeBirth` the engine grades with, so only the
// WORDING is specific to the step, and the two wordings sit beside each other
// in one file so an edit to either is made looking at the other.
// `regression-history-step-warns-on-impossible-dates` asserts that the kind
// returned here equals the `recordProblem` the engine reports for the same row.
//
// Returns null when the row is fine (including an undated row — there is no
// date to be wrong), so the caller can render nothing.
export function dateEntryWarning(dose, { ageMonths, today, dob } = {}) {
  if (!dose?.date) return null;
  const ref = todayISO(today);
  if (futureDated(dose, ref)) {
    return {
      kind: 'future',
      text: `This date is in the future — today is ${fmtDate(ref)}. Check the year; a dose cannot have been given yet.`,
    };
  }
  const ageAtDose = ageAtDoseFromDate(dose, ageMonths, ref, dob);
  if (isBeforeBirth(dose, ageAtDose, dob)) {
    return {
      kind: 'before-birth',
      text: dob
        ? `This date is before the patient was born (${fmtDate(dob)}). Check the year.`
        : 'This date is before the patient was born, going by the age entered. Check the year.',
    };
  }
  return null;
}

// Every record problem, settled in ONE place for both vaccines before any
// vaccine-specific rule runs. Nothing here is vaccine-specific, and a second
// copy is how rules drift — the before-birth test used to sit inside each of
// the two validators, which is also how it ended up running AFTER the PCV21
// licensing check and blaming an impossible date on the patient's age.
//
// The future test runs first, copied from MeningoVax. Measured, not assumed:
// in PneumoVax that order cannot currently change any answer — swapping the two
// fails no test — because a date cannot be both after today and before a date
// of birth that is itself in the past. It would only start to matter if a date
// of birth in the FUTURE became reachable, which the app does not reject today
// (noted as a finding, not fixed here). Kept in MeningoVax's order so the two
// apps read the same; do not treat it as live coverage.
//
// Returns null when the row has no record problem, so the caller falls through
// to the real grading.
function recordProblemFor(dose, { ageMonths, today, dob, kept }) {
  const future = futureDated(dose, today);
  if (future) return future;
  const ageAtDose = dose?.date ? ageAtDoseFromDate(dose, ageMonths, today, dob) : null;
  if (isBeforeBirth(dose, ageAtDose, dob)) return beforeBirth(dose, dob);
  // Last of the three, matching MeningoVax. A row that is BOTH a duplicate and
  // dated impossibly reports the impossible date, which is the more useful
  // thing to say: correcting the year usually makes the duplication vanish too.
  return duplicateEntry(dose, kept);
}

// ── What to say about a dose the series did not need ─────────────────────
//
// S14-4C (2026-10-12, owner decision). TWO sentences, because the record says
// two different things, and written here once because both streams print them
// (S14-4 for PCV, S14-4B for PPSV23) and a second hand-typed copy would drift
// — the same reason doseChipLabel.js exists.
//
//   • Completing dose STRICTLY EARLIER → "given after the series was already
//     complete". True, and the wording S14-4/4B shipped.
//   • Completing dose on the SAME DATE → "given at the same visit as". Two
//     doses carrying one date: neither came after the other, and saying so
//     would be a false statement about the record. The clinician needs the
//     substance anyway — the conjugate finished the series by itself, so the
//     second dose added nothing — which is what this says instead.
//
// The PPSV23 sentence names PPSV23 because that is the dose a clinician was
// deciding about; the PCV sentence cannot (the judged dose and the completing
// dose are both conjugates) and stops at the shared clause.
function extraDoseSentence(completingDose, dose, vaccine) {
  const label = productLabel(completingDose.product);
  if (completingDose.date !== dose.date) {
    return `Given after the series was already complete (a ${label} dose already completes it): this dose does not extend the series.`;
  }
  const needed = vaccine === 'PPSV23' ? 'no PPSV23 was needed, and this dose' : 'this dose';
  return `Given at the same visit as the ${label} dose, which completes the adult series on its own: ${needed} does not add to the series.`;
}

// ── P6-3c (2026-10-12): which sentence a minimum-age verdict cites ───────
//
// `pedsMinAge` quotes CDC's child/adolescent schedule notes verbatim:
// "(minimum age: 6 weeks [PCV15], [PCV 20]; 2 years [PPSV23])". That sentence
// states exactly TWO numbers, and this is the rule that keeps the marker on
// claims it actually supports — which is the whole decision P6-3c was waiting
// on, since a citation on the wrong claim is the one failure mode citations.jsx
// calls worse than no citation at all.
//
//   • The 6-week pneumococcal conjugate floor. ONE constant shared by every PCV
//     in brands.js (`PCV_MIN_AGE_M`), which is why a PCV13 or PCV7 verdict
//     cites it too: the number being enforced IS the schedule's pneumococcal
//     conjugate minimum age, and CDC names the products currently on the
//     schedule rather than the discontinued ones. The clinician is shown the
//     sentence verbatim on hover and can see exactly that.
//   • PPSV23's 2 years, stated in the same parenthesis.
//
// NOT PCV21's 18 years — a different number from a different source (mm7336a3
// and the FDA label), which this sentence does not mention. That verdict cites
// nothing until someone wires its own source.
function minAgeCites(minAgeM) {
  return minAgeM === PCV_MIN_AGE_M ? [cite('pedsMinAge')] : undefined;
}
// The marker goes on only when a citation goes with it: one "[c]" per entry in
// `reasonCites`, or RecCard drops the orphan and the parity guard fails.
function withMarker(text, cites) {
  return cites ? `${text}[c]` : text;
}

// ── PCV21's second age ───────────────────────────────────────────────────
//
// N1 (OWNER DECISION 2026-10-16). PCV21 (Capvaxive) carries TWO ages a year
// apart, and until N1 the app only knew the lower one:
//
//   PCV21_MIN_AGE_M    216 (18y)  the FDA licence — the PRODUCT floor. Below
//                                 it a dose is invalid (validateOnePCV).
//   ADULT_SCHED_MIN_M  228 (19y)  where ACIP's recommendation begins, because
//                                 that is where the adult rulebook begins.
//
// Both from MMWR mm7336a3, read live 2026-10-16: FDA licensed it "for adults
// aged >=18 years"; ACIP recommended "PCV21 as an option for adults aged >=19
// years who are currently recommended to receive a dose of PCV".
//
// A dose in that one-year gap is validly licensed but ahead of the schedule.
// Measured before the fix: an 18-year-old's dose and a 19-year-old's dose were
// indistinguishable — green "Dose 1 of 1", `reasons: []`, in total silence.
// The owner ruled: COUNT it, SAY it was early, and say it does NOT need
// repeating.
//
// It is an advisory on a VALID result (S14-3's `advise`), never a status of
// its own, so nothing downstream that counts doses can mistake it for a
// dropped one — and the chip stays "Dose 1 of 1" per S14-2, which put timing
// in the sentence and not in the chip.
//
// Both numbers are read from the two constants. Typing either as a literal is
// how a sentence starts telling the clinician a number the engine no longer
// uses (S6-1, S15), and CLAUDE.md forbids collapsing these two in particular.
function adviseIfBeforeRecommendedAge(result, prod, ageAtDose, ageMonths) {
  if (!prod || prod.key !== 'PCV21') return result;
  // With a date, the age AT THE DOSE decides (S10-N1: the age today sent a
  // clinician to the wrong field). Without one, today's age is an UPPER BOUND
  // on the age at administration — so a patient who is still below the
  // recommended age cannot have been vaccinated at or above it, and the note
  // is certain even with no date. Above it, nothing can be known: stay quiet.
  const dated = ageAtDose != null;
  const age = dated ? ageAtDose : ageMonths;
  if (age >= ADULT_SCHED_MIN_M) return result;
  const licensed = fmtMinAge(PCV21_MIN_AGE_M);
  const recommended = fmtMinAge(ADULT_SCHED_MIN_M);
  const when = dated
    ? `This dose was given at ~${fmtAgeM(ageAtDose)}`
    : `The patient is currently ~${fmtAgeM(ageMonths)}, so this dose was given`;
  return advise(
    result,
    [`PCV21 (Capvaxive) is FDA-licensed from ${licensed}, but ACIP recommends it from ${recommended}. ${when} — before the recommended starting age. It counts and does not need repeating.`]
  );
}

// ── When repeating the dose is not the remedy ────────────────────────────
//
// 2026-10-26, from the owner's children's table: a PCV21 recorded for a child
// is "rejected correctly", but the wording "says 'repeat this dose' where it
// should name PCV20".
//
// The two sentences on the chip CONTRADICTED EACH OTHER. A 10-year-old given
// PCV21 read:
//
//   "PCV21 (Capvaxive) is licensed for adults >=18 years only. This dose was
//    given at ~10y 1m — it does not count."
//   "This dose does not count toward the series — repeat this dose only (do
//    not restart the series)."
//
// Repeating it means giving her another PCV21, which the first sentence has
// just said is not licensed for her. Every repeat would be rejected for the
// same reason, forever.
//
// This is NOT the W1 timing case. A dose rejected for TIMING was never
// missing, so it takes the "next dose is due" sentence; a dose rejected for
// the PRODUCT genuinely is missing — the child still needs a conjugate — but
// she needs a DIFFERENT one. So it is a third closing sentence, not either of
// the two that existed.
//
// ⚠ A FIELD, NOT STRING SURGERY. The closing sentence is chosen in
// `walk()` below, which already keys on `recordProblem` and `intervalRuleId`
// rather than matching text — "string surgery on a sentence built somewhere
// else is the kind of coupling that breaks silently when the wording
// changes", as the comment there puts it. This is the same shape.
//
// PCV20 is named because the owner's row names it. PCV15 is also licensed for
// children, and the four other rows of her table that say "the remedy is
// PCV20, not another dose of the same vaccine" are a separate, larger queue
// item (P3) that this does not build.
const REMEDY_PRODUCT = 'PCV20';
function remedyIsAnotherProduct(result, product = REMEDY_PRODUCT) {
  return { ...result, remedyProduct: product };
}

// OWNER DECISION 2026-10-29 — a conjugate thrown out on AGE names no product.
//
// Her words: "only recommend vaccines that are approved for their age", and
// then, shown Ayla (PCV15 three days before she turned 6 weeks), "either is
// fine here". CDC gives PCV15 and PCV20 the SAME minimum age — "(minimum age:
// 6 weeks [PCV15], [PCV 20]; 2 years [PPSV23])" — and names both for the
// series — "Administer a 4-dose PCV series (PCV15 or PCV20)" — with no
// preference stated on either page (both fetched live 2026-10-29). The dose
// failed on age, not on product, so nothing about her age prefers one.
//
// ⚠ THIS REVERSES the "always PCV20" answer given earlier the same day. That
// answer was asked with Mia, whose dose is rejected for TIMING and who
// therefore never sees a repeat-the-product sentence at all; the answer was
// then applied to a family she was never shown. PR #95 was closed unmerged.
// `remedyIsAnotherProduct` stays for a child's PCV21 — the one product that is
// barred at her age whatever the date, so repeating it would fail again.
//
// WHY THE MINIMUM AGE AND NOT A DATE. `stillTooYoung` is read here because the
// phrasing differs: a patient who has since passed the minimum needs no age
// clause, and quoting a floor she is already past reads as a bar. The chip
// names the AGE and never a date — per the owner ruling of 2026-10-24 the rec
// card is the only surface that states a due date, and Ayla's card says 26 Nov
// (four weeks after the dose she got, per Ruling D), which is LATER than her
// 6-week birthday. A date here would contradict it.
function repeatWithAnyApprovedProduct(result, minAgeM, stillTooYoung) {
  return { ...result, ageRemedy: { minAgeText: fmtMinAge(minAgeM), stillTooYoung } };
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
// `reasons` is a LIST since the owner's *"mention both gaps"* decision of
// 2026-10-24: a dose can miss more than one advised interval, and each unmet
// row contributes its own sentence. `intervalRuleId` still names the FIRST
// one, so nothing that records a single rule id had to change.
function advise(result, reasons, ruleId, whys = []) {
  return {
    ...result,
    earlyAdvisory: true,
    intervalRuleId: ruleId,
    reasons: [...(result.reasons ?? []), ...reasons],
    // OWNER REQUEST 2026-10-24: the rationale sits behind the chip's "Why
    // this" disclosure, as MeningoVax's rec notes already do, so the chip
    // itself stays one clinical line. Absent when no rule supplied one, and
    // `RecCard` renders no toggle then.
    ...(whys.length ? { whys: [...(result.whys ?? []), ...whys] } : {}),
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
    r.repeatDueDate = verdict.repeatDueDate;
    // ⚠️ FIELDS ARE COPIED ONE BY ONE HERE, so a new field on the floor
    // verdict is SILENTLY DROPPED until it is named. That is how the owner's
    // emphasised alternative came out missing on its first run, with no error
    // — the rule computed it and nothing carried it.
    r.conjugateAlternative = verdict.conjugateAlternative ?? null;
    return r;
  }
  return advise(result, verdict.reasons, verdict.ruleId, verdict.whys);
}

// ── Validate one PCV dose ────────────────────────────────────────────────
function validateOnePCV(dose, ageMonths, today, dob, prev, ctxParts) {
  const key = dose.product || '';
  const prod = productByKey(key); // null when unknown

  // PCV7 — never counts (ACIP / immunize.org). Recorded, acknowledged, excluded.
  //
  // P6-3c (2026-10-12): the sentence used to end "Per ACIP/immunize.org" and
  // stop there — naming a source the clinician had no way to reach. This is a
  // CLAUDE.md non-negotiable that sets aside a real vaccine a real patient
  // received, so of all the verdicts in this file it is the one that most owes
  // the reader its source. The marker sits on the clause it supports.
  if (prod && prod.key === 'PCV7') {
    return noncounting([
      'PCV7 (Prevnar 7) is not counted toward the pneumococcal series. Per ACIP/immunize.org[c], PCV7 doses are ignored when determining current pneumococcal needs — treat the patient as if PCV-naïve for these doses.',
      // A declared cross-reference (2026-10-17). The quote is written about
      // "an older teen or adult patient at increased risk", and this verdict
      // is applied to EVERY patient, including a healthy child — 108 of them
      // in the grid. That gap is deliberate and settled: OWNER DECISION
      // 2026-10-12, PCV7 never counts, for anyone, and the engine is not to be
      // narrowed to the citation's scope. Declaring it here keeps the known
      // gap visible instead of widening the source's `population` until the
      // sentence appears to say something it does not.
    ], [cite('immPCV7', {
      aboutAnotherGroup: 'immunize.org states the rule for an at-risk older teen or adult; the owner extended it to every patient (2026-10-12)',
    })]);
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
      return remedyIsAnotherProduct(invalid(
        [`PCV21 (Capvaxive) is licensed for adults ≥18 years only. This dose was given at ~${fmtAgeM(atDose)} — it does not count.`],
        `Age at administration: ~${fmtAgeM(atDose)}. PCV21 minimum age: 18 years.`
      ));
    }
    return remedyIsAnotherProduct(invalid(
      [`PCV21 (Capvaxive) is licensed for adults ≥18 years only. The patient is currently ~${fmtAgeM(ageMonths)} — this dose does not count.`],
      `PCV21 minimum age: 18 years. Current age (upper bound on age at administration): ~${fmtAgeM(ageMonths)}.`
    ));
  }

  // Min-age check.
  const minAgeM = prod?.minAgeM ?? PCV_MIN_AGE_M; // unknown product → permissive (ACIP 6wk)
  const ageCites = minAgeCites(minAgeM);
  if (!dose.date) {
    // Dateless: current age is an upper bound on age at administration.
    if (ageMonths < minAgeM) {
      // Dateless and below the minimum TODAY, so still too young by definition.
      return repeatWithAnyApprovedProduct(invalid(
        [withMarker(`Recorded without a date, but the patient is currently only ~${fmtAgeM(ageMonths)} — below the ${fmtMinAge(minAgeM)} minimum age for ${prod?.label || key || 'this product'}. A past dose cannot have been given later than today, so it could not have been given at a valid age. This dose does not count.`, ageCites)],
        `Current age: ~${fmtAgeM(ageMonths)}. Minimum: ${fmtMinAge(minAgeM)}.`,
        ageCites
      ), minAgeM, true);
    }
    return adviseIfBeforeRecommendedAge(
      unknown([
        withMarker(`No date recorded — cannot verify age or interval. Counted in the series (must have been given at ≥${fmtMinAge(minAgeM)} to be valid).`, ageCites),
      ], ageCites),
      prod, null, ageMonths
    );
  }

  const ageAtDose = ageAtDoseFromDate(dose, ageMonths, today, dob);
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
    // The dose was below the minimum WHEN GIVEN; whether the patient is still
    // below it today is a separate question, and the one the wording turns on.
    return repeatWithAnyApprovedProduct(invalid(
      [withMarker(`Given at ~${fmtAgeM(ageAtDose)} — below the ${fmtMinAge(minAgeM)} minimum age for ${prod?.label || key || 'this product'}.`, ageCites)],
      `Age at administration: ~${fmtAgeM(ageAtDose)}. Minimum: ${fmtMinAge(minAgeM)} (doses up to 4 days early still count, per CDC).`,
      ageCites
    ), minAgeM, ageMonths < minAgeM);
  }

  // Age is settled; now the dose's timing, against the one rule table.
  const result = adviseIfBeforeRecommendedAge(
    key ? valid() : unknown(['Product not recorded — counted as a generic PCV dose.']),
    prod, ageAtDose, ageMonths
  );
  const priorPcv = (ctxParts.priorPcv ?? []).filter((d) => d.date && d.date <= dose.date);
  return applyIntervalRules(result, {
    vaccine: 'PCV',
    product: key,
    doseDate: dose.date,
    ageAtDose,
    prev,
    priorPcv,
    priorPpsv23: (ctxParts.priorPpsv23 ?? []).filter((d) => d.date && d.date <= dose.date),
    riskIds: ctxParts.riskIds ?? [],
    // Two FACTS about this patient, added 2026-10-23 for CDC's Catch-up Table 2
    // — which keys the PCV interval on the dose number as well as the two ages.
    // They are built here because this is where every other ctx fact is built
    // (`ageAtDose` above is the same kind of thing); the RULE still lives in the
    // table, and this file still owns no interval logic. If you find yourself
    // writing a number or a comparison against one here, it belongs there.
    //
    // `doseNumber` is this dose's position among the doses that COUNT, which is
    // how a catch-up table counts them: `ctxParts.priorPcv` is validate.js's
    // `kept` list, so a PCV7 and a dose already rejected for spacing are both
    // absent, and the dose after a rejected one takes the rejected one's number.
    doseNumber: priorPcv.length + 1,
    anyPriorDoseBefore12: priorPcv.some((d) => {
      const a = ageAtDoseFromDate(d, ageMonths, today, dob);
      return a != null && a < 12;
    }),
  });
}

// ── Validate one PPSV23 dose ─────────────────────────────────────────────
function validateOnePPSV23(dose, ageMonths, today, dob, prev, ctxParts) {
  // queue P2-12: the minimum age lives in the product catalogue, where every
  // other product's does. It used to be stated here a second time, as a bare
  // `24`, with "2 years" typed by hand into five of the messages below — so
  // the app could have compared against one number and told the clinician
  // another. Every sentence here is now built from this one value.
  const minAgeM = PPSV23_PRODUCT.minAgeM;
  const minAgeNoun = fmtMinAge(minAgeM);      // "2 years"
  const minAgeAdj = fmtMinAgeAdj(minAgeM);    // "2-year"
  // P6-3c: the 2 years is the second of the two numbers `pedsMinAge` quotes
  // ("2 years [PPSV23]"), so every PPSV23 minimum-age verdict cites it — no
  // product test needed here, unlike the PCV side where PCV21 carries a
  // different number from a different source.
  const ageCites = [cite('pedsMinAge')];
  if (!dose.date) {
    if (ageMonths < minAgeM) {
      return invalid(
        [`Recorded without a date, but the patient is currently only ~${fmtAgeM(ageMonths)} — below the ${minAgeAdj} minimum age for PPSV23[c]. This dose does not count.`],
        `Current age: ~${fmtAgeM(ageMonths)}. Minimum: ${minAgeNoun}.`,
        ageCites
      );
    }
    return unknown([`No date recorded — counted (must have been given at ≥${minAgeNoun} to be valid)[c].`], ageCites);
  }
  const ageAtDose = ageAtDoseFromDate(dose, ageMonths, today, dob);
  // CDC's 4-day grace — PPSV23's floor is in CALENDAR years, so the grace is
  // applied by asking whether the dose would have cleared it 4 days later.
  if (!ageMeetsMinimum(ageAtDose, minAgeM, { doseDate: dose.date, ageMonths, today, dob })) {
    return invalid(
      [`Given at ~${fmtAgeM(ageAtDose)} — below the ${minAgeAdj} minimum age for PPSV23[c].`],
      `Age at administration: ~${fmtAgeM(ageAtDose)}. Minimum: ${minAgeNoun} (doses up to 4 days early still count, per CDC).`,
      ageCites
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
    doses: [],         // the doses themselves, same order as `perDose` (P0)
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
  // P0 (2026-10-12): the dose is recorded here, at the single entry point
  // that also produces its verdict, so `st.doses[i]` is BY CONSTRUCTION the
  // dose `st.perDose[i]` was computed for. The UI used to hold its own copy
  // of the dose list — the raw input array — and pair the two by index; the
  // walk sorts into date order, so a history typed newest-first showed every
  // verdict against the wrong dose. There is now one ordering in the app and
  // the component does not own it.
  st.doses.push(dose);
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
    // Two different products on one day. A SENTENCE added to whatever verdict
    // this dose gets, never a verdict of its own (owner decision, 2026-10-12)
    // — computed here, once, and appended at every push below, because the
    // shapes it covers are graded down three different branches. `addNote` is
    // the only way it reaches a dose: a hand-typed second copy in one branch is
    // exactly the drift this file keeps warning about.
    const sameDayNote = sameDayDifferentBrandNote(dose, kept);
    // The two halves of the timing-rejection sentence. See the split below.
    const DOES_NOT_COUNT_LEAD = 'This dose does not count toward the series — given too soon after the dose it is measured from.';
    const nextDoseClause = (r) => `the next dose in this series can be given from ${fmtDate(r.repeatDueDate ?? r.earliestValidDate)} at the earliest.`;
    const addNote = (entry) => (sameDayNote
      ? { ...entry, reasons: [...(entry.reasons ?? []), sameDayNote] }
      : entry);
    // A record problem — an impossible ENTRY — is settled before any
    // vaccine-specific rule runs: there is no dose to GRADE when the date
    // itself is wrong, whatever the schedule says.
    const result = recordProblemFor(dose, { ageMonths, today, dob, kept })
      || (vaccine === 'PCV'
        ? validateOnePCV(dose, ageMonths, today, dob, prev, ctxParts)
        : validateOnePPSV23(dose, ageMonths, today, dob, prev, ctxParts));

    if (result.status === 'invalid') {
      // W1 (owner-approved wording, 2026-10-11): a dose rejected only for
      // TIMING (`intervalRuleId` — it came from doseIntervalRules.js) was
      // never missing, so "repeat this dose" is wrong advice for it — there
      // is nothing to repeat, the next dose is simply due once the interval
      // has elapsed. Every other invalid reason (below minimum age, wrong
      // product for age, dated before birth) IS a missing dose, and keeps
      // the repeat sentence, which is correct for those.
      //
      // S10-N2: a RECORD PROBLEM (the entry itself is impossible — see
      // `recordProblem` above) takes NEITHER sentence. Its own wording already
      // says it does not count and says what to do instead, and both of the
      // sentences below would be advice about a dose the patient never had.
      const closingSentence = result.recordProblem
        ? null
        : result.intervalRuleId
          // RULING D: measured from the dose actually given. This used to print
          // `earliestValidDate`, which is when THIS dose would have been valid
          // — an earlier date, and one the rec card already contradicted.
          //
          // OWNER RULING 2026-10-24 — and it names that date as the EARLIEST,
          // never as the date the dose is DUE. "Just the routine date next
          // dose is due with a comment on the earliest date it could be
          // given": the routine date is the rec card's job (it is the only
          // place that knows C10-2's routine age and spacing), so this chip
          // stops competing with it. The old "is due on or after 2026-11-05"
          // sat under a header reading "eligible Dec 7, 2026" and above a note
          // reading "can be given from 2026-11-09" — three dates for one dose.
          // The wording now echoes that note deliberately, and the date behind
          // it is the same ungraced minimum.
          // ── SPLIT IN TWO, 2026-10-25 ────────────────────────────────
          //
          // The first half is about the dose already given and is always
          // true. The second looks FORWARD, and for 647 of the 814 children
          // with a mistimed PPSV23 it pointed at a dose the app was not
          // asking for at all — a 5-year-old with asplenia whose PCV20 series
          // covers her, or a healthy 12-year-old whose only card reads "Not
          // indicated", each told "the next dose in this series can be given
          // from ..." with a date.
          //
          // Whether another dose is owed is a RECOMMENDATION question, and
          // this file cannot see the cards. So the clause is emitted here and
          // WITHDRAWN in `recommend.js`, which has both. It is handed over as
          // its own field rather than matched by text — string surgery on a
          // sentence built somewhere else is the kind of coupling that breaks
          // silently when the wording changes.
          ? `${DOES_NOT_COUNT_LEAD} It is not repeated; ${nextDoseClause(result)}`
          // 2026-10-26 — the product, not the timing, is what is wrong, so
          // repeating THIS dose would be rejected again for the same reason.
          // See `remedyIsAnotherProduct` above.
          // ⚠ NOT `DOES_NOT_COUNT_LEAD`, which carries the TIMING clause
          // "given too soon after the dose it is measured from". Nothing is
          // wrong with this dose's timing.
          : result.remedyProduct
            ? `This dose does not count toward the series — give a dose of ${result.remedyProduct} instead (do not restart the series).`
            // OWNER DECISION 2026-10-29 — see `repeatWithAnyApprovedProduct`.
            // The dose failed on AGE, so the product is not what was wrong and
            // CDC's own choice between the conjugates is left standing. A
            // patient still below the floor is told where the floor is; one
            // who has passed it is not shown a bar she has already cleared.
            : result.ageRemedy
              ? (result.ageRemedy.stillTooYoung
                ? `This dose does not count toward the series — a further dose can be given from the ${result.ageRemedy.minAgeText} minimum age at the earliest, and any PCV approved for that age may be used (do not restart the series).`
                : 'This dose does not count toward the series — give a further dose when due; any PCV approved for the patient\'s age may be used (do not restart the series).')
              : 'This dose does not count toward the series — repeat this dose only (do not restart the series).';
      // OWNER RULING 2026-10-24 — the second sentence she asked for on a
      // mistimed SECOND PPSV23, emphasised, giving the conjugate option its
      // own date and its own reason. Her words: "bold the alternative option
      // that a PCV20/21 could be considered 1 year later and summarize the
      // following reasoning and citation."
      //
      // Both numbers are hers and both are stated: the 5 years that governs a
      // repeat PPSV23, and the 1 year that governs any conjugate after a
      // PPSV23. ACIP is named in words because a dose chip carries no numbered
      // citations — the same way the chips already say "per CDC".
      //
      // The date is `result.conjugateAlternative.dueDate`, computed by the
      // rules table's own clocks. Never recompute it here; this file owns no
      // interval logic.
      const alt = result.recordProblem ? null : result.conjugateAlternative;
      const alternativeSentence = alt
        ? `**A repeat PPSV23 should wait at least 5 years after this dose, because ACIP requires at least 5 years between PPSV23 doses. Alternatively, 1 dose of ${alt.owedProducts.join(' or ')} may be considered from ${fmtDate(alt.dueDate)} — at least 1 year after this dose — because ACIP schedules any conjugate at least 1 year after the last PPSV23.**`
        : null;
      perDose.push(addNote({
        ...result,
        effectiveDoseNum: null,
        doesNotCount: true,
        // The handover to `recommend.js`: the exact sentence to swap out, and
        // the shorter one to put in its place when no card asks for a further
        // dose. The LEAD always survives — the dose still does not count, and
        // it is still not repeated; only the forward-looking date goes. Both
        // null unless the split above produced them, so nothing else can be
        // swapped by accident.
        forwardLookingReason: result.recordProblem || !result.intervalRuleId ? null : closingSentence,
        withoutForwardLook: result.recordProblem || !result.intervalRuleId ? null : `${DOES_NOT_COUNT_LEAD} It is not repeated.`,
        reasons: [...result.reasons, closingSentence, alternativeSentence].filter(Boolean),
      }));
      // RULING D (2026-10-23) — a mistimed dose anchors the next one, because
      // CDC repeats it from where it was given. A RECORD PROBLEM does not, for
      // the same reason the sentences above are withheld from it: it is "a
      // dose the patient never had". A date in the future has not happened and
      // a date before birth never did, so there is nothing for an interval to
      // run from.
      //
      // Without this test the recommendation reads out of a dose nobody gave:
      // a 12-month-old with a PCV20 typed as 2027-10-23 was advised to return
      // on 2027-12-18, on the same screen as a chip telling the clinician the
      // date is in the future and to correct it. 813 rows of the
      // record-problem corpus.
      if (!result.recordProblem) anchorOn(dose);
      return;
    }
    if (result.status === 'noncounting') {
      // PCV7 — recorded but not added to the effective list.
      perDose.push(addNote({ ...result, effectiveDoseNum: null, doesNotCount: true }));
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
    //
    // S14-4B (2026-10-12): the SAME rule for a PPSV23 dose. This branch used
    // to open with `vaccine === 'PCV'`, so the mirror-image record said
    // nothing: an adult's PPSV23 given years after a completing PCV20 was
    // labelled "series dose 1" with no comment, reading identically to a
    // PPSV23 that had actually COMPLETED a PCV15 series. Same premise, same
    // citation — `pcvAdult`'s complete-by-product branch says in so many
    // words "no PPSV23 and no further PCV needed" (ref
    // `adultPcv20or21Complete`), which is what `completesSeries` has always
    // meant. Owner decision 2026-10-12: mirror the PCV sentence exactly.
    //
    // One deliberate limit on the PPSV23 side, in CLINICAL_SPEC.md §K:
    //   • NO undated mirror. An undated PPSV23 alongside a PCV20 is
    //     overwhelmingly an old dose whose date was forgotten and which was
    //     given BEFORE the conjugate; the PCV side's `extraDoseUnverified`
    //     question would be wrong more often than right here.
    //
    // S14-4C (2026-10-12, owner decision): the PPSV23 side's OTHER limit —
    // "the completing dose must be STRICTLY EARLIER" — is gone. It was there
    // because the sentence below opened "Given AFTER the series was already
    // complete", which is false of two doses carrying one date. That reasoning
    // protected the wording and abandoned the verdict: a same-day PPSV23 fell
    // through to `ADULT-PPSV23-AFTER-PCV-CATCH-ALL` and read "CDC advises at
    // least 1 year… this dose still counts", which tells a clinician to fix a
    // spacing problem that is not the problem — no PPSV23 follows a PCV20 at
    // ANY interval. 108 of the 16,250 grid patients.
    //
    // It was also an asymmetry, not a principle: the PCV arm below has always
    // used `kept`, which by walk order already holds a SAME-DAY completing
    // dose (ANCHOR-1's tie-break steps PCV before PPSV23 on equal dates), so a
    // PCV21 recorded the same day as a PCV20 was already an extra dose — and
    // was already saying "after" about it. Both streams now get a second
    // sentence instead (see `extraDoseSentence`).
    const ageAtDoseForExtra = dose.date
      ? ageAtDoseFromDate(dose, ageMonths, today, dob)
      : ageMonths;
    const isAdultDose = ageAtDoseForExtra != null
      && ageAtDoseForExtra >= ADULT_SCHED_MIN_M;
    // S14-4C's bound. A PPSV23 that an EARLIER PCV15 already owed is the dose
    // that COMPLETES that series (brands.js `requiresPPSV23`). When a PCV20
    // and that PPSV23 land at one visit, either one finishes the job, and
    // which of the two to call surplus is arbitrary — so the app calls
    // neither, and counts both, exactly as it does today. Only same-day needs
    // the guard: once the completing conjugate is strictly earlier, the series
    // really was finished before this PPSV23, whatever an older PCV15 once
    // owed.
    const sameDayPpsv23WasOwed = vaccine === 'PPSV23' && !!dose.date
      && crossStream.some((d) => d.date && d.date < dose.date
        && productByKey(d.product)?.requiresPPSV23);
    const priorCompletingDose = !isAdultDose
      ? null
      : vaccine === 'PCV'
        // Own stream. The walk has only ever put EARLIER-OR-SAME-DAY doses in
        // `kept`, so no date test is needed — and must not be added, or the
        // two-undated-doses case below stops being reachable.
        ? kept.find((d) => productByKey(d.product)?.completesSeries)
        // Other stream. `crossStream` is whatever the caller handed over on
        // the `analyzeHistory` path, which can include LATER doses, so the
        // date test is explicit here rather than inherited from walk order.
        : dose.date
          ? crossStream.find((d) => d.date && d.date <= dose.date
            && productByKey(d.product)?.completesSeries
            && !(d.date === dose.date && sameDayPpsv23WasOwed))
          : null;
    if (priorCompletingDose) {
      // PCV only, by construction: the PPSV23 arm above requires a date.
      const undatedExtra = !dose.date;
      // Strip the early-advisory flag/sentence if validateOnePCV or
      // validateOnePPSV23 attached one — "still counts" would contradict
      // "does not extend the series".
      const { earlyAdvisory, intervalRuleId, reasons: resultReasons, ...rest } = result;
      const reasons = earlyAdvisory ? resultReasons.slice(0, -1) : resultReasons;
      perDose.push(addNote({
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
            extraDoseSentence(priorCompletingDose, dose, vaccine),
          ],
      }));
      // Validly given, with a real date — worth anchoring the next dose's gap
      // check, same as an invalid dose does.
      anchorOn(dose);
      return;
    }

    // P2 (2026-10-30, OWNER RULING on "Ava"): a CHILD with no immunocompromising
    // condition is owed ONE PPSV23. CDC's non-immunocompromising list never
    // mentions a second (child-adolescent-notes.html, read live 2026-10-30), so
    // a second one given inside five years is an EXTRA dose — her words for
    // it, from the extra infant PCV dose of 2026-10-23: not needed, not
    // harmful, not counted, nothing to repeat. Before P2 the dose was thrown
    // out as "too soon" and the chip pointed at another one five years later,
    // beside a card that said the series was complete.
    //
    // THREE LIMITS, each deliberate:
    //   • an EARLIER PPSV23 must have COUNTED — guaranteed twice over: the
    //     row only measures from a counted dose (`anchorCounted: true`; a
    //     repeat of a rejected one is `CHILD-PPSV23-AFTER-INVALID-PPSV23`, a
    //     floor), and `kept.length` is checked here as well, so a child whose
    //     first PPSV23 was thrown out never has her only real dose called
    //     extra.
    //   • only when `CHILD-PPSV23-AFTER-PPSV23` fired — more than CDC's 4-day
    //     grace early, which is exactly the dose that used to be THROWN OUT
    //     (the row keeps the grace: owner decision 2026-10-30). A non-IC
    //     child's on-time second PPSV23 is just as unneeded, but she ruled on
    //     the early one; widening is her call (§C-P2).
    //   • `hasIC` is the engine's one IC test. An immunocompromised child's
    //     early second dose COUNTS instead (her ruling of 2026-10-29), which the
    //     row's own recommendation note already says.
    //
    // AND A THIRD (2026-10-30, found by the suite's sickle-cell patient: PPSV23
    // at 2, 9 and 11). An immunocompromised child with TWO counted PPSV23 doses
    // is finished with PPSV23 — CDC's child notes print "dose 2 PPSV23" three
    // times and no third anywhere. Her ruling counts an early SECOND dose; an
    // early third is the same extra dose, with its own reason.
    const icChild = hasIC(riskIds);
    if (vaccine === 'PPSV23' && !isAdultDose && kept.length >= (icChild ? 2 : 1)
      && result.earlyAdvisory && result.intervalRuleId === 'CHILD-PPSV23-AFTER-PPSV23') {
      // Drop the row's own "Counted; never give a third" sentence and its
      // "Why this" — both say the dose counts, which is no longer true here.
      // The row's are the LAST of each, as in the adult block above.
      const { earlyAdvisory, intervalRuleId, reasons: rowReasons, whys: rowWhys, ...rest } = result;
      const otherWhys = (rowWhys ?? []).slice(0, -1);
      perDose.push(addNote({
        ...rest,
        ...(otherWhys.length ? { whys: otherWhys } : {}),
        effectiveDoseNum: null,
        extraDose: true,
        reasons: [
          ...rowReasons.slice(0, -1),
          icChild
            ? `Not needed: two PPSV23 doses have already been given (${fmtDate(kept[0].date)} and ${fmtDate(kept[1].date)}), and CDC never gives a third. This dose isn’t harmful, it isn’t counted, and nothing needs to be repeated.`
            : `Not needed: CDC gives a second PPSV23 only to a child with an immunocompromising condition; the first was given on ${fmtDate(kept[0].date)}. This dose isn’t harmful, it isn’t counted, and nothing needs to be repeated.`,
        ],
      }));
      anchorOn(dose);
      return;
    }

    st.effectiveCount++;
    perDose.push(addNote({ ...result, effectiveDoseNum: st.effectiveCount }));
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
  return {
    perDose: st.perDose, effective: st.kept, doses: st.doses, anchor: st.prev,
  };
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

  // `anchor` is the stream's last DATED dose — the one a same-stream interval
  // is measured from. It is NOT the last dose that counted: a dose rejected
  // for spacing still anchors, because CDC repeats it from where it was given
  // ("The repeat dose should be spaced after the invalid dose by the
  // recommended minimum interval"), while PCV7 never anchors. That difference
  // is written down once, in `freshStreamState`, and both the validator and
  // the recommendation engine now read THIS value rather than each deciding
  // for itself — RULING D (owner, 2026-10-23). The P0 bug fixed earlier the
  // same day was two independent readings of one table; a second definition
  // of the anchor would be the same shape of mistake.
  return {
    pcv: {
      perDose: pcv.perDose, effective: pcv.kept, doses: pcv.doses, anchor: pcv.prev,
    },
    ppsv23: {
      perDose: ppsv23.perDose, effective: ppsv23.kept, doses: ppsv23.doses, anchor: ppsv23.prev,
    },
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
  const filtered = sortDosesChronologically(dropBlankDoseRows((doses ?? []).filter(Boolean)));
  if (filtered.length === 0) return { perDose: [], effective: [], doses: [], anchor: null };
  // The OTHER stream's doses, which the cross-stream rule rows measure from.
  const otherStream = sortDosesChronologically(
    dropBlankDoseRows(((vaccine === 'PPSV23' ? opts.pcvDoses : opts.ppsv23Doses) ?? []).filter(Boolean))
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
 * @returns {{pcv: {perDose: Array, effective: Array, doses: Array},
 *            ppsv23: {perDose: Array, effective: Array, doses: Array}}}
 *   `doses[i]` is the dose `perDose[i]` was computed for, in date order.
 */
export function analyzeBoth({ pcvDoses, ppsv23Doses, ageMonths, today, dob, riskIds }) {
  const ref = todayISO(today);
  return walkBothStreams({
    pcvDoses: sortDosesChronologically(dropBlankDoseRows((pcvDoses ?? []).filter(Boolean))),
    ppsv23Doses: sortDosesChronologically(dropBlankDoseRows((ppsv23Doses ?? []).filter(Boolean))),
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

// DELETED (owner decision 2026-10-12): `validateHistory(vaccine, doses, ...)`.
// A one-line wrapper around `analyzeHistory(...).perDose`, exported and called
// by nothing — not the app, not the scripts, not the tests.
//
// It was removed for what it INVITED, not for being unused. It took one vaccine
// stream and had no risk-factor argument at all, while carrying the most
// obvious name in this file. Anyone looking for "the function that checks a
// dose history" found it first and got answers that silently ignore the other
// vaccine and every risk condition — no error, just a confident wrong answer.
//
// The door to use is `analyzeBoth()`, which sees both streams and the risk
// list. Do not re-add a one-stream convenience wrapper here.
