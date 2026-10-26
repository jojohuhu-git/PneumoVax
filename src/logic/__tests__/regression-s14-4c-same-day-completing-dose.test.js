// S14-4C (2026-10-12, owner decision) — a dose given at the SAME VISIT as the
// dose that completed the series.
//
// ── What was wrong ───────────────────────────────────────────────────────
//
// S14-4 (PCV stream) and S14-4B (PPSV23 stream) both say "this dose was not
// needed" for a dose recorded against an already-complete adult series. S14-4B
// deliberately required the completing dose to be DATED AND STRICTLY EARLIER,
// because its sentence opens "Given AFTER the series was already complete",
// which is false of two doses given at one visit. The consequence was never
// decided, only deferred:
//
//   • An adult's PPSV23 given the SAME DAY as a completing PCV20/PCV21 fell
//     through to `ADULT-PPSV23-AFTER-PCV-CATCH-ALL` and read "CDC advises at
//     least 1 year between a conjugate dose and PPSV23. This dose still
//     counts." Wrong in substance, not just in tone: no PPSV23 is recommended
//     after a PCV20 at any interval, so "advises at least 1 year" tells a
//     clinician to fix a spacing problem that is not the problem. Measured on
//     the 16,250-patient grid: 108 cases.
//
//   • The PCV stream, meanwhile, ALREADY treated a same-day completing pair as
//     an extra dose — a PCV21 recorded the same day as a PCV20 reads "Extra
//     dose — more than this series needs" — and used the word "after" to do
//     it. So the same-day exclusion was an asymmetry between the two streams,
//     not a principle, and the "after" falseness the exclusion existed to
//     avoid had already shipped on the other stream.
//
// ── The decision ─────────────────────────────────────────────────────────
//
// Owner, 2026-10-12: fix BOTH surfaces, chip and sentence together. A same-day
// dose joins the same extra-dose class a dose one day later already gets (one
// day cannot move a verdict from "Dose 1 of 1" to "Extra dose"), and the
// sentence says "at the same visit as", never "after".
//
// ── The control that bounds it ───────────────────────────────────────────
//
// A PPSV23 that an EARLIER PCV15 already owed is the dose that completes that
// series. When a PCV20 and that PPSV23 land at one visit, either one finishes
// the job and the app calls neither surplus — it counts both, as it does
// today. Without this guard the naive same-day fix relabels a legitimately
// owed PPSV23 "not needed", which is a clinical error, not a wording one.
//
// ⚠ THE SWEEP DOES NOT COVER THAT CONTROL. Proved by mutation: deleting the
// guard fails one assertion here and one in the UI test, and leaves
// `sweep-verdict-corpus.test.js` fully GREEN — `src/test-grid.js` has no
// history shape pairing an earlier PCV15 with a same-day PCV20 + PPSV23
// (`GRID_PCV_HISTORIES` has `[PCV15, PCV20]` at one visit, but no PPSV23
// offset lines up with it). So the only thing standing between this clinical
// error and a clinician is the hand-written control below. Candidate grid
// addition, flagged 2026-10-12 rather than taken here, because a new PCV
// history multiplies into every age and risk profile and moves the corpus's
// 16,250 — which many docs and tests quote.
//
// Mutation record (2026-10-12), both run against the real engine:
//   • same-day detection reverted to strictly-earlier (`<=` → `<`):
//     7/14 fail here, 4/6 in the UI test, 1/12 in the sweep, 1/9 in S14-4B's.
//   • the owed-PPSV23 guard deleted: 1/14 here, 1/6 in the UI test, 0 in the
//     sweep.
import { describe, it, expect } from 'vitest';
import { analyzeBoth } from '../validate.js';
import { doseChipLabel } from '../../components/doseChipLabel.js';

const TODAY = '2026-10-12';
const DOB_70 = '1956-03-10';
const AGE_70 = 70 * 12;
const VISIT = '2025-03-10';

function adult({ pcvDoses = [], ppsv23Doses = [], riskIds = [], ageMonths = AGE_70, dob = DOB_70 }) {
  return analyzeBoth({ pcvDoses, ppsv23Doses, ageMonths, today: TODAY, dob, riskIds });
}

const text = (v) => (v.reasons ?? []).join(' ');

describe('S14-4C — a PPSV23 given at the same visit as a completing PCV20/PCV21', () => {
  for (const product of ['PCV20', 'PCV21']) {
    it(`${product} + PPSV23 at one visit: the PPSV23 is an extra dose, not a mistimed one`, () => {
      const r = adult({
        pcvDoses: [{ product, date: VISIT }],
        ppsv23Doses: [{ product: 'PPSV23', date: VISIT }],
      });
      const v = r.ppsv23.perDose[0];

      expect(v.extraDose, 'a PPSV23 co-administered with a dose that completes the series '
        + 'on its own added nothing to the series').toBe(true);
      expect(v.effectiveDoseNum).toBeNull();
      // The whole point: the 1-year advisory is GONE, because spacing was
      // never the problem.
      expect(v.earlyAdvisory).toBeUndefined();
      expect(v.intervalRuleId).toBeUndefined();
      expect(text(v)).not.toMatch(/at least 1 year/);
      expect(text(v)).not.toMatch(/still counts/);
    });

    it(`${product} + PPSV23 at one visit: the sentence says "same visit", never "after"`, () => {
      const r = adult({
        pcvDoses: [{ product, date: VISIT }],
        ppsv23Doses: [{ product: 'PPSV23', date: VISIT }],
      });
      const t = text(r.ppsv23.perDose[0]);

      expect(t).toMatch(/given at the same visit as the/i);
      expect(t).toMatch(/does not add to the series/);
      // "Given after the series was already complete" is a false statement
      // about a record in which both doses carry the same date. This is the
      // exact claim S14-4B refused to make, and it must stay unmade.
      expect(t, 'a same-day dose was not given "after" anything')
        .not.toMatch(/after the series was already complete/);
    });

    it(`${product} + PPSV23 at one visit: the CHIP agrees with the sentence`, () => {
      const r = adult({
        pcvDoses: [{ product, date: VISIT }],
        ppsv23Doses: [{ product: 'PPSV23', date: VISIT }],
      });
      // The second surface. A note reading "this dose does not add to the
      // series" beside a chip reading "Dose 1 of 1" is the single-surface fix
      // CLAUDE.md forbids.
      expect(doseChipLabel(r.ppsv23.perDose[0], 1)).toBe('Extra dose — more than this series needs');
    });
  }

  it('a second PPSV23 at the same visit as a completing PCV20 is no longer silent', () => {
    // This shape reached NO rule at all: the 5-year PPSV23→PPSV23 row was met
    // (10 years), which blocks the catch-all, and S14-4B could not see a
    // same-day completing dose. So it read "Dose 2" with an empty reasons
    // array — the silent shape S14-7 exists to remove. It is not in the
    // verdict grid either (no grid PPSV23 history pairs an old dose with one
    // 365 days ago), which is why nothing caught it.
    const r = adult({
      pcvDoses: [{ product: 'PCV20', date: VISIT }],
      ppsv23Doses: [{ product: 'PPSV23', date: '2015-03-10' }, { product: 'PPSV23', date: VISIT }],
    });
    const second = r.ppsv23.perDose[1];

    expect(second.extraDose).toBe(true);
    expect(second.reasons.length, 'a dose the series did not need must say so').toBeGreaterThan(0);
    expect(text(second)).toMatch(/given at the same visit as the/i);
  });
});

describe('S14-4C — the PCV stream stops saying "after" about a same-day dose', () => {
  it('a PCV21 recorded the same day as a PCV20 reads "same visit", not "after"', () => {
    const r = adult({
      pcvDoses: [{ product: 'PCV20', date: VISIT }, { product: 'PCV21', date: VISIT }],
    });
    const v = r.pcv.perDose[1];

    expect(v.extraDose, 'unchanged — the PCV stream already classed this as an extra dose')
      .toBe(true);
    expect(text(v)).toMatch(/given at the same visit as the/i);
    expect(text(v), 'two doses with the same date: neither came "after" the other')
      .not.toMatch(/after the series was already complete/);
  });

  it('a PCV21 recorded a year AFTER a PCV20 still says "after" — unchanged', () => {
    const r = adult({
      pcvDoses: [{ product: 'PCV20', date: '2024-03-10' }, { product: 'PCV21', date: VISIT }],
    });
    expect(text(r.pcv.perDose[1])).toMatch(/after the series was already complete/);
  });
});

describe('S14-4C — the controls that bound it', () => {
  it('CONTROL: a PPSV23 owed by an EARLIER PCV15 still counts when a PCV20 lands the same day', () => {
    // 2020 PCV15 → a PPSV23 was owed from 2021. In 2025 the clinician gives
    // both a PCV20 and that PPSV23. Either dose finishes the series, so the
    // app calls neither one surplus. Relabelling the PPSV23 "not needed" here
    // would be wrong about the clinical record, not merely about wording.
    const r = adult({
      pcvDoses: [{ product: 'PCV15', date: '2020-03-10' }, { product: 'PCV20', date: VISIT }],
      ppsv23Doses: [{ product: 'PPSV23', date: VISIT }],
    });
    const v = r.ppsv23.perDose[0];

    expect(v.extraDose).toBeUndefined();
    expect(v.effectiveDoseNum).toBe(1);
    expect(v.reasons ?? [], 'unchanged: this PPSV23 completed the PCV15 series').toEqual([]);
  });

  it('CONTROL: a PPSV23 a year after a completing PCV20 keeps S14-4B\'s wording', () => {
    const r = adult({
      pcvDoses: [{ product: 'PCV20', date: '2024-03-10' }],
      ppsv23Doses: [{ product: 'PPSV23', date: VISIT }],
    });
    const v = r.ppsv23.perDose[0];

    expect(v.extraDose).toBe(true);
    expect(text(v)).toMatch(/after the series was already complete/);
    expect(text(v)).not.toMatch(/same visit/);
  });

  it('CONTROL: a same-day PPSV23 after an UNKNOWN-product PCV keeps the 1-year advisory', () => {
    // 216 of the 324 grid cases that reach ADULT-PPSV23-AFTER-PCV-CATCH-ALL
    // are this shape, not the completing-product one. An unnamed product
    // cannot be said to complete the series, so the generic sentence is the
    // right one and the catch-all keeps its job.
    const r = adult({
      pcvDoses: [{ product: '', date: VISIT }],
      ppsv23Doses: [{ product: 'PPSV23', date: VISIT }],
    });
    const v = r.ppsv23.perDose[0];

    expect(v.extraDose).toBeUndefined();
    expect(v.intervalRuleId).toBe('ADULT-PPSV23-AFTER-PCV-CATCH-ALL');
    expect(text(v)).toMatch(/at least 1 year/);
  });

  it('CONTROL: a same-day PPSV23 after a PCV15 is still voided by the PCV15 floor', () => {
    const r = adult({
      pcvDoses: [{ product: 'PCV15', date: VISIT }],
      ppsv23Doses: [{ product: 'PPSV23', date: VISIT }],
    });
    const v = r.ppsv23.perDose[0];

    // ⚠️ 2026-10-25: counted, not voided. S14-4C's claim is about `extraDose`
    // — a PPSV23 beside a PCV20/PCV21 that completes the series on its own is
    // an EXTRA dose — and a PCV15 does not complete a series, so this control
    // must still show no `extraDose`. That is the part being guarded.
    expect(v.status).toBe('valid');
    expect(v.intervalRuleId).toBe('ADULT-PPSV23-AFTER-PCV15');
    expect(v.extraDose).toBeUndefined();
  });

  it('CONTROL: a CHILD\'s same-day PCV20 + PPSV23 is untouched', () => {
    // `completesSeries` means "no PPSV23 follow-up needed" for an ADULT. For a
    // child a PCV20 can be one dose of four, so S14-4/4B/4C are adults-only
    // and this must not change.
    const r = analyzeBoth({
      pcvDoses: [{ product: 'PCV20', date: '2025-03-10' }],
      ppsv23Doses: [{ product: 'PPSV23', date: '2025-03-10' }],
      ageMonths: 10 * 12,
      today: TODAY,
      dob: '2015-03-10',
      riskIds: ['asplenia'],
    });
    expect(r.ppsv23.perDose[0].extraDose).toBeUndefined();
  });
});
