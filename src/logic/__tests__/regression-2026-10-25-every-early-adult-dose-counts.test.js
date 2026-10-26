// 2026-10-25 — EVERY early ADULT dose counts. No adult dose is ever set aside
// for timing again.
//
// ── The owner's tables ───────────────────────────────────────────────────
//
// She supplied a three-row table of adult sequences — "ACIP-stated minimum",
// "Shortest interval with supporting data", "Practical cutoff for counting the
// dose" — and her bottom line:
//
//   * 8 weeks is a true adult minimum only for PPSV23 after a conjugate.
//   * For conjugate after conjugate, ACIP's own HSCT schedule supports
//     counting any dose given 4 weeks or more after the prior PCV.
//   * Under 4 weeks, no ACIP schedule spaces pneumococcal conjugate doses
//     that closely. An optional repeat (PCV20 or PCV21, at least 8 weeks
//     later) is reasonable, mainly for immunocompromised patients.
//
// Row by row, the "practical cutoff for counting the dose" column:
//
//   PCV    -> PPSV23   "8 weeks formally. Under 8 weeks: count it rather than
//                       repeat PPSV23 (expert opinion)"
//   PCV    -> PCV      "4 weeks. Count doses given 4 weeks or more apart.
//                       Under 4 weeks, there are no supporting data; repeat is
//                       optional"
//   PPSV23 -> PCV      "Count; response blunted"
//
// And, asked about the one sequence her table does not cover — a second PPSV23
// inside 5 years, which is the ONE adult interval with direct evidence behind
// it (rr7203a1: "immune responses were lower with repeat PPSV23 than with the
// initial vaccination for certain serotypes when the interval between PPSV23
// doses was <5 years") — she chose COUNT, NOTE THE SHORTFALL.
//
// ── What this REVERSES, deliberately ─────────────────────────────────────
//
// Her own ruling of the afternoon of 2026-10-24, on the 70-year-old below:
// "For a healthy adult, ACIP requires a PCV15 or PCV20 given after a PPSV23 to
// be >=1 year after the PPSV23, with no 8-week option. So the 19 Jun 2026
// PCV15 ... is invalid and needs to be repeated." Shown the same patient
// against her new table she chose to count the dose. The floor had been a
// floor twice and a recommendation once; this is the second relaxation and the
// one that generalises, so the row loses its floor rather than flipping again.
//
// ── Why the authority flips OWNER -> CDC on these rows ───────────────────
//
// Ruling F's reasoning of 2026-10-24, applied to the rest of the adult rows.
// As a FLOOR each row asserted something no source states — that an early dose
// stops counting — so it had to carry the owner's name. As a RECOMMENDATION it
// asserts only the interval, which CDC states in words. CDSI v4.64 sets
// absMinInt = 0 days for every adult pneumococcal interval, which is the
// machine-readable form of the same point.
//
// ── The invariant that outlives the five patients ────────────────────────
//
// NO ADULT DOSE IS EVER SET ASIDE FOR TIMING. The last test sweeps the whole
// grid for it, because that is the claim a future "tidy-up" would break
// without any of the five patients below noticing.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { buildCases } from '../../test-grid.js';
import { DOSE_INTERVAL_RULES } from '../doseIntervalRules.js';

const TODAY = '2026-10-25';
const pcv = (out) => out.orderedDoses.pcv.map((d, i) => ({ ...d, ...out.perDose.pcv[i] }));
const ppsv = (out) => out.orderedDoses.ppsv23.map((d, i) => ({ ...d, ...out.perDose.ppsv23[i] }));
// A floor exposes `reasons` + `detail`; a recommendation exposes `reasons`
// + `whys` (one entry per rule that had a rationale). Read both shapes, or
// an assertion about the rationale silently reads an empty string.
const text = (d) => [d.detail, ...(d.reasons ?? []), ...(d.whys ?? [])].filter(Boolean).join(' ');

// Her 70-year-old of 2026-10-24: PPSV23 11 Oct 2025, PCV15 19 Jun 2026.
// Eight months, short of the year. Until today the PCV15 was thrown out.
const seventy = {
  ageMonths: 840, today: TODAY, riskIds: [],
  pcvDoses: [{ product: 'PCV15', date: '2026-06-19' }],
  ppsv23Doses: [{ date: '2025-10-11' }],
};
// Her 60-year-old of the same day, the opposite order: PCV15 19 Jul 2026,
// PPSV23 11 Oct 2026 — twelve weeks, short of the recommended year but past
// the 8 weeks that is the one true adult minimum.
const sixty = {
  ageMonths: 720, today: TODAY, riskIds: [],
  pcvDoses: [{ product: 'PCV15', date: '2026-07-19' }],
  ppsv23Doses: [{ date: '2026-10-11' }],
};
// A second PPSV23 two years after the first.
const copd = {
  ageMonths: 816, today: TODAY, riskIds: ['chronic_lung'],
  pcvDoses: [{ product: 'PCV13', date: '2015-01-10' }],
  ppsv23Doses: [{ date: '2024-01-10' }, { date: '2026-01-10' }],
};
// Conjugate after conjugate, the two sides of her 4-week line.
const tooClose = {
  ageMonths: 816, today: TODAY, riskIds: ['chronic_lung'],
  pcvDoses: [{ product: 'PCV13', date: '2026-08-10' }, { product: 'PCV20', date: '2026-08-24' }],
  ppsv23Doses: [],
};
const farEnough = {
  ...tooClose,
  pcvDoses: [{ product: 'PCV13', date: '2026-07-10' }, { product: 'PCV20', date: '2026-08-24' }],
};

describe('an early adult dose counts', () => {
  it('counts her 70-year-old\'s PCV15 eight months after the PPSV23', () => {
    const dose = pcv(recommend(seventy))[0];
    expect(dose.doesNotCount).toBeFalsy();
    // The shortfall is still stated — counting it is not the same as silence.
    expect(text(dose)).toMatch(/1 year/);
    expect(text(dose)).toMatch(/8 months/);
  });

  it('counts her 60-year-old\'s PPSV23 twelve weeks after the PCV15', () => {
    const dose = ppsv(recommend(sixty))[0];
    expect(dose.doesNotCount).toBeFalsy();
    expect(text(dose)).toMatch(/1 year/);
  });

  it('never asks for a repeat PPSV23 — the remedy, if any, is a conjugate', () => {
    // Her table: "count it rather than repeat PPSV23 (expert opinion)". The
    // hyporesponsiveness evidence is the reason, so the words "repeat" and
    // "PPSV23" must not be offered together on this dose.
    const dose = ppsv(recommend(sixty))[0];
    expect(text(dose)).not.toMatch(/repeat (this |the )?(dose|PPSV23)/i);
    // And positively: the dose counts, so there is nothing outstanding to
    // describe. Asserting only the absence above would pass on the pre-fix
    // code too, whose rejection message happens not to use the word "repeat".
    expect(dose.doesNotCount).toBeFalsy();
    expect(dose.status).not.toBe('invalid');
  });

  it('counts a second PPSV23 two years after the first, and says responses are lower', () => {
    const dose = ppsv(recommend(copd))[1];
    expect(dose.doesNotCount).toBeFalsy();
    expect(text(dose)).toMatch(/5 years/);
    expect(text(dose)).toMatch(/lower/i);
  });

  it('never offers a third PPSV23 once two are on the record', () => {
    const labels = recommend(copd).recs.map((r) => r.doseLabel).join(' | ');
    expect(labels).not.toMatch(/PPSV23/);
  });
});

describe('conjugate after conjugate: her 4-week line', () => {
  it('offers an optional repeat when the gap is under 4 weeks', () => {
    const dose = pcv(recommend(tooClose))[1];
    expect(dose.doesNotCount).toBeFalsy();
    expect(text(dose)).toMatch(/4 weeks/);
    // "An optional repeat (PCV20 or PCV21, at least 8 weeks later) is
    // reasonable, mainly for immunocompromised patients."
    expect(text(dose)).toMatch(/optional/i);
    expect(text(dose)).toMatch(/8 weeks/);
  });

  it('offers no repeat at 4 weeks or more', () => {
    const dose = pcv(recommend(farEnough))[1];
    expect(dose.doesNotCount).toBeFalsy();
    expect(text(dose)).not.toMatch(/optional/i);
  });
});

describe('the invariant', () => {
  it('declares no adult floor in the rule table', () => {
    const floors = DOSE_INTERVAL_RULES
      .filter((r) => r.rulebook === 'adult' && r.enforcement === 'floor')
      .map((r) => r.id);
    expect(floors).toEqual([]);
  });

  it('sets no adult dose aside for timing anywhere on the grid', () => {
    const offenders = [];
    for (const { key, input } of buildCases()) {
      // ⚠️ A grid case is `{ key, input }` — the patient is INSIDE `input`,
      // and carries its own `today`. An earlier draft spread the case itself
      // and filtered on `c.ageMonths`, so it called the engine with no patient
      // at all and swept 0 adults while reporting success. Two blind-guard
      // faults in one test is why both are written down.
      const out = recommend(input);
      for (const d of [...pcv(out), ...ppsv(out)]) {
        // A dose may still fail on AGE (PCV21 under 18) or be a record
        // problem; this asserts only that no INTERVAL throws one out.
        //
        // ⚠️ The field is `intervalRuleId`. An earlier draft of this sweep read
        // `d.ruleId`, which does not exist — so it collected nothing and PASSED
        // against the six floors it was written to forbid. A sweep that cannot
        // fail is worse than no sweep, because it reads as proof.
        // Scoped to the ADULT rulebook, which is the claim. An adult patient
        // may carry doses given in CHILDHOOD, judged by the child rules — the
        // grid has 1,287 such CHILD-PCV-AFTER-PCV rejections and 264
        // CHILD-PPSV23-AFTER-PCV on patients now 19+, and those floors stay.
        // PCV7 is not a timing rejection either: it has no rule id at all.
        if (d.doesNotCount && d.intervalRuleId?.startsWith('ADULT-')) {
          offenders.push(`${key} ${d.intervalRuleId}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
