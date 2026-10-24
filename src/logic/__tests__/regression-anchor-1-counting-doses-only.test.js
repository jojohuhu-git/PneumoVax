// ANCHOR-1 (owner decision 2026-10-11) — a gap is measured from the dose that
// COUNTED. A dose that was rejected does not become a new starting point.
//
// The owner's reasoning, in her words: the 70-year-old's rejected second
// PPSV23 "is rejected not because it is too soon but because it was
// unnecessary", and an unnecessary dose cannot reset a clock.
//
// The mechanism that broke this (recommend.js, pre-ANCHOR-1): the PCV walk was
// handed `rawPpsv` — the PPSV23 stream INCLUDING doses that did not count —
// while the PPSV23 walk was handed `pcvAnalysis.effective`, the counting PCV
// doses only. So a voided PPSV23 could void a later PCV dose, but not the
// other way round. Both adult rows that measure a conjugate dose from a
// PPSV23 — `ADULT-PCV-AFTER-PPSV23` (1 year) and
// `ADULT-PCV20-21-5Y-AFTER-PPSV23` (5 years) — anchored on the raw list.
//
// The five cases below are the owner's acceptance set, recorded in
// docs/archive/handoff-2026-10-11-anchoring-decided-and-reordered-queue.md.
// Two must change (A, D); three must NOT (H, B, G). H is the control that
// makes this a narrow fix and not a loosening: a genuine 2-month
// PPSV23 → PCV20 gap, with no rejected dose anywhere in it, is still
// rejected. Keeping H red is the whole reason the owner declined the cheaper
// "downgrade the two rules to recommendations" option.
//
// NOTE on the floors themselves: every adult floor here is an OWNER CLINICAL
// DETERMINATION dated 2026-10-11, never ACIP's or CDC's — see
// CLINICAL_SPEC.md §K. ANCHOR-1 changes only what a gap is measured FROM. No
// interval is shortened and no CDC-stated interval is loosened.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';

const TODAY = '2026-10-11';
const Y = (y) => y * 12;

// The verdict on one recorded dose, as the engine hands it to the UI.
function verdictsFor(input) {
  const out = recommend({ today: TODAY, ...input });
  return {
    pcv: out.perDose.pcv,
    ppsv23: out.perDose.ppsv23,
    recs: out.recs,
    recText: out.recs.map((r) => `${r.vaccine}:${r.status} — ${r.doseLabel}`).join(' || '),
  };
}

describe('ANCHOR-1 Case A — a PCV20 behind someone else\'s early PPSV23', () => {
  // PPSV23 2015-01-01 counts. PPSV23 2018-01-01 is rejected: only 3 years
  // after the first, short of the 5-year minimum between PPSV23 doses. The
  // PCV20 of 2018-06-01 was then measured from the REJECTED 2018 dose
  // (1 year → earliest 2019-01-01) and rejected too. Measured from the dose
  // that counted, the clock ran from Jan 2015, so the earliest valid PCV was
  // Jan 2016 and the June 2018 dose counts.
  const CASE_A = {
    ageMonths: Y(70),
    riskIds: [],
    pcvDoses: [{ product: 'PCV20', date: '2018-06-01' }],
    ppsv23Doses: [{ product: 'PPSV23', date: '2015-01-01' }, { product: 'PPSV23', date: '2018-01-01' }],
  };

  it('counts the PCV20 — it is no longer measured from the PPSV23 that did not count', () => {
    const v = verdictsFor(CASE_A);
    expect(v.pcv[0].status).toBe('valid');
    expect(v.pcv[0].doesNotCount).toBeFalsy();
    expect(v.pcv[0].effectiveDoseNum).toBe(1);
  });

  it('still rejects the early second PPSV23 — that verdict was always right', () => {
    const v = verdictsFor(CASE_A);
    expect(v.ppsv23[0].status).toBe('valid');
    expect(v.ppsv23[1].status).toBe('invalid');
    expect(v.ppsv23[1].intervalRuleId).toBe('ADULT-PPSV23-AFTER-PPSV23');
  });

  it('reads as a complete series, not as a PCV still due', () => {
    const v = verdictsFor(CASE_A);
    expect(v.recs.some((r) => r.status === 'complete')).toBe(true);
    expect(v.recText).not.toMatch(/≥1 year after PPSV23/);
  });
});

describe('ANCHOR-1 Case D — the same error one row along (PCV13 + PPSV23, 5 years)', () => {
  // PCV13 2010 and PPSV23 2012 both count. PPSV23 2014 is rejected (2 years
  // after the 2012 dose). The PCV20 of 2018 was measured from the rejected
  // 2014 dose — 5 years → earliest 2019 — instead of from the 2012 dose that
  // counted, whose 5 years were up in 2017.
  const CASE_D = {
    ageMonths: Y(70),
    riskIds: [],
    pcvDoses: [{ product: 'PCV13', date: '2010-01-01' }, { product: 'PCV20', date: '2018-01-01' }],
    ppsv23Doses: [{ product: 'PPSV23', date: '2012-01-01' }, { product: 'PPSV23', date: '2014-01-01' }],
  };

  it('counts the PCV20', () => {
    const v = verdictsFor(CASE_D);
    expect(v.pcv[0].status).toBe('valid');
    expect(v.pcv[1].status).toBe('valid');
    expect(v.pcv[1].effectiveDoseNum).toBe(2);
  });

  it('reads as a complete series, not as a PCV20/PCV21 still due at 5 years', () => {
    const v = verdictsFor(CASE_D);
    expect(v.recs.some((r) => r.status === 'complete')).toBe(true);
    expect(v.recText).not.toMatch(/≥5 years/);
  });
});

describe('ANCHOR-1 Case H — the control the owner later withdrew', () => {
  // ⚠️ READ THIS BEFORE TRUSTING THE NAME. Case H was the owner's reason for
  // declining the cheaper 2026-10-11 fix: nothing in this history was
  // rejected — a PPSV23 that counts, then a PCV20 two months later — so the
  // 1-year floor, measured from a dose that COUNTED, still bit. The comment
  // here used to read: "If this case ever goes green, the fix has stopped
  // being narrow and has become a loosening of the floor itself."
  //
  // On 2026-10-24 the owner was shown case H again, by name, together with
  // the 132 patients her family-2 ruling moves, and ruled that it takes the
  // same shape as the rest: complete, with a note that the dose came early
  // and an alternative conjugate offered at >=1 year after the PPSV23. Her
  // reason is that no document names ANY minimum for a conjugate after a
  // PPSV23, so a cut-off at two months rather than eight would be a number
  // the app invented.
  //
  // So this case IS now green, deliberately, and it is no longer a control
  // for ANCHOR-1. What ANCHOR-1 itself proved is untouched and still asserted
  // in the four cases around it: a gap is measured from the dose that
  // COUNTED, never from a rejected one. That is a question about the ANCHOR;
  // case H has become a question about the CONSEQUENCE.
  // See regression-2026-10-24-family-2-early-conjugate-after-ppsv23.test.js.
  const CASE_H = {
    ageMonths: Y(70),
    riskIds: [],
    pcvDoses: [{ product: 'PCV20', date: '2018-03-01' }],
    ppsv23Doses: [{ product: 'PPSV23', date: '2018-01-01' }],
  };

  it('still measures the PCV20 from the PPSV23 that counted', () => {
    // ANCHOR-1's own claim, and the half that did NOT change: the rule that
    // speaks for this dose is still the one anchored on the counting PPSV23.
    const v = verdictsFor(CASE_H);
    expect(v.ppsv23[0].status).toBe('valid');
    expect(v.pcv[0].intervalRuleId).toBe('ADULT-PCV-AFTER-PPSV23');
  });

  it('counts that PCV20 now, and shows the series complete (owner, 2026-10-24)', () => {
    const v = verdictsFor(CASE_H);
    expect(v.pcv[0].status).toBe('valid');
    expect(v.recText).not.toMatch(/≥1 year after PPSV23/);
    expect(v.recText).toMatch(/Complete/);
  });
});

describe('ANCHOR-1 Case B — no child verdict moves', () => {
  // Child with asplenia: PCV13 Jan 1 counts, PCV13 Feb 20 is rejected (50
  // days, short of the 8-week minimum), PPSV23 Mar 5. The PPSV23 is measured
  // from the PCV13 that COUNTED — 63 days from Jan 1, which clears 8 weeks —
  // and already was, because no paediatric row measures a gap from a PPSV23
  // at all. Asserted so a future change to the cross-stream handoff cannot
  // move a child's verdict unnoticed.
  const CASE_B = {
    ageMonths: 72,
    riskIds: ['asplenia'],
    pcvDoses: [{ product: 'PCV13', date: '2026-01-01' }, { product: 'PCV13', date: '2026-02-20' }],
    ppsv23Doses: [{ product: 'PPSV23', date: '2026-03-05' }],
  };

  it('counts the PPSV23, measured from the PCV13 that counted', () => {
    const v = verdictsFor(CASE_B);
    expect(v.pcv[0].status).toBe('valid');
    expect(v.pcv[1].status).toBe('invalid');
    expect(v.ppsv23[0].status).toBe('valid');
  });

  // UPDATED 2026-10-17 (IC-1). This assertion used to read "reads as a complete
  // series", and it was asserting a clinical answer that was wrong rather than
  // anything about ANCHOR-1. This child is immunocompromised (asplenia), their
  // conjugate doses were all before age 6, and they have had exactly ONE PPSV23
  // and no PCV20 — the patient p2016's Table 4 footnote || and CDC's IC rows
  // both give a further dose to: "options are (a) give one dose of PCV20 at
  // least 8 weeks after most recent pneumococcal vaccination, or (b) give a
  // second dose of PPSV23 five years after the first dose of PPSV23."
  //
  // So the verdict has moved, deliberately and for a reason recorded in
  // `regression-2026-10-17-ic-child-with-ppsv23-is-not-complete.test.js`. The
  // tripwire this describe block exists to be did exactly its job: it noticed.
  // What it must keep guarding is ANCHOR-1's own subject — that the PPSV23 is
  // measured from the PCV13 that COUNTED — which the test above still asserts
  // and which has not changed.
  it('offers the immunocompromising follow-on rather than calling it complete', () => {
    const v = verdictsFor(CASE_B);
    expect(v.recs.some((r) => r.status === 'complete')).toBe(false);
    // Both of CDC's options are on the card.
    expect(v.recs.some((r) => (r.brands ?? []).some((b) => String(b).includes('PCV20')))).toBe(true);
    expect(v.recs.some((r) => r.vaccine === 'PPSV23')).toBe(true);
  });

  // The matching control — that a SECOND PPSV23 does finish the schedule, so
  // the fix did not simply make every IC child incomplete — cannot live here:
  // this child is 6, and two PPSV23 doses five years apart are impossible
  // before age 7 (PPSV23's minimum age is 2). It is asserted on an older child
  // in `regression-2026-10-17-ic-child-with-ppsv23-is-not-complete.test.js`,
  // and by the real 18y9m sickle-cell patient in
  // `late-and-ambiguous-window.test.js`, who has three PPSV23 doses and is
  // complete.
});

describe('ANCHOR-1 Case G — a PPSV23 behind a rejected PCV already counted', () => {
  // Adult with HIV: PCV13 Jan 2024 counts, PCV20 Jun 2024 is rejected (short
  // of a year after the PCV13), PPSV23 2024-06-15. The PPSV23 was already
  // measured against the COUNTING PCV doses only, so it counts — this is the
  // direction of the handoff that was always right, pinned here so the rework
  // cannot regress it.
  const CASE_G = {
    ageMonths: Y(70),
    riskIds: ['hiv'],
    pcvDoses: [{ product: 'PCV13', date: '2024-01-01' }, { product: 'PCV20', date: '2024-06-01' }],
    ppsv23Doses: [{ product: 'PPSV23', date: '2024-06-15' }],
  };

  it('counts the PPSV23 and keeps rejecting the early PCV20', () => {
    const v = verdictsFor(CASE_G);
    expect(v.pcv[0].status).toBe('valid');
    expect(v.pcv[1].status).toBe('invalid');
    expect(v.pcv[1].intervalRuleId).toBe('ADULT-PCV20-21-AFTER-PCV13');
    expect(v.ppsv23[0].status).toBe('valid');
  });
});

describe('ANCHOR-1 — the property behind the five cases', () => {
  // The cases above are examples. This is the rule they are examples of: a
  // dose that did not count anchors nothing in the OTHER stream. Stated
  // directly so a future reader can see the invariant without reconstructing
  // it from five histories.
  it('a rejected PPSV23 between two valid ones does not shorten the PCV\'s clock', () => {
    // Without the rejected middle dose, the PCV20 of 2018-06-01 plainly
    // counts. Adding a rejected PPSV23 in 2018 must not change that.
    const base = {
      ageMonths: Y(70),
      riskIds: [],
      pcvDoses: [{ product: 'PCV20', date: '2018-06-01' }],
    };
    const without = verdictsFor({ ...base, ppsv23Doses: [{ product: 'PPSV23', date: '2015-01-01' }] });
    const withRejected = verdictsFor({
      ...base,
      ppsv23Doses: [{ product: 'PPSV23', date: '2015-01-01' }, { product: 'PPSV23', date: '2018-01-01' }],
    });
    expect(without.pcv[0].status).toBe('valid');
    expect(withRejected.pcv[0].status).toBe('valid');
    expect(withRejected.pcv[0].effectiveDoseNum).toBe(without.pcv[0].effectiveDoseNum);
  });

  it('but a PPSV23 that COUNTS still anchors the PCV\'s clock', () => {
    // The same shape as above with the middle dose moved out to 2021, where
    // it clears the 5-year minimum and counts. The PCV20 is then measured
    // from 2021, five months later.
    //
    // Until the owner's family-2 ruling of 2026-10-24 this asserted that the
    // PCV20 was INVALID. It now counts — but the thing ANCHOR-1 exists to
    // prove is unchanged and is what is asserted instead: the dose is judged
    // against the 2021 PPSV23 (the one that counted) and not the 2015 one,
    // which is why it draws a note at all. Measured from 2015 it would clear
    // the year and say nothing.
    const v = verdictsFor({
      ageMonths: Y(70),
      riskIds: [],
      pcvDoses: [{ product: 'PCV20', date: '2021-06-01' }],
      ppsv23Doses: [{ product: 'PPSV23', date: '2015-01-01' }, { product: 'PPSV23', date: '2021-01-01' }],
    });
    expect(v.ppsv23[1].status).toBe('valid');
    expect(v.pcv[0].status).toBe('valid');
    expect(v.pcv[0].earlyAdvisory).toBe(true);
    expect(v.pcv[0].intervalRuleId).toBe('ADULT-PCV-AFTER-PPSV23');
    expect(v.pcv[0].reasons.join(' ')).toMatch(/2021-01-01/);
  });
});
