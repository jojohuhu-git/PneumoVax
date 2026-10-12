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

describe('ANCHOR-1 Case H — the control: a real gap is still a real gap', () => {
  // The reason the owner declined the cheaper fix. Nothing in this history was
  // rejected: a PPSV23 that counts, then a PCV20 two months later. The 1-year
  // floor is measured from a dose that COUNTED, so it still bites. If this
  // case ever goes green, the fix has stopped being narrow and has become a
  // loosening of the floor itself.
  const CASE_H = {
    ageMonths: Y(70),
    riskIds: [],
    pcvDoses: [{ product: 'PCV20', date: '2018-03-01' }],
    ppsv23Doses: [{ product: 'PPSV23', date: '2018-01-01' }],
  };

  it('still rejects the PCV20 given 2 months after a PPSV23 that counted', () => {
    const v = verdictsFor(CASE_H);
    expect(v.ppsv23[0].status).toBe('valid');
    expect(v.pcv[0].status).toBe('invalid');
    expect(v.pcv[0].intervalRuleId).toBe('ADULT-PCV-AFTER-PPSV23');
  });

  it('still shows the PCV as due, since the recorded one did not count', () => {
    const v = verdictsFor(CASE_H);
    expect(v.recText).toMatch(/≥1 year after PPSV23/);
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

  it('reads as a complete series', () => {
    const v = verdictsFor(CASE_B);
    expect(v.recs.some((r) => r.status === 'complete')).toBe(true);
  });
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
    // from 2021 and is genuinely too early.
    const v = verdictsFor({
      ageMonths: Y(70),
      riskIds: [],
      pcvDoses: [{ product: 'PCV20', date: '2021-06-01' }],
      ppsv23Doses: [{ product: 'PPSV23', date: '2015-01-01' }, { product: 'PPSV23', date: '2021-01-01' }],
    });
    expect(v.ppsv23[1].status).toBe('valid');
    expect(v.pcv[0].status).toBe('invalid');
  });
});
