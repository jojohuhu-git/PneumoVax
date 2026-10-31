// ── §C-P2-HEALTHY (2026-10-31): a healthy child's PPSV23 is not needed, at any age ──
//
// OWNER RULING 2026-10-31, on "Zoe" (3, healthy, four PCV20 doses, a PPSV23
// by mistake at 12 months). Her card read "PCV series complete" while the
// chip under the PPSV23 said "repeat this dose only" — an order for a dose a
// healthy child is not owed. The same mistake at 2½ was marked "valid" with
// no comment. Asked, she chose "Not needed" at any age, in Ava's words.
//
// CDC, PPSV23 Vaccine Information Statement (5/29/25), read live 2026-10-31:
// "PPSV23 is recommended as an option for some children and adolescents with
// certain medical conditions or risk factors." Its routine childhood schedule
// (pneumococcal vaccine-recommendations page, updated Feb 25, 2026) is a
// 4-dose PCV series and nothing else.
//
// Two shapes, deliberately different:
//   • a PPSV23 that would have COUNTED becomes an extra dose — Ava's label —
//     and, like hers, still holds off a conjugate for 8 weeks (Ben's ruling);
//   • a PPSV23 thrown out (too young, too soon) STAYS thrown out, so it still
//     holds off nothing (ANCHOR-1, re-confirmed on Rosa 2026-10-31); only its
//     "repeat this dose" sentence becomes the not-needed one.

import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';

const d = (product, dates) => dates.map((date) => ({ product, date }));
const NOT_NEEDED = 'Not needed: PPSV23 is given only to children with certain medical conditions or risk factors, per CDC, and none is recorded for this child. This dose isn’t harmful, it isn’t counted, and nothing needs to be repeated.';
const ZOE = {
  dob: '2022-11-01', ageMonths: 36, today: '2025-11-01', riskIds: [],
  pcvDoses: d('PCV20', ['2023-01-01', '2023-03-01', '2023-05-01', '2023-11-05']),
};

describe('Zoe — PPSV23 at 12 months, too young', () => {
  const out = recommend({ ...ZOE, ppsv23Doses: d('PPSV23', ['2023-11-05']) });
  const dose = out.perDose.ppsv23[0];

  it('stays thrown out for age, and the chip says it is not needed instead of "repeat"', () => {
    expect(dose.status).toBe('invalid');
    expect(dose.reasons[0]).toMatch(/^Given at ~12 months — below the 2-year minimum age for PPSV23/);
    expect(dose.reasons).toContain(NOT_NEEDED);
    expect(dose.reasons.join(' ')).not.toMatch(/repeat this dose/);
  });

  it('her card is unchanged', () => {
    expect(out.recs.map((r) => r.doseLabel)).toEqual(['PCV series complete']);
  });
});

describe('Zoe — PPSV23 at 2½, old enough', () => {
  const out = recommend({ ...ZOE, ppsv23Doses: d('PPSV23', ['2025-05-01']) });
  const dose = out.perDose.ppsv23[0];

  it('is an extra dose with the not-needed sentence, not a silent "valid"', () => {
    expect(dose.extraDose).toBe(true);
    expect(dose.effectiveDoseNum).toBeNull();
    expect(dose.reasons).toEqual([NOT_NEEDED]);
    expect(out.meta.ppsv23Count).toBe(0);
  });

  it('her card is unchanged', () => {
    expect(out.recs.map((r) => r.doseLabel)).toEqual(['PCV series complete']);
  });
});

describe('limits', () => {
  it('a baby under 2 today gets the same sentence (any age)', () => {
    const baby = recommend({ dob: '2024-01-01', ageMonths: 22, today: '2025-11-01', riskIds: [],
      pcvDoses: d('PCV20', ['2024-03-01', '2024-05-01', '2024-07-01', '2025-01-05']),
      ppsv23Doses: d('PPSV23', ['2025-01-05']) });
    expect(baby.perDose.ppsv23[0].reasons).toContain(NOT_NEEDED);
  });

  it('a healthy 3-year-old still owed a catch-up PCV keeps the 8-week hold after an extra PPSV23 (Ben)', () => {
    const p = { dob: '2022-11-01', ageMonths: 36, today: '2025-11-01', riskIds: [],
      pcvDoses: d('PCV13', ['2023-01-01', '2023-03-01']), ppsv23Doses: d('PPSV23', ['2025-10-20']) };
    const out = recommend(p);
    expect(out.perDose.ppsv23[0].extraDose).toBe(true);
    expect(out.recs[0].dueToday).toBe(false);
    expect(out.recs[0].note.lead).toContain('Held to 8 weeks after this child\'s PPSV23 of Oct 20, 2025');
  });

  it('a child WITH a risk condition is untouched — her PPSV23 counts', () => {
    const out = recommend({ ...ZOE, riskIds: ['cochlear_implant'], ppsv23Doses: d('PPSV23', ['2025-05-01']) });
    expect(out.perDose.ppsv23[0].status).toBe('valid');
    expect(out.perDose.ppsv23[0].extraDose).toBeUndefined();
    expect(out.meta.ppsv23Count).toBe(1);
  });

  it('an adult-only tick (smoking) does not make a child "at risk" — she is still healthy', () => {
    const out = recommend({ ...ZOE, riskIds: ['smoking'], ppsv23Doses: d('PPSV23', ['2025-05-01']) });
    expect(out.perDose.ppsv23[0].reasons).toEqual([NOT_NEEDED]);
  });

  it('an ADULT today with a childhood PPSV23 is untouched — ACIP\'s adult rows count it', () => {
    const out = recommend({ dob: '2000-01-01', ageMonths: 310, today: '2025-11-01', riskIds: [],
      pcvDoses: [], ppsv23Doses: d('PPSV23', ['2005-01-01']) });
    expect(JSON.stringify(out.perDose.ppsv23)).not.toContain('Not needed: PPSV23 is given only to children');
  });

  it('a record problem (dated in the future) keeps its own wording', () => {
    const out = recommend({ ...ZOE, ppsv23Doses: d('PPSV23', ['2026-05-01']) });
    expect(out.perDose.ppsv23[0].reasons).not.toContain(NOT_NEEDED);
  });
});

describe('a PPSV23 typed twice on one day is still one dose typed twice', () => {
  // Found by the impossible-entry grid: the duplicate check compared a row
  // only with doses that COUNTED, so once a healthy child's PPSV23 became an
  // extra dose its twin was graded as a second dose instead (12 rows). An
  // extra dose was really given; a row on its date is a typing duplicate.
  it('the second row is a duplicate, not a mistimed repeat', () => {
    const out = recommend({ ...ZOE, ppsv23Doses: d('PPSV23', ['2025-05-01', '2025-05-01']) });
    expect(out.perDose.ppsv23[0].extraDose).toBe(true);
    expect(out.perDose.ppsv23[1].recordProblem).toBe('duplicate');
    expect(out.perDose.ppsv23[1].reasons).not.toContain(NOT_NEEDED);
  });
});
