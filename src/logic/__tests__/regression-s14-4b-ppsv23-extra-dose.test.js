// S14-4B (2026-10-12) — the PPSV23 half of S14-4.
//
// S14-4 taught the walk that an ADULT **PCV** dose recorded after the series
// was already complete by product is an extra dose. It never taught the same
// thing to the PPSV23 stream: `stepStream`'s extra-dose branch opened with
// `vaccine === 'PCV'`, so the mirror-image record said nothing at all.
//
// Reproduced before the fix (synthetic, today = 2026-10-11, 40y, no risks):
// PCV `[PCV20 2012-01-01, PCV15 2018-01-01]`, PPSV23 `[2012-01-01,
// 2018-03-01]`. The second PCV dose read "Given after the series was already
// complete (a PCV20 (Prevnar 20) dose already completes it): this dose does
// not extend the series." The second PPSV23 dose was labelled **series dose
// 2**, status valid, with **no comment at all**.
//
// Worse: these two histories produced byte-identical per-dose output —
//   PCV20 2012 → PPSV23 2018   (the PPSV23 was never needed; PCV20 completes
//                               the adult series on its own)
//   PCV15 2012 → PPSV23 2018   (the PPSV23 is the dose that COMPLETED it)
// — so the app could not tell a clinician apart a PPSV23 that finished the job
// from one that added nothing.
//
// Owner decision (2026-10-12): mirror the PCV sentence exactly — stop
// numbering such a dose as a series dose, and say the same sentence. The
// clinical premise is already settled and cited: an adult series containing
// PCV20 or PCV21 is complete, "no PPSV23 and no further PCV needed"
// (recommend.js `pcvAdult`, ref `adultPcv20or21Complete`); brands.js marks
// both products `completesSeries: true`, whose documented meaning is exactly
// "no PPSV23 follow-up needed". No new clinical rule is introduced here.
//
// DATED DOSES ONLY, and ADULTS ONLY — see CLINICAL_SPEC.md §K for both
// reasons.
import { describe, it, expect } from 'vitest';
import { analyzeBoth } from '../validate.js';

const DOB = '1986-01-01';
const TODAY = '2026-10-11';
const AM = 489; // ~40y 9m

describe('S14-4B — a PPSV23 recorded after the series already completed', () => {
  it('PCV20, then a PPSV23 years later: the PPSV23 is an extra dose, not series dose 1', () => {
    const r = analyzeBoth({
      pcvDoses: [{ date: '2012-01-01', product: 'PCV20' }],
      ppsv23Doses: [{ date: '2018-03-01' }],
      ageMonths: AM, today: TODAY, dob: DOB, riskIds: [],
    });

    const extra = r.ppsv23.perDose[0];
    expect(extra.extraDose).toBe(true);
    expect(extra.effectiveDoseNum).toBeNull();
    expect(extra.status).not.toBe('invalid');
    expect(extra.earlyAdvisory).toBeFalsy();
    expect(extra.reasons.join(' ')).toMatch(/already complete/i);
    expect(extra.reasons.join(' ')).not.toMatch(/still counts/);
    // Not struck through — it was validly given.
    expect(extra.status).toBe('valid');
    // And it does not join the effective series.
    expect(r.ppsv23.effective).toHaveLength(0);
  });

  it('names the product that completed the series, as the PCV sentence does', () => {
    const r = analyzeBoth({
      pcvDoses: [{ date: '2012-01-01', product: 'PCV21' }],
      ppsv23Doses: [{ date: '2018-03-01' }],
      ageMonths: AM, today: TODAY, dob: DOB, riskIds: [],
    });
    expect(r.ppsv23.perDose[0].reasons.join(' ')).toMatch(/PCV21/);
  });

  it('CONTROL — a PPSV23 that COMPLETED the series (after PCV15) is not an extra dose', () => {
    const r = analyzeBoth({
      pcvDoses: [{ date: '2012-01-01', product: 'PCV15' }],
      ppsv23Doses: [{ date: '2018-03-01' }],
      ageMonths: AM, today: TODAY, dob: DOB, riskIds: [],
    });
    expect(r.ppsv23.perDose[0].extraDose).toBeFalsy();
    expect(r.ppsv23.perDose[0].effectiveDoseNum).toBe(1);
    expect(r.ppsv23.effective).toHaveLength(1);
  });

  it('SAME DAY is not "after" — a PCV20 and a PPSV23 at one visit is co-administration', () => {
    // The series was not already complete when this PPSV23 was given; it was
    // completed at the same visit. "Given after the series was already
    // complete" would be a false statement about the record.
    const r = analyzeBoth({
      pcvDoses: [{ date: '2018-03-01', product: 'PCV20' }],
      ppsv23Doses: [{ date: '2018-03-01' }],
      ageMonths: AM, today: TODAY, dob: DOB, riskIds: [],
    });
    expect(r.ppsv23.perDose[0].extraDose).toBeFalsy();
  });

  it('a PPSV23 given BEFORE the completing PCV dose is not an extra dose', () => {
    const r = analyzeBoth({
      pcvDoses: [{ date: '2018-03-01', product: 'PCV20' }],
      ppsv23Doses: [{ date: '2012-01-01' }],
      ageMonths: AM, today: TODAY, dob: DOB, riskIds: [],
    });
    expect(r.ppsv23.perDose[0].extraDose).toBeFalsy();
    expect(r.ppsv23.perDose[0].effectiveDoseNum).toBe(1);
  });

  it('an UNDATED PPSV23 is left alone — it is far more often an old dose given first', () => {
    // Deliberately NOT mirrored from the PCV side's `extraDoseUnverified`.
    // An undated PPSV23 alongside a PCV20 is overwhelmingly an old PPSV23
    // whose date was forgotten and which was given BEFORE the conjugate —
    // the opposite of an extra dose. The app cannot tell, and asking "was
    // this an extra dose?" would be wrong more often than right.
    const r = analyzeBoth({
      pcvDoses: [{ date: '2012-01-01', product: 'PCV20' }],
      ppsv23Doses: [{}],
      ageMonths: AM, today: TODAY, dob: DOB, riskIds: [],
    });
    expect(r.ppsv23.perDose[0].extraDose).toBeFalsy();
  });

  it('does NOT apply to children — a PCV20 does not cap an at-risk child\'s PPSV23', () => {
    // Same reason S14-4 is adults-only: for a child, `completesSeries` does
    // not mean the whole pneumococcal series is done outright.
    const r = analyzeBoth({
      pcvDoses: [{ date: '2024-02-01', product: 'PCV20' }],
      ppsv23Doses: [{ date: '2026-02-01' }],
      ageMonths: 60, today: TODAY, dob: '2021-10-01', riskIds: ['asplenia'],
    });
    expect(r.ppsv23.perDose[0].extraDose).toBeFalsy();
  });

  it('a PPSV23 that is otherwise invalid stays invalid — invalid wins over extra', () => {
    // Under the 2-year minimum age for PPSV23.
    const r = analyzeBoth({
      pcvDoses: [{ date: '2025-01-01', product: 'PCV20' }],
      ppsv23Doses: [{ date: '2026-01-01' }],
      ageMonths: 18, today: TODAY, dob: '2025-04-01', riskIds: ['asplenia'],
    });
    expect(r.ppsv23.perDose[0].status).toBe('invalid');
    expect(r.ppsv23.perDose[0].extraDose).toBeFalsy();
  });

  it('the two histories that used to be identical now read differently', () => {
    const notNeeded = analyzeBoth({
      pcvDoses: [{ date: '2012-01-01', product: 'PCV20' }],
      ppsv23Doses: [{ date: '2018-03-01' }],
      ageMonths: AM, today: TODAY, dob: DOB, riskIds: [],
    });
    const completedIt = analyzeBoth({
      pcvDoses: [{ date: '2012-01-01', product: 'PCV15' }],
      ppsv23Doses: [{ date: '2018-03-01' }],
      ageMonths: AM, today: TODAY, dob: DOB, riskIds: [],
    });
    expect(notNeeded.ppsv23.perDose[0].reasons)
      .not.toEqual(completedIt.ppsv23.perDose[0].reasons);
  });
});
