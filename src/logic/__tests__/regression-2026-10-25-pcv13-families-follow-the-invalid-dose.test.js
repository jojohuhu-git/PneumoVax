// ⚠️ SUPERSEDED THE SAME DAY IT LANDED, BY HER OWN ADULT TABLE — and kept,
// because what it was really about SURVIVED and is now easier to state.
//
// ── what it held, and why it is moot ─────────────────────────────────────
//
// OWNER DECISIONS 2026-10-25 (morning) brought the two PCV13 families onto the
// invalid-adult-dose card, so that a patient whose PPSV23 had been set aside
// was shown one date rather than two. Her adult table, later the same day,
// removed every adult floor — so no adult PPSV23 is set aside at all, and
// there is no second date to reconcile. The card can never build.
//
// ── WHAT SURVIVES, which is the whole point of keeping this file ─────────
//
// Decision 2 was never really about a card. She was shown two 60-year-olds
// identical but for one product:
//
//   Patient A   PCV13 2026-07-19, PPSV23 2026-10-11 (3 months)
//   Patient B   PCV15 2026-07-19, PPSV23 2026-10-11 (the same)
//
// A was being treated differently from B for no clinical reason, and her
// ruling was *"yes A is treated the same as B."* THAT STILL HOLDS, and it
// holds more simply now: both doses count, and both patients get the same
// answer. Of the 402 patients in A's family, 200 were being shown two
// different dates; today none is.
//
// Decision 4 extended it to the 8-week class — immunocompromised / cochlear
// implant / CSF leak, where the PPSV23 floor was 8 weeks rather than a year
// (`ADULT-PPSV23-AFTER-PCV13-SHORTER-MINIMUM`, 210 patients). Her question
// back was *"to confirm is the recommendation PCV20/21 may be given at least 1
// year after the last PCV?"* — and that recommendation is untouched by any of
// this. Only the grading of a dose already given moved.
//
// ⚠️ NOTE WHAT IS **NOT** ASSERTED HERE ANY MORE: the citation keys. Those
// tests checked which documents a card carried, and the card is gone. The
// citation guards that remain live are the `regression-c8-*` family, whose
// pinned counts were re-measured in the same commit as this change.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { buildCases } from '../../test-grid.js';

const TODAY = '2026-10-24';
const Y = (y) => y * 12;
const run = (p) => recommend({ today: TODAY, ...p });
const invalidOf = (o) => [...o.perDose.pcv, ...o.perDose.ppsv23].filter((d) => d.status === 'invalid');

// Her worked patients, verbatim from the conversation.
const PATIENT_A = {
  ageMonths: Y(60), riskIds: [],
  pcvDoses: [{ product: 'PCV13', date: '2026-07-19' }],
  ppsv23Doses: [{ product: 'PPSV23', date: '2026-10-11' }],
};
const PATIENT_B = {
  ageMonths: Y(60), riskIds: [],
  pcvDoses: [{ product: 'PCV15', date: '2026-07-19' }],
  ppsv23Doses: [{ product: 'PPSV23', date: '2026-10-11' }],
};
const PATIENT_D4 = {
  ageMonths: Y(40), riskIds: ['asplenia'],
  pcvDoses: [{ product: 'PCV13', date: '2026-08-30' }],
  ppsv23Doses: [{ product: 'PPSV23', date: '2026-10-11' }],
};

describe('decision 2 — A is still treated the same as B', () => {
  it('the two patients are GRADED the same — both PPSV23 doses count', () => {
    const a = run(PATIENT_A);
    const b = run(PATIENT_B);
    expect(a.perDose.ppsv23[0].status).toBe(b.perDose.ppsv23[0].status);
    expect(a.perDose.ppsv23[0].status).toBe('valid');
  });

  // ⚠️ THEY DO NOT GET THE SAME DISPOSITION, AND MUST NOT. A first draft of
  // this rewrite asserted equal completeness and failed, correctly. Her "A is
  // treated the same as B" was about the DATE each was shown on the
  // invalid-dose card — the bug was two dates on one screen — not about what
  // each series owes. PCV15 + PPSV23 completes an adult series; PCV13 + PPSV23
  // does not, and still owes PCV20 or PCV21. That is CDC's own split and it
  // predates all of this, so asserting them equal would quietly delete it.
  it('but B is complete and A still owes a conjugate, which is CDC\'s own split', () => {
    expect(run(PATIENT_B).recs.some((r) => r.status === 'complete')).toBe(true);
    expect(run(PATIENT_A).recs.some((r) => r.status === 'complete')).toBe(false);
    expect(run(PATIENT_A).recs.map((r) => r.doseLabel).join(' ')).toMatch(/PCV20 or PCV21/);
  });

  it('and neither is shown two dates, because neither has a rejected dose', () => {
    expect(invalidOf(run(PATIENT_A))).toHaveLength(0);
    expect(invalidOf(run(PATIENT_B))).toHaveLength(0);
  });
});

describe('decision 4 — the 8-week class lands the same way', () => {
  it('her asplenic 40-year-old\'s PPSV23 counts too', () => {
    const d = run(PATIENT_D4).perDose.ppsv23[0];
    expect(d.status).toBe('valid');
    // The 8 weeks is still the interval she is judged against — it is named,
    // it is just no longer a cut-off. This is the distinction her whole table
    // is built on, so it is asserted rather than assumed.
    expect(d.reasons.join(' ')).toMatch(/8 weeks/);
  });

  it('and the RECOMMENDATION she asked to confirm is untouched', () => {
    // "to confirm is the recommendation PCV20/21 may be given at least 1 year
    // after the last PCV?" — yes, and nothing in the 2026-10-25 relaxation
    // moved it. Only the grading of a dose already given changed.
    const labels = run(PATIENT_D4).recs.map((r) => r.doseLabel).join(' | ');
    expect(labels).toMatch(/PCV20|PCV21|Complete/);
  });
});

describe('no adult PPSV23 is set aside anywhere on the grid', () => {
  // The sweep this file used to run, inverted. It expected the repeat card on
  // five named rules at measured counts (132 + …); it now expects none.
  it('zero adult doses rejected by any PPSV23 interval row', () => {
    const tally = {};
    for (const { input } of buildCases()) {
      if ((input.ageMonths ?? 0) < 228) continue;
      for (const d of recommend(input).perDose.ppsv23 ?? []) {
        if (d.status === 'invalid' && d.intervalRuleId?.startsWith('ADULT-')) {
          tally[d.intervalRuleId] = (tally[d.intervalRuleId] ?? 0) + 1;
        }
      }
    }
    expect(tally).toEqual({});
  });
});
